// sets/hunger.js — places of the hunger story. All share the floor line GY, so the cast scale HS matches the bedroom.
// fridge (open door on the kitchen fridge), cave fire (prehistory), stadium (Minnesota 1944), Leningrad winter,
// basement cell (Austria 1979), sailing ship (scurvy), Antarctic blizzard (penguin), snow den (bear) + fatMan (Angus).
import { E, layer, rr, seg, circle, ring, poly, linGrad, glow, alpha, shade, mix, text, clamp, lerp, ease, rng, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { face as drawFaceAt } from '/engine/rig2d.js';
import { GY } from './bedroom.js';

const floorBand = (g, c, h = 420) => { g.fillStyle = linGrad(g, 0, GY, 0, GY + h, [shade(c, 0.1), shade(c, -0.25)]); g.fillRect(-E.W * 2, GY, E.W * 6, E.H * 3); };
const backWall = (g, c) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(c, -0.45), c, shade(c, 0.06)]); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 20); };

// ---- the kitchen fridge (kitchen() draws it closed at x 1720..1970, y 280..GY): open door + lit, empty inside
export const FR = { x: 1720, y: 280, w: 250, h: GY - 280 };
export function fridgeOpen(g, k, o = {}) {
  if (k <= 0) return;
  const { x, y, w, h } = FR, lit = clamp(k * 1.6);
  rr(g, x + 8, y + 8, w - 16, h - 16, 10); g.fillStyle = linGrad(g, 0, y, 0, y + h, [mix('#2a3040', '#c8dcf0', lit), mix('#1a2030', '#7f9cbc', lit)]); g.fill();
  g.fillStyle = alpha('#2a3a52', 0.35); g.fillRect(x + 8, y + 8, 22, h - 16); g.fillRect(x + w - 30, y + 8, 22, h - 16);
  glow(g, x + w / 2, y + 40, 120, '#ffffff', 0.6 * lit);
  for (const sy of [y + 150, y + 290, y + 420]) { rr(g, x + 14, sy, w - 28, 10, 3); g.fillStyle = alpha('#f4fbff', 0.9 * lit + 0.1); g.fill(); g.fillStyle = alpha('#3a4a62', 0.45); g.fillRect(x + 14, sy + 10, w - 28, 18); }
  rr(g, x + 20, y + h - 120, w - 40, 96, 10); g.fillStyle = alpha('#e6f2ff', 0.35 * lit); g.fill();                         // empty crisper drawer
  if (o.item) { g.save(); g.translate(x + w * 0.62, y + 270); g.scale(0.45, 0.45); o.item(g); g.restore(); }
  glow(g, x + w / 2, y + h * 0.45, 700, '#d8ecff', 0.35 * lit);
  // the door: hinge on the right edge, swings toward the camera
  const a = ease.out(clamp(k)) * Math.PI * 0.55, xl = x + w - w * Math.cos(a) + 150 * Math.sin(a), grow = 70 * Math.sin(a);
  g.fillStyle = shade('#c4c0d4', -0.2 + 0.1 * Math.sin(a)); g.beginPath(); g.moveTo(x + w, y); g.lineTo(xl, y - grow * 0.6); g.lineTo(xl, y + h + grow * 0.4); g.lineTo(x + w, y + h); g.closePath(); g.fill();
  if (a > 0.3) { const ix = (u) => lerp(x + w, xl, u); g.fillStyle = alpha('#8a90a8', 0.55); g.beginPath(); g.moveTo(ix(0.12), y + 30); g.lineTo(ix(0.88), y + 30 - grow * 0.5); g.lineTo(ix(0.88), y + h - 30 + grow * 0.35); g.lineTo(ix(0.12), y + h - 30); g.closePath(); g.fill(); }
  if (a > 0.6) { const dw = xl - (x + w); for (const sy of [0.25, 0.55]) { g.fillStyle = alpha('#9aa8c0', 0.7); g.fillRect(x + w + dw * 0.12, y + h * sy, dw * 0.8, 10); } }
  FX.lightCone(g, x + 20, y + h * 0.5, { angle: Math.PI * 0.95, spread: 0.8, len: 900, color: '#d8ecff', a: 0.16 * lit });
  FX.pool(g, x - 120, GY + 30, 380, 40, '#d8ecff', 0.25 * lit);
}

