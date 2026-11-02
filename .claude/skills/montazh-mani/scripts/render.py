"""Монтаж в стиле «Мани» (вертикальный ролик-обзор: скрин продукта в окне браузера + лицо + пословные субтитры).

python render.py plan.json                      # полный рендер
python render.py plan.json --preview            # половинное разрешение, черновик
python render.py plan.json --start 10 --end 20  # кусок (секунды ИТОГОВОГО ролика)
python render.py plan.json --still 3.2,7.5      # PNG-кадры + сетка stills.jpg, без видео
python render.py plan.json --cut-only           # только склейка _work/cut.mkv — для проверки речи
python render.py plan.json --audio-only --out "...vN+1.mp4"   # пересобрать только звук

Время в плане ("at", "until", "*_at") — секунды ИСХОДНИКА (как в words.json); "at_out" — секунды итога.
Нарезка, проверка повторов, элементы «Слайдов» и звук — из core.py (общее ядро со скиллом «Слайды»).
"""
import argparse, json, math, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import core as C
from core import (font, col, clamp, ease_out_cubic, ease_in_out, spring, lerp, comp, with_alpha, rounded_mask,
                  shadow_layer, soft_shadow, icon_tile, Element, Timeline, ev_time, crop_cover, track_faces,
                  envelope, take_words, snap_bound, auto_keep, render_video, audio_mix, POS)

C.FONT_FILES.update({
    "serif": ["PlayfairDisplay-Italic-VariableFont_wght.ttf", "georgiai.ttf"],   # акцент: курсивная антиква
    "serif_r": ["PlayfairDisplay-VariableFont_wght.ttf", "georgia.ttf"],          # стикер: прямая антиква
    "sub": ["SFPRODISPLAYBOLD.OTF", "Montserrat-Bold.ttf", "segoeuib.ttf"],        # субтитры: жирный гротеск
    "url": ["SF-Pro-Display-Semibold.otf", "Inter-SemiBold.ttf", "segoeuib.ttf"],
})


def sfont(kind, size, weight=None):
    f = font(kind, size)
    if weight and not getattr(f, "_wset", False):
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
        f._wset = True
    return f


# ---------------------------------------------------------------- дизайн-система образца
PAL = {
    "ink": (22, 22, 26), "accent": (40, 118, 246), "accent_dark": (92, 160, 255), "box": (24, 108, 245),
    "sel": (120, 172, 255), "border": (96, 156, 250), "pink": (222, 52, 112), "mint": (196, 236, 204),
    "yellow": (255, 236, 130), "glow_pink": (255, 70, 140), "glow_blue": (70, 140, 255),
}
KINDS = {
    # card — окно браузера (доли кадра x0, y0, x1, y1); sub_dy — субтитры ниже окна на столько долей высоты
    "split": {"bg": "paper", "face": "card", "card": [0.07, 0.125, 0.93, 0.485], "card_head": [0.11, 0.25, 0.89, 0.50],
              "sub_dy": 0.058, "sub_y": 0.5},
    "dark": {"bg": "dark", "face": None, "card": [0.065, 0.12, 0.935, 0.68], "sub_dy": 0.075, "sub_y": 0.5},
    "white": {"bg": "white", "face": None, "card": [0.24, 0.27, 0.76, 0.49], "sub_dy": 0.15, "sub_y": 0.62},
    "face": {"bg": None, "face": "full", "card": None, "sub_y": 0.70},
}
FACE_CARD = [0.04, 0.585, 0.96, 1.04]  # лицо в карточке снизу (низ уходит за кадр)
FACE_CARD_POP = [0.04, 0.70, 0.96, 1.04]  # с эффектом «голова над карточкой» карточка ниже, голова выходит за край
POP_EXT = 0.17   # сколько кадра над карточкой отдано голове (доля высоты)
MODEL = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "modnet.onnx")
TR = {"whip": 0.28, "fade": 0.25, "morph": 0.34}
VIDEO_EXT = (".mp4", ".mov", ".webm", ".mkv", ".m4v", ".gif")


# ---------------------------------------------------------------- вырезание человека
class Matte:
    """Маска человека (MODNet через onnxruntime): голова поверх края карточки, как в образце."""

    def __init__(self, path):
        import onnxruntime as ort
        so = ort.SessionOptions(); so.log_severity_level = 3
        self.s = ort.InferenceSession(path, so, providers=["CPUExecutionProvider"])
        self.inp = self.s.get_inputs()[0].name
        self._last = (None, None)

    def __call__(self, img, key=None):
        if key is not None and self._last[0] == key: return self._last[1]
        w, h = img.size
        k = 512 / max(w, h)
        mw, mh = max(32, int(round(w * k / 32)) * 32), max(32, int(round(h * k / 32)) * 32)
        x = (np.asarray(img.convert("RGB").resize((mw, mh), Image.BILINEAR), np.float32) / 255 - 0.5) / 0.5
        a = self.s.run(None, {self.inp: x.transpose(2, 0, 1)[None]})[0][0, 0]
        m = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)
        m = m.point(lambda v: 0 if v < 24 else min(255, int((v - 24) * 1.2)))  # срезать полупрозрачный ореол фона
        self._last = (key, m)
        return m


# ---------------------------------------------------------------- фоны
def grain(H, W, s, seed=1):
    return np.random.default_rng(seed).normal(0, s, (H, W, 1)).astype(np.float32)


def make_bg(kind, W, H, assets):
    u = W / 1080
    if kind == "paper":  # светлая «бумага»: холодный серо-голубой, зерно, мягкая тень листьев сверху
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        img = np.ones((H, W, 3), np.float32) * np.array((236, 239, 244), np.float32)
        g = np.exp(-(((x - 0.1 * W) ** 2 + (y - 0.05 * H) ** 2) / (2 * (0.45 * W) ** 2)))[..., None]
        img += g * (np.array((224, 232, 246), np.float32) - 236) * 0.9
        leaves = Image.new("L", (W, H), 0)
        dr = ImageDraw.Draw(leaves)
        rng = np.random.default_rng(7)
        for cx0, cy0 in ((0.12, 0.06), (0.88, 0.04)):
            for i in range(9):
                a = rng.uniform(0, math.pi)
                L, Wd = rng.uniform(0.12, 0.22) * W, rng.uniform(0.02, 0.035) * W
                cx, cy = cx0 * W + math.cos(a) * L * 0.6, cy0 * H + math.sin(a) * L * 0.5
                pts = [(cx + math.cos(a) * L * s - math.sin(a) * Wd * w, cy + math.sin(a) * L * s + math.cos(a) * Wd * w)
                       for s, w in ((-0.5, 0), (0, 1), (0.5, 0), (0, -1))]
                dr.polygon(pts, fill=255)
        sh = np.asarray(leaves.filter(ImageFilter.GaussianBlur(26 * u)), np.float32)[..., None] / 255
        img -= sh * 9
        img += grain(H, W, 3.0)
        return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")
    if kind == "dark":  # тёмно-серый с виньеткой: экран в фокусе, лица нет
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((x - 0.5 * W) / W) ** 2 + ((y - 0.42 * H) / H) ** 2)
        v = 84 - 62 * np.clip(d / 0.62, 0, 1) ** 1.4
        img = np.repeat(v[..., None], 3, axis=2) + grain(H, W, 3.2)
        return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")
    if kind == "white":
        img = np.ones((H, W, 3), np.float32) * 251 + grain(H, W, 1.2)
        return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")
    p = kind if os.path.isabs(kind) else os.path.join(assets, kind)
    return crop_cover(Image.open(p).convert("RGB"), W, H, 1.0, (0.5, 0.5))


