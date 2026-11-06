// sets/week.js — the week without sleep: kitchen (day 1), desk (day 3), street (day 5), bathroom mirror (day 7).
// All share the bedroom's floor line GY so the hero's scale HS is the same everywhere.
import { E, mood, layer, rr, seg, circle, ring, poly, linGrad, glow, alpha, shade, mix, text, clamp, ease, prog, rng, FONTS } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { GY } from './bedroom.js';

const floorBand = (g, c) => { g.fillStyle = linGrad(g, 0, GY, 0, GY + 420, [shade(c, 0.1), shade(c, -0.2)]); g.fillRect(-E.W, GY, E.W * 4, E.H * 3); };

// ---- kitchen, early morning: warm sun through the window on the left
export function kitchen(g, t, cam) {
  const M = mood('interiorWarm'), wall = mix('#6a5068', M.wall, 0.4);
  layer(g, cam, 0.75, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(wall, -0.4), wall, shade(wall, 0.08)]); g.fillRect(-E.W, -E.H * 2, E.W * 4, GY + E.H * 2 + 20);
    FX.windowFrame(g, { x: 250, y: 220, w: 380, h: 380, cols: 2, rows: 2, frame: shade(wall, -0.5), bar: 12 }, (g, x, y, w, h) => {
      g.fillStyle = linGrad(g, 0, y, 0, y + h, ['#8fb4e0', '#d8c4d8', '#f6d2a8']); g.fillRect(x, y, w, h);
      circle(g, x + w * 0.7, y + h * 0.72, 44, '#fff1d0'); glow(g, x + w * 0.7, y + h * 0.72, 220, '#ffd9a0', 0.7);
      FX.skyline(g, { x, y: y + h, w, minH: 30, maxH: h * 0.3, color: '#7a6a8a', windowColor: alpha('#fff', 0.2), lit: 0.1, seed: 2 });
    });
    rr(g, 230, 600, 420, 16, 4); g.fillStyle = shade(wall, -0.35); g.fill();
    for (let i = 0; i < 4; i++) { rr(g, 860 + i * 200, 250, 188, 170, 8); g.fillStyle = shade(wall, -0.22); g.fill(); rr(g, 860 + i * 200 + 80, 398, 28, 6, 3); g.fillStyle = shade(wall, 0.2); g.fill(); }
    g.fillStyle = shade(wall, 0.14); g.fillRect(840, 440, 840, 250);                                           // backsplash tiles
    g.strokeStyle = alpha('#000', 0.08); g.lineWidth = 2; for (let x = 840; x <= 1680; x += 60) { g.beginPath(); g.moveTo(x, 440); g.lineTo(x, 690); g.stroke(); } for (let y = 440; y <= 690; y += 50) { g.beginPath(); g.moveTo(840, y); g.lineTo(1680, y); g.stroke(); }
  });
  layer(g, cam, 1, (g) => {
    floorBand(g, mix('#4a3a4a', M.floor, 0.5));
    g.strokeStyle = alpha('#000', 0.12); g.lineWidth = 2; for (let x = -E.W; x < E.W * 3; x += 120) { g.beginPath(); g.moveTo(x, GY); g.lineTo(x - 180, GY + 400); g.stroke(); }
    const base = shade(wall, -0.32);
    rr(g, 840, GY - 168, 840, 168, 6); g.fillStyle = base; g.fill();
    for (let i = 0; i < 4; i++) { rr(g, 856 + i * 206, GY - 150, 190, 136, 6); g.fillStyle = shade(base, 0.1); g.fill(); circle(g, 856 + i * 206 + 170, GY - 82, 5, shade(base, 0.5)); }
    rr(g, 826, GY - 182, 868, 20, 6); g.fillStyle = '#d9d2c8'; g.fill();                                      // countertop
    rr(g, 1450, GY - 300, 130, 118, 12); g.fillStyle = '#2a2430'; g.fill(); rr(g, 1478, GY - 238, 74, 56, 10); g.fillStyle = alpha('#9a6a3a', 0.85); g.fill();   // coffee machine
    circle(g, 1556, GY - 272, 7, '#ff5a4a'); glow(g, 1556, GY - 272, 30, '#ff5a4a', 0.6);
    rr(g, 1290, GY - 250, 90, 68, 22); g.fillStyle = '#c8c4d8'; g.fill(); seg(g, [[1380, GY - 236], [1410, GY - 220]], 10, '#c8c4d8');     // kettle
    rr(g, 1720, 280, 250, GY - 280, 14); g.fillStyle = '#d4d0e0'; g.fill(); seg(g, [[1745, 360], [1745, 470]], 8, '#9a96aa'); seg(g, [[1745, 560], [1745, 700]], 8, '#9a96aa');   // fridge
    FX.pool(g, 880, GY + 40, 420, 46, '#ffd9a0', 0.22);
  });
  layer(g, cam, 0.9, (g) => { FX.godRays(g, 520, 420, { angle: 0.55, spread: 0.45, len: 1300, color: '#ffd9a0', a: 0.07, t, count: 6 }); FX.dust(g, t, { area: [500, 300, 900, 500], count: 40, color: '#ffe9c8', a: 0.4, speed: 6 }); });
  return { M, rim: '#ffd09a', rimDir: [-1, -0.3] };
}

