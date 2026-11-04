# Звук

Слои: голос (из `timeline.json`) + подложка `public/sfx/bed.wav` (эмбиент, эффекты, музыка по желанию). Подложку собирает `node tools/make-sound.mjs` из `src/story/sound.json`, голос и подложку сводит `tools/mix-audio.mjs`, громкость выравнивает `tools/loudness.mjs` (−16 LUFS). `tools/render.mjs` делает это сам.

## sound.json
```json
{
 "ambience": [{"from": "001", "to": "007", "kind": "room", "gain": 0.05, "birds": true},
              {"from": "007", "to": "end", "kind": "street", "gain": 0.06}],
 "music": [],
 "sfx": [
  {"at": "003", "off": 12, "type": "steps", "dur": 2.0, "pan": -0.4},
  {"at": "004", "off": 30, "type": "clap"},
  {"at": "005", "off": 44, "type": "stamp"}
 ]
}
```
- `from`/`to` — id реплик (`"end"` — до конца). `at` + `off` — реплика и кадры от её начала. Ставь эффект на то же место, где действие в сцене.
- Эмбиент `kind`: room, hall (гул школы), crowd (толпа), night, street, fridge (кухня ночью), rain, wind, sea (прибой). Громкость эмбиента 0,03–0,08.
- Эффекты `type`: click (щелчок со звоном), switch (рубильник, выключатель), splash (всплеск), pop, ding, chat, sent, whoosh, whooshUp (нарастание), swoosh, stamp, thud, clap, steps (`dur`), buzz (гул неона, `dur`), heartbeat, alarm, siren, crackle (огонь), ring (будильник), birds.
- Автоматически (из `src/story/auto-cues.json`, его пишет `check-plans.mjs`) добавляются вжух на каждом переходе `whip` и щелчок на каждом изменении счётчика. Сначала запусти `check-plans`, потом `make-sound`.
- Музыка — только если пользователь выбрал её на интервью: `"music": [{"from": "001", "to": "end", "style": "pizz", "amp": 0.22}]`. Стили: pizz (лёгкое пиццикато), disco, piano (тёплое), pad-tense (тревога), pad-warm. Музыку автоматически приглушает под голосом. Цель — в паузах на 20 дБ тише голоса.

## Что должно звучать (чек-лист)
- Каждый вход в кадр — шаги. Рукопожатие или «дай пять» — хлопок. Штамп — удар. Неоновая табличка — гул при включении. Смена числа — щелчок (автоматически). Смена локации — вжух (автоматически). Сообщение в чате — chat или sent. Тревога, огонь, сирена — по сцене.
- Эмбиент на каждой локации, без тишины под голосом.

## Проверка
`node tools/loudness.mjs --measure out/Long.mp4`: −16 ± 1 LUFS, пик не выше −1 dB. `check-video.mjs` тоже это проверяет. Нет клиппинга, нет провалов (пауз без эмбиента).
