// _tpl_sugar.js — templates of "¿Y si dejaras el azúcar?". (g, t, info); knobs from beats.py params.
import { E, S, ease, prog, lerp, clamp, key, rr, seg, circle, ring, poly, text, measure, glow, alpha, shade, mix, linGrad, rng, shake, FONTS, layer, blurLayer, veil } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { drawFigure, POSES, breathe, posesAt, walkPose, bigFace } from '/engine/rig2d.js';
import { bedroom, GY, HS } from '../sets/bedroom.js';
import { kitchen, desk, street } from '../sets/week.js';
import { office, hospital } from '../sets/places.js';
import { HERO, F } from '../cast.js';
import { camAt, camLerp, blinkAt } from './_tpl_night.js';
import { icon } from './_tpl_sci.js';
import { placeTag } from './_tpl_hunger.js';

const ui = () => S().ui, RED = '#ff5a4a', GREEN = '#5fe39a', PINK = '#ff7ab0', BP = () => ui().blueprint, GOLD = () => ui().gold, CREAM = () => ui().cream;
const K = (info, t) => ease.inOut(t / info.dur);
const pop = (t, at, d = 0.35) => ease.outBack(prog(t, at, at + d));
const fin = (t, at, d = 0.3) => ease.out(prog(t, at, at + d));
const fc = (n) => (typeof n === 'string' ? F[n] : n) || F.talk;
const label = (g, s, x, y, o = {}) => text(g, s, x, y, { size: o.size || 34, font: FONTS.ui, weight: 900, color: o.color || CREAM(), spacing: o.spacing ?? 3, align: o.align || 'center', alpha: o.a ?? 1, glow: o.glow || 0, glowColor: o.glowColor });
const glowLabel = (g, s, x, y, a, size = 56, col = GOLD()) => label(g, s, x, y, { size, color: col, a, glow: 18, glowColor: alpha(col, 0.55) });
function zoom(g, z, cx = E.W / 2, cy = E.H / 2) { g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); }
function bp(g) { UI.blueprint(g, { grid: 60, a: 0.08 }); glow(g, E.W / 2, E.H / 2, 1000, BP(), 0.06); }
function dark(g, c = '#3a4aa0') { g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#07081a', '#10142e', '#07081a']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H / 2, 900, c, 0.22); }
function sepia(g, a = 0.3) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(200,150,90,${a})`; g.fillRect(0, 0, E.W, E.H); g.restore(); }
function cubeAt(g, x, y, s = 1, a = 1) { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s); rr(g, -30, -30, 60, 60, 8); g.fillStyle = '#f6f6fa'; g.fill(); g.strokeStyle = '#b8bccc'; g.lineWidth = 3; g.stroke(); rr(g, -30, -30, 60, 14, 6); g.fillStyle = '#ffffff'; g.fill(); g.restore(); }
function bubble(g, t, x, y, str, at, o = {}) {
  const a = pop(t, at, 0.3); if (a <= 0) return;
  const size = o.size || 44, w = measure(g, str, size, FONTS.ui, 900) + 70, h = size * 1.9;
  g.save(); g.translate(x, y); g.scale(a, a); rr(g, -w / 2, -h / 2, w, h, h / 2); g.fillStyle = '#f4efe6'; g.fill();
  const tl = o.tail ?? -w * 0.2, d = o.dir || 1; poly(g, [[tl, h / 2 - 4], [tl - 30 * d, h / 2 + 28], [tl + 20 * d, h / 2 - 4]], '#f4efe6');
  text(g, str, 0, 2, { size, font: FONTS.ui, weight: 900, color: '#1a1622' }); g.restore();
}
const HOLD = { ...POSES.holdFront, eB: [-6, -134], hB: [-8, -100] };
const LIFT = { ...POSES.holdFront, eF: [30, -150], hF: [44, -176], eB: [-6, -134], hB: [-8, -100] };
const DROP = { ...POSES.reach, eF: [40, -150], hF: [66, -140] };

export const SUGAR = {
  // in the kitchen: holds a soda can, looks at it… and drops it in the bin on `dropAt`
  trashSoda(g, t, info) {
    const da = info.dropAt ?? 1.0, cam = camLerp(camAt(1080, 640, 1.55), camAt(1070, 630, 1.68), K(info, t)), { rim, rimDir } = kitchen(g, t, cam);
    layer(g, cam, 1, (g) => {
      const bx = 1230; rr(g, bx - 60, GY - 150, 120, 150, 12); g.fillStyle = '#5a6070'; g.fill(); rr(g, bx - 70, GY - 166, 140, 22, 8); g.fillStyle = '#6a7080'; g.fill();
      const pose = breathe(posesAt(t, [[0, HOLD], [0.4, LIFT], [da - 0.2, DROP]], 0.25), t, 0.6);
      drawFigure(g, { x: 1060, y: GY, s: HS, facing: 1, outfit: HERO, pose, face: t > da ? fc('smile') : fc('think'), look: t > da ? [0.6, 0.5] : [0.5, 0.1], blink: blinkAt(t), rim: { color: rim, dir: rimDir } });
      const hand = t < da ? [1060 + (t > 0.4 && t < da - 0.2 ? 44 : 36) * HS, GY - (t > 0.4 && t < da - 0.2 ? 176 : 152) * HS] : null;
      if (hand) { g.save(); g.translate(hand[0] + 10, hand[1] - 20); g.scale(0.45, 0.45); icon(g, 'soda', 0, 0, 1, RED, t); g.restore(); }
      else { const k = ease.in(prog(t, da, da + 0.35)), x = lerp(1060 + 66 * HS + 10, bx, k), y = lerp(GY - 140 * HS, GY - 150, k); if (k < 1) { g.save(); g.translate(x, y); g.rotate(k * 3); g.scale(0.45, 0.45); icon(g, 'soda', 0, 0, 1, RED, t); g.restore(); } }
    });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? da), 64);
  },
  // a product big in frame; sugar cubes pop out of it one by one (count) and a gram label
  hidden(g, t, info) {
    dark(g, info.color || '#4a3aa0');
    const items = info.items || [{ icon: 'breadBag', label: 'PAN DE CAJA', at: 0.1 }], n = items.length, gap = E.W / (n + 0.5);
    items.forEach((it, i) => {
      const x = E.W / 2 + (i - (n - 1) / 2) * gap, y = E.H * 0.5, at = it.at ?? 0.1 + i * 0.5, a = pop(t, at, 0.35); if (a <= 0) return;
      g.save(); g.translate(x, y); g.scale(a * (it.s || 1.8), a * (it.s || 1.8)); icon(g, it.icon, 0, 0, 1, GOLD(), t); g.restore();
      const cubes = it.cubes ?? 2; for (let q = 0; q < cubes; q++) { const k = ease.outBack(prog(t, at + 0.4 + q * 0.15, at + 0.75 + q * 0.15)); if (k <= 0) continue; const an = -Math.PI / 2 + (q - (cubes - 1) / 2) * 0.5; cubeAt(g, x + Math.cos(an) * 220 * k, y - 60 + Math.sin(an) * 200 * k, 0.8, clamp(k)); }
      if (it.label) label(g, it.label, x, y + 220, { size: 40, a });
    });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.1), 60);
  },
  // the daily limit: six cubes on a plate (OMS); or a soda can pouring ~10 cubes past the limit line
  cubes(g, t, info) {
    bp(g);
    const mode = info.mode || 'limit', n = mode === 'can' ? 10 : 6, at = info.at ?? 0.2, z = lerp(1, 1.05, K(info, t)); g.save(); zoom(g, z);
    const x0 = E.W / 2 - 5 * 70 + (mode === 'can' ? 120 : 0) + (mode === 'can' ? 0 : 140), y0 = E.H * 0.66;
    if (mode === 'can') { g.save(); g.translate(E.W * 0.2, E.H * 0.5); g.rotate(-0.25 * fin(t, at)); g.scale(2.4, 2.4); icon(g, 'soda', 0, 0, 1, RED, t); g.restore(); }
    for (let i = 0; i < n; i++) { const k = ease.outBack(prog(t, at + i * (info.gap ?? 0.18), at + 0.3 + i * (info.gap ?? 0.18))); const over = i >= 6; cubeAt(g, x0 + (i % 5) * 140, y0 - Math.floor(i / 5) * 140 - (1 - k) * 200, 1.8, clamp(k * 2)); if (over && k > 0.5) { g.save(); g.globalAlpha *= 0.35; g.fillStyle = RED; rr(g, x0 + (i % 5) * 140 - 54, y0 - Math.floor(i / 5) * 140 - 54, 108, 108, 12); g.fill(); g.restore(); } }
    if (mode === 'can') { const la = fin(t, at + 6 * (info.gap ?? 0.18)); label(g, 'LÍMITE IDEAL', x0 + 2 * 140, y0 + 120, { size: 40, color: GREEN, a: la }); }
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.1), 60, mode === 'can' ? '#ff8a7a' : GOLD());
    if (info.big) { const a = fin(t, info.bigAt ?? 1.4); text(g, info.big, E.W / 2, E.H * 0.3, { size: 150, font: FONTS.ui, weight: 900, color: GOLD(), alpha: a, glow: 30, glowColor: alpha(GOLD(), 0.5) }); }
  },
  // a sugar-cane field under the Caribbean sun; workers' silhouettes; tag
  caneField(g, t, info) {
    const cam = camLerp(camAt(960, 560, 1.05), camAt(1000, 560, 1.15), K(info, t));
    layer(g, cam, 0.15, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, ['#4a8ad0', '#a8d0e8', '#f4e0b0']); g.fillRect(-E.W, -E.H * 2, E.W * 4, GY + E.H * 2); FX.sun(g, 1500, 220, 60); });
    layer(g, cam, 0.5, (g) => FX.hills(g, { y: GY - 200, amp: 70, color: '#4a7a4a', seed: 3 }));
    layer(g, cam, 1, (g) => {
      g.fillStyle = '#7a6a3a'; g.fillRect(-E.W, GY, E.W * 4, E.H);
      for (let row = 0; row < 3; row++) for (let i = -2; i < 26; i++) { const x = i * 90 + row * 40, y = GY - 20 + row * 60, h = 260 - row * 30 + Math.sin(i * 1.7) * 30, sw = Math.sin(t * 1.5 + i * 0.6) * 8;
        seg(g, [[x, y], [x + sw, y - h]], 9, shade('#7aa040', -row * 0.1)); poly(g, [[x + sw, y - h], [x + sw + 60, y - h + 40], [x + sw + 6, y - h + 20]], '#5a9a3a'); poly(g, [[x + sw, y - h + 30], [x + sw - 60, y - h + 70], [x + sw - 4, y - h + 46]], '#4a8a30'); }
    });
    sepia(g, info.sepia ?? 0.12); placeTag(g, t, info.tag);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 60);
  },
  // the reward: a blueprint brain; dopamine sparks burst on `at` (and again on `again`)
  dopamine(g, t, info) {
    bp(g);
    const cx = E.W * 0.6, cy = E.H * 0.5, at = info.at ?? 0.5, z = lerp(1, 1.07, K(info, t)); g.save(); zoom(g, z, cx, cy);
    icon(g, 'brain', cx, cy, 3.4, t > at ? GOLD() : BP(), t);
    for (const b of [at, info.again ?? 99]) { if (t < b) continue; const k = (t - b); for (let i = 0; i < 16; i++) { const an = i * 0.39 + b, d = 60 + k * 420; if (k < 1.2) FX.sparkle(g, cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.7, 26 * (1 - k / 1.2), '#ffe28a', 0.9 * (1 - k / 1.2)); } glow(g, cx, cy, 360, GOLD(), 0.35 * Math.max(0, 1 - (t - b))); }
    g.restore();
    g.save(); g.translate(E.W * 0.2, E.H * 0.55); g.scale(1.8, 1.8); icon(g, info.food || 'donut', 0, 0, 1, GOLD(), t); g.restore();
    const ax = fin(t, at - 0.3); seg(g, [[E.W * 0.28, E.H * 0.55], [lerp(E.W * 0.28, E.W * 0.42, ax), E.H * 0.53]], 8, alpha(GOLD(), 0.8));
    if (info.caption) glowLabel(g, info.caption, cx, E.H * 0.88, fin(t, info.capAt ?? at + 0.2), 64);
  },
  // the 2007 Bordeaux choice: two drinking bottles; rats run to the sweet one; the % counts up
  ratChoice(g, t, info) {
    bp(g);
    const at = info.at ?? 0.6, L = E.W * 0.28, R = E.W * 0.72, y = E.H * 0.55;
    for (const [x, name, col] of [[L, 'AGUA DULCE', PINK], [R, info.right || 'COCAÍNA', '#9ab0d0']]) { rr(g, x - 70, y - 260, 140, 220, 20); g.fillStyle = alpha(col, 0.3); g.fill(); g.strokeStyle = col; g.lineWidth = 6; g.stroke(); seg(g, [[x, y - 40], [x, y + 40]], 10, col); label(g, name, x, y - 300, { size: 44, color: col }); }
    const r = rng(8); for (let i = 0; i < 10; i++) { const toSweet = i !== 3, k = ease.inOut(prog(t, at + r() * 0.5, at + 1.4 + r() * 0.4)), x0 = E.W / 2 + (r() - 0.5) * 300, y0 = E.H * 0.82 + r() * 60, tx = toSweet ? L + (r() - 0.5) * 220 : R + (r() - 0.5) * 80, ty = y + 120 + r() * 80;
      const x = lerp(x0, tx, k), yy = lerp(y0, ty, k) + Math.sin(t * 20 + i) * 3 * (k > 0 && k < 1 ? 1 : 0); g.save(); g.translate(x, yy); g.scale(tx < x0 ? -0.7 : 0.7, 0.7); icon(g, 'rat', 0, 0, 1, '#c8ccd8', t); g.restore(); }
    const pct = Math.round(lerp(0, 94, ease.out(prog(t, info.pctAt ?? at + 1.0, (info.pctAt ?? at + 1.0) + 1.0)))); if (t > (info.pctAt ?? at + 1.0)) text(g, `${pct}%`, L, E.H * 0.16, { size: 120, font: FONTS.ui, weight: 900, color: PINK, glow: 30, glowColor: alpha(PINK, 0.5) });
    placeTag(g, t, info.tag);
  },
  // the hero at his desk, a pastry on the plate; his hand drifts toward it and stops on `stopAt`
  reachSweet(g, t, info) {
    const sa = info.stopAt ?? 1.2, cam = camLerp(camAt(1080, 650, 1.65), camAt(1100, 640, 1.78), K(info, t)), { rim, rimDir } = desk(g, t, cam);
    const SIT = { ...POSES.sit, head: [10, -178], sh: [4, -146] }, REACHP = { ...SIT, eF: [40, -126], hF: [74, -116] }, BACK = { ...SIT, eF: [22, -112], hF: [30, -130] };
    layer(g, cam, 1, (g) => { FX.chair(g, 900, GY, HS * 1.03, '#1e1a22');
      g.save(); g.translate(1060 + 40 * HS, GY - 160 - 18); icon(g, 'plate', 0, 6, 0.5, GOLD(), t); icon(g, info.food || 'donut', 0, -14, 0.42, GOLD(), t); g.restore();
      drawFigure(g, { x: 920, y: GY, s: HS, facing: 1, outfit: HERO, pose: breathe(posesAt(t, [[0, SIT], [0.3, REACHP], [sa, REACHP], [sa + 0.3, BACK]], 0.4), t, 0.5), face: t > sa ? fc({ eyes: 'ball', brows: 'raised', mouth: 'smallFlat', eyeSize: 1.15 }) : fc({ eyes: 'ball', brows: null, mouth: 'smallFlat', lid: 0.3 }), look: [0.8, 0.5], rim: { color: rim, dir: rimDir } }); });
    if (info.stamp2) {}
    if (info.clock) { FX.clock(g, E.W * 0.83, E.H * 0.22, 80, 0, {}); label(g, info.clock, E.W * 0.83, E.H * 0.36, { size: 40, color: GOLD() }); }
  },
  // the San Francisco kids at a table: pizza, hot dog, burrito
  kids(g, t, info) {
    const cam = camLerp(camAt(980, 640, 1.42), camAt(990, 630, 1.52), K(info, t)), { rim, rimDir } = hospital(g, t, cam, {});
    layer(g, cam, 1, (g) => {
      rr(g, 560, GY - 130, 860, 22, 6); g.fillStyle = '#c8a878'; g.fill(); g.fillStyle = '#8a6a48'; g.fillRect(590, GY - 108, 18, 108); g.fillRect(1380, GY - 108, 18, 108);
      const kidsC = ['#ff8a3a', '#5ad0a0', '#c07aff'], foods = info.foods || ['pizza', 'drumstick', 'burger'];
      kidsC.forEach((c, i) => { const x = 700 + i * 290, EAT = { ...POSES.sit, head: [10, -178], eF: [30, -128], hF: [lerp(44, 26, (Math.sin(t * 4 + i * 2) + 1) / 2), lerp(-120, -160, (Math.sin(t * 4 + i * 2) + 1) / 2)] };
        FX.chair(g, x - 20, GY, HS * 0.8, '#5a6070');
        drawFigure(g, { x, y: GY, s: HS, facing: 1, outfit: { top: 'tshirt', color: c, head: i === 1 ? 'ponytail' : 'curly', headColor: '#2a1a12', kid: true }, pose: EAT, face: F.smile, look: [0.6, 0.4], rim: { color: rim, dir: rimDir } });
        g.save(); g.translate(x + 90, GY - 150); icon(g, 'plate', 0, 6, 0.5, GOLD(), t); icon(g, foods[i % foods.length], 0, -12, 0.4, GOLD(), t); g.restore(); });
    });
    placeTag(g, t, info.tag);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 58);
  },
  // the liver: fructose arrows in, fat droplets build up (mode 'fill') or melt away (mode 'clear')
  liver(g, t, info) {
    bp(g);
    const mode = info.mode || 'fill', cx = E.W * 0.55, cy = E.H * 0.52, z = lerp(1, 1.06, K(info, t)); g.save(); zoom(g, z, cx, cy);
    g.save(); g.translate(cx, cy); g.scale(5.2, 5.2); g.globalAlpha *= 0.9; icon(g, 'liver', 0, 0, 1, '#c85a4a', t); g.restore();
    const r = rng(4), p = mode === 'fill' ? prog(t, info.at ?? 0.4, info.dur - 0.2) : 1 - prog(t, info.at ?? 0.4, info.dur - 0.3);
    for (let i = 0; i < 40; i++) { const x = cx + (r() - 0.5) * 600, y = cy + (r() - 0.5) * 300, show = r() < p; if (show) { g.fillStyle = alpha('#f2d06a', 0.9); g.beginPath(); g.ellipse(x, y, 16 + r() * 14, 12 + r() * 10, 0, 0, Math.PI * 2); g.fill(); } }
    g.restore();
    if (info.arrows !== false) for (let i = 0; i < 4; i++) { const u = ((t * 0.8 + i / 4) % 1), x = lerp(E.W * 0.08, cx - 360, u), y = E.H * 0.4 + i * 50; g.save(); g.globalAlpha = 1 - u; label(g, 'F', x, y, { size: 44, color: PINK }); g.restore(); }
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 100, fin(t, info.capAt ?? 0.3), 58, mode === 'clear' ? GREEN : '#f2d06a');
  },
  // a strawberry right in front of his face; sweetness sparkles; "¡DULCE!"
  taste(g, t, info) {
    blurLayer(g, 14, (g) => kitchen(g, t, camAt(1200, 560, 1.4))); veil(g, '#0a0608', 0.3);
    const at = info.at ?? 0.6, bite = t > at, r = lerp(290, 315, K(info, t)), cx = E.W * 0.38, cy = E.H * 0.62;
    bigFace(g, cx, cy, r, { outfit: HERO, face: bite ? { eyes: 'happy', brows: 'raised', mouth: 'smile' } : { eyes: 'ball', brows: null, mouth: 'smallFlat' }, look: [0.6, 0], rimColor: '#ffd09a', rimSide: 1 });
    const sx = lerp(E.W * 0.75, cx + r * 0.9, ease.inOut(prog(t, 0.1, at))), sy = lerp(E.H * 0.6, cy + r * 0.25, ease.inOut(prog(t, 0.1, at)));
    if (!bite) { g.save(); g.translate(sx, sy); g.scale(1.6, 1.6); icon(g, 'strawberry', 0, 0, 1, GOLD(), t); g.restore(); }
    if (bite) { for (let i = 0; i < 8; i++) { const an = i * 0.8 + t * 2, d = 380 + Math.sin(t * 3 + i) * 30; FX.sparkle(g, cx + Math.cos(an) * d, cy - 80 + Math.sin(an) * d * 0.6, 26, '#ffe28a', 0.9); } bubble(g, t, E.W * 0.76, E.H * 0.24, info.word || '¡DULCE!', at + 0.1, { size: 64, dir: -1, tail: -60 }); }
  },
  // a big tooth: bacteria feed on sugar cubes, acid drops, enamel holes appear
  tooth(g, t, info) {
    bp(g);
    const cx = E.W / 2, cy = E.H * 0.5, at = info.at ?? 0.6, z = lerp(1, 1.06, K(info, t)); g.save(); zoom(g, z, cx, cy);
    g.save(); g.translate(cx, cy); g.scale(4.2, 4.2); icon(g, 'tooth', 0, 0, 1, '#f2f0ea', t); g.restore();
    const holes = info.mode === 'clean' ? 0 : Math.floor(prog(t, at, info.dur * 0.9) * 5); for (let i = 0; i < holes; i++) { const [x, y] = [[-90, -120], [70, -150], [10, -60], [-40, 20], [90, -40]][i]; g.fillStyle = '#5a4030'; g.beginPath(); g.ellipse(cx + x, cy + y, 26, 18, 0.3, 0, Math.PI * 2); g.fill(); }
    if (info.mode !== 'clean') { const r = rng(3); for (let i = 0; i < 12; i++) { const an = r() * 6.28 + t * 0.6, d = 260 + r() * 60, x = cx + Math.cos(an) * d, y = cy - 60 + Math.sin(an) * d * 0.7; g.fillStyle = '#9aff6a'; g.beginPath(); g.ellipse(x, y, 14, 9, an, 0, Math.PI * 2); g.fill(); circle(g, x + 8, y - 3, 3, '#0b1324'); }
      if (t > at) for (let i = 0; i < 6; i++) { const u = ((t - at) * 0.8 + i / 6) % 1; icon(g, 'droplet', cx - 150 + i * 60, cy - 330 + u * 160, 0.25, alpha('#c8ff6a', 1 - u), t); } }
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 100, fin(t, info.capAt ?? 0.3), 58, info.mode === 'clean' ? GREEN : '#c8ff6a');
  },
  // 1967: an old journal page; a "CONFIDENCIAL" folder and money counting up on cue
  journal(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#2a2018', '#3a2e22', '#1a140e']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H * 0.4, 800, '#ffcf8a', 0.18);
    const mode = info.mode || 'page', z = lerp(1, 1.06, K(info, t)); g.save(); zoom(g, z);
    if (mode === 'page') { g.save(); g.translate(E.W * 0.42, E.H * 0.52); g.rotate(-0.04); rr(g, -360, -420, 720, 840, 8); g.fillStyle = '#efe6cf'; g.fill();
      text(g, info.head || 'REVISIÓN · 1967', 0, -340, { size: 44, font: FONTS.serif, weight: 900, color: '#2a2018' }); seg(g, [[-320, -300], [320, -300]], 3, '#2a2018');
      text(g, info.title || 'Grasas, azúcar y el corazón', 0, -240, { size: 40, font: FONTS.serif, weight: 700, italic: true, color: '#3a2a1a' });
      for (let i = 0; i < 12; i++) rr(g, -320, -170 + i * 44, i % 4 === 3 ? 380 : 640, 14, 4), (g.fillStyle = alpha('#5a4a3a', 0.35)), g.fill();
      const hi = fin(t, info.hiAt ?? 1.0); if (hi > 0) { g.fillStyle = alpha(RED, 0.35 * hi); g.fillRect(-326, -82, 520 * hi, 26); text(g, 'GRASA', 260, -70, { size: 40, font: FONTS.ui, weight: 900, color: RED, alpha: hi }); }
      g.restore(); }
    else { g.save(); g.translate(E.W * 0.4, E.H * 0.55); g.rotate(0.03); rr(g, -380, -300, 760, 560, 12); g.fillStyle = '#d8b878'; g.fill(); rr(g, -380, -340, 280, 60, 12); g.fillStyle = '#d8b878'; g.fill();
      const st = ease.outBack(prog(t, info.stampAt ?? 0.5, (info.stampAt ?? 0.5) + 0.25)); if (st > 0) { g.save(); g.rotate(-0.12); g.scale(1 + (1 - st), 1 + (1 - st)); g.globalAlpha *= clamp(st * 2); rr(g, -300, -70, 600, 140, 14); g.strokeStyle = RED; g.lineWidth = 10; g.stroke(); text(g, 'CONFIDENCIAL', 0, 4, { size: 84, font: FONTS.ui, weight: 900, color: RED }); g.restore(); }
      g.restore();
      const v = Math.round(lerp(0, info.amount || 6500, ease.out(prog(t, info.moneyAt ?? 0.8, (info.moneyAt ?? 0.8) + 1.0)))); if (t > (info.moneyAt ?? 0.8)) text(g, `US$ ${v.toLocaleString('es-ES')}`, E.W * 0.78, E.H * 0.4, { size: 90, font: FONTS.ui, weight: 900, color: '#8affb0', glow: 20, glowColor: alpha('#8affb0', 0.5) });
      if (info.sub) label(g, info.sub, E.W * 0.78, E.H * 0.52, { size: 40, a: fin(t, info.subAt ?? 1.6) }); }
    g.restore(); placeTag(g, t, info.tag);
  },
  // Mexico 2014: a soda bottle with its price tag flipping up one peso; the purchase bar shrinks
  sodaTax(g, t, info) {
    dark(g, '#2a7a3a');
    const at = info.at ?? 0.5, k = ease.outBack(prog(t, at, at + 0.4));
    g.save(); g.translate(E.W * 0.32, E.H * 0.55); g.scale(3.2, 3.2); icon(g, 'soda', 0, 0, 1, RED, t); g.restore();
    g.save(); g.translate(E.W * 0.32 + 200, E.H * 0.3); g.rotate(-0.1 + 0.1 * k); rr(g, -110, -50, 220, 100, 16); g.fillStyle = '#ffd400'; g.fill(); text(g, t > at ? '+ $1' : '$', 0, 4, { size: 60, font: FONTS.ui, weight: 900, color: '#1a1622' }); g.restore();
    if (t > at) { g.save(); g.translate(E.W * 0.32 + 330, E.H * 0.62); g.scale(k, k); icon(g, 'peso', 0, 0, 1, GOLD(), t); g.restore(); }
    const bx = E.W * 0.62, by = E.H * 0.78, h0 = 460, drop = lerp(0, info.drop ?? 0.12, ease.inOut(prog(t, info.dropAt ?? at + 0.6, (info.dropAt ?? at + 0.6) + 1.2)));
    rr(g, bx, by - h0, 160, h0, 12); g.fillStyle = alpha('#9ab0d0', 0.35); g.fill(); rr(g, bx + 220, by - h0 * (1 - drop), 160, h0 * (1 - drop), 12); g.fillStyle = RED; g.fill();
    label(g, '2013', bx + 80, by + 40, { size: 34 }); label(g, info.yearLabel || 'DIC 2014', bx + 300, by + 40, { size: 34 });
    if (drop > 0.01) text(g, `−${Math.round(drop * 100)}%`, bx + 300, by - h0 * (1 - drop) - 60, { size: 72, font: FONTS.ui, weight: 900, color: RED });
    placeTag(g, t, info.tag || 'MÉXICO · 2014');
  },
  // Chile 2016: a row of packages; black "ALTO EN" octagons stamp onto them one by one
  octagons(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#e8e4dc', '#d0c8bc']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    rr(g, -20, E.H * 0.74, E.W + 40, 30, 6); g.fillStyle = '#a89880'; g.fill();
    const items = info.items || ['cereal', 'soda', 'chocolate', 'yogurt', 'ketchup'], n = items.length, z = lerp(1, 1.05, K(info, t)); g.save(); zoom(g, z);
    items.forEach((it, i) => { const x = E.W / 2 + (i - (n - 1) / 2) * 330, y = E.H * 0.56; g.save(); g.translate(x, y); g.scale(2.0, 2.0); icon(g, it, 0, 0, 1, GOLD(), t); g.restore();
      const at = (info.at ?? 0.4) + i * (info.gap ?? 0.3), k = ease.outBack(prog(t, at, at + 0.22)); if (t > at) { g.save(); g.translate(x + 60, y - 70); g.scale(k * 1.1 + (1 - clamp(k)) * 0.8, k * 1.1 + (1 - clamp(k)) * 0.8); icon(g, 'octagon', 0, 0, 1, '#000', t); g.restore(); } });
    g.restore(); placeTag(g, t, info.tag || 'CHILE · 2016');
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 60, '#1a1622');
  },
  // a birthday: cake with candles on the table; grandma offers a pastry, the hero raises a hand: no, thanks
  party(g, t, info) {
    const cam = camLerp(camAt(1000, 620, 1.45), camAt(1010, 610, 1.55), K(info, t)), { rim, rimDir } = kitchen(g, t, cam);
    layer(g, cam, 1, (g) => {
      rr(g, 820, GY - 150, 440, 22, 6); g.fillStyle = '#8a5a3a'; g.fill(); g.fillStyle = '#6a4228'; g.fillRect(840, GY - 128, 16, 128); g.fillRect(1226, GY - 128, 16, 128);
      g.save(); g.translate(1040, GY - 205); g.scale(0.85, 0.85); icon(g, 'cake2', 0, 0, 1, GOLD(), t); g.restore(); for (const x of [1010, 1040, 1070]) glow(g, x, GY - 270, 40, '#ffb050', 0.6);
      const NO = { ...POSES.stand, eF: [26, -170], hF: [44, -196] };
      drawFigure(g, { x: 760, y: GY, s: HS, facing: 1, outfit: HERO, pose: breathe(posesAt(t, [[0, POSES.stand], [info.noAt ?? 0.6, NO]], 0.3), t, 0.6), face: F.smile, look: [0.6, 0], rim: { color: rim, dir: rimDir } });
      drawFigure(g, { x: 1360, y: GY, s: HS * 0.95, facing: -1, outfit: { top: 'dress', color: '#b85a8a', head: 'bun', headColor: '#d8d8d8' }, pose: breathe({ ...POSES.holdFront, eF: [30, -150], hF: [56, -150] }, t, 0.6), face: F.smile, look: [-0.6, 0], rim: { color: rim, dir: rimDir } });
      g.save(); g.translate(1360 - 60 * HS, GY - 160 * HS); icon(g, 'donut', 0, 0, 0.4, GOLD(), t); g.restore();
    });
    if (info.word) bubble(g, t, E.W * 0.32, E.H * 0.2, info.word, info.wordAt ?? 0.8, { size: 50, tail: 40 });
  },
};
