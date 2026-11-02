"""Скриншот сайта для нижней панели (Edge/Chrome без окна).

python shot.py <url> <out.png> [--w 1080] [--h 2400] [--dark] [--scale 2]

Высокая картинка (--h 2400 и больше) потом «прокручивается» в плане полем "y": [от, до] — выглядит как запись
скролла. --scale 2 — чёткий текст (картинка вдвое больше, рендер сам уменьшит).
"""
import argparse, os, subprocess, sys, tempfile

sys.stdout.reconfigure(encoding="utf-8")
BROWSERS = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe"]

ap = argparse.ArgumentParser()
ap.add_argument("url"); ap.add_argument("out")
ap.add_argument("--w", type=int, default=1080); ap.add_argument("--h", type=int, default=2400)
ap.add_argument("--scale", type=float, default=2.0)
ap.add_argument("--dark", action="store_true")
ap.add_argument("--wait", type=int, default=4000, help="мс на загрузку страницы")
a = ap.parse_args()

exe = next((b for b in BROWSERS if os.path.exists(b)), None)
if not exe: sys.exit("Не найден Edge или Chrome")
out = os.path.abspath(a.out)
prof = tempfile.mkdtemp(prefix="shot_")  # чистый профиль: без куки и входов пользователя
cmd = [exe, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={prof}",
       f"--window-size={int(a.w / a.scale)},{int(a.h / a.scale)}", f"--force-device-scale-factor={a.scale}",
       f"--virtual-time-budget={a.wait}", f"--screenshot={out}", "--lang=ru"]
if a.dark: cmd.append("--force-dark-mode")
subprocess.run(cmd + [a.url], capture_output=True, timeout=120)
print(out if os.path.exists(out) else "Скриншот не получился")
