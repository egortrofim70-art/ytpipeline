"""Замеры звука для решений по уровням. Ничего не нормализует — показывает факты и подсказки.

python audio_check.py <видео или wav>                    — речь: громкость, пики, шум в паузах, сколько можно поднять
python audio_check.py --stems voice_stem.wav music_stem.wav — насколько музыка тише голоса во время речи
python audio_check.py <файл> --gain 6                    — что будет, если поднять голос на 6 дБ

Громкость — LUFS по EBU R128: M — моментальная (окно 0,4 с), I — интегральная за весь файл.
"""
import argparse, re, subprocess, sys
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")


def ebur(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-vn", "-af",
                          "ebur128=framelog=info:peak=true", "-f", "null", "-"],
                         capture_output=True, text=True, encoding="utf-8", errors="ignore").stderr
    M = np.array([float(x) for x in re.findall(r"\bM:\s*(-?[\d.]+)", err)])
    I = float(re.findall(r"I:\s*(-?[\d.]+) LUFS", err)[-1])
    LRA = float(re.findall(r"LRA:\s*([\d.]+) LU", err)[-1])
    TP = float(re.findall(r"Peak:\s*(-?[\d.]+) dBFS", err)[-1])
    return M, I, LRA, TP


def pct(a, p):
    return float(np.percentile(a, p)) if len(a) else float("nan")


def single(path, gain):
    M, I, LRA, TP = ebur(path)
    speech = M[M > I - 10]
    quiet = M[(M < I - 20) & (M > -90)]
    floor = pct(quiet, 50) if len(quiet) > 10 else pct(M[M > -90], 3)
    print(f"Файл: {path}")
    print(f"  Интегральная громкость I = {I:.1f} LUFS, разброс LRA = {LRA:.1f} LU, пик TP = {TP:.1f} dBFS")
    print(f"  Речь (M): медиана {pct(speech, 50):.1f}, тихие места {pct(speech, 10):.1f}, громкие {pct(speech, 90):.1f} LUFS")
    print(f"  Фон в паузах ≈ {floor:.1f} LUFS → речь выше фона на {pct(speech, 50) - floor:.0f} дБ")
    print("Подсказки (не стандарт — решать по ролику):")
    if pct(speech, 50) - floor < 25:
        print("  · Фон в паузах близко к речи. Если это шум, а не музыка (на исходнике музыки нет) — подъём громкости "
              "поднимет и его, подумай о voice_fx.denoise (6–12).")
    spread = pct(speech, 90) - pct(speech, 10)  # LRA на сыром видео раздувают паузы, поэтому смотрим разброс самой речи
    if spread > 12:
        print(f"  · Речь скачет по громкости (разброс {spread:.0f} дБ) — мягкий компрессор (voice_fx.compress) выровняет.")
    if TP > -0.1:
        print(f"  · Пик {TP:.1f} dBFS: в исходнике возможен перегруз при записи. Прослушай громкие места — "
              "клиппинг лимитер не исправит.")
    if I < -24:
        print(f"  · Речь тихая (I {I:.1f}): на телефоне её придётся докручивать. Её стоит поднять.")
    elif I > -11:
        print(f"  · Речь уже громкая (I {I:.1f}): поднимать не нужно, следи, чтобы не было перегруза.")
    else:
        print(f"  · Громкость речи в обычных пределах (I {I:.1f}): можно не трогать или подправить на пару дБ на слух.")
    head = -1.0 - TP
    print(f"  · До пика −1 dBFS запас {head:.1f} дБ; всё, что выше, срежет лимитер (alimiter) — до ~4–6 дБ это незаметно.")
    if gain is not None:
        print(f"Если поднять на {gain:+.1f} дБ: I ≈ {I + gain:.1f}, фон ≈ {floor + gain:.1f}, "
              f"лимитер будет работать на ~{max(0.0, TP + gain + 1):.1f} дБ в пиках.")


def stems(vpath, mpath):
    Mv, Iv, _, _ = ebur(vpath)
    Mm, Im, _, _ = ebur(mpath)
    n = min(len(Mv), len(Mm))
    Mv, Mm = Mv[:n], Mm[:n]
    sp = Mv > Iv - 10
    gap = Mv[sp] - Mm[sp]
    gap = gap[np.isfinite(gap)]
    print(f"Голос I = {Iv:.1f} LUFS, музыка I = {Im:.1f} LUFS (после приглушения)")
    print(f"Во время речи музыка тише голоса: обычно на {pct(gap, 50):.0f} дБ, в худшие моменты на {pct(gap, 10):.0f} дБ")
    print(f"В паузах музыка ≈ {pct(Mm[~sp & (Mm > -90)], 50):.1f} LUFS (голос в речи ≈ {pct(Mv[sp], 50):.1f})")
    print("Подсказки (не стандарт):")
    if pct(gap, 10) < 10:
        print("  · Местами музыка спорит с голосом — опусти music.db или усиль приглушение (duck_ratio, duck_threshold).")
    elif pct(gap, 50) > 32:
        print("  · Музыку почти не слышно — если она нужна, подними music.db на 3–6 дБ.")
    else:
        print("  · Музыка звучит фоном, речь разборчива. Дальше — по ощущению ролика.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("file", nargs="?")
    ap.add_argument("--stems", nargs=2, metavar=("VOICE", "MUSIC"))
    ap.add_argument("--gain", type=float)
    a = ap.parse_args()
    if a.stems:
        stems(*a.stems)
    else:
        single(a.file, a.gain)
