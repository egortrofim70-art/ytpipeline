// _tpl_alcohol.js — templates of "¿Y si dejaras el alcohol?" (Spanish strings; every on-screen word comes from info or is Spanish).
// Drinks in hands go through the rig (prop: 'beer' | 'wine' | 'can' | 'mic'), so they move with the hand.
import { E, S, ease, prog, lerp, clamp, key, rr, seg, circle, ring, poly, text, measure, glow, alpha, shade, mix, linGrad, rng, FONTS, layer, blurLayer, veil } from '/engine/core.js';
import * as UI from '/engine/ui2d.js';
import { drawFigure, POSES, breathe, posesAt, bigFace } from '/engine/rig2d.js';
import { GY, HS } from '../sets/bedroom.js';
import { kitchen } from '../sets/week.js';
import { office } from '../sets/places.js';
import { HERO, F } from '../cast.js';
import { camAt, camLerp, blinkAt } from './_tpl_night.js';
import { icon } from './_tpl_sci.js';
import { placeTag } from './_tpl_hunger.js';

const ui = () => S().ui, RED = '#ff5a4a', GREEN = '#5fe39a', BLUE = '#6ab8ff', AMBER = '#e8a23a', BP = () => ui().blueprint, GOLD = () => ui().gold, CREAM = () => ui().cream;
const K = (info, t) => ease.inOut(t / info.dur);
const pop = (t, at, d = 0.35) => ease.outBack(prog(t, at, at + d));
const fin = (t, at, d = 0.3) => ease.out(prog(t, at, at + d));
const fc = (n) => (typeof n === 'string' ? F[n] : n) || F.talk;
const label = (g, s, x, y, o = {}) => text(g, s, x, y, { size: o.size || 34, font: FONTS.ui, weight: 900, color: o.color || CREAM(), spacing: o.spacing ?? 3, align: o.align || 'center', alpha: o.a ?? 1, glow: o.glow || 0, glowColor: o.glowColor });
const glowLabel = (g, s, x, y, a, size = 56, col = GOLD()) => label(g, s, x, y, { size, color: col, a, glow: 18, glowColor: alpha(col, 0.55) });
function zoom(g, z, cx = E.W / 2, cy = E.H / 2) { g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); }
function bp(g) { UI.blueprint(g, { grid: 60, a: 0.08 }); glow(g, E.W / 2, E.H / 2, 1000, BP(), 0.06); }
function caption(g, t, info, y = 110) { if (info.caption) glowLabel(g, info.caption, E.W / 2, y, fin(t, info.capAt ?? 0.3), 58); }
// a beer can, centred at x,y (s = scale)
export function beerCan(g, x, y, s = 1, col = AMBER) {
  g.save(); g.translate(x, y); g.scale(s, s);
  rr(g, -26, -50, 52, 100, 10); g.fillStyle = col; g.fill(); g.fillStyle = '#c8ccd4'; g.fillRect(-22, -56, 44, 8);
  rr(g, -26, -16, 52, 30, 2); g.fillStyle = alpha('#ffffff', 0.85); g.fill(); seg(g, [[-16, -2], [16, -2]], 5, col);
  g.fillStyle = alpha('#ffffff', 0.25); g.fillRect(-18, -46, 8, 90); g.restore();
}
function molecule(g, x, y, s, col, a = 1) { g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s); for (const [dx, dy] of [[0, 0], [26, -14], [26, 16], [-24, 0]]) { seg(g, [[0, 0], [dx, dy]], 5, alpha(col, 0.7)); } for (const [dx, dy, r] of [[0, 0, 15], [26, -14, 10], [26, 16, 10], [-24, 0, 12]]) circle(g, dx, dy, r, col); g.restore(); }
function stick(g, x, y, s, col, o = {}) { // tiny crowd figure
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= o.a ?? 1;
  circle(g, 0, -62, 14, '#0c0c12'); g.lineWidth = 2; g.strokeStyle = alpha(col, 0.9); g.beginPath(); g.arc(0, -62, 14, 0, Math.PI * 2); g.stroke();
  rr(g, -11, -46, 22, 26, 6); g.fillStyle = col; g.fill(); seg(g, [[-5, -20], [-6, 0]], 5, '#0c0c12'); seg(g, [[5, -20], [6, 0]], 5, '#0c0c12');
  if (o.cross) { circle(g, 16, -74, 11, '#ffffff'); g.fillStyle = RED; g.fillRect(13, -82, 6, 16); g.fillRect(8, -77, 16, 6); }
  g.restore();
}