def hblur(img, r):
    """Горизонтальное размытие движения (для вжух-переходов)."""
    r = int(r)
    if r < 2: return img
    a = np.asarray(img).astype(np.float32)
    c = np.cumsum(np.pad(a, ((0, 0), (r + 1, r), (0, 0)), mode="edge"), axis=1)
    out = (c[:, 2 * r + 1:] - c[:, :-2 * r - 1]) / (2 * r + 1)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), img.mode)


# ---------------------------------------------------------------- текст
_wcache = {}


def word_img(text, style, u):
    """-> (RGBA, x-отступ до начала буквы, y-отступ до базовой линии, ширина-продвижение)."""
    key = (text, style, round(u, 3))
    if key in _wcache: return _wcache[key]
    # акцент — то же слово тем же шрифтом и цветом, только крупнее: без свечения, обводки и курсива (правка пользователя)
    S = {
        "ink": ("sub", 84, PAL["ink"], None),
        "white": ("sub", 84, (255, 255, 255), "shadow"),
        "acc": ("sub", 110, PAL["ink"], None),
        "acc_dark": ("sub", 110, (255, 255, 255), "shadow"),
        "face": ("sub", 80, (255, 255, 255), "shadow"),
        "face_serif": ("sub", 80, (255, 255, 255), "shadow"),
        "face_acc": ("sub", 112, (255, 255, 255), "shadow"),
        "face_acc_pink": ("sub", 112, (255, 255, 255), "shadow"),
        "head": ("sub", 64, PAL["ink"], None),
        "head_box": ("serif", 74, (255, 255, 255), None),
        "head_acc": ("serif", 70, PAL["accent"], None),
    }[style]
    kind, size, color, fx = S
    size *= u
    f = sfont(kind, size, 640 if kind == "serif" else None)
    asc, desc = f.getmetrics()
    adv = f.getlength(text)
    pad = int(size * 0.45)
    w, h = int(adv + 2 * pad + size * 0.2), int(asc + desc + 2 * pad)
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).text((pad, pad + asc), text, font=f, fill=255, anchor="ls")
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if fx == "shadow":
        img = soft_glow(m, (0, 0, 0), 12 * u, 0.55)
    elif fx == "soft":
        img = soft_glow(m, color, 10 * u, 0.25)
    elif fx in ("glow", "glow_pink"):
        gc = PAL["glow_pink"] if fx == "glow_pink" or style == "face_acc_pink" else PAL["glow_blue"]
        img = soft_glow(m, gc, 18 * u, 0.95)
        img.alpha_composite(soft_glow(m, gc, 6 * u, 0.8))
    layer = Image.new("RGBA", (w, h), color + (0,))
    layer.putalpha(m)
    img.alpha_composite(layer)
    _wcache[key] = (img, pad, pad + asc, adv)
    return _wcache[key]


def soft_glow(mask, color, blur, a):
    g = Image.new("RGBA", mask.size, color + (0,))
    g.putalpha(mask.filter(ImageFilter.GaussianBlur(max(1, blur))).point(lambda v: int(min(255, v * a * 1.6))))
    return g


def draw_word(canvas, wi, x, base, k, u, scale_from=1.0):
    """Слово появляется из размытия с лёгким подъёмом (как в образце)."""
    if k <= 0.01: return
    img, px, py, _ = wi
    if k < 0.999:
        b = (1 - k) * 9 * u
        if scale_from != 1.0:
            s = lerp(scale_from, 1.0, k)
            img = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.BILINEAR)
            px, py = px * s, py * s
        if b > 0.6: img = img.filter(ImageFilter.GaussianBlur(b))
        img = with_alpha(img, k)
    comp(canvas, img, x - px, base - py + (1 - k) * 10 * u)


PUNCT = ".,!?;:…—–-()"


def disp(w):
    return w.strip().strip(PUNCT).strip()


def norm(w):
    return re.sub(r"[^\w]", "", w.lower().replace("ё", "е"))


# ---------------------------------------------------------------- окно браузера
_chrome = {}


def chrome_bar(cw, url, u):
    key = (cw, url, round(u, 3))
    if key in _chrome: return _chrome[key]
    bh = int(42 * u)
    bar = Image.new("RGBA", (cw, bh), (250, 250, 251, 255))
    dr = ImageDraw.Draw(bar)
    for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
        cx = int((20 + i * 17) * u)
        dr.ellipse([cx - 5.5 * u, bh / 2 - 5.5 * u, cx + 5.5 * u, bh / 2 + 5.5 * u], fill=c + (255,))
    g = (150, 150, 156, 255)
    x0 = int(84 * u)
    dr.rounded_rectangle([x0, bh / 2 - 6 * u, x0 + 15 * u, bh / 2 + 6 * u], 2 * u, outline=g, width=max(1, int(1.6 * u)))
    dr.line([(x0 + 30 * u, bh / 2), (x0 + 35 * u, bh / 2 - 5 * u)], fill=g, width=max(1, int(1.8 * u)))
    dr.line([(x0 + 30 * u, bh / 2), (x0 + 35 * u, bh / 2 + 5 * u)], fill=g, width=max(1, int(1.8 * u)))
    pw = int(cw * 0.56)
    px = (cw - pw) // 2
    dr.rounded_rectangle([px, bh * 0.2, px + pw, bh * 0.8], int(7 * u), fill=(240, 240, 243, 255))
    if url:
        f = font("url", 15 * u)
        tw = f.getlength(url)
        tx = cw / 2 - tw / 2 + 7 * u
        lx, ly = tx - 13 * u, bh / 2
        dr.rounded_rectangle([lx - 4 * u, ly - 1 * u, lx + 4 * u, ly + 5 * u], 1.5 * u, fill=(70, 70, 76, 255))
        dr.arc([lx - 3 * u, ly - 7 * u, lx + 3 * u, ly + 1 * u], 180, 360, fill=(70, 70, 76, 255), width=max(1, int(1.6 * u)))
        dr.text((tx, bh / 2), url, font=f, fill=(40, 40, 46, 255), anchor="lm")
    for i in range(3):
        cx = cw - int((22 + i * 22) * u)
        dr.rounded_rectangle([cx - 5 * u, bh / 2 - 5 * u, cx + 5 * u, bh / 2 + 5 * u], 1.5 * u, outline=g, width=max(1, int(1.5 * u)))
    dr.line([(0, bh - 1), (cw, bh - 1)], fill=(226, 226, 230, 255), width=1)
    _chrome[key] = bar
    return bar


