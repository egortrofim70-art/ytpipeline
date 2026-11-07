// _tpl_smoke.js — templates of "Что если ты бросишь курить?". Props are held through the rig (prop: 'cigarette' | 'vape' | …),
// so they move with the hand smoothly; poses are keyed with posesAt (eased blends), never switched by hand-picked points.
import { E, S, ease, prog, lerp, clamp, key, rr, seg, circle, ring, poly, text, measure, glow, alpha, shade, mix, linGrad, rng, shake, FONTS, layer, blurLayer, veil } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { drawFigure, POSES, breathe, posesAt, walkPose, bigFace } from '/engine/rig2d.js';
import { GY, HS } from '../sets/bedroom.js';
import { kitchen, street } from '../sets/week.js';
import { office } from '../sets/places.js';
import { HERO, F } from '../cast.js';
import { camAt, camLerp, blinkAt } from './_tpl_night.js';
import { icon } from './_tpl_sci.js';
import { placeTag } from './_tpl_hunger.js';

const ui = () => S().ui, RED = '#ff5a4a', GREEN = '#5fe39a', BLUE = '#6ab8ff', BP = () => ui().blueprint, GOLD = () => ui().gold, CREAM = () => ui().cream;
const K = (info, t) => ease.inOut(t / info.dur);
const pop = (t, at, d = 0.35) => ease.outBack(prog(t, at, at + d));
const fin = (t, at, d = 0.3) => ease.out(prog(t, at, at + d));
const fc = (n) => (typeof n === 'string' ? F[n] : n) || F.talk;
const label = (g, s, x, y, o = {}) => text(g, s, x, y, { size: o.size || 34, font: FONTS.ui, weight: 900, color: o.color || CREAM(), spacing: o.spacing ?? 3, align: o.align || 'center', alpha: o.a ?? 1, glow: o.glow || 0, glowColor: o.glowColor });
const glowLabel = (g, s, x, y, a, size = 56, col = GOLD()) => label(g, s, x, y, { size, color: col, a, glow: 18, glowColor: alpha(col, 0.55) });
function zoom(g, z, cx = E.W / 2, cy = E.H / 2) { g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); }
function bp(g) { UI.blueprint(g, { grid: 60, a: 0.08 }); glow(g, E.W / 2, E.H / 2, 1000, BP(), 0.06); }
// smoke puff drifting up from x,y (u = 0..1 life)
function puff(g, x, y, u, s = 1, a = 0.45) { if (u <= 0 || u >= 1) return; for (let i = 0; i < 4; i++) circle(g, x + Math.sin(u * 5 + i) * 30 * s + i * 14 * s, y - u * 160 * s - i * 10 * s, (20 + u * 60 + i * 6) * s, alpha('#dfe4ee', a * (1 - u) * (0.7 + i * 0.1))); }
// the hand-to-mouth smoking pose (facing +1): hand at the lips
const DRAG = { ...POSES.stand, eF: [30, -160], hF: [22, -200], eB: [-7, -136], hB: [-9, -100] };
const HOLD = { ...POSES.stand, eF: [24, -140], hF: [40, -136], eB: [-7, -136], hB: [-9, -100] };

