"""Подготовка голоса для видеоэссе: дубли -> чистая речь без пауз и повторов + слова во времени итога.

python prep.py plan.json          # _work_esse/voice.wav, words_out.json, edl.json, текст итога по фразам

В plan.json нужны: "source" (запись голоса: аудио или видео), "words" (words.json от transcribe.py),
"cuts" ({"takes": [[s, e], ...], "max_gap": 0.12, "drop": [...], "keep_repeats": [...]}),
"subs" ({"fix": {"<время исх.>": "слово"}, "replace": {"клодку": "Claude Code"}, "lower": true}).
Нарезка та же, что в «Мани»/«Слайдах»: последний чистый дубль, повторы и обрывки вырезаются, склейки — в тишину.
"""
import argparse, json, os, re, subprocess, sys
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from speech import load_audio, find_repeats, transcribe_clip


# ---------------------------------------------------------------- нарезка (из core.py «Мани»)
def envelope(a):
    fr = a[:len(a) // 160 * 160].reshape(-1, 160)
    return 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)


def snap(env, t, lo, hi):
    i0, i1 = max(0, int((t + lo) * 100)), min(len(env), int((t + hi) * 100) + 1)
    if i1 - i0 < 2: return t
    seg = np.convolve(env[i0:i1], np.ones(5) / 5, mode="same")
    return (i0 + int(np.argmin(seg))) / 100


def snap_bound(env, t, reach=0.35, min_run=0.04):
    """Граница дубля — в ближайшую паузу, чтобы не резать слово."""
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
    return round((b + j) / 200, 2)


def auto_keep(words, dur, cfg, env=None):
    """-> (куски [[s, e]], журнал вырезанных повторов, оставленные слова)."""
    gap, pin, pout = cfg.get("max_gap", 0.12), cfg.get("pad_in", 0.06), cfg.get("pad_out", 0.12)
    drop = cfg.get("drop", [])
    takes = cfg.get("takes")
    ws = [w for w in words if not any(a <= (w["s"] + w["e"]) / 2 <= b for a, b in drop)]
    seq = [(ti, w) for ti, (ta, tb) in enumerate(takes or [[0, dur]]) for w in ws if ta <= (w["s"] + w["e"]) / 2 <= tb]
    log, restart = [], set()
    if cfg.get("dedupe", True):
        protect = cfg.get("keep_repeats", [])
        rm, found = find_repeats([w for _, w in seq])
        rm = {i for i in rm if not any(abs(seq[i][1]["s"] - p) < 0.5 for p in protect)}
        log = [(seq[idx[0]][1]["s"], why) for idx, why in found if idx[0] in rm]
        restart = {id(seq[i][1]) for i in range(1, len(seq)) if i - 1 in rm and i not in rm}
        seq = [x for i, x in enumerate(seq) if i not in rm]
    cap = cfg.get("max_word", 1.0)
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
        if env is not None:
            s, e = snap(env, s, -0.15, 0.35 if rs else 0.06), snap(env, e, -0.06, 0.15)
        s, e = max(s, ta), min(e, tb)
        if out and s < out[-1][1] and s > out[-1][0]:
            out[-1][1] = max(out[-1][1], e); continue
        if e - s > 0.12: out.append([s, e])
    return out, log, [w for _, w in seq]