def cursor_img(s):
    pts = [(0, 0), (0, 0.80), (0.21, 0.62), (0.35, 0.94), (0.48, 0.88), (0.34, 0.57), (0.60, 0.57)]
    big = 4
    im = Image.new("RGBA", (int(s * big) + 8, int(s * big) + 8), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    P = [(4 + x * s * big, 4 + y * s * big) for x, y in pts]
    dr.polygon(P, fill=(255, 255, 255, 255))
    Q = [(4 + s * big * 0.08 + x * s * big * 0.84, 4 + s * big * 0.12 + y * s * big * 0.84) for x, y in pts]
    dr.polygon(Q, fill=(10, 10, 12, 255))
    return im.resize((int(s) + 2, int(s) + 2), Image.LANCZOS)


class Media:
    """Скриншот или запись экрана внутри окна. y — прокрутка (доля высоты картинки сверху), zoom — наезд,
    focus — центр наезда, marks — выделения по словам, cursor — курсор по точкам."""

    def __init__(self, d, plan_ctx, t0, t1):
        self.d, self.t0, self.t1 = d, t0, t1
        a = plan_ctx["assets"]
        self.src = d["src"] if os.path.isabs(d["src"]) else os.path.join(a, d["src"])
        if not os.path.exists(self.src):
            alt = os.path.join(plan_ctx["base_dir"], d["src"])
            if os.path.exists(alt): self.src = alt
        self.video = self.src.lower().endswith(VIDEO_EXT)
        self.fps = plan_ctx["fps"]
        self._base, self._frames = {}, {}
        self.url = d.get("url", "")

    def aspect(self):
        """высота / ширина кадра медиа"""
        if not self.video:
            w, h = Image.open(self.src).size
            return h / w
        pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                        "stream=width,height", "-of", "json", self.src],
                                       capture_output=True, text=True).stdout)["streams"][0]
        return pr["height"] / pr["width"]

    def base(self, cw, t):
        if not self.video:
            if cw not in self._base:
                im = Image.open(self.src).convert("RGB")
                self._base[cw] = im.resize((cw, max(1, int(im.height * cw / im.width))), Image.LANCZOS)
            return self._base[cw]
        if cw not in self._frames:
            dur = self.t1 - self.t0 + 0.6
            sp = self.d.get("speed", 1.0)
            pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                            "stream=width,height", "-of", "json", self.src],
                                           capture_output=True, text=True).stdout)["streams"][0]
            h = int(pr["height"] * cw / pr["width"]) // 2 * 2
            raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", str(self.d.get("start", 0)), "-t", f"{dur * sp:.2f}",
                                  "-i", self.src, "-vf", f"setpts=PTS/{sp},scale={cw}:{h},fps={self.fps}",
                                  "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
            n = len(raw) // (cw * h * 3)
            self._frames[cw] = [Image.frombytes("RGB", (cw, h), raw[i * cw * h * 3:(i + 1) * cw * h * 3]) for i in range(n)]
        fr = self._frames[cw]
        if not fr: return Image.new("RGB", (cw, int(cw * 0.6)), (0, 0, 0))
        return fr[int(clamp((t - self.t0) * self.fps, 0, len(fr) - 1))]

    def view(self, cw, ch, t):
        """-> (контент RGB cw×ch, функция доли картинки -> пиксели контента)."""
        img = self.base(cw, t)
        H = img.height  # доли в marks/cursor/focus — от настоящей картинки, без белой добивки снизу
        if img.height < ch:
            pad = Image.new("RGB", (cw, ch), tuple(self.d.get("fill", (255, 255, 255))))
            pad.paste(img, (0, 0)); img = pad
        life = max(0.1, self.t1 - self.t0)
        k = clamp((t - self.t0) / life)
        k = ease_in_out(k) * 0.4 + k * 0.6
        z = self.d.get("zoom", 1.0)
        z = lerp(z[0], z[1], k) if isinstance(z, list) else z
        y = self.d.get("y", 0.0)
        y = lerp(y[0], y[1], k) if isinstance(y, list) else y
        vw, vh = cw / z, ch / z
        fo = self.d.get("focus")
        fx = fo[0] if fo else 0.5
        vx0 = clamp(fx * cw - vw / 2, 0, cw - vw)
        vy0 = (fo[1] * H - vh / 2) if fo else y * H
        vy0 = clamp(vy0, 0, max(0, img.height - vh))
        out = img.resize((cw, ch), Image.BILINEAR if z != 1 else Image.NEAREST, box=(vx0, vy0, vx0 + vw, vy0 + vh))
        return out, (lambda px, py: ((px * cw - vx0) * z, (py * H - vy0) * z)), z

    def overlay(self, content, m, t, u, z):
        """Выделения и курсор поверх контента."""
        ov = Image.new("RGBA", content.size, (0, 0, 0, 0))
        dr = ImageDraw.Draw(ov)
        for mk in self.d.get("marks", []):
            t0 = mk["_t"]
            if t < t0 or (mk.get("_until") is not None and t > mk["_until"]): continue
            x0, y0 = m(mk["box"][0], mk["box"][1]); x1, y1 = m(mk["box"][2], mk["box"][3])
            p = ease_out_cubic((t - t0) / mk.get("dur", 0.28))
            kind = mk.get("kind", "select")
            c = mk.get("color")
            if kind == "select":  # синее выделение текста растёт слева направо
                cc = col(c)[:3] if c else PAL["sel"]
                dr.rounded_rectangle([x0, y0, x0 + (x1 - x0) * p, y1], int(3 * u), fill=cc + (120,))
            elif kind == "outline":  # синяя рамка вокруг элемента
                cc = col(c)[:3] if c else PAL["accent"]
                g = (1 - p) * 0.12
                gx, gy = (x1 - x0) * g, (y1 - y0) * g
                dr.rounded_rectangle([x0 - gx, y0 - gy, x1 + gx, y1 + gy], int(8 * u * z), outline=cc + (int(255 * p),),
                                     width=max(2, int(4 * u)))
            elif kind == "strike":
                cc = col(c)[:3] if c else PAL["pink"]
                ym = (y0 + y1) / 2
                dr.line([(x0, ym), (x0 + (x1 - x0) * p, ym)], fill=cc + (255,), width=max(2, int(4 * u)))
            elif kind == "underline":
                cc = col(c)[:3] if c else PAL["accent"]
                dr.line([(x0, y1), (x0 + (x1 - x0) * p, y1)], fill=cc + (255,), width=max(2, int(5 * u)))
        out = content.convert("RGBA")
        out.alpha_composite(ov)
        cur = self.d.get("_cursor")
        if cur and t >= cur[0][0]:
            pts = cur
            if t >= pts[-1][0]:
                fx, fy = pts[-1][1], pts[-1][2]
            else:
                for (ta, xa, ya), (tb, xb, yb) in zip(pts, pts[1:]):
                    if ta <= t < tb:
                        k = ease_in_out((t - ta) / max(0.01, tb - ta)); fx, fy = lerp(xa, xb, k), lerp(ya, yb, k); break
            cx, cy = m(fx, fy)
            ci = cursor_img(26 * u)
            comp(out, soft_shadow(ci, u, 4, 0.35), cx - 40 * u * 1.0, cy - 40 * u)
            comp(out, ci, cx, cy)
        return out


