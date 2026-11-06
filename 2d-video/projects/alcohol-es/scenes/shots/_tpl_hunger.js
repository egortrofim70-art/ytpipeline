// _tpl_hunger.js — templates of "Что если ты перестанешь есть?". A template is (g, t, info); knobs come from beats.py params.
import { E, S, ease, prog, lerp, clamp, key, rr, seg, circle, ring, poly, text, measure, glow, alpha, shade, mix, linGrad, rng, shake, FONTS, layer, blurLayer, veil, mood } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { drawFigure, POSES, breathe, posesAt, walkPose, bigFace, face as drawFaceAt } from '/engine/rig2d.js';
import { bedroom, lyingHero, moonlight, thrownBlanket, GY, HS, BX, MT, HEAD } from '../sets/bedroom.js';
import { kitchen, street } from '../sets/week.js';
import { hospital, hospitalPatient, HB, office } from '../sets/places.js';
import { FR, fridgeOpen, fatMan, cave, stadium, leningrad, basement, CELL, ship, antarctic, penguin, blizzard, den, bear } from '../sets/hunger.js';
import { HERO, ANGUS, ANCEL, VOL, ANDREAS, COP, SOLDIER, GANDHI, LIND, OHSUMI, DOC, CAVE1, CAVE2, SAILOR, F } from '../cast.js';
import { camAt, camLerp, blinkAt, sittingHero, SIT_X } from './_tpl_night.js';
import { icon } from './_tpl_sci.js';

