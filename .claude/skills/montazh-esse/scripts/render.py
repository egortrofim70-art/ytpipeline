"""Рендер видеоэссе движком Remotion (engine/) по plan.json.

python render.py plan.json                      # итог 1920×1080 -> plan["out"]
python render.py plan.json --preview            # черновик 960×540 (быстрее в ~3 раза)
python render.py plan.json --still 1.2,5,9.4    # кадры (секунды итога) -> _work_esse/stills/*.png + сетка stills.jpg
python render.py plan.json --start 10 --end 25  # только кусок (секунды итога)

Перед рендером нужен prep.py (голос и words_out.json). Все пути к медиа в плане — абсолютные или от папки плана:
они копируются в _work_esse/public/m/, туда же шрифты и звуки движка.
"""
import argparse, hashlib, json, os, shutil, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8")
SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = os.path.join(SKILL, "engine")
EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp4", ".mov", ".webm", ".mkv", ".m4v",
       ".mp3", ".wav", ".m4a", ".aac", ".ogg")
SKIP_KEYS = {"words", "source", "out", "work_dir", "subs", "cuts"}


def link(src, dst):
    if os.path.exists(dst) and os.path.getsize(dst) == os.path.getsize(src): return
    if os.path.exists(dst): os.remove(dst)
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)


EMOJI_URL = "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@v15.1.2/img-apple-160/{}.png"
EMOJI_CACHE = os.path.join(ENGINE, "assets", "emoji")


def emoji_local(e, pub, missing):
    """Эмодзи Apple — в локальный кэш скилла и в public: загрузка из сети во время рендера даёт тайм-ауты."""
    cp = "-".join(f"{ord(c):x}" for c in e if ord(c) != 0xFE0F)
    cached = os.path.join(EMOJI_CACHE, cp + ".png")
    if not os.path.exists(cached):
        import urllib.request
        os.makedirs(EMOJI_CACHE, exist_ok=True)
        try:
            urllib.request.urlretrieve(EMOJI_URL.format(cp), cached)
        except Exception as ex:
            missing.append(f"эмодзи {e} ({ex})"); return "emoji:" + e
    os.makedirs(os.path.join(pub, "emoji"), exist_ok=True)
    link(cached, os.path.join(pub, "emoji", cp + ".png"))
    return f"emoji/{cp}.png"


def collect(node, base, pub, missing, emoji=True):
    """Каждую строку-путь к медиа копируем в public/m/ и подменяем на путь внутри public."""
    if isinstance(node, dict):
        if "emoji" in node and "scenes" not in node and isinstance(node["emoji"], str) and emoji:  # элемент objects
            node = dict(node, src="emoji:" + node["emoji"]); node.pop("emoji")
        return {k: (v if k in SKIP_KEYS else collect(v, base, pub, missing, emoji)) for k, v in node.items()}
    if isinstance(node, list):
        return [collect(v, base, pub, missing, emoji) for v in node]
    if isinstance(node, str) and node.startswith("emoji:") and emoji:
        return emoji_local(node[6:], pub, missing)
    if isinstance(node, str) and node.lower().endswith(EXT) and not node.startswith(("http", "emoji:", "sfx/", "fonts/")):
        p = node if os.path.isabs(node) else os.path.join(base, node)
        if not os.path.exists(p):
            missing.append(node); return node
        name = hashlib.md5(os.path.abspath(p).encode()).hexdigest()[:10] + os.path.splitext(p)[1].lower()
        link(p, os.path.join(pub, "m", name))
        return "m/" + name
    return node


TEXT_KINDS = {"text", "act", "objects", "qr", "stat", "chart", "counter", "chat"}
MIN_SCENE, MIN_MEDIA = 0.8, 0.7  # короче — вставка мелькает: «быстро начинается и быстро заканчивается»