def window(content_rgba, url, u, r):
    """Окно браузера: полоса Safari сверху, синяя тонкая рамка со свечением, тень."""
    cw, ch = content_rgba.size
    bar = chrome_bar(cw, url, u)
    win = Image.new("RGBA", (cw, ch + bar.height), (255, 255, 255, 255))
    win.alpha_composite(content_rgba, (0, bar.height))
    win.alpha_composite(bar, (0, 0))
    win.putalpha(rounded_mask(win.width, win.height, r))
    pad = int(40 * u)
    out = Image.new("RGBA", (win.width + 2 * pad, win.height + 2 * pad), (0, 0, 0, 0))
    ring = Image.new("L", out.size, 0)
    ImageDraw.Draw(ring).rounded_rectangle([pad - 2 * u, pad - 2 * u, pad + win.width + 2 * u, pad + win.height + 2 * u],
                                           r + 2 * u, outline=255, width=max(2, int(5 * u)))
    glow = Image.new("RGBA", out.size, PAL["border"] + (0,))
    glow.putalpha(ring.filter(ImageFilter.GaussianBlur(9 * u)).point(lambda v: int(v * 0.85)))
    sh = shadow_layer(win.width, win.height, r, u, pad, strength=26, offy=10, blur=22)
    out.alpha_composite(sh)
    out.alpha_composite(glow)
    out.alpha_composite(win, (pad, pad))
    ImageDraw.Draw(out).rounded_rectangle([pad - 1, pad - 1, pad + win.width, pad + win.height], r + 1,
                                          outline=PAL["border"] + (255,), width=max(2, int(2.6 * u)))
    return out, pad


# ---------------------------------------------------------------- новые элементы
class Icons(Element):
    """Ряд иконок приложений, каждая выпрыгивает на своём слове (row_at). items: [{"src": PNG} | "буквы/эмодзи"]."""
    dynamic = True
    vscale = 1.0
    blur_px = 0

    def draw(self, tl):
        d, u = self.d, self.ctx["u"]
        s = int(d.get("size", 104) * u)
        gap = int(d.get("gap", 30) * u)
        items = d["items"]
        n = len(items)
        img = Image.new("RGBA", (n * s + (n - 1) * gap + int(80 * u), s + int(80 * u)), (0, 0, 0, 0))
        times = self.row_times(n, 0.35)
        for i, it in enumerate(items):
            k = spring((tl - times[i]) / 0.5)
            if tl < times[i]: continue
            tile = self.tile(it, s, u)
            ts = max(0.05, k)
            t2 = tile.resize((max(1, int(tile.width * ts)), max(1, int(tile.height * ts))), Image.BILINEAR)
            cx = int(40 * u) + i * (s + gap) + s / 2
            comp(img, with_alpha(t2, clamp(k * 1.5)), cx - t2.width / 2, int(40 * u) + s / 2 - t2.height / 2)
        return img

    def tile(self, it, s, u):
        key = ("tile", json.dumps(it, ensure_ascii=False), s)
        if key in _wcache: return _wcache[key]
        src = it.get("src") if isinstance(it, dict) else None
        pad = int(18 * u)
        out = Image.new("RGBA", (s + 2 * pad, s + 2 * pad), (0, 0, 0, 0))
        out.alpha_composite(shadow_layer(s, s, int(s * 0.24), u, pad, strength=40, offy=6, blur=12), (0, 0)) \
            if False else None
        sh = shadow_layer(s, s, int(s * 0.24), u, pad, strength=40, offy=6, blur=12)
        out = sh.crop((0, 0, s + 2 * pad, s + 2 * pad)) if sh.size != out.size else sh
        ImageDraw.Draw(out).rounded_rectangle([pad, pad, pad + s, pad + s], int(s * 0.24), fill=(255, 255, 255, 255))
        if src:
            p = src if os.path.isabs(src) else os.path.join(self.ctx["assets"], src)
            im = Image.open(p).convert("RGBA")
            f = (it.get("fill", 0.64) if isinstance(it, dict) else 0.64)
            iw = int(s * f)
            im = im.resize((iw, max(1, int(im.height * iw / im.width))), Image.LANCZOS)
            comp(out, im, pad + (s - im.width) / 2, pad + (s - im.height) / 2)
        else:
            g = it.get("glyph") if isinstance(it, dict) else it
            t = icon_tile(g, int(s * 0.7), u, it.get("color", "blue") if isinstance(it, dict) else "blue")
            comp(out, t, pad + (s - t.width) / 2, pad + (s - t.height) / 2)
        _wcache[key] = out
        return out

    def transform(self, tl, life):
        o = clamp((tl - (life - 0.2)) / 0.2)
        return 1.0, 1 - o, 0, 0


class Sticky(Element):
    """Стикер-вывод: зачёркнутые «старые способы» (row_at — время зачёркивания каждой строки) и итоговая строка
    с [акцентом] розовым курсивом; outline_at — синяя рамка вокруг итога."""
    dynamic = True
    vscale = 1.0
    blur_px = 10

    def draw(self, tl):
        d, u = self.d, self.ctx["u"]
        w = int(d.get("width", 0.66) * self.W)
        lines = d.get("lines", [])
        fs = 44 * u
        fl = 64 * u
        h = int(70 * u + len(lines) * fs * 1.25 + fl * 1.5 + 50 * u)
        pad = int(50 * u)
        img = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
        img.alpha_composite(shadow_layer(w, h, int(6 * u), u, pad, strength=40, offy=12, blur=20))
        dr = ImageDraw.Draw(img)
        dr.rectangle([pad, pad, pad + w, pad + h], fill=col(d.get("color", "#C4ECCC")))
        tape = Image.new("RGBA", (int(w * 0.24), int(30 * u)), (255, 250, 220, 170))
        comp(img, tape.rotate(-2, expand=True, resample=Image.BICUBIC), pad + w * 0.38, pad - 12 * u)
        f = sfont("serif_r", fs, 520)
        y = pad + 64 * u
        st = self.row_times(len(lines), 0.4)
        x0 = pad + 44 * u
        for i, ln in enumerate(lines):
            dr.text((x0, y), ln, font=f, fill=col(d.get("line_color", "#B8305E")), anchor="ls")
            p = ease_out_cubic((tl - st[i]) / 0.3)
            if p > 0:
                wl = f.getlength(ln)
                ym = y - fs * 0.3
                dr.line([(x0 - 4 * u, ym), (x0 - 4 * u + (wl + 8 * u) * p, ym)], fill=col("#E0457B"), width=max(2, int(3.4 * u)))
            y += fs * 1.25
        y += fl * 0.55
        fin = d.get("text", "")
        fx = x0
        parts = re.split(r"(\[[^\]]*\])", fin)
        fr = sfont("serif_r", fl, 560)
        fi = sfont("serif", fl, 640)
        for prt in parts:
            if not prt: continue
            acc = prt.startswith("[")
            s = prt.strip("[]")
            ff = fi if acc else fr
            dr.text((fx, y), s, font=ff, fill=col("#E0457B" if acc else "ink"), anchor="ls")
            fx += ff.getlength(s)
        oa = d.get("_outline_at_local")
        if oa is not None and tl >= oa:
            p = ease_out_cubic((tl - oa) / 0.25)
            g = (1 - p) * 14 * u
            dr.rounded_rectangle([x0 - 16 * u - g, y - fl * 0.95 - g, fx + 16 * u + g, y + fl * 0.32 + g], int(10 * u),
                                 outline=PAL["accent"] + (int(255 * p),), width=max(2, int(4 * u)))
        return img.rotate(d.get("angle", 1.5), expand=True, resample=Image.BICUBIC)