const L = (ru, es) => (/^es/i.test(E.cfg?.language || '') ? es : ru);
const ui = () => S().ui, RED = '#ff5a4a', GREEN = '#5fe39a', BP = () => ui().blueprint, GOLD = () => ui().gold, CREAM = () => ui().cream;
const K = (info, t) => ease.inOut(t / info.dur);
const pop = (t, at, d = 0.35) => ease.outBack(prog(t, at, at + d));
const fin = (t, at, d = 0.3) => ease.out(prog(t, at, at + d));
const fc = (n) => (typeof n === 'string' ? F[n] : n) || F.talk;
const who = (n) => ({ hero: HERO, angus: ANGUS, ancel: ANCEL, vol: VOL, andreas: ANDREAS, cop: COP, soldier: SOLDIER, gandhi: GANDHI, lind: LIND, ohsumi: OHSUMI, doc: DOC, cave1: CAVE1, cave2: CAVE2, sailor: SAILOR })[n] || HERO;
const label = (g, s, x, y, o = {}) => text(g, s, x, y, { size: o.size || 34, font: FONTS.ui, weight: 900, color: o.color || CREAM(), spacing: o.spacing ?? 3, align: o.align || 'center', alpha: o.a ?? 1, glow: o.glow || 0, glowColor: o.glowColor });
const glowLabel = (g, s, x, y, a, size = 56, col = GOLD()) => label(g, s, x, y, { size, color: col, a, glow: 18, glowColor: alpha(col, 0.55) });
function zoom(g, z, cx = E.W / 2, cy = E.H / 2) { g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); }
function sepia(g, a = 0.32) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(200,150,90,${a})`; g.fillRect(0, 0, E.W, E.H); g.restore(); }
function cold(g, a = 0.3) { g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(90,140,255,${a})`; g.fillRect(0, 0, E.W, E.H); g.restore(); }
export function placeTag(g, t, str, at = 0.15) {
  const a = fin(t, at, 0.35); if (a <= 0 || !str) return;
  const w = measure(g, str, 40, FONTS.ui, 900) + 70, x = 70, y = E.H - 150;
  g.save(); g.globalAlpha *= a; g.translate(-(1 - a) * 60, 0);
  rr(g, x, y, w, 80, 14); g.fillStyle = 'rgba(8,10,20,.82)'; g.fill(); g.fillStyle = GOLD(); g.fillRect(x, y, 8, 80);
  text(g, str, x + 36, y + 40, { size: 40, font: FONTS.ui, weight: 900, color: '#ffffff', align: 'left', spacing: 3 }); g.restore();
}
function bubble(g, t, x, y, str, at, o = {}) {
  const a = pop(t, at, 0.3); if (a <= 0) return;
  const size = o.size || 44, w = measure(g, str, size, FONTS.ui, 900) + 70, h = size * 1.9;
  g.save(); g.translate(x, y); g.scale(a, a);
  rr(g, -w / 2, -h / 2, w, h, h / 2); g.fillStyle = o.bg || '#f4efe6'; g.fill();
  const tl = o.tail ?? -w * 0.2, d = o.dir || 1; poly(g, [[tl, h / 2 - 4], [tl - 30 * d, h / 2 + 28], [tl + 20 * d, h / 2 - 4]], o.bg || '#f4efe6');
  text(g, str, 0, 2, { size, font: FONTS.ui, weight: 900, color: o.color || '#1a1622' }); g.restore();
}
function thought(g, t, x, y, r, at, fn, o = {}) {      // a thought cloud with its content drawn by fn(g) at 0,0
  const a = pop(t, at, 0.4); if (a <= 0) return;
  g.save(); g.translate(x, y); g.scale(a, a);
  const c = o.bg || '#f4efe6';
  for (let i = 0; i < 9; i++) { const an = (i / 9) * Math.PI * 2; circle(g, Math.cos(an) * r * 0.78, Math.sin(an) * r * 0.55, r * 0.42, c); }
  g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, r * 0.95, r * 0.7, 0, 0, Math.PI * 2); g.fill();
  const tx = o.tx ?? -r * 0.8, ty = o.ty ?? r * 0.9; circle(g, tx * 0.85, ty * 0.85, r * 0.12, c); circle(g, tx * 1.12, ty * 1.15, r * 0.07, c);
  fn(g); g.restore();
}
function bgKind(g, t, kind) {
  if (kind === 'kitchen') { blurLayer(g, 14, (g) => kitchen(g, t, camAt(1200, 560, 1.4))); veil(g, '#0a0608', 0.35); return; }
  if (kind === 'office') { blurLayer(g, 14, (g) => office(g, t, camAt(1100, 560, 1.5))); veil(g, '#0a0608', 0.35); return; }
  if (kind === 'room') { blurLayer(g, 14, (g) => bedroom(g, t, camAt(1000, 560, 1.4), { dawn: 0.2 })); veil(g, '#06070f', 0.45); return; }
  if (kind === 'hospital') { blurLayer(g, 14, (g) => hospital(g, t, camAt(1000, 560, 1.5), {})); veil(g, '#06080c', 0.4); return; }
  if (kind === 'street') { blurLayer(g, 14, (g) => street(g, t, camAt(1200, 560, 1.4), {})); veil(g, '#06080c', 0.3); return; }
  if (kind === 'dark') { g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#07081a', '#10142e', '#07081a']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H / 2, 900, '#3a4aa0', 0.25); return; }
  if (kind === 'red') { g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#14040a', '#2a0812', '#0a0206']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H / 2, 900, RED, 0.18); return; }
  if (kind === 'paper') { g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#3a2e22', '#4a3a2a', '#2a2018']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H * 0.45, 900, '#ffcf8a', 0.18); return; }
  UI.blueprint(g, { grid: 60, a: 0.08 }); glow(g, E.W / 2, E.H / 2, 1000, BP(), 0.06);
}

// ---------- small rig poses ----------
const REACH = { ...POSES.reach, eF: [40, -178], hF: [70, -184] };
const BELLY = { ...POSES.stand, head: [8, -200], eF: [24, -140], hF: [18, -118], eB: [16, -140], hB: [10, -120] };
const SHIVER = { ...POSES.crossArms, head: [6, -200], sh: [2, -170] };
const BENT = { head: [40, -160], sh: [26, -136], hip: [0, -98], eF: [44, -104], hF: [48, -72], eB: [34, -104], hB: [40, -70], kF: [16, -50], fF: [14, 0], kB: [-6, -50], fB: [-14, 0] };

export const HUNGER = {
  // ======== kitchen / fridge ========
  kitchenWalk(g, t, info) {      // he walks into the kitchen and slows to a stop by the fridge
    const p = ease.out(prog(t, 0, info.dur * 0.9)), hx = lerp(info.x0 ?? 1080, info.x1 ?? 1600, p), walking = p < 0.97;
    const cam = camAt(lerp(1300, 1560, p), 600, 1.42), { rim, rimDir } = kitchen(g, t, cam);
    const pose = walking ? walkPose(hx / 120) : breathe(POSES.stand, t, 0.6);
    layer(g, cam, 1, (g) => drawFigure(g, { x: hx, y: GY, s: HS, facing: 1, outfit: HERO, pose, face: fc(info.face || 'day1'), look: [0.6, 0], blink: blinkAt(t), rim: { color: rim, dir: rimDir } }));
  },
  fridge(g, t, info) {           // reaches for the handle, opens on `openAt`: empty and lit. optional closeAt
    const oa = info.openAt ?? 0.4, ca = info.closeAt ?? 99, d = info.dur;
    const k = ca < 99 ? Math.min(prog(t, oa - 0.1, oa + 0.5), 1 - prog(t, ca, ca + 0.4)) : prog(t, oa - 0.1, oa + 0.5);
    const cam = camLerp(camAt(info.cx ?? 1660, 600, info.z0 ?? 1.5), camAt((info.cx ?? 1660) + 30, 590, info.z1 ?? 1.64), K(info, t)), { rim, rimDir } = kitchen(g, t, cam);
    const after = info.pose1 ? POSES[info.pose1] : POSES.stand;
    const pose = breathe(posesAt(t, [[0, REACH], [oa + 0.35, after], [ca, REACH], [ca + 0.5, info.pose2 ? POSES[info.pose2] : POSES.relaxed]], 0.3), t, 0.6);
    layer(g, cam, 1, (g) => {
      fridgeOpen(g, k);
      drawFigure(g, { x: 1626, y: GY, s: HS, facing: 1, outfit: HERO, pose, face: t > (info.shockAt ?? oa + 0.3) && t < ca ? fc(info.face1 || 'shock') : fc(info.face0 || 'day1'), look: [0.7, -0.05], blink: blinkAt(t + 0.7), rim: k > 0.3 ? { color: '#e6f4ff', dir: [1, -0.2] } : { color: rim, dir: rimDir } });
    });
  },
  fridgePOV(g, t, info) {        // from inside the empty fridge: his face lit cold; shelves in the foreground
    g.fillStyle = '#0a0c12'; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    blurLayer(g, 10, (g) => kitchen(g, t, camAt(1100, 480, 1.6))); veil(g, '#05070c', 0.5);
    const r = lerp(310, 340, K(info, t)), look = key(t, info.lookKeys || [[0, [0, 0.4]], [0.7, [-0.7, 0.3]], [1.4, [0.7, 0.3]], [2.0, [0, 0.5]]], ease.inOut);
    glow(g, E.W / 2, E.H * 0.55, 700, '#d8ecff', 0.4);
    bigFace(g, E.W / 2, E.H * 0.62, r, { outfit: HERO, face: fc(info.face || 'fear'), look, rimColor: '#e6f4ff', rimSide: 1, blink: blinkAt(t + 0.3) });
    g.fillStyle = alpha('#e8f4ff', 0.18); g.fillRect(0, 0, E.W, E.H);
    for (const y of [150, 930]) { rr(g, -40, y, E.W + 80, 26, 6); g.fillStyle = alpha('#f4fbff', 0.85); g.fill(); rr(g, -40, y + 26, E.W + 80, 10, 4); g.fillStyle = alpha('#9ab0c8', 0.7); g.fill(); }
    for (const x of [40, E.W - 40]) { g.fillStyle = linGrad(g, x - 80, 0, x + 80, 0, [alpha('#e8f2ff', 0.9), alpha('#c8d8ea', 0.9)]); g.fillRect(x - 70, 0, 140, E.H); }
    if (info.item) { g.save(); g.translate(E.W * 0.78, 880); icon(g, info.item, 0, 0, 0.9, GOLD(), t); g.restore(); }
  },
  // ======== calendar / counters ========
  calendarFlip(g, t, info) {     // a wall calendar: day number counts from→to (pages fly) or shows text steps
    bgKind(g, t, info.bg || 'dark');
    const cx = E.W / 2 + (info.dx || 0), cy = E.H * 0.47, a = pop(t, 0.05, 0.4), z = lerp(1, 1.06, K(info, t));
    g.save(); zoom(g, z * a, cx, cy);
    let main, sub = info.sub || L('ДЕНЬ', 'DÍA'), flipping = false;
    if (info.steps) { const st = info.steps.filter(([at]) => t >= at); const cur = st.length ? st[st.length - 1] : info.steps[0]; main = cur[1]; sub = cur[2] ?? sub; flipping = st.length && t - cur[0] < 0.25; }
    else { const p = ease.inOut(prog(t, info.at ?? 0.2, info.until ?? info.dur * 0.85)), n = Math.round(lerp(info.from ?? 1, info.to ?? 18, p)); main = String(n); flipping = p > 0 && p < 1; }
    const w = info.w || 520, h = 600, big = info.size || (main.length > 4 ? 120 : 260);
    rr(g, cx - w / 2 + 14, cy - h / 2 + 18, w, h, 22); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, cx - w / 2, cy - h / 2, w, h, 22); g.fillStyle = '#f4efe6'; g.fill();
    rr(g, cx - w / 2, cy - h / 2, w, 130, 22); g.fillStyle = info.color || '#e04a3a'; g.fill(); g.fillRect(cx - w / 2, cy - h / 2 + 100, w, 30);
    for (const rx of [-w * 0.3, w * 0.3]) { circle(g, cx + rx, cy - h / 2, 18, '#2a2a34'); }
    text(g, sub, cx, cy - h / 2 + 66, { size: 56, font: FONTS.ui, weight: 900, color: '#ffffff', spacing: 6 });
    text(g, main, cx, cy + 70, { size: big, font: FONTS.ui, weight: 900, color: '#1a1622' });
    if (flipping) { const f = (t * 8) % 1; g.save(); g.globalAlpha *= 1 - f; g.translate(cx + f * 220, cy + 60 - f * 160); g.rotate(f * 0.9); rr(g, -w / 2 + 20, -200, w - 40, 400, 12); g.fillStyle = '#ebe5d8'; g.fill(); g.restore(); }
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, E.H * 0.92, fin(t, info.capAt ?? 0.4), 52);
  },
  stopwatch(g, t, info) {        // "время пошло": a stopwatch, the hand starts on `startAt`
    bgKind(g, t, info.bg || 'kitchen');
    const cx = E.W / 2, cy = E.H * 0.52, R = 300, sa = info.startAt ?? 0.4, run = Math.max(0, t - sa), a = pop(t, 0, 0.35);
    g.save(); zoom(g, a * lerp(1, 1.05, K(info, t)), cx, cy);
    rr(g, cx - 40, cy - R - 90, 80, 70, 12); g.fillStyle = '#c8ccd8'; g.fill(); circle(g, cx, cy, R + 30, '#c8ccd8'); circle(g, cx, cy, R, '#f6f4ee');
    for (let i = 0; i < 60; i++) { const an = (i / 60) * Math.PI * 2, l = i % 5 ? 18 : 42; seg(g, [[cx + Math.sin(an) * (R - 14), cy - Math.cos(an) * (R - 14)], [cx + Math.sin(an) * (R - 14 - l), cy - Math.cos(an) * (R - 14 - l)]], i % 5 ? 4 : 8, '#2a2a34'); }
    const an = run * Math.PI * 2 / 6; seg(g, [[cx, cy], [cx + Math.sin(an) * (R - 50), cy - Math.cos(an) * (R - 50)]], 10, RED); circle(g, cx, cy, 22, '#1a1622');
    if (t > sa && t < sa + 0.4) FX.rings(g, cx, cy, t - sa, { count: 2, r0: R, r1: R + 260, speed: 2.4, color: '#ffffff', a: 0.4 });
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, E.H * 0.1 + 20, fin(t, sa), 60);
  },
  // ======== the three tanks ========
  tanks(g, t, info) {
    bgKind(g, t, 'blueprint');
    const names = info.names || L(['ГЛИКОГЕН', 'ЖИР', 'МЫШЦЫ'], ['GLUCÓGENO', 'GRASA', 'MÚSCULO']), cols = ['#ffd24a', '#f2a64a', '#ff6a5a'], icons = ['sugar', 'fat', 'muscle'];
    const lv = info.levels ? key(t, info.levels, ease.inOut) : info.level || [1, 1, 1];
    const show = info.show || [0.1, 0.4, 0.7], z = lerp(1, 1.05, K(info, t));
    g.save(); zoom(g, z);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 120, fin(t, info.capAt ?? 0.1), 58);
    for (let i = 0; i < 3; i++) {
      const a = pop(t, show[i] ?? 0.1, 0.4); if (a <= 0) continue;
      const x = E.W / 2 + (i - 1) * 470, yb = E.H * 0.8, w = 270, h = i === 1 ? 520 : 400, hi = info.hi === i, dim = info.hi != null && !hi;
      g.save(); g.translate(x, yb); g.scale(a, a); g.globalAlpha *= dim ? 0.45 : 1;
      if (hi) glow(g, 0, -h / 2, 380, cols[i], 0.25 + 0.1 * Math.sin(t * 5));
      rr(g, -w / 2, -h, w, h, 40); g.fillStyle = 'rgba(10,18,36,.9)'; g.fill();
      const L = clamp(lv[i]); if (L > 0.001) { g.save(); rr(g, -w / 2, -h, w, h, 40); g.clip(); const sy = -h * L + Math.sin(t * 3 + i) * 6 * (L < 1 ? 1 : 0); g.fillStyle = linGrad(g, 0, sy, 0, 0, [shade(cols[i], 0.15), shade(cols[i], -0.25)]); g.fillRect(-w / 2, sy, w, h); g.restore(); }
      g.lineWidth = 7; g.strokeStyle = hi ? cols[i] : BP(); rr(g, -w / 2, -h, w, h, 40); g.stroke();
      for (let q = 1; q < 4; q++) seg(g, [[w / 2 - 40, -h * q / 4], [w / 2 - 10, -h * q / 4]], 4, alpha(BP(), 0.6));
      icon(g, icons[i], 0, -h - 90, 0.9, cols[i], t);
      label(g, names[i], 0, 60, { size: 46, color: hi ? cols[i] : CREAM() });
      if (info.subs && info.subs[i]) label(g, info.subs[i], 0, 116, { size: 42, color: alpha(CREAM(), 0.75), a: fin(t, (show[i] ?? 0.1) + 0.4) });
      if (info.flow === i) { const fa = fin(t, info.flowAt ?? 0.3); seg(g, [[0, 0], [0, 40]], 22, alpha(cols[i], fa)); for (let q = 0; q < 4; q++) { const fy = ((t * 1.6 + q / 4) % 1) * 120; circle(g, 0, 10 + fy, 10, alpha(cols[i], fa * (1 - fy / 120))); } }
      if (info.order) { circle(g, -w / 2 + 10, -h + 10, 40, GOLD()); text(g, String(i + 1), -w / 2 + 10, -h + 12, { size: 50, font: FONTS.ui, weight: 900, color: '#1a1622' }); }
      if (info.lock === i) { const la = fin(t, info.lockAt ?? 0.4); g.globalAlpha *= la; rr(g, -50, -h / 2 - 30, 100, 80, 12); g.fillStyle = '#c8ccd8'; g.fill(); g.strokeStyle = '#c8ccd8'; g.lineWidth = 14; g.beginPath(); g.arc(0, -h / 2 - 30, 34, Math.PI, Math.PI * 2); g.stroke(); }
      g.restore();
    }
    g.restore();
  },
  bodyTanks(g, t, info) {        // "your body is a car with three tanks": a blueprint body, three tanks pop inside it
    bgKind(g, t, 'blueprint');
    const cx = E.W * 0.42, base = E.H * 0.95, z = lerp(1, 1.06, K(info, t)); g.save(); zoom(g, z);
    UI.lineFigure(g, { x: cx, y: base, s: 3.6, color: alpha(BP(), 0.8) });
    const spots = [[cx + 30, base - 560, '#ffd24a', 'ГЛИКОГЕН'], [cx + 10, base - 430, '#f2a64a', 'ЖИР'], [cx - 30, base - 170, '#ff6a5a', 'МЫШЦЫ']];
    spots.forEach(([x, y, c, n], i) => { const a = pop(t, (info.at ?? 0.4) + i * 0.4); if (a <= 0) return; g.save(); g.translate(x, y); g.scale(a, a); rr(g, -34, -54, 68, 108, 18); g.fillStyle = alpha(c, 0.9); g.fill(); g.restore();
      seg(g, [[x + 40, y], [E.W * 0.66, y]], 3, alpha(c, 0.7 * a)); label(g, n, E.W * 0.68, y, { size: 44, align: 'left', color: c, a }); });
    g.restore();
  },
  fuelSwitch(g, t, info) {       // the brain is fed sugar cubes; on `switchAt` the pipe changes to ketone drops from fat
    bgKind(g, t, 'blueprint');
    const sw = ease.inOut(prog(t, info.switchAt ?? 1.0, (info.switchAt ?? 1.0) + 0.6)), bx = E.W * 0.68, by = E.H * 0.46;
    icon(g, 'brain', bx, by, 3.0, sw > 0.5 ? GREEN : GOLD(), t); glow(g, bx, by, 300, sw > 0.5 ? GREEN : GOLD(), 0.18);
    const srcX = E.W * 0.2;
    icon(g, 'sugar', srcX, E.H * 0.3, 1.1, GOLD(), t); label(g, 'САХАР', srcX, E.H * 0.3 + 110, { size: 40, a: 1 - sw * 0.6 });
    icon(g, 'fat', srcX, E.H * 0.7, 1.1, GOLD(), t); label(g, 'ЖИР → КЕТОНЫ', srcX + 30, E.H * 0.7 + 110, { size: 40, color: sw > 0.5 ? GREEN : CREAM(), a: 0.4 + sw * 0.6 });
    for (const [y0, on, col] of [[E.H * 0.3, 1 - sw, GOLD()], [E.H * 0.7, sw, GREEN]]) {
      g.strokeStyle = alpha(col, 0.25 + 0.5 * on); g.lineWidth = 10; g.beginPath(); g.moveTo(srcX + 110, y0); g.quadraticCurveTo(E.W * 0.45, y0, bx - 220, by); g.stroke();
      for (let q = 0; q < 6; q++) { const u = ((t * 0.7 + q / 6) % 1), x = (1 - u) ** 2 * (srcX + 110) + 2 * u * (1 - u) * E.W * 0.45 + u * u * (bx - 220), y = (1 - u) ** 2 * y0 + 2 * u * (1 - u) * y0 + u * u * by;
        if (on > 0.05) { g.save(); g.globalAlpha *= on; if (col === GREEN) icon(g, 'ketone', x, y, 0.35, GREEN, t); else { rr(g, x - 16, y - 16, 32, 32, 5); g.fillStyle = '#f4f4f8'; g.fill(); } g.restore(); } }
    }
    if (info.caption) glowLabel(g, info.caption, bx, E.H * 0.85, fin(t, info.capAt ?? (info.switchAt ?? 1) + 0.5), 64, GREEN);
  },
  bodyBurn(g, t, info) {         // blueprint body: mode 'fat' (belly glow shrinks) | 'muscle' (limbs glow red, particles drift away)
    bgKind(g, t, 'blueprint');
    const cx = E.W / 2, base = E.H * 0.96, mode = info.mode || 'muscle', k = ease.inOut(prog(t, info.at ?? 0.3, info.dur - 0.2)), z = lerp(1, 1.07, K(info, t));
    g.save(); zoom(g, z);
    const s = 3.6, P = POSES.stand, W = (p) => [cx + p[0] * s, base + p[1] * s];
    if (mode === 'fat') { const r = lerp(140, 70, k); glow(g, ...W([0, -130]), r * 2, '#f2a64a', 0.4); g.fillStyle = alpha('#f2a64a', 0.55); g.beginPath(); g.ellipse(...W([2, -132]), r, r * 1.2, 0, 0, Math.PI * 2); g.fill(); }
    UI.lineFigure(g, { x: cx, y: base, s, color: alpha(BP(), 0.85) });
    if (mode === 'muscle') {
      const col = mix('#ff9a8a', RED, k);
      for (const pts of [[P.hip, P.kF, P.fF], [P.hip, P.kB, P.fB], [P.sh, P.eF, P.hF], [P.sh, P.eB, P.hB]]) { g.strokeStyle = alpha(col, 0.35 + 0.5 * k); g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(...W(pts[0])); pts.slice(1).forEach((q) => g.lineTo(...W(q))); g.stroke(); }
      if (info.heart) { const hb = 1 + 0.12 * Math.max(0, Math.sin(t * 6)) ** 6; icon(g, 'heart', ...W([2, -150]), 0.75 * hb, RED, t); glow(g, ...W([2, -150]), 140, RED, 0.35 * k); }
      const r = rng(4); for (let i = 0; i < 30; i++) { const lim = [P.kF, P.kB, P.eF, P.eB][i % 4], [px, py] = W(lim), u = (t * 0.4 + r()) % 1; circle(g, px + (r() - 0.5) * 60 + u * 30, py - u * 220, 6 * (1 - u), alpha(RED, (1 - u) * k)); }
    }
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 58, mode === 'fat' ? '#f2a64a' : '#ff8a7a');
  },
  // ======== prehistory ========
  cave(g, t, info) {
    const feast = info.mode !== 'empty', cam = camLerp(camAt(960, 640, 1.3), camAt(980, 620, 1.42), K(info, t)), { rim } = cave(g, t, cam, { fire: feast ? 1 : 0.45, meat: feast, mammoth: feast && info.mammoth !== false });
    layer(g, cam, 1, (g) => {
      const people = [[680, 1, CAVE1, 0], [820, 1, CAVE2, 1], [1120, -1, CAVE1, 2], [1260, -1, CAVE2, 3]];
      for (const [x, f, of, i] of people) {
        if (!feast) { g.fillStyle = '#5a4840'; g.beginPath(); g.ellipse(x - f * 6, GY - 32 * HS * 0.92, 44 * HS * 0.92, 36 * HS * 0.92, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = alpha('#000', 0.3); g.beginPath(); g.ellipse(x - f * 6, GY - 20 * HS * 0.92, 44 * HS * 0.92, 24 * HS * 0.92, 0, 0, Math.PI); g.fill(); g.fillStyle = alpha('#ffa050', 0.25); g.beginPath(); g.ellipse(x - f * 6 + f * 20, GY - 50 * HS * 0.92, 20, 10, 0, 0, Math.PI * 2); g.fill(); }
        const pose = feast ? breathe(posesAt(t + i * 0.3, [[0, POSES.cheer], [0.6, POSES.holdFront], [1.2, POSES.cheer]], 0.3), t, 0.8, i) : breathe({ ...POSES.sit, head: [12, -168], sh: [6, -140] }, t, 0.5, i);
        drawFigure(g, { x, y: GY, s: HS * 0.92, facing: f, outfit: of, pose, face: feast ? F.smile : F.sad, look: [0.5, 0.2], rim: { color: rim, dir: [-f, -0.3] } });
      }
    });
    placeTag(g, t, info.tag);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.2), 64, feast ? GOLD() : '#9ab0d0');
  },
  // ======== day one ========
  growl(g, t, info) {            // at the office: hands on the belly, the stomach rumbles in rings
    const cam = camLerp(camAt(1000, 620, 1.55), camAt(1010, 610, 1.68), K(info, t)), { rim, rimDir } = office(g, t, cam), at = info.at ?? 0.4;
    const rum = t > at ? Math.max(0, Math.sin((t - at) * 9)) * (1 - prog(t, at + 1.2, at + 1.8)) : 0, [sx] = shake(t, 3 * rum, 30);
    layer(g, cam, 1, (g) => {
      drawFigure(g, { x: 1000 + sx, y: GY, s: HS, facing: 1, outfit: HERO, pose: breathe(posesAt(t, [[0, POSES.stand], [at - 0.1, BELLY]], 0.3), t, 0.6), face: t > at ? fc(info.face || 'fear') : fc('day1'), look: t > at ? [0.3, 0.8] : [0.5, 0], rim: { color: rim, dir: rimDir } });
      if (t > at) FX.rings(g, 1030, GY - 125 * HS, t - at, { count: 3, r0: 30, r1: 200, speed: 1.6, color: '#ffe2a8', a: 0.5 * (1 - prog(t, at + 1.4, at + 2)) });
    });
    if (t > at) { const a = fin(t, at, 0.2); g.save(); const [x, y] = [E.W * 0.68, E.H * 0.42]; g.translate(x + Math.sin(t * 30) * 4, y); g.rotate(-0.1); text(g, info.sound || L('УРРРР…', 'GRRRR…'), 0, 0, { size: 96, font: FONTS.title, weight: 700, color: GOLD(), alpha: a, stroke: 14, strokeColor: '#1a1206' }); g.restore(); }
  },
  angry(g, t, info) {            // "голодная злость": angry face, red pulse, steam
    bgKind(g, t, info.bg || 'office');
    const beat = 0.5 + 0.5 * Math.sin(t * 6), r = lerp(300, 330, K(info, t)), [sx, sy] = shake(t, 3 + 3 * beat, 24), cx = E.W * (info.side ?? 0.42), cy = E.H * 0.62;
    glow(g, cx, cy, 700, RED, 0.12 + 0.12 * beat);
    bigFace(g, cx + sx, cy + sy, r, { outfit: who(info.who || 'hero'), face: { eyes: 'ball', brows: 'angry', mouth: 'flat', pupil: 0.3, lid: 0.25 }, look: info.look || [0.5, 0], rimColor: '#ff8a6a', rimSide: 1 });
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const u = ((t * 0.9 + i / 3) % 1), x = cx + s * r * 0.75 + s * u * 60, y = cy - r * 0.9 - u * 200; circle(g, x, y, 30 + u * 40, alpha('#f4f0ff', 0.4 * (1 - u))); }
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(255,40,30,${0.22 + 0.1 * beat})`; g.fillRect(0, 0, E.W, E.H); g.restore();
    if (info.word) bubble(g, t, E.W * 0.76, E.H * 0.3, info.word, info.wordAt ?? 0.4, { dir: -1, tail: -60, size: 56 });
  },
  compare(g, t, info) {          // two (or three) quantities side by side, each with an icon, a value and a filling pie
    bgKind(g, t, info.bg || 'blueprint');
    const items = info.items || [], n = items.length, gap = E.W / (n + 0.6);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 120, fin(t, 0.05), 56);
    items.forEach((it, i) => {
      const x = E.W / 2 + (i - (n - 1) / 2) * gap, y = E.H * 0.47, at = it.at ?? 0.2 + i * 0.6, a = pop(t, at, 0.4); if (a <= 0) return;
      const col = it.color || GOLD(); g.save(); g.translate(x, y); g.scale(a, a);
      if (it.pct != null) { const p = ease.out(prog(t, at + 0.2, at + 1.0)) * it.pct; circle(g, 0, 0, 170, 'rgba(10,18,36,.9)'); g.fillStyle = alpha(col, 0.85); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 170, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); g.closePath(); g.fill(); ring(g, 0, 0, 170, 6, BP()); if (it.icon) { g.save(); g.globalAlpha *= 0.9; icon(g, it.icon, 0, 0, 1.0, '#0b1324', t); g.restore(); } }
      else if (it.icon) icon(g, it.icon, 0, -20, 1.6, col, t);
      text(g, it.value, 0, 250, { size: it.size || 110, font: FONTS.ui, weight: 900, color: col, glow: 24, glowColor: alpha(col, 0.5) });
      label(g, it.label || '', 0, 340, { size: 40 });
      g.restore();
    });
    if (info.vs && n === 2) label(g, info.vs, E.W / 2, E.H * 0.47, { size: 60, color: alpha(CREAM(), 0.6), a: fin(t, items[1]?.at ?? 0.8) });
  },
  chart(g, t, info) {            // a line chart drawn left→right; pts [[x0..1, y0..1]]; marks [{x, icon, label}]; endLabel
    bgKind(g, t, info.bg || 'blueprint');
    const x0 = 240, x1 = E.W - 200, y0 = E.H * 0.8, y1 = E.H * 0.24, col = info.color || GOLD(), p = ease.inOut(prog(t, info.at ?? 0.2, info.until ?? info.dur * 0.8));
    if (info.title) glowLabel(g, info.title, E.W / 2, 110, fin(t, 0), 54, CREAM());
    seg(g, [[x0, y1 - 40], [x0, y0], [x1 + 40, y0]], 5, alpha(BP(), 0.8));
    if (info.ylabel) label(g, info.ylabel, x0 + 20, y1 - 60, { size: 30, align: 'left', color: alpha(CREAM(), 0.75) });
    (info.xlabels || []).forEach(([u, s]) => label(g, s, lerp(x0, x1, u), y0 + 50, { size: 30, color: alpha(CREAM(), 0.75) }));
    const pts = info.pts || [[0, 0.9], [1, 0.3]], X = (u) => lerp(x0, x1, u), Y = (v) => lerp(y0, y1, v);
    const sample = (u) => { for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const [a0, b0] = pts[i - 1], [a1, b1] = pts[i], k = (u - a0) / Math.max(1e-6, a1 - a0); return lerp(b0, b1, info.smooth === false ? k : ease.inOut(k)); } return pts[pts.length - 1][1]; };
    g.beginPath(); for (let u = 0; u <= p + 1e-6; u += 0.004) g.lineTo(X(u), Y(sample(u)));
    if (info.fill !== false && p > 0) { g.save(); g.lineTo(X(p), y0); g.lineTo(X(0), y0); g.closePath(); g.fillStyle = alpha(col, 0.14); g.fill(); g.restore(); g.beginPath(); for (let u = 0; u <= p + 1e-6; u += 0.004) g.lineTo(X(u), Y(sample(u))); }
    g.strokeStyle = col; g.lineWidth = 8; g.lineJoin = 'round'; g.stroke();
    if (info.pts2) { const P2 = info.pts2, s2 = (u) => { for (let i = 1; i < P2.length; i++) if (u <= P2[i][0]) { const k = (u - P2[i - 1][0]) / Math.max(1e-6, P2[i][0] - P2[i - 1][0]); return lerp(P2[i - 1][1], P2[i][1], info.smooth === false ? k : ease.inOut(k)); } return P2[P2.length - 1][1]; };
      g.save(); g.beginPath(); for (let u = 0; u <= p + 1e-6; u += 0.004) g.lineTo(X(u), Y(s2(u))); g.strokeStyle = info.color2 || GREEN; g.lineWidth = 8; g.stroke(); g.restore();
      if (info.label2 && p > 0.3) label(g, info.label2, X(Math.min(p, 0.95)), Y(s2(Math.min(p, 0.95))) + 50, { size: 34, color: info.color2 || GREEN }); if (info.label1 && p > 0.3) label(g, info.label1, X(0.2), Y(sample(0.2)) - 50, { size: 34, color: col }); }
    if (p > 0) { circle(g, X(p), Y(sample(p)), 14, col); glow(g, X(p), Y(sample(p)), 60, col, 0.5); }
    (info.marks || []).forEach((m) => { if (p < m.x) return; const a = pop(t, (info.at ?? 0.2) + m.x * ((info.until ?? info.dur * 0.8) - (info.at ?? 0.2)), 0.3), mx = X(m.x), my = Y(sample(m.x)); if (m.icon) icon(g, m.icon, mx, my - 90, 0.55 * a, m.color || GOLD(), t); if (m.label) label(g, m.label, mx, my - (m.icon ? 170 : 60), { size: 34, a, color: m.color || CREAM() }); });
    if (info.endLabel) { const a = fin(t, info.endAt ?? info.dur * 0.75); text(g, info.endLabel, X(p) + (info.endDx ?? -40), Y(sample(p)) + (info.endDy ?? -90), { size: 96, font: FONTS.ui, weight: 900, color: info.endColor || col, alpha: a, glow: 26, glowColor: alpha(info.endColor || col, 0.6), align: 'right' }); }
  },
  // ======== day three ========
  symptom(g, t, info) {          // the hero's face + one symptom overlay
    const mode = info.mode || 'acetone';
    bgKind(g, t, info.bg || 'room');
    const r = lerp(300, 325, K(info, t)) * (mode === 'edema' ? lerp(1, 1.12, ease.inOut(prog(t, 0.2, 1.2))) : 1), cx = E.W * (info.side ?? 0.4), cy = E.H * 0.62;
    let fx = 0, fy = 0, faceO = fc(info.face || 'tired'), look = info.look || [0.3, 0];
    if (mode === 'cold') { [fx, fy] = shake(t, 5, 40); faceO = { eyes: 'ball', brows: 'worried', mouth: 'wavy', lid: 0.2 }; }
    if (mode === 'dizzy') { fx = Math.sin(t * 2.2) * 30; faceO = { eyes: 'ball', brows: 'worried', mouth: 'wavy', lid: 0.55, pupil: 0.3 }; look = [Math.sin(t * 3), Math.cos(t * 3) * 0.5]; }
    if (mode === 'slow') { faceO = { ...F.tired, lid: 0.6 }; look = [0, -0.6]; }
    if (mode === 'calm') { faceO = { eyes: 'ball', brows: null, mouth: 'smallFlat', lid: 0.3 }; }
    if (mode === 'edema') { faceO = { eyes: 'ball', brows: 'worried', mouth: 'flat', lid: lerp(0.3, 0.7, prog(t, 0.2, 1.2)), bags: 1 }; }
    bigFace(g, cx + fx, cy + fy, r, { outfit: HERO, face: faceO, look, rimColor: mode === 'cold' ? '#bfe4ff' : '#b8c8ff', rimSide: 1, blink: blinkAt(t + 0.2) });
    if (mode === 'edema') { const k = ease.inOut(prog(t, 0.2, 1.2)); for (const s of [-1, 1]) { g.fillStyle = alpha('#2a2e48', 0.6 * k); g.beginPath(); g.ellipse(cx + fx + s * r * 0.62, cy + r * 0.25, r * 0.28, r * 0.2, 0, 0, Math.PI * 2); g.fill(); } }
    if (mode === 'acetone') { const a = fin(t, info.at ?? 0.3, 0.5); for (let i = 0; i < 5; i++) { const u = ((t * 0.35 + i / 5) % 1), x = cx + r * 0.2 + u * 520, y = cy + r * 0.45 - u * 140 + Math.sin(u * 8 + i) * 30; circle(g, x, y, 40 + u * 110, alpha('#9aff6a', 0.22 * a * (1 - u))); }
      label(g, 'АЦЕТОН', E.W * 0.78, E.H * 0.3, { size: 64, color: '#b8ff8a', a, glow: 20, glowColor: alpha('#9aff6a', 0.5) }); }
    if (mode === 'headache') { const th = Math.max(0, Math.sin(t * 7)) ** 3; for (const s of [-1, 1]) { const x = cx + s * r * 1.05, y = cy - r * 0.45; g.save(); g.translate(x, y); g.scale(1 + th * 0.2, 1 + th * 0.2); poly(g, [[0, -60], [s * 34, -10], [s * 6, -6], [s * 30, 54], [-s * 10, 0], [s * 10, -2]], alpha(GOLD(), 0.6 + 0.4 * th)); g.restore(); }
      g.save(); g.globalAlpha = 0.25 * th; g.fillStyle = RED; g.fillRect(0, 0, E.W, E.H); g.restore(); }
    if (mode === 'slow') { const x = E.W * 0.78, y = E.H * 0.38; for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2 + Math.floor(t * 3) * (Math.PI / 4); circle(g, x + Math.cos(an) * 80, y + Math.sin(an) * 80, 16, alpha(CREAM(), 0.2 + 0.8 * (i / 8))); }
      label(g, info.text || L('ЗАГРУЗКА…', 'CARGANDO…'), x, y + 150, { size: 44, color: alpha(CREAM(), 0.8) }); }
    if (mode === 'cold') { cold(g, 0.35); FX.snow(g, t, { count: 60, color: '#eef6ff', speed: 30 }); for (let i = 0; i < 3; i++) { const u = ((t * 0.6 + i / 3) % 1); circle(g, cx + r * 0.1 + u * 180, cy + r * 0.45 - u * 60, 26 + u * 50, alpha('#ffffff', 0.25 * (1 - u))); }
      icon(g, 'thermo', E.W * 0.8, E.H * 0.45, 1.6, '#9fd8ff', t); }
    if (mode === 'dizzy') { const dk = ease.inOut(prog(t, info.at ?? 0.6, (info.at ?? 0.6) + 0.8)); const gr = g.createRadialGradient(E.W / 2, E.H / 2, lerp(900, 260, dk), E.W / 2, E.H / 2, lerp(1300, 700, dk)); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${0.95 * dk})`); g.fillStyle = gr; g.fillRect(0, 0, E.W, E.H);
      for (let i = 0; i < 5; i++) { const an = t * 2 + i * 1.26; FX.sparkle(g, cx + Math.cos(an) * r * 1.1, cy - r * 1.0 + Math.sin(an) * 40, 26, '#ffffff', 0.8); } }
    if (mode === 'calm') { const k = ease.inOut(prog(t, 0.2, info.dur - 0.2)); label(g, info.word || L('ГОЛОД', 'ANTOJO'), E.W * 0.78, E.H * 0.35, { size: lerp(120, 60, k), color: alpha(GOLD(), lerp(1, 0.3, k)) }); for (let i = 0; i < 3; i++) ring(g, E.W * 0.78, E.H * 0.35, lerp(160, 60, k) + i * 40, 4, alpha(GOLD(), 0.3 * (1 - k))); }
  },
  cellBio(g, t, info) {          // autophagy: a cell; broken parts get wrapped in a bubble and recycled into gold bits
    bgKind(g, t, 'blueprint');
    const cx = E.W / 2, cy = E.H * 0.52, R = 380, z = lerp(1, 1.08, K(info, t)); g.save(); zoom(g, z, cx, cy);
    g.strokeStyle = BP(); g.lineWidth = 8; g.beginPath(); for (let i = 0; i <= 80; i++) { const an = (i / 80) * Math.PI * 2, rr2 = R + Math.sin(an * 5 + t * 1.4) * 14; g.lineTo(cx + Math.cos(an) * rr2 * 1.25, cy + Math.sin(an) * rr2 * 0.8); } g.closePath(); g.fillStyle = alpha(BP(), 0.06); g.fill(); g.stroke();
    circle(g, cx - 60, cy - 20, 110, alpha(BP(), 0.18)); ring(g, cx - 60, cy - 20, 110, 6, BP());
    const parts = [[cx + 220, cy - 140, 0], [cx + 300, cy + 90, 0.5], [cx - 300, cy + 160, 1.0], [cx + 60, cy + 210, 1.5]];
    const eat = info.mode !== 'normal';
    parts.forEach(([x, y, d], i) => {
      const s0 = (info.at ?? 0.4) + d, wrap = eat ? ease.inOut(prog(t, s0, s0 + 0.6)) : 0, dig = eat ? ease.inOut(prog(t, s0 + 0.6, s0 + 1.3)) : 0;
      if (dig < 1) { g.save(); g.globalAlpha *= 1 - dig; g.translate(x, y); g.rotate(i + t * 0.3); g.strokeStyle = '#ff7a6a'; g.lineWidth = 7; g.beginPath(); g.moveTo(-40, -10); g.lineTo(-10, 16); g.lineTo(6, -18); g.lineTo(40, 10); g.stroke(); g.restore(); }
      if (wrap > 0 && dig < 1) ring(g, x, y, lerp(120, 70, wrap), 6, alpha(GOLD(), wrap * (1 - dig)));
      if (dig > 0) for (let q = 0; q < 6; q++) { const an = q + i, dd = dig * 70; circle(g, x + Math.cos(an) * dd, y + Math.sin(an) * dd, 9, alpha(GOLD(), dig)); }
    });
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, E.H * 0.1, fin(t, info.capAt ?? 0.2), 64);
  },
  medal(g, t, info) {            // a scientist and a gold medal: the Nobel prize, with a place/year tag
    bgKind(g, t, info.bg || 'blueprint');
    const cam = camAt(960, 560, lerp(1, 1.05, K(info, t)));
    layer(g, cam, 1, (g) => {
      drawFigure(g, { x: 640, y: GY, s: HS, facing: 1, outfit: who(info.who || 'ohsumi'), pose: breathe(posesAt(t, [[0, POSES.relaxed], [info.at ?? 0.5, POSES.cheer]], 0.3), t, 0.7), face: F.smile, look: [0.6, -0.3], rim: { color: GOLD(), dir: [1, -0.4] } });
      const a = pop(t, info.at ?? 0.5, 0.5), sw = Math.sin(t * 2) * 0.08; g.save(); g.translate(1260, 260); g.rotate(sw); g.scale(a * 2.6, a * 2.6); seg(g, [[-30, -70], [0, 30]], 18, '#3a6ac8'); seg(g, [[30, -70], [0, 30]], 18, '#c83a3a'); circle(g, 0, 80, 64, '#f2c23a'); ring(g, 0, 80, 48, 6, '#c8901a'); g.restore(); glow(g, 1260, 470, 260, GOLD(), 0.3 * a);
    });
    if (info.caption) glowLabel(g, info.caption, 1260, E.H * 0.83, fin(t, (info.at ?? 0.5) + 0.3), 52);
    placeTag(g, t, info.tag);
  },
  // ======== a week ========
  coldBed(g, t, info) {          // shivering under the blanket, breath vapour, frost on the window
    const cam = camLerp(camAt(BX + 230, MT - 60, 1.62), camAt(BX + 210, MT - 55, 1.72), K(info, t)), { M } = bedroom(g, t, cam, { clockH: 2, dawn: 0.1 });
    const [sx, sy] = shake(t, 2.2, 38);
    layer(g, cam, 1, (g) => { g.save(); g.translate(sx, sy); lyingHero(g, M, { face: { eyes: 'ball', brows: 'worried', mouth: 'wavy', lid: 0.2 }, look: [0.3, -0.2], collar: info.collar }); g.restore();
      for (let i = 0; i < 3; i++) { const u = ((t * 0.5 + i / 3) % 1); circle(g, HEAD.x + 60 + u * 140, HEAD.y - 20 - u * 90, 14 + u * 30, alpha('#ffffff', 0.35 * (1 - u))); } });
    moonlight(g, t, cam); cold(g, 0.4);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, 0.3), 56, '#bfe4ff');
  },
  standUp(g, t, info) {          // sits on the bed edge, stands on `at`… and the room goes dark, he sways
    const at = info.at ?? 0.5, dk = ease.inOut(prog(t, at + 0.4, at + 1.3)) * (1 - prog(t, info.dur - 0.5, info.dur));
    const cam = camLerp(camAt(SIT_X - 20, 640, 1.7), camAt(SIT_X - 10, 600, 1.85), K(info, t)), { M } = bedroom(g, t, cam, { dawn: 0.6, clockH: 7 });
    layer(g, cam, 1, (g) => {
      if (t < at) sittingHero(g, M, t, { face: 'tired' });
      else { const k = ease.inOut(prog(t, at, at + 0.4)), sway = Math.sin(t * 2.4) * 0.05 * dk; const p = posesAt(t - at, [[0, { ...POSES.sit, head: [18, -166], sh: [8, -140] }], [0.35, POSES.stand]], 0.35);
        drawFigure(g, { x: SIT_X + lerp(0, 30, k), y: GY, s: HS, facing: 1, outfit: HERO, pose: p, rot: sway, face: { eyes: 'ball', brows: 'worried', mouth: 'wavy', lid: 0.4 + 0.3 * dk }, look: [0, 0.3], rim: { color: M.rim, dir: [1, -0.4] } }); }
    });
    moonlight(g, t, cam, { dawn: 0.6 });
    const gr = g.createRadialGradient(E.W / 2, E.H / 2, lerp(1000, 200, dk), E.W / 2, E.H / 2, lerp(1400, 650, dk)); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${0.97 * dk})`); g.fillStyle = gr; g.fillRect(0, 0, E.W, E.H);
    if (dk > 0.2) for (let i = 0; i < 6; i++) { const an = t * 1.8 + i; FX.sparkle(g, E.W / 2 + Math.cos(an) * 260, E.H * 0.4 + Math.sin(an * 1.3) * 120, 22, '#ffffff', 0.7 * dk); }
  },
  foodThink(g, t, info) {        // big face, thought clouds of food popping one after another
    bgKind(g, t, info.bg || 'room');
    const r = lerp(270, 295, K(info, t)), cx = E.W * 0.3, cy = E.H * 0.66;
    bigFace(g, cx, cy, r, { outfit: who(info.who || 'hero'), face: fc(info.face || { eyes: 'ball', brows: 'raised', mouth: 'smallFlat', lid: 0.2, bags: 0.5 }), look: [0.8, -0.6], rimColor: '#ffd09a', rimSide: 1, blink: blinkAt(t) });
    const foods = info.foods || ['burger', 'pizza', 'cake', 'drumstick'], spots = [[E.W * 0.58, E.H * 0.3], [E.W * 0.8, E.H * 0.42], [E.W * 0.66, E.H * 0.68], [E.W * 0.86, E.H * 0.16]];
    foods.forEach((f, i) => { const [x, y] = spots[i % spots.length], bob = Math.sin(t * 2 + i) * 10; thought(g, t, x, y + bob, 150, 0.15 + i * (info.gap ?? 0.45), (g) => icon(g, f, 0, 0, 1.1, GOLD(), t), { tx: -150, ty: 120 }); });
  },
  dreamFood(g, t, info) {        // asleep in bed, a dream bubble: food on a table
    const cam = camLerp(camAt(BX + 300, MT - 160, 1.5), camAt(BX + 320, MT - 190, 1.58), K(info, t)), { M } = bedroom(g, t, cam, { clockH: 3 });
    layer(g, cam, 1, (g) => { lyingHero(g, M, { face: { eyes: 'closed', brows: null, mouth: 'smallSmile' }, collar: info.collar });
      thought(g, t, HEAD.x + 330, HEAD.y - 260, 170, 0.2, (g) => { icon(g, 'plate', 0, 30, 1.3, GOLD(), t); icon(g, info.food || 'drumstick', -30, 0, 0.75, GOLD(), t); icon(g, 'bread', 60, -6, 0.5, GOLD(), t); }, { tx: -200, ty: 160 }); });
    moonlight(g, t, cam);
  },
  phoneFood(g, t, info) {        // a phone in his hand: a recipe feed scrolling, or a video of someone eating
    bgKind(g, t, info.bg || 'room');
    const cx = E.W / 2 + Math.sin(t * 1.3) * 6, cy = E.H * 0.53 + Math.sin(t * 1.7) * 5, w = 560, h = 960, a = pop(t, 0, 0.35);
    g.save(); zoom(g, a * lerp(1, 1.04, K(info, t)), cx, cy); glow(g, cx, cy, 700, '#9fd8ff', 0.18);
    rr(g, cx - w / 2 - 20, cy - h / 2 - 20, w + 40, h + 40, 60); g.fillStyle = '#0c0e14'; g.fill(); rr(g, cx - w / 2, cy - h / 2, w, h, 44); g.fillStyle = '#f4f1ea'; g.fill();
    g.save(); rr(g, cx - w / 2, cy - h / 2, w, h, 44); g.clip();
    if (info.mode === 'video') { g.fillStyle = '#1a1a22'; g.fillRect(cx - w / 2, cy - h / 2, w, h); icon(g, 'plate', cx, cy + 120, 2.4, GOLD(), t); icon(g, 'burger', cx, cy + 60, 1.6, GOLD(), t);
      const bite = (t * 0.8) % 1; drawFaceAt(g, cx, cy - 210, 140, { front: true, override: { eyes: 'happy', brows: null, mouth: bite < 0.5 ? 'o' : 'smile' } }); ring(g, cx, cy - 210, 140, 0, '#000');
      label(g, L('▶ 1,2 млн', '▶ 1,2 M'), cx - w / 2 + 40, cy + h / 2 - 60, { size: 30, align: 'left', color: '#ffffff' }); }
    else { const sc = (t * 260) % 340; label(g, L('РЕЦЕПТЫ', 'RECETAS'), cx, cy - h / 2 + 70, { size: 40, color: '#1a1622' });
      for (let i = -1; i < 4; i++) { const y = cy - h / 2 + 140 + i * 340 - sc; rr(g, cx - w / 2 + 30, y, w - 60, 300, 24); g.fillStyle = '#ffffff'; g.fill(); icon(g, ['cake', 'pizza', 'burger', 'drumstick', 'bread'][(i + 5 + Math.floor((t * 260) / 340)) % 5], cx, y + 120, 1.3, GOLD(), t); rr(g, cx - w / 2 + 60, y + 230, 300, 22, 10); g.fillStyle = '#d8d4cc'; g.fill(); } }
    g.restore(); g.restore();
  },
  // ======== Minnesota 1944 ========
  stadium(g, t, info) {
    const cut = ease.inOut(prog(t, info.cutAt ?? 99, (info.cutAt ?? 99) + 0.9)), cam = camLerp(camAt(960, 540, info.z0 ?? 1.0), camAt(960, info.cutAt != null ? 640 : 520, info.z1 ?? 1.12), K(info, t));
    stadium(g, t, cam, { cut });
    if (cut > 0.6) layer(g, cam, 0.8, (g) => { for (let i = 0; i < 4; i++) drawFigure(g, { x: 420 + i * 340, y: GY - 2, s: 0.95, facing: i % 2 ? -1 : 1, outfit: VOL, pose: breathe(i % 2 ? POSES.sit : POSES.relaxed, t, 0.7, i), face: F.tired, rim: { color: '#ffe2a0', dir: [0, -1] } }); });
    sepia(g, 0.28); placeTag(g, t, info.tag);
  },
  scientist(g, t, info) {        // a scientist at a chalkboard; lines of chalk appear on cue
    const cam = camLerp(camAt(980, 560, 1.12), camAt(1000, 560, 1.2), K(info, t));
    g.fillStyle = '#4a3e30'; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    layer(g, cam, 1, (g) => {
      g.fillStyle = linGrad(g, 0, 0, 0, GY, ['#3a2e22', '#5a4a38']); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H); g.fillStyle = '#2a2018'; g.fillRect(-E.W, GY, E.W * 3, E.H);
      rr(g, 780, 180, 980, 540, 10); g.fillStyle = '#6a4a2a'; g.fill(); rr(g, 800, 200, 940, 500, 6); g.fillStyle = '#1e3a2e'; g.fill();
      (info.lines || []).forEach(([at, s], i) => { const a = fin(t, at, 0.4); if (a > 0) text(g, s, 850, 280 + i * 110, { size: 64, font: FONTS.ui, weight: 800, color: alpha('#f2f0e8', 0.92 * a), align: 'left' }); });
      drawFigure(g, { x: 560, y: GY, s: HS, facing: 1, outfit: who(info.who || 'ancel'), prop: 'pointer', pose: breathe(posesAt(t, [[0, POSES.relaxed], [info.pointAt ?? 0.3, POSES.point]], 0.3), t, 0.7), face: fc('talk'), look: [0.8, -0.2], rim: { color: '#ffe2a0', dir: [-1, -0.4] } });
    });
    if (info.sepia !== false) sepia(g, 0.25); placeTag(g, t, info.tag);
  },
  volunteers(g, t, info) {       // a grid of 36 young men popping in; thin 0..1 makes them gaunt and grey
    bgKind(g, t, info.bg || 'paper');
    const n = info.n || 36, cols = info.cols || 12, rows = Math.ceil(n / cols), thin = info.thinKeys ? key(t, info.thinKeys) : info.thin || 0, z = lerp(1, 1.05, K(info, t));
    g.save(); zoom(g, z);
    for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols), x = E.W / 2 + (c - (cols - 1) / 2) * 140, y = E.H * 0.44 + (r - (rows - 1) / 2) * 230 + 110, a = pop(t, (info.at ?? 0.1) + i * (info.gap ?? 0.03), 0.3); if (a <= 0) continue;
      const of = { ...VOL, color: mix(VOL.color, '#6a6a66', thin) }, pose = { ...POSES.stand, head: [3, -208 + thin * 6], sh: [0, -174 + thin * 4] };
      drawFigure(g, { x, y, s: 0.92 * a, facing: 1, outfit: of, pose: breathe(pose, t, 0.6, i), face: thin > 0.5 ? F.tired : F.talk, look: [0, 0], shadow: true, rim: { color: '#ffe2a0', dir: [0.4, -1] }, alpha: info.hi != null && info.hi !== i ? 0.5 : 1 }); }
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 100, fin(t, info.capAt ?? 0.3), 58);
    if (info.sepia !== false) sepia(g, 0.22); placeTag(g, t, info.tag);
  },
  halfPlate(g, t, info) {        // top-down: a full plate; on `cutAt` half of it slides away — "½"
    bgKind(g, t, 'paper');
    const cx = E.W / 2, cy = E.H * 0.52, k = ease.inOut(prog(t, info.cutAt ?? 0.6, (info.cutAt ?? 0.6) + 0.6)), z = lerp(1, 1.05, K(info, t));
    g.save(); zoom(g, z, cx, cy);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(cx + 16, cy + 22, 360, 360, 0, 0, Math.PI * 2); g.fill(); circle(g, cx, cy, 360, '#eef0f2'); ring(g, cx, cy, 270, 6, '#c8ccd2');
    const items = [[cx - 120, cy - 80, 'drumstick'], [cx + 120, cy - 90, 'bread'], [cx - 110, cy + 110, 'apple'], [cx + 120, cy + 110, 'cake']];
    items.forEach(([x, y, n], i) => { const gone = i % 2 === 1, dx = gone ? k * 900 : 0; g.save(); g.globalAlpha *= gone ? 1 - k : 1; icon(g, n, x + dx, y, 1.1, GOLD(), t); g.restore(); });
    if (k > 0) seg(g, [[cx, cy - 330], [cx, cy + 330]], 6, alpha('#1a1622', 0.5 * k));
    g.restore();
    const a = fin(t, (info.cutAt ?? 0.6) + 0.5); text(g, '½', E.W * 0.82, E.H * 0.45, { size: 220, font: FONTS.ui, weight: 900, color: GOLD(), alpha: a, glow: 30, glowColor: alpha(GOLD(), 0.5) });
    if (info.caption) label(g, info.caption, E.W * 0.82, E.H * 0.62, { size: 40, a });
    sepia(g, 0.2);
  },
  march(g, t, info) {            // men walking in single file down a country road
    const cam = camAt(1000 + t * 60, 640, 1.25), { rim } = street(g, t, cam, { dusk: info.dusk });
    layer(g, cam, 1, (g) => { for (let i = 0; i < 4; i++) { const x = 700 + i * 200 + t * 120; drawFigure(g, { x, y: GY - 80, s: HS * 0.95, facing: 1, outfit: VOL, pose: walkPose(t * Math.PI * 2 * 0.75 + i * 0.7), face: F.tired, look: [0, 0.2], rim: { color: rim, dir: [-0.6, -0.8] } }); } });
    sepia(g, 0.3); if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, 0.3), 56);
    placeTag(g, t, info.tag);
  },
  ecg(g, t, info) {              // a heart monitor: bpm counts bpm0→bpm1; mode 'slow' | 'irregular' | 'flat'
    bgKind(g, t, info.bg || 'dark');
    const mode = info.mode || 'slow', x0 = 160, x1 = E.W - 160, y = E.H * 0.5, bpm = Math.round(lerp(info.bpm0 ?? 70, info.bpm1 ?? 45, ease.inOut(prog(t, 0.2, info.dur - 0.3))));
    rr(g, x0 - 40, y - 300, x1 - x0 + 80, 560, 30); g.fillStyle = 'rgba(4,10,8,.92)'; g.fill(); g.strokeStyle = alpha(GREEN, 0.4); g.lineWidth = 4; g.stroke();
    const per = 60 / Math.max(20, bpm), speed = 520, head = (t * speed) % (x1 - x0), r = rng(9);
    g.strokeStyle = mode === 'irregular' ? '#ffb05a' : GREEN; g.lineWidth = 6; g.beginPath();
    for (let x = 0; x <= x1 - x0; x += 3) { const age = (head - x + (x1 - x0)) % (x1 - x0); if (age > (x1 - x0) * 0.85) { g.stroke(); g.beginPath(); continue; }
      const tt = (t - age / speed); let ph = (tt % per) / per; if (mode === 'irregular') ph = ((tt + 0.18 * Math.sin(Math.floor(tt / per) * 2.7)) % per) / per;
      const v = mode === 'flat' && tt > (info.flatAt ?? 1.5) ? 0 : ph > 0.4 && ph < 0.44 ? -1 : ph > 0.44 && ph < 0.48 ? 0.7 : ph > 0.6 && ph < 0.7 ? -0.15 : 0;
      g.lineTo(x0 + x, y + 40 + v * 180); }
    g.stroke();
    icon(g, 'heart', x1 - 160, y - 200, 0.6 * (1 + 0.15 * Math.max(0, Math.sin(t * Math.PI * 2 / per)) ** 8), RED, t);
    text(g, `${bpm}`, x1 - 300, y - 200, { size: 96, font: FONTS.ui, weight: 900, color: mode === 'irregular' ? '#ffb05a' : GREEN, align: 'right' });
    label(g, L('УД/МИН', 'LPM'), x1 - 280, y - 140, { size: 30, align: 'left', color: alpha(CREAM(), 0.7) });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, E.H * 0.9, fin(t, info.capAt ?? 0.4), 52, mode === 'irregular' ? '#ffb05a' : GREEN);
  },
  obsess(g, t, info) {           // the volunteers' obsession: cookbook | gum | lunch | talk | chef
    const mode = info.mode || 'cookbook', cam = camLerp(camAt(980, 620, 1.5), camAt(990, 610, 1.6), K(info, t)), { rim, rimDir } = office(g, t, cam);
    layer(g, cam, 1, (g) => {
      if (mode === 'cookbook') { FX.chair(g, 900, GY, HS * 1.03, '#2a1a12'); const READ = { ...POSES.sit, head: [14, -176], eF: [30, -128], hF: [52, -140], eB: [24, -126], hB: [46, -138] };
        drawFigure(g, { x: 920, y: GY, s: HS, facing: 1, outfit: VOL, pose: breathe(READ, t, 0.5), face: { eyes: 'ball', brows: 'raised', mouth: 'smallFlat', eyeSize: 1.15 }, look: [0.7, 0.5], rim: { color: rim, dir: rimDir } });
        g.save(); g.translate(920 + 60 * HS, GY - 150 * HS); g.rotate(-0.25); rr(g, -50, -60, 100, 110, 6); g.fillStyle = '#c0503a'; g.fill(); g.restore();
        thought(g, t, 1300, 330, 140, 0.5, (g) => icon(g, 'cake', 0, 0, 1.1, GOLD(), t), { tx: -170, ty: 110 }); }
      if (mode === 'gum') { const CHEW = { ...POSES.stand, eF: [24, -150], hF: [30, -192] }; drawFigure(g, { x: 920, y: GY, s: HS, facing: 1, outfit: VOL, pose: breathe(posesAt(t, [[0, POSES.stand], [0.4, CHEW], [0.8, POSES.stand], [1.6, CHEW], [2.0, POSES.stand]], 0.25), t, 0.6), face: { eyes: 'ball', brows: null, mouth: (t * 5) % 1 < 0.5 ? 'flat' : 'smallFlat', lid: 0.3 }, look: [0.4, 0], rim: { color: rim, dir: rimDir } });
        for (let i = 0; i < Math.min(9, 2 + Math.floor(t * 3)); i++) { g.save(); g.translate(1200 + (i % 3) * 60, GY - 172 - Math.floor(i / 3) * 22); icon(g, 'gum', 0, 0, 0.4, GOLD(), t); g.restore(); } }
      if (mode === 'lunch') { FX.chair(g, 900, GY, HS * 1.03, '#2a1a12'); const SPOON = { ...POSES.sit, head: [14, -176], eF: [30, -128], hF: [lerp(44, 22, (Math.sin(t * 1.2) + 1) / 2), lerp(-130, -170, (Math.sin(t * 1.2) + 1) / 2)] };
        drawFigure(g, { x: 920, y: GY, s: HS, facing: 1, outfit: VOL, pose: breathe(SPOON, t, 0.5), face: { eyes: 'ball', brows: null, mouth: 'smallFlat', lid: 0.45 }, look: [0.6, 0.6], rim: { color: rim, dir: rimDir } });
        g.save(); g.translate(1090, GY - 160); icon(g, 'plate', 0, 0, 0.7, GOLD(), t); g.restore();
        FX.clock(g, 1500, 330, 90, t * 12, {}); label(g, '2 ЧАСА', 1500, 460, { size: 44, color: GOLD(), a: fin(t, 0.6) }); }
      if (mode === 'talk') { for (const [x, f, i] of [[760, 1, 0], [1180, -1, 1]]) drawFigure(g, { x, y: GY, s: HS, facing: f, outfit: { ...VOL, color: i ? '#8a8a6a' : VOL.color }, pose: breathe(posesAt(t + i * 0.5, [[0, POSES.talk], [0.6, POSES.explain], [1.2, POSES.talk]], 0.3), t, 0.6, i), face: F.talk, talk: Math.abs(Math.sin(t * 9 + i * 2)), look: [0.6, -0.1], rim: { color: rim, dir: rimDir } });
        thought(g, t, 760, 280, 110, 0.2, (g) => icon(g, 'burger', 0, 0, 0.8, GOLD(), t), { tx: -40, ty: 120 }); thought(g, t, 1200, 250, 110, 0.7, (g) => icon(g, 'pizza', 0, 0, 0.8, GOLD(), t), { tx: 40, ty: 120 }); }
      if (mode === 'chef') { drawFigure(g, { x: 960, y: GY, s: HS, facing: 1, outfit: { top: 'tshirt', color: '#f4f2ee', head: 'none' }, pose: breathe(posesAt(t, [[0, POSES.relaxed], [0.5, POSES.cheer]], 0.3), t, 0.7), face: F.smile, look: [0.3, -0.2], rim: { color: rim, dir: rimDir } });
        const hx = 960 + 3 * HS, hy = GY - 208 * HS - 26 * HS; rr(g, hx - 44, hy - 30, 88, 36, 6); g.fillStyle = '#ffffff'; g.fill(); for (const dx of [-30, 0, 30]) circle(g, hx + dx, hy - 50, 32, '#ffffff'); }
    });
    sepia(g, 0.22); if (info.caption) glowLabel(g, info.caption, E.W / 2, 100, fin(t, info.capAt ?? 0.3), 54);
  },
  eatTable(g, t, info) {         // food comes back: a man at a table, empty plates stack higher and higher — still hungry
    const cam = camLerp(camAt(980, 620, 1.5), camAt(990, 600, 1.62), K(info, t)), { rim, rimDir } = office(g, t, cam);
    layer(g, cam, 1, (g) => {
      FX.chair(g, 820, GY, HS * 1.03, '#2a1a12');
      const EAT = { ...POSES.sit, head: [16, -174], eF: [32, -126], hF: [lerp(46, 22, (Math.sin(t * 7) + 1) / 2), lerp(-118, -168, (Math.sin(t * 7) + 1) / 2)] };
      drawFigure(g, { x: 840, y: GY, s: HS, facing: 1, outfit: who(info.who || 'vol'), pose: EAT, face: { eyes: 'ball', brows: 'worried', mouth: (t * 7) % 1 < 0.5 ? 'o' : 'flat', eyeSize: 1.1 }, look: [0.7, 0.4], rim: { color: rim, dir: rimDir } });
      const mx = info.stack ?? 12, n = Math.min(mx, Math.floor(prog(t, 0.2, info.dur * 0.85) * mx)); for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#e6e8ec' : '#d4d8de'; g.beginPath(); g.ellipse(1090, GY - 160 - i * 16, 80, 16, 0, 0, Math.PI * 2); g.fill(); }
      g.save(); g.translate(1090, GY - 180 - n * 16); icon(g, 'drumstick', 0, 0, 0.6, GOLD(), t); g.restore();
    });
    if (info.word !== false) bubble(g, t, E.W * 0.38, E.H * 0.18, info.word || 'ЕЩЁ!', info.wordAt ?? 1.0, { size: 56, tail: 40 });
    if (info.sepia !== false) sepia(g, 0.2);
  },
  headHunger(g, t, info) {       // blueprint head: stomach full, but a fork-and-plate signal still flashes in the brain
    bgKind(g, t, 'blueprint');
    const cx = E.W * 0.45, base = E.H * 0.98, z = lerp(1, 1.06, K(info, t)); g.save(); zoom(g, z);
    UI.lineFigure(g, { x: cx, y: base, s: 3.8, color: alpha(BP(), 0.8) });
    const sx = cx, sy = base - 3.8 * 130; g.fillStyle = alpha(GREEN, 0.5); g.beginPath(); g.ellipse(sx + 10, sy, 70, 56, 0.2, 0, Math.PI * 2); g.fill(); label(g, 'СЫТ', sx + 260, sy, { size: 44, color: GREEN, a: fin(t, 0.3) });
    const hy = base - 3.8 * 208, pulse = 0.5 + 0.5 * Math.sin(t * 6); glow(g, cx + 10, hy, 160, RED, 0.3 + 0.3 * pulse); icon(g, 'fork', cx + 10, hy, 0.7, RED, t);
    label(g, 'ГОЛОДЕН', cx + 330, hy, { size: 52, color: RED, a: fin(t, 0.8), glow: 18, glowColor: alpha(RED, 0.5) });
    g.restore(); if (info.caption) glowLabel(g, info.caption, E.W / 2, E.H * 0.92, fin(t, info.capAt ?? 1.2), 50);
  },
  // ======== two-three weeks ========
  stairs(g, t, info) {           // climbing stairs: slower and slower, a stop to catch his breath
    const ra = info.restAt ?? info.dur * 0.6, prg = Math.min(t, ra) * 0.5 - 0.06 * Math.min(t, ra) ** 2 * 0.5, hx = 700 + prg * 260, slope = 0.62, hy = GY - Math.max(0, hx - 620) * slope;
    const cam = camAt(hx + 140, hy - 260, 1.55);
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#3a3448', '#5a5068']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    layer(g, cam, 1, (g) => {
      g.fillStyle = '#4a4258'; g.fillRect(-E.W, -E.H * 2, E.W * 4, E.H * 4);
      g.fillStyle = '#2a2436'; g.beginPath(); g.moveTo(400, GY + 300); g.lineTo(400, GY); for (let i = 0; i < 18; i++) { const x = 620 + i * 90; g.lineTo(x, GY - i * 90 * slope); g.lineTo(x + 90, GY - i * 90 * slope); } g.lineTo(2400, GY + 300); g.closePath(); g.fill();
      seg(g, [[560, GY - 240], [2300, GY - 240 - (2300 - 560) * slope]], 8, '#8a7a9a'); for (let i = 0; i < 18; i++) { const x = 650 + i * 90; seg(g, [[x, GY - (x - 620) * slope], [x, GY - 240 - (x - 560) * slope]], 4, '#6a5a7a'); }
      const resting = t > ra, pose = resting ? breathe(BENT, t, 1.5) : walkPose(prg * 6);
      drawFigure(g, { x: hx, y: hy, s: HS, facing: 1, outfit: HERO, pose, rot: resting ? 0 : -0.05, face: { eyes: 'ball', brows: 'worried', mouth: resting ? 'oBig' : 'wavy', lid: 0.45, bags: 0.8 }, look: [0.5, resting ? 0.7 : -0.2], rim: { color: '#ffd09a', dir: [-0.6, -0.8] }, shadow: false });
      if (resting) for (let i = 0; i < 2; i++) { const u = ((t * 0.9 + i / 2) % 1); circle(g, hx + 90 + u * 60, hy - 270 - u * 40, 10 + u * 20, alpha('#ffffff', 0.3 * (1 - u))); }
    });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 100, fin(t, ra), 56);
  },
  switchOff(g, t, info) {        // a row of light bulbs labelled with body functions switch off one by one
    bgKind(g, t, info.bg || 'dark');
    const items = info.items || [['ТЕПЛО', 0.3], ['ВОЛОСЫ', 0.7], ['КОЖА', 1.1], ['ИММУНИТЕТ', 1.5]], n = items.length, gap = Math.min(400, E.W * 0.8 / n);
    items.forEach(([name, at], i) => { const x = E.W / 2 + (i - (n - 1) / 2) * gap, y = E.H * 0.42, off = t > at, fl = off && t < at + 0.15 ? (Math.sin(t * 90) > 0 ? 1 : 0) : off ? 0 : 1;
      seg(g, [[x, 0], [x, y - 110]], 4, '#3a3a48'); if (fl) glow(g, x, y - 20, 260, '#ffd88a', 0.45); icon(g, 'bulb', x, y, 1.6, fl ? '#ffe6a0' : '#2a2a34', t);
      label(g, name, x, y + 180, { size: 40, color: fl ? GOLD() : alpha(CREAM(), 0.5) }); });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, E.H * 0.9, fin(t, info.capAt ?? 0.2), 52);
  },
  gandhi(g, t, info) {           // a thin old man in white sitting on a mat, round glasses; tag
    const cam = camLerp(camAt(960, 620, 1.5), camAt(970, 610, 1.6), K(info, t));
    g.fillStyle = '#c8a878'; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    layer(g, cam, 1, (g) => {
      g.fillStyle = linGrad(g, 0, 0, 0, GY, ['#8a6a4a', '#c8a070']); g.fillRect(-E.W, -E.H, E.W * 3, GY + E.H); g.fillStyle = '#6a4a2e'; g.fillRect(-E.W, GY, E.W * 3, E.H);
      FX.windowFrame(g, { x: 1240, y: 240, w: 300, h: 340, cols: 2, rows: 2, frame: '#4a3020', bar: 10 }, (g, x, y, w, h) => { g.fillStyle = linGrad(g, 0, y, 0, y + h, ['#f4d8a0', '#f8e8c8']); g.fillRect(x, y, w, h); });
      rr(g, 700, GY - 14, 440, 18, 6); g.fillStyle = '#a84a2a'; g.fill();
      const SIT = { ...POSES.sit, head: [8, -170], sh: [2, -140], hip: [0, -60], kF: [50, -50], fF: [20, -6], kB: [44, -48], fB: [10, -6], eF: [24, -100], hF: [44, -70], eB: [18, -98], hB: [40, -68] };
      drawFigure(g, { x: 900, y: GY - 12, s: HS, facing: 1, outfit: GANDHI, pose: breathe(SIT, t, 0.4), face: { eyes: 'ball', brows: null, mouth: 'smallFlat', lid: 0.5 }, look: [0.4, 0.2], rim: { color: '#fff1d0', dir: [1, -0.5] }, shadow: false });
    });
    sepia(g, 0.3); placeTag(g, t, info.tag || 'ИНДИЯ · 1943');
    if (info.caption) glowLabel(g, info.caption, E.W * 0.68, E.H * 0.5, fin(t, info.capAt ?? 0.6), 80);
  },
  // ======== Leningrad ========
  leningradStreet(g, t, info) {  // a figure pulling a sled through the snow, slowly
    const hx = 760 + t * 70, cam = camAt(hx + 100, 600, 1.3), { rim } = leningrad(g, t, cam);
    layer(g, cam, 1, (g) => {
      const p = walkPose(t * Math.PI * 2 * 0.45), pose = { ...p, head: [p.head[0] + 12, p.head[1] + 10], sh: [p.sh[0] + 8, p.sh[1] + 6], eB: [-24, -150], hB: [-50, -120] };
      drawFigure(g, { x: hx, y: GY - 70, s: HS, facing: 1, outfit: { top: 'trench', color: '#3a3a46', head: 'beanie', headColor: '#5a4a4a' }, pose, face: F.tired, look: [0, 0.4], rim: { color: rim, dir: [0.4, -1] } });
      const sx = hx - 260, sy = GY - 80; seg(g, [[hx - 50 * HS, GY - 120 * HS], [sx + 90, sy - 20]], 3, '#2a2a30'); rr(g, sx - 90, sy - 30, 180, 20, 6); g.fillStyle = '#5a3a24'; g.fill(); rr(g, sx - 40, sy - 100, 80, 70, 8); g.fillStyle = '#6a6a74'; g.fill();
    });
    cold(g, 0.3); placeTag(g, t, info.tag || 'ЛЕНИНГРАД · 1941');
  },
  ration(g, t, info) {           // 125 g of bread on a kitchen scale; or the three thin slices
    bgKind(g, t, 'paper');
    const cx = E.W / 2, cy = E.H * 0.55, z = lerp(1, 1.06, K(info, t)), a = pop(t, 0.05, 0.4); g.save(); zoom(g, z * a, cx, cy);
    if (info.mode === 'slices') { for (let i = 0; i < 3; i++) { const s = pop(t, (info.at ?? 0.3) + i * 0.4, 0.35); if (s <= 0) continue; g.save(); g.translate(cx + (i - 1) * 380, cy); g.scale(s * 2.4, s * 2.4); icon(g, 'breadThin', 0, 0, 1, GOLD(), t); g.restore(); }
      label(g, info.text || 'ТРИ ТОНКИХ КУСОЧКА', cx, cy + 260, { size: 52, a: fin(t, (info.at ?? 0.3) + 1.2) }); }
    else { rr(g, cx - 300, cy + 80, 600, 150, 30); g.fillStyle = '#5a6a6a'; g.fill(); rr(g, cx - 340, cy + 40, 680, 50, 20); g.fillStyle = '#8a9a9a'; g.fill(); rr(g, cx - 120, cy + 120, 240, 80, 10); g.fillStyle = '#0c1410'; g.fill();
      const v = Math.round(lerp(0, 125, ease.out(prog(t, info.at ?? 0.4, (info.at ?? 0.4) + 1.0)))); text(g, `${v} г`, cx, cy + 162, { size: 60, font: FONTS.ui, weight: 900, color: '#8affb0' });
      g.save(); g.translate(cx, cy - 30); g.scale(1.9, 1.9); icon(g, 'breadThin', 0, 0, 1, GOLD(), t); g.restore(); }
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 58);
  },
  candles(g, t, info) {          // memorial: rows of candles lighting up one after another
    g.fillStyle = '#060508'; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    const n = info.n || 48, cols = 12, z = lerp(1, 1.06, K(info, t)); g.save(); zoom(g, z);
    for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols), x = 220 + c * 135 + (r % 2) * 40, y = 420 + r * 150, s = 1 - r * 0.08, lit = t > 0.1 + i * (info.gap ?? 0.04);
      rr(g, x - 14 * s, y - 60 * s, 28 * s, 70 * s, 6); g.fillStyle = '#e8e0cc'; g.fill(); if (lit) { const fl = 0.8 + 0.2 * Math.sin(t * 13 + i); glow(g, x, y - 76 * s, 70 * s, '#ffb050', 0.5 * fl); g.fillStyle = '#ffd27a'; g.beginPath(); g.ellipse(x, y - 76 * s, 8 * s, 18 * s * fl, 0, 0, Math.PI * 2); g.fill(); } }
    g.restore();
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 160, fin(t, info.capAt ?? 0.4), 60, '#ffd8a0');
  },
  diary(g, t, info) {            // a small notebook; handwritten lines appear one by one
    bgKind(g, t, 'paper');
    const cx = E.W / 2, cy = E.H * 0.52, z = lerp(1, 1.08, K(info, t)); g.save(); zoom(g, z, cx, cy);
    g.save(); g.translate(cx, cy); g.rotate(-0.03);
    rr(g, -430, -330, 860, 660, 14); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); rr(g, -420, -340, 840, 660, 10); g.fillStyle = '#efe6cf'; g.fill();
    seg(g, [[0, -340], [0, 320]], 4, alpha('#8a7a5a', 0.6)); for (let y = -260; y < 300; y += 70) { seg(g, [[-390, y], [-30, y]], 2, alpha('#9ab0c8', 0.5)); seg(g, [[30, y], [390, y]], 2, alpha('#9ab0c8', 0.5)); }
    (info.lines || []).forEach(([at, s], i) => { const a = fin(t, at, 0.5); if (a <= 0) return; const L = Math.floor(s.length * a); text(g, s.slice(0, L), info.right ? 26 : -390, -230 + i * 140, { size: 36, font: FONTS.serif, weight: 700, italic: true, color: '#2a2a5a', align: 'left' }); });
    g.restore(); g.restore();
    placeTag(g, t, info.tag);
  },
  // ======== myths ========
  myth(g, t, info) {             // "МИФ №n": the claim in quotes; a verdict stamp lands on `verdictAt`
    bgKind(g, t, info.bg || 'dark');
    const a = pop(t, 0.05, 0.4), cx = E.W / 2, cy = E.H * 0.48; g.save(); zoom(g, a * lerp(1, 1.04, K(info, t)), cx, cy);
    rr(g, cx - 720, cy - 300, 1440, 600, 30); g.fillStyle = 'rgba(12,14,30,.92)'; g.fill(); g.strokeStyle = GOLD(); g.lineWidth = 6; g.stroke();
    label(g, info.n ? L(`МИФ №${info.n}`, `MITO #${info.n}`) : L('МИФ', 'MITO'), cx, cy - 210, { size: 52, color: GOLD(), spacing: 8 });
    (Array.isArray(info.text) ? info.text : [info.text || '']).forEach((ln, i, arr) => text(g, ln, cx, cy - 30 + (i - (arr.length - 1) / 2) * 110, { size: 84, font: FONTS.title, weight: 700, color: '#ffffff' }));
    g.restore();
    const va = info.verdictAt ?? 1.2, k = ease.outBack(prog(t, va, va + 0.25)); if (k > 0 && info.verdict) { const col = info.verdictColor || RED; g.save(); g.translate(cx + 420, cy + 220); g.rotate(-0.14); g.scale(1 + (1 - k) * 1.6, 1 + (1 - k) * 1.6); g.globalAlpha *= clamp(k * 2);
      const w = measure(g, info.verdict, 110, FONTS.ui, 900) + 80; rr(g, -w / 2, -80, w, 160, 18); g.strokeStyle = col; g.lineWidth = 12; g.stroke(); text(g, info.verdict, 0, 4, { size: 110, font: FONTS.ui, weight: 900, color: col }); g.restore(); }
  },
  // ======== animals ========
  penguin(g, t, info) {          // emperor penguins in the polar night, one with an egg on its feet
    const cam = camLerp(camAt(960, 600, info.z0 ?? 1.2), camAt(980, 620, info.z1 ?? 1.4), K(info, t));
    antarctic(g, t, cam);
    layer(g, cam, 1, (g) => { const many = info.mode === 'huddle'; if (many) for (let i = 0; i < 9; i++) penguin(g, 560 + (i % 5) * 200 + (i > 4 ? 100 : 0), GY + (i > 4 ? 40 : 0), 1.0, { t, ph: i, egg: i === 6 });
      else penguin(g, 960, GY + 10, 1.5, { t, egg: true }); });
    blizzard(g, t, info.storm ?? 1); cold(g, 0.2);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.4), 60, '#cfe8ff');
    placeTag(g, t, info.tag);
  },
  bearDen(g, t, info) {          // a bear asleep in its den under the snow; spring melts it and he wakes
    const sp = info.spring ? ease.inOut(prog(t, info.springAt ?? 0.6, (info.springAt ?? 0.6) + 1.0)) : 0;
    const cam = camLerp(camAt(960, 560, 1.05), camAt(960, 600, 1.18), K(info, t)); den(g, t, cam, { spring: sp });
    layer(g, cam, 1, (g) => { bear(g, 900, 790, 1.2, { t, awake: sp > 0.7 });
      if (sp < 0.5) for (let i = 0; i < 3; i++) { const k = ((t * 0.6 + i / 3) % 1); text(g, 'z', 1150 + k * 120, 560 - k * 160, { size: 40 + k * 50, font: FONTS.title, weight: 700, color: '#eef3ff', alpha: (1 - k) * (1 - sp * 2) }); } });
    if (sp < 0.5) FX.snow(g, t, { count: 120, color: '#f2f6ff', speed: 40 });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 100, fin(t, info.capAt ?? 0.4), 56, sp > 0.5 ? GREEN : '#cfe8ff');
  },
  // ======== a month ========
  balance(g, t, info) {          // a balance scale of salts in the blood tipping over
    bgKind(g, t, 'blueprint');
    const tip = ease.inOut(prog(t, info.tipAt ?? 0.8, (info.tipAt ?? 0.8) + 0.8)) * 0.32 + Math.sin(t * 2) * 0.02, cx = E.W / 2, cy = E.H * 0.42;
    seg(g, [[cx, cy], [cx, E.H * 0.84]], 12, BP()); poly(g, [[cx - 160, E.H * 0.86], [cx + 160, E.H * 0.86], [cx, E.H * 0.8]], BP());
    const L = 460, ax = Math.cos(tip) * L, ay = Math.sin(tip) * L; seg(g, [[cx - ax, cy - ay], [cx + ax, cy + ay]], 12, GOLD()); circle(g, cx, cy, 20, GOLD());
    for (const [s, names, col] of [[-1, ['Na', 'K'], BP()], [1, ['Mg', 'P'], RED]]) { const px = cx + s * ax, py = cy + s * ay; seg(g, [[px, py], [px - 90, py + 160]], 3, BP()); seg(g, [[px, py], [px + 90, py + 160]], 3, BP());
      g.fillStyle = alpha(col, 0.25); g.beginPath(); g.ellipse(px, py + 165, 130, 30, 0, 0, Math.PI * 2); g.fill();
      names.forEach((n2, i) => { circle(g, px + (i - 0.5) * 90, py + 120, 38, col); text(g, n2, px + (i - 0.5) * 90, py + 122, { size: 34, font: FONTS.ui, weight: 900, color: '#0b1324' }); }); }
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 56);
  },
  twoCases(g, t, info) {         // the two cases from the hook, side by side
    bgKind(g, t, 'dark');
    const cards = [[E.W * 0.28, '18 ДНЕЙ', 'БЕЗ ЕДЫ И ВОДЫ', 'cell'], [E.W * 0.72, '382 ДНЯ', 'БЕЗ ЕДЫ', 'angus']];
    cards.forEach(([x, big, sub, kind], i) => { const a = pop(t, (info.at ?? 0.2) + i * 0.5, 0.4); if (a <= 0) return; g.save(); g.translate(x, E.H * 0.5); g.scale(a, a);
      rr(g, -330, -380, 660, 760, 30); g.fillStyle = 'rgba(14,16,32,.95)'; g.fill(); g.strokeStyle = i ? GOLD() : '#9ab0d0'; g.lineWidth = 6; g.stroke();
      if (kind === 'cell') { rr(g, -120, -300, 240, 330, 8); g.fillStyle = '#5a6066'; g.fill(); rr(g, -60, -240, 120, 50, 4); g.fillStyle = '#1a1c20'; g.fill(); for (let k = 1; k < 4; k++) seg(g, [[-60 + k * 30, -240], [-60 + k * 30, -190]], 5, '#8a9098'); }
      else fatMan(g, { x: 0, y: 30, s: 1.4, fat: 1, color: ANGUS.color, rim: GOLD(), t });
      text(g, big, 0, 150, { size: 110, font: FONTS.ui, weight: 900, color: i ? GOLD() : '#cfe0ff' }); label(g, sub, 0, 260, { size: 40 }); g.restore(); });
  },
  // ======== Austria 1979 ========
  arrest(g, t, info) {           // night street, police lights: a policeman leads the young man away
    const hx = 820 + t * 90, cam = camAt(hx + 120, 600, 1.4), { rim } = street(g, t, cam, { dusk: 1 });
    veil(g, '#04060e', 0.45);
    const blue = Math.sin(t * 12) > 0;
    layer(g, cam, 1, (g) => {
      rr(g, 1500, GY - 190, 460, 150, 30); g.fillStyle = '#e8ecf0'; g.fill(); rr(g, 1580, GY - 260, 260, 80, 20); g.fillStyle = '#c8d0d8'; g.fill(); rr(g, 1500, GY - 150, 460, 36, 6); g.fillStyle = '#2a7a3a'; g.fill(); for (const wx of [1590, 1870]) circle(g, wx, GY - 40, 40, '#1a1a1e');
      rr(g, 1680, GY - 290, 70, 30, 8); g.fillStyle = blue ? '#3a7aff' : '#1a2a5a'; g.fill(); if (blue) glow(g, 1715, GY - 280, 500, '#3a7aff', 0.5);
      const w = walkPose(t * Math.PI * 2 * 0.7), led = { ...w, eB: [-14, -140], hB: [-30, -118] };
      drawFigure(g, { x: hx, y: GY - 80, s: HS, facing: 1, outfit: ANDREAS, pose: led, face: F.fear, look: [-0.6, 0], rim: { color: blue ? '#6a9aff' : rim, dir: [1, -0.4] } });
      drawFigure(g, { x: hx - 130, y: GY - 80, s: HS, facing: 1, outfit: COP, pose: { ...walkPose(t * Math.PI * 2 * 0.7 + 1.5), eF: [40, -150], hF: [72, -146] }, face: { eyes: 'ball', brows: 'angry', mouth: 'flat' }, look: [0.5, 0], rim: { color: blue ? '#6a9aff' : rim, dir: [1, -0.4] } });
    });
    placeTag(g, t, info.tag || 'АВСТРИЯ · 1979');
  },
  cell(g, t, info) {             // the basement cell. mode: enter (door shuts on closeAt) | wait | lick | found | weak
    const mode = info.mode || 'wait', ca = info.closeAt ?? 0.8;
    const door = mode === 'enter' ? 1 - ease.inOut(prog(t, ca, ca + 0.35)) : mode === 'found' ? ease.out(prog(t, info.openAt ?? 0.4, (info.openAt ?? 0.4) + 0.6)) : 0;
    const tally = info.tally1 != null ? Math.round(lerp(info.tally0 || 0, info.tally1, prog(t, 0.2, info.dur * 0.85))) : info.tally0 || 0;
    const cam = camLerp(camAt(info.cx ?? 980, 600, info.z0 ?? 1.25), camAt((info.cx ?? 980) + 20, 590, info.z1 ?? 1.36), K(info, t)), { rim } = basement(g, t, cam, { doorOpen: door, tally, night: info.night, dark: mode === 'found' ? 0.2 : 0.38 });
    if (mode === 'enter' && t > ca && t < ca + 0.4) { const [sx, sy] = shake(t, 8, 30); g.translate(sx, sy); }
    layer(g, cam, 1, (g) => {
      const B = CELL.bench;
      if (mode === 'enter') drawFigure(g, { x: lerp(620, 900, ease.out(prog(t, 0, ca))), y: GY, s: HS, facing: t > ca + 0.2 ? -1 : 1, outfit: ANDREAS, pose: t < ca ? walkPose(t * 7) : breathe(POSES.stand, t, 0.6), face: t > ca ? F.fear : F.tired, look: [-0.8, 0], rim: { color: rim, dir: [0.5, -1] } });
      if (mode === 'wait') { const SITB = { ...POSES.sit, head: [16, -168], sh: [8, -142] }; drawFigure(g, { x: B.x + 180, y: GY, s: HS, facing: 1, outfit: ANDREAS, pose: breathe(SITB, t, 0.5), face: F.sad, look: [0.4, 0.4], rim: { color: rim, dir: [0.5, -1] } }); }
      if (mode === 'lick') { const D = CELL.damp, LEAN = { ...POSES.reach, head: [20, -202], eF: [30, -180], hF: [44, -200] }; drawFigure(g, { x: D.x - 70, y: GY, s: HS, facing: 1, outfit: ANDREAS, pose: breathe(LEAN, t, 0.4), face: { eyes: 'ball', brows: 'worried', mouth: 'o', lid: 0.5, bags: 0.8 }, look: [0.8, -0.2], rim: { color: rim, dir: [0.5, -1] } }); }
      if (mode === 'found' || mode === 'weak') {
        const lx = B.x + 60, ly = B.top; rr(g, lx + 40, ly - 30, 300, 40, 18); g.fillStyle = ANDREAS.color; g.fill(); circle(g, lx + 20, ly - 26, 40, '#e8f0ff'); circle(g, lx + 18, ly - 24, 38, '#0a0c16');
        g.save(); g.translate(lx + 18, ly - 24); g.rotate(-Math.PI / 2); drawFaceAt(g, 0, 0, 38, { override: { eyes: 'ball', brows: 'worried', mouth: 'flat', lid: 0.6, bags: 1 }, look: [0, 0.4] }); g.restore();
        seg(g, [[lx + 340, ly - 12], [lx + 470, ly - 8]], 14, '#0a0c16');
        if (mode === 'found') { const k = ease.out(prog(t, (info.openAt ?? 0.4) + 0.3, (info.openAt ?? 0.4) + 1.0)); for (let i = 0; i < 2; i++) drawFigure(g, { x: lerp(500 - i * 120, 700 + i * 210, k), y: GY, s: HS, facing: 1, outfit: COP, prop: i === 0 ? 'flashlight' : null, pose: breathe(i === 0 ? { ...POSES.point, eF: [34, -150], hF: [66, -150] } : POSES.handsOnHead, t, 0.6), face: F.shock, look: [0.8, 0.3], alpha: clamp(k * 3), rim: { color: '#ffe6b0', dir: [-1, -0.3] } }); }
      }
    });
    placeTag(g, t, info.tag);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 56);
  },
  cutaway(g, t, info) {          // the police station in section: officers upstairs, the forgotten man in the basement below
    const mode = info.mode || 'forget', cam = camLerp(camAt(980, 560, 1.18), camAt(990, 570, 1.26), K(info, t));
    g.fillStyle = '#16141c'; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    layer(g, cam, 1, (g) => {
      const mid = 520; rr(g, 160, 100, 1600, mid - 100, 6); g.fillStyle = '#d8c8a0'; g.fill(); glow(g, 960, 200, 700, '#fff1c0', 0.3);
      rr(g, 160, mid + 24, 1600, 440, 6); g.fillStyle = '#3a3e3a'; g.fill(); g.fillStyle = '#26282a'; g.fillRect(160, mid, 1600, 24);
      rr(g, 700, mid - 120, 360, 20, 4); g.fillStyle = '#6a4a2a'; g.fill(); g.fillStyle = '#4a3420'; g.fillRect(720, mid - 100, 16, 100); g.fillRect(1024, mid - 100, 16, 100);
      FX.clock(g, 1500, 230, 60, t * 40, {}); g.save(); g.translate(880, mid - 140); icon(g, 'coffee', 0, 0, 0.45, GOLD(), t); g.restore();
      const s = 1.25, up = mid;
      if (mode !== 'found') for (const [x, f, i] of [[560, 1, 0], [1260, -1, 1]]) drawFigure(g, { x, y: up, s, facing: f, outfit: COP, pose: breathe(posesAt(t + i, [[0, POSES.talk], [0.8, POSES.relaxed], [1.6, POSES.talk]], 0.3), t, 0.7, i), face: mode === 'smell' ? { eyes: 'ball', brows: 'worried', mouth: 'wavy' } : F.smile, talk: mode === 'forget' ? Math.abs(Math.sin(t * 8 + i)) : 0, look: [0.4, mode === 'smell' ? 0.6 : 0], rim: { color: '#fff1c0', dir: [0, -1] } });
      const by = mid + 24 + 440; rr(g, 1100, by - 70, 340, 16, 4); g.fillStyle = '#5a4a3a'; g.fill();
      drawFigure(g, { x: 1180, y: by, s, facing: 1, outfit: ANDREAS, pose: breathe({ ...POSES.sit, head: [16, -168], sh: [8, -142], hip: [0, -40] }, t, 0.5), face: F.sad, look: [0, -0.7], rim: { color: '#9ab0d0', dir: [0, -1] } });
      if (mode === 'smell') for (let i = 0; i < 3; i++) { g.strokeStyle = alpha('#9ad06a', 0.6); g.lineWidth = 6; g.beginPath(); for (let y = 0; y <= 260; y += 10) g.lineTo(1000 + i * 80 + Math.sin(y * 0.05 + t * 4 + i) * 16, mid + 260 - y - ((t * 60) % 40)); g.stroke(); }
      if (mode === 'found') { const k = ease.inOut(prog(t, 0.2, 1.2)); drawFigure(g, { x: lerp(560, 700, k), y: lerp(up, by, k), s, facing: 1, outfit: COP, prop: 'flashlight', pose: walkPose(t * 6), face: F.shock, look: [0.6, 0.3], rim: { color: '#fff1c0', dir: [0, -1] } }); }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(160, mid + 24, 1600, 440);
    });
    if (info.label) bubble(g, t, E.W * 0.3, E.H * 0.13, info.label, info.labelAt ?? 0.3, { size: 44, tail: 60 });
  },
  recordBook(g, t, info) {       // a golden record book: mode book | court (gavel) | warn (НЕ ПОВТОРЯТЬ)
    bgKind(g, t, info.bg || 'dark');
    const mode = info.mode || 'book', cx = E.W / 2, cy = E.H * 0.52;
    if (mode === 'court') { const hit = (info.hits || [0.5, 1.0]).some((h) => t > h && t < h + 0.12); g.save(); g.translate(cx - 200, cy + 40); g.rotate(hit ? 0.2 : -0.35); g.scale(3, 3); glow(g, 0, 0, 120, '#ffcf8a', 0.25); icon(g, 'gavel', 0, 0, 1, '#c8884a', t); g.restore(); rr(g, cx - 330, cy + 230, 300, 40, 10); g.fillStyle = '#8a5a32'; g.fill(); if (hit) FX.rings(g, cx - 160, cy + 200, t % 0.12, { count: 2, r0: 40, r1: 260, color: '#ffffff', a: 0.5 });
      glowLabel(g, info.text || 'КОМПЕНСАЦИЯ', cx + 300, cy, fin(t, info.textAt ?? 0.6), 80); return; }
    if (mode === 'warn') { const k = ease.outBack(prog(t, info.at ?? 0.3, (info.at ?? 0.3) + 0.3)); g.save(); g.translate(cx, cy); g.rotate(-0.08); g.scale(k, k); rr(g, -620, -150, 1240, 300, 30); g.strokeStyle = RED; g.lineWidth = 16; g.stroke(); text(g, info.text || 'НЕ ПОВТОРЯТЬ', 0, 6, { size: 150, font: FONTS.ui, weight: 900, color: RED, glow: 30, glowColor: alpha(RED, 0.6) }); g.restore(); return; }
    const op = ease.inOut(prog(t, info.at ?? 0.3, (info.at ?? 0.3) + 0.7)), z = lerp(1, 1.06, K(info, t)); g.save(); zoom(g, z, cx, cy);
    glow(g, cx, cy, 700, GOLD(), 0.2 * op);
    rr(g, cx - 10, cy - 300, 20, 600, 6); g.fillStyle = '#8a6a10'; g.fill();
    g.save(); g.translate(cx, cy); g.scale(1, 1); rr(g, 0, -300, 520, 600, 16); g.fillStyle = '#f4ecd8'; g.fill(); g.restore();
    g.save(); g.translate(cx, cy); g.scale(lerp(1, -1, op), 1); rr(g, 0, -300, 520, 600, 16); g.fillStyle = op > 0.5 ? '#f4ecd8' : '#d8a82a'; g.fill(); if (op < 0.5) { ring(g, 260, -30, 90, 10, '#8a6a10'); circle(g, 260, -30, 30, '#8a6a10'); } g.restore();
    if (op > 0.6) { (info.lines || ['РЕКОРД']).forEach((ln, i) => text(g, ln, cx + 260, cy - 120 + i * 100, { size: i ? 52 : 80, font: FONTS.ui, weight: 900, color: '#3a2a10', alpha: fin(t, (info.at ?? 0.3) + 0.7 + i * 0.3) })); label(g, info.leftLine || 'КНИГА РЕКОРДОВ', cx - 260, cy, { size: 44, color: '#8a6a10', a: fin(t, (info.at ?? 0.3) + 0.7) }); }
    g.restore();
  },
  // ======== Angus Barbieri ========
  angus(g, t, info) {            // Angus: in the Dundee hospital office or on a scale; fat interpolates from→to
    const bgk = info.bg || 'office', fat = lerp(info.fat0 ?? 1, info.fat1 ?? info.fat0 ?? 1, ease.inOut(prog(t, info.at ?? 0.2, info.until ?? info.dur * 0.9)));
    const cam = camLerp(camAt(info.cx ?? 1000, 620, info.z0 ?? 1.45), camAt((info.cx ?? 1000) + 10, 610, info.z1 ?? 1.56), K(info, t));
    const { rim, rimDir } = bgk === 'hospital' ? hospital(g, t, cam, {}) : office(g, t, cam);
    layer(g, cam, 1, (g) => {
      if (info.doctor) drawFigure(g, { x: 1320, y: GY, s: HS, facing: -1, outfit: DOC, prop: info.clipboard ? 'paper' : null, pose: breathe(posesAt(t, [[0, POSES.relaxed], [info.docAt ?? 99, POSES.explain]], 0.3), t, 0.6), face: fc(info.docFace || 'talk'), talk: info.docTalk ? Math.abs(Math.sin(t * 9)) : 0, look: [-0.5, 0], rim: { color: rim, dir: rimDir } });
      if (info.scale) { rr(g, 870, GY - 30, 260, 30, 10); g.fillStyle = '#e8ecf2'; g.fill(); }
      fatMan(g, { x: 1000, y: info.scale ? GY - 30 : GY, s: HS, fat, color: ANGUS.color, rim, rimDir, arms: info.arms || 'side', t, face: fc(info.face || 'talk'), look: info.look || [0.3, 0], blink: blinkAt(t) });
    });
    if (info.scale) { const kg = Math.round(lerp(info.kg0 ?? 207, info.kg1 ?? info.kg0 ?? 207, ease.inOut(prog(t, info.at ?? 0.2, info.until ?? info.dur * 0.9)))); rr(g, E.W * 0.66, E.H * 0.2, 420, 170, 20); g.fillStyle = 'rgba(6,10,14,.9)'; g.fill(); text(g, `${kg} ${L('кг', 'kg')}`, E.W * 0.66 + 210, E.H * 0.2 + 88, { size: 100, font: FONTS.ui, weight: 900, color: '#8affb0', glow: 18, glowColor: alpha('#8affb0', 0.5) }); }
    if (info.speech) bubble(g, t, E.W * 0.36, E.H * 0.2, info.speech, info.speechAt ?? 0.3, { size: 50, tail: 60 });
    placeTag(g, t, info.tag);
  },
  // ======== vitamins / scurvy ========
  vitamins(g, t, info) {         // food → parts: an orange breaks into vitamin badges that fly into the body
    bgKind(g, t, 'blueprint');
    const k = ease.inOut(prog(t, info.at ?? 0.5, (info.at ?? 0.5) + 1.0)), cx = E.W * 0.3, cy = E.H * 0.5;
    UI.lineFigure(g, { x: E.W * 0.74, y: E.H * 0.95, s: 3.4, color: alpha(BP(), 0.8) });
    if (k < 1) { g.save(); g.globalAlpha *= 1 - k; icon(g, info.food || 'orange', cx, cy, 2.2, GOLD(), t); g.restore(); }
    ['vitC', 'vitB', 'vitD', 'potassium'].forEach((n, i) => { const tx = E.W * 0.74 + (i % 2 ? 50 : -50), ty = E.H * 0.35 + i * 110, x = lerp(cx + Math.cos(i * 1.6) * 120, tx, k), y = lerp(cy + Math.sin(i * 1.6) * 120, ty, k); const a = fin(t, (info.at ?? 0.5) - 0.2, 0.3); if (a > 0) icon(g, n, x, y, 0.8 * a, GOLD(), t); });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 100, fin(t, info.capAt ?? 0.2), 56);
  },
  shipSea(g, t, info) {
    const cam = camLerp(camAt(960, 560, 1.0), camAt(980, 540, 1.1), K(info, t)); ship(g, t, cam);
    sepia(g, info.sepia ?? 0.2); placeTag(g, t, info.tag);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.4), 56);
  },
  lind(g, t, info) {             // 1747: six pairs of sick sailors, each pair a different food; the citrus pair stands up
    bgKind(g, t, 'paper');
    const foods = ['cider', 'vinegar', 'water', 'sea', 'oranges', 'barley'], icons = ['tea', 'water', 'water', 'water', 'orange', 'bread'], win = info.winAt ?? 1.4;
    for (let i = 0; i < 6; i++) { const x = 230 + i * 290, y = E.H * 0.74, good = i === 4, up = good && t > win, a = pop(t, 0.1 + i * 0.15, 0.3); if (a <= 0) continue;
      g.save(); g.translate(x, y); g.scale(a * 1.45, a * 1.45);
      for (const dx of [-50, 50]) { if (up) drawFigure(g, { x: dx, y: 0, s: 0.95, facing: 1, outfit: SAILOR, pose: breathe(POSES.cheer, t, 0.8, dx), face: F.smile, rim: { color: GOLD(), dir: [0, -1] } });
        else { rr(g, dx - 44, -30, 92, 30, 8); g.fillStyle = '#6a5a48'; g.fill(); rr(g, dx - 20, -44, 64, 20, 10); g.fillStyle = SAILOR.color; g.fill(); circle(g, dx - 30, -42, 20, '#1a1a1e'); circle(g, dx - 30, -50, 14, SAILOR.headColor); } }
      icon(g, icons[i], 0, -190, 0.55, GOLD(), t); if (good) icon(g, 'lemon', 44, -184, 0.4, GOLD(), t);
      if (up) glow(g, 0, -120, 200, GOLD(), 0.3);
      g.restore(); }
    sepia(g, 0.25); placeTag(g, t, info.tag || 'ДЖЕЙМС ЛИНД · 1747');
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? win), 56);
  },
  // ======== refeeding ========
  plateDanger(g, t, info) {      // one plate under a spotlight; a red danger pulse
    g.fillStyle = '#08070a'; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    const pulse = 0.5 + 0.5 * Math.sin(t * 4), cx = E.W / 2, cy = E.H * 0.6, z = lerp(1, 1.1, K(info, t)); g.save(); zoom(g, z, cx, cy);
    FX.lightCone(g, cx, -100, { angle: Math.PI / 2, spread: 0.35, len: 900, color: '#fff1d0', a: 0.18 }); g.fillStyle = alpha('#3a2a22', 0.9); g.fillRect(0, cy + 40, E.W, E.H);
    g.save(); g.translate(cx, cy); g.scale(3.2, 3.2); icon(g, 'plate', 0, 0, 1, GOLD(), t); icon(g, 'bread', -18, -18, 0.4, GOLD(), t); icon(g, 'drumstick', 22, -20, 0.4, GOLD(), t); g.restore();
    g.restore(); glow(g, cx, cy, 700, RED, (info.danger ? 0.25 : 0) * pulse);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 140, fin(t, info.capAt ?? 0.5), 64, info.danger ? RED : GOLD());
  },
  liberation(g, t, info) {       // 1945: soldiers share their bread with exhausted people behind a fence (muted, respectful)
    const z = info.z || 1.25, cam = camLerp(camAt(info.cx || 960, 600, z), camAt((info.cx || 960) + 20, 600, z + 0.1), K(info, t));
    g.fillStyle = '#6a6a60'; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    layer(g, cam, 0.6, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, ['#8a8a80', '#b0aca0']); g.fillRect(-E.W, -E.H, E.W * 4, GY + E.H); for (let i = -2; i < 14; i++) { seg(g, [[i * 180, GY - 40], [i * 180, GY - 420]], 8, '#3a3a36'); } for (let k = 0; k < 6; k++) seg(g, [[-E.W, GY - 80 - k * 60], [E.W * 3, GY - 80 - k * 60]], 2, alpha('#2a2a26', 0.8)); });
    layer(g, cam, 1, (g) => { g.fillStyle = '#5a5448'; g.fillRect(-E.W, GY, E.W * 4, E.H);
      for (const [x, i] of [[600, 0], [760, 1], [900, 2]]) drawFigure(g, { x, y: GY, s: HS * 0.95, facing: 1, outfit: { top: 'tshirt', color: '#8a8a84', head: 'none' }, pose: breathe({ ...POSES.sad, eF: [24, -140], hF: [44, -150] }, t, 0.5, i), face: F.tired, look: [0.6, 0], rim: { color: '#f2e6cc', dir: [-0.6, -0.8] } });
      drawFigure(g, { x: 1200, y: GY, s: HS, facing: -1, outfit: SOLDIER, pose: breathe(POSES.holdFront, t, 0.6), face: F.sad, look: [-0.6, 0.1], rim: { color: '#f2e6cc', dir: [-0.6, -0.8] } });
      g.save(); g.translate(1200 - 40 * HS, GY - 150 * HS); icon(g, 'bread', 0, 0, 0.5, GOLD(), t); g.restore(); });
    sepia(g, 0.35); placeTag(g, t, info.tag || 'ЕВРОПА · 1945');
  },
  ionsDrain(g, t, info) {        // a blood vessel: salts float; food arrives (sugar) and cells pull the salts out of the blood
    bgKind(g, t, 'blueprint');
    const y0 = E.H * 0.34, y1 = E.H * 0.66, at = info.at ?? 0.6, k = ease.inOut(prog(t, at, at + 1.6));
    g.fillStyle = alpha('#ff5a4a', 0.12); g.fillRect(0, y0, E.W, y1 - y0); seg(g, [[0, y0], [E.W, y0]], 8, '#ff8a7a'); seg(g, [[0, y1], [E.W, y1]], 8, '#ff8a7a');
    for (let i = 0; i < 7; i++) { const x = 160 + i * 270; for (const [yy, s] of [[y0 - 120, -1], [y1 + 120, 1]]) { circle(g, x, yy, 80, alpha(BP(), 0.25)); ring(g, x, yy, 80, 5, BP()); } }
    const r = rng(6); for (let i = 0; i < 26; i++) { const bx = ((r() * E.W + t * 160) % (E.W + 100)) - 50, by = lerp(y0 + 30, y1 - 30, r()), out = r() < k, cell = 160 + Math.round((bx - 160) / 270) * 270, ty = r() < 0.5 ? y0 - 120 : y1 + 120;
      const x = out ? lerp(bx, cell, clamp((k - 0.2) * 2)) : bx, y = out ? lerp(by, ty, clamp((k - 0.2) * 2)) : by; circle(g, x, y, 16, GOLD()); text(g, ['K', 'P', 'Mg'][i % 3], x, y + 1, { size: 16, font: FONTS.ui, weight: 900, color: '#0b1324' }); }
    if (t > at - 0.3) for (let i = 0; i < 5; i++) { const x = ((t - at + 0.3) * 400 + i * 160) % (E.W + 200) - 100; rr(g, x - 18, E.H * 0.5 - 18, 36, 36, 6); g.fillStyle = '#f4f4f8'; g.fill(); }
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 90, fin(t, info.capAt ?? 0.3), 52);
  },
  // ======== hunger today ========
  people12(g, t, info) {         // twelve figures, one of them red: "каждый двенадцатый"
    bgKind(g, t, 'dark');
    for (let i = 0; i < 12; i++) { const x = E.W / 2 + (i - 5.5) * 140, a = pop(t, 0.1 + i * 0.07, 0.3); if (a <= 0) continue; const hi = i === 8 && t > (info.hiAt ?? 1.2);
      if (hi) glow(g, x, E.H * 0.55, 160, RED, 0.4); drawFigure(g, { x, y: E.H * 0.72, s: 1.1 * a, facing: 1, outfit: { top: 'tshirt', color: hi ? RED : '#5a6a8a', head: 'none' }, pose: breathe(hi ? POSES.sad : POSES.stand, t, 0.6, i), face: hi ? F.sad : F.talk, shadow: false, rim: { color: hi ? '#ff8a7a' : '#9ab0d0', dir: [0, -1] } }); }
    if (info.caption) glowLabel(g, info.caption, E.W / 2, E.H * 0.88, fin(t, info.capAt ?? (info.hiAt ?? 1.2) + 0.2), 60, '#ff8a7a');
  },
  split(g, t, info) {            // left: someone watching this video on a sofa; right: an empty bowl in the dark
    const k = ease.inOut(prog(t, 0.1, 0.6));
    g.save(); g.beginPath(); g.rect(0, 0, E.W / 2 - 6, E.H); g.clip(); bgKind(g, t, 'room');
    bigFace(g, E.W * 0.26, E.H * 0.66, 250, { outfit: HERO, face: F.talk, look: [0, 0.4], rimColor: '#9fd8ff', rimSide: 1 }); g.save(); g.translate(E.W * 0.26, E.H * 0.98); rr(g, -90, -80, 180, 120, 14); g.fillStyle = '#14161e'; g.fill(); g.restore(); glow(g, E.W * 0.26, E.H * 0.92, 200, '#9fd8ff', 0.3); g.restore();
    g.save(); g.beginPath(); g.rect(E.W / 2 + 6, 0, E.W / 2, E.H); g.clip(); g.fillStyle = '#0a0806'; g.fillRect(0, 0, E.W, E.H); FX.lightCone(g, E.W * 0.75, -50, { angle: Math.PI / 2, spread: 0.3, len: 900, color: '#ffe2a8', a: 0.14 });
    g.save(); g.translate(E.W * 0.75, E.H * 0.68); g.scale(2.6, 2.6); g.fillStyle = '#8a6a4a'; g.beginPath(); g.ellipse(0, 0, 70, 22, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(0, 4, 64, 40, 0, 0, Math.PI); g.fill(); g.fillStyle = '#3a2a1a'; g.beginPath(); g.ellipse(0, 0, 60, 16, 0, 0, Math.PI * 2); g.fill(); g.restore(); g.restore();
    g.fillStyle = '#ffffff'; g.fillRect(E.W / 2 - 6, 0, 12, E.H * k);
    if (info.left) label(g, info.left, E.W * 0.25, 110, { size: 44, a: fin(t, 0.4) }); if (info.right) label(g, info.right, E.W * 0.75, 110, { size: 44, color: GOLD(), a: fin(t, info.rightAt ?? 1.0) });
  },
  comment(g, t, info) {          // a comment box: the question types itself out; a blinking cursor
    bgKind(g, t, info.bg || 'room');
    const cx = E.W / 2, cy = E.H * 0.5, w = 1300, h = 360, a = pop(t, 0.05, 0.4); g.save(); zoom(g, a, cx, cy);
    rr(g, cx - w / 2, cy - h / 2, w, h, 30); g.fillStyle = '#f6f4f0'; g.fill();
    label(g, L('КОММЕНТАРИИ', 'COMENTARIOS'), cx - w / 2 + 50, cy - h / 2 + 60, { size: 34, align: 'left', color: '#6a6a7a' });
    circle(g, cx - w / 2 + 100, cy + 40, 50, '#ffd400'); drawFaceAt(g, cx - w / 2 + 100, cy + 40, 44, { front: true, override: F.smile });
    const s = info.text || L('Сколько ты продержался бы без еды?', '¿Cuántos días aguantarías?'), n = Math.floor(clamp((t - 0.3) / (info.typeDur || 1.4)) * s.length);
    text(g, s.slice(0, n), cx - w / 2 + 180, cy + 40, { size: 50, font: FONTS.ui, weight: 800, color: '#1a1a2a', align: 'left' });
    if ((t * 2) % 1 < 0.6) { const cw = measure(g, s.slice(0, n), 50, FONTS.ui, 800); g.fillStyle = '#2a6aff'; g.fillRect(cx - w / 2 + 184 + cw, cy + 10, 5, 60); }
    seg(g, [[cx - w / 2 + 180, cy + 90], [cx + w / 2 - 60, cy + 90]], 3, '#2a6aff');
    g.restore();
  },
  endCard(g, t, info) {          // subscribe + next episode teaser: the hero with an empty glass
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#0a0c1e', '#141a3a', '#0c1a2a']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W * 0.3, E.H * 0.7, 700, '#3a8aff', 0.25);
    drawFigure(g, { x: E.W * 0.3, y: E.H * 0.92, s: 2.1, facing: 1, outfit: HERO, prop: info.prop || 'cup', pose: breathe({ ...POSES.holdFront, eF: [24, -150], hF: [36, -176] }, t, 0.7), face: { eyes: 'ball', brows: 'worried', mouth: 'flat', eyeSize: 1.15 }, look: [0.6, -0.3], rim: { color: '#9fd8ff', dir: [1, -0.4] } });
    const d = ((t * 0.8) % 1); g.save(); g.globalAlpha = info.icon === false ? 0 : 1 - d; icon(g, info.icon || 'droplet', E.W * 0.3 + 140, E.H * 0.2 + d * 140, 0.7, '#6ab8ff', t); g.restore();
    label(g, L('ДАЛЬШЕ', 'LO QUE VIENE'), E.W * 0.68, E.H * 0.24, { size: 44, color: alpha(CREAM(), 0.7), a: fin(t, 0.2), spacing: 8 });
    (info.next || L(['ЧТО ЕСЛИ ТЫ', 'ПЕРЕСТАНЕШЬ', 'ПИТЬ ВОДУ?'], ['¿Y SI', 'DEJARAS DE', 'BEBER AGUA?'])).forEach((ln, i) => text(g, ln, E.W * 0.68, E.H * 0.36 + i * 110, { size: 96, font: FONTS.title, weight: 700, color: i === 2 ? '#6ab8ff' : '#ffffff', alpha: fin(t, 0.4 + i * 0.25), glow: 26, glowColor: 'rgba(90,160,255,.6)' }));
    const sp = ease.outBack(prog(t, 1.2, 1.6)); g.save(); g.translate(E.W * 0.68, E.H * 0.8); g.scale(sp, sp); rr(g, -220, -50, 440, 100, 50); g.fillStyle = '#e0302a'; g.fill(); text(g, L('ПОДПИСАТЬСЯ', 'SUSCRIBIRSE'), 0, 2, { size: 46, font: FONTS.ui, weight: 900, color: '#ffffff' }); g.restore();
  },
};