// ---- fatMan: a front-facing heavy figure (Angus Barbieri). fat 1 = 207 kg, 0 = slim. y = feet.
export function fatMan(g, o) {
  const { x, y, s = 1.67, fat = 1, color = '#4a7ab8', rim = '#ffd09a', rimDir = [1, -0.4], arms = 'side', t = 0 } = o;
  const ink = '#0a0c16', bx = 20 + 34 * fat, by = 44 + 12 * fat, lg = 10 + 12 * fat;
  const shape = (col, pass) => {
    seg(g, [[-lg, -98], [-lg - 2, -4]], 13 + fat * 6, col); seg(g, [[lg, -98], [lg + 2, -4]], 13 + fat * 6, col);
    if (pass === 'main') { seg(g, [[-lg - 2, -4], [-lg - 16, -2]], 12, col); seg(g, [[lg + 2, -4], [lg + 16, -2]], 12, col); }
    const swing = arms === 'talk' ? Math.sin(t * 4) * 6 : 0;
    const ax = bx * 0.8 + 6, L = arms === 'belly' ? [[ax, -164], [bx + 10, -126], [bx * 0.5, -118]] : arms === 'up' ? [[ax, -164], [ax + 24, -200], [ax + 30, -238]] : arms === 'talk' ? [[ax, -164], [ax + 22, -136], [ax + 36, -160 + swing]] : [[ax, -164], [ax + 12, -130], [ax + 10, -98]];
    for (const sx of [-1, 1]) { const pts = (sx === 1 || arms === 'up') ? L : [[ax, -164], [ax + 12, -130], [ax + 10, -98]]; seg(g, pts.map(([px, py]) => [px * sx, py]), 11, col); }
    g.fillStyle = pass === 'main' ? color : col; g.beginPath(); g.ellipse(0, -136, bx, by, 0, 0, Math.PI * 2); g.fill();
    rr(g, -bx * 0.82, -178, bx * 1.64, 36, 18); g.fill();
    if (pass === 'main') { g.fillStyle = shade(color, -0.25); g.beginPath(); g.ellipse(0, -96, bx * 0.85, 10, 0, 0, Math.PI * 2); g.fill(); }
    circle(g, 0, -206 + fat * 4, 26 + fat * 4, pass === 'main' ? ink : col);
  };
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 2, bx + 14, 7, 0, 0, Math.PI * 2); g.fill();
  g.save(); g.translate(rimDir[0] * 3.2, rimDir[1] * 3.2); shape(rim, 'sil'); g.restore();
  shape(ink, 'main');
  drawFaceAt(g, 0, -206 + fat * 4, 26 + fat * 4, { front: true, override: o.face || { eyes: 'ball', brows: null, mouth: 'smallFlat' }, look: o.look || [0, 0], blink: o.blink });
  if (fat > 0.4) { g.strokeStyle = alpha('#2a2e44', 0.9); g.lineWidth = 3; g.beginPath(); g.arc(0, -184 + fat * 4, 14 + fat * 6, 0.25, Math.PI - 0.25); g.stroke(); }   // double chin
  g.restore();
}

