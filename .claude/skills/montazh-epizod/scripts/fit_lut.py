"""Снять цветокор с готового ролика: LUT (.cube), который переводит исходник (после тонмаппинга HDR→SDR,
как в render.py) в цвет готового ролика.

python fit_lut.py --ref "готовый.mp4" --raw "исходник.MOV" --pairs 17.0:92.645,12.0:48.529,... --out ../luts/epizod17.cube

pairs — время в готовом ролике : время того же кадра в исходнике (найти можно по звуку: --find).
python fit_lut.py --ref "готовый.mp4" --raw "исходник.MOV" --find   # печатает смещения кусков ролика в исходнике

Кадры совмещаются сами (ролик может быть кадрирован и увеличен): точки ORB + RANSAC, затем ECC.
Субтитры, плашка и нижняя панель (запись экрана) в замер не попадают — берётся только то, что совпало с исходником.
"""
import argparse, os, subprocess, sys
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

TO_RGB = "scale=in_color_matrix=bt709:in_range=tv,format=rgb24"


def probe(p):
    import json
    s = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height,color_transfer", "-of", "json", p],
                                  capture_output=True, text=True).stdout)["streams"][0]
    return s["width"], s["height"], s.get("color_transfer", "")


def frame(p, t, chain=""):
    w, h, _ = probe(p)
    vf = (chain + "," if chain else "") + TO_RGB
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", p, "-frames:v", "1", "-vf", vf,
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw[:w * h * 3], np.uint8).reshape(h, w, 3)


def raw_chain(p):
    from render import HDR_TM
    tr = probe(p)[2]
    tin = {"arib-std-b67": "arib-std-b67", "smpte2084": "smpte2084"}.get(tr)
    return HDR_TM.format(tin=tin) if tin else ""


def find_offsets(ref, raw):
    """Где в исходнике каждый кусок ролика: корреляция звука окнами по 0,5 с."""
    def load(p):
        b = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
                           capture_output=True).stdout
        return np.frombuffer(b, np.int16).astype(np.float32) / 32768
    ep, rw, sr = load(ref), load(raw), 8000
    N = 1 << int(np.ceil(np.log2(len(rw) + sr)))
    RW = np.fft.rfft(rw, N)
    e2 = np.concatenate([[0], np.cumsum(rw ** 2)])
    prev = None
    for t in np.arange(0, len(ep) / sr - 0.5, 0.25):
        seg = ep[int(t * sr):int((t + 0.5) * sr)]
        if np.sqrt((seg ** 2).mean()) < 0.003: continue
        seg = seg - seg.mean()
        c = np.fft.irfft(RW * np.conj(np.fft.rfft(seg, N)), N)[:len(rw) - len(seg)]
        en = np.sqrt(e2[len(seg):len(seg) + len(c)] - e2[:len(c)] + 1e-9)
        cn = c / (en * np.linalg.norm(seg) + 1e-9)
        k = int(np.argmax(cn))
        off = round(k / sr - t, 3)
        if cn[k] > 0.7 and (prev is None or abs(off - prev) > 0.02):
            print(f"с {t:6.2f} c ролика: исходник = время + {off:.3f} (r={cn[k]:.2f})")
            prev = off