// ---- home desk at night: one desk lamp, the laptop glow on his face
export function desk(g, t, cam) {
  const M = mood('interiorCool'), wall = mix('#2c4048', M.wall, 0.5);
  layer(g, cam, 0.75, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(wall, -0.45), wall, shade(wall, 0.06)]); g.fillRect(-E.W, -E.H * 2, E.W * 4, GY + E.H * 2 + 20);
    rr(g, 280, 380, 420, 18, 4); g.fillStyle = shade(wall, -0.4); g.fill();                                    // bookshelf
    const r = rng(11); let bx = 300; while (bx < 680) { const bw = 20 + r() * 22, bh = 70 + r() * 60; rr(g, bx, 380 - bh, bw, bh, 3); g.fillStyle = ['#7a4a5a', '#3a6a7a', '#c0a060', '#5a5a8a'][Math.floor(r() * 4)]; g.fill(); bx += bw + 4; }
    rr(g, 1380, 240, 230, 300, 8); g.fillStyle = shade(wall, -0.3); g.fill(); rr(g, 1396, 256, 198, 268, 4); g.fillStyle = mix('#c08060', wall, 0.55); g.fill();   // a poster
    poly(g, [[1396, 524], [1460, 420], [1510, 470], [1560, 400], [1594, 524]], mix('#5a3a4a', wall, 0.4));
  });
  layer(g, cam, 1, (g) => {
    floorBand(g, mix('#22303a', M.floor, 0.5));
    rr(g, 760, GY - 160, 640, 22, 6); g.fillStyle = '#3a2e2a'; g.fill();                                       // desk top
    g.fillStyle = '#2a201e'; g.fillRect(780, GY - 140, 18, 140); g.fillRect(1362, GY - 140, 18, 140); g.fillRect(1180, GY - 140, 180, 90);
    seg(g, [[1330, GY - 160], [1300, GY - 300], [1250, GY - 330]], 7, '#1a1416'); rr(g, 1210, GY - 352, 70, 36, 14); g.fillStyle = '#1a1416'; g.fill();   // desk lamp
    FX.lightCone(g, 1245, GY - 320, { angle: Math.PI / 2 + 0.25, spread: 0.55, len: 260, color: '#ffd59a', a: 0.22 }); glow(g, 1245, GY - 322, 60, '#ffd59a', 0.7);
    FX.pool(g, 1160, GY - 156, 200, 14, '#ffd59a', 0.35);
    rr(g, 1020, GY - 172, 170, 14, 4); g.fillStyle = '#9aa0b4'; g.fill();                                       // laptop base
    seg(g, [[1030, GY - 170], [988, GY - 300]], 10, '#7a8094');                                                   // screen, seen edge-on
    FX.lightCone(g, 990, GY - 240, { angle: Math.PI, spread: 0.7, len: 260, color: '#9fd8ff', a: 0.18 });
  });
  return { M, rim: '#9fd8ff', rimDir: [1, -0.2] };
}