// ---- prehistory: night plain, a campfire; a mammoth on the ridge when the hunt went well
export function cave(g, t, cam, o = {}) {
  const fire = o.fire ?? 1;
  layer(g, cam, 0.1, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, ['#05060f', '#141a36', '#3a2a40']); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 40); FX.stars(g, t, { count: 160, area: [-E.W, -E.H, E.W * 3, E.H * 1.2] }); FX.moon(g, 1500, 180, 46); });
  layer(g, cam, 0.35, (g) => FX.hills(g, { y: GY - 220, amp: 90, color: '#1a1830', seed: 4 }));
  layer(g, cam, 0.6, (g) => {
    FX.hills(g, { y: GY - 110, amp: 60, color: '#221a26', seed: 9 });
    if (o.mammoth) { const mx = 1500, my = GY - 150; g.fillStyle = '#120e16'; g.beginPath(); g.ellipse(mx, my - 70, 130, 90, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(mx + 130, my - 60, 56, 52, 0, 0, Math.PI * 2); g.fill();
      for (const lx of [-90, -40, 40, 90]) g.fillRect(mx + lx - 16, my - 20, 32, 80); seg(g, [[mx + 170, my - 40], [mx + 190, my + 30], [mx + 176, my + 70]], 16, '#120e16');
      g.strokeStyle = '#e8dcc0'; g.lineWidth = 9; g.beginPath(); g.moveTo(mx + 160, my - 20); g.quadraticCurveTo(mx + 250, my + 10, mx + 240, my - 60); g.stroke(); }
  });
  layer(g, cam, 1, (g) => {
    floorBand(g, '#2a1e18');
    const fx = o.fx ?? 960, fy = GY + 20;
    for (const [a, l] of [[-0.3, 120], [0.3, 120], [0, 90]]) { g.save(); g.translate(fx, fy); g.rotate(a); rr(g, -l / 2, -10, l, 20, 8); g.fillStyle = '#3a2416'; g.fill(); g.restore(); }
    if (o.meat) { seg(g, [[fx - 160, fy - 150], [fx + 160, fy - 150]], 6, '#5a3a22'); seg(g, [[fx - 150, fy - 150], [fx - 150, fy]], 6, '#5a3a22'); seg(g, [[fx + 150, fy - 150], [fx + 150, fy]], 6, '#5a3a22');
      g.fillStyle = '#8a3a22'; g.beginPath(); g.ellipse(fx, fy - 150, 90, 46, 0.1, 0, Math.PI * 2); g.fill(); circle(g, fx + 96, fy - 150, 16, '#efe6d2'); circle(g, fx - 96, fy - 150, 16, '#efe6d2'); }
    const fl = (k) => 0.75 + 0.25 * Math.sin(t * 13 + k) * Math.sin(t * 7.3 + k * 2);
    glow(g, fx, fy - 40, 520 * fire, '#ff9a40', 0.45 * fire);
    for (const [dx, h, col] of [[-30, 150, '#ff6a20'], [26, 130, '#ff7a28'], [0, 190, '#ffb040'], [0, 110, '#ffe08a']]) { const hh = h * fire * fl(dx + h); g.fillStyle = col; g.beginPath(); g.moveTo(fx + dx - 40 * fire, fy); g.quadraticCurveTo(fx + dx - 30 * fire, fy - hh * 0.6, fx + dx + Math.sin(t * 9 + dx) * 12, fy - hh); g.quadraticCurveTo(fx + dx + 30 * fire, fy - hh * 0.6, fx + dx + 40 * fire, fy); g.fill(); }
    FX.pool(g, fx, fy + 20, 520, 70, '#ff9a40', 0.35 * fire);
  });
  return { rim: '#ffa050', rimDir: [0, -1] };
}