TYPES = dict(C.TYPES, icons=Icons, sticky=Sticky)


# ---------------------------------------------------------------- субтитры
def build_subs(words, scenes, cfg, total):
    """Слова итога -> куски по 1–3 слова. Новый кусок: пауза, знак препинания, лимит слов/букв, смена сцены."""
    maxw, maxc, gapmax = cfg.get("max_words", 3), cfg.get("max_chars", 16), cfg.get("gap", 0.3)
    fix = {float(k): v for k, v in cfg.get("fix", {}).items()}
    rep = {norm(k): v for k, v in cfg.get("replace", {}).items()}
    acc = cfg.get("accent", [])
    hide = cfg.get("off", [])  # [[s, e]] секунды ИТОГА без субтитров
    out = []
    prev_end_sentence = True
    # правка достаётся только ближайшему к ней слову: соседние слова ближе 0,13 с не цепляют чужую правку
    fix_at = {}
    for k, v in fix.items():
        j = min(range(len(words)), key=lambda i: abs(words[i]["s"] - k)) if words else None
        if j is not None and abs(words[j]["s"] - k) < 0.13: fix_at[j] = v
    for wi, w in enumerate(words):
        raw = w["w"]
        txt = disp(raw)
        hit = fix_at.get(wi)
        if hit is not None: txt = hit
        elif norm(raw) in rep: txt = rep[norm(raw)]
        cap_auto = prev_end_sentence and txt[:1].isupper() and txt[1:].islower() and hit is None
        if cap_auto and cfg.get("lower", True): txt = txt[:1].lower() + txt[1:]
        prev_end_sentence = raw.strip()[-1:] in ".!?…"
        if not txt: continue
        a = False
        for x in acc:
            if isinstance(x, (int, float)) and (abs(w["s"] - x) < 0.13 or w["s"] <= x < w["e"] - 0.08): a = True
            if isinstance(x, str):
                n = norm(x.rstrip("*"))
                if (x.endswith("*") and norm(txt).startswith(n)) or norm(txt) == n: a = True
        out.append({"text": txt, "t0": w["t0"], "t1": w["t1"], "acc": a, "brk": raw.strip()[-1:] in ".,!?;:…—"})
    out = [w for w in out if not any(s <= w["t0"] < e for s, e in hide)]

    def scene_of(t):
        i = 0
        for k, sc in enumerate(scenes):
            if sc["t0"] <= t + 1e-6: i = k
        return i

    chunks, cur = [], []
    for w in out:
        si = scene_of(w["t0"])
        if cur:
            last = cur[-1]
            nch = sum(len(x["text"]) for x in cur) + len(cur) + len(w["text"])
            if (len(cur) >= maxw or nch > maxc or w["t0"] - last["t1"] > gapmax or last["brk"]
                    or scene_of(cur[0]["t0"]) != si):
                chunks.append(cur); cur = []
        cur.append(w)
    if cur: chunks.append(cur)
    res = []
    for i, ch in enumerate(chunks):
        si = scene_of(ch[0]["t0"])
        end = ch[-1]["t1"] + cfg.get("hold", 0.9)
        if i + 1 < len(chunks): end = min(end, chunks[i + 1][0]["t0"])
        end = min(end, scenes[si]["t1"] if scenes else total)
        res.append({"words": ch, "t0": ch[0]["t0"] - 0.02, "t1": end, "scene": si})
    return res


def draw_chunk(canvas, ch, t, kind, y, W, u, cfg):
    words = ch["words"]
    dark = kind == "dark"
    face = kind == "face"
    has_acc = any(w["acc"] for w in words)
    pink = cfg.get("face_accent", "blue") == "pink"
    items = []
    for w in words:
        if face:
            st = ("face_acc_pink" if pink else "face_acc") if w["acc"] else ("face_serif" if has_acc else "face")
        elif w["acc"]:
            st = "acc_dark" if dark else "acc"
        else:
            st = "white" if dark else "ink"
        items.append((w, word_img(w["text"], st, u)))
    lines = []
    if face and has_acc:
        a = [x for x in items if not x[0]["acc"]]; b = [x for x in items if x[0]["acc"]]
        lines = [l for l in (a, b) if l]
    else:
        cur, cw = [], 0
        sp = 24 * u
        for it in items:
            add = it[1][3] + (sp if cur else 0)
            if cur and cw + add > 0.88 * W:
                lines.append(cur); cur, cw = [], 0; add = it[1][3]
            cur.append(it); cw += add
        if cur: lines.append(cur)
    lh = (88 if not has_acc else 116 if face else 104) * u  # крупное слово-акцент не должно наезжать на соседнюю строку
    base0 = y - (len(lines) - 1) * lh / 2 + 30 * u
    for li, ln in enumerate(lines):
        sp = 24 * u
        tw = sum(it[1][3] for it in ln) + sp * (len(ln) - 1)
        x = W / 2 - tw / 2
        for w, wi in ln:
            k = ease_out_cubic((t - w["t0"] + 0.04) / 0.16)
            draw_word(canvas, wi, x, base0 + li * lh, k, u, 1.0)
            x += wi[3] + sp


# ---------------------------------------------------------------- цветокоррекция
# HDR с iPhone (HLG/PQ, BT.2020) без перевода в SDR выходит серым и плоским — сначала тонмаппинг hable.
# Затем «живой» цвет по референсу пользователя: светлее, кожа персиковая, стена голубая без зелени.
HDR_TM = ("zscale=tin={tin}:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,"
          "tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p")
LOOK = ("eq=gamma=1.12:contrast=1.08:saturation=0.95,curves=all='0/0 0.6/0.6 0.85/0.82 1/0.97',"
        "colorbalance=rs=-0.03:gs=-0.03:bs=0.06:rm=0.02:gm=-0.06:bm=0.05:rh=-0.02:gh=-0.02:bh=0.05,eq=saturation=1.05")


def grade_chain(src, plan):
    """plan["grade"]: true/нет — авто (HDR→SDR + LOOK); false — без цветокора; строка — свой фильтр ffmpeg после тонмаппинга."""
    g = plan.get("grade", True)
    if g is False: return ""
    tr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=color_transfer",
                         "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip().split(",")[0].strip()
    tin = {"arib-std-b67": "arib-std-b67", "smpte2084": "smpte2084"}.get(tr)
    chain = [HDR_TM.format(tin=tin)] if tin else []
    chain.append(g if isinstance(g, str) else LOOK)
    return ",".join(chain)


