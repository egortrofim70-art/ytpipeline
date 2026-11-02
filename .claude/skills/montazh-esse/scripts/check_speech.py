"""Проверка смонтированной речи: повторы слов, запинки, обрывки, лишние слоги на стыках, пропавшие слова.
python check_speech.py "<итог>.mp4" [--model small]
python check_speech.py _work/cut.mkv --edl _work/edl.json   # + время в исходнике и сверка с планом
Расшифровывает файл дословно и печатает каждое место с временем этого файла."""
import argparse, difflib, json, sys, os
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from speech import transcribe, find_repeats, long_words, norm

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("--model", default="small")
ap.add_argument("--edl", help="_work/edl.json — время в исходнике и сверка с ожидаемым текстом")
a = ap.parse_args()

edl = json.load(open(a.edl, encoding="utf-8")) if a.edl else None


def where(t):
    if not edl: return f"{t:6.2f} c"
    for (s, e), o in zip(edl["keep"], edl["out_starts"]):
        if o <= t < o + (e - s) + 1e-6:
            return f"{t:6.2f} c (исх. {s + t - o:7.2f})"
    return f"{t:6.2f} c"


_, words, _ = transcribe(a.video, a.model)
print("Текст:", " ".join(w["w"] for w in words))
_, log = find_repeats(words)
if log:
    print(f"\nОстались повторы/обрывки: {len(log)}")
    for idx, why in log:
        i0, i1 = idx[0], idx[-1]
        ctx = " ".join(w["w"] for w in words[max(0, i0 - 3):i1 + 5])
        print(f"  {where(words[i0]['s'])}  {why}   …{ctx}…")
else:
    print("\nПовторов и обрывков не найдено.")

if edl and edl.get("expected"):
    # Сверка с планом: что должно звучать (слова оставленных дублей) против того, что звучит.
    # Лишнее на стыке — хвост соседней фразы или бормотание; пропало — склейка съела слово.
    exp = [x for x in edl["expected"] if norm(x["w"])]
    act = [w for w in words if norm(w["w"])]
    E, A = [norm(x["w"]) for x in exp], [norm(w["w"]) for w in act]
    joints = edl["out_starts"][1:]
    issues = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, E, A, autojunk=False).get_opcodes():
        if op == "equal": continue
        ew, aw = " ".join(x["w"] for x in exp[i1:i2]), " ".join(w["w"] for w in act[j1:j2])
        t = act[j1]["s"] if j2 > j1 else exp[min(i1, len(exp) - 1)]["t"]
        if op == "insert":
            issues.append((t, f"лишнее «{aw}»"))
        elif op == "delete":
            issues.append((t, f"пропало «{ew}»"))
        elif (j2 - j1) > (i2 - i1) or difflib.SequenceMatcher(None, "".join(E[i1:i2]), "".join(A[j1:j2])).ratio() < 0.6:
            issues.append((t, f"в плане «{ew}», слышно «{aw}»"))
    if issues:
        print(f"\nРасхождения с планом: {len(issues)} (часть — ошибки распознавания; «на стыке» — проверь в первую очередь)")
        for t, why in issues:
            mark = "на стыке  " if any(abs(t - j) < 0.6 for j in joints) else "          "
            print(f"  {mark}{where(t)}  {why}")
    else:
        print("Текст совпадает с планом.")

lw = long_words(words)
if lw:
    print("Растянутые слова (послушай эти места):", ", ".join(f"«{w['w']}» {where(w['s'])}" for w in lw))
