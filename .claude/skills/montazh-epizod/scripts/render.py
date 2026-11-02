"""Монтаж в стиле «Эпизод» (вертикальный ролик 1080×1920, 60 к/с): лицо сверху, запись экрана или мем снизу,
пословные субтитры по центру кадра, плашка «зажми, чтобы ускорить 👉», цветокор по образцу.

python render.py plan.json                      # полный рендер
python render.py plan.json --preview            # половинное разрешение и 30 к/с, черновик
python render.py plan.json --start 10 --end 20  # кусок (секунды ИТОГОВОГО ролика)
python render.py plan.json --still 3.2,7.5      # PNG-кадры + сетка stills.jpg, без видео
python render.py plan.json --cut-only           # только склейка _work_ep/cut.mkv — для проверки речи
python render.py plan.json --audio-only --out "...vN+1.mp4"   # пересобрать только звук

Время в плане ("at", "until") — секунды ИСХОДНИКА (как в words.json); "at_out" — секунды итога.
Нарезка дублей, вырезание повторов и звук — из core.py (общее ядро со скиллами «Слайды» и «Мани»).
"""
import argparse, json, math, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import core as C
from core import (font, clamp, ease_out_cubic, ease_in_out, lerp, comp, with_alpha, Timeline, ev_time,
                  envelope, take_words, snap_bound, auto_keep, audio_mix, emoji_img)

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C.FONT_DIRS.insert(0, os.path.join(SKILL, "fonts"))  # TikTok Sans лежит в скилле (OFL) — рендер не зависит от установки
C.FONT_FILES.update({
    "sub": ["SFPRODISPLAYBOLD.OTF", "Montserrat-Bold.ttf", "arialbd.ttf"],                    # субтитры
    "pl_black": ["TikTokSans-Variable.ttf", "SFPRODISPLAYBOLD.OTF", "Inter-SemiBold.ttf", "seguisb.ttf"],
    "pl_white": ["TikTokSans-Variable.ttf", "SFPRODISPLAYMEDIUM.OTF", "Inter-Medium.ttf", "segoeui.ttf"],
})

# ---------------------------------------------------------------- дизайн-система образца (замеры «Эпизода 17»)
# face_w — ширина лица (рамка детектора) в долях ширины кадра; face_cy — центр лица в долях высоты панели
KINDS = {
    "split": {"seam": 0.63, "face_w": 0.48, "face_cy": 0.455},   # лицо сверху, экран/мем снизу
    "face": {"face_w": 0.615, "face_cy": 0.386},                 # лицо крупно на весь кадр
    "outro": {"face_w": None, "face_cy": None, "subs": False},   # общий план как снят, без субтитров
    "full": {},                                                  # медиа на весь кадр (в образце нет — только по нужде)
}
SUB = {"size": 61, "track": -0.02, "base_y": 0.511, "shadow": (3, 4), "shadow_blur": 2.2, "shadow_a": 0.8, "gap": 16}
# плашка: центр блока текста (доли кадра), ширина первой строки w1 и шаг строк lh в px при ширине 1080 — замер образца.
# Шрифт — TikTok Sans (вариативный: wght, wdth, opsz); кегль подбирается так, чтобы первая строка была ровно w1.
# Если TikTok Sans нет — SF Pro, сжатый по горизонтали до той же ширины. Оси подобраны сравнением с кадрами образца.
PLASHKA = {"text": "зажми, чтобы\nускорить 👉🏻",
           "black": {"font": "pl_black", "size": 24, "color": (8, 8, 10), "lh": 23, "w1": 127, "pos": [0.869, 0.2763],
                     "wght": 700, "wdth": 80, "opsz": 18, "emoji": 1.0},
           "white": {"font": "pl_white", "size": 28, "color": (255, 255, 255), "lh": 28, "w1": 143, "pos": [0.884, 0.2768],
                     "wght": 400, "wdth": 80, "opsz": 24, "emoji": 1.0}}
TR = {"zoom": 0.30, "fade": 0.13, "slide": 0.20}
VIDEO_EXT = (".mp4", ".mov", ".webm", ".mkv", ".m4v", ".gif")


# ---------------------------------------------------------------- текст
_tcache = {}


def tracked(dr, xy, text, fnt, fill, track):
    """Текст с трекингом (PIL его не умеет): кернинг сохраняется через длину префикса."""
    x, y = xy
    for i, ch in enumerate(text):
        dr.text((x + fnt.getlength(text[:i]) + track * i, y), ch, font=fnt, fill=fill, anchor="ls")
    return fnt.getlength(text) + track * max(0, len(text) - 1)


