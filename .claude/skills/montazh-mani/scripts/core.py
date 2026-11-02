"""Общее ядро (копия render.py из скилла «Слайды»): нарезка, элементы, звук. Стиль «Мани» импортирует его из render.py.

python render.py plan.json                      # полный рендер
python render.py plan.json --preview            # половинное разрешение, 30 fps
python render.py plan.json --start 10 --end 20  # кусок (секунды ИТОГОВОГО ролика)
python render.py plan.json --still 3.2,7.5      # PNG-кадры + общая сетка stills.jpg, без видео

Время в плане ("at", "until", "row_at", "word_at", "strike_at") — секунды ИСХОДНИКА (как в words.json).
"at_out" / "until_out" — секунды итогового ролика, если так удобнее.
"""
import argparse, json, math, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # speech.py рядом

# ---------------------------------------------------------------- дизайн-система
COL = {
    "ink": (15, 18, 32), "gray": (134, 137, 154), "muted": (190, 196, 206), "line": (229, 233, 241),
    "white": (255, 255, 255), "bg": (238, 242, 249), "blue": (32, 98, 238), "green": (40, 190, 100),
    "red": (240, 68, 56), "orange": (240, 120, 60), "claude": (217, 119, 87), "yellow": (255, 196, 0),
    "purple": (124, 92, 250), "black": (15, 18, 32), "chip": (243, 245, 249),
}
FONT_FILES = {
    "heavy": ["SF-Pro-Display-Heavy.otf", "SF-Pro-Display-Black.otf", "Montserrat-Black.ttf", "segoeuib.ttf"],
    "bold": ["SFPRODISPLAYBOLD.OTF", "Montserrat-Bold.ttf", "segoeuib.ttf"],
    "semi": ["SF-Pro-Display-Semibold.otf", "Inter-SemiBold.ttf", "segoeuib.ttf"],
    "med": ["SFPRODISPLAYMEDIUM.OTF", "Inter-Medium.ttf", "segoeui.ttf"],
    "reg": ["SFPRODISPLAYREGULAR.OTF", "Inter-Regular.ttf", "segoeui.ttf"],
    "title": ["Rubik-Bold.ttf", "Montserrat-Black.ttf", "segoeuib.ttf"],
    "mono": ["consola.ttf", "consolab.ttf"],
    "emoji": ["seguiemj.ttf"],
}
TRACK = {"heavy": -0.035, "bold": -0.015, "semi": -0.008}  # трекинг в долях кегля: жирные заголовки плотные
FONT_DIRS = [r"C:\Windows\Fonts", os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Windows\Fonts")]
_fcache, _ecache = {}, {}


def font(kind, size):
    key = (kind, int(size))
    if key not in _fcache:
        for name in FONT_FILES[kind]:
            for d in FONT_DIRS:
                p = os.path.join(d, name)
                if os.path.exists(p):
                    _fcache[key] = ImageFont.truetype(p, max(1, int(size)))
                    break
            if key in _fcache:
                break
        else:
            _fcache[key] = ImageFont.load_default()
    return _fcache[key]


def col(c, a=255):
    if isinstance(c, str):
        if c.startswith("#"):
            c = tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))
        else:
            c = COL[c]
    return tuple(c[:3]) + (a,)


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out_cubic(t):
    t = clamp(t); return 1 - (1 - t) ** 3


def ease_in_out(t):
    t = clamp(t); return 3 * t * t - 2 * t * t * t


def spring(t):
    """Пружина с лёгким перелётом: 0 -> 1 примерно за 1.0 (t в долях)."""
    if t <= 0: return 0.0
    if t >= 1: return 1.0
    return 1 - math.exp(-6.5 * t) * math.cos(9.5 * t)


def lerp(a, b, t):
    return a + (b - a) * t


# ---------------------------------------------------------------- рисование
def comp(dst, src, x, y):
    """alpha_composite с обрезкой по краям холста (координаты могут быть отрицательными)."""
    x, y = int(round(x)), int(round(y))
    sx, sy = max(0, -x), max(0, -y)
    if sx or sy:
        src = src.crop((sx, sy, src.width, src.height)); x += sx; y += sy
    if x >= dst.width or y >= dst.height or src.width <= 0 or src.height <= 0: return
    if x + src.width > dst.width or y + src.height > dst.height:
        src = src.crop((0, 0, min(src.width, dst.width - x), min(src.height, dst.height - y)))
    dst.alpha_composite(src, (x, y))


def with_alpha(im, a):
    if a >= 0.999: return im
    im = im.copy(); im.putalpha(im.getchannel("A").point(lambda v: int(v * max(0.0, a))))
    return im


def rounded_mask(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255)
    return m


def shadow_layer(w, h, r, u, pad, strength=46, offy=16, blur=32):
    sh = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([pad, pad + offy * u, pad + w, pad + h + offy * u], r,
                                         fill=(30, 45, 90, strength))
    return sh.filter(ImageFilter.GaussianBlur(blur * u))


def card_canvas(w, h, r, u, fill="white", shadow=True, strength=34, outline=None, ow=3):
    """RGBA-холст карточки с мягкой тенью. Возвращает (img, pad) — контент рисовать от (pad, pad)."""
    pad = int(60 * u)
    img = shadow_layer(w, h, r, u, pad, strength) if shadow else Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([pad, pad, pad + w, pad + h], r, fill=col(fill),
                                          outline=col(outline) if outline else None, width=max(1, int(ow * u)))
    return img, pad


def wrap(text, fnt, maxw):
    lines = []
    for para in str(text).split("\n"):
        cur = ""
        for word in para.split(" "):
            test = (cur + " " + word).strip()
            if fnt.getlength(test) <= maxw or not cur:
                cur = test
            else:
                lines.append(cur); cur = word
        lines.append(cur)
    return lines


def fmt_num(n, dec=0):
    return f"{n:,.{dec}f}".replace(",", " ")


# ---------------------------------------------------------------- текст: трекинг, [акцент], эмодзи
EMOJI_RE = re.compile("[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\u2300-\u23FF]")


def is_emoji(ch):
    return bool(EMOJI_RE.match(ch))


def clean(s):
    return str(s).replace("\ufe0f", "").replace("\u200d", "")