def align(ref_img, raw_img, mask_ref):
    """-> исходник, перенесённый в геометрию кадра ролика (или None), и маска совпавших пикселей."""
    import cv2
    g1 = cv2.cvtColor(ref_img, cv2.COLOR_RGB2GRAY)
    g2 = cv2.cvtColor(raw_img, cv2.COLOR_RGB2GRAY)
    g1e, g2e = cv2.equalizeHist(g1), cv2.equalizeHist(g2)
    orb = cv2.ORB_create(4000)
    k1, d1 = orb.detectAndCompute(g1e, mask_ref)
    k2, d2 = orb.detectAndCompute(g2e, None)
    if d1 is None or d2 is None: return None, None
    m = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d1, d2)
    if len(m) < 20: return None, None
    p1 = np.float32([k1[x.queryIdx].pt for x in m]); p2 = np.float32([k2[x.trainIdx].pt for x in m])
    A, inl = cv2.estimateAffinePartial2D(p2, p1, method=cv2.RANSAC, ransacReprojThreshold=3)
    if A is None or inl.sum() < 15: return None, None
    A = A.astype(np.float32)
    try:  # уточнение по яркостному рисунку
        _, A = cv2.findTransformECC(cv2.GaussianBlur(g1e, (5, 5), 0), cv2.GaussianBlur(g2e, (5, 5), 0), A,
                                    cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 60, 1e-5),
                                    mask_ref, 5)
    except cv2.error:
        pass
    h, w = g1.shape
    warped = cv2.warpAffine(raw_img, A, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    valid = cv2.warpAffine(np.full(g2.shape, 255, np.uint8), A, (w, h), flags=cv2.INTER_NEAREST)
    valid = cv2.erode(valid, np.ones((9, 9), np.uint8))
    # совпадение проверяем по структуре: где картинки расходятся (движение, наложения) — не берём
    region = (valid > 0) & (mask_ref > 0)
    if region.sum() < 1000: return None, None
    a = cv2.GaussianBlur(cv2.cvtColor(warped, cv2.COLOR_RGB2GRAY), (9, 9), 0).astype(np.float32)
    b = cv2.GaussianBlur(g1, (9, 9), 0).astype(np.float32)
    a = (a - a[region].mean()) / (a[region].std() + 1e-6)  # яркость и контраст у ролика другие — сравниваем рисунок
    b = (b - b[region].mean()) / (b[region].std() + 1e-6)
    good = (np.abs(a - b) < 0.45) & region
    return warped, good


def fit_lut(X, Y, n=33):
    """Сглаженный 3D LUT по парам цветов: локальная линейная регрессия в ячейках + глобальный полином 2-й
    степени там, где данных мало (цвета, которых нет в кадре, меняются плавно и без выбросов)."""
    def feats(v):
        r, g, b = v[:, 0], v[:, 1], v[:, 2]
        return np.stack([np.ones_like(r), r, g, b, r * r, g * g, b * b, r * g, r * b, g * b], 1)
    P = np.linalg.lstsq(feats(X), Y, rcond=None)[0]
    nb = 24
    idx = np.clip((X * nb).astype(int), 0, nb - 1)
    key = idx[:, 0] * nb * nb + idx[:, 1] * nb + idx[:, 2]
    cnt = np.bincount(key, minlength=nb ** 3)
    occ = np.nonzero(cnt >= 30)[0]
    Xm = np.stack([np.bincount(key, X[:, c], nb ** 3)[occ] / cnt[occ] for c in range(3)], 1)
    Ym = np.stack([np.bincount(key, Y[:, c], nb ** 3)[occ] / cnt[occ] for c in range(3)], 1)
    Wc = np.sqrt(cnt[occ].astype(np.float64))
    g = np.linspace(0, 1, n)
    B, G, R = np.meshgrid(g, g, g, indexing="ij")  # .cube: красный меняется быстрее всех
    nodes = np.stack([R.ravel(), G.ravel(), B.ravel()], 1)
    out = feats(nodes) @ P
    sig, w0 = 0.07, 4.0
    Fm = np.concatenate([np.ones((len(Xm), 1)), Xm], 1)
    for s in range(0, len(nodes), 2048):
        nd = nodes[s:s + 2048]
        d2 = ((nd[:, None, :] - Xm[None]) ** 2).sum(-1)
        K = np.exp(-d2 / (2 * sig * sig)) * Wc[None]
        ks = K.sum(1)
        loc = np.empty((len(nd), 3))
        for i in range(len(nd)):
            kk = K[i]
            if ks[i] < 1e-3:
                loc[i] = out[s + i]; continue
            A = (Fm * kk[:, None]).T @ Fm + np.eye(4) * 1e-3
            bb = (Fm * kk[:, None]).T @ Ym
            loc[i] = np.concatenate([[1], nd[i]]) @ np.linalg.solve(A, bb)
        a = ks / (ks + w0)
        out[s:s + 2048] = loc * a[:, None] + out[s:s + 2048] * (1 - a[:, None])
    return np.clip(out, 0, 1), P


def apply_lut(L, X):
    """Трилинейная интерполяция LUT [b][g][r] для цветов X (доли 0–1)."""
    n = L.shape[0]
    v = np.clip(X, 0, 1) * (n - 1)
    i0 = np.minimum(v.astype(int), n - 2)
    f = v - i0
    out = 0
    for dr in (0, 1):
        for dg in (0, 1):
            for db in (0, 1):
                w = ((f[:, 0] if dr else 1 - f[:, 0]) * (f[:, 1] if dg else 1 - f[:, 1]) * (f[:, 2] if db else 1 - f[:, 2]))
                out = out + w[:, None] * L[i0[:, 2] + db, i0[:, 1] + dg, i0[:, 0] + dr]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True); ap.add_argument("--raw", required=True)
    ap.add_argument("--pairs"); ap.add_argument("--out")
    ap.add_argument("--find", action="store_true")
    ap.add_argument("--mask", default="", help="прямоугольники кадра ролика без замера: x0,y0,x1,y1;... в долях")
    ap.add_argument("--panel", default="", help="ролик:низ панели лица в долях, напр. 0.5:0.5,3.7:0.63")
    ap.add_argument("--check", help="папка для картинок сравнения")
    a = ap.parse_args()
    if a.find:
        find_offsets(a.ref, a.raw); return
    chain = raw_chain(a.raw)
    W, H, _ = probe(a.ref)
    rects = [[float(v) for v in r.split(",")] for r in a.mask.split(";") if r]
    panel = {float(k): float(v) for k, v in (x.split(":") for x in a.panel.split(",") if x)}
    Xs, Ys = [], []
    pairs = [tuple(float(v) for v in p.split(":")) for p in a.pairs.split(",")]
    for te, tr in pairs:
        ref, raw = frame(a.ref, te), frame(a.raw, tr, chain)
        m = np.full((H, W), 255, np.uint8)
        for x0, y0, x1, y1 in rects: m[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = 0
        pb = min(panel.items(), key=lambda kv: abs(kv[0] - te))[1] if panel else 1.0
        m[int(pb * H) - 4:, :] = 0
        warped, good = align(ref, raw, m)
        if warped is None:
            print(f"{te:6.2f}: не совместилось, пропуск"); continue
        sel = good & (ref.max(2) < 252) & (warped.max(2) < 252) & (warped.min(2) > 3)
        print(f"{te:6.2f} ↔ {tr:7.3f}: совпало {sel.mean() * 100:4.1f}% кадра")
        X, Y = warped[sel].astype(np.float64) / 255, ref[sel].astype(np.float64) / 255
        k = np.random.default_rng(int(te * 100)).choice(len(X), min(len(X), 40000), replace=False)
        Xs.append(X[k]); Ys.append(Y[k])
        if a.check:
            os.makedirs(a.check, exist_ok=True)
            from PIL import Image
            Image.fromarray(np.concatenate([warped, ref], 1)).resize((W, H // 2)).save(
                os.path.join(a.check, f"pair_{te:05.2f}.jpg"), quality=85)
    X, Y = np.concatenate(Xs), np.concatenate(Ys)
    print(f"Пар цветов: {len(X)}")
    lut, P = fit_lut(X, Y)
    n = round(len(lut) ** (1 / 3))
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(f'TITLE "{os.path.splitext(os.path.basename(a.out))[0]}"\nLUT_3D_SIZE {n}\n')
        f.writelines(f"{r:.6f} {g:.6f} {b:.6f}\n" for r, g, b in lut)
    # проверка: насколько LUT приближает исходник к ролику
    pred = apply_lut(lut.reshape(n, n, n, 3), X)
    e0, e1 = np.abs(X - Y).mean(0) * 255, np.abs(pred - Y).mean(0) * 255
    print(f"Средняя ошибка R/G/B, уровни 0–255: без LUT {np.round(e0, 1)} → с LUT {np.round(e1, 1)}")
    print("LUT:", a.out)


if __name__ == "__main__":
    main()
