"""build_story.py — voice timeline + shot list for sugar-es.

  python3 -I build_story.py audio      # concat sections, tighten long pauses -> input/voice.mp3 + timeline/words.json
  python3 -I build_story.py shots      # beats.py anchors (phrases) -> story/shots.json + config.json (duration, badge)

Pauses longer than MAX_GAP inside a section are cut down to MAX_GAP (removed from the middle, with 12 ms crossfades),
so the narration keeps moving. Every word keeps a global start/end in timeline/words.json.
"""
import csv, json, os, re, subprocess, sys, unicodedata
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SEC = os.path.join(HERE, 'input', 'sec')
ORDER = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15']
SR = 44100
MAX_GAP, KEEP_GAP, SECTION_GAP, XF = 0.5, 0.42, 0.6, 0.012


def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    return ''.join(c for c in w if unicodedata.category(c) != 'Mn' and (c.isalnum()))


def words_from_csv(path):
    out, cur = [], None
    for r in csv.DictReader(open(path, encoding='utf-8')):
        c, s, e = r['char'], float(r['start']), float(r['end'])
        if c.isalnum():
            if cur is None: cur = {'word': c, 'start': s, 'end': e}
            else: cur['word'] += c; cur['end'] = e
        elif c in "'’-" and cur is not None: cur['word'] += c
        else:
            if cur: out.append(cur); cur = None
    if cur: out.append(cur)
    return out


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def build_audio():
    pieces, words, t0 = [], [], 0.0
    xf = int(XF * SR)
    for si, k in enumerate(ORDER):
        x, ws = decode(os.path.join(SEC, k + '.mp3')), words_from_csv(os.path.join(SEC, k + '.csv'))
        # keep-ranges: from first word to last word, gaps longer than MAX_GAP shrunk to KEEP_GAP
        keeps, a = [], max(0.0, ws[0]['start'] - 0.04)
        for w0, w1 in zip(ws, ws[1:]):
            gap = w1['start'] - w0['end']
            if gap > MAX_GAP:
                cut0 = w0['end'] + KEEP_GAP / 2; cut1 = w1['start'] - KEEP_GAP / 2
                keeps.append((a, cut0)); a = cut1
        keeps.append((a, min(len(x) / SR, ws[-1]['end'] + 0.12)))
        # map old section time -> new global time
        def remap(tt):
            acc = 0.0
            for (s, e) in keeps:
                if tt <= e: return t0 + acc + max(0.0, tt - s)
                acc += e - s
            return t0 + acc
        for w in ws: words.append({'word': w['word'], 'start': round(remap(w['start']), 3), 'end': round(remap(w['end']), 3), 'sec': k})
        for (s, e) in keeps:
            seg = x[int(s * SR):int(e * SR)].copy()
            if len(seg) > 2 * xf: ramp = np.linspace(0, 1, xf)[:, None]; seg[:xf] *= ramp; seg[-xf:] *= ramp[::-1]
            pieces.append(seg)
        sec_len = sum(e - s for s, e in keeps); t0 += sec_len
        if si < len(ORDER) - 1: pieces.append(np.zeros((int(SECTION_GAP * SR), 2), np.float32)); t0 += SECTION_GAP
        print(f'{k}: {len(x) / SR:6.1f}s -> {sec_len:6.1f}s  (total {t0:6.1f}s)')
    y = np.concatenate(pieces)
    wav = os.path.join(HERE, 'build', 'voice.wav'); os.makedirs(os.path.dirname(wav), exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', wav], input=y.tobytes(), check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-b:a', '192k', os.path.join(HERE, 'input', 'voice.mp3')], check=True)
    os.makedirs(os.path.join(HERE, 'timeline'), exist_ok=True)
    json.dump(words, open(os.path.join(HERE, 'timeline', 'words.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'voice: {len(y) / SR:.1f}s, {len(words)} words')


def build_shots():
    sys.path.insert(0, HERE)
    from beats import BEATS, TAIL
    words = json.load(open(os.path.join(HERE, 'timeline', 'words.json'), encoding='utf-8'))
    nw = [norm(w['word']) for w in words]
    cursor = {k: 0 for k in ORDER}
    def find(sec, phrase):
        toks = [norm(p) for p in phrase.split() if norm(p)]
        idx = [i for i, w in enumerate(words) if w['sec'] == sec]
        for j in range(cursor[sec], len(idx) - len(toks) + 1):
            if all(nw[idx[j + q]] == toks[q] for q in range(len(toks))):
                cursor[sec] = j + 1; return words[idx[j]]
        raise SystemExit(f'anchor not found in section {sec}: "{phrase}" (after word #{cursor[sec]})')
    shots, badge = [], []
    for n, b in enumerate(BEATS):
        sec, phrase, tpl = b[0], b[1], b[2]; params = dict(b[3]) if len(b) > 3 else {}
        w = find(sec, phrase); start = 0.0 if n == 0 else max(0.0, w['start'] - 0.12)
        sh = {'id': f's{n + 1:03d}', 'start': round(start, 3), 'line': phrase, 'scene': tpl, 'in': params.pop('in', {'type': 'cut'}),
              'sfx': [], 'amb': params.pop('amb', None)}
        for cue in params.pop('sfx', []):                                  # [atLocal | 'w:word', name, gain]
            at, name, gain = cue[0], cue[1], cue[2]
            if isinstance(at, str): at = max(0.0, find_after(words, nw, sec, at[2:], w) - start)
            sh['sfx'].append({'at': round(at, 3), 'name': name, 'gain': gain, **(cue[3] if len(cue) > 3 else {})})
        if 'badge' in params:                                              # [value, unit, 'word to land on']
            v, u, on = params.pop('badge'); bt = find_after(words, nw, sec, on, w)
            badge.append([round(bt, 3), v, u]); params['badgeAt'] = round(bt - start, 3)
        # any 'w:word' string anywhere in params (nested lists/dicts too) becomes a local time (seconds from shot start)
        def conv(v):
            if isinstance(v, str) and v.startswith('w:'): return round(find_after(words, nw, sec, v[2:], w) - start, 3)
            if isinstance(v, list): return [conv(x) for x in v]
            if isinstance(v, dict): return {k2: conv(x) for k2, x in v.items()}
            return v
        params = {k2: conv(v) for k2, v in params.items()}
        # automatic sound: pop on counter steps, whoosh on whips, impact on flashes and word stamps, ambience by place
        if sh['in'].get('type') == 'whip': sh['sfx'].append({'at': 0.0, 'name': 'whoosh', 'gain': -12})
        if sh['in'].get('type') == 'flash': sh['sfx'].append({'at': 0.0, 'name': 'impact', 'gain': -7})
        if 'badgeAt' in params: sh['sfx'].append({'at': params['badgeAt'], 'name': 'pop', 'gain': -10})
        for stp in ([params['stamp']] if isinstance(params.get('stamp'), dict) else params.get('stamp', [])): sh['sfx'].append({'at': stp.get('at', 0.1), 'name': 'hit', 'gain': -9})
        for pt in params.get('punch', []): sh['sfx'].append({'at': pt, 'name': 'swish', 'gain': -14})
        if sh['amb'] is None: sh['amb'] = AMB.get(tpl, {'name': 'roomtone', 'gain': -27})
        sh['params'] = {'tpl': tpl, **params}
        if sh['amb'] is None: del sh['amb']
        shots.append(sh)
    end = words[-1]['end'] + TAIL
    for a, b2 in zip(shots, shots[1:]): a['end'] = b2['start']
    shots[-1]['end'] = round(end, 3)
    story = {'title': '¿Y si dejaras el azúcar?', 'duration': round(end, 3), 'shots': shots}
    json.dump(story, open(os.path.join(HERE, 'story', 'shots.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    cfg_p = os.path.join(HERE, 'config.json'); cfg = json.load(open(cfg_p, encoding='utf-8'))
    cfg['duration'] = round(end, 3); cfg['badge'] = sorted(badge)
    json.dump(cfg, open(cfg_p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    durs = [s['end'] - s['start'] for s in shots]
    print(f'{len(shots)} shots, {end:.1f}s, median {sorted(durs)[len(durs) // 2]:.2f}s, max {max(durs):.2f}s ({shots[durs.index(max(durs))]["id"]})')


AMB = {t: {'name': 'roomtone', 'gain': -26} for t in ['eyesOpen', 'bedWide', 'pillowClose', 'clockInsert', 'bedSide', 'sheep', 'ceilingWide', 'phoneGrab', 'phoneScreen', 'sitEdge', 'pullOut', 'faceLift', 'awakeBed', 'fogBed', 'stupor', 'confusion', 'face', 'doctor', 'pills', 'randy', 'randyFace', 'randySleep', 'sonia', 'question', 'portraits', 'whisper', 'kitchenSip', 'scale']}
AMB.update({t: {'name': 'hum', 'gain': -26} for t in ['hospitalBed', 'mirror', 'crashEyes', 'brain', 'prions', 'dna', 'eeg', 'tree', 'coin', 'globe', 'bodyChain', 'nerves', 'symptoms', 'iconRow', 'bigNumber', 'title', 'presenter', 'doxy', 'rats', 'sleepButton', 'laptop', 'deskType', 'endScreen']})
AMB.update({t: {'name': 'city', 'gain': -25} for t in ['streetWalk', 'joltFace', 'italy']})
AMB.update({t: {'name': 'roomtone', 'gain': -26} for t in ['kitchenWalk', 'fridge', 'fridgePOV', 'growl', 'angry', 'coldBed', 'standUp', 'foodThink', 'dreamFood', 'phoneFood', 'obsess', 'eatTable', 'scientist', 'gandhi', 'diary', 'cell', 'cutaway', 'angus', 'comment', 'split']})
AMB.update({t: {'name': 'hum', 'gain': -27} for t in ['tanks', 'bodyTanks', 'fuelSwitch', 'bodyBurn', 'chart', 'compare', 'calendarFlip', 'stopwatch', 'symptom', 'cellBio', 'medal', 'volunteers', 'halfPlate', 'ecg', 'headHunger', 'switchOff', 'ration', 'candles', 'myth', 'balance', 'twoCases', 'recordBook', 'vitamins', 'lind', 'plateDanger', 'ionsDrain', 'people12', 'endCard']})
AMB.update({t: {'name': 'wind', 'gain': -26} for t in ['cave', 'leningradStreet', 'penguin', 'bearDen', 'shipSea', 'liberation']})
AMB.update({t: {'name': 'city', 'gain': -26} for t in ['stadium', 'march', 'arrest', 'stairs']})
AMB.update({'windowDawn': {'name': 'wind', 'gain': -27}, 'venice': {'name': 'wind', 'gain': -28}})


def find_after(words, nw, sec, phrase, after):
    toks = [norm(p) for p in phrase.split() if norm(p)]
    for i, w in enumerate(words):
        if w['sec'] != sec or w['start'] < after['start'] - 1e-6: continue
        if all(i + q < len(words) and nw[i + q] == toks[q] for q in range(len(toks))): return w['start']
    raise SystemExit(f'cue word not found in section {sec} after "{after["word"]}": "{phrase}"')


if __name__ == '__main__':
    {'audio': build_audio, 'shots': build_shots}[sys.argv[1]]()
