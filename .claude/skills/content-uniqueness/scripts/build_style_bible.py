#!/usr/bin/env python3
"""
Build a quantified "Style Bible" from a batch of reference video
transcripts/subtitles, instead of eyeballing a handful of videos and
guessing at "they usually do X". Mirrors the methodology used by creators
who scrape 20-30 competitor shorts before writing a single script: count
how many references actually exhibit each structural pattern, so claims
read "14 of 20 videos open with a stated-as-fact hook" instead of "most
videos seem to open like that".

Usage:
    python3 -E build_style_bible.py ref1.srt ref2.srt ref3.txt ... \
        [--out style_bible.md]

Accepts .srt (preferred - gives real pacing/words-per-minute and duration)
or plain .txt transcripts (word counts only, no pacing).

What it measures per reference, then aggregates as "N of TOTAL":
- Hook shape: does sentence 1 read as a stated fact / mid-action with no
  setup ("Imagine...", "Once...", "Today I'll show you..." = setup; absence
  of those filler openers = fact-first hook), and is it short (<=16 words)?
- Escalation/counter: 3+ distinct "<number> <unit>" mentions (hours, days,
  years, km, etc. - language-agnostic unit list covers ES/EN/RU) - signals
  a ticking-counter structure.
- Narrative voice: ratio of 2nd-person ("you"/"tú"/"ты") vs 3rd-person
  ("he"/"él"/"он") address, classified as whichever is dominant.
- Mid-video question beat: a "?" appearing outside the first/last two
  sentences - signals a "wait, what?" mystery beat mid-script.
- Closing shape: does the last sentence contain a question mark (reflective
  question to viewer) and/or a subscribe/comment call-to-action phrase?

This is a cheap heuristic pass, not NLP - good enough to turn "I think most
of them do this" into an actual count before committing to a script
formula. Read the per-reference breakdown in the output, not just the
aggregate percentages, before trusting a thin sample.

Caveat: the escalation-counter check only matches digit numbers ("3 days"),
not spelled-out ones ("día tres", "three days") - a script that escalates
with written-out numbers will show up as "no counter" here even if it has
one. Check that signal by eye for scripts written with spelled-out numbers.
"""
import argparse
import re
import sys
from pathlib import Path

UNIT_WORDS = (
    r"hours?|hrs?|days?|years?|months?|weeks?|minutes?|km|kilometers?|"
    r"horas?|días?|dias?|años?|meses?|semanas?|minutos?|"
    r"часов?|часа|час|дней|дня|день|лет|год|года|месяцев|недель|минут"
)
NUMBER_UNIT_RE = re.compile(
    rf"\b(\d[\d.,]*)\s*({UNIT_WORDS})\b", re.IGNORECASE | re.UNICODE
)

SETUP_OPENERS = (
    "imagine", "once upon", "today i", "today we", "let me", "so i",
    "imagina", "había una vez", "hoy te", "hoy voy", "te voy a contar",
    "представь", "однажды", "сегодня я", "давай",
)

SECOND_PERSON = (
    r"\byou\b|\byour\b|\byou're\b|\btú\b|\bte\b|\btu\b|\busted\b|"
    r"\bты\b|\bтебя\b|\bтебе\b|\bтвой\b|\bтвоя\b"
)
THIRD_PERSON = (
    r"\bhe\b|\bshe\b|\bhis\b|\bher\b|\bél\b|\bella\b|\bsu\b|"
    r"\bон\b|\bона\b|\bего\b|\bеё\b|\bее\b"
)

CTA_WORDS = (
    r"subscribe|comment|suscr[ií]bete|coment[ae]|comenta|"
    r"подпи[шс]|коммент"
)


def parse_srt(path: Path) -> tuple[str, float]:
    """Returns (full_text, duration_seconds). duration=0 if unparseable."""
    content = path.read_text(encoding="utf-8")
    blocks = re.split(r"\n\s*\n", content.strip())
    texts = []
    last_end = 0.0
    for b in blocks:
        lines = b.strip().splitlines()
        time_line = next((l for l in lines if "-->" in l), None)
        if not time_line:
            continue
        text = " ".join(lines[lines.index(time_line) + 1 :]).strip()
        texts.append(text)

        def to_sec(ts: str) -> float:
            ts = ts.strip().replace(",", ".")
            h, m, s = ts.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)

        try:
            _, end_raw = time_line.split("-->")
            last_end = max(last_end, to_sec(end_raw))
        except ValueError:
            pass
    return " ".join(texts), last_end


