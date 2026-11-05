---
name: video-sound
description: >
  This skill should be used when the user runs /video-sound or asks to "add music", "add sound effects",
  "design the sound", "change the music mood", "use my own music", "the music is too loud/quiet", "remix the audio",
  or "redo the soundtrack" for a 2D Video video. It plans mood-based generated music, places SFX and
  ambience cues on the shot list, mixes them under the voiceover with ducking and loudness normalisation, and muxes
  the final MP4.
metadata:
  version: "0.1.1"
  author: Андрей Зенин
---

# /video-sound: music, SFX, ambience and the final mix

Work inside `2d-video/` on the active project. Read `../make-2d-video/references/sound-design.md` (relative to this skill's base directory) first.

## Language policy

- For each new project, ask once: «На каком языке создаём материал? По умолчанию — русский». If the user already specified the language, do not ask again. Use Russian (`ru`) if they choose the default or explicitly delegate the choice; do not treat silence as an answer.
- Save the chosen output language in `config.json` → `language`. All new titles, labels, charts, calls to action and other authored on-screen text must use that language. Preserve proper names and the user's supplied wording.
- Ask about a different source voiceover language only when needed; save it separately as `speechLanguage` (Whisper code or `auto`). Default it to the output language. Transcribe with that source language, never hard-code English.
- Preserve the original narration and verbatim captions. If the existing voiceover is in a different language, explain this and ask whether to keep it or use a translated script and matching replacement voiceover. This kit does not synthesize translated narration or align translated captions automatically.
- For existing projects, reuse the stored language; for legacy projects without it, confirm once, with Russian as the suggested default. Never translate or overwrite an existing project merely by re-rendering it.
- Do not copy English text from the example scenes into a Russian project. Pass explicit text in the selected language to UI helpers (including `subscribeLabel` on the end screen); check a preview for stray English and missing Cyrillic glyphs.

## 1. Music plan
- Read `story/bible.md` and the shot list, then write `story/shots.json` → `"music"`: contiguous sections `{start, end, mood, intensity}` that change at story turns (title card, discovery, danger, climax, resolution, explanation), typically every 30–90 s.
- Moods: `mystery, tension, action, wonder, hopeful, sad, triumph, playful, calm, dark, epic`. Intensity 0–1 adds pulse, arpeggios and drums.
- Audition a mood: `python audio/music.py --mood tension --intensity 0.7 --dur 20 --out build/test_tension.wav`, and send the WAV if the user wants to listen.
- **User's own track:** copy it into `projects/<slug>/input/` and set `config.json` → `"music": {"enabled": true, "file": "input/<name>.mp3", "gainDb": -17}`. It loops or trims, and the end fades.
- **No music:** `"music": {"enabled": false}`.

## 2. SFX and ambience
- Per shot: `"sfx": [{"at": <s from shot start>, "name": "<effect>", "gain": -8}]` (optional `dur`, `seed`, `pitch`; `name` may be a path to the user's own WAV/MP3 inside the project). Per shot ambience: `"amb": {"name": "rain|wind|city|roomtone|murmur|hum", "gain": -20}`.
- List the library with `python audio/sfx.py --list`, or audition it with `python audio/sfx.py --demo build/sfx_demo`.
- Place cues on actions and graphics: `whoosh`/`swish` on whips and fast moves, `pop`/`blip` when graphics appear, `counter` under ticking numbers, `riser` then `impact`/`stinger` on reveals, `slowmo`/`freeze` for time effects, `hit`/`kick`/`footstep` on contact. Never stack more than ~2 cues at the same instant.

## 3. Mix and mux
Run `python audio/mix.py --project projects/<slug>`. It ducks the music −9 dB and ambience −5 dB under the voice, normalises to `config.loudness` (−14 LUFS default), writes `build/mix.wav`, and, when `build/video_silent.mp4` exists, writes `out/<title>.mp4`.
- Levels: `config.music.gainDb` (default −17 relative to the voice) and `config.sfx.gainDb` (default −6). Change them by 2–3 dB per iteration.
- QC: listen points or `ffmpeg -i out/<file>.mp4 -af ebur128=framelog=quiet -f null -` (integrated loudness about −14 LUFS) and check that the duration matches the video.
