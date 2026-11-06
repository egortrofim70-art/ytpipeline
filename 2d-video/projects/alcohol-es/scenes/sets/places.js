// sets/places.js — hospital room, doctor's office, Venice 1765, lab cage. All share GY so the cast scale HS matches.
import { E, mood, layer, rr, seg, circle, ring, poly, linGrad, glow, alpha, shade, mix, text, clamp, lerp, rng, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { GY } from './bedroom.js';

const floorBand = (g, c) => { g.fillStyle = linGrad(g, 0, GY, 0, GY + 420, [shade(c, 0.1), shade(c, -0.2)]); g.fillRect(-E.W, GY, E.W * 4, E.H * 3); };

// ---- hospital room, cold fluorescent light. bed at HB.x..HB.x+HB.w, mattress top HB.top; monitor at MON
export const HB = { x: 700, w: 560, top: GY - 150 };
export const MON = { x: 1380, y: 330, w: 300, h: 200 };
export function hospital(g, t, cam, o = {}) {
  const wall = o.night ? '#2a3a48' : '#6a8a8a';
  layer(g, cam, 0.75, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(wall, -0.35), wall, shade(wall, 0.08)]); g.fillRect(-E.W, -E.H * 2, E.W * 4, GY + E.H * 2 + 20);
    g.fillStyle = shade(wall, -0.15); g.fillRect(-E.W, GY - 260, E.W * 4, 10);                              // wainscot rail
    FX.windowFrame(g, { x: 160, y: 220, w: 360, h: 340, cols: 2, rows: 1, frame: shade(wall, -0.5), bar: 12, blinds: 18 }, (g, x, y, w, h) => {
      g.fillStyle = linGrad(g, 0, y, 0, y + h, o.night ? ['#0e1430', '#2a2a5a'] : ['#a8c4e0', '#e0e8f0']); g.fillRect(x, y, w, h);
    });
    rr(g, 600, 60, 520, 22, 10); g.fillStyle = '#eef6ff'; g.fill(); glow(g, 860, 72, 420, '#e6f4ff', o.night ? 0.25 : 0.45);   // ceiling light
  });
  layer(g, cam, 1, (g) => {
    floorBand(g, o.night ? '#22303a' : '#8a9a9a');
    // IV pole + bag
    seg(g, [[640, GY], [640, 300]], 6, '#9aa4b0'); seg(g, [[600, GY], [680, GY]], 6, '#9aa4b0'); rr(g, 612, 300, 56, 80, 12); g.fillStyle = alpha('#d8f0ff', 0.75); g.fill();
    seg(g, [[640, 380], [660, 520], [740, HB.top - 20]], 3, alpha('#d8f0ff', 0.6));
    // monitor on a stand
    seg(g, [[MON.x + MON.w / 2, MON.y + MON.h], [MON.x + MON.w / 2, GY]], 8, '#5a646e'); seg(g, [[MON.x + 80, GY], [MON.x + MON.w - 80, GY]], 8, '#5a646e');
    FX.screen(g, { x: MON.x, y: MON.y, w: MON.w, h: MON.h, glowC: '#5fd39a', a: 0.22 }, (g, x, y, w, h) => {
      const mode = o.monitor || 'ecg', k = o.spike || 0;
      g.strokeStyle = '#5fd39a'; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i <= 60; i++) {
        const px = x + 10 + (i * (w - 20)) / 60, ph = (i / 60) * 4 + t * 1.5;
        let v = 0;
        if (mode === 'ecg') { const c = ph % 1; v = c > 0.45 && c < 0.5 ? -1 : c > 0.5 && c < 0.55 ? 0.6 : 0; v *= 1 + k * 0.8; }
        if (mode === 'eegAwake') v = Math.sin(ph * 37) * 0.25 + Math.sin(ph * 61 + 1) * 0.15;
        if (mode === 'eegSleep') v = Math.sin(ph * 6) * 0.6 + Math.sin(ph * 2) * 0.2;
        g.lineTo(px, y + h * 0.55 + v * h * 0.32);
      }
      g.stroke();
      if (o.monitorLabel) text(g, o.monitorLabel, x + w / 2, y + 26, { size: 22, font: FONTS.ui, weight: 900, color: o.monitorColor || '#5fd39a' });
    });
    // hospital bed with rails
    rr(g, HB.x - 20, HB.top - 140, 26, GY - HB.top + 140, 8); g.fillStyle = '#c8ccd4'; g.fill();
    g.fillStyle = '#9aa0ac'; g.fillRect(HB.x, HB.top + 40, HB.w, 30); g.fillRect(HB.x + 20, HB.top + 70, 12, GY - HB.top - 90); g.fillRect(HB.x + HB.w - 32, HB.top + 70, 12, GY - HB.top - 90);
    for (const wx of [HB.x + 26, HB.x + HB.w - 26]) circle(g, wx, GY - 14, 14, '#4a505a');
    rr(g, HB.x, HB.top, HB.w, 44, 12); g.fillStyle = '#e8ecf2'; g.fill();
    rr(g, HB.x + 10, HB.top - 36, 130, 48, 20); g.fillStyle = '#f4f6fa'; g.fill();
  });
  return { rim: '#e6f4ff', rimDir: [0.4, -1] };
}
// the patient lying in the hospital bed (same construction as the bedroom one: head on the pillow, body under a sheet)
export function hospitalPatient(g, o = {}) {
  const r = 26 * 1.67, hx = HB.x + 76, hy = HB.top - 28;
  rr(g, HB.x + 92, HB.top - 28, 46, 40, 16); g.fillStyle = o.collar || '#ffd400'; g.fill();
  circle(g, hx + r * 0.08, hy - r * 0.06, r * 1.03, o.rim || '#e6f4ff'); circle(g, hx, hy, r, '#0a0c16');
  if (o.drawFace) { g.save(); g.translate(hx, hy); g.rotate(-Math.PI / 2); o.drawFace(g, r); g.restore(); }
  if (o.electrodes) for (const [dx, dy] of [[-12, -30], [10, -34], [24, -20]]) { circle(g, hx + dx, hy + dy, 5, '#e0e4ea'); seg(g, [[hx + dx, hy + dy], [hx + dx - 40, hy - 120], [MON.x, MON.y + 120]], 2, alpha('#e0e4ea', 0.5)); }
  g.beginPath(); g.moveTo(HB.x + 104, HB.top + 6);
  g.quadraticCurveTo(HB.x + 140, HB.top - 40, HB.x + 260, HB.top - 36); g.quadraticCurveTo(HB.x + 400, HB.top - 30, HB.x + 470, HB.top - 22);
  g.quadraticCurveTo(HB.x + 520, HB.top - 26, HB.x + HB.w + 8, HB.top - 4); g.lineTo(HB.x + HB.w + 12, HB.top + 60); g.lineTo(HB.x + 100, HB.top + 60); g.closePath();
  g.fillStyle = linGrad(g, 0, HB.top - 50, 0, HB.top + 60, ['#dfe8f0', '#b8c4d0', '#98a4b4']); g.fill();
}