export const ALCOHOL = {
  // cold open: a man wakes up in an Arizona hotel, not knowing how he got there. Face looks around, "?" marks pop.
  hotelWake(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#1a1420', '#2a1e24', '#120c10']); g.fillRect(0, 0, E.W, E.H);
    const z = lerp(1.0, 1.08, K(info, t)); g.save(); zoom(g, z);
    const wx = 1180, wy = 170, ww = 600, wh = 520; g.save(); rr(g, wx, wy, ww, wh, 10); g.clip();
    g.fillStyle = linGrad(g, 0, wy, 0, wy + wh, ['#ff9a5a', '#f2c27a', '#e8a86a']); g.fillRect(wx, wy, ww, wh); circle(g, wx + 430, wy + 300, 60, '#ffe2a0');
    g.fillStyle = '#c87a4a'; g.beginPath(); g.moveTo(wx, wy + 400); g.quadraticCurveTo(wx + 300, wy + 330, wx + ww, wy + 390); g.lineTo(wx + ww, wy + wh); g.lineTo(wx, wy + wh); g.fill();
    for (const [cx, h] of [[wx + 120, 170], [wx + 470, 120]]) { g.fillStyle = '#3a5a3a'; rr(g, cx - 14, wy + 400 - h, 28, h, 14); g.fill(); rr(g, cx - 54, wy + 400 - h * 0.7, 18, 60, 9); g.fill(); rr(g, cx + 36, wy + 400 - h * 0.85, 18, 70, 9); g.fill(); seg(g, [[cx - 45, wy + 400 - h * 0.45], [cx - 14, wy + 400 - h * 0.45]], 14, '#3a5a3a'); seg(g, [[cx + 45, wy + 400 - h * 0.55], [cx + 14, wy + 400 - h * 0.55]], 14, '#3a5a3a'); }
    g.restore(); g.lineWidth = 16; g.strokeStyle = '#3a2a22'; rr(g, wx, wy, ww, wh, 10); g.stroke(); seg(g, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 10, '#3a2a22');
    g.fillStyle = '#5a2a34'; g.fillRect(wx - 90, wy - 30, 100, wh + 80); g.fillRect(wx + ww - 10, wy - 30, 100, wh + 80);
    glow(g, wx + ww / 2, wy + wh / 2, 600, '#ffb07a', 0.18);
    const lk = Math.sin(t * 1.4) * 0.85;
    bigFace(g, 640, E.H * 0.66, 330, { outfit: info.outfit || { top: 'tshirt', color: '#d8d0c0' }, face: { eyes: 'ball', brows: t % 2 < 1 ? 'raised' : 'worried', mouth: 'wavy', eyeSize: 1.15, pupil: 0.3, lid: 0.15 }, look: [lk, -0.1], rimColor: '#ffb07a', rimSide: 1 });
    for (const [at, x, y, s] of [[0.5, 920, 300, 1], [1.1, 380, 260, 0.8], [1.7, 1000, 470, 0.7]]) { const k = pop(t, at, 0.3); if (k > 0) label(g, '?', x, y + Math.sin(t * 3 + x) * 8, { size: 150 * s * k, color: GOLD(), glow: 20, glowColor: alpha(GOLD(), 0.5) }); }
    g.restore(); placeTag(g, t, info.tag); caption(g, t, info);
  },
  // the liver works through drinks one at a time (≈ 1 per hour); mode 'queue' | 'acet' (acetaldehyde comes out) | 'block' (it piles up: disulfiram)
  liverQueue(g, t, info) {
    bp(g);
    const mode = info.mode || 'queue', lx = 1180, ly = E.H * 0.52, per = info.period ?? 1.4, speed = info.fast ? 2.6 : 1;
    glow(g, lx, ly, 420, mode === 'block' ? RED : '#ff8a6a', mode === 'block' ? 0.25 + 0.1 * Math.sin(t * 6) : 0.14);
    g.save(); g.translate(lx, ly); g.scale(3.2, 3.2); icon(g, 'liver', 0, 0, 1, '#c8584a', t); g.restore();
    seg(g, [[120, ly + 150], [lx - 230, ly + 150]], 6, alpha(BP(), 0.6));
    const n = 5; for (let i = 0; i < n; i++) { const u = ((t * speed / per) + i) / n % 1, x = lerp(150, lx - 260, ease.inOut(clamp(u * 1.2))), sh = u > 0.83 ? 1 - (u - 0.83) / 0.17 : 1; beerCan(g, x, ly + 75, 1.5 * sh); }
    if (info.fast) { for (let i = 0; i < 5; i++) { const k = pop(t, 0.6 + i * 0.45, 0.3); if (k > 0) beerCan(g, 260 + i * 110, ly - 150 - (i % 2) * 50, 1.2 * k, alpha(AMBER, 0.85)); } label(g, info.waitText || 'ESPERANDO EN LA SANGRE', 480, ly - 290, { size: 34, color: RED, a: fin(t, 0.8) }); }
    if (mode !== 'queue') { const out = mode === 'block'; for (let i = 0; i < 6; i++) { const u = ((t * 0.5) + i / 6) % 1, x = out ? lx + 120 + Math.sin(i * 2.1 + t) * 160 : lerp(lx + 200, E.W - 80, u), y = out ? ly - 120 + Math.cos(i * 1.7 + t * 0.8) * 160 : ly - 40 + Math.sin(u * 6 + i) * 60; molecule(g, x, y, 1.1, RED, out ? 0.9 : 1 - u); }
      label(g, info.molText || 'ACETALDEHÍDO', lx + 300, ly + 260, { size: 44, color: RED, a: fin(t, 0.3) });
      if (out) { const k = pop(t, info.blockAt ?? 0.6, 0.3); if (k > 0) { g.save(); g.translate(lx + 250, ly + 30); g.scale(k, k); seg(g, [[-60, -60], [60, 60]], 22, RED); seg(g, [[60, -60], [-60, 60]], 22, RED); g.restore(); } } }
    text(g, info.rate || '≈ 1 BEBIDA / HORA', 470, ly + 250, { size: 52, font: FONTS.ui, weight: 900, color: GOLD(), glow: 16, glowColor: alpha(GOLD(), 0.4) });
    caption(g, t, info);
  },
  // ADH (vasopressin) to the kidneys: mode 'alcohol' blocks it (water leaves) | 'clear' (water stays)
  kidneyADH(g, t, info) {
    bp(g);
    const blocked = info.mode !== 'clear', kx = E.W / 2, ky = E.H * 0.56;
    g.save(); g.translate(kx, ky); g.scale(3, 3); icon(g, 'kidney', 0, 0, 1, '#d8707a', t); g.restore();
    label(g, info.hormone || 'HORMONA QUE GUARDA EL AGUA', kx, 120, { size: 38, color: GOLD() });
    for (let i = 0; i < 9; i++) { const u = ((t * 0.6) + i / 9) % 1, y = lerp(170, ky - 150, u), stop = blocked && y > 330; if (stop) continue; circle(g, kx + Math.sin(i * 3 + u * 4) * 40, y, 10, GOLD()); }
    if (blocked) { beerCan(g, kx - 330, 330, 1.1); const k = pop(t, 0.3, 0.3); if (k > 0) { g.save(); g.translate(kx, 345); g.scale(k, k); seg(g, [[-90, 0], [90, 0]], 18, RED); g.restore(); }
      for (let i = 0; i < 8; i++) { const u = ((t * 0.9) + i / 8) % 1; g.save(); g.globalAlpha *= 1 - u; icon(g, 'droplet', kx + (i % 3 - 1) * 60, ky + 190 + u * 220, 0.6, BLUE, t); g.restore(); }
      label(g, info.outText || 'EL AGUA SE VA', kx, E.H * 0.93, { size: 48, color: BLUE }); }
    else { for (let i = 0; i < 5; i++) { const u = ((t * 0.5) + i / 5) % 1, a = u * Math.PI * 2; icon(g, 'droplet', kx + Math.cos(a) * 300, ky + Math.sin(a) * 150, 0.55, BLUE, t); }
      label(g, info.outText || 'EL AGUA SE QUEDA', kx, E.H * 0.93, { size: 48, color: GREEN }); }
    caption(g, t, info, 60);
  },
  // a group chat on a big phone: msgs [[at, text, who]] — who 'me' is on the right (green); others show their name
  chatGroup(g, t, info) {
    blurLayer(g, 16, (g) => kitchen(g, t, camAt(1100, 560, 1.4))); veil(g, '#05060c', 0.62);
    const cx = E.W / 2, w = 900, h = 980, x = cx - w / 2, y = (E.H - h) / 2 + 30, a = pop(t, 0, 0.35); g.save(); zoom(g, 0.9 + 0.1 * a, cx, E.H / 2);
    rr(g, x - 18, y - 18, w + 36, h + 36, 60); g.fillStyle = '#0a0a10'; g.fill(); rr(g, x, y, w, h, 46); g.fillStyle = '#e9e2d6'; g.fill();
    g.save(); rr(g, x, y, w, 130, 46); g.clip(); g.fillStyle = '#1f6e5a'; g.fillRect(x, y, w, 130); g.restore();
    label(g, info.group || 'LOS DEL VIERNES', cx, y + 82, { size: 48, color: '#ffffff', spacing: 1 });
    let yy = y + 180; for (const [at, s, who] of info.msgs || []) { const k = pop(t, at, 0.3); if (k <= 0) continue; const me = who === 'me', fs = 48, tw = Math.min(measure(g, s, fs, FONTS.ui, 700) + 70, w - 80), bx = me ? x + w - 30 - tw : x + 30, bh = me ? 100 : 140;
      g.save(); g.translate(me ? bx + tw : bx, yy); g.scale(k, k); g.translate(-(me ? bx + tw : bx), -yy);
      rr(g, bx, yy, tw, bh, 24); g.fillStyle = me ? '#d2f5c4' : '#ffffff'; g.fill();
      if (!me) text(g, who, bx + 34, yy + 36, { size: 32, font: FONTS.ui, weight: 900, color: '#c85a2a', align: 'left' });
      text(g, s, bx + 34, yy + (me ? 52 : 96), { size: fs, font: FONTS.ui, weight: 700, color: '#1a1a22', align: 'left' }); g.restore(); yy += bh + 26; }
    g.restore(); caption(g, t, info, 70);
  },
  // two MRI-style brains: DÍA 1 vs DÍA 14 — grey matter dots fill in on the right one
  mriCompare(g, t, info) {
    g.fillStyle = '#04060c'; g.fillRect(0, 0, E.W, E.H); glow(g, E.W / 2, E.H / 2, 900, '#3a6aff', 0.1);
    const k = ease.inOut(prog(t, info.at ?? 0.6, (info.at ?? 0.6) + 2.2));
    for (const [cx, lab, fill] of [[E.W * 0.3, info.left || 'DÍA 1', 0.45], [E.W * 0.7, info.right || 'DÍA 14', lerp(0.45, 0.75, k)]]) {
      g.save(); g.translate(cx, E.H * 0.5); g.scale(3.4, 3.4); icon(g, 'brain', 0, 0, 1, '#b8c8e8', t); g.restore();
      const r = rng(3); for (let i = 0; i < 90; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()), px = cx + Math.cos(a) * d * 230, py = E.H * 0.47 + Math.sin(a) * d * 150; if (r() < fill) circle(g, px, py, 7, alpha('#d8e0f0', 0.75)); }
      text(g, lab, cx, E.H * 0.84, { size: 54, font: FONTS.ui, weight: 900, color: cx > E.W / 2 ? GREEN : CREAM() }); }
    g.fillStyle = 'rgba(255,255,255,.03)'; for (let y = 0; y < E.H; y += 5) g.fillRect(0, y, E.W, 1);
    placeTag(g, t, info.tag); caption(g, t, info);
  },
  // fatty liver: yellow fat droplets inside the liver melt away from `from` to `to` (fractions)
  liverFat(g, t, info) {
    bp(g);
    const k = ease.inOut(prog(t, info.at ?? 0.4, info.dur - 0.3)), f = lerp(info.from ?? 0.8, info.to ?? 0.3, k), lx = E.W * 0.42, ly = E.H * 0.55;
    g.save(); g.translate(lx, ly); g.scale(4.2, 4.2); icon(g, 'liver', 0, 0, 1, '#c8584a', t); g.restore();
    const r = rng(9); for (let i = 0; i < 40; i++) { const px = lx + (r() - 0.5) * 520, py = ly + (r() - 0.5) * 220, th = r(); if (th < f) circle(g, px, py, 10 + r() * 14, alpha('#ffd86a', 0.85)); }
    label(g, info.text || 'GRASA EN EL HÍGADO', E.W * 0.78, E.H * 0.4, { size: 40 });
    rr(g, E.W * 0.68, E.H * 0.46, 380, 40, 20); g.fillStyle = alpha('#ffffff', 0.12); g.fill(); rr(g, E.W * 0.68, E.H * 0.46, 380 * f, 40, 20); g.fillStyle = '#ffd86a'; g.fill();
    caption(g, t, info);
  },
  // a concert: spotlights, bouncing crowd, a singer with a mic (rig prop), swaying. Optional tag/caption.
  stage(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#0a0614', '#1a0c2a', '#0a0610']); g.fillRect(0, 0, E.W, E.H);
    const cam = camLerp(camAt(960, 640, info.z0 ?? 1.55), camAt(960, 620, info.z1 ?? 1.7), K(info, t));
    layer(g, cam, 1, (g) => {
      for (const [x, c] of [[560, '#ff6ad8'], [960, '#ffd86a'], [1360, '#6ad8ff']]) { const sw = Math.sin(t * 0.8 + x) * 120; g.save(); g.globalAlpha *= 0.18; g.fillStyle = c; g.beginPath(); g.moveTo(x, -40); g.lineTo(x + sw - 260, GY + 40); g.lineTo(x + sw + 260, GY + 40); g.fill(); g.restore(); }
      g.fillStyle = '#20142e'; g.fillRect(0, GY, E.W, 300); glow(g, 960, GY - 200, 500, '#ffd86a', 0.2);
      const pose = breathe(posesAt(t % 2.4, [[0, { ...POSES.stand, eF: [30, -160], hF: [22, -200], eB: [-40, -150], hB: [-70, -190] }], [1.2, { ...POSES.stand, eF: [30, -160], hF: [22, -200], eB: [-30, -120], hB: [-50, -90] }]], 0.5), t, 0.6);
      drawFigure(g, { x: 960 + Math.sin(t * 1.5) * 20, y: GY, s: HS * 1.05, facing: 1, outfit: info.outfit || { top: 'jersey', color: '#f2f2f2', head: 'fedora', headColor: '#e8e0c8' }, prop: { type: 'mic', t }, pose, face: fc({ eyes: 'happy', brows: null, mouth: Math.sin(t * 8) > 0 ? 'oBig' : 'smile' }), look: [0.3, -0.3], blink: blinkAt(t), rim: { color: '#ffd86a', dir: [0, -1] } });
    });
    for (let i = 0; i < 26; i++) { const x = 30 + i * 74, b = Math.abs(Math.sin(t * 4 + i * 1.3)) * 18; circle(g, x, E.H - 60 - b, 34, '#05030a'); rr(g, x - 40, E.H - 40 - b, 80, 80, 30); g.fillStyle = '#05030a'; g.fill(); if (i % 5 === 2) seg(g, [[x + 20, E.H - 80 - b], [x + 50, E.H - 170 - b]], 8, '#05030a'); }
    placeTag(g, t, info.tag); caption(g, t, info);
  },
  // a lab report card: rows [[label, value, at, color]] appear one by one with a ↓ arrow; head line on top
  labReport(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#0c1018', '#141c2a', '#080a10']); g.fillRect(0, 0, E.W, E.H); glow(g, E.W / 2, E.H / 2, 800, '#9fd8ff', 0.1);
    const rows = info.rows || [], w = 1440, h = 230 + rows.length * 150, x = (E.W - w) / 2, y = (E.H - h) / 2 + 20, a = pop(t, 0, 0.4);
    g.save(); zoom(g, lerp(0.96, 1.02, K(info, t))); g.globalAlpha *= clamp(a * 1.5);
    rr(g, x, y, w, h, 18); g.fillStyle = '#f4f1ea'; g.fill(); g.fillStyle = '#c8302a'; g.fillRect(x, y, w, 14);
    text(g, info.head || 'RESULTADOS', x + 70, y + 86, { size: 58, font: FONTS.ui, weight: 900, color: '#1a1a22', align: 'left', spacing: 2 });
    if (info.sub) text(g, info.sub, x + 70, y + 136, { size: 32, font: FONTS.ui, weight: 700, color: '#6a6a7a', align: 'left' });
    seg(g, [[x + 70, y + 170], [x + w - 70, y + 170]], 3, '#c8c4ba');
    rows.forEach(([lab, val, at, col], i) => { const k = fin(t, at ?? 0.5 + i * 0.6, 0.35); if (k <= 0) return; const yy = y + 250 + i * 150;
      g.save(); g.globalAlpha *= k; text(g, lab, x + 70, yy, { size: 50, font: FONTS.ui, weight: 800, color: '#2a2a34', align: 'left' });
      text(g, val, x + w - 70, yy, { size: 84, font: FONTS.ui, weight: 900, color: col || '#1f9a5a', align: 'right' }); g.restore(); });
    g.restore(); placeTag(g, t, info.tag); caption(g, t, info, 70);
  },
  // the week strip L M X J V S D: weekdays stay empty, Saturday fills with cans; kcal counter climbs to `kcal`
  weekendCans(g, t, info) {
    bp(g);
    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'], bw = 220, gap = 24, x0 = (E.W - (7 * bw + 6 * gap)) / 2, y0 = 300, n = info.cans ?? 6, at = info.at ?? 0.8;
    days.forEach((d, i) => { const x = x0 + i * (bw + gap), sat = i === 5; rr(g, x, y0, bw, 460, 20); g.fillStyle = alpha(sat ? AMBER : '#ffffff', sat ? 0.16 : 0.06); g.fill(); g.lineWidth = 4; g.strokeStyle = sat ? AMBER : alpha(BP(), 0.5); g.stroke();
      text(g, d, x + bw / 2, y0 + 56, { size: 50, font: FONTS.ui, weight: 900, color: sat ? AMBER : CREAM() });
      if (!sat && i < 5) label(g, '0', x + bw / 2, y0 + 260, { size: 70, color: alpha(CREAM(), 0.4), a: fin(t, 0.1 + i * 0.08) }); });
    for (let i = 0; i < n; i++) { const k = pop(t, at + i * 0.3, 0.3); if (k > 0) beerCan(g, x0 + 5 * (bw + gap) + 58 + (i % 2) * 104, y0 + 160 + Math.floor(i / 2) * 120, 1.05 * k); }
    const kc = Math.round(lerp(0, info.kcal ?? 918, ease.out(prog(t, at, at + n * 0.3 + 0.3))));
    text(g, `≈ ${kc} KCAL`, E.W / 2, 160, { size: 96, font: FONTS.ui, weight: 900, color: GOLD(), glow: 20, glowColor: alpha(GOLD(), 0.5) });
    label(g, info.sub || 'SOLO EL SÁBADO', E.W / 2, 860, { size: 42 }); caption(g, t, info, 70);
  },
  // icons piling up with a counter: kind 'can' | 'case'; label after the number
  stackIcons(g, t, info) {
    bp(g);
    const to = info.to || 52, n = Math.round(lerp(0, to, ease.out(prog(t, 0.2, info.dur * 0.8)))), few = to <= 20, cols = few ? Math.min(to, 10) : 13, sc = few ? 1.15 : 0.7, dx = few ? 150 : 110, dy = few ? 200 : 120, kind = info.kind || 'case';
    for (let i = 0; i < Math.min(n, cols * 5); i++) { const c = i % cols, r = Math.floor(i / cols), x = E.W / 2 + (c - (cols - 1) / 2) * dx, y = (few ? E.H * 0.82 : E.H * 0.86) - r * dy;
      if (kind === 'can') beerCan(g, x, y, sc); else { g.save(); g.translate(x, y); g.scale(sc / 0.7, sc / 0.7); rr(g, -44, -40, 88, 70, 6); g.fillStyle = '#b87a3a'; g.fill(); g.fillStyle = '#e8c88a'; g.fillRect(-44, -18, 88, 14); for (let k = 0; k < 4; k++) circle(g, -30 + k * 20, -48, 8, AMBER); g.restore(); } }
    text(g, `${n}`, E.W / 2, 150, { size: 140, font: FONTS.ui, weight: 900, color: GOLD(), stroke: 16, strokeColor: '#05060c', glow: 24, glowColor: alpha(GOLD(), 0.5) });
    label(g, info.label || 'CAJAS DE CERVEZA', E.W / 2, 250, { size: 48 }); caption(g, t, info, 330);
  },
  // two scientists in lab coats at a party sip a drink and, on `at`, turn red (flush, sweat, "!") — the disulfiram discovery
  labParty(g, t, info) {
    const cam = camLerp(camAt(1000, 620, 1.45), camAt(1010, 610, 1.58), K(info, t)), { rim, rimDir } = office(g, t, cam);
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,170,60,.25)'; g.fillRect(0, 0, E.W, E.H); g.restore();
    const at = info.at ?? 99, hot = clamp((t - at) / 0.6), SIP = { ...POSES.stand, eF: [30, -160], hF: [22, -200] }, HOLD = { ...POSES.stand, eF: [24, -140], hF: [40, -136] };
    layer(g, cam, 1, (g) => {
      for (const [x, f, ph] of [[860, 1, 0], [1180, -1, 1.1]]) {
        const pose = t < at ? breathe(posesAt((t + ph) % 2.6, [[0, HOLD], [0.8, SIP], [1.5, HOLD]], 0.3), t, 0.6) : breathe({ ...POSES.stand, eF: [20, -150], hF: [10, -190], eB: [-20, -150], hB: [-10, -190] }, t, 0.9);
        drawFigure(g, { x, y: GY, s: HS, facing: f, outfit: { top: 'labcoat', color: '#f2f2f2' }, prop: t < at ? { type: 'wine', t } : null, pose, face: hot > 0.3 ? fc({ eyes: 'ball', brows: 'worried', mouth: 'oBig', eyeSize: 1.2 }) : fc({ eyes: 'ball', brows: null, mouth: 'smile' }), look: [f * 0.6, 0], blink: blinkAt(t + ph), rim: { color: rim, dir: rimDir } });
        if (hot > 0) { glow(g, x, GY - 225 * HS, 90 * HS, '#ff2a2a', 0.55 * hot); const k = pop(t, at + 0.2 + ph * 0.2, 0.3); if (k > 0) text(g, '!', x + f * 70 * HS, GY - 300 * HS, { size: 90 * k, font: FONTS.ui, weight: 900, color: RED }); }
      }
    });
    placeTag(g, t, info.tag); caption(g, t, info);
  },
  // the sick-quitter error: "NO BEBEN" vs "BEBEN POCO"; on sortAt the ill ex-drinkers walk out of the non-drinkers into their own box
  groups(g, t, info) {
    bp(g);
    const s = info.sortAt ?? 99, k = ease.inOut(prog(t, s, s + 1.4)), boxes = [[300, info.left || 'NO BEBEN', CREAM()], [1000, info.right || 'BEBEN POCO', AMBER]];
    for (const [bx, lab, col] of boxes) { rr(g, bx - 270, 250, 540, 560, 24); g.fillStyle = alpha('#ffffff', 0.05); g.fill(); g.lineWidth = 4; g.strokeStyle = alpha(col, 0.6); g.stroke(); text(g, lab, bx, 300, { size: 46, font: FONTS.ui, weight: 900, color: col }); }
    if (k > 0) { rr(g, 1420, 250, 440, 560, 24); g.fillStyle = alpha(RED, 0.08 * k); g.fill(); g.lineWidth = 4; g.strokeStyle = alpha(RED, 0.6 * k); g.stroke(); text(g, info.third || 'DEJARON POR', 1640, 300, { size: 36, font: FONTS.ui, weight: 900, color: RED, alpha: k }); text(g, info.third2 || 'ENFERMEDAD', 1640, 345, { size: 36, font: FONTS.ui, weight: 900, color: RED, alpha: k }); }
    const sick = [1, 4, 8, 10];
    for (let i = 0; i < 12; i++) { const c = i % 4, r = Math.floor(i / 4), hx = 300 + (c - 1.5) * 115, hy = 500 + r * 140, isS = sick.includes(i), j = sick.indexOf(i);
      const tx = 1560 + (j % 2) * 150, ty = 560 + Math.floor(j / 2) * 170, x = isS ? lerp(hx, tx, k) : hx, y = isS ? lerp(hy, ty, k) - Math.sin(k * Math.PI) * 60 : hy;
      stick(g, x, y, 1.75, isS && t > (info.markAt ?? 0.4) ? '#d88a8a' : '#c8ccd8', { cross: isS && t > (info.markAt ?? 0.4) }); }
    for (let i = 0; i < 12; i++) { const c = i % 4, r = Math.floor(i / 4); stick(g, 1000 + (c - 1.5) * 115, 500 + r * 140, 1.75, AMBER); }
    caption(g, t, info, 120);
  },
};