// ---- Minnesota 1944: the university stadium; cut > 0 opens the lower wall to show the lab under the stands
export function stadium(g, t, cam, o = {}) {
  const cut = o.cut || 0, brick = '#8a5a44';
  layer(g, cam, 0.15, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, ['#5a7090', '#a8b4c0', '#e0d0b0']); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 40); FX.clouds(g, { y: 140, color: '#ffffff', a: 0.25 }); });
  layer(g, cam, 0.8, (g) => {
    poly(g, [[180, 330], [1740, 330], [1800, 250], [120, 250]], shade(brick, -0.35));                                 // the stands' upper rim
    for (let i = 0; i < 14; i++) seg(g, [[200 + i * 112, 250], [200 + i * 112, 205]], 3, '#3a2a22');
    for (const fx of [300, 960, 1620]) { seg(g, [[fx, 250], [fx, 130]], 4, '#3a2a22'); poly(g, [[fx, 130], [fx + 70, 146], [fx, 162]], '#c83a3a'); }
    g.fillStyle = linGrad(g, 0, 330, 0, GY, [brick, shade(brick, -0.15)]); g.fillRect(160, 330, 1600, GY - 330);
    for (let i = 0; i < 8; i++) { const ax = 230 + i * 190; rr(g, ax, 420, 130, 260, 65); g.fillStyle = shade(brick, -0.45); g.fill(); }
    g.strokeStyle = alpha('#000', 0.12); g.lineWidth = 2; for (let yy = 340; yy < GY; yy += 28) { g.beginPath(); g.moveTo(160, yy); g.lineTo(1760, yy); g.stroke(); }
    text(g, 'MEMORIAL STADIUM', 960, 372, { size: 40, font: FONTS.ui, weight: 900, color: alpha('#f2e6cc', 0.85), spacing: 8 });
    if (cut > 0) {
      const cy = lerp(GY, 560, ease.inOut(cut));
      g.save(); g.beginPath(); g.rect(240, cy, 1440, GY - cy); g.clip();
      g.fillStyle = '#e8d8b4'; g.fillRect(240, 540, 1440, GY - 540); glow(g, 960, 640, 800, '#ffe2a0', 0.4);
      for (let i = 0; i < 4; i++) { const bx = 300 + i * 340; rr(g, bx, GY - 90, 260, 40, 8); g.fillStyle = '#8a8070'; g.fill(); rr(g, bx + 10, GY - 112, 70, 26, 10); g.fillStyle = '#f4efe2'; g.fill(); g.fillStyle = '#5a5040'; g.fillRect(bx + 10, GY - 50, 10, 50); g.fillRect(bx + 240, GY - 50, 10, 50); }
      for (let i = 0; i < 3; i++) { rr(g, 460 + i * 340, 590, 90, 60, 4); g.fillStyle = '#3a3a2a'; g.fill(); }
      g.restore();
      seg(g, [[240, cy], [1680, cy]], 8, shade(brick, -0.5));
    }
  });
  layer(g, cam, 1, (g) => { floorBand(g, '#6a6a5a'); for (let i = -4; i < 20; i++) seg(g, [[i * 130, GY + 8], [i * 130 - 60, GY + 300]], 2, alpha('#000', 0.1)); });
  return { rim: '#fff1d0', rimDir: [-0.6, -0.8] };
}

// ---- Leningrad, winter 1941: dark facades, windows taped with paper crosses, snow
export function leningrad(g, t, cam, o = {}) {
  layer(g, cam, 0.15, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, ['#04060e', '#141a30', '#2a3048']); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 40); });
  layer(g, cam, 0.45, (g) => { FX.skyline(g, { x: -E.W * 2, y: GY - 120, w: E.W * 6, minH: 220, maxH: 480, color: '#10141f', windowColor: alpha('#ffd08a', 0.15), lit: 0.03, seed: 41 });
    seg(g, [[1300, GY - 560], [1300, GY - 300]], 12, '#10141f'); poly(g, [[1288, GY - 560], [1312, GY - 560], [1300, GY - 720]], '#10141f'); });
  layer(g, cam, 0.8, (g) => {
    const cols = ['#3a3a44', '#34343e', '#40404a'];
    for (let i = -3; i < 10; i++) { const fx = i * 440, h = 560 + ((i * 53) % 3) * 60; g.fillStyle = cols[((i % 3) + 3) % 3]; g.fillRect(fx, GY - 80 - h, 420, h);
      for (let r2 = 0; r2 < 4; r2++) for (let c2 = 0; c2 < 4; c2++) { const wx = fx + 40 + c2 * 96, wy = GY - 80 - h + 60 + r2 * 120; g.fillStyle = (i + r2 + c2) % 7 === 0 ? alpha('#ffb860', 0.55) : '#14161e'; g.fillRect(wx, wy, 60, 80);
        seg(g, [[wx, wy], [wx + 60, wy + 80]], 4, alpha('#d8d0c0', 0.6)); seg(g, [[wx + 60, wy], [wx, wy + 80]], 4, alpha('#d8d0c0', 0.6)); }
      g.fillStyle = '#dfe6f2'; g.fillRect(fx - 4, GY - 80 - h - 10, 428, 14); }
  });
  layer(g, cam, 1, (g) => {
    g.fillStyle = linGrad(g, 0, GY - 80, 0, GY + 300, ['#cfd8e8', '#9aa6bc']); g.fillRect(-E.W * 2, GY - 80, E.W * 6, E.H * 3);
    const r = rng(7); for (let i = 0; i < 22; i++) { const dx = -E.W + r() * E.W * 4; g.fillStyle = alpha('#e8eef8', 0.8); g.beginPath(); g.ellipse(dx, GY - 70 + r() * 30, 80 + r() * 120, 22, 0, Math.PI, Math.PI * 2); g.fill(); }
  });
  layer(g, cam, 1.15, (g) => FX.snow(g, t, { count: 220, color: '#eef3ff', speed: 50 }));
  return { rim: '#cfe0ff', rimDir: [0.4, -1] };
}