// the laptop screen: a message being typed with two words swapped, then flagged with red squiggles
export function laptopScreen(g, t, cx, cy, o = {}) {
  const to = o.to || 'Para: Jefe', lines = o.lines || ['¡Buenos días! Ahora me tomo', 'el informe y envío el café.'];
  const marks = o.marks || [[1, 'el ', 'informe'], [1, 'el informe y envío el ', 'café']];
  const w = 1180, h = 700, x = cx - w / 2, y = cy - h / 2, fs = 60;
  glow(g, cx, cy, 900, '#9fd8ff', 0.18);
  rr(g, x - 26, y - 26, w + 52, h + 52, 30); g.fillStyle = '#1a1c24'; g.fill();
  rr(g, x, y, w, h, 10); g.fillStyle = '#eef1f8'; g.fill();
  rr(g, x, y, w, 64, 10); g.fillStyle = '#d6dcec'; g.fill(); ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => circle(g, x + 34 + i * 30, y + 32, 9, c));
  text(g, to, x + 60, y + 130, { size: 34, font: FONTS.ui, weight: 800, color: '#6a7088', align: 'left' });
  const all = lines.join('\n'), n = Math.floor(clamp(t / (o.typeDur || 0.75)) * all.length), shown = all.slice(0, n).split('\n');
  shown.forEach((ln, i) => text(g, ln, x + 60, y + 250 + i * 90, { size: fs, font: FONTS.ui, weight: 900, color: '#1a1e2e', align: 'left' }));
  if ((t * 2) % 1 < 0.6 || n < all.length) { const last = shown.length - 1; g.font = `900 ${fs}px "${FONTS.ui}"`; const cw = g.measureText(shown[last] || '').width; g.fillStyle = '#2a6aff'; g.fillRect(x + 64 + cw, y + 212 + last * 90, 5, 70); }
  const sq = ease.out(prog(t, o.flagAt || 0.82, (o.flagAt || 0.82) + 0.18));
  if (sq > 0) {
    g.font = `900 ${fs}px "${FONTS.ui}"`;
    for (const [li, pre, word] of marks) { const mx = x + 60 + g.measureText(pre).width, mw = g.measureText(word).width, ly = y + 250 + li * 90 + 38;
      g.strokeStyle = '#ff3b30'; g.lineWidth = 5; g.beginPath(); for (let k = 0; k <= mw * sq; k += 8) g.lineTo(mx + k, ly + Math.sin(k / 6) * 5); g.stroke(); }
  }
}