// ---- doctor's office, 1980s Italy: warm desk lamp, diplomas, a window to the street
export const DESK = { x: 760, w: 520, top: GY - 150 };
export function office(g, t, cam) {
  const wall = '#6a5a48';
  layer(g, cam, 0.75, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(wall, -0.45), wall, shade(wall, 0.05)]); g.fillRect(-E.W, -E.H * 2, E.W * 4, GY + E.H * 2 + 20);
    for (const [x, y] of [[820, 300], [1000, 300], [910, 160]]) { rr(g, x, y, 130, 100, 4); g.fillStyle = '#3a2a1e'; g.fill(); rr(g, x + 10, y + 10, 110, 80, 2); g.fillStyle = '#efe6d2'; g.fill(); seg(g, [[x + 25, y + 40], [x + 105, y + 40]], 4, '#8a7a5a'); seg(g, [[x + 25, y + 60], [x + 85, y + 60]], 4, '#8a7a5a'); }
    FX.windowFrame(g, { x: 1380, y: 220, w: 360, h: 380, cols: 2, rows: 2, frame: shade(wall, -0.5), bar: 12 }, (g, x, y, w, h) => {
      g.fillStyle = linGrad(g, 0, y, 0, y + h, ['#e8a070', '#f4c890']); g.fillRect(x, y, w, h);
      FX.skyline(g, { x, y: y + h, w, minH: 60, maxH: h * 0.5, color: '#9a6a5a', windowColor: alpha('#ffe0a0', 0.6), lit: 0.3, seed: 5 });
    });
    rr(g, 300, 260, 300, 480, 8); g.fillStyle = shade(wall, -0.3); g.fill();                                   // bookcase
    const r = rng(3); for (let row = 0; row < 4; row++) { let bx = 316; while (bx < 584) { const bw = 16 + r() * 16, bh = 70 + r() * 30; rr(g, bx, 260 + 20 + row * 116 + (100 - bh), bw, bh, 2); g.fillStyle = ['#7a3a2a', '#3a5a6a', '#b0904a', '#4a4a6a', '#6a7a4a'][Math.floor(r() * 5)]; g.fill(); bx += bw + 3; } g.fillStyle = shade(wall, -0.5); g.fillRect(304, 380 + row * 116, 292, 8); }
  });
  layer(g, cam, 1, (g) => {
    floorBand(g, '#4a3a30');
    rr(g, DESK.x, DESK.top, DESK.w, 24, 6); g.fillStyle = '#4a3020'; g.fill();
    g.fillStyle = '#3a2418'; g.fillRect(DESK.x + 20, DESK.top + 24, 160, GY - DESK.top - 24); g.fillRect(DESK.x + DESK.w - 40, DESK.top + 24, 20, GY - DESK.top - 24);
    seg(g, [[DESK.x + 440, DESK.top], [DESK.x + 420, DESK.top - 120], [DESK.x + 380, DESK.top - 140]], 6, '#1e1612'); rr(g, DESK.x + 344, DESK.top - 160, 60, 32, 12); g.fillStyle = '#2a6a3a'; g.fill();
    FX.lightCone(g, DESK.x + 372, DESK.top - 132, { angle: Math.PI / 2, spread: 0.6, len: 140, color: '#ffd59a', a: 0.25 }); glow(g, DESK.x + 372, DESK.top - 130, 50, '#ffd59a', 0.6);
    rr(g, DESK.x + 200, DESK.top - 8, 110, 8, 2); g.fillStyle = '#f2ece0'; g.fill();                            // paper
  });
  return { rim: '#ffd09a', rimDir: [1, -0.4] };
}