# ---------------------------------------------------------------- нарезка (как в «Слайдах»)
def prepare_cut(a, plan, rp, src, dur, fps, work):
    cuts = plan.get("cuts", {})
    kept_words = []
    if "keep" in cuts:
        keep = cuts["keep"]
        words = json.load(open(rp(plan["words"]), encoding="utf-8"))["words"]
        kept_words = [w for w in words if any(s <= (w["s"] + w["e"]) / 2 <= e for s, e in keep)]
    else:
        from speech import load_audio
        audio, _ = load_audio(src)
        env = envelope(audio) if cuts.get("snap", True) else None
        words = json.load(open(rp(plan["words"]), encoding="utf-8"))["words"]
        if cuts.get("takes") and env is not None:
            moved = []
            new = [[snap_bound(env, ta), snap_bound(env, tb)] for ta, tb in cuts["takes"]]
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
    sig = json.dumps([tl.keep, fps, os.path.normcase(os.path.abspath(src)), grade_chain(src, plan)]).encode()
    sig_path = cut_path + ".sig"
    if not (os.path.exists(cut_path) and os.path.exists(sig_path) and open(sig_path, "rb").read() == sig):
        fc, cat = [], ""
        for i, (s, e) in enumerate(tl.keep):
            fc.append(f"[0:v]trim={s:.4f}:{e:.4f},setpts=PTS-STARTPTS,fps={fps}[v{i}]")
            fd = min(0.015, (e - s) / 4)
            fc.append(f"[0:a]atrim={s:.4f}:{e:.4f},asetpts=PTS-STARTPTS,afade=t=in:d={fd},"
                      f"afade=t=out:st={e - s - fd:.4f}:d={fd}[a{i}]")
            cat += f"[v{i}][a{i}]"
        gr = grade_chain(src, plan)
        fc.append(f"{cat}concat=n={len(tl.keep)}:v=1:a=1[{'vc' if gr else 'v'}][a]")
        if gr: fc.append(f"[vc]{gr}[v]")
        fcp = os.path.join(work, "cut_filter.txt")
        open(fcp, "w", encoding="utf-8").write(";\n".join(fc))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-/filter_complex", fcp,
                        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "12",
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
                                       "stream=width,height,r_frame_rate:format=duration", "-of", "json", src],
                                      capture_output=True, text=True).stdout)
    SW, SH = probe["streams"][0]["width"], probe["streams"][0]["height"]
    num, den = map(int, probe["streams"][0]["r_frame_rate"].split("/"))
    fps = plan.get("fps") or min(30, round(num / den))  # образец — 30 к/с; кадры рисуются в Python, 60 не нужно
    W0, H0 = plan.get("size", [1080, 1920])  # итог всегда вертикальный 9:16, как образец
    scale = 0.5 if a.preview else 1.0
    W, H = int(W0 * scale) // 2 * 2, int(H0 * scale) // 2 * 2
    u = W / 1080
    dur = float(probe["format"]["duration"])
    work = rp(plan.get("work_dir", "_work_mani"))
    os.makedirs(work, exist_ok=True)

    tl, cut_path, words = prepare_cut(a, plan, rp, src, dur, fps, work)
    if a.cut_only:
        print("Склейка:", cut_path); return

    assets = plan.get("assets", "")
    ctx = {"W": W, "H": H, "u": u, "assets": assets, "base_dir": base_dir, "fps": fps}
    focal = plan.get("face", [0.5, 0.4])
    seg_face = None
    if focal == "auto":
        seg_face = track_faces(src, tl.keep, os.path.join(work, "faces.json"))
        focal = [0.5, 0.42]

    def focal_at(t):
        if not seg_face: return focal
        f = seg_face[tl.seg_index(t)]
        return [f[0], f[1] + plan.get("face_dy", 0.0)]

    edges = tl.starts + [tl.total]
    matte = None
    if plan.get("face_pop", True) and os.path.exists(MODEL):
        matte = Matte(MODEL)
    elif plan.get("face_pop", True):
        print("Нет модели", MODEL, "— лицо в обычной карточке, без головы над краем", flush=True)

    def to_edge(t, thr=plan.get("snap_scenes", 0.3)):
        """Смена сцены рядом со склейкой — ровно на склейку: так джамп-кат прячется под смену картинки."""
        near = [c for c in edges if abs(c - t) <= thr]
        return min(near, key=lambda c: abs(c - t)) if near else t

    # --- сцены
    bgs = {}

    def bg_of(k):
        if k not in bgs: bgs[k] = make_bg(k, W, H, assets).convert("RGBA")
        return bgs[k]

    scenes = []
    for S in plan.get("scenes", []):
        t0 = ev_time(S, tl)
        scenes.append(dict(S, t0=0.0 if t0 < 0.05 else to_edge(t0)))
    scenes.sort(key=lambda s: s["t0"])
    if not scenes or scenes[0]["t0"] > 0:
        scenes.insert(0, {"kind": "face", "t0": 0.0})
    trans_times = []
    for i, sc in enumerate(scenes):
        sc["t1"] = scenes[i + 1]["t0"] if i + 1 < len(scenes) else tl.total
        K = KINDS[sc.get("kind", "split")]
        sc["_K"] = K
        sc["_bg"] = bg_of(sc.get("bg", K["bg"])) if (sc.get("bg") or K["bg"]) else None
        sc["_face"] = sc.get("face_mode", K["face"])
        has_media = bool(sc.get("media"))
        rect = sc.get("card") or (K.get("card_head") if sc.get("head") and K.get("card_head") else K.get("card"))
        sc["_rect"] = list(rect) if has_media else None
        prev = scenes[i - 1] if i else None
        enter = sc.get("enter")
        if enter is None:
            if prev is None or "face" in (prev.get("kind"), sc.get("kind")): enter = "cut"
            elif prev.get("_rect") and sc["_rect"] and prev.get("kind") != sc.get("kind"): enter = "morph"
            else: enter = "cut"
        sc["_enter"] = enter if i else "cut"
        if sc["_enter"] == "whip": trans_times.append(sc["t0"])
        sc["_intro"] = sc.get("intro", i == 0 and bool(sc["_rect"]))
        # медиа в окне
        ms = []
        for j, M in enumerate(sc.get("media", [])):
            mt0 = sc["t0"] if j == 0 and "at" not in M and "at_out" not in M else ev_time(M, tl)
            ms.append([M, mt0])
        for j, (M, mt0) in enumerate(ms):
            mt1 = ms[j + 1][1] if j + 1 < len(ms) else sc["t1"]
            M = dict(M)
            M["marks"] = [dict(mk, _t=ev_time(mk, tl), _until=ev_time(mk, tl, "until")) for mk in M.get("marks", [])]
            if M.get("cursor"):
                M["_cursor"] = [[tl.out(p[0]) if not M.get("cursor_out") else p[0], p[1], p[2]] for p in M["cursor"]]
            obj = Media(M, ctx, mt0 if j else min(mt0, sc["t0"]), mt1)
            obj.trans = M.get("trans", "whip") if j else "none"
            if j and obj.trans == "whip": trans_times.append(mt0)
            ms[j] = obj
        sc["_media"] = ms
        if sc["_rect"] and ms and not sc.get("card") and sc.get("fit", True):
            # окно не выше, чем нужно скрину: иначе снизу пустое белое поле
            x0, y0, x1, y1 = sc["_rect"]
            cw, bar = (x1 - x0) * W, 42 * u
            need = max(m.aspect() * cw * max(1.0, min(m.d["zoom"]) if isinstance(m.d.get("zoom"), list)
                                                  else m.d.get("zoom", 1.0)) for m in ms) + bar
            have = (y1 - y0) * H
            if need < have:
                if sc.get("kind") == "dark":
                    c = (y0 + y1) / 2; y0, y1 = c - need / H / 2, c + need / H / 2
                else:
                    y1 = y0 + need / H
                sc["_rect"] = [x0, y0, x1, y1]
        if sc["_rect"]:
            sc["_sub_y"] = sc.get("sub_y", sc["_rect"][3] + K.get("sub_dy", 0.06))
        else:
            sc["_sub_y"] = sc.get("sub_y", K.get("sub_y", 0.5))
        # заголовок над окном (только split)
        hw = []
        if sc.get("head"):
            ht = [tl.out(x) for x in sc.get("head_at", [])]
            lines = sc["head"].split("\n")
            n = 0
            for li, ln in enumerate(lines):
                box = ln.startswith("[") and ln.endswith("]") and ln.count("[") == 1
                for tok in re.findall(r"\[[^\]]*\]|\S+", ln):
                    if box:
                        parts = [(tok.strip("[]"), "head_box")]
                    elif tok.startswith("["):
                        parts = [(x, "head_acc") for x in tok.strip("[]").split()]
                    else:
                        parts = [(tok, "head")]
                    for txt, st in parts:
                        tt = ht[n] if n < len(ht) else sc["t0"] + 0.1 * n
                        hw.append({"li": li, "text": txt, "st": st, "t": tt, "box": box}); n += 1
        sc["_head"] = hw

    def scene_at(t):
        i = 0
        for k, sc in enumerate(scenes):
            if sc["t0"] <= t + 1e-6: i = k
        return i

    subs_cfg = plan.get("subs", {})
    chunks = build_subs(words, scenes, subs_cfg, tl.total) if subs_cfg is not False and subs_cfg.get("on", True) else []

    # --- элементы (типы «Слайдов» + icons, sticky)
    els = []
    for E in plan.get("elements", []):
        t0 = ev_time(E, tl)
        t1 = ev_time(E, tl, "until")
        if t1 is None:
            t1 = scenes[scene_at(t0 + 1e-3)]["t1"]
        for key in list(E.keys()):
            if key in ("row_at", "word_at"):
                E["_" + key.split("_")[0] + "_local"] = [tl.out(x) - t0 for x in E[key]]
            elif key.endswith("_at") and isinstance(E[key], (int, float)):
                E["_" + key + "_local"] = tl.out(E[key]) - t0
        if E.get("strike_at") is not None: E["_strike_local"] = tl.out(E["strike_at"]) - t0
        ectx = dict(ctx, u=u)
        els.append({"d": E, "t0": t0, "t1": t1, "pos": E.get("pos", "upper"), "obj": TYPES[E["type"]](E, ectx)})

    vis = [t for t in tl.starts[1:] if scenes[scene_at(t)]["_face"] and all(abs(t - s["t0"]) > 0.02 for s in scenes)]
    print(f"Склейки на лице: {len(vis)} из {len(tl.starts) - 1}" + (": " + ", ".join(f"{t:.1f}" for t in vis[:40]) if vis else ""),
          flush=True)

    # --- отрисовка сцены
    def media_at(sc, t):
        ms = sc["_media"]
        if not ms: return None, None
        cur = 0
        for j, m in enumerate(ms):
            if m.t0 <= t + 1e-6: cur = j
        return ms[cur], (ms[cur - 1] if cur else None)

    def card_image(sc, t, cw, ch):
        m, prev = media_at(sc, t)
        content, mp, z = m.view(cw, ch, t)
        content = m.overlay(content, mp, t, u, z)
        url = m.url
        if prev is not None and m.trans in ("whip", "fade") and t - m.t0 < TR[m.trans]:
            e = ease_in_out((t - m.t0) / TR[m.trans])
            pc, pm, pz = prev.view(cw, ch, t)
            pc = prev.overlay(pc, pm, t, u, pz)
            if m.trans == "fade":
                content = Image.blend(pc, content, e)
            else:
                mix = Image.new("RGBA", (cw, ch), (255, 255, 255, 255))
                comp(mix, pc, -e * cw, 0); comp(mix, content, (1 - e) * cw, 0)
                content = hblur(mix, math.sin(math.pi * e) * 0.07 * cw)
            if e < 0.5: url = prev.url
        return window(content, url, u, int(20 * u))

    def draw_face(canvas, frame, t, sc, alpha=1.0):
        fo = focal_at(t)
        if sc["_face"] == "full":
            life = max(0.1, sc["t1"] - sc["t0"])
            z0 = sc.get("zoom", plan.get("face_zoom_full", 1.22))
            z = z0 + sc.get("push", 0.04) * clamp((t - sc["t0"]) / life)
            img = crop_cover(frame, W, H, z, (fo[0], fo[1] + sc.get("face_dy", 0.02))).convert("RGBA")
            comp(canvas, with_alpha(img, alpha), 0, 0)
        elif sc["_face"] == "card":
            pop = sc.get("pop", plan.get("face_pop", True)) and matte is not None
            fr = sc.get("face_card", FACE_CARD_POP if pop else FACE_CARD)
            x0, y0, x1, y1 = int(fr[0] * W), int(fr[1] * H), int(fr[2] * W), int(fr[3] * H)
            r = int(70 * u)
            zoom = sc.get("face_zoom", plan.get("face_zoom", 1.0))
            dy = sc.get("face_dy", plan.get("face_card_dy", 0.0 if pop else 0.04))
            # область лица — карточка плюс полоса над ней: одно кадрирование, чтобы голова и карточка совпали
            ye = max(0, y0 - int(sc.get("pop_ext", plan.get("pop_ext", POP_EXT)) * H)) if pop else y0
            big = crop_cover(frame, x1 - x0, y1 - ye, zoom, (fo[0], fo[1] + dy)).convert("RGBA")
            img = big.crop((0, y0 - ye, big.width, big.height))
            img.putalpha(rounded_mask(img.width, img.height, r))
            pad = int(40 * u)
            comp(canvas, with_alpha(shadow_layer(img.width, img.height, r, u, pad, strength=30), alpha), x0 - pad, y0 - pad)
            comp(canvas, with_alpha(img, alpha), x0, y0)
            if pop:
                m = matte(big, (round(t, 4), big.size, x0, ye))  # ключ — время кадра: id() кадров переиспользуется
                keep = Image.new("L", big.size, 255)  # голова рисуется только там, где нет карточки
                ImageDraw.Draw(keep).rounded_rectangle([0, y0 - ye, big.width - 1, big.height + r], r, fill=0)
                fe = max(1, int(0.05 * big.height))  # верх полосы растушёван — если волосы выше, без резкого среза
                ramp = Image.linear_gradient("L").resize((big.width, fe))
                keep.paste(Image.composite(ramp, Image.new("L", ramp.size, 0), ramp), (0, 0))
                person = big.copy()
                person.putalpha(Image.fromarray((np.asarray(m, np.uint16) * np.asarray(keep, np.uint16) // 255).astype(np.uint8)))
                comp(canvas, with_alpha(person, alpha), x0, ye)

    def render_scene(sc, frame, t, rect=None):
        canvas = (sc["_bg"].copy() if sc["_bg"] is not None else Image.new("RGBA", (W, H), (0, 0, 0, 255)))
        if sc["_face"]:
            draw_face(canvas, frame, t, sc)
        # заголовок
        if sc["_head"]:
            lines = {}
            for hw_ in sc["_head"]: lines.setdefault(hw_["li"], []).append(hw_)
            hy = sc.get("head_y", 0.13) * H
            lh = 100 * u
            for li, ws in sorted(lines.items()):
                imgs = [word_img(w["text"], w["st"], u) for w in ws]
                sp = 18 * u
                tw = sum(i[3] for i in imgs) + sp * (len(imgs) - 1)
                x = W / 2 - tw / 2
                base = hy + li * lh
                if ws[0]["box"]:
                    k = ease_out_cubic((t - ws[0]["t"]) / 0.22)
                    if k > 0:
                        bbs = [i[0].getbbox() for i in imgs]
                        top = min(b[1] - i[2] for b, i in zip(bbs, imgs))
                        bot = max(b[3] - i[2] for b, i in zip(bbs, imgs))
                        bw = (tw + 40 * u) * lerp(0.85, 1, k)
                        bh = bot - top + 22 * u
                        box = Image.new("RGBA", (int(bw), int(bh)), PAL["box"] + (255,))
                        box.putalpha(rounded_mask(box.width, box.height, int(6 * u)).point(lambda v: int(v * k)))
                        comp(canvas, box, W / 2 - bw / 2, base + top - 11 * u)
                for w, wi in zip(ws, imgs):
                    draw_word(canvas, wi, x, base, ease_out_cubic((t - w["t"] + 0.04) / 0.16), u)
                    x += wi[3] + sp
        # окно
        r_ = rect or sc["_rect"]
        if r_ and sc["_media"]:
            x0, y0, x1, y1 = r_[0] * W, r_[1] * H, r_[2] * W, r_[3] * H
            cw = int(x1 - x0)
            ch = int(y1 - y0) - int(42 * u)
            win, pad = card_image(sc, t, cw, max(10, ch))
            if sc["_intro"] and t - sc["t0"] < 0.4:
                k = ease_out_cubic((t - sc["t0"]) / 0.4)
                s = lerp(0.94, 1.0, k)
                win = win.resize((int(win.width * s), int(win.height * s)), Image.BILINEAR)
                if k < 0.95: win = win.filter(ImageFilter.GaussianBlur((1 - k) * 14 * u))
                win = with_alpha(win, k)
                comp(canvas, win, (x0 + x1) / 2 - win.width / 2, (y0 + y1) / 2 - win.height / 2)
            else:
                comp(canvas, win, x0 - pad, y0 - pad)
        # субтитры
        kind = sc.get("kind", "split")
        si = scenes.index(sc)
        for chn in chunks:
            if chn["scene"] == si and chn["t0"] <= t < chn["t1"]:
                draw_chunk(canvas, chn, t, kind if sc["_bg"] is not None or kind == "face" else "face",
                           sc["_sub_y"] * H, W, u, subs_cfg)
        return canvas

    def compose(frame, t):
        i = scene_at(t)
        sc = scenes[i]
        en = sc["_enter"]
        p = (t - sc["t0"]) / TR.get(en, 1)
        if i and en in TR and p < 1:
            prev = scenes[i - 1]
            e = ease_in_out(p)
            if en == "morph" and not (prev["_rect"] and sc["_rect"]):
                en = "fade"
            if en == "morph":
                rect = [lerp(x, y, e) for x, y in zip(prev["_rect"], sc["_rect"])]
                A = render_scene(prev, frame, t, rect); B = render_scene(sc, frame, t, rect)
                canvas = Image.blend(A, B, e)
            elif en == "fade":
                canvas = Image.blend(render_scene(prev, frame, t), render_scene(sc, frame, t), e)
            else:  # whip: старая сцена уезжает влево, новая въезжает справа, с размытием движения
                A, B = render_scene(prev, frame, t), render_scene(sc, frame, t)
                canvas = Image.new("RGBA", (W, H), (0, 0, 0, 255))
                comp(canvas, A, -e * W, 0); comp(canvas, B, (1 - e) * W, 0)
                canvas = hblur(canvas, math.sin(math.pi * e) * 0.06 * W)
        else:
            canvas = render_scene(sc, frame, t)
        for e_ in els:
            if not (e_["t0"] <= t < e_["t1"]): continue
            tl_ = t - e_["t0"]
            obj, d = e_["obj"], e_["d"]
            life = e_["t1"] - e_["t0"]
            img = obj.image(tl_)
            s, al, dx, dy = obj.transform(tl_, life)
            if al <= 0.01: continue
            if abs(s - 1) > 0.004:
                img = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.BILINEAR)
            b = obj.blur(tl_, life)
            if b > 0.6: img = img.filter(ImageFilter.GaussianBlur(b))
            img = with_alpha(img, al)
            pos = e_["pos"]
            cx, cy = (pos[0] * W, pos[1] * H) if isinstance(pos, list) else (W / 2, POS.get(pos, 0.25) * H)
            if d.get("x") is not None: cx = d["x"] * W
            comp(canvas, img, cx - img.width / 2 + dx, cy - img.height / 2 + dy)
        return canvas.convert("RGB")

    def read_frame(ts):
        raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{ts:.3f}", "-i", cut_path, "-frames:v", "1",
                              "-vf", f"scale={SW}:{SH}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
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
        if not os.path.exists(vid_tmp): sys.exit("Нет готовой картинки _work/video_only.mp4 — сначала полный рендер.")
        t_start, t_end = 0.0, min(tl.total, float(json.loads(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", vid_tmp],
            capture_output=True, text=True).stdout)["format"]["duration"]))
    else:
        # кадр исходника — в его размере: лицо кадрируется из полного кадра, итог W×H собирается в compose
        class _A: pass
        aa = _A(); aa.preview = a.preview
        render_video_src(aa, cut_path, vid_tmp, SW, SH, W, H, fps, t_start, t_end, compose)
    plan2 = dict(plan, layout_sfx=plan.get("whip_sfx"))
    audio_mix(a, plan2, ctx, els, [{"t0": t} for t in trans_times], work, rp, cut_path, vid_tmp, t_start, t_end)


def render_video_src(a, cut_path, vid_tmp, SW, SH, W, H, fps, t_start, t_end, compose):
    rd = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-ss", f"{t_start:.3f}", "-t", f"{t_end - t_start:.3f}",
                           "-i", cut_path, "-vf", f"fps={fps}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                          stdout=subprocess.PIPE)
    wr = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", "veryfast" if a.preview else "medium",
                           "-crf", "23" if a.preview else "17", "-pix_fmt", "yuv420p", vid_tmp], stdin=subprocess.PIPE)
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