// ---- basement cell: brick, a barred window up high, steel door (doorOpen 0..1), bench, damp wall, tally marks
export const CELL = { door: { x: 420, w: 200 }, bench: { x: 1060, w: 520, top: GY - 130 }, win: { x: 1180, y: 190, w: 220, h: 110 }, damp: { x: 760, w: 220 } };
export function basement(g, t, cam, o = {}) {
  const wall = '#4a4e48', dOpen = o.doorOpen || 0, dark = o.dark ?? 0.35;
  layer(g, cam, 0.85, (g) => {
    backWall(g, wall);
    g.strokeStyle = alpha('#000', 0.18); g.lineWidth = 2;
    for (let yy = 60, row = 0; yy < GY; yy += 46, row++) { g.beginPath(); g.moveTo(-E.W, yy); g.lineTo(E.W * 3, yy); g.stroke(); for (let xx = (row % 2) * 60 - E.W; xx < E.W * 3; xx += 120) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 46); g.stroke(); } }
    const W = CELL.win; rr(g, W.x, W.y, W.w, W.h, 4); g.fillStyle = linGrad(g, 0, W.y, 0, W.y + W.h, [o.night ? '#141a30' : '#c8d4e0', o.night ? '#1a2038' : '#e8ecf0']); g.fill();
    for (let i = 1; i < 5; i++) seg(g, [[W.x + i * W.w / 5, W.y], [W.x + i * W.w / 5, W.y + W.h]], 7, '#1a1a1e');
    if (!o.night) FX.lightCone(g, W.x + W.w / 2, W.y + W.h, { angle: Math.PI / 2 + 0.35, spread: 0.3, len: 700, color: '#e8f0ff', a: 0.12 });
    const D = CELL.damp; g.fillStyle = alpha('#2a3a34', 0.5); g.fillRect(D.x, 300, D.w, GY - 300);
    const rd = rng(3); for (let i = 0; i < 18; i++) { const dx = D.x + rd() * D.w, dy = 320 + rd() * 420 + ((t * 18 + i * 30) % 40); circle(g, dx, dy, 3 + rd() * 3, alpha('#cfe8ff', 0.7)); FX.sparkle(g, dx, dy, 8, '#e8f4ff', 0.5 * (0.5 + 0.5 * Math.sin(t * 5 + i))); }
    const n = o.tally || 0; for (let i = 0; i < n; i++) { const grp = Math.floor(i / 5), k = i % 5, tx = 1640 + grp * 64 + k * 10; if (k === 4) seg(g, [[tx - 46, 470], [tx + 4, 420]], 4, alpha('#e8e0d0', 0.7)); else seg(g, [[tx, 418], [tx, 472]], 4, alpha('#e8e0d0', 0.7)); }
    // door: frame, corridor light behind, steel leaf swinging in
    const Dr = CELL.door; rr(g, Dr.x - 16, GY - 420, Dr.w + 32, 420, 4); g.fillStyle = '#26282a'; g.fill();
    g.fillStyle = mix('#0a0a0c', '#ffe6b0', dOpen); g.fillRect(Dr.x, GY - 400, Dr.w, 400);
    if (dOpen > 0) { glow(g, Dr.x + Dr.w / 2, GY - 200, 500, '#ffe6b0', 0.4 * dOpen); FX.lightCone(g, Dr.x + Dr.w, GY - 220, { angle: 0.15, spread: 0.5, len: 1000, color: '#ffe6b0', a: 0.18 * dOpen }); }
    const lw = Dr.w * (1 - ease.out(dOpen) * 0.85); g.fillStyle = '#5a6066'; g.fillRect(Dr.x, GY - 400, lw, 400);
    if (lw > 60) { rr(g, Dr.x + lw * 0.3, GY - 300, lw * 0.4, 40, 4); g.fillStyle = '#2a2e32'; g.fill(); for (const ry of [GY - 360, GY - 60]) { g.fillStyle = '#3a4046'; g.fillRect(Dr.x, ry, lw, 10); } circle(g, Dr.x + lw - 26, GY - 200, 9, '#9aa0a8'); }
  });
  layer(g, cam, 1, (g) => {
    floorBand(g, '#3a3c38');
    const B = CELL.bench; rr(g, B.x, B.top, B.w, 26, 4); g.fillStyle = '#5a4a3a'; g.fill(); g.fillStyle = '#3a2e24'; g.fillRect(B.x + 20, B.top + 26, 20, GY - B.top - 26); g.fillRect(B.x + B.w - 40, B.top + 26, 20, GY - B.top - 26);
    rr(g, 300, GY - 40, 70, 40, 6); g.fillStyle = '#6a6a70'; g.fill();                                              // a bucket
  });
  g.fillStyle = `rgba(4,5,8,${dark})`; g.fillRect(0, 0, E.W, E.H);
  return { rim: o.night ? '#9ab0d0' : '#e8f0ff', rimDir: [0.5, -1] };
}

