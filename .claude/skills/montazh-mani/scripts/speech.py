"""Речь: дословная расшифровка (с запинками) и поиск повторов слов.

Whisper по умолчанию «причёсывает» речь: выбрасывает запинки и повторы, а их время приписывает соседнему слову.
Подсказка initial_prompt с запинками заставляет его писать дословно — тогда повторы видны и их можно вырезать.
"""
import re, subprocess, wave, os, tempfile
import numpy as np

VERBATIM_PROMPT = ("Ну, э-э, я я хотел, хотел сказать, что что это, это ми- миллион. "
                   "Можно, можно ли стать... И при, и при таких условиях.")

# короткие служебные слова, которые бывают началом следующего слова законно («при приходе», «так также»)
SHORT_OK = {"при", "так", "над", "под", "про", "без", "для", "как", "где", "все", "это", "его", "она", "они",
            "мне", "нам", "вам", "тот", "там", "раз", "уже", "еще", "что", "кто", "чем", "или", "она", "был"}


def load_audio(path):
    fd, wav = tempfile.mkstemp(suffix=".wav")  # свой файл на каждый запуск: параллельные расшифровки не мешают друг другу
    os.close(fd)
    try:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000", wav], check=True)
        with wave.open(wav) as w:
            a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
            return a, w.getnframes() / 16000
    finally:
        os.remove(wav)


_models = {}


def get_model(name):
    if name not in _models:
        from faster_whisper import WhisperModel
        _models[name] = WhisperModel(name, device="cpu", compute_type="int8")
    return _models[name]


def transcribe_clip(audio, offset, model="small", lang="ru"):
    """Дословная расшифровка короткого куска (дубля): на коротком куске whisper не теряет повторы
    и точнее ставит время. -> words с временем исходника (offset — начало куска)."""
    segs, _ = get_model(model).transcribe(audio, language=lang, word_timestamps=True, vad_filter=False,
                                          condition_on_previous_text=False, initial_prompt=VERBATIM_PROMPT,
                                          temperature=0)
    return [{"w": wd.word.strip(), "s": round(offset + wd.start, 2), "e": round(offset + wd.end, 2)}
            for s in segs for wd in (s.words or [])]


def transcribe(path, model="small", lang="ru", verbatim=True, vad=True, on_segment=None):
    """-> (duration, words[{w,s,e}], segments[{s,e,text}]). На длинном файле whisper может пропускать
    повторённые дубли целиком — для монтажа выбранные дубли расшифровываются отдельно (transcribe_clip)."""
    audio, dur = load_audio(path)  # numpy-массив вместо пути: обходит несовместимость faster-whisper с новым PyAV
    segs, _ = get_model(model).transcribe(audio, language=lang, word_timestamps=True, vad_filter=vad,
                                          vad_parameters={"min_silence_duration_ms": 300},
                                          condition_on_previous_text=False,
                                          initial_prompt=VERBATIM_PROMPT if verbatim else None, temperature=0)
    words, segments = [], []
    for s in segs:
        segments.append({"s": round(s.start, 2), "e": round(s.end, 2), "text": s.text.strip()})
        for wd in s.words or []:
            words.append({"w": wd.word.strip(), "s": round(wd.start, 2), "e": round(wd.end, 2)})
        if on_segment: on_segment(s)
    return dur, words, segments


def norm(w):
    return re.sub(r"[^\w%₽$€]", "", w.lower().replace("ё", "е"))


def find_repeats(words, max_n=4, max_gap=1.5):
    """Повторы с тем же смыслом: «но, но», «если просто, если просто», обрывки «ми- миллион».
    Оставляет последнее произношение. -> (индексы к удалению, [(индексы, причина)])."""
    toks = [norm(w["w"]) for w in words]
    drop, log = set(), []
    i, n = 0, len(words)
    while i < n:
        if not toks[i]:
            i += 1; continue
        hit = False
        for k in range(max_n, 0, -1):  # сначала длинные фразы: «если просто, если просто»
            if i + 2 * k > n: continue
            a, b = toks[i:i + k], toks[i + k:i + 2 * k]
            if all(a) and a == b and words[i + k]["s"] - words[i + k - 1]["e"] < max_gap:
                idx = list(range(i, i + k))
                drop.update(idx)
                log.append((idx, "повтор «" + " ".join(w["w"] for w in words[i:i + k]) + "»"))
                i += k; hit = True
                break
        if hit: continue
        nxt = toks[i + 1] if i + 1 < n else ""
        raw = words[i]["w"]
        frag = nxt and words[i + 1]["s"] - words[i]["e"] < 1.0 and (
            raw.endswith("-") or (len(toks[i]) >= 3 and toks[i] not in SHORT_OK
                                  and nxt.startswith(toks[i]) and len(nxt) - len(toks[i]) >= 2))
        if frag:
            drop.add(i); log.append(([i], f"обрывок «{raw}» перед «{words[i + 1]['w']}»"))
        i += 1
    return drop, log


def long_words(words, limit=0.9):
    """Слова, растянутые дольше limit секунд, — под ними часто прячется запинка или пауза."""
    return [w for w in words if w["e"] - w["s"] > limit and len(norm(w["w"])) <= 12]