export const SMOKE = {
  // 3 · 2 · 1 — huge numbers pop on cue (steps [[t,'3'],[t,'2'],[t,'1']]) over the dark kitchen, then the hero's face
  countdown(g, t, info) {
    blurLayer(g, 16, (g) => kitchen(g, t, camAt(1200, 560, 1.4))); veil(g, '#05040a', 0.72);
    const steps = info.steps || [[0.1, '3'], [0.9, '2'], [1.7, '1']]; let cur = null; for (const st of steps) if (t >= st[0]) cur = st;
    bigFace(g, E.W * 0.3, E.H * 0.64, lerp(300, 320, K(info, t)), { outfit: HERO, face: { eyes: 'ball', brows: 'raised', mouth: 'flat', eyeSize: 1.15, pupil: 0.3 }, look: [0.7, -0.2], rimColor: '#ffb07a', rimSide: 1 });
    if (cur) { const k = ease.outBack(prog(t, cur[0], cur[0] + 0.3)), fade = 1 - prog(t, cur[0] + 0.55, cur[0] + 0.8); g.save(); g.translate(E.W * 0.68, E.H * 0.5); g.scale(k * (1 + 0.2 * (1 - fade)), k * (1 + 0.2 * (1 - fade))); g.globalAlpha *= clamp(fade + 0.25);
      text(g, cur[1], 0, 0, { size: 420, font: FONTS.ui, weight: 900, color: cur[1] === '1' ? RED : GOLD(), stroke: 24, strokeColor: '#05040a', glow: 50, glowColor: alpha(cur[1] === '1' ? RED : GOLD(), 0.7) }); g.restore(); }
  },
  // close-up: a hand stubs the cigarette out in an ashtray on `at`; the ember dies, smoke thins out
  stubOut(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#120c10', '#24161a', '#0a0608']); g.fillRect(0, 0, E.W, E.H); glow(g, E.W / 2, E.H * 0.6, 700, '#ff8a3a', 0.15);
    const at = info.at ?? 0.6, k = ease.inOut(prog(t, 0, at)), z = lerp(1, 1.08, K(info, t)); g.save(); zoom(g, z, E.W / 2, E.H * 0.6);
    g.fillStyle = '#5a6270'; g.beginPath(); g.ellipse(960, 780, 330, 120, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#343a46'; g.beginPath(); g.ellipse(960, 760, 250, 80, 0, 0, Math.PI * 2); g.fill();
    for (const [x, y, a] of [[860, 760, 0.3], [1060, 770, -0.5], [980, 740, 1.2]]) { g.save(); g.translate(x, y); g.rotate(a); rr(g, -40, -8, 80, 16, 6); g.fillStyle = '#d8d4cc'; g.fill(); rr(g, -40, -8, 26, 16, 6); g.fillStyle = '#c8905a'; g.fill(); g.restore(); }
    const cx = lerp(1260, 990, k), cy = lerp(520, 740, k), bend = t > at ? ease.out(prog(t, at, at + 0.3)) : 0;
    seg(g, [[cx + 60, cy - 30], [1700, 260]], 110, '#0a0c16'); seg(g, [[cx + 40, cy - 20], [cx + 110, cy - 50]], 120, '#0a0c16');
    g.save(); g.translate(cx, cy); g.rotate(-0.5 + bend * 0.5); rr(g, -150, -14, 170 - bend * 50, 28, 8); g.fillStyle = '#f4f2ec'; g.fill(); rr(g, -150, -14, 50, 28, 8); g.fillStyle = '#d89a5a'; g.fill();
    const ember = 1 - fin(t, at, 0.5); if (ember > 0) { circle(g, 20 - bend * 50, 0, 14, alpha('#ff6a2a', ember)); glow(g, 20 - bend * 50, 0, 70, '#ff6a2a', 0.6 * ember); } g.restore();
    for (let i = 0; i < 4; i++) puff(g, cx + 10, cy - 20, ((t * 0.5 + i / 4) % 1), 1.1, 0.5 * (1 - fin(t, at, 1.2)));
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 120, fin(t, info.capAt ?? at), 64, RED);
  },
  // the hero smoking: raises the cigarette, takes a drag, exhales a cloud. place: street | kitchen | office. prop: cigarette | vape
  smoker(g, t, info) {
    const place = info.place || 'street', cam = camLerp(camAt(1000, 620, info.z0 ?? 1.6), camAt(1010, 610, info.z1 ?? 1.72), K(info, t));
    const { rim, rimDir } = place === 'kitchen' ? kitchen(g, t, cam) : place === 'office' ? office(g, t, cam) : street(g, t, cam, { dusk: info.dusk ?? 1 });
    if (info.party) { g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(200,80,255,.28)'; g.fillRect(0, 0, E.W, E.H); g.restore(); }
    const per = info.period ?? 2.6, ph = (t % per) / per, drag = ph > 0.25 && ph < 0.5, exhale = ph >= 0.5 ? (ph - 0.5) / 0.5 : 0;
    const pose = breathe(posesAt(ph * per, [[0, HOLD], [per * 0.25, DRAG], [per * 0.5, HOLD]], 0.25), t, 0.6);
    const x = 1000, y = place === 'street' ? GY - 80 : GY;
    layer(g, cam, 1, (g) => {
      drawFigure(g, { x, y, s: HS, facing: 1, outfit: info.outfit || HERO, prop: { type: info.prop || 'cigarette', t, angle: -0.6, color: info.propColor }, pose, face: fc(info.face || { eyes: 'ball', brows: null, mouth: drag ? 'o' : 'smallFlat', lid: 0.35 }), look: [0.6, -0.1], blink: blinkAt(t), rim: { color: rim, dir: rimDir } });
      if (exhale > 0 && info.puff !== false) puff(g, x + 46 * HS, y - 200 * HS, exhale, 1.2, info.prop === 'vape' ? 0.7 : 0.5);
    });
    if (info.counter) { const n = Math.round(lerp(info.counter[0], info.counter[1], prog(t, 0.2, info.dur - 0.2))), cx = E.W * 0.2, cy = E.H * 0.3; rr(g, cx - 200, cy - 110, 400, 210, 28); g.fillStyle = 'rgba(6,8,16,.72)'; g.fill();
      text(g, `${n}`, cx, cy - 20, { size: 120, font: FONTS.ui, weight: 900, color: GOLD(), glow: 24, glowColor: alpha(GOLD(), 0.5) }); label(g, info.counterLabel || 'ЗАТЯЖЕК', cx, cy + 62, { size: 36 }); }
    placeTag(g, t, info.tag);
    if (info.caption) { const a = fin(t, info.capAt ?? 0.3), w = measure(g, info.caption, 58, FONTS.ui, 900, 3) + 96; rr(g, E.W / 2 - w / 2, 62, w, 96, 48); g.fillStyle = `rgba(6,8,16,${0.7 * a})`; g.fill(); glowLabel(g, info.caption, E.W / 2, 110, a, 58); }
  },
  // receptors as little doors on a nerve membrane: mode smoker (many, filled) | empty (many, red, rattling) | normal (fewer)
  receptors(g, t, info) {
    bp(g);
    const mode = info.mode || 'smoker', n = Math.round(info.nKeys ? key(t, info.nKeys) : mode === 'normal' ? 8 : 20), y = E.H * 0.58;
    g.fillStyle = alpha(BP(), 0.14); g.fillRect(0, y, E.W, 220); seg(g, [[0, y], [E.W, y]], 8, BP());
    for (let i = 0; i < n; i++) { const x = 120 + (i + 0.5) * (E.W - 240) / n, rattle = mode === 'empty' ? Math.sin(t * 30 + i * 2) * 4 : 0, filled = mode === 'smoker';
      rr(g, x - 26 + rattle, y - 90, 52, 90, 10); g.fillStyle = mode === 'empty' ? alpha(RED, 0.25 + 0.2 * Math.max(0, Math.sin(t * 6 + i))) : alpha(BP(), 0.2); g.fill(); g.lineWidth = 5; g.strokeStyle = mode === 'empty' ? RED : BP(); g.stroke();
      if (filled) { const u = ((t * 0.6 + i * 0.13) % 1); circle(g, x, lerp(y - 360, y - 45, ease.inOut(clamp(u * 1.6))), 16, GOLD()); }
      if (mode === 'empty' && (i % 3 === 0)) label(g, '!', x, y - 130 + Math.sin(t * 8 + i) * 6, { size: 48, color: RED }); }
    label(g, info.text || (mode === 'normal' ? 'НОРМА' : mode === 'empty' ? 'ПУСТЫЕ «ДВЕРИ» ТРЕБУЮТ НИКОТИН' : 'НИКОТИН ЗАНИМАЕТ РЕЦЕПТОРЫ'), E.W / 2, y + 140, { size: 44, color: mode === 'empty' ? '#ff8a7a' : GOLD() });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.2), 58);
    if (info.count) label(g, `${n}`, E.W * 0.9, 120, { size: 90, color: CREAM() });
  },
  // red blood cells; grey CO molecules sit on them (mode co) and fall away, blue O2 takes their place (mode clear on `at`)
  coBlood(g, t, info) {
    bp(g);
    const y0 = E.H * 0.28, y1 = E.H * 0.72, k = info.mode === 'clear' ? ease.inOut(prog(t, info.at ?? 0.3, (info.at ?? 0.3) + 1.6)) : 0;
    g.fillStyle = alpha('#ff5a4a', 0.12); g.fillRect(0, y0, E.W, y1 - y0); seg(g, [[0, y0], [E.W, y0]], 8, '#ff8a7a'); seg(g, [[0, y1], [E.W, y1]], 8, '#ff8a7a');
    const r = rng(7); for (let i = 0; i < 26; i++) { const x = ((r() * E.W * 1.2 + t * 140) % (E.W + 120)) - 60, y = lerp(y0 + 60, y1 - 60, r()); g.fillStyle = '#d8303a'; g.beginPath(); g.ellipse(x, y, 46, 28, r() * 3, 0, Math.PI * 2); g.fill(); g.fillStyle = '#a81a24'; g.beginPath(); g.ellipse(x, y, 18, 10, 0, 0, Math.PI * 2); g.fill();
      const co = r() < 0.6, gone = r() < k; if (co && !gone) { g.save(); g.translate(x + 30, y - 24); g.scale(0.45, 0.45); icon(g, 'co', 0, 0, 1, '#888', t); g.restore(); } else { circle(g, x + 30, y - 24, 11, BLUE); circle(g, x + 44, y - 24, 11, BLUE); } }
    label(g, k > 0.5 ? 'КИСЛОРОД ВЕРНУЛСЯ' : 'УГАРНЫЙ ГАЗ НА ЭРИТРОЦИТАХ', E.W / 2, E.H * 0.88, { size: 48, color: k > 0.5 ? BLUE : '#c8ccd8' });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.2), 58);
  },
  // the hand warming up: an outlined palm turning from cold blue to warm; thermo arrows
  warmHands(g, t, info) {
    bp(g);
    const k = ease.inOut(prog(t, 0.3, info.dur - 0.3)), col = mix('#6a9aff', '#ff9a5a', k), cx = E.W * 0.42, cy = E.H * 0.55;
    glow(g, cx, cy, 500, col, 0.3);
    g.save(); g.translate(cx, cy); g.fillStyle = alpha(col, 0.35); g.strokeStyle = col; g.lineWidth = 10;
    rr(g, -150, -60, 300, 280, 90); g.fill(); g.stroke();
    for (const [x, h, a] of [[-130, 200, -0.25], [-60, 260, -0.08], [10, 280, 0], [80, 250, 0.08]]) { g.save(); g.translate(x + 30, -40); g.rotate(a); rr(g, -30, -h, 60, h + 20, 30); g.fill(); g.stroke(); g.restore(); }
    g.save(); g.translate(-170, 80); g.rotate(-0.9); rr(g, -30, -150, 60, 170, 30); g.fill(); g.stroke(); g.restore(); g.restore();
    text(g, `${(lerp(info.from ?? 27, info.to ?? 31, k)).toFixed(1).replace('.', ',')}°`, E.W * 0.75, E.H * 0.45, { size: 120, font: FONTS.ui, weight: 900, color: col, glow: 24, glowColor: alpha(col, 0.5) });
    label(g, 'ПАЛЬЦЫ ТЕПЛЕЕ', E.W * 0.75, E.H * 0.58, { size: 44, a: fin(t, 0.6) });
  },
  // a fake video ad on a phone: "skip in 5" counts down — a craving lasts minutes and then ends
  adSkip(g, t, info) {
    blurLayer(g, 16, (g) => office(g, t, camAt(1100, 560, 1.4))); veil(g, '#05060c', 0.6);
    const cx = E.W / 2, cy = E.H * 0.52, w = 1100, h = 620, a = pop(t, 0, 0.35); g.save(); zoom(g, a, cx, cy);
    rr(g, cx - w / 2 - 20, cy - h / 2 - 20, w + 40, h + 40, 40); g.fillStyle = '#0c0e14'; g.fill(); rr(g, cx - w / 2, cy - h / 2, w, h, 24); g.fillStyle = '#1a1424'; g.fill();
    g.save(); g.translate(cx - 120, cy + 10); g.scale(2.6, 2.6); icon(g, 'cigarette', 0, 0, 1, GOLD(), t); g.restore();
    label(g, info.adText || 'РЕКЛАМА · ТЯГА', cx - w / 2 + 40, cy - h / 2 + 50, { size: 34, align: 'left', color: GOLD() });
    const left = Math.max(0, Math.ceil((info.skipAt ?? info.dur * 0.8) - t)), done = left === 0;
    rr(g, cx + w / 2 - 380, cy + h / 2 - 130, 340, 90, 12); g.fillStyle = done ? '#ffffff' : 'rgba(0,0,0,.7)'; g.fill();
    label(g, done ? 'ПРОПУСТИТЬ ▶' : `ПРОПУСК ЧЕРЕЗ ${left}`, cx + w / 2 - 210, cy + h / 2 - 85, { size: 36, color: done ? '#1a1622' : '#ffffff' });
    const p = prog(t, 0, info.skipAt ?? info.dur * 0.8); rr(g, cx - w / 2, cy + h / 2 - 14, w * p, 14, 4); g.fillStyle = GOLD(); g.fill();
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 100, fin(t, info.capAt ?? 0.3), 56);
  },
  // airway with cilia: paralysed (still, grey, gunk piles up) | active (waving, pushing gunk out to the right)
  cilia(g, t, info) {
    bp(g);
    const active = info.mode !== 'paralyzed', y0 = E.H * 0.3, y1 = E.H * 0.72;
    g.fillStyle = alpha('#ff9a8a', 0.12); g.fillRect(0, y0, E.W, y1 - y0);
    for (const [yy, dir] of [[y0, 1], [y1, -1]]) { seg(g, [[0, yy], [E.W, yy]], 10, '#ff8a7a'); for (let x = 20; x < E.W; x += 34) { const w = active ? Math.sin(t * 8 - x * 0.03) * 0.5 : 0.1; seg(g, [[x, yy], [x + Math.sin(w) * 30, yy + dir * 60]], 6, active ? GOLD() : '#7a7a84'); } }
    const r = rng(4); for (let i = 0; i < 22; i++) { const base = r() * E.W, x = active ? ((base + t * 220) % (E.W + 200)) - 100 : base, y = lerp(y0 + 80, y1 - 80, r()); g.fillStyle = alpha('#8a7a5a', 0.9); g.beginPath(); g.ellipse(x, y, 22 + r() * 14, 16, r() * 3, 0, Math.PI * 2); g.fill(); }
    label(g, active ? 'РЕСНИЧКИ ОЖИЛИ — ГРЯЗЬ ВЫХОДИТ' : 'ДЫМ ПАРАЛИЗОВАЛ РЕСНИЧКИ', E.W / 2, E.H * 0.88, { size: 46, color: active ? GOLD() : '#c8ccd8' });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.2), 58);
  },
  // packs piling up into a tower; counter climbs to `to` (e.g. 365); optional caption
  packs(g, t, info) {
    bp(g);
    const to = info.to || 365, n = Math.round(lerp(0, to, ease.out(prog(t, 0.2, info.dur * 0.8)))), few = to <= 20, cols = few ? to : 14, shown = Math.min(n, cols * 7), sc = few ? 1.7 : 0.62, dx = few ? 230 : 84, dy = 96;
    for (let i = 0; i < shown; i++) { const c = i % cols, r = Math.floor(i / cols), x = E.W / 2 + (c - (cols - 1) / 2) * dx, y = few ? E.H * 0.62 : E.H * 0.86 - r * dy, k = 1; g.save(); g.translate(x, y); g.scale(sc * k, sc * k); icon(g, 'pack', 0, 0, 1, GOLD(), t); g.restore(); }
    text(g, `${n}`, E.W / 2, 140, { size: 140, font: FONTS.ui, weight: 900, color: GOLD(), stroke: 16, strokeColor: '#05060c', glow: 24, glowColor: alpha(GOLD(), 0.5) });
    const m10 = n % 10, m100 = n % 100, w = m10 === 1 && m100 !== 11 ? 'ПАЧКА' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'ПАЧКИ' : 'ПАЧЕК';
    label(g, `${w} ${info.label || ''}`.trim(), E.W / 2, 240, { size: 48 });
  },
  // a retro TV: a bald man in a suit speaks to camera; subtitle line appears on cue
  tv(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#14100c', '#22180e', '#0a0806']); g.fillRect(0, 0, E.W, E.H); glow(g, E.W / 2, E.H * 0.5, 800, '#9fd8ff', 0.15);
    const cx = E.W / 2, cy = E.H * 0.5, w = 1100, h = 760, z = lerp(1, 1.07, K(info, t)); g.save(); zoom(g, z, cx, cy);
    rr(g, cx - w / 2 - 60, cy - h / 2 - 50, w + 120, h + 100, 40); g.fillStyle = '#5a3a22'; g.fill(); rr(g, cx - w / 2, cy - h / 2, w, h, 60); g.fillStyle = '#0c1014'; g.fill();
    g.save(); rr(g, cx - w / 2, cy - h / 2, w, h, 60); g.clip(); g.fillStyle = linGrad(g, 0, cy - h / 2, 0, cy + h / 2, ['#3a4a5a', '#1a2430']); g.fillRect(cx - w / 2, cy - h / 2, w, h);
    bigFace(g, cx, cy + 40, 230, { outfit: { top: 'suit', color: '#2a2a34', head: 'none' }, face: { eyes: 'ball', brows: 'worried', mouth: Math.sin(t * 9) > 0 ? 'o' : 'flat', lid: 0.3 }, look: [0, 0], rimColor: '#cfe0ff', rimSide: 1 });
    g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = cy - h / 2; y < cy + h / 2; y += 6) g.fillRect(cx - w / 2, y, w, 2);
    if (info.sub) { const a = fin(t, info.subAt ?? 0.5); rr(g, cx - 420, cy + h / 2 - 120, 840, 90, 10); g.fillStyle = alpha('#000000', 0.7 * a); g.fill(); label(g, info.sub, cx, cy + h / 2 - 75, { size: 52, color: '#ffffff', a }); }
    g.restore(); g.restore(); placeTag(g, t, info.tag);
  },
  // a party: a friend holds out a cigarette (in-hand prop), the hero hesitates and raises a hand: no
  offer(g, t, info) {
    const cam = camLerp(camAt(1000, 620, 1.5), camAt(1010, 610, 1.6), K(info, t)), { rim, rimDir } = office(g, t, cam);
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(200,80,255,.25)'; g.fillRect(0, 0, E.W, E.H); g.restore();
    const na = info.noAt ?? 99, OFFER = { ...POSES.stand, eF: [34, -150], hF: [64, -150] }, NO = { ...POSES.stand, eF: [26, -170], hF: [44, -196] };
    layer(g, cam, 1, (g) => {
      drawFigure(g, { x: 1200, y: GY, s: HS, facing: -1, outfit: { top: 'hoodie', color: '#3a8a5a', head: 'capBack', headColor: '#2a2a2a' }, prop: info.prop ? { type: info.prop, t } : { type: 'cigarette', t, angle: 0.2, lit: false }, pose: breathe(posesAt(t, [[0, POSES.relaxed], [0.3, OFFER]], 0.35), t, 0.6), face: F.smile, look: [-0.6, 0], rim: { color: rim, dir: rimDir } });
      drawFigure(g, { x: 820, y: GY, s: HS, facing: 1, outfit: HERO, pose: breathe(posesAt(t, [[0, POSES.stand], [na, NO]], 0.3), t, 0.6), face: t > na ? fc({ eyes: 'ball', brows: null, mouth: 'smallSmile' }) : fc({ eyes: 'ball', brows: 'raised', mouth: 'flat', eyeSize: 1.15 }), look: [0.7, 0.1], rim: { color: rim, dir: rimDir } });
    });
    if (info.word) { const a = pop(t, info.wordAt ?? 0.6, 0.3); if (a > 0) { const w = measure(g, info.word, 50, FONTS.ui, 900, 3) + 76; g.save(); g.translate(E.W * 0.64, E.H * 0.2); g.scale(a, a); rr(g, -w / 2, -48, w, 96, 48); g.fillStyle = '#f4efe6'; g.fill(); text(g, info.word, 0, 2, { size: 50, font: FONTS.ui, weight: 900, color: '#1a1622' }); g.restore(); } }
  },
};
