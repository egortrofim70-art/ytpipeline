"""Дословная расшифровка по словам (с запинками и повторами):
python transcribe.py <video> <out.json> [--model small] [--clean]
Пишет JSON: {"duration":..., "words":[{"w","s","e"}], "segments":[{"s","e","text"}]}
--clean — обычная «причёсанная» расшифровка (повторы не видны — для монтажа не годится)."""
import argparse, json, sys, os
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from speech import transcribe, find_repeats, long_words

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("out")
ap.add_argument("--model", default="small"); ap.add_argument("--lang", default="ru")
ap.add_argument("--clean", action="store_true")
a = ap.parse_args()

dur, words, segments = transcribe(a.video, a.model, a.lang, verbatim=not a.clean,
                                  on_segment=lambda s: print(f"[{s.start:7.1f}-{s.end:7.1f}] {s.text.strip()}", flush=True))
json.dump({"duration": dur, "words": words, "segments": segments},
          open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
_, log = find_repeats(words)
print(f"\nПовторов и обрывков в исходнике: {len(log)} (их уберёт нарезка, если они попадут в дубли)")
for idx, why in log[:60]:
    print(f"  {words[idx[0]]['s']:7.2f} {why}")
lw = long_words(words)
if lw:
    print("Растянутые слова (проверь — там бывает запинка):", ", ".join(f"«{w['w']}» {w['s']:.1f}" for w in lw[:30]))