def lint(scenes, total):
    """Предупреждения по плану: мелькающие вставки и тёмный фон у текста (правки пользователя)."""
    sc = sorted(scenes, key=lambda s: s["at"])
    warn = []
    for i, s in enumerate(sc):
        t1 = sc[i + 1]["at"] if i + 1 < len(sc) else total
        if t1 - s["at"] < MIN_SCENE:
            warn.append(f"{s['at']:6.2f} {s['kind']}: сцена {t1 - s['at']:.2f} с — мелькнёт; слей с соседней или начни раньше")
        if s.get("dark") and s["kind"] in TEXT_KINDS:
            warn.append(f"{s['at']:6.2f} {s['kind']}: dark игнорируется — текст всегда чёрным по белому")
        media = [m for m in s.get("media", []) if isinstance(m, dict) and m.get("at") is not None]
        if not media: continue
        ats = [s["at"]] + [m["at"] for m in media] + [t1]
        for a, b in zip(ats, ats[1:]):
            if b - a < MIN_MEDIA:
                warn.append(f"{a:6.2f} {s['kind']}: кадр в рамке {b - a:.2f} с — слишком быстро сменится")
    if warn:
        print("Проверь план:\n  " + "\n  ".join(warn))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("plan")
    ap.add_argument("--preview", action="store_true")
    ap.add_argument("--still")
    ap.add_argument("--start", type=float); ap.add_argument("--end", type=float)
    ap.add_argument("--out")
    a = ap.parse_args()

    plan = json.load(open(a.plan, encoding="utf-8"))
    base = os.path.dirname(os.path.abspath(a.plan))
    rp = lambda p: p if os.path.isabs(p) else os.path.join(base, p)
    work = rp(plan.get("work_dir", "_work_esse"))
    pub = os.path.join(work, "public")
    for d in ("m", "fonts", "sfx"):
        os.makedirs(os.path.join(pub, d), exist_ok=True)
    for d in ("fonts", "sfx"):
        for f in os.listdir(os.path.join(ENGINE, "assets", d)):
            link(os.path.join(ENGINE, "assets", d, f), os.path.join(pub, d, f))

    wo = json.load(open(os.path.join(work, "words_out.json"), encoding="utf-8"))
    link(os.path.join(work, "voice.wav"), os.path.join(pub, "voice.wav"))
    missing = []
    p = collect(plan, base, pub, missing, emoji=plan.get("emoji", "apple") == "apple")
    if missing:
        sys.exit("Нет файлов: " + ", ".join(missing))
    fps = plan.get("fps", 30)
    props = {
        "fps": fps,
        "duration": plan.get("duration") or round(wo["duration"] + plan.get("tail", 0.8), 3),
        "voice": "voice.wav",
        "voice_volume": plan.get("voice_volume", 1),
        "words": [{"w": w["w"], "s": w["s"], "e": w["e"]} for w in wo["words"]],
    }
    for k in ("music", "sfx", "sfx_volume", "sfx_list", "accent", "emoji", "overlays", "phrase", "scenes"):
        if k in p: props[k] = p[k]
    lint(props["scenes"], props["duration"])
    props_path = os.path.join(work, "props.json")
    json.dump({"plan": props}, open(props_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Сцен: {len(props['scenes'])}, длительность {props['duration']:.1f} c, медиа скопировано в {pub}")

    npx = "npx.cmd" if os.name == "nt" else "npx"
    common = ["--props", props_path, "--public-dir", pub, "--log", "error", "--timeout", "120000"]
    if a.still:
        sd = os.path.join(work, "stills")
        os.makedirs(sd, exist_ok=True)
        # одна сборка на все кадры, иначе каждый кадр пересобирает проект и копирует public
        bundle = os.path.join(work, "bundle")
        subprocess.run([npx, "remotion", "bundle", "src/index.ts", "--public-dir", pub, "--out-dir", bundle,
                        "--log", "error"], cwd=ENGINE, check=True)
        shots = []
        for t in [float(x) for x in a.still.split(",")]:
            out = os.path.join(sd, f"{t:07.2f}.png")
            subprocess.run([npx, "remotion", "still", bundle, "Main", out, "--frame", str(round(t * fps)),
                            "--props", props_path, "--log", "error", "--timeout", "120000",
                           *(["--scale", "0.5"] if a.preview else [])],
                           cwd=ENGINE, check=True)
            shots.append(out)
        grid = os.path.join(work, "stills.jpg")
        cols = min(3, len(shots))
        ins = sum([["-i", s] for s in shots], [])
        n = len(shots)
        lay ="|".join(f"{'+'.join(['w0'] * (i % cols)) or '0'}_{'+'.join(['h0'] * (i // cols)) or '0'}" for i in range(n))
        fc = "".join(f"[{i}:v]scale=640:-1[s{i}];" for i in range(n))
        if n > 1:
            fc += "".join(f"[s{i}]" for i in range(n)) + f"xstack=inputs={n}:layout={lay}:fill=gray"
        else:
            fc = "[0:v]scale=640:-1"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", fc, grid], check=True)
        print("Кадры:", grid)
        return

    out = a.out or rp(plan["out"])
    if a.preview and not a.out:
        out = os.path.splitext(out)[0] + " (черновик).mp4"
    cmd = [npx, "remotion", "render", "src/index.ts", "Main", out, *common, "--codec", "h264", "--crf", "18",
           "--audio-codec", "aac", "--audio-bitrate", "256k"]
    if a.preview: cmd += ["--scale", "0.5"]
    if a.start is not None or a.end is not None:
        f0 = round((a.start or 0) * fps)
        f1 = round(a.end * fps) - 1 if a.end else round(props["duration"] * fps) - 1
        cmd += ["--frames", f"{f0}-{f1}"]
    subprocess.run(cmd, cwd=ENGINE, check=True)
    print("Готово:", out)


if __name__ == "__main__":
    main()