// ---- Venice, 1765: sepia candlelit room, a window onto a canal
export function venice(g, t, cam) {
  const wall = '#5a4030';
  layer(g, cam, 0.75, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(wall, -0.55), wall, shade(wall, -0.1)]); g.fillRect(-E.W, -E.H * 2, E.W * 4, GY + E.H * 2 + 20);
    FX.windowFrame(g, { x: 1300, y: 180, w: 340, h: 460, cols: 2, rows: 3, frame: '#2a1a10', bar: 12, arch: true }, (g, x, y, w, h) => {
      g.fillStyle = linGrad(g, 0, y, 0, y + h, ['#2a2040', '#6a5070', '#c09070']); g.fillRect(x, y, w, h);
      for (let i = 0; i < 4; i++) { const bx = x + i * 90 - 20; rr(g, bx, y + h * 0.45 - (i % 2) * 40, 80, 400, 4); g.fillStyle = ['#7a5a48', '#6a4a40', '#8a6a50', '#5a4038'][i]; g.fill(); for (let k = 0; k < 3; k++) { rr(g, bx + 16, y + h * 0.5 + k * 50 - (i % 2) * 40, 18, 28, 8); g.fillStyle = alpha('#ffcf8a', 0.7); g.fill(); } }
      g.fillStyle = '#2a3a4a'; g.fillRect(x, y + h * 0.82, w, h * 0.2);
      for (let k = 0; k < 6; k++) { g.fillStyle = alpha('#ffcf8a', 0.25); g.fillRect(x + 30 + k * 50 + Math.sin(t * 2 + k) * 6, y + h * 0.86 + (k % 2) * 10, 24, 3); }
    });
    rr(g, 460, 280, 180, 230, 6); g.fillStyle = '#3a2818'; g.fill(); rr(g, 474, 294, 152, 202, 4); g.fillStyle = '#8a6a48'; g.fill();   // a portrait
    circle(g, 550, 370, 40, '#2a1a10'); g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(550, 480, 70, 60, 0, Math.PI, Math.PI * 2); g.fill();
  });
  layer(g, cam, 1, (g) => {
    floorBand(g, '#3a2818');
    rr(g, 640, GY - 150, 600, 48, 14); g.fillStyle = '#c8b090'; g.fill();                                       // old bed
    rr(g, 620, GY - 330, 40, 330, 10); g.fillStyle = '#3a2214'; g.fill(); g.fillStyle = '#2a180e'; g.fillRect(640, GY - 104, 600, 30);
    rr(g, 1180, GY - 250, 120, 250, 8); g.fillStyle = '#3a2214'; g.fill();                                     // side table + candle
    rr(g, 1228, GY - 300, 20, 50, 4); g.fillStyle = '#f2e6cc'; g.fill();
    const fl = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7) * 0.05; g.save(); g.translate(1238, GY - 312); g.scale(fl, fl); poly(g, [[0, -24], [8, 0], [0, 6], [-8, 0]], '#ffd27a'); g.restore();
    glow(g, 1238, GY - 312, 260 * fl, '#ffb050', 0.45);
  });
  return { rim: '#ffb060', rimDir: [1, -0.5] };
}