def sub_img(text, u):
    """Слово субтитров: белый жирный гротеск с плотной тенью вправо-вниз. -> (RGBA, x-отступ, y базовой линии, ширина)."""
    key = ("sub", text, round(u, 3))
    if key in _tcache: return _tcache[key]
    size = SUB["size"] * u
    f = font("sub", size)
    tr = SUB["track"] * size
    asc, desc = f.getmetrics()
    adv = f.getlength(text) + tr * max(0, len(text) - 1)
    pad = int(size * 0.4)
    w, h = int(adv + 2 * pad), int(asc + desc + 2 * pad)
    m = Image.new("L", (w, h), 0)
    tracked(ImageDraw.Draw(m), (pad, pad + asc), text, f, 255, tr)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dx, dy = SUB["shadow"]
    sh = Image.new("L", (w, h), 0)
    sh.paste(m, (int(round(dx * u)), int(round(dy * u))))
    sh = sh.filter(ImageFilter.GaussianBlur(max(0.5, SUB["shadow_blur"] * u))).point(lambda v: int(v * SUB["shadow_a"]))
    img.putalpha(sh)
    white = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    white.putalpha(m)
    img.alpha_composite(white)
    _tcache[key] = (img, pad, pad + asc, adv)
    return _tcache[key]


def skin_tone(img, tone=(244, 186, 140)):
    """Жёлтая рука Segoe UI Emoji -> светлая кожа, как у эмодзи в образце (PIL не собирает модификатор 🏻)."""
    a = np.asarray(img.convert("RGBA")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    yellow = (r > 150) & (g > 100) & (b < 0.6 * g) & (r - b > 90)
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    k = (lum / 205.0)[..., None]  # 205 — яркость основного жёлтого Segoe
    a[..., :3] = np.where(yellow[..., None], np.clip(np.array(tone, np.float32) * k, 0, 255), a[..., :3])
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def pl_font(st, size):
    """Шрифт плашки; у вариативного TikTok Sans выставляются оси. -> (шрифт, вариативный ли)."""
    f = font(st["font"], size)
    try:
        axes = f.get_variation_axes()
    except Exception:
        return f, False
    val = {b"Optical size": st.get("opsz", 24), b"Width": st.get("wdth", 100), b"Weight": st.get("wght", 600),
           b"Slant": 0}
    f.set_variation_by_axes([val.get(a["name"], a["default"]) for a in axes])
    return f, True


def plashka_img(cfg, style, u):
    """Плашка «зажми, чтобы ускорить 👉🏻»: строки по центру, эмодзи в конце последней строки.
    -> (RGBA, центр блока текста внутри картинки)."""
    key = ("pl", cfg.get("text"), style, round(u, 3))
    if key in _tcache: return _tcache[key]
    st = dict(PLASHKA[style], **cfg.get(style, {}))
    size, lh = st["size"] * u, st["lh"] * u
    lines = cfg.get("text", PLASHKA["text"]).split("\n")
    first = "".join(ch for ch in lines[0] if not C.is_emoji(ch)).rstrip()
    f, variable = pl_font(st, 100)
    if variable and st.get("w1"):  # TikTok Sans: кегль под ширину первой строки; sx ниже лишь добирает округление кегля
        size = st["w1"] * u * 100 / max(1.0, f.getlength(first))
    f, _ = pl_font(st, size)
    parts = []
    for ln in lines:
        em = [ch for ch in ln if C.is_emoji(ch) or ch in "️‍"]
        txt = "".join(ch for ch in ln if ch not in em).rstrip()
        e = emoji_img("".join(em).replace("️", ""), size * st.get("emoji", 0.9)) if em else None
        if e is not None and st.get("skin", True): e = skin_tone(e)
        parts.append((txt, e))
    sx = clamp(st["w1"] * u / max(1.0, f.getlength(parts[0][0])), 0.6, 1.2) if st.get("w1") else 1.0
    widths = [f.getlength(t) * sx + ((e.width + size * 0.12) if e else 0) for t, e in parts]
    W_, H_ = int(max(widths) + 20 * u), int(lh * len(lines) + size * 0.6 + 12 * u)
    img = Image.new("RGBA", (W_, H_), (0, 0, 0, 0))
    asc = f.getmetrics()[0]
    for i, ((t, e), w) in enumerate(zip(parts, widths)):
        x = (W_ - w) / 2
        base = 6 * u + asc + i * lh
        tw = int(f.getlength(t) + 4 * u)
        line = Image.new("RGBA", (tw, H_), (0, 0, 0, 0))
        ImageDraw.Draw(line).text((0, base), t, font=f, fill=st["color"] + (255,), anchor="ls")
        line = line.resize((max(1, int(tw * sx)), H_), Image.LANCZOS)  # сжатие по горизонтали под шрифт образца
        img.alpha_composite(line, (int(x), 0))
        if e is not None:
            comp(img, e, x + f.getlength(t) * sx + size * 0.12, base - size * 0.72)
    bb = img.getbbox() or (0, 0, W_, H_)
    _tcache[key] = (img, ((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), st["pos"])
    return _tcache[key]


# ---------------------------------------------------------------- лицо
def track_faces(src, keep, cache):
    """Медианное лицо в каждом куске: [cx, cy, w] в долях кадра исходника (голова не прыгает на склейках)."""
    sig = json.dumps(keep)
    if os.path.exists(cache):
        c = json.load(open(cache, encoding="utf-8"))
        if c.get("sig") == sig: return c["faces"]
    import cv2
    det = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    cap = cv2.VideoCapture(src)
    faces = []
    for s, e in keep:
        pts = []
        for t in np.linspace(s + 0.05, e - 0.05, max(3, int((e - s) / 0.25))):
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ok, fr = cap.read()
            if not ok: continue
            g = cv2.cvtColor(cv2.resize(fr, None, fx=0.5, fy=0.5), cv2.COLOR_BGR2GRAY)
            h, w = g.shape
            r = det.detectMultiScale(g, 1.1, 6, minSize=(w // 6, w // 6))
            if len(r):
                x, y, fw, fh = max(r, key=lambda b: b[2] * b[3])
                pts.append(((x + fw / 2) / w, (y + fh / 2) / h, fw / w))
        faces.append([float(np.median([p[k] for p in pts])) for k in range(3)] if pts else None)
    cap.release()
    ok = [f for f in faces if f]
    fill = [float(np.median([f[k] for f in ok])) for k in range(3)] if ok else [0.5, 0.42, 0.5]
    faces = [f if f and abs(f[1] - fill[1]) < 0.12 else fill for f in faces]
    json.dump({"sig": sig, "faces": faces}, open(cache, "w", encoding="utf-8"), indent=1)
    return faces


def place(frame, w, h, face, face_w, face_cy, face_cx=0.5):
    """Кадрирование исходника в окно w×h: лицо шириной face_w (доля w) с центром в (face_cx, face_cy) окна.
    Если исходника не хватает — масштаб растёт до заполнения (чёрных полей не бывает)."""
    SW, SH = frame.size
    cover = max(w / SW, h / SH)
    if face is None or face_w is None:
        s = cover
        fx, fy = (face[0], face[1]) if face else (0.5, 0.45)
        cx, cy = fx * SW, fy * SH
        tx, ty = 0.5, 0.5 if face is None else clamp(fy, 0.3, 0.6)
    else:
        s = max(cover, face_w * w / (face[2] * SW))
        cx, cy, tx, ty = face[0] * SW, face[1] * SH, face_cx, face_cy
    cw, ch = w / s, h / s
    x0 = clamp(cx - tx * cw, 0, SW - cw)
    y0 = clamp(cy - ty * ch, 0, SH - ch)
    return frame.resize((int(w), int(h)), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))


# ---------------------------------------------------------------- медиа снизу
class Media:
    """Запись экрана, мем или скрин в нижней панели. Видео читается потоком по кадрам итога (память не копится).
    start/speed — для видео; zoom ([от, до]), focus ([x, y] — центр), y ([от, до] — прокрутка длинного скрина);
    enter — вход клипа: cut | zoom (отъезд из крупного с размытием, как в образце) | fade | slide."""

    def __init__(self, d, ctx, t0, t1):
        self.d, self.t0, self.t1 = d, t0, t1
        a = ctx["assets"]
        self.src = d["src"] if os.path.isabs(d["src"]) else os.path.join(a, d["src"])
        if not os.path.exists(self.src):
            alt = os.path.join(ctx["base_dir"], d["src"])
            if os.path.exists(alt): self.src = alt
        if not os.path.exists(self.src): sys.exit(f"Нет файла медиа: {self.src}")
        self.video = self.src.lower().endswith(VIDEO_EXT)
        self.fps = ctx["fps"]
        self.enter = d.get("enter", "cut")
        self._img, self._proc, self._idx, self._last = None, None, -1, None
        if self.video:
            pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                            "stream=width,height", "-of", "json", self.src],
                                           capture_output=True, text=True).stdout)["streams"][0]
            k = min(1.0, 1600 / pr["width"])
            self.size = (int(pr["width"] * k) // 2 * 2, int(pr["height"] * k) // 2 * 2)

    def _open(self, idx):
        if self._proc: self._proc.kill()
        sp = self.d.get("speed", 1.0)
        ss = self.d.get("start", 0) + idx / self.fps * sp
        w, h = self.size
        self._proc = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-ss", f"{ss:.3f}", "-i", self.src, "-vf",
                                       f"setpts=PTS/{sp},fps={self.fps},scale={w}:{h}", "-f", "rawvideo",
                                       "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        self._idx = idx - 1

    def frame(self, t):
        if not self.video:
            if self._img is None: self._img = Image.open(self.src).convert("RGB")
            return self._img
        idx = max(0, int(round((t - self.t0) * self.fps)))
        if self._proc is None or idx <= self._idx - 1 or idx > self._idx + self.fps * 2:
            self._open(idx)
        w, h = self.size
        while self._idx < idx:
            raw = self._proc.stdout.read(w * h * 3)
            if len(raw) < w * h * 3: break  # клип кончился — держим последний кадр
            self._last = Image.frombytes("RGB", (w, h), raw); self._idx += 1
        return self._last if self._last is not None else Image.new("RGB", (w, h), (0, 0, 0))

    def view(self, w, h, t, extra_zoom=1.0):
        """Кадр медиа, заполняющий окно w×h (обрезка по центру/фокусу, наезд, прокрутка)."""
        img = self.frame(t)
        life = max(0.1, self.t1 - self.t0)
        k = ease_in_out(clamp((t - self.t0) / life)) * 0.4 + clamp((t - self.t0) / life) * 0.6
        z = self.d.get("zoom", 1.0)
        z = (lerp(z[0], z[1], k) if isinstance(z, list) else z) * extra_zoom
        fit = self.d.get("fit", "cover")
        IW, IH = img.size
        s = (max(w / IW, h / IH) if fit == "cover" else w / IW) * z
        cw, ch = w / s, h / s
        fo = self.d.get("focus", [0.5, 0.5])
        y = self.d.get("y")
        cx = clamp(fo[0] * IW, cw / 2, IW - cw / 2) if cw < IW else IW / 2
        if y is not None:
            yy = lerp(y[0], y[1], k) if isinstance(y, list) else y
            y0 = yy * IH
        else:
            y0 = fo[1] * IH - ch / 2
        y0 = clamp(y0, 0, max(0, IH - ch)) if ch < IH else (IH - ch) / 2
        out = Image.new("RGB", (int(w), int(h)), tuple(self.d.get("bg", (0, 0, 0))))
        box = (cx - cw / 2, y0, cx + cw / 2, y0 + ch)
        if ch > IH:  # fit=width и картинка ниже окна: прижата к верху, снизу фон
            part = img.resize((int(w), max(1, int(IH * s))), Image.BILINEAR, box=(box[0], 0, box[2], IH))
            out.paste(part, (0, 0))
            return out
        return img.resize((int(w), int(h)), Image.BILINEAR, box=box)


def zoom_blur(img, amount, focus):
    """Размытие наезда/отъезда: среднее нескольких копий с разным масштабом вокруг фокуса."""
    if amount < 0.004: return img
    w, h = img.size
    acc = np.asarray(img, np.float32).copy()
    n = 6
    fx, fy = focus[0] * w, focus[1] * h
    for i in range(1, n):
        s = 1 + amount * i / (n - 1)
        cw, ch = w / s, h / s
        acc += np.asarray(img.resize((w, h), Image.BILINEAR,
                                     box=(fx - fx / s, fy - fy / s, fx - fx / s + cw, fy - fy / s + ch)), np.float32)
    return Image.fromarray(np.clip(acc / n, 0, 255).astype(np.uint8))


def vblur(img, r):
    """Вертикальное размытие движения (для slide)."""
    r = int(r)
    if r < 2: return img
    a = np.asarray(img).astype(np.float32)
    c = np.cumsum(np.pad(a, ((r + 1, r), (0, 0), (0, 0)), mode="edge"), axis=0)
    return Image.fromarray(np.clip((c[2 * r + 1:] - c[:-2 * r - 1]) / (2 * r + 1), 0, 255).astype(np.uint8))


# ---------------------------------------------------------------- субтитры
PUNCT = ".,!?;:…—–-()«»\""


def norm(w):
    return re.sub(r"[^\w]", "", w.lower().replace("ё", "е"))


# служебные слова прилипают к следующему: «я тебе», «что ты», «для себя», «в нём», «к себе», «про и»
GLUE_WORDS = set("я ты мы вы он она оно они в во на с со к ко у о об обо от до по за из для про при без над под "
                 "и а но не ни что как".split())


def build_subs(words, cfg, total):
    """Слова итога -> куски по одному слову; служебное слово (GLUE_WORDS) склеивается со следующим, если вместе
    не длиннее max_chars и между ними нет знака препинания — как в образце. Появляется в начале слова, держится
    до следующего. Регистр — как сказано (начало фразы с заглавной), знаки препинания не показываются."""
    maxc, gapmax = cfg.get("max_chars", 12), cfg.get("gap", 0.3)
    glue = GLUE_WORDS | set(cfg.get("glue", []))
    fix = {float(k): v for k, v in cfg.get("fix", {}).items()}
    rep = {norm(k): v for k, v in cfg.get("replace", {}).items()}
    hide = cfg.get("off", [])
    fix_at = {}
    for k, v in fix.items():
        j = min(range(len(words)), key=lambda i: abs(words[i]["s"] - k)) if words else None
        if j is not None and abs(words[j]["s"] - k) < 0.13: fix_at[j] = v
    out = []
    for wi, w in enumerate(words):
        raw = w["w"].strip()
        txt = fix_at.get(wi)
        if txt is None:
            txt = rep.get(norm(raw), raw.strip(PUNCT).strip())
        if not txt: continue
        out.append({"text": txt, "t0": w["t0"], "t1": w["t1"], "brk": raw[-1:] in ".,!?;:…—"})
    out = [w for w in out if not any(s <= w["t0"] < e for s, e in hide)]
    chunks, i = [], 0
    while i < len(out):
        ch = [out[i]]
        if i + 1 < len(out):
            a, b = out[i], out[i + 1]
            if (not a["brk"] and b["t0"] - a["t1"] < gapmax and len(a["text"]) + 1 + len(b["text"]) <= maxc
                    and norm(a["text"]) in glue):
                ch.append(b)
        chunks.append(ch)
        i += len(ch)
    res = []
    for k, ch in enumerate(chunks):
        end = ch[-1]["t1"] + cfg.get("hold", 0.6)
        if k + 1 < len(chunks): end = min(end, chunks[k + 1][0]["t0"])
        for s, e in hide:  # слово, начатое до концовки без субтитров, гаснет на её первом кадре
            if ch[0]["t0"] < s < end: end = s
        res.append({"text": " ".join(w["text"] for w in ch), "t0": ch[0]["t0"] - 0.02, "t1": min(end, total)})
    return res


def draw_sub(canvas, text, W, H, u):
    words = text.split(" ")
    imgs = [sub_img(w, u) for w in words]
    sp = SUB["gap"] * u
    tw = sum(i[3] for i in imgs) + sp * (len(imgs) - 1)
    if tw > 0.92 * W:  # слишком длинное — уменьшаем, чтобы влезло
        k = 0.92 * W / tw
        imgs = [(i[0].resize((max(1, int(i[0].width * k)), max(1, int(i[0].height * k))), Image.LANCZOS),
                 i[1] * k, i[2] * k, i[3] * k) for i in imgs]
        sp *= k; tw *= k
    x = W / 2 - tw / 2
    base = SUB["base_y"] * H
    for img, px, py, adv in imgs:
        comp(canvas, img, x - px, base - py)
        x += adv + sp


# ---------------------------------------------------------------- цветокоррекция
# HDR с iPhone (HLG/PQ, BT.2020) без перевода в SDR выходит серым — сначала тонмаппинг hable, затем LUT,
# снятый с пар кадров «исходник → образец» (luts/epizod17.cube), и лёгкая резкость, как в образце.
HDR_TM = ("zscale=tin={tin}:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,"
          "tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")
LUT = os.path.join(SKILL, "luts", "epizod17.cube")
SHARP = "unsharp=5:5:0.55:5:5:0"
LOOK_FALLBACK = "eq=gamma=1.10:contrast=1.08:saturation=1.12"
TO_RGB = "scale=in_color_matrix=bt709:in_range=tv,format=rgb24"  # исходник без меток считаем HD (BT.709)
# промежуточная склейка — yuv444 BT.709 с явными матрицами в обе стороны (libx264rgb путает каналы при чтении)
TO_YUV = "scale=out_color_matrix=bt709:out_range=tv,format=yuv444p"
CUT_TO_RGB = "scale=in_color_matrix=bt709:in_range=tv"


def grade_chain(src, plan):
    """plan["grade"]: true/нет — HDR→SDR + LUT образца + резкость; false — без цветокора; строка — свой фильтр."""
    g = plan.get("grade", True)
    if g is False: return ""
    tr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=color_transfer",
                         "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip().split(",")[0].strip()
    tin = {"arib-std-b67": "arib-std-b67", "smpte2084": "smpte2084"}.get(tr)
    chain = [HDR_TM.format(tin=tin)] if tin else []
    if isinstance(g, str):
        chain.append(g)
    else:
        if plan.get("sharpen", True): chain.append(SHARP)  # резкость по яркости до LUT
        if os.path.exists(LUT):
            # LUT снят в RGB с матрицей BT.709 (fit_lut.py) — переводим так же явно
            p = LUT.replace("\\", "/").replace(":", "\\:")
            chain += [TO_RGB, f"lut3d=file='{p}':interp=tetrahedral"]
        else:
            print("Нет LUT", LUT, "— запасной цветокор", flush=True)
            chain.append(LOOK_FALLBACK)
    chain += [TO_RGB, TO_YUV]
    return ",".join(chain)


# ---------------------------------------------------------------- нарезка (как в «Слайдах» и «Мани»)
def prepare_cut(plan, rp, src, dur, fps, work):
    cuts = plan.get("cuts", {})
    from speech import load_audio
    audio, _ = load_audio(src)
    env = envelope(audio) if cuts.get("snap", True) else None
    words = json.load(open(rp(plan["words"]), encoding="utf-8"))["words"]
    if "keep" in cuts:
        keep = cuts["keep"]
        kept_words = [w for w in words if any(s <= (w["s"] + w["e"]) / 2 <= e for s, e in keep)]
    else:
        if cuts.get("takes") and env is not None:
            moved, new = [], [[snap_bound(env, ta), snap_bound(env, tb)] for ta, tb in cuts["takes"]]
            for (ta, tb), (na, nb) in zip(cuts["takes"], new):
                if abs(na - ta) > 0.005: moved.append(f"{ta}→{na}")
                if abs(nb - tb) > 0.005: moved.append(f"{tb}→{nb}")
            cuts = dict(cuts, takes=new)
            if moved: print("Границы дублей сдвинуты в паузы: " + ", ".join(moved), flush=True)
        if cuts.get("takes") and cuts.get("verbatim", True):
            words = take_words(audio, src, cuts["takes"], work, cuts.get("model", "small"))
        keep, rep_log, kept_words = auto_keep(words, dur, cuts, env)
        if rep_log:
            print(f"Вырезаны повторы ({len(rep_log)}): " + "; ".join(f"{t:.1f} {why}" for t, why in rep_log), flush=True)
    tl = Timeline(keep, fps)
    expected = [{"w": w["w"], "t": round(tl.out(w["s"]), 2)} for w in kept_words]
    json.dump({"keep": tl.keep, "out_starts": tl.starts, "total": tl.total, "expected": expected},
              open(os.path.join(work, "edl.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"Нарезка: {len(tl.keep)} кусков, {dur:.1f} c -> {tl.total:.1f} c", flush=True)
    cut_path = os.path.join(work, "cut.mkv")
    gr = grade_chain(src, plan)
    sig = json.dumps([tl.keep, fps, os.path.normcase(os.path.abspath(src)), gr,
                      os.path.getmtime(LUT) if os.path.exists(LUT) else 0]).encode()
    sig_path = cut_path + ".sig"
    if not (os.path.exists(cut_path) and os.path.exists(sig_path) and open(sig_path, "rb").read() == sig):
        fc, cat = [], ""
        for i, (s, e) in enumerate(tl.keep):
            fc.append(f"[0:v]trim={s:.4f}:{e:.4f},setpts=PTS-STARTPTS,fps={fps}[v{i}]")
            fd = min(0.015, (e - s) / 4)
            fc.append(f"[0:a]atrim={s:.4f}:{e:.4f},asetpts=PTS-STARTPTS,afade=t=in:d={fd},"
                      f"afade=t=out:st={e - s - fd:.4f}:d={fd}[a{i}]")
            cat += f"[v{i}][a{i}]"
        fc.append(f"{cat}concat=n={len(tl.keep)}:v=1:a=1[vc][a]")
        fc.append(f"[vc]{gr or TO_RGB + ',' + TO_YUV}[v]")
        fcp = os.path.join(work, "cut_filter.txt")
        open(fcp, "w", encoding="utf-8").write(";\n".join(fc))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-/filter_complex", fcp,
                        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "8",
                        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                        "-c:a", "pcm_s16le", cut_path], check=True)
        open(sig_path, "wb").write(sig)
    words_out = [{"w": w["w"], "s": w["s"], "e": w["e"], "t0": tl.out(w["s"]), "t1": tl.out(w["e"])} for w in kept_words]
    return tl, cut_path, words_out


# ---------------------------------------------------------------- рендер
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("plan")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--start", type=float); ap.add_argument("--end", type=float)
    ap.add_argument("--still")
    ap.add_argument("--audio-only", action="store_true")
    ap.add_argument("--cut-only", action="store_true")
    ap.add_argument("--out")
    a = ap.parse_args()

    plan = json.load(open(a.plan, encoding="utf-8"))
    base_dir = os.path.dirname(os.path.abspath(a.plan))
    rp = lambda p: p if os.path.isabs(p) else os.path.join(base_dir, p)
    src = rp(plan["source"])
    probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                       "stream=width,height:format=duration", "-of", "json", src],
                                      capture_output=True, text=True).stdout)
    SW, SH = probe["streams"][0]["width"], probe["streams"][0]["height"]
    fps = plan.get("fps", 60)  # образец — 60 к/с
    if a.preview: fps = min(fps, 30)
    W0, H0 = plan.get("size", [1080, 1920])  # образец — 1080×1920, 9:16
    scale = 0.5 if a.preview else 1.0
    W, H = int(W0 * scale) // 2 * 2, int(H0 * scale) // 2 * 2
    u = W / 1080
    dur = float(probe["format"]["duration"])
    work = rp(plan.get("work_dir", "_work_ep"))
    os.makedirs(work, exist_ok=True)

    tl, cut_path, words = prepare_cut(plan, rp, src, dur, plan.get("fps", 60), work)
    if a.cut_only:
        print("Склейка:", cut_path); return

    assets = plan.get("assets", "")
    assets = rp(assets) if assets else base_dir
    ctx = {"W": W, "H": H, "u": u, "assets": assets, "base_dir": base_dir, "fps": fps}
    seg_face = track_faces(src, tl.keep, os.path.join(work, "faces.json"))

    def face_at(t):
        f = seg_face[tl.seg_index(t)]
        return [f[0] + plan.get("face_dx", 0.0), f[1] + plan.get("face_dy", 0.0), f[2]]

    # --- сцены
    scenes = []
    for S_ in plan.get("scenes", []):
        t0 = ev_time(S_, tl)
        scenes.append(dict(S_, t0=0.0 if t0 < 0.05 else t0))
    scenes.sort(key=lambda s: s["t0"])
    if not scenes or scenes[0]["t0"] > 0:
        scenes.insert(0, {"kind": "face", "t0": 0.0})
    clips = []  # звук медиа (мем со своим звуком), если задан audio_db
    for i, sc in enumerate(scenes):
        sc["t1"] = scenes[i + 1]["t0"] if i + 1 < len(scenes) else tl.total
        sc["_K"] = KINDS[sc.get("kind", "split")]
        ms = []
        for j, M in enumerate(sc.get("media", [])):
            mt0 = sc["t0"] if j == 0 and "at" not in M and "at_out" not in M else ev_time(M, tl)
            ms.append([M, mt0])
        for j, (M, mt0) in enumerate(ms):
            mt1 = ms[j + 1][1] if j + 1 < len(ms) else sc["t1"]
            if j == 0: mt0 = sc["t0"]
            obj = Media(M, ctx, mt0, mt1)
            ms[j] = obj
            if M.get("audio_db") is not None and obj.video and not subprocess.run(
                    ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0",
                     obj.src], capture_output=True, text=True).stdout.strip():
                print(f"В {os.path.basename(obj.src)} нет звука — audio_db пропущен", flush=True)
            elif M.get("audio_db") is not None and obj.video:
                clips.append({"file": obj.src, "start": M.get("start", 0), "at": mt0, "dur": mt1 - mt0,
                              "db": M["audio_db"], "speed": M.get("speed", 1.0)})
        sc["_media"] = ms

    def scene_at(t):
        i = 0
        for k, sc in enumerate(scenes):
            if sc["t0"] <= t + 1e-6: i = k
        return i

    subs_cfg = plan.get("subs", {})
    off = list(subs_cfg.get("off", []))
    for sc in scenes:  # концовка (outro) по умолчанию без субтитров — как в образце
        if not sc.get("subs", sc["_K"].get("subs", True)): off.append([sc["t0"], sc["t1"] + 0.01])
    chunks = build_subs(words, dict(subs_cfg, off=off), tl.total) if subs_cfg.get("on", True) else []

    pl_cfg = plan.get("plashka", {})
    pl_on = pl_cfg is not False and pl_cfg.get("on", True)
    if pl_cfg is False: pl_cfg = {}

    cuts_on_face = [t for t in tl.starts[1:] if all(abs(t - s["t0"]) > 0.02 for s in scenes)
                    and not any(abs(t - m.t0) < 0.02 for s in scenes for m in s["_media"])]
    print(f"Склейки дублей без смены картинки: {len(cuts_on_face)} из {len(tl.starts) - 1}"
          + (": " + ", ".join(f"{t:.1f}" for t in cuts_on_face[:40]) if cuts_on_face else ""), flush=True)

    # --- кадр
    def media_at(sc, t):
        ms = sc["_media"]
        cur = 0
        for j, m in enumerate(ms):
            if m.t0 <= t + 1e-6: cur = j
        return ms[cur], (ms[cur - 1] if cur else None), cur

    def panel(sc, t, w, h):
        m, prev, j = media_at(sc, t)
        dt = t - m.t0
        en = m.enter
        if en == "zoom" and dt < TR["zoom"]:
            # как в образце: клип появляется крупным планом своего фокуса, держится долю секунды и отъезжает
            hold = 0.06
            k = clamp((dt - hold) / (TR["zoom"] - hold))
            e = ease_in_out(k)
            z0 = m.d.get("zoom_from", 1.8)
            img = m.view(w, h, t, lerp(z0, 1.0, e))
            vel = (z0 - 1.0) * (math.sin(math.pi * k) if 0 < k < 1 else 0)
            return zoom_blur(img, 0.22 * vel, m.d.get("focus", [0.5, 0.5]))
        img = m.view(w, h, t)
        if prev is not None and en == "fade" and dt < TR["fade"]:
            return Image.blend(prev.view(w, h, t), img, ease_in_out(dt / TR["fade"]))
        if prev is not None and en == "slide" and dt < TR["slide"]:
            e = ease_out_cubic(dt / TR["slide"])
            out = prev.view(w, h, t).copy()
            out.paste(img, (0, int((1 - e) * h)))
            return vblur(out, math.sin(math.pi * dt / TR["slide"]) * 0.06 * h)
        return img

    def compose(frame, t):
        sc = scenes[scene_at(t)]
        kind = sc.get("kind", "split")
        K = sc["_K"]
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 255))
        fa = face_at(t)
        if kind == "split":
            seam = int(round(sc.get("seam", K["seam"]) * H))
            fw = sc.get("face_w", plan.get("face_w", K["face_w"]))
            fcy = sc.get("face_cy", K["face_cy"])
            canvas.paste(place(frame, W, seam, fa, fw, fcy, sc.get("face_cx", 0.5)), (0, 0))
            if sc["_media"]:
                canvas.paste(panel(sc, t, W, H - seam), (0, seam))
        elif kind == "face":
            life = max(0.1, sc["t1"] - sc["t0"])
            push = sc.get("push", 0.0) * clamp((t - sc["t0"]) / life)  # в образце наезда нет; можно 0.03–0.05
            canvas.paste(place(frame, W, H, fa, sc.get("face_w", K["face_w"]) * (1 + push),
                               sc.get("face_cy", K["face_cy"]), sc.get("face_cx", 0.5)), (0, 0))
        elif kind == "outro":
            canvas.paste(place(frame, W, H, fa, None, None), (0, 0))
        elif kind == "full":
            canvas.paste(panel(sc, t, W, H), (0, 0))
        for chn in chunks:
            if chn["t0"] <= t < chn["t1"]:
                draw_sub(canvas, chn["text"], W, H, u); break
        if pl_on and sc.get("plashka", True) is not False:
            style = sc.get("plashka") if sc.get("plashka") in ("white", "black") else pl_cfg.get("style", "black")
            img, (cx, cy), pos = plashka_img(pl_cfg, style, u)
            pos = pl_cfg.get("pos", pos)
            comp(canvas, img, pos[0] * W - cx, pos[1] * H - cy)
        return canvas.convert("RGB")

    def read_frame(ts):
        raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{ts:.3f}", "-i", cut_path, "-frames:v", "1",
                              "-vf", f"{CUT_TO_RGB}:w={SW}:h={SH},format=rgb24", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                             capture_output=True).stdout
        return Image.frombytes("RGB", (SW, SH), raw[:SW * SH * 3])

    if a.still:
        shots = []
        for ts in [float(x) for x in a.still.split(",")]:
            img = compose(read_frame(ts), ts)
            outp = os.path.join(work, f"still_{ts:07.2f}.png")
            img.save(outp); shots.append((ts, img)); print(outp)
        tw, th = 360, 640
        cols = min(len(shots), 6)
        sheet = Image.new("RGB", (cols * tw, ((len(shots) + cols - 1) // cols) * (th + 28)), (20, 20, 24))
        sd = ImageDraw.Draw(sheet)
        for i, (ts, img) in enumerate(shots):
            x, y = (i % cols) * tw, (i // cols) * (th + 28)
            sheet.paste(img.resize((tw, th), Image.LANCZOS), (x, y + 28))
            sd.text((x + 8, y + 4), f"{ts:.2f} c", font=font("semi", 20), fill=(255, 220, 80))
        sp = os.path.join(work, "stills.jpg")
        sheet.save(sp, quality=88); print("Сетка:", sp)
        return

    t_start = a.start or 0.0
    t_end = min(a.end or tl.total, tl.total)
    vid_tmp = os.path.join(work, "video_only.mp4")
    if a.audio_only:
        if not os.path.exists(vid_tmp): sys.exit("Нет готовой картинки _work_ep/video_only.mp4 — сначала полный рендер.")
        t_start, t_end = 0.0, min(tl.total, float(json.loads(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", vid_tmp],
            capture_output=True, text=True).stdout)["format"]["duration"]))
    else:
        render_frames(a, cut_path, vid_tmp, SW, SH, W, H, fps, t_start, t_end, compose, plan)
    plan2 = dict(plan, _clips=clips, audio_bitrate=plan.get("audio_bitrate", "320k"))
    audio_mix(a, plan2, ctx, [], [], work, rp, cut_path, vid_tmp, t_start, t_end)


def render_frames(a, cut_path, vid_tmp, SW, SH, W, H, fps, t_start, t_end, compose, plan):
    rd = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-ss", f"{t_start:.3f}", "-t", f"{t_end - t_start:.3f}",
                           "-i", cut_path, "-vf", f"fps={fps},{CUT_TO_RGB},format=rgb24", "-f", "rawvideo",
                           "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    # образец: H.264 High, 60 к/с, ~40 Мбит/с — даём высокое качество (crf 15) вместо фиксированного битрейта
    wr = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(fps), "-i", "-", "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
                           "-c:v", "libx264", "-preset", "veryfast" if a.preview else "medium",
                           "-crf", "23" if a.preview else str(plan.get("crf", 15)), "-profile:v", "high",
                           "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709",
                           "-colorspace", "bt709", vid_tmp], stdin=subprocess.PIPE)
    n, fsz = 0, SW * SH * 3
    total = int((t_end - t_start) * fps)
    while True:
        raw = rd.stdout.read(fsz)
        if len(raw) < fsz: break
        wr.stdin.write(compose(Image.frombytes("RGB", (SW, SH), raw), t_start + n / fps).tobytes())
        n += 1
        if n % (fps * 5) == 0: print(f"  кадр {n}/{total}", flush=True)
    wr.stdin.close(); wr.wait(); rd.wait()


if __name__ == "__main__":
    main()