// ---- a sailing ship on a night sea (rocking)
export function ship(g, t, cam, o = {}) {
  layer(g, cam, 0.1, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, ['#05070f', '#111a33', '#2a3354']); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 40); FX.stars(g, t, { count: 120 }); FX.moon(g, 1560, 170, 50); });
  const sea = (y, amp, col, sp, ph) => { g.fillStyle = col; g.beginPath(); g.moveTo(-E.W, E.H * 3); for (let x = -E.W; x <= E.W * 3; x += 30) g.lineTo(x, y + Math.sin(x * 0.006 + t * sp + ph) * amp); g.lineTo(E.W * 3, E.H * 3); g.fill(); };
  layer(g, cam, 0.5, (g) => sea(GY - 120, 14, '#16223e', 0.8, 0));
  layer(g, cam, 1, (g) => {
    const cx = 960, cy = GY - 120, rock = Math.sin(t * 0.9) * 0.035;
    g.save(); g.translate(cx, cy + Math.sin(t * 0.9 + 1) * 8); g.rotate(rock);
    g.fillStyle = '#3a2418'; g.beginPath(); g.moveTo(-460, -60); g.lineTo(460, -80); g.quadraticCurveTo(420, 60, 300, 90); g.lineTo(-330, 90); g.quadraticCurveTo(-440, 40, -460, -60); g.fill();
    g.fillStyle = '#2a1a10'; g.fillRect(-440, -100, 120, 44); g.fillRect(320, -120, 140, 44);
    for (let i = 0; i < 6; i++) circle(g, -300 + i * 120, 10, 12, '#1a100a');
    for (const [mx, mh, sw] of [[-220, 520, 240], [40, 620, 280], [300, 480, 220]]) { seg(g, [[mx, -70], [mx, -70 - mh]], 12, '#2a1a10');
      for (const [sy, sh] of [[0.2, 0.33], [0.58, 0.3]]) { const top = -70 - mh * (1 - sy), hh = mh * sh; g.fillStyle = alpha('#d8ccb0', 0.85); g.beginPath(); g.moveTo(mx - sw / 2, top); g.lineTo(mx + sw / 2, top); g.quadraticCurveTo(mx + sw / 2 + 30, top + hh / 2, mx + sw / 2 - 10, top + hh); g.lineTo(mx - sw / 2 + 10, top + hh); g.quadraticCurveTo(mx - sw / 2 + 30, top + hh / 2, mx - sw / 2, top); g.fill(); seg(g, [[mx - sw / 2 - 10, top], [mx + sw / 2 + 10, top]], 6, '#2a1a10'); } }
    circle(g, 380, -150, 12, '#ffcf70'); glow(g, 380, -150, 120, '#ffb050', 0.6);
    g.restore();
  });
  layer(g, cam, 1.1, (g) => { sea(GY - 40, 22, '#0c1428', 1.1, 2); sea(GY + 40, 30, '#08101e', 1.4, 4); });
  return { rim: '#cfe0ff', rimDir: [0.5, -1] };
}