// ---- lab rat in a cage (insert)
export function ratCage(g, t, cx, cy, s = 1, o = {}) {
  const w = 620 * s, h = 360 * s, x = cx - w / 2, y = cy - h / 2;
  rr(g, x, y + h - 40 * s, w, 40 * s, 8 * s); g.fillStyle = '#c8b898'; g.fill();
  g.strokeStyle = '#a8b0bc'; g.lineWidth = 4 * s; for (let k = 0; k <= 20; k++) { g.beginPath(); g.moveTo(x + (k * w) / 20, y); g.lineTo(x + (k * w) / 20, y + h - 40 * s); g.stroke(); }
  rr(g, x - 6, y - 10 * s, w + 12, 14 * s, 6); g.fillStyle = '#8a92a0'; g.fill();
  const wx = x + w * 0.72, wy = y + h * 0.5, wr = 110 * s, spin = t * (o.spin ?? 6);      // exercise wheel
  ring(g, wx, wy, wr, 6 * s, '#7a8494'); for (let k = 0; k < 8; k++) { const a = spin + (k * Math.PI) / 4; seg(g, [[wx, wy], [wx + Math.cos(a) * wr, wy + Math.sin(a) * wr]], 3 * s, '#7a8494'); }
  const rx = x + w * 0.32 + Math.sin(t * 5) * 6 * s, ry = y + h - 70 * s;                        // the rat
  g.fillStyle = '#e8e4ea'; g.beginPath(); g.ellipse(rx, ry, 64 * s, 34 * s, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(rx + 62 * s, ry - 8 * s, 30 * s, 22 * s, -0.3, 0, Math.PI * 2); g.fill();
  circle(g, rx + 48 * s, ry - 32 * s, 12 * s, '#f0c8d0'); circle(g, rx + 78 * s, ry - 14 * s, 6 * s, '#1a1622');
  circle(g, rx + 92 * s, ry - 4 * s, 5 * s, '#f09aa8');
  g.strokeStyle = '#f0c8d0'; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(rx - 60 * s, ry + 6 * s); g.quadraticCurveTo(rx - 130 * s, ry + 30 * s, rx - 150 * s, ry - 10 * s); g.stroke();
}