def split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?¿¡])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def analyze(name: str, text: str, duration_sec: float) -> dict:
    sentences = split_sentences(text)
    words = text.split()
    word_count = len(words)

    first = sentences[0].lower() if sentences else ""
    has_setup_opener = any(first.startswith(o) for o in SETUP_OPENERS)
    hook_word_count = len(sentences[0].split()) if sentences else 0
    fact_first_hook = (not has_setup_opener) and hook_word_count <= 16

    number_unit_hits = NUMBER_UNIT_RE.findall(text)
    distinct_units = {u.group(0).lower() for u in NUMBER_UNIT_RE.finditer(text)}
    has_escalation_counter = len(distinct_units) >= 3

    second_person_hits = len(re.findall(SECOND_PERSON, text, re.IGNORECASE | re.UNICODE))
    third_person_hits = len(re.findall(THIRD_PERSON, text, re.IGNORECASE | re.UNICODE))
    if second_person_hits == 0 and third_person_hits == 0:
        voice = "unclear"
    elif second_person_hits >= third_person_hits:
        voice = "2nd person (tú/you)"
    else:
        voice = "3rd person (él/he)"

    mid_sentences = sentences[1:-2] if len(sentences) > 3 else []
    has_mid_question = any("?" in s for s in mid_sentences)

    last = sentences[-1] if sentences else ""
    closes_with_question = "?" in last
    closes_with_cta = bool(re.search(CTA_WORDS, text[-400:], re.IGNORECASE | re.UNICODE))

    wpm = round(word_count / (duration_sec / 60), 1) if duration_sec > 0 else None

    return {
        "name": name,
        "word_count": word_count,
        "duration_sec": round(duration_sec, 1) if duration_sec else None,
        "words_per_minute": wpm,
        "fact_first_hook": fact_first_hook,
        "hook_word_count": hook_word_count,
        "has_escalation_counter": has_escalation_counter,
        "distinct_number_units": len(distinct_units),
        "narrative_voice": voice,
        "has_mid_question_beat": has_mid_question,
        "closes_with_question": closes_with_question,
        "closes_with_cta": closes_with_cta,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("references", type=Path, nargs="+")
    ap.add_argument("--out", type=Path, default=None, help="Write the Style Bible markdown here too")
    args = ap.parse_args()

    results = []
    for path in args.references:
        if path.suffix.lower() == ".srt":
            text, duration = parse_srt(path)
        else:
            text = path.read_text(encoding="utf-8")
            duration = 0.0
        results.append(analyze(path.name, text, duration))

    n = len(results)

    def count(key, value=True):
        return sum(1 for r in results if r[key] == value)

    fact_hook_n = count("fact_first_hook")
    counter_n = count("has_escalation_counter")
    mid_q_n = count("has_mid_question_beat")
    close_q_n = count("closes_with_question")
    close_cta_n = count("closes_with_cta")
    voices = {}
    for r in results:
        voices[r["narrative_voice"]] = voices.get(r["narrative_voice"], 0) + 1
    dominant_voice = max(voices, key=voices.get) if voices else "unclear"

    wpms = [r["words_per_minute"] for r in results if r["words_per_minute"]]
    avg_wpm = round(sum(wpms) / len(wpms), 1) if wpms else None

    lines = []
    lines.append(f"# Style Bible ({n} reference videos analyzed)")
    lines.append("")
    lines.append("## Script formula (quantified, not guessed)")
    lines.append("")
    lines.append(f"- **Fact-first hook, no setup** (<=16-word opener, no \"imagine/once/today I'll\"): "
                  f"{fact_hook_n} of {n} videos → " + ("REQUIRED beat" if fact_hook_n >= n * 0.7 else "common but not universal"))
    lines.append(f"- **Escalating counter** (3+ distinct number+unit mentions, e.g. hour/day counts): "
                  f"{counter_n} of {n} videos")
    lines.append(f"- **Dominant narrative voice**: {dominant_voice} ({voices})")
    lines.append(f"- **Mid-script question/mystery beat** (a \"?\" outside the opening/closing lines): "
                  f"{mid_q_n} of {n} videos")
    lines.append(f"- **Closes on a reflective question to the viewer**: {close_q_n} of {n} videos")
    lines.append(f"- **Closes with an explicit subscribe/comment CTA**: {close_cta_n} of {n} videos")
    lines.append("")
    lines.append("## Pacing")
    lines.append("")
    if avg_wpm:
        lines.append(f"- Average narration pace across references with known duration: **{avg_wpm} words/min**")
    else:
        lines.append("- No .srt references with real durations given — pass .srt files (not .txt) to get pacing.")
    lines.append("")
    lines.append("## Per-reference breakdown")
    lines.append("")
    lines.append("| ref | words | dur(s) | wpm | fact-hook | counter | voice | mid-Q | close-Q | CTA |")
    lines.append("|---|---|---|---|---|---|---|---|---|---|")
    for r in results:
        lines.append(
            f"| {r['name']} | {r['word_count']} | {r['duration_sec'] or '-'} | {r['words_per_minute'] or '-'} | "
            f"{'yes' if r['fact_first_hook'] else 'no'} | {'yes' if r['has_escalation_counter'] else 'no'} | "
            f"{r['narrative_voice']} | {'yes' if r['has_mid_question_beat'] else 'no'} | "
            f"{'yes' if r['closes_with_question'] else 'no'} | {'yes' if r['closes_with_cta'] else 'no'} |"
        )
    lines.append("")
    lines.append("## How to use this")
    lines.append("")
    lines.append("Only build the new script around a beat if it clears roughly 70% of the sample "
                  "(e.g. " + str(round(n * 0.7)) + "+ of " + str(n) + " here) - a pattern two or three "
                  "videos happen to share isn't the format, it's coincidence. Everything below that bar "
                  "is a thing some videos do, not a rule to copy.")

    md = "\n".join(lines)
    print(md)
    if args.out:
        args.out.write_text(md, encoding="utf-8")
        print(f"\n(saved to {args.out})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