// ---- Antarctic winter: dark sky, blizzard, ice; penguin(s) with an egg on their feet
export function penguin(g, x, y, s, o = {}) {
  const t = o.t || 0, sway = Math.sin(t * 1.6 + (o.ph || 0)) * 0.04;
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(sway);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 2, 70, 12, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#14161e'; g.beginPath(); g.ellipse(0, -150, 70, 150, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f2f0ea'; g.beginPath(); g.ellipse(14, -130, 48, 120, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = alpha('#f2c23a', 0.8); g.beginPath(); g.ellipse(30, -236, 26, 18, 0.4, 0, Math.PI * 2); g.fill();
  circle(g, 20, -290, 44, '#14161e'); poly(g, [[56, -296], [96, -286], [56, -280]], '#e88a2a'); circle(g, 36, -298, 6, '#ffffff'); circle(g, 38, -298, 3, '#14161e');
  g.fillStyle = '#14161e'; g.beginPath(); g.ellipse(-56, -150, 18, 80, 0.15, 0, Math.PI * 2); g.fill();
  if (o.egg) { g.fillStyle = '#f4efe2'; g.beginPath(); g.ellipse(22, -26, 22, 28, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#14161e'; g.beginPath(); g.ellipse(18, -40, 50, 20, 0, Math.PI, Math.PI * 2); g.fill(); }
  poly(g, [[-20, 0], [-4, -14], [12, 0]], '#e88a2a'); poly(g, [[12, 0], [28, -14], [44, 0]], '#e88a2a');
  g.restore();
}
export function antarctic(g, t, cam, o = {}) {
  layer(g, cam, 0.12, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, ['#04060c', '#0e1a30', '#2a3a58']); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 40); FX.stars(g, t, { count: 80 });
    g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { g.fillStyle = linGrad(g, 0, 60, 0, 420, [alpha('#3aff9a', 0), alpha('#3aff9a', 0.12), alpha('#3aff9a', 0)]); g.beginPath(); g.moveTo(-200, 120 + k * 40); for (let x = -200; x <= 2200; x += 60) g.lineTo(x, 120 + k * 40 + Math.sin(x * 0.004 + t * 0.4 + k) * 60); g.lineTo(2200, 420); g.lineTo(-200, 420); g.fill(); } g.restore(); });
  layer(g, cam, 0.5, (g) => FX.hills(g, { y: GY - 140, amp: 50, color: '#5a6a88', seed: 12 }));
  layer(g, cam, 1, (g) => { g.fillStyle = linGrad(g, 0, GY - 30, 0, GY + 300, ['#c8d6ea', '#8a9ab8']); g.fillRect(-E.W * 2, GY - 30, E.W * 6, E.H * 3); });
  return { rim: '#cfe8ff', rimDir: [0.4, -1] };
}
export function blizzard(g, t, k = 1) {
  FX.snow(g, t, { count: Math.round(260 * k), color: '#f2f6ff', speed: 140, seed: 8 });
  g.strokeStyle = alpha('#e8f0ff', 0.18 * k); g.lineWidth = 2; const r = rng(5); for (let i = 0; i < 40; i++) { const y = r() * E.H, x = ((r() * E.W * 2 + t * 900) % (E.W + 400)) - 200; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 160, y + 16); g.stroke(); }
  FX.fog(g, E.H * 0.55, E.H * 0.5, '#dfe8f8', 0.18 * k);
}

