"""Сетка координат поверх скриншота — чтобы снять рамки выделений (box в долях картинки) для plan.json.
python grid.py "<скрин.png>" [--step 0.05]   ->  рядом "<скрин>_grid.png"
Подписи: доли ширины сверху, доли высоты слева. box = [x0, y0, x1, y1].
"""
import argparse, os, sys
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding="utf-8")
ap = argparse.ArgumentParser()
ap.add_argument("image"); ap.add_argument("--step", type=float, default=0.05)
a = ap.parse_args()

im = Image.open(a.image).convert("RGB")
W, H = im.size
ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
dr = ImageDraw.Draw(ov)
f = ImageFont.truetype("arial.ttf", max(12, W // 80))
n = int(round(1 / a.step))
for i in range(n + 1):
    v = i * a.step
    major = abs(v * 10 - round(v * 10)) < 1e-6
    c = (255, 0, 80, 170) if major else (0, 140, 255, 110)
    x, y = int(v * (W - 1)), int(v * (H - 1))
    dr.line([(x, 0), (x, H)], fill=c, width=2 if major else 1)
    dr.line([(0, y), (W, y)], fill=c, width=2 if major else 1)
    if major and 0 < i < n:
        dr.text((x + 3, 2), f"{v:.1f}", font=f, fill=(255, 0, 80, 255))
        dr.text((3, y + 2), f"{v:.1f}", font=f, fill=(255, 0, 80, 255))
out = im.convert("RGBA")
out.alpha_composite(ov)
p = os.path.splitext(a.image)[0] + "_grid.png"
out.convert("RGB").save(p)
print(p, f"({W}×{H})")
