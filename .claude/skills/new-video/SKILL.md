---
name: new-video
description: >
  This skill should be used when the user runs /new-video or asks to "start a new 2D video", "set up a video
  from this voiceover", "timestamp my voiceover", "transcribe and time my narration", "import my SRT/timestamped
  script", or "plan the shots for my script" in the 2D Video. It covers intake, installing or checking
  the studio, creating the project, building word-level timestamps (Whisper or the user's timestamped script),
  and the story breakdown with the shot list.
metadata:
  version: "0.1.1"
  author: Андрей Зенин
---

# /new-video: intake → install → timeline → story breakdown

This command covers stages 1–4 of the 2D Video pipeline. Shared references live in the sibling skill folder `../make-2d-video/references/` (relative to this skill's base directory), and the studio kit lives in `../make-2d-video/kit/`.

## Language policy

- For each new project, ask once: «На каком языке создаём материал? По умолчанию — русский». If the user already specified the language, do not ask again. Use Russian (`ru`) if they choose the default or explicitly delegate the choice; do not treat silence as an answer.
- Save the chosen output language in `config.json` → `language`. All new titles, labels, charts, calls to action and other authored on-screen text must use that language. Preserve proper names and the user's supplied wording.
- Ask about a different source voiceover language only when needed; save it separately as `speechLanguage` (Whisper code or `auto`). Default it to the output language. Transcribe with that source language, never hard-code English.
- Preserve the original narration and verbatim captions. If the existing voiceover is in a different language, explain this and ask whether to keep it or use a translated script and matching replacement voiceover. This kit does not synthesize translated narration or align translated captions automatically.
- For existing projects, reuse the stored language; for legacy projects without it, confirm once, with Russian as the suggested default. Never translate or overwrite an existing project merely by re-rendering it.
- Do not copy English text from the example scenes into a Russian project. Pass explicit text in the selected language to UI helpers (including `subscribeLabel` on the end screen); check a preview for stray English and missing Cyrillic glyphs.

## 1. Intake
Ask once (AskUserQuestion when available), skipping anything the user already said:
- **Voiceover file** (required).
- **Script:** timestamped (SRT, VTT, JSON, or TXT with `[mm:ss]`), plain text, or none.
- **Aspect:** 16:9 or 9:16.
- **Resolution:** 720p / 1080p / 1440p / 2160p.
- **Captions:** default on for 9:16.
- **Music:** generated, own file, or none. **SFX:** on or off.
- **Title.**

Defaults: language `ru`, speech language same as output, 16:9, 1080p, generated music + SFX.

## 2. Studio
If `2d-video/render.mjs` doesn't exist in the workspace, follow `../make-2d-video/references/install.md` in full. Otherwise run `python tools/doctor.py` inside it and fix anything reported.

## 3. Project and timestamps (inside `2d-video/`)
```bash
python tools/new_project.py --name <slug> --lang <language> --speech-lang <speech-language> --voice "<voiceover>" [--script "<script>"] --aspect <16:9|9:16> --resolution <res> --title "<title>" [--captions]
```
- **Timestamped script** → `python tools/parse_script.py --project projects/<slug> --script projects/<slug>/input/script.<ext>`. It accepts SRT, VTT, JSON (`[{start,end,text}]`, `{segments}`, `{words}`) and TXT lines like `[00:12.5] text`, `00:12 - 00:15 text` or `00:00:12,500 --> 00:00:15,000 text`. If the parser reports no timestamps, fall back to the plain-script route.
- **Plain script** → `python tools/transcribe.py --project projects/<slug> --script projects/<slug>/input/script.txt --lang <speech-language> --model small`. It keeps the script's exact words with Whisper timing. Require ≥ 90% match; if lower, tell the user the script and audio differ.
- **No script** → `python tools/transcribe.py --project projects/<slug> --lang <speech-language> --model small` (`base` for speed, `large-v3` for difficult audio). The first run downloads the model.

Open `timeline/transcript.txt` and confirm it reads correctly and ends near the voiceover length. Then run `python tools/beats.py --project projects/<slug>` (add `--force` to overwrite an existing shots.json).

## 4. Story breakdown
Read `../make-2d-video/references/style-bible.md` and `../make-2d-video/references/story-breakdown.md` fully, then:
1. Write `projects/<slug>/story/bible.md`: logline and tone, the cast (one saturated signature item each), locations (mood, key light, window view, props), motifs and the music plan.
2. Write `projects/<slug>/scenes/cast.js` with the outfits.
3. Rewrite `projects/<slug>/story/shots.json` following the pacing rules. Every shot needs a concrete `scene` description, plus transitions, bars, sfx and amb where they matter.
4. Send the user a 5–10 line summary: the cast, the locations, the shot count, and the highlights per act.

Finish by saying the next step is `/video-styles` (or continue with the full pipeline in the `make-2d-video` skill if the user asked for the whole video).