// ---- the bear's den: a snow-covered hillside cut open; spring > 0 melts it into grass
export function den(g, t, cam, o = {}) {
  const sp = o.spring || 0;
  layer(g, cam, 0.12, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [mix('#0a1020', '#6aa0e0', sp), mix('#1a2440', '#b8d8f0', sp), mix('#3a4660', '#e8f0d8', sp)]); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 40); if (sp > 0.3) FX.sun(g, 1600, 180, 50); });
  layer(g, cam, 0.5, (g) => { for (let i = -2; i < 12; i++) FX.pine(g, i * 200 + 60, GY - 300, 1.3, mix('#1a2a2a', '#2a5a3a', sp)); });
  layer(g, cam, 1, (g) => {
    g.fillStyle = mix('#5a4030', '#4a3a22', sp); g.beginPath(); g.moveTo(-E.W, GY); g.quadraticCurveTo(400, 260, 960, 240); g.quadraticCurveTo(1500, 260, E.W * 2, GY); g.lineTo(E.W * 2, E.H * 3); g.lineTo(-E.W, E.H * 3); g.fill();
    g.fillStyle = mix('#eef3fa', '#5aa04a', sp); g.beginPath(); g.moveTo(-E.W, GY - 10); g.quadraticCurveTo(400, 230, 960, 210); g.quadraticCurveTo(1500, 230, E.W * 2, GY - 10); g.quadraticCurveTo(1500, 270, 960, 262); g.quadraticCurveTo(400, 280, -E.W, GY + 30); g.fill();
    g.fillStyle = '#1e140e'; g.beginPath(); g.ellipse(960, 640, 520, 240, 0, 0, Math.PI * 2); g.fill();
    glow(g, 960, 650, 520, '#ffb070', 0.12);
    if (sp > 0.4) for (let i = 0; i < 9; i++) { const fx = 200 + i * 190, fy = GY - 260 + Math.abs(i - 4) * 50; circle(g, fx, fy, 9, ['#ffe24a', '#ff8ab0', '#ffffff'][i % 3]); }
  });
  return { rim: '#ffd09a', rimDir: [0, -1] };
}
export function bear(g, x, y, s, o = {}) {
  const t = o.t || 0, br = 1 + Math.sin(t * 1.4) * 0.025 * (o.awake ? 0 : 1), c = '#5a3a24';
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = c; g.beginPath(); g.ellipse(0, -110 * br, 230, 110 * br, 0, 0, Math.PI * 2); g.fill();
  const hx = o.awake ? 200 : 170, hy = o.awake ? -190 : -70;
  circle(g, hx, hy, 74, c); circle(g, hx - 40, hy - 62, 24, c); circle(g, hx + 36, hy - 66, 24, c);
  g.fillStyle = '#8a6a4a'; g.beginPath(); g.ellipse(hx + 40, hy + 18, 34, 26, 0, 0, Math.PI * 2); g.fill(); circle(g, hx + 60, hy + 8, 10, '#14100c');
  if (o.awake) { circle(g, hx + 10, hy - 14, 9, '#f4f0e8'); circle(g, hx + 12, hy - 14, 5, '#14100c'); }
  else { g.strokeStyle = '#14100c'; g.lineWidth = 5; g.beginPath(); g.arc(hx + 10, hy - 12, 10, 0.2, Math.PI - 0.2); g.stroke(); }
  g.fillStyle = shade(c, -0.15); for (const fx of [-140, 90]) { g.beginPath(); g.ellipse(fx, -16, 60, 26, 0, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