// ---- street, overcast day: facades, lamp posts, trees; built wide so the camera can track along it
export function street(g, t, cam, o = {}) {
  const M = mood('day'), dusk = o.dusk || 0;
  layer(g, cam, 0.15, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, dusk ? ['#3a2a5a', '#b06a6a', '#f0a868'] : ['#7a8aa8', '#b8c0d0', '#d8d4d8']); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 40); FX.clouds(g, { y: 140, h: 160, color: '#ffffff', a: 0.25, seed: 4 }); });
  layer(g, cam, 0.4, (g) => FX.skyline(g, { x: -E.W * 2, y: GY - 150, w: E.W * 6, minH: 160, maxH: 420, color: '#8a90a8', windowColor: alpha('#fff', 0.15), lit: 0.2, seed: 13 }));
  layer(g, cam, 0.75, (g) => {
    const cols = ['#a88a7a', '#8a7a9a', '#b89a78', '#7a8a9a', '#9a7a7a'];
    for (let i = -4; i < 14; i++) FX.facade(g, { x: i * 420, y: GY - 80, w: 400, h: 520 + ((i * 97) % 3) * 70, color: cols[((i % 5) + 5) % 5], win: dusk ? '#ffcf8a' : '#d8e0f0', dark: '#4a4a5a', cols: 4, rows: 4, lit: dusk ? 0.55 : 0.35, seed: 20 + i, door: i % 2 === 0 });
  });
  layer(g, cam, 1, (g) => {
    g.fillStyle = '#9a96a4'; g.fillRect(-E.W * 2, GY - 80, E.W * 6, 80);                                       // sidewalk
    g.strokeStyle = alpha('#000', 0.12); g.lineWidth = 2; for (let x = -E.W * 2; x < E.W * 4; x += 150) { g.beginPath(); g.moveTo(x, GY - 80); g.lineTo(x, GY); g.stroke(); }
    g.fillStyle = '#5a5a68'; g.fillRect(-E.W * 2, GY, E.W * 6, E.H * 3);                                       // road
    g.fillStyle = '#c8c4b0'; for (let x = -E.W * 2; x < E.W * 4; x += 260) g.fillRect(x, GY + 120, 130, 12);
    for (let i = -3; i < 10; i++) { FX.lampPost(g, i * 700 + 200, GY - 80, 380, { on: !!dusk, color: '#2a2a34' }); FX.tree(g, i * 700 + 520, GY - 80, 1.4, '#4a6a4a'); }
  });
  return { M, rim: '#ffffff', rimDir: [-0.6, -0.8] };
}

// ---- bathroom at night: one flickering bar light over the mirror
export function bathroom(g, t, cam, o = {}) {
  const flick = o.flicker ?? 1;
  layer(g, cam, 0.8, (g) => {
    g.fillStyle = '#b8c4d0'; g.fillRect(-E.W, -E.H, E.W * 4, E.H * 3);
    g.strokeStyle = alpha('#5a6a80', 0.35); g.lineWidth = 3; for (let x = -E.W; x < E.W * 3; x += 90) { g.beginPath(); g.moveTo(x, -E.H); g.lineTo(x, E.H * 2); g.stroke(); } for (let y = -E.H; y < E.H * 2; y += 90) { g.beginPath(); g.moveTo(-E.W, y); g.lineTo(E.W * 3, y); g.stroke(); }
    rr(g, 600, 70, 720, 26, 12); g.fillStyle = mix('#5a6070', '#f4fbff', flick); g.fill(); glow(g, 960, 84, 520, '#e6f4ff', 0.55 * flick);   // bar light
    rr(g, 560, 130, 800, 700, 26); g.fillStyle = '#7a8494'; g.fill();                                           // mirror frame
    rr(g, 584, 154, 752, 652, 16); g.fillStyle = linGrad(g, 0, 154, 0, 806, ['#5a6a80', '#3a4658']); g.fill();     // mirror glass (reflected room, darker)
    g.save(); rr(g, 584, 154, 752, 652, 16); g.clip();
    g.strokeStyle = alpha('#9aa8bc', 0.25); g.lineWidth = 3; for (let x = 520; x < 1400; x += 80) { g.beginPath(); g.moveTo(x, 140); g.lineTo(x, 820); g.stroke(); }
    o.reflection?.(g);
    g.fillStyle = alpha('#ffffff', 0.08); poly(g, [[700, 154], [820, 154], [620, 806], [584, 806], [584, 600]], alpha('#ffffff', 0.08));
    g.restore();
  });
  layer(g, cam, 1, (g) => {
    rr(g, 600, 830, 720, 70, 20); g.fillStyle = '#e8eef6'; g.fill(); rr(g, 900, 812, 120, 26, 8); g.fillStyle = '#a8b0bc'; g.fill();   // sink
    g.fillStyle = '#d0d8e2'; g.fillRect(-E.W, 900, E.W * 4, E.H * 2);
  });
  return { flick };
}
