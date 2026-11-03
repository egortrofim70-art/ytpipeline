---
name: content-uniqueness
description: Check a draft video script against transcripts of competitor/reference videos covering the same topic, to catch phrases or sentence structures that ended up too close to the source even after paraphrasing. Also builds a quantified "Style Bible" from a batch of reference videos BEFORE writing a script — counts how many references actually use each structural pattern (hook shape, escalating counter, narrative voice, pacing) instead of guessing from a handful of eyeballed examples. Use before recording voiceover for any script built on facts also used by other creators (e.g. "what if" explainer videos, documentary-style scripts) — especially when the source material (medical facts, historical facts, Wikipedia-style info) is the same one a competitor already used, so independent paraphrasing can converge on near-identical wording.
---

# Content uniqueness check

Facts are never the problem — the same real-world facts (e.g. clinical stages of
a disease) are fair game for everyone and get used by every creator covering the
topic. The actual risk is **wording and structure converging on the competitor's
script** because both scripts are paraphrasing the same source sentence.

## When to use

- **Before writing a new script**, when there's a batch of reference videos
  (ideally 10+) from successful channels in the same niche — build a Style
  Bible first (see below) so the script formula is based on a measured count,
  not a vague impression from the 2-3 videos that happen to be memorable.
- Before sending a finished script to TTS, when the script was built after
  watching/reading a competitor's video on the same topic.
- Whenever the user says something like "сделай уникально", "не спиздить",
  "непохоже на референс по тексту".

## Step 0 (optional, do this first if you have a batch of references): build a Style Bible

Don't eyeball a handful of competitor videos and write down "they usually open
with a hook, then escalate" — that's a guess dressed up as a pattern. Instead:

1. Get `.srt` subtitles for each reference video (if they're not already
   downloaded with subs, transcribe with `montazh-esse`'s/`montazh-epizod`'s
   `scripts/transcribe.py`, or reuse the SRT the project's own TTS pipeline
   downloads for already-produced reference audio).
2. Optionally, for a handful of the references, build a contact sheet (a
   frame grid) to scan pacing/composition at a glance instead of scrubbing:
   ```
   python3 -E <skill>/scripts/contact_sheet.py ref1.mp4 ref1_sheet.jpg --interval 2
   ```
3. Run the quantified analyzer across every reference `.srt` at once:
   ```
   python3 -E <skill>/scripts/build_style_bible.py ref1.srt ref2.srt ... --out style_bible.md
   ```
4. Read the aggregate counts ("14 of 20 videos open with a fact-first hook,
   no setup"). Only build the new script's formula around a beat that clears
   roughly 70% of the sample — a beat 2-3 videos happen to share is
   coincidence, not the format. The per-reference table in the output is
   there to sanity-check the aggregate, not just the headline percentages.
5. Write the actual script using that formula as a guide for *structure and
   pacing* only — never copy phrasing from the references (that's what the
   uniqueness check below catches if it slips through anyway).

## How to run

1. Get plain-text transcripts of the reference video(s). If only a video file
   exists, transcribe it first — `montazh-esse`'s `scripts/transcribe.py` (or
   `montazh-epizod`'s) already does this via faster-whisper; save the output as
   plain text (one line per sentence is fine, punctuation matters for sentence
   splitting).
2. Save the draft script as a plain `.txt` file (just the narration text, no
   JSON/markdown wrapper).
3. Run:
   ```
   python3 -E <skill>/scripts/check_uniqueness.py draft.txt ref1.txt [ref2.txt ...] --out report.json
   ```
   `<skill>` = `.claude/skills/content-uniqueness`. Default thresholds: 6
   consecutive shared words flags an exact-phrase overlap; 0.75 sentence
   similarity flags a structurally-copied sentence. Tune with `--ngram` /
   `--sentence-threshold` if the topic has a lot of necessarily-shared technical
   terms (lower sensitivity) or the draft is very close to the source order
   (raise sensitivity).
4. Read the printed report (also saved as JSON if `--out` given):
   - **N-gram overlaps**: exact runs of N+ words shared with a reference —
     rewrite these phrases specifically, even if the surrounding sentence is
     fine.
   - **Sentence matches**: draft sentences structurally too similar to a
     reference sentence (same idea, same order, just swapped words) — rewrite
     the whole sentence's structure, not just synonyms.
5. If verdict is `REVISAR`, fix the flagged spots and re-run until `OK` before
   handing the script off for TTS.

## What this does NOT do

- It is not a copyright/plagiarism legal check — it's a lexical/structural
  similarity heuristic to catch "too close for comfort" paraphrasing.
- It does not flag shared facts, numbers, or necessary terminology by
  themselves — only matching phrasing or sentence structure.
- It compares against the reference texts you give it; it has no access to the
  wider internet, so it can't catch convergence with a video it wasn't given.