def take_words(audio, src, takes, work, model):
    cache = os.path.join(work, "take_words.json")
    sig = json.dumps([os.path.normcase(os.path.abspath(src)), takes, model])
    if os.path.exists(cache):
        c = json.load(open(cache, encoding="utf-8"))
        if c.get("sig") == sig: return c["words"]
    words = []
    for ta, tb in takes:
        t0 = max(0.0, ta - 0.05)
        words += transcribe_clip(audio[int(t0 * 16000):int((tb + 0.05) * 16000)], t0, model)
    json.dump({"sig": sig, "words": words}, open(cache, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return words


def out_time(keep, starts, t):
    for (s, e), o in zip(keep, starts):
        if t < s: return o
        if t <= e: return o + t - s
    return starts[-1] + keep[-1][1] - keep[-1][0]


# ---------------------------------------------------------------- текст
def fix_words(words, subs):
    """Правки распознавания: fix по времени исходника, replace по слову. Пустая строка — слово скрыть."""
    fix = {float(k): v for k, v in subs.get("fix", {}).items()}
    rep = {k.lower(): v for k, v in subs.get("replace", {}).items()}
    out = []
    for w in words:
        txt = w["w"]
        hit = [v for t, v in fix.items() if abs(t - w["s"]) < 0.06]
        if hit:
            txt = hit[0]
        else:
            core = re.sub(r"[^\w-]", "", txt.lower())
            if core in rep:
                txt = re.sub(re.escape(re.sub(r"[^\w-]", "", txt)), rep[core], txt, flags=re.I)
        if txt.strip():
            out.append(dict(w, w=txt))
    return out


def join_hyphens(words):
    """whisper рвёт слова на дефисе: «из» + «-за», «гипер» + «-реальность» — склеиваем обратно."""
    out = []
    for w in words:
        if out and w["w"].startswith("-") and len(w["w"]) > 1:
            out[-1] = dict(out[-1], w=out[-1]["w"].rstrip(",") + w["w"], e=w["e"])
        else:
            out.append(w)
    return out


def lower_starts(words):
    """Как в образце — строчные: заглавную у начала предложения убираем, если это слово
    нигде в тексте не пишется с заглавной посреди фразы (тогда это имя — оставляем)."""
    proper = set()
    for i, w in enumerate(words):
        if i and not re.search(r"[.!?…]$", words[i - 1]["w"]) and w["w"][:1].isupper():
            proper.add(re.sub(r"\W", "", w["w"]).lower())
    out = []
    for i, w in enumerate(words):
        t = w["w"]
        core = re.sub(r"\W", "", t).lower()
        if t[:1].isupper() and core not in proper and not (len(core) > 1 and t.isupper()):
            t = t[:1].lower() + t[1:]
        out.append(dict(w, w=t))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("plan")
    a = ap.parse_args()
    plan = json.load(open(a.plan, encoding="utf-8"))
    base = os.path.dirname(os.path.abspath(a.plan))
    rp = lambda p: p if os.path.isabs(p) else os.path.join(base, p)
    src = rp(plan["source"])
    work = rp(plan.get("work_dir", "_work_esse"))
    os.makedirs(work, exist_ok=True)
    cuts = plan.get("cuts", {})

    audio, _ = load_audio(src)
    dur = len(audio) / 16000
    env = envelope(audio)
    words = json.load(open(rp(plan["words"]), encoding="utf-8"))["words"]
    if cuts.get("keep"):
        keep, log, kept = cuts["keep"], [], [w for w in words if any(s <= w["s"] < e for s, e in cuts["keep"])]
    else:
        if cuts.get("takes"):
            new = [[snap_bound(env, ta), snap_bound(env, tb)] for ta, tb in cuts["takes"]]
            moved = [f"{x}→{y}" for p, q in zip(cuts["takes"], new) for x, y in zip(p, q) if abs(x - y) > 0.005]
            if moved: print("Границы дублей сдвинуты в паузы: " + ", ".join(moved))
            cuts = dict(cuts, takes=new)
            if cuts.get("verbatim", True):
                words = take_words(audio, src, cuts["takes"], work, cuts.get("model", "small"))
        keep, log, kept = auto_keep(words, dur, cuts, env)
    if log:
        print(f"Вырезаны повторы ({len(log)}): " + "; ".join(f"{t:.1f} {why}" for t, why in log))
    starts, acc = [], 0.0
    for s, e in keep:
        starts.append(acc); acc += e - s

    # голос: склейка с микрофейдами 15 мс
    fc, cat = [], ""
    for i, (s, e) in enumerate(keep):
        fd = min(0.015, (e - s) / 4)
        fc.append(f"[0:a]atrim={s:.4f}:{e:.4f},asetpts=PTS-STARTPTS,afade=t=in:d={fd},afade=t=out:st={e - s - fd:.4f}:d={fd}[a{i}]")
        cat += f"[a{i}]"
    gain = plan.get("voice_gain_db", 0)  # по замеру audio_check.py, стандарта громкости нет
    post = plan.get("voice_af", "")      # свой фильтр ffmpeg, например "afftdn=nr=8"
    af = ",".join(x for x in [f"volume={gain}dB" if gain else "", post] if x) or "anull"
    fc.append(f"{cat}concat=n={len(keep)}:v=0:a=1,{af}[a]")
    fcp = os.path.join(work, "cut_filter.txt")
    open(fcp, "w", encoding="utf-8").write(";\n".join(fc))
    voice = os.path.join(work, "voice.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-/filter_complex", fcp, "-map", "[a]",
                    "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", voice], check=True)

    subs = plan.get("subs", {})
    kept = join_hyphens(kept)
    if subs.get("lower", True):
        kept = lower_starts(kept)
    kept = fix_words(kept, subs)
    wo = [{"w": w["w"], "s": round(out_time(keep, starts, w["s"]), 3), "e": round(out_time(keep, starts, w["e"]), 3),
           "src": w["s"]} for w in kept]
    json.dump({"duration": acc, "words": wo}, open(os.path.join(work, "words_out.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    json.dump({"keep": keep, "out_starts": starts, "total": acc,
               "expected": [{"w": w["w"], "t": w["s"]} for w in wo]},
              open(os.path.join(work, "edl.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Нарезка: {len(keep)} кусков, {dur:.1f} c -> {acc:.1f} c. Голос: {voice}")
    print("\nТекст итога (секунды итога):")
    line, t0 = [], None
    for i, w in enumerate(wo):
        if t0 is None: t0 = w["s"]
        line.append(w["w"])
        nxt = wo[i + 1] if i + 1 < len(wo) else None
        if nxt is None or re.search(r"[.!?…:]$", w["w"]) or nxt["s"] - w["e"] > 0.3 or len(line) >= 12:
            print(f"[{t0:7.2f}] " + " ".join(f"{x}" for x in line))
            print("          " + "  ".join(f"{x['w']}@{x['s']:.2f}" for x in wo[i - len(line) + 1:i + 1]))
            line, t0 = [], None


if __name__ == "__main__":
    main()