def emoji_img(ch, size):
    key = (ch, int(size))
    if key not in _ecache:
        im = Image.new("RGBA", (int(size * 1.7), int(size * 1.7)), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((int(size * 0.25), int(size * 0.25)), ch, font=font("emoji", size), embedded_color=True)
        bb = im.getbbox()
        _ecache[key] = im.crop(bb) if bb else im
    return _ecache[key]


def parse_rich(text):
    """'[синее] слово\\nвторая' -> строки -> слова -> куски (текст, акцент)."""
    lines, words, runs, cur, acc = [], [], [], [], False

    def flush_run():
        if cur: runs.append(("".join(cur), acc)); cur.clear()

    def flush_word():
        flush_run()
        if runs: words.append(list(runs)); runs.clear()

    for ch in clean(text):
        if ch == "[": flush_run(); acc = True
        elif ch == "]": flush_run(); acc = False
        elif ch == " ": flush_word()
        elif ch == "\n": flush_word(); lines.append(list(words)); words.clear()
        else: cur.append(ch)
    flush_word(); lines.append(list(words))
    # «500 ₽», «14 %», «лет —» не разрываются переносом: такой хвост приклеивается к предыдущему слову
    for ln in lines:
        i = 1
        while i < len(ln):
            if ln[i][0][0][:1] in GLUE:
                ln[i - 1] = ln[i - 1] + [(" ", ln[i][0][1])] + ln[i]
                del ln[i]
            else:
                i += 1
    return lines


GLUE = set("₽$€%—–→")


class Rich:
    """Блок текста: плотный трекинг, [акцент] в квадратных скобках, цветные эмодзи, перенос по ширине."""

    def __init__(self, text, kind, size, maxw, color="ink", accent="blue", align="center", lh=1.1):
        self.f, self.size = font(kind, size), size
        self.es = int(size * 0.9)
        self.tr = TRACK.get(kind, 0) * size
        self.color, self.accent, self.align = color, accent, align
        self.space = self.f.getlength(" ") * 0.85
        self.lines = []
        for para in parse_rich(text):
            cur, cw = [], 0.0
            for wd in para:
                ww = sum(self.slen(s) for s, _ in wd)
                add = ww + (self.space if cur else 0)
                if cur and cw + add > maxw:
                    self.lines.append((cur, cw)); cur, cw = [wd], ww
                else:
                    cur.append(wd); cw += add
            self.lines.append((cur, cw))
        self.asc, self.desc = self.f.getmetrics()
        self.lh = int(size * lh)
        self.w = int(max(cw for _, cw in self.lines)) + 8
        self.h = self.lh * (len(self.lines) - 1) + self.asc + self.desc + 8
        self.n = sum(len(l) for l, _ in self.lines)

    def clen(self, ch):
        if is_emoji(ch):
            return emoji_img(ch, self.es).width + self.size * 0.1
        return self.f.getlength(ch) + self.tr

    def slen(self, s):
        return sum(self.clen(c) for c in s)

    def _run(self, img, x, base, s, color, k):
        w, h = int(self.slen(s)) + 12, self.asc + self.desc + 8
        m = Image.new("L", (w, h), 0)
        md = ImageDraw.Draw(m)
        cx, emo = 4.0, []
        for ch in s:
            if is_emoji(ch):
                emo.append((cx, ch))
            else:
                md.text((cx, 4 + self.asc), ch, font=self.f, fill=255, anchor="ls")
            cx += self.clen(ch)
        if k < 0.999:
            m = m.point(lambda v: int(v * k))
        layer = Image.new("RGBA", (w, h), col(color)[:3] + (0,))
        layer.putalpha(m)
        comp(img, layer, x - 4, base - self.asc - 4)
        for ex, ch in emo:
            e = with_alpha(emoji_img(ch, self.es), k)
            comp(img, e, x - 4 + ex + self.size * 0.05, base - e.height + self.size * 0.1)

    def draw(self, img, x, y, word_k=None, rise=0.0, strike=0.0, strike_color="red"):
        """x, y — левый верх блока. word_k(i) -> 0..1 — пословное появление."""
        i = 0
        for li, (words, cw) in enumerate(self.lines):
            free = self.w - 8 - cw
            lx = x + 4 + (free / 2 if self.align == "center" else free if self.align == "right" else 0)
            x0, base = lx, y + 4 + self.asc + li * self.lh
            for wd in words:
                k = 1.0 if word_k is None else clamp(word_k(i))
                for s, acc in wd:
                    if k > 0:
                        self._run(img, lx, base + (1 - k) * rise, s, self.accent if acc else self.color, k)
                    lx += self.slen(s)
                lx += self.space; i += 1
            if strike > 0 and words:
                yy = base - self.asc * 0.34
                ImageDraw.Draw(img).line([(x0 - self.size * 0.04, yy), (x0 + (cw + self.size * 0.08) * strike, yy)],
                                         fill=col(strike_color), width=max(3, int(self.size * 0.07)))

    def render(self, **kw):
        img = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        self.draw(img, 0, 0, **kw)
        return img


def soft_shadow(img, u, blur=14, a=0.55):
    """Тёмный ореол под белым текстом поверх видео."""
    pad = int(40 * u)
    big = Image.new("RGBA", (img.width + 2 * pad, img.height + 2 * pad), (0, 0, 0, 0))
    big.alpha_composite(img, (pad, pad))
    sh = Image.new("RGBA", big.size, (0, 0, 0, 0))
    sh.putalpha(big.getchannel("A").filter(ImageFilter.GaussianBlur(blur * u)).point(lambda v: int(v * a)))
    sh.alpha_composite(big)
    return sh


def burst(size, color="white"):
    """Значок-«звёздочка» (как у Claude), рисуется лучами."""
    s = int(size)
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    c, r = s / 2, s * 0.46
    for i in range(12):
        a = i * math.pi / 6 + 0.13 * (i % 3)
        rr = r * (0.82 + 0.18 * ((i * 7) % 3) / 2)
        dr.line([(c, c), (c + math.cos(a) * rr, c + math.sin(a) * rr)], fill=col(color), width=max(2, int(s * 0.09)))
    return im


def icon_tile(spec, size, u, color="claude"):
    """Квадратная иконка приложения: эмодзи, «burst», буквы или PNG (src)."""
    s = int(size)
    tile = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(tile).rounded_rectangle([0, 0, s - 1, s - 1], int(s * 0.24), fill=col(color))
    g = spec or "burst"
    if g == "burst":
        b = burst(s * 0.62); tile.alpha_composite(b, ((s - b.width) // 2, (s - b.height) // 2))
    elif is_emoji(clean(g)[0]):
        e = emoji_img(clean(g)[0], int(s * 0.58)); tile.alpha_composite(e, ((s - e.width) // 2, (s - e.height) // 2))
    else:
        ImageDraw.Draw(tile).text((s / 2, s / 2), g, font=font("heavy", s * 0.42), fill=col("white"), anchor="mm")
    return tile


# ---------------------------------------------------------------- элементы
class Element:
    """Базовый элемент: проявляется из размытия с лёгким подъёмом, уходит в размытие и прозрачность."""
    appear = 0.24
    vanish = 0.22
    rise = 18
    blur_px = 14
    vscale = 1.6     # в вертикали всё крупнее: размеры в плане заданы как для горизонтали 1920
    dynamic = False  # True — перерисовывать в каждом кадре, пока идёт анимация

    def __init__(self, d, ctx):
        self.d, self.ctx = d, ctx
        self.W, self.H = ctx["W"], ctx["H"]
        self.vert = self.H > self.W
        self.u = ctx["u"] * (self.vscale if self.vert else 1.0)
        self.appear = d.get("appear", self.appear)
        self._static = None

    def wpx(self, horiz, vert):
        return int(self.d.get("width", vert if self.vert else horiz) * self.W)

    def row_times(self, n, stagger=0.45, first=0.0):
        rt = list(self.d.get("_row_local") or [])
        return [rt[i] if i < len(rt) else (rt[-1] + (i - len(rt) + 1) * stagger if rt else first + i * stagger)
                for i in range(n)]

    def draw(self, tl):  # tl — секунды с момента появления
        raise NotImplementedError

    def image(self, tl):
        anim = self.d.get("anim_time", max([2.5] + [x + 0.6 for x in self.d.get("_row_local", [])]))
        if self.dynamic and tl < anim:
            return self.draw(tl)
        if self._static is None:
            self._static = self.draw(99.0)
        return self._static

    def _k(self, tl, life):
        return ease_out_cubic(tl / max(0.01, self.appear)), clamp((tl - (life - self.vanish)) / self.vanish)

    def transform(self, tl, life):
        """-> (scale, alpha, dx, dy) для времени tl из life секунд."""
        k, o = self._k(tl, life)
        return lerp(0.965, 1.0, k), k * (1 - ease_in_out(o)), 0, lerp(self.rise * self.u, 0, k)

    def blur(self, tl, life):
        k, o = self._k(tl, life)
        return max(1 - k, o) * self.blur_px * self.u


class Card(Element):
    """Белая карточка: label-плашка сверху, title серым, строки «название — значение», прогресс-бар."""
    dynamic = True
    vscale = 1.0  # элементы из «Мягкого интерфейса» уже рассчитаны на вертикаль

    def draw(self, tl):
        d, u, W = self.d, self.u, self.W
        w = int(d.get("width", 0.8) * W)
        p = int(40 * u)
        title_f, row_f, val_f = font("semi", 28 * u), font("reg", 40 * u), font("bold", 50 * u)
        RH = int(80 * u)
        big_f = font("bold", d.get("big_size", 72) * u)
        rows = d.get("rows", [])
        h = p
        if d.get("title"): h += int(40 * u)
        if d.get("big"): h += int(d.get("big_size", 72) * 1.15 * u)
        h += len(rows) * RH
        if d.get("progress"): h += int(60 * u)
        if d.get("note"): h += int(44 * u)
        h += p - int(8 * u)
        lab_h = int(52 * u) if d.get("label") else 0
        img, pad = card_canvas(w, h, int(28 * u), u)
        if lab_h:
            big = Image.new("RGBA", (img.width, img.height + lab_h), (0, 0, 0, 0))
            big.paste(img, (0, lab_h)); img = big
        dr = ImageDraw.Draw(img)
        x0, y = pad + p, pad + lab_h + p
        if lab_h:
            lf = font("semi", 24 * u)
            lw = int(lf.getlength(d["label"]) + 36 * u)
            dr.rounded_rectangle([pad + w // 2 - lw // 2, pad - int(4 * u), pad + w // 2 + lw // 2, pad + int(40 * u)],
                                 int(20 * u), fill=col("ink"))
            dr.text((pad + w // 2, pad + int(18 * u)), d["label"], font=lf, fill=col("white"), anchor="mm")
        if d.get("title"):
            dr.text((x0, y), d["title"].upper(), font=title_f, fill=col("gray"), anchor="lt"); y += int(40 * u)
        if d.get("big"):
            dr.text((x0, y), str(d["big"]), font=big_f, fill=col(d.get("big_color", "ink")), anchor="lt")
            y += int(d.get("big_size", 72) * 1.15 * u)
        row_t = self.row_times(len(rows), d.get("stagger", 0.28), 0.25)
        for i, r in enumerate(rows):
            k = ease_out_cubic((tl - row_t[i]) / 0.3)
            if k <= 0: y += RH; continue
            yy = y + int((1 - k) * 14 * u) + RH // 2
            dr.text((x0, yy), r[0], font=row_f, fill=col("gray"), anchor="lm")
            if len(r) > 1:
                dr.text((pad + w - p, yy), r[1], font=val_f, fill=col(r[2] if len(r) > 2 else "ink"), anchor="rm")
            if i < len(rows) - 1:
                dr.line([x0, y + RH - 1, pad + w - p, y + RH - 1], fill=col("line"), width=max(1, int(2 * u)))
            y += RH
        if d.get("progress"):
            pr = d["progress"]
            y += int(18 * u)
            bh = int(16 * u)
            dr.rounded_rectangle([x0, y, pad + w - p, y + bh], bh // 2, fill=col("line"))
            k = ease_in_out((tl - pr.get("delay", 0.4)) / pr.get("time", 0.9))
            v = lerp(pr.get("from", 0.0), pr["value"], k)
            if v > 0.01:
                dr.rounded_rectangle([x0, y, x0 + int((w - 2 * p) * v), y + bh], bh // 2, fill=col(pr.get("color", "blue")))
            y += int(42 * u)
        if d.get("note"):
            dr.text((x0, y + int(8 * u)), d["note"], font=font("reg", 26 * u), fill=col("gray"), anchor="lt")
        return img


class Counter(Element):
    """Карточка со счётчиком: число бежит from -> to, внизу растущий график и плашка-дельта."""
    dynamic = True
    vscale = 1.0

    def draw(self, tl):
        d, u, W = self.d, self.u, self.W
        w = int(d.get("width", 0.62) * W)
        h = int(250 * u)
        img, pad = card_canvas(w, h, int(28 * u), u)
        dr = ImageDraw.Draw(img)
        x0, y0 = pad + int(36 * u), pad + int(34 * u)
        acc = d.get("color", "red")
        dr.ellipse([x0 + int(4 * u), y0 + int(2 * u), x0 + int(26 * u), y0 + int(24 * u)], fill=col(acc))
        dr.text((x0 + int(46 * u), y0 + int(12 * u)), d.get("caption", ""), font=font("semi", 26 * u), fill=col("gray"), anchor="lm")
        k = ease_out_cubic((tl - 0.3) / d.get("count_time", 1.3))
        n = lerp(d.get("from", 0), d.get("to", 1000), k)
        txt = d.get("prefix", "") + fmt_num(n, d.get("decimals", 0)) + d.get("suffix", "")
        dr.text((x0, y0 + int(48 * u)), txt, font=font("heavy", 84 * u), fill=col("ink"), anchor="lt")
        if d.get("delta") and k > 0.95:
            dx = x0 + int(46 * u) + int(font("semi", 26 * u).getlength(d.get("caption", ""))) + int(16 * u)
            dr.text((dx, y0 + int(12 * u)), d["delta"], font=font("bold", 26 * u), fill=col("green"), anchor="lm")
        gx0, gx1, gy = x0, pad + w - int(36 * u), pad + h - int(40 * u)
        pts = [(lerp(gx0, gx1, i / 20), gy - (i / 20) ** 1.6 * 34 * u - math.sin(i * 1.7) * 4 * u) for i in range(21)]
        m = max(2, int(len(pts) * k))
        dr.line(pts[:m], fill=col("green"), width=max(2, int(5 * u)), joint="curve")
        return img


class Pill(Element):
    """Плашка-капсула: синяя «переделай», зелёная «длинное — в скиллы». "angle" — наклон в градусах."""
    color = "blue"

    def draw(self, tl):
        d, u = self.d, self.u
        size = d.get("size", 26) * u
        r = Rich(d["text"], d.get("font", "semi"), size, self.W * 0.9, d.get("text_color", "white"), d.get("accent", "yellow"))
        h = int(size * 1.9)
        w = r.w + int(40 * u)
        img, pad = card_canvas(w, h, h // 2, u, fill=d.get("color", self.color), strength=26)
        r.draw(img, pad + (w - r.w) // 2, pad + (h - r.h) // 2)
        if d.get("angle"):
            img = img.rotate(d["angle"], resample=Image.BICUBIC, expand=True)
        return img


class Note(Pill):
    """Тёмная подпись-вывод под скриншотом: «официально: до 200 строк»."""
    color = "ink"


class Bubble(Element):
    """Сообщение в чате: синее — «я», тёмное — собеседник/модель. "caption" — мелкая подпись сверху."""

    def draw(self, tl):
        d, u = self.d, self.u
        size = d.get("size", 28) * u
        mine = d.get("side", "me") == "me"
        r = Rich(d["text"], "semi", size, self.wpx(0.4, 0.7), "white", "yellow", "left", lh=1.25)
        w, h = r.w + int(36 * u), r.h + int(22 * u)
        img, pad = card_canvas(w, h, int(min(h // 2, 26 * u)), u, fill="blue" if mine else "ink", strength=24)
        r.draw(img, pad + int(18 * u), pad + int(11 * u))
        if d.get("caption"):
            cf = font("med", 18 * u)
            big = Image.new("RGBA", (img.width, img.height + int(30 * u)), (0, 0, 0, 0))
            big.alpha_composite(img, (0, int(30 * u)))
            ImageDraw.Draw(big).text((pad + (w if mine else 0), pad + int(14 * u)), d["caption"], font=cf,
                                     fill=col("gray"), anchor="rm" if mine else "lm")
            img = big
        return img


class Headline(Element):
    """Крупный текст на слайде: «1% — три строчки», «не [предмет] — а результат». strike_at — зачеркнуть."""
    dynamic = True

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        u = self.u
        self.r = Rich(d["text"], d.get("font", "heavy"), d.get("size", 72) * u, self.wpx(0.84, 0.86),
                      d.get("color", "ink"), d.get("accent", "blue"), d.get("align", "center"), d.get("lh", 1.1))
        self.sub = Rich(d["sub"], "semi", d.get("sub_size", 30) * u, self.wpx(0.84, 0.86), d.get("sub_color", "blue"),
                        "ink") if d.get("sub") else None
        st = d.get("_strike_local")
        d.setdefault("anim_time", st + 0.4 if st is not None else 0)

    def draw(self, tl):
        st = self.d.get("_strike_local")
        k = ease_out_cubic((tl - st) / 0.3) if st is not None else 0.0
        gap = int(18 * self.u)
        w = max(self.r.w, self.sub.w if self.sub else 0)
        img = Image.new("RGBA", (w, self.r.h + (self.sub.h + gap if self.sub else 0)), (0, 0, 0, 0))
        al = self.r.align
        self.r.draw(img, (w - self.r.w) // 2 if al == "center" else 0, 0, strike=k)
        if self.sub:
            self.sub.draw(img, (w - self.sub.w) // 2, self.r.h + gap)
        return img


class Chapter(Element):
    """Глава: маленькая плашка «привычка 1 из 7» и крупный заголовок в 1–2 строки."""

    def draw(self, tl):
        d, u = self.d, self.u
        r = Rich(d["text"], "heavy", d.get("size", 92) * u, self.wpx(0.8, 0.86), d.get("color", "ink"), d.get("accent", "blue"))
        lab = d.get("label")
        lw = lh = gap = 0
        if lab:
            lf = font("med", 25 * u)
            lw, lh, gap = int(lf.getlength(lab) + 66 * u), int(44 * u), int(18 * u)
        w = max(r.w, lw) + 4
        img = Image.new("RGBA", (w, r.h + lh + gap), (0, 0, 0, 0))
        if lab:
            dr = ImageDraw.Draw(img)
            x0 = (w - lw) // 2
            dr.rounded_rectangle([x0, 0, x0 + lw, lh], lh // 2, fill=(255, 255, 255, 235), outline=col("line"),
                                 width=max(1, int(2 * u)))
            cx, cy, rr = x0 + int(22 * u), lh // 2, int(6 * u)
            dr.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=col("gray"), width=max(1, int(2 * u)))
            dr.text((x0 + int(38 * u), lh // 2), lab, font=lf, fill=col("gray"), anchor="lm")
        r.draw(img, (w - r.w) // 2, lh + gap)
        return img


class BigWord(Element):
    """Огромное слово: мелкая серая подпись сверху, синяя строка снизу. «ПРИКАЗ» / «просьба»."""
    dynamic = True

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        u = self.u
        size, maxw = d.get("size", 230) * u, self.wpx(0.9, 0.9)
        while size > 40 and Rich(d["text"], "heavy", size, 1e9).w > maxw:
            size *= 0.95
        self.r = Rich(d["text"], "heavy", size, 1e9, d.get("color", "ink"), d.get("accent", "blue"))
        self.lab = Rich(d["label"], "med", 30 * u, maxw, "gray") if d.get("label") else None
        self.sub = Rich(d["sub"], "semi", 34 * u, maxw, d.get("sub_color", "blue")) if d.get("sub") else None
        st = d.get("_strike_local")
        d.setdefault("anim_time", st + 0.4 if st is not None else 0)

    def draw(self, tl):
        st = self.d.get("_strike_local")
        k = ease_out_cubic((tl - st) / 0.3) if st is not None else 0.0
        parts = [p for p in (self.lab, self.r, self.sub) if p]
        gap = int(10 * self.u)
        w = max(p.w for p in parts)
        img = Image.new("RGBA", (w, sum(p.h for p in parts) + gap * (len(parts) - 1)), (0, 0, 0, 0))
        y = 0
        for p in parts:
            p.draw(img, (w - p.w) // 2, y, strike=k if p is self.r else 0)
            y += p.h + gap
        return img


class Words(Element):
    """Фраза по словам (как на синем слайде): каждое слово проявляется и чуть поднимается.
    word_at — время каждого слова (исходник), иначе "stagger"."""
    dynamic = True
    appear = 0.05

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        self.r = Rich(d["text"], d.get("font", "heavy"), d.get("size", 64) * self.u, self.wpx(0.84, 0.86),
                      d.get("color", "ink"), d.get("accent", "blue"), d.get("align", "center"))
        wl = d.get("_word_local") or []
        st = d.get("stagger", 0.12)
        self.times = [wl[i] if i < len(wl) else (wl[-1] + (i - len(wl) + 1) * st if wl else i * st) for i in range(self.r.n)]
        d.setdefault("anim_time", (max(self.times) if self.times else 0) + 0.3)

    def draw(self, tl):
        return self.r.render(word_k=lambda i: ease_out_cubic((tl - self.times[i]) / 0.2), rise=12 * self.u)


class Caption(Element):
    """Крупный белый текст поверх лица с мягкой тенью: «отчёт по заявкам», «всем денег»."""
    vscale = 1.1

    def draw(self, tl):
        d, u = self.d, self.u
        r = Rich(d["text"], d.get("font", "heavy"), d.get("size", 76) * u, self.wpx(0.7, 0.84), d.get("color", "white"),
                 d.get("accent", "yellow"), "center", lh=1.0)
        return soft_shadow(r.render(), u)


class Tag(Element):
    """Маленькая белая плашка-тег поверх видео («☆ ролики западных авторов»). Въезжает сбоку ("from")."""

    def draw(self, tl):
        d, u = self.d, self.u
        size = d.get("size", 27) * u
        r = Rich((d["icon"] + " " if d.get("icon") else "") + d["text"], "semi", size, self.W, d.get("color", "ink"))
        h = int(size * 2.0)
        w = r.w + int(34 * u)
        img, pad = card_canvas(w, h, h // 2, u, fill="white", strength=40)
        r.draw(img, pad + (w - r.w) // 2, pad + (h - r.h) // 2)
        return img

    def transform(self, tl, life):
        s, a, _, _ = super().transform(tl, life)
        side = -1 if self.d.get("from", "right") == "left" else 1
        return s, a, side * (1 - ease_out_cubic(tl / 0.35)) * 140 * self.u, 0


class AppIcon(Element):
    """Иконка приложения поверх видео + белая подпись: оранжевая «звёздочка» и «вся рутина».
    glyph: "burst" | эмодзи | буквы; src — PNG; color — цвет плитки."""
    vscale = 1.3

    def draw(self, tl):
        d, u = self.d, self.u
        s = int(d.get("size", 150) * u)
        if d.get("src"):
            p = d["src"] if os.path.isabs(d["src"]) else os.path.join(self.ctx["assets"], d["src"])
            tile = Image.open(p).convert("RGBA").resize((s, s), Image.LANCZOS)
            tile.putalpha(Image.composite(tile.getchannel("A"), Image.new("L", (s, s), 0), rounded_mask(s, s, int(s * 0.24))))
        else:
            tile = icon_tile(d.get("glyph"), s, u, d.get("color", "claude"))
        pad = int(60 * u)
        sh = shadow_layer(s, s, int(s * 0.24), u, pad, strength=50)
        sh.alpha_composite(tile, (pad, pad))
        if not d.get("caption"):
            return sh
        cap = Caption({"text": d["caption"], "size": d.get("caption_size", 40)}, self.ctx).draw(0)
        w = max(sh.width, cap.width)
        img = Image.new("RGBA", (w, sh.height + cap.height - int(80 * u)), (0, 0, 0, 0))
        comp(img, sh, (w - sh.width) // 2, 0)
        comp(img, cap, (w - cap.width) // 2, sh.height - int(80 * u))
        return img


class Stats(Element):
    """Ряд крупных чисел с серыми подписями: «~10 000 / 3 000 / 1 млн+ ₽». Числа появляются по row_at."""
    dynamic = True

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        u = self.u
        self.cells = []
        size = d.get("size", 110) * u
        widest = max(Rich(it[0], "heavy", size, 1e9).w for it in d["items"])
        if widest > 0.9 * self.W:  # длинное число не должно вылезать за кадр
            size *= 0.9 * self.W / widest
        for it in d["items"]:
            v = Rich(it[0], "heavy", size, 1e9, it[2] if len(it) > 2 else "ink", "blue")
            c = Rich(it[1], "med", d.get("caption_size", 28) * u, self.W * 0.8, "gray") if len(it) > 1 and it[1] else None
            w = max(v.w, c.w if c else 0)
            im = Image.new("RGBA", (w, v.h + (c.h if c else 0)), (0, 0, 0, 0))
            v.draw(im, (w - v.w) // 2, 0)
            if c: c.draw(im, (w - c.w) // 2, v.h - int(6 * u))
            self.cells.append(im)
        gap = int(d.get("gap", 90) * u)
        self.row = d.get("dir") != "column" and sum(c.width for c in self.cells) + gap * (len(self.cells) - 1) < 0.92 * self.W
        if self.row:
            self.size = (sum(c.width for c in self.cells) + gap * (len(self.cells) - 1), max(c.height for c in self.cells))
        else:
            gap = int(36 * u)
            self.size = (max(c.width for c in self.cells), sum(c.height for c in self.cells) + gap * (len(self.cells) - 1))
        self.gap = gap
        self.t = self.row_times(len(self.cells), 0.45)
        d.setdefault("anim_time", max(self.t) + 0.4)

    def draw(self, tl):
        img = Image.new("RGBA", (self.size[0], self.size[1] + int(20 * self.u)), (0, 0, 0, 0))
        x = y = 0
        for c, t in zip(self.cells, self.t):
            k = ease_out_cubic((tl - t) / 0.25)
            if k > 0:
                cc = with_alpha(c, k)
                if k < 0.98: cc = cc.filter(ImageFilter.GaussianBlur((1 - k) * 8 * self.u))
                if self.row: comp(img, cc, x, (self.size[1] - c.height) // 2 + (1 - k) * 14 * self.u)
                else: comp(img, cc, (self.size[0] - c.width) // 2, y + (1 - k) * 14 * self.u)
            x += c.width + self.gap; y += c.height + self.gap
        return img


class Flow(Element):
    """Схема: иконки в кружках, синие стрелки, подписи. «убирают инструкции → модель и так умнее → …».
    items: [[эмодзи, подпись, мелкая подпись?]]. arrows/circles — вкл/выкл. Без стрелок и кружков —
    просто эмодзи с подписью (одна или несколько рядом)."""
    dynamic = True

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        u = self.u
        self.arrows, circles = d.get("arrows", True), d.get("circles", True)
        es = int(d.get("icon_size", 54 if circles else 120) * u)
        self.D = int(es * 2.05) if circles else es
        self.cells = []
        for it in d["items"]:
            icon = emoji_img(clean(it[0])[0], es)
            if circles:
                ci, pad = card_canvas(self.D, self.D, self.D // 2, u, strength=28)
                comp(ci, icon, pad + (self.D - icon.width) // 2, pad + (self.D - icon.height) // 2)
                icon, ipad = ci, pad
            else:
                ipad = 0
            cap = Rich(it[1], "semi", d.get("caption_size", 28 if circles else 30) * u, self.wpx(0.22, 0.6),
                       d.get("color", "ink")) if len(it) > 1 and it[1] else None
            sub = Rich(it[2], "reg", 20 * u, self.wpx(0.22, 0.6), "gray") if len(it) > 2 and it[2] else None
            w = max(self.D, cap.w if cap else 0, sub.w if sub else 0) + 2 * ipad
            h = self.D + 2 * ipad + (cap.h if cap else 0) + (sub.h if sub else 0)
            im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            comp(im, icon, (w - icon.width) // 2, 0)
            y = self.D + 2 * ipad - int(30 * u if circles else -10 * u)
            if cap: cap.draw(im, (w - cap.w) // 2, y); y += cap.h
            if sub: sub.draw(im, (w - sub.w) // 2, y - int(6 * u))
            self.cells.append((im, ipad))
        self.A = int(d.get("arrow", 110 if self.arrows else 40) * u)
        tw = sum(c.width for c, _ in self.cells) + self.A * (len(self.cells) - 1)
        self.row = d.get("dir") != "column" and tw < 0.94 * self.W
        if self.row:
            self.size = (tw, max(c.height for c, _ in self.cells))
        else:
            self.A = int(70 * u)
            self.size = (max(c.width for c, _ in self.cells), sum(c.height for c, _ in self.cells) + self.A * (len(self.cells) - 1))
        self.t = self.row_times(len(self.cells), 0.5)
        d.setdefault("anim_time", max(self.t) + 0.4)

    def draw(self, tl):
        u = self.u
        img = Image.new("RGBA", self.size, (0, 0, 0, 0))
        dr = ImageDraw.Draw(img)
        x = y = 0
        prev = None
        for (c, ip), t in zip(self.cells, self.t):
            cx = x + c.width / 2 if self.row else self.size[0] / 2
            cy = ip + self.D / 2 if self.row else y + ip + self.D / 2
            if prev and self.arrows:
                ka = ease_out_cubic((tl - (t - 0.22)) / 0.22)
                if ka > 0:
                    blue, wd = col("blue"), max(2, int(4 * u))
                    if self.row:
                        x0, x1 = prev[0] + self.D / 2 + 14 * u, cx - self.D / 2 - 14 * u
                        xe = lerp(x0, x1, ka)
                        dr.line([(x0, cy), (xe, cy)], fill=blue, width=wd)
                        if ka > 0.85:
                            dr.polygon([(xe + 2 * u, cy), (xe - 14 * u, cy - 9 * u), (xe - 14 * u, cy + 9 * u)], fill=blue)
                    else:
                        y0, y1 = prev[1] + prev[2] + 10 * u, cy - self.D / 2 - 14 * u
                        ye = lerp(y0, y1, ka)
                        dr.line([(cx, y0), (cx, ye)], fill=blue, width=wd)
                        if ka > 0.85:
                            dr.polygon([(cx, ye + 2 * u), (cx - 9 * u, ye - 14 * u), (cx + 9 * u, ye - 14 * u)], fill=blue)
            k = ease_out_cubic((tl - t) / 0.28)
            if k > 0:
                cc = with_alpha(c, k)
                if k < 0.98: cc = cc.filter(ImageFilter.GaussianBlur((1 - k) * 8 * u))
                comp(img, cc, x if self.row else (self.size[0] - c.width) // 2, (0 if self.row else y) + (1 - k) * 12 * u)
            prev = (cx, cy, c.height - ip - self.D / 2) if not self.row else (cx, cy)
            x += c.width + self.A; y += c.height + self.A
        return img


class Prompt(Element):
    """Поле ввода чата, текст печатается: «ВАЖНО!!! Сначала открой файл, …».
    header — бледная строка над полем; cps — символов в секунду; model, chips — подписи внизу."""
    dynamic = True

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        u = self.u
        self.text = clean(d["text"])
        self.cps, self.delay = d.get("cps", 16), d.get("delay", 0.25)
        self.w = self.wpx(0.56, 0.88)
        self.p = int(30 * u)
        self.f = font("reg", d.get("size", 30) * u)
        self.lines = wrap(self.text, self.f, self.w - 2 * self.p)
        self.lh = int(d.get("size", 30) * 1.35 * u)
        d.setdefault("anim_time", self.delay + len(self.text) / self.cps + 0.6)

    def draw(self, tl):
        d, u, p = self.d, self.u, self.p
        n = int(clamp((tl - self.delay) * self.cps, 0, len(self.text))) if tl < 90 else len(self.text)
        body = max(2, len(self.lines)) * self.lh
        h = p + body + int(76 * u)
        img, pad = card_canvas(self.w, h, int(24 * u), u, strength=30)
        dr = ImageDraw.Draw(img)
        left, y, cx, cy = n, pad + p, pad + p, pad + p
        for ln in self.lines:
            part = ln[:max(0, left)]
            if part:
                dr.text((pad + p, y), part, font=self.f, fill=col("ink"), anchor="lt")
                cx, cy = pad + p + self.f.getlength(part), y
            left -= len(ln) + 1
            if left < 0: break
            y += self.lh
        typing = 0 < n < len(self.text)
        if tl < 90 and (typing or int(tl * 2) % 2 == 0):
            dr.line([(cx + 3 * u, cy), (cx + 3 * u, cy + self.lh * 0.8)], fill=col("ink"), width=max(1, int(2 * u)))
        by = pad + h - int(40 * u)
        r = int(16 * u)
        dr.ellipse([pad + p - r + r, by - r, pad + p + r + r, by + r], outline=col("line"), width=max(1, int(2 * u)))
        dr.text((pad + p + r, by), "+", font=font("reg", 24 * u), fill=col("gray"), anchor="mm")
        x = pad + p + 2 * r + int(16 * u)
        cf = font("med", 18 * u)
        for i, chip in enumerate(d.get("chips", ["Chat", "Cowork"])):
            cw = int(cf.getlength(chip) + 26 * u)
            if i == 0:
                dr.rounded_rectangle([x, by - int(15 * u), x + cw, by + int(15 * u)], int(8 * u), fill=col("chip"))
            dr.text((x + cw / 2, by), chip, font=cf, fill=col("ink" if i == 0 else "muted"), anchor="mm")
            x += cw + int(6 * u)
        sx = pad + self.w - p - r
        dr.ellipse([sx - r, by - r, sx + r, by + r], fill=col("blue"))
        dr.line([(sx, by + 7 * u), (sx, by - 7 * u)], fill=col("white"), width=max(1, int(3 * u)))
        dr.line([(sx - 6 * u, by - 1 * u), (sx, by - 7 * u), (sx + 6 * u, by - 1 * u)], fill=col("white"), width=max(1, int(3 * u)))
        dr.text((sx - r - int(14 * u), by), d.get("model", "Sonnet 5.5"), font=cf, fill=col("gray"), anchor="rm")
        if d.get("header"):
            hr = Rich(d["header"], "semi", 34 * u, self.w, "gray")
            big = Image.new("RGBA", (img.width, img.height + hr.h + int(10 * u)), (0, 0, 0, 0))
            big.alpha_composite(img, (0, hr.h + int(10 * u)))
            comp(big, with_alpha(hr.render(), 0.45), (img.width - hr.w) // 2, pad - int(10 * u))
            img = big
        return img


class Compare(Element):
    """Две (или больше) карточки: серая «как все» и синяя «как надо». «99% / пишут больше» vs «1% / результат выше».
    items: [[заголовок, текст]], best — индекс синей (по умолчанию последняя)."""
    dynamic = True

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        u = self.u
        items = d["items"]
        best = d.get("best", len(items) - 1)
        cw = self.wpx(0.38, 0.84)
        p = int(34 * u)
        self.cards = []
        for i, it in enumerate(items):
            on = i == best
            t = Rich(it[0], "heavy", d.get("size", 54) * u, cw - 2 * p, "blue" if on else "gray", "blue", "left")
            x = Rich("• " + it[1], "semi", d.get("text_size", 32) * u, cw - 2 * p, "ink", "blue", "left") if len(it) > 1 and it[1] else None
            h = p + t.h + (x.h if x else int(10 * u)) + p - int(8 * u)
            img, pad = card_canvas(cw, h, int(26 * u), u, outline="blue" if on else None, strength=30)
            t.draw(img, pad + p - 4, pad + p - int(6 * u))
            if x: x.draw(img, pad + p - 4, pad + p + t.h - int(10 * u))
            self.cards.append((img, pad))
        self.gap = int(20 * u)
        self.row = not self.vert and d.get("dir") != "column"
        self.t = self.row_times(len(self.cards), 0.6)
        d.setdefault("anim_time", max(self.t) + 0.4)

    def draw(self, tl):
        u = self.u
        pad = self.cards[0][1]
        if self.row:
            W = sum(c.width - 2 * pad for c, _ in self.cards) + self.gap * (len(self.cards) - 1) + 2 * pad
            H = max(c.height for c, _ in self.cards)
        else:
            W = max(c.width for c, _ in self.cards)
            H = sum(c.height - 2 * pad for c, _ in self.cards) + self.gap * (len(self.cards) - 1) + 2 * pad
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        off = 0
        for (c, _), t in zip(self.cards, self.t):
            k = ease_out_cubic((tl - t) / 0.26)
            if k > 0:
                cc = with_alpha(c, k)
                if k < 0.98: cc = cc.filter(ImageFilter.GaussianBlur((1 - k) * 8 * u))
                if self.row: comp(img, cc, off, (1 - k) * 14 * u)
                else: comp(img, cc, (W - c.width) // 2, off + (1 - k) * 14 * u)
            off += (c.width if self.row else c.height) - 2 * pad + self.gap
        return img


class Checks(Element):
    """Заголовок и пункты с зелёными галочками, появляются по словам. spinner_last — последний «в работе»."""
    dynamic = True

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        u = self.u
        self.title = Rich(d["title"], "heavy", d.get("title_size", 46) * u, self.wpx(0.6, 0.86), "ink", "blue", "left") if d.get("title") else None
        self.rows = [Rich(t, "semi", d.get("size", 28) * u, self.wpx(0.55, 0.8), "ink", "blue", "left") for t in d["items"]]
        self.rh = int(d.get("size", 28) * 1.6 * u)
        self.t = self.row_times(len(self.rows), 0.4, 0.2)
        d.setdefault("anim_time", max(self.t) + (60 if d.get("spinner_last") else 0.4))

    def draw(self, tl):
        u = self.u
        ind = int(42 * u)
        w = max([self.title.w if self.title else 0] + [r.w + ind for r in self.rows]) + int(20 * u)
        top = self.title.h + int(14 * u) if self.title else 0
        img = Image.new("RGBA", (w, top + self.rh * len(self.rows) + int(10 * u)), (0, 0, 0, 0))
        if self.title: self.title.draw(img, 0, 0)
        dr = ImageDraw.Draw(img)
        n = len(self.rows)
        for i, (r, t) in enumerate(zip(self.rows, self.t)):
            k = ease_out_cubic((tl - t) / 0.25)
            if k <= 0: continue
            y = top + i * self.rh + self.rh // 2
            cx, rr = int(14 * u), int(12 * u)
            spin = self.d.get("spinner_last") and i == n - 1
            if spin:
                a0 = (tl * 360) % 360
                dr.arc([cx - rr, y - rr, cx + rr, y + rr], a0, a0 + 270, fill=col("blue", int(255 * k)), width=max(2, int(3 * u)))
            else:
                dr.ellipse([cx - rr, y - rr, cx + rr, y + rr], fill=col("green", int(255 * k)))
                dr.line([(cx - 5 * u, y), (cx - 1 * u, y + 4 * u), (cx + 6 * u, y - 4 * u)], fill=col("white", int(255 * k)),
                        width=max(2, int(3 * u)))
            rr_img = with_alpha(r.render(), k * (0.5 if spin else 1))
            comp(img, rr_img, ind + (1 - k) * 16 * u, y - r.h // 2)
        return img


class Grid(Element):
    """Сетка-навигатор: карточки с номером, эмодзи и подписью, текущая обведена синим. «7 привычек 1%».
    items: [[эмодзи, подпись]], active: индекс или список, title / footer, row_at — по очереди (остальные бледные)."""
    dynamic = True

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        u = self.u
        act = d.get("active", [])
        act = [act] if isinstance(act, int) else act
        cw, ch = int(d.get("cell_w", 190 if self.vert else 172) * u), int(d.get("cell_h", 170 if self.vert else 150) * u)
        self.cells = []
        for i, it in enumerate(d["items"]):
            on = i in act
            img, pad = card_canvas(cw, ch, int(20 * u), u, outline="blue" if on else None, strength=26)
            dr = ImageDraw.Draw(img)
            br = int(13 * u)
            bx, by = pad + int(20 * u), pad + int(20 * u)
            dr.ellipse([bx - br, by - br, bx + br, by + br], fill=col("blue" if on else "ink"))
            dr.text((bx, by), str(i + 1), font=font("bold", 17 * u), fill=col("white"), anchor="mm")
            e = emoji_img(clean(it[0])[0], int(50 * u))
            comp(img, e, pad + (cw - e.width) // 2, pad + int(ch * 0.36) - e.height // 2)
            r = Rich(it[1], "bold", 21 * u, cw - int(20 * u), "blue" if on else "ink", "blue", lh=1.0)
            r.draw(img, pad + (cw - r.w) // 2, pad + int(ch * 0.62))
            self.cells.append(img)
        self.pad, self.cw, self.ch = pad, cw, ch
        self.cols = d.get("cols", 3 if self.vert else 4)
        self.gap = int(18 * u)
        self.title = Rich(d["title"], "heavy", 44 * u, self.W * 0.9, "ink") if d.get("title") else None
        self.footer = Rich(d["footer"], "semi", 30 * u, self.W * 0.9, "ink", "blue") if d.get("footer") else None
        self.t = self.row_times(len(self.cells), 0.35) if d.get("_row_local") else [0] * len(self.cells)
        d.setdefault("anim_time", max(self.t) + 0.4)

    def draw(self, tl):
        u, pad, cols, g = self.u, self.pad, self.cols, self.gap
        n = len(self.cells)
        rows = (n + cols - 1) // cols
        gw = cols * self.cw + (cols - 1) * g
        top = self.title.h + int(16 * u) if self.title else 0
        gh = rows * self.ch + (rows - 1) * g
        W = max(gw + 2 * pad, self.title.w if self.title else 0, self.footer.w if self.footer else 0)
        img = Image.new("RGBA", (W, top + gh + 2 * pad + (self.footer.h if self.footer else 0)), (0, 0, 0, 0))
        if self.title: self.title.draw(img, (W - self.title.w) // 2, 0)
        ghost = self.d.get("ghost", True)
        for i, (c, t) in enumerate(zip(self.cells, self.t)):
            r, k = i // cols, ease_out_cubic((tl - t) / 0.25)
            in_row = min(cols, n - r * cols)
            x0 = (W - (in_row * self.cw + (in_row - 1) * g)) // 2 - pad
            a = lerp(0.3, 1.0, k) if ghost else k
            if a <= 0: continue
            comp(img, with_alpha(c, a), x0 + (i % cols) * (self.cw + g), top + r * (self.ch + g))
        if self.footer: self.footer.draw(img, (W - self.footer.w) // 2, top + gh + 2 * pad - int(20 * u))
        return img


class Toast(Element):
    """Уведомление сверху: иконка, «Claude Code · хук», текст, «сейчас»."""

    def draw(self, tl):
        d, u = self.d, self.u
        w = self.wpx(0.42, 0.88)
        p = int(18 * u)
        isz = int(52 * u)
        t = Rich(d.get("title", ""), "bold", 22 * u, w - isz - 4 * p, "ink", "blue", "left")
        x = Rich(d.get("text", ""), "reg", 21 * u, w - isz - 4 * p, "ink", "blue", "left")
        h = max(isz + 2 * p, t.h + x.h + 2 * p - int(6 * u))
        img, pad = card_canvas(w, h, int(22 * u), u, strength=40)
        comp(img, icon_tile(d.get("glyph"), isz, u, d.get("color", "claude")), pad + p, pad + (h - isz) // 2)
        t.draw(img, pad + 2 * p + isz, pad + p - int(4 * u))
        x.draw(img, pad + 2 * p + isz, pad + p + t.h - int(10 * u))
        ImageDraw.Draw(img).text((pad + w - p, pad + p + int(6 * u)), d.get("time", "сейчас"), font=font("reg", 16 * u),
                                 fill=col("gray"), anchor="rm")
        return img

    def transform(self, tl, life):
        s, a, dx, _ = super().transform(tl, life)
        return s, a, dx, -(1 - ease_out_cubic(tl / 0.35)) * 60 * self.u


class Bar(Element):
    """Карточка-полоса «лимит 25% → 63%»: проценты бегут, полоса растёт."""
    dynamic = True

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        d.setdefault("anim_time", d.get("delay", 0.3) + d.get("time", 1.0) + 0.1)

    def draw(self, tl):
        d, u = self.d, self.u
        w = self.wpx(0.5, 0.84)
        p, h = int(30 * u), int(104 * u)
        img, pad = card_canvas(w, h, int(22 * u), u, strength=30)
        dr = ImageDraw.Draw(img)
        k = ease_in_out((tl - d.get("delay", 0.3)) / d.get("time", 1.0))
        v = lerp(d.get("from", 0.0), d.get("to", 0.5), k)
        f = font("bold", 26 * u)
        dr.text((pad + p, pad + int(34 * u)), d.get("label", ""), font=f, fill=col("ink"), anchor="lm")
        dr.text((pad + w - p, pad + int(34 * u)), f"{round(v * 100)}%", font=f, fill=col("ink"), anchor="rm")
        bh, by = int(14 * u), pad + int(64 * u)
        dr.rounded_rectangle([pad + p, by, pad + w - p, by + bh], bh // 2, fill=col("line"))
        if v > 0.01:
            dr.rounded_rectangle([pad + p, by, pad + p + int((w - 2 * p) * v), by + bh], bh // 2, fill=col(d.get("color", "blue")))
        return img


class ListRows(Element):
    """Пункты-карточки, выезжающие по одному."""
    dynamic = True
    vscale = 1.0

    def draw(self, tl):
        d, u, W = self.d, self.u, self.W
        f = font("semi", d.get("size", 34) * u)
        items = d["items"]
        w = int(d.get("width", 0.7) * W)
        rh, gap = int(84 * u), int(16 * u)
        pad = int(60 * u)
        img = Image.new("RGBA", (w + 2 * pad, len(items) * (rh + gap) + 2 * pad), (0, 0, 0, 0))
        row_t = self.row_times(len(items), d.get("stagger", 0.35))
        for i, t in enumerate(items):
            k = ease_out_cubic((tl - row_t[i]) / 0.35)
            if k <= 0: continue
            card, cp = card_canvas(w, rh, int(22 * u), u)
            dr = ImageDraw.Draw(card)
            cx, cy = cp + int(44 * u), cp + rh // 2
            dr.ellipse([cx - int(16 * u), cy - int(16 * u), cx + int(16 * u), cy + int(16 * u)], fill=col(d.get("color", "green")))
            dr.line([(cx - int(7 * u), cy), (cx - int(2 * u), cy + int(6 * u)), (cx + int(8 * u), cy - int(6 * u))],
                    fill=col("white"), width=max(2, int(4 * u)))
            dr.text((cp + int(80 * u), cy), t, font=f, fill=col("ink"), anchor="lm")
            comp(img, with_alpha(card, k), pad - cp + int((1 - k) * 40 * u), pad - cp + i * (rh + gap))
        return img


class Steps(Element):
    """Ряд шагов-плашек «1 · расшифровка  2 · анимации», активный — синий."""
    vscale = 1.0

    def draw(self, tl):
        d, u = self.d, self.u
        f = font("semi", d.get("size", 26) * u)
        items, act = d["items"], d.get("active", 0)
        gap, ph = int(14 * u), int(48 * u)
        widths = [int(f.getlength(f"{i + 1} · {t}")) + int(36 * u) for i, t in enumerate(items)]
        img = Image.new("RGBA", (sum(widths) + gap * (len(items) - 1) + 4, ph + 4), (0, 0, 0, 0))
        dr = ImageDraw.Draw(img)
        x = 0
        for i, (t, wd) in enumerate(zip(items, widths)):
            on = i == act
            dr.rounded_rectangle([x, 0, x + wd, ph], ph // 2, fill=col("blue") if on else (255, 255, 255, 230))
            dr.text((x + wd // 2, ph // 2), f"{i + 1} · {t}", font=f, fill=col("white" if on else "gray"), anchor="mm")
            x += wd + gap
        return img


class Cross(Element):
    """Большой крест, рисуется двумя штрихами — для «так не надо»."""
    dynamic = True
    appear = 0.01
    blur_px = 0
    vscale = 1.0

    def draw(self, tl):
        d, u = self.d, self.u
        s = int(d.get("size", 300) * u)
        img = Image.new("RGBA", (s + 20, s + 20), (0, 0, 0, 0))
        dr = ImageDraw.Draw(img)
        wdt = int(d.get("stroke", 26) * u)
        c = col(d.get("color", "red"))
        k1, k2 = ease_out_cubic(tl / 0.18), ease_out_cubic((tl - 0.14) / 0.18)
        if k1 > 0: dr.line([(10, 10), (10 + s * k1, 10 + s * k1)], fill=c, width=wdt)
        if k2 > 0: dr.line([(10 + s, 10), (10 + s - s * k2, 10 + s * k2)], fill=c, width=wdt)
        return img

    def transform(self, tl, life):
        out_t = clamp((tl - (life - self.vanish)) / self.vanish)
        return 1.0, 1 - out_t, 0, 0


class ImageEl(Element):
    """PNG/JPG: скриншот, мокап, превью. zoom [от, до] — медленный наезд за время жизни; window — окно macOS с title."""

    def draw(self, tl):
        d, u = self.d, self.u
        p = d["src"] if os.path.isabs(d["src"]) else os.path.join(self.ctx["assets"], d["src"])
        im = Image.open(p).convert("RGBA")
        w = self.wpx(0.6, 0.86)
        im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
        if d.get("window"):
            bar = int(40 * u)
            win = Image.new("RGBA", (w, im.height + bar), col("white"))
            dr = ImageDraw.Draw(win)
            for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
                cx = int((22 + i * 20) * u)
                dr.ellipse([cx - 6 * u, bar / 2 - 6 * u, cx + 6 * u, bar / 2 + 6 * u], fill=c + (255,))
            if d.get("title"):
                dr.text((int(90 * u), bar / 2), d["title"], font=font("semi", 17 * u), fill=col("ink"), anchor="lm")
            win.alpha_composite(im, (0, bar))
            im = win
        r = int(d.get("radius", 18 if d.get("window") else 0) * u)
        if r:
            im.putalpha(Image.composite(im.getchannel("A"), Image.new("L", im.size, 0), rounded_mask(im.width, im.height, r)))
        if d.get("shadow", bool(d.get("window"))):
            pad = int(60 * u)
            sh = shadow_layer(im.width, im.height, r, u, pad, strength=40)
            sh.alpha_composite(im, (pad, pad)); im = sh
        return im

    def transform(self, tl, life):
        s, a, dx, dy = super().transform(tl, life)
        z = self.d.get("zoom")
        if z: s *= lerp(z[0], z[1], ease_in_out(tl / max(0.1, life)) * 0.4 + clamp(tl / max(0.1, life)) * 0.6)
        return s, a, dx, dy


class Title3D(Element):
    """Крупное слово с объёмом, буквы влетают по очереди (из стиля «Мягкий интерфейс»)."""
    dynamic = True
    vanish = 0.3
    blur_px = 0
    vscale = 1.0

    def __init__(self, d, ctx):
        super().__init__(d, ctx)
        u = self.u
        size = d.get("size", 190) * u
        while size > 40 and font("title", size).getlength(d["text"]) > d.get("max_width", 0.88) * ctx["W"]:
            size *= 0.94
        f = font("title", size)
        c = col(d.get("color", "blue"))
        dark = tuple(int(v * 0.55) for v in c[:3]) + (255,)
        depth = int(d.get("depth", 12) * u)
        self.letters, x = [], 0
        for ch in d["text"]:
            adv = f.getlength(ch)
            if ch.strip():
                bb = f.getbbox(ch)
                im = Image.new("RGBA", (int(bb[2] + depth + 8), int(bb[3] + depth + 8)), (0, 0, 0, 0))
                dr = ImageDraw.Draw(im)
                for k in range(depth, 0, -1):
                    dr.text((k, k), ch, font=f, fill=dark)
                dr.text((0, 0), ch, font=f, fill=c)
                self.letters.append((x, im))
            x += adv
        self.width = int(x + depth + 10)
        self.height = int(max((im.height for _, im in self.letters), default=10))

    def draw(self, tl):
        base = int(300 * self.u)
        img = Image.new("RGBA", (self.width + 2 * base, self.height + 20), (0, 0, 0, 0))
        st = self.d.get("stagger", 0.05)
        for i, (x, im) in enumerate(self.letters):
            k = ease_out_cubic((tl - i * st) / 0.32)
            if k <= 0: continue
            off = (1 - k) * 260 * self.u
            img.alpha_composite(with_alpha(im, min(1, k * 1.6)), (int(base + x + off), 0))
        return img

    def image(self, tl):
        if tl < len(self.letters) * self.d.get("stagger", 0.05) + 0.4:
            return self.draw(tl)
        if self._static is None:
            self._static = self.draw(99.0)
        return self._static

    def transform(self, tl, life):
        out_t = clamp((tl - (life - self.vanish)) / self.vanish)
        return lerp(1.0, 1.06, out_t), 1 - ease_out_cubic(out_t), 0, -30 * self.u * out_t


TYPES = {"chapter": Chapter, "headline": Headline, "bigword": BigWord, "words": Words, "stats": Stats,
         "flow": Flow, "prompt": Prompt, "compare": Compare, "checks": Checks, "grid": Grid, "bar": Bar,
         "caption": Caption, "tag": Tag, "appicon": AppIcon, "toast": Toast, "pill": Pill, "note": Note,
         "bubble": Bubble, "image": ImageEl, "card": Card, "counter": Counter, "list": ListRows,
         "steps": Steps, "cross": Cross, "title": Title3D}
SFX_DEFAULT = {}  # звук на элементе только если он указан в плане ("sfx": "pop") — образец почти без эффектов


# ---------------------------------------------------------------- таймлайн
def auto_keep(words, dur, cfg, env=None):
    """-> (куски [[s, e]], журнал вырезанных повторов)."""
    gap, pin, pout = cfg.get("max_gap", 0.35), cfg.get("pad_in", 0.08), cfg.get("pad_out", 0.16)
    drop = cfg.get("drop", [])
    takes = cfg.get("takes")  # выбранные дубли [[s, e], ...]; паузы внутри дубля всё равно вырезаются
    ws = [w for w in words if not any(a <= (w["s"] + w["e"]) / 2 <= b for a, b in drop)]
    if cfg.get("start") is not None: ws = [w for w in ws if w["s"] >= cfg["start"]]
    if cfg.get("end") is not None: ws = [w for w in ws if w["e"] <= cfg["end"]]
    seq = [(ti, w) for ti, (ta, tb) in enumerate(takes or [[0, dur]]) for w in ws if ta <= (w["s"] + w["e"]) / 2 <= tb]
    log, restart = [], set()
    if cfg.get("dedupe", True):  # повторы и обрывки слов с тем же смыслом — вырезаются, остаётся последнее произношение
        from speech import find_repeats
        protect = cfg.get("keep_repeats", [])  # секунды исходника, где повтор нужен намеренно
        rm, found = find_repeats([w for _, w in seq])
        rm = {i for i in rm if not any(abs(seq[i][1]["s"] - p) < 0.5 for p in protect)}
        log = [(seq[idx[0]][1]["s"], why) for idx, why in found if idx[0] in rm]
        restart = {id(seq[i][1]) for i in range(1, len(seq)) if i - 1 in rm and i not in rm}
        seq = [x for i, x in enumerate(seq) if i not in rm]
    cap = cfg.get("max_word", 1.0)  # whisper иногда растягивает слово на паузу — обрезаем хвост
    segs, prev_t = [], None
    for ti, w in seq:
        ta, tb = (takes or [[0, dur]])[ti]
        s, e = max(ta, w["s"] - pin), min(tb, min(w["e"], w["s"] + cap) + pout)
        if segs and ti == prev_t and id(w) not in restart and s - segs[-1][1] < gap - pin - pout + 1e-6:
            segs[-1][1] = max(segs[-1][1], e)
        else:
            segs.append([s, e, id(w) in restart, ta, tb])
        prev_t = ti
    out = []
    for s, e, rs, ta, tb in segs:
        for a, b in drop:
            if s < a < e: e = a
            if s < b < e: s = b
        if env is not None:  # таймкоды whisper неточны: точку склейки двигаем в самое тихое место рядом.
            # После вырезанного повтора окно шире: перед новой попыткой у спикера пауза, а whisper ставит слово раньше
            s, e = snap(env, s, -0.15, 0.35 if rs else 0.06), snap(env, e, -0.06, 0.15)
        s, e = max(s, ta), min(e, tb)  # границы дубля — жёсткие: привязка не выводит за них
        if out and s < out[-1][1] and s > out[-1][0]:  # после привязки куски не должны налезать друг на друга
            out[-1][1] = max(out[-1][1], e); continue
        if e - s > 0.12: out.append([s, e])
    return out, log, [w for _, w in seq]


def envelope(a):
    """Громкость (16 кГц моно) в дБ кадрами по 10 мс — для привязки склеек к тишине."""
    fr = a[:len(a) // 160 * 160].reshape(-1, 160)
    return 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)


def take_words(audio, src, takes, work, model):
    """Дословная расшифровка каждого дубля отдельно (с запинками), с кэшем в _work/take_words.json."""
    cache = os.path.join(work, "take_words.json")
    sig = json.dumps([os.path.normcase(os.path.abspath(src)), takes, model])
    if os.path.exists(cache):
        c = json.load(open(cache, encoding="utf-8"))
        if c.get("sig") == sig: return c["words"]
    from speech import transcribe_clip
    words = []
    for ta, tb in takes:
        t0 = max(0.0, ta - 0.05)
        words += transcribe_clip(audio[int(t0 * 16000):int((tb + 0.05) * 16000)], t0, model)
    json.dump({"sig": sig, "words": words}, open(cache, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return words


def snap_bound(env, t, reach=0.35, min_run=0.04):
    """Граница дубля — в ближайшую паузу, чтобы не резать слово и не цеплять соседнее. Тишина — ниже местного
    порога (между шумом и речью в окрестности ±2 с), длиной ≥ 40 мс. Длинную паузу предпочитаем короткой щели
    между слогами. Если t уже в паузе или паузы рядом нет — без изменений."""
    it = int(t * 100)
    sm = np.convolve(env[max(0, it - 200):it + 200], np.ones(5) / 5, mode="same")
    lo, hi = np.percentile(sm, 10), np.percentile(sm, 90)
    quiet = sm < lo + 0.3 * (hi - lo)
    base = max(0, it - 200)
    i0, i1 = max(0, it - int(reach * 100)) - base, min(len(sm), it + int(reach * 100) + 1 - base)
    runs, k = [], i0
    while k < i1:
        if quiet[k]:
            j = k
            while j < len(sm) and quiet[j]: j += 1
            b = k
            while b > 0 and quiet[b - 1]: b -= 1
            if (j - b) / 100 >= min_run: runs.append((b + base, j + base))
            k = j
        else:
            k += 1
    if not runs: return t

    def score(r):
        dist = 0 if r[0] <= it < r[1] else min(abs(it - r[0]), abs(it - r[1] + 1)) / 100
        return dist - 0.5 * min((r[1] - r[0]) / 100, 0.4)
    b, j = min(runs, key=score)
    if b <= it < j: return t
    return round((b + j) / 200, 2)  # середина паузы


def snap(env, t, lo, hi):
    i0, i1 = max(0, int((t + lo) * 100)), min(len(env), int((t + hi) * 100) + 1)
    if i1 - i0 < 2: return t
    seg = np.convolve(env[i0:i1], np.ones(5) / 5, mode="same")  # 50 мс: короткие провалы внутри слова не считаются
    return (i0 + int(np.argmin(seg))) / 100


class Timeline:
    def __init__(self, keep, fps):
        self.keep = [[round(s * fps) / fps, round(e * fps) / fps] for s, e in keep]
        self.starts, acc = [], 0.0
        for s, e in self.keep:
            self.starts.append(acc); acc += e - s
        self.total = acc

    def out(self, t):
        for (s, e), o in zip(self.keep, self.starts):
            if t < s: return o
            if t <= e: return o + t - s
        return self.total

    def seg_index(self, to):
        i = 0
        for k, o in enumerate(self.starts):
            if to >= o: i = k
        return i


def ev_time(ev, tl, key="at"):
    if key + "_out" in ev: return ev[key + "_out"]
    if key in ev: return tl.out(ev[key])
    return None


# ---------------------------------------------------------------- лицо, фоны, раскладки
def crop_cover(frame, w, h, zoom, focal):
    W, H = frame.size
    a = w / h
    if W / H > a:
        ch = H / zoom; cw = ch * a
    else:
        cw = W / zoom; ch = cw / a
    cx = clamp(focal[0] * W, cw / 2, W - cw / 2)
    cy = clamp(focal[1] * H, ch / 2, H - ch / 2)
    return frame.resize((max(1, int(w)), max(1, int(h))), Image.BILINEAR,
                        box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))


def track_faces(src, keep, cache):
    """Медианный центр лица (доли кадра) в каждом куске: голова не прыгает на склейках."""
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
                pts.append(((x + fw / 2) / w, (y + fh / 2) / h))
        faces.append([float(np.median([p[0] for p in pts])), float(np.median([p[1] for p in pts]))] if pts else None)
    cap.release()
    ok = [f for f in faces if f]
    fill = [float(np.median([f[0] for f in ok])), float(np.median([f[1] for f in ok]))] if ok else [0.5, 0.45]
    faces = [f if f and abs(f[1] - fill[1]) < 0.12 else fill for f in faces]
    json.dump({"sig": sig, "faces": faces}, open(cache, "w", encoding="utf-8"), indent=1)
    return faces


BG_KINDS = {
    # база, (центр x, y, радиус в долях ширины, цвет, сила) ...
    "soft": ((238, 242, 249), [(0.14, 0.12, 0.34, (212, 225, 250), 1.0), (0.95, 1.05, 0.45, (220, 224, 233), 0.9)]),
    "blue": ((31, 100, 235), [(0.10, 0.06, 0.32, (84, 140, 246), 0.9), (0.95, 1.0, 0.5, (24, 86, 220), 0.7)]),
    "white": ((250, 251, 253), [(0.14, 0.12, 0.34, (232, 238, 250), 0.8)]),
}


def make_bg(W, H, kind="soft", assets=""):
    """Фон слайда: светлый холодный (soft), синий (blue), почти белый (white) или картинка-файл."""
    if kind not in BG_KINDS:
        p = kind if os.path.isabs(kind) else os.path.join(assets, kind)
        return crop_cover(Image.open(p).convert("RGB"), W, H, 1.0, (0.5, 0.5))
    base, glows = BG_KINDS[kind]
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    b = np.array(base, np.float32)
    img = np.ones((H, W, 3), np.float32) * b
    for cx, cy, r, c, s in glows:
        g = np.exp(-(((x - cx * W) ** 2 + (y - cy * H) ** 2) / (2 * (r * max(W, H)) ** 2)))[..., None]
        img += g * (np.array(c, np.float32) - b) * s
    noise = np.random.default_rng(1).normal(0, 1.4, (H, W, 1)).astype(np.float32)
    return Image.fromarray(np.clip(img + noise, 0, 255).astype(np.uint8), "RGB")


def layout_rects(W, H, u, mode, d):
    """Целевой прямоугольник лица (x, y, w, h, r) и центр слота контента."""
    vertical = H > W
    if mode == "split":
        if vertical:
            w = int(d.get("face_w", 0.84) * W); h = int(w * d.get("face_ratio", 1.08))
            x, y = (W - w) // 2, int(d.get("face_y", 0.07) * H)
            slot = (W / 2, y + h + (H * 0.86 - (y + h)) / 2)
        else:
            h = int(0.62 * H); w = int(h * 0.92)
            x, y = int(0.06 * W), (H - h) // 2
            slot = (x + w + (W - x - w) / 2, H / 2)
        return (x, y, w, h, int(36 * u)), slot
    if mode == "slide":
        w = int((0.26 if vertical else 0.14) * W); h = int(w * 1.15)
        x, y = W - w - int(40 * u), int(40 * u)
        return (x, y, w, h, int(26 * u)), (W / 2, H * 0.5)
    return (0, 0, W, H, 0), None


# доли высоты. В вертикали лицо обычно в 0.2–0.5, низ (0.85+) закрывает интерфейс Shorts
POS = {"top": 0.12, "upper": 0.25, "center": 0.5, "lower": 0.68, "bottom": 0.8}


# ---------------------------------------------------------------- рендер
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("plan")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--start", type=float); ap.add_argument("--end", type=float)
    ap.add_argument("--still", help="через запятую: секунды итогового ролика -> PNG и сетка stills.jpg")
    ap.add_argument("--audio-only", action="store_true", help="пересобрать только звук поверх готовой картинки")
    ap.add_argument("--cut-only", action="store_true", help="только склейка _work/cut.mkv — для проверки речи")
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
    fps = plan.get("fps") or round(num / den)
    if a.preview: fps = min(fps, 30)
    scale = 0.5 if a.preview else plan.get("scale", 1.0)
    W, H = int(SW * scale) // 2 * 2, int(SH * scale) // 2 * 2
    u = W / (1080 if H > W else 1920)
    dur = float(probe["format"]["duration"])

    # --- нарезка
    cuts = plan.get("cuts", {"auto": True})
    work = rp(plan.get("work_dir", "_work"))
    os.makedirs(work, exist_ok=True)
    kept_words = []
    if "keep" in cuts:
        keep = cuts["keep"]
    else:
        from speech import load_audio
        audio, _ = load_audio(src)
        env = envelope(audio) if cuts.get("snap", True) else None
        words = json.load(open(rp(plan["words"]), encoding="utf-8"))["words"]
        if cuts.get("takes") and env is not None:  # границы дублей ставлены по неточному времени whisper — в паузы
            moved = []
            new = [[snap_bound(env, ta), snap_bound(env, tb)] for ta, tb in cuts["takes"]]
            for (ta, tb), (na, nb) in zip(cuts["takes"], new):
                if abs(na - ta) > 0.005: moved.append(f"{ta}→{na}")
                if abs(nb - tb) > 0.005: moved.append(f"{tb}→{nb}")
            cuts = dict(cuts, takes=new)
            if moved: print("Границы дублей сдвинуты в паузы: " + ", ".join(moved), flush=True)
        if cuts.get("takes") and cuts.get("verbatim", True):  # дубли — дословно и по отдельности
            words = take_words(audio, src, cuts["takes"], work, cuts.get("model", "small"))
        keep, rep_log, kept_words = auto_keep(words, dur, cuts, env)
        if rep_log:
            print(f"Вырезаны повторы ({len(rep_log)}): " + "; ".join(f"{t:.1f} {why}" for t, why in rep_log), flush=True)
    tl = Timeline(keep, fps)
    # ожидаемый текст итога — check_speech.py сверяет с ним то, что реально звучит (лишние слоги на стыках, пропуски)
    expected = [{"w": w["w"], "t": round(tl.out(w["s"]), 2)} for w in kept_words]
    json.dump({"keep": tl.keep, "out_starts": tl.starts, "total": tl.total, "expected": expected},
              open(os.path.join(work, "edl.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"Нарезка: {len(tl.keep)} кусков, {dur:.1f} c -> {tl.total:.1f} c", flush=True)

    cut_path = os.path.join(work, "cut.mkv")
    sig = json.dumps([tl.keep, fps, os.path.normcase(os.path.abspath(src))]).encode()
    sig_path = cut_path + ".sig"
    if not (os.path.exists(cut_path) and os.path.exists(sig_path) and open(sig_path, "rb").read() == sig):
        fc, cat = [], ""
        for i, (s, e) in enumerate(tl.keep):
            fc.append(f"[0:v]trim={s:.4f}:{e:.4f},setpts=PTS-STARTPTS,fps={fps}[v{i}]")
            fd = min(0.015, (e - s) / 4)
            fc.append(f"[0:a]atrim={s:.4f}:{e:.4f},asetpts=PTS-STARTPTS,afade=t=in:d={fd},"
                      f"afade=t=out:st={e - s - fd:.4f}:d={fd}[a{i}]")
            cat += f"[v{i}][a{i}]"
        fc.append(f"{cat}concat=n={len(tl.keep)}:v=1:a=1[v][a]")
        fcp = os.path.join(work, "cut_filter.txt")
        open(fcp, "w", encoding="utf-8").write(";\n".join(fc))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-/filter_complex", fcp,
                        "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "12",
                        "-c:a", "pcm_s16le", cut_path], check=True)
        open(sig_path, "wb").write(sig)
    if a.cut_only:
        print("Склейка:", cut_path)
        return

    # --- контекст и события
    ctx = {"W": W, "H": H, "u": u, "assets": plan.get("assets", "")}
    focal = plan.get("face", [0.5, 0.4])
    seg_face = None
    if focal == "auto":  # лицо ищется в каждом куске, "face_dy" — сдвиг точки (доли кадра)
        seg_face = track_faces(src, tl.keep, os.path.join(work, "faces.json"))
        focal = [0.5, 0.45]

    def focal_at(t):
        if not seg_face: return focal
        f = seg_face[tl.seg_index(t)]
        return [f[0], f[1] + plan.get("face_dy", 0.0)]

    punch = plan.get("punch", 1.0)  # образец: камера статичная, без панч-зумов
    bgs = {}

    def bg_of(kind):
        if kind not in bgs: bgs[kind] = make_bg(W, H, kind, ctx["assets"])
        return bgs[kind]

    edges = tl.starts + [tl.total]
    thr = plan.get("snap_layouts", 0.35)

    def to_edge(t, before):
        """Край раскладки рядом со склейкой ставим ровно на склейку, иначе мелькнёт лицо на пару кадров."""
        near = [c for c in edges if 0 < (t - c if before else c - t) <= thr]
        return (max(near) if before else min(near)) if near else t

    layouts = []
    for L in plan.get("layouts", []):
        t0, t1 = ev_time(L, tl), ev_time(L, tl, "until")
        t1 = t1 if t1 is not None else t0 + L.get("dur", 3)
        L = dict(L, t0=to_edge(t0, True), t1=to_edge(t1, False))
        if L["mode"] == "slide":  # слайд на весь экран, жёсткие склейки — как в образце
            L.setdefault("pip", False)
            L.setdefault("cut_in", not L.get("fade")); L.setdefault("cut_out", not L.get("fade"))
        L["_bg"] = bg_of(L.get("bg", "soft"))
        layouts.append(L)
    zooms = []
    for Z in plan.get("zooms", []):
        t0, t1 = ev_time(Z, tl), ev_time(Z, tl, "until")
        zooms.append(dict(Z, t0=t0, t1=t1 if t1 is not None else t0 + Z.get("dur", 2)))
    TR = plan.get("transition", 0.38)

    def layout_at(t):
        """-> (mode, p, L) — p: 0 полный кадр, 1 полностью в раскладке."""
        for L in layouts:
            if L["t0"] - 1e-6 <= t < L["t1"]:
                p_in = ease_out_cubic((t - L["t0"]) / TR) if not L.get("cut_in") else 1.0
                p_out = ease_out_cubic((L["t1"] - t) / TR) if not L.get("cut_out") else 1.0
                return L["mode"], min(p_in, p_out), L
        return "full", 0.0, None

    def is_slide(L):
        return L is not None and L["mode"] == "slide" and not L.get("pip")

    els = []
    for E in plan.get("elements", []):
        t0 = ev_time(E, tl)
        t1 = ev_time(E, tl, "until")
        if t1 is None:  # по умолчанию элемент живёт до конца своего слайда
            _, _, L = layout_at(t0 + 1e-3)
            t1 = L["t1"] if L else t0 + E.get("dur", 2.6)
        for key in ("row_at", "word_at"):
            if E.get(key):
                E["_" + key.split("_")[0] + "_local"] = [tl.out(x) - t0 for x in E[key]]
        if E.get("strike_at") is not None:
            E["_strike_local"] = tl.out(E["strike_at"]) - t0
        mode, _, L = layout_at(t0 + 1e-3)
        dpos = "center" if is_slide(L) else ("slot" if mode == "split" else "lower")
        els.append({"d": E, "t0": t0, "t1": t1, "pos": E.get("pos", dpos), "obj": TYPES[E["type"]](E, ctx)})
    bg = bg_of(plan.get("bg", "soft"))

    # какие склейки видны на лице (не спрятаны под слайдом)
    vis = [t for t in tl.starts[1:] if not is_slide(layout_at(t)[2])]
    print(f"Склейки на лице: {len(vis)} из {len(tl.starts) - 1}" + (": " + ", ".join(f"{t:.1f}" for t in vis[:40]) if vis else ""),
          flush=True)

    def zoom_at(t):
        z = 1.0
        if punch and punch != 1.0 and tl.seg_index(t) % 2 == 1:
            z = punch
        for Z in zooms:
            if Z["t0"] <= t <= Z["t1"] + 0.3:
                k = ease_in_out((t - Z["t0"]) / max(0.01, Z.get("ramp", Z["t1"] - Z["t0"])))
                z = lerp(Z.get("from", z), Z.get("to", 1.2), k)
        return z

    def compose(frame, t):
        mode, p, L = layout_at(t)
        z = zoom_at(t)
        fo = focal_at(t)
        slot = None
        if p <= 0.001:
            canvas = crop_cover(frame, W, H, z, fo).convert("RGBA")
        else:
            (fx, fy, fw, fh, fr), slot = layout_rects(W, H, u, mode, L)
            k = p
            canvas = L["_bg"].copy().convert("RGBA")
            if mode == "slide" and not L.get("pip"):
                if p < 1:  # лицо уходит, растворяем полный кадр
                    full = crop_cover(frame, W, H, z, fo).convert("RGBA")
                    full.putalpha(int(255 * (1 - p)))
                    canvas.alpha_composite(full)
            else:
                x, y = lerp(0, fx, k), lerp(0, fy, k)
                w, h = lerp(W, fw, k), lerp(H, fh, k)
                r = int(lerp(0, fr, k))
                lf = L.get("focal") or [fo[0], fo[1] + L.get("face_dy", 0.0)]
                ff = (lerp(fo[0], lf[0], k), lerp(fo[1], lf[1], k))
                face = crop_cover(frame, int(w), int(h), lerp(z, L.get("face_zoom", 1.0), k), ff).convert("RGBA")
                if r > 0:
                    face.putalpha(rounded_mask(face.width, face.height, r))
                pad = int(60 * u)
                if k > 0.05:
                    comp(canvas, shadow_layer(face.width, face.height, r, u, pad, strength=int(46 * k)), int(x) - pad, int(y) - pad)
                comp(canvas, face, int(x), int(y))
        for e in els:
            if not (e["t0"] <= t < e["t1"]): continue
            tl_ = t - e["t0"]
            obj, d = e["obj"], e["d"]
            life = e["t1"] - e["t0"]
            img = obj.image(tl_)
            s, al, dx, dy = obj.transform(tl_, life)
            if al <= 0.01: continue
            if abs(s - 1) > 0.004:
                img = img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.BILINEAR)
            b = obj.blur(tl_, life)
            if b > 0.6:
                img = img.filter(ImageFilter.GaussianBlur(b))
            img = with_alpha(img, al)
            pos = e["pos"]
            if pos == "slot" and slot:
                cx, cy = slot
                if d.get("slot_dy"): cy += d["slot_dy"] * H
            elif isinstance(pos, list):
                cx, cy = pos[0] * W, pos[1] * H
            else:
                cx, cy = W / 2, POS.get(pos, 0.68) * H
            if d.get("x") is not None: cx = d["x"] * W
            comp(canvas, img, cx - img.width / 2 + dx, cy - img.height / 2 + dy)
        return canvas.convert("RGB")

    # --- кадры для проверки
    if a.still:
        shots = []
        for ts in [float(x) for x in a.still.split(",")]:
            raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{ts:.3f}", "-i", cut_path, "-frames:v", "1",
                                  "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                                 capture_output=True).stdout
            img = compose(Image.frombytes("RGB", (W, H), raw[:W * H * 3]), ts)
            outp = os.path.join(work, f"still_{ts:07.2f}.png")
            img.save(outp); shots.append((ts, img)); print(outp)
        tw = 360 if H > W else 480
        th = int(H * tw / W)
        cols = min(len(shots), 6 if H > W else 4)
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
        if not os.path.exists(vid_tmp):
            sys.exit("Нет готовой картинки _work/video_only.mp4 — сначала полный рендер.")
        t_start, t_end = 0.0, min(tl.total, float(json.loads(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", vid_tmp],
            capture_output=True, text=True).stdout)["format"]["duration"]))
    else:
        render_video(a, cut_path, vid_tmp, W, H, fps, t_start, t_end, compose)
    audio_mix(a, plan, ctx, els, layouts, work, rp, cut_path, vid_tmp, t_start, t_end)


def render_video(a, cut_path, vid_tmp, W, H, fps, t_start, t_end, compose):
    rd = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-ss", f"{t_start:.3f}", "-t", f"{t_end - t_start:.3f}",
                           "-i", cut_path, "-vf", f"scale={W}:{H},fps={fps}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                          stdout=subprocess.PIPE)
    wr = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", "veryfast" if a.preview else "medium",
                           "-crf", "23" if a.preview else "17", "-pix_fmt", "yuv420p", vid_tmp], stdin=subprocess.PIPE)
    n, fsz = 0, W * H * 3
    total_frames = int((t_end - t_start) * fps)
    while True:
        raw = rd.stdout.read(fsz)
        if len(raw) < fsz: break
        t = t_start + n / fps
        wr.stdin.write(compose(Image.frombytes("RGB", (W, H), raw), t).tobytes())
        n += 1
        if n % (fps * 5) == 0:
            print(f"  кадр {n}/{total_frames}", flush=True)
    wr.stdin.close(); wr.wait(); rd.wait()


def audio_mix(a, plan, ctx, els, layouts, work, rp, cut_path, vid_tmp, t_start, t_end):
    # --- звук. Уровни подбираются под ролик по замерам audio_check.py, общего стандарта нет:
    # voice_gain_db — подъём/спад голоса, voice_fx — по необходимости, музыка — "db" + приглушение под голос.
    sfx_map = plan.get("sfx", {})
    inputs, fc, mix = ["-i", vid_tmp, "-i", cut_path], [], []
    vchain = [f"atrim={t_start:.3f}:{t_end:.3f}", "asetpts=PTS-STARTPTS"]
    vf = plan.get("voice_fx", {})
    if vf.get("highpass"): vchain.append(f"highpass=f={vf['highpass']}")
    if vf.get("denoise"): vchain.append(f"afftdn=nr={vf['denoise']}")
    if vf.get("compress"): vchain.append("acompressor=threshold=0.1:ratio=2.5:attack=10:release=200")
    vchain.append(f"volume={plan.get('voice_gain_db', 0)}dB")
    fc.append(f"[1:a]{','.join(vchain)},asplit=3[voice][vkey][vst]")
    mix.append("[voice]")
    idx = 2
    sfx_events = []
    for e in els:
        name = e["d"].get("sfx", SFX_DEFAULT.get(e["d"]["type"]))
        if name: sfx_events.append((e["t0"] + e["d"].get("sfx_delay", 0), name, e["d"].get("sfx_db")))
    if plan.get("layout_sfx"):
        for L in layouts:
            sfx_events.append((L["t0"], plan["layout_sfx"], None))
    for t0, name, db in sfx_events:
        if not (t_start <= t0 < t_end): continue
        spec = sfx_map.get(name)
        if not spec: print("нет звука в sfx:", name); continue
        path = spec["file"] if os.path.isabs(spec["file"]) else os.path.join(ctx["assets"], spec["file"])
        if not os.path.exists(path): print("нет файла звука:", path); continue
        inputs += ["-i", path]
        ms = int((t0 - t_start) * 1000)
        fc.append(f"[{idx}:a]aformat=channel_layouts=stereo,volume={db if db is not None else spec.get('db', -14)}dB,"
                  f"adelay={ms}|{ms}[s{idx}]")
        mix.append(f"[s{idx}]"); idx += 1
    mus = plan.get("music")
    stems = [("[vst]", os.path.join(work, "voice_stem.wav"))]
    if mus:
        mpath = mus["file"] if os.path.isabs(mus["file"]) else os.path.join(ctx["assets"], mus["file"])
        inputs += ["-i", mpath]
        m_from = max(0.0, mus.get("from_out", 0.0) - t_start)
        m_until = min(t_end, mus.get("until_out", t_end)) - t_start
        fo = mus.get("fade_out", 1.5)
        fc.append(f"[{idx}:a]aformat=channel_layouts=stereo,atrim={mus.get('offset', 0) + t_start}:"
                  f"{mus.get('offset', 0) + t_start + m_until - m_from},asetpts=PTS-STARTPTS,volume={mus.get('db', -24)}dB,"
                  f"afade=t=in:d={mus.get('fade_in', 0.6)},afade=t=out:st={max(0, m_until - m_from - fo):.2f}:d={fo},"
                  f"adelay={int(m_from * 1000)}|{int(m_from * 1000)}[mraw]")
        if mus.get("duck", True):  # музыка приседает, пока звучит голос
            fc.append(f"[mraw][vkey]sidechaincompress=threshold={mus.get('duck_threshold', 0.03)}:"
                      f"ratio={mus.get('duck_ratio', 6)}:attack=20:release=400,asplit=2[mduck][mst]")
        else:
            fc.append("[vkey]anullsink"); fc.append("[mraw]asplit=2[mduck][mst]")
        mix.append("[mduck]"); idx += 1
        stems.append(("[mst]", os.path.join(work, "music_stem.wav")))
    else:
        fc.append("[vkey]anullsink")
    post = "" if plan.get("loudness") is None else f"loudnorm=I={plan['loudness']}:TP=-1.5:LRA=11,"
    fc.append(f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0:dropout_transition=0,{post}"
              f"alimiter=limit={plan.get('limit', 0.89)}:level=0,aresample=48000[aout]")
    fcp = os.path.join(work, "audio_filter.txt")
    open(fcp, "w", encoding="utf-8").write(";\n".join(fc))
    out = a.out or rp(plan.get("out", "result.mp4"))
    if a.preview and not a.out:
        out = os.path.splitext(out)[0] + " (превью).mp4"
    cmd = ["ffmpeg", "-y", "-loglevel", "error"] + inputs + ["-/filter_complex", fcp, "-map", "0:v", "-map", "[aout]",
                                                             "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", out]
    for lab, path in stems:
        cmd += ["-map", lab, "-c:a", "pcm_s16le", path]
    subprocess.run(cmd, check=True)
    print("Готово:", out, f"({t_end - t_start:.1f} c)")
    print("Дорожки для замера:", " ".join(p for _, p in stems))


if __name__ == "__main__":
    main()
