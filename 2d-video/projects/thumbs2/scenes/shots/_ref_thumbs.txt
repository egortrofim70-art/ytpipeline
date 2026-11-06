// thumbs.js — three YouTube thumbnail concepts, drawn with the same hero and sets as the video.
// Rules (what-if-stickmen/references/thumbnail.md): ¾ dark, only hero + text + 1–2 glowing objects lit;
// 2–4 words, never on a face; a number as the hook (red vs green); bottom-right corner kept calm.
import { E, registerShot, layer, blurLayer, veil, rr, seg, circle, text, measure, glow, alpha, linGrad } from '/engine/core.js';
import { bigFace } from '/engine/rig2d.js';
import { bathroom } from '../sets/week.js';
import { topDown, TD } from '../sets/topdown.js';
import { HERO } from '../cast.js';

const YEL = '#fce011', WHITE = '#fdfdfd', RED = '#e0141c', GREEN = '#29ce32', INK = '#030103';
const camAt = (cx, cy, z) => ({ z, x: cx - E.W / 2, y: cy - E.H / 2 });

// headline: ultra-bold condensed caps, thick black outline + hard drop shadow down-right, slight tilt
function headline(g, rows, x, y, rot = -0.05, align = 'left') {
  g.save(); g.translate(x, y); g.rotate(rot);
  let yy = 0;
  for (const [str, col, size] of rows) {
    const o = { size, font: 'Anton', weight: 400, align, base: 'top', spacing: 1 };
    text(g, str, size * 0.06, yy + size * 0.07, { ...o, color: INK, stroke: size * 0.2, strokeColor: INK });
    text(g, str, 0, yy, { ...o, color: col, stroke: size * 0.16, strokeColor: INK });
    yy += size * 1.14;
  }
  g.restore();
}
// red LED display with a dark bezel; light spills onto whatever is near
function led(g, cx, cy, str, sub, col = RED, size = 170) {
  g.font = `400 ${size}px "Anton"`; const w = Math.max(g.measureText(str).width + 90, 320), h = size * 1.25 + (sub ? 56 : 0);
  glow(g, cx, cy, w * 0.9, col, 0.45);
  rr(g, cx - w / 2 - 14, cy - h / 2 - 14, w + 28, h + 28, 22); g.fillStyle = '#14161c'; g.fill();
  rr(g, cx - w / 2, cy - h / 2, w, h, 14); g.fillStyle = '#050304'; g.fill();
  text(g, str, cx, cy - (sub ? 26 : 0), { size, font: 'Anton', weight: 400, color: col, glow: 40, glowColor: alpha(col, 0.9) });
  if (sub) text(g, sub, cx, cy + h / 2 - 40, { size: 40, font: 'Anton', weight: 400, color: alpha(col, 0.95), spacing: 4 });
}
// small rounded neon sign above a head
function neon(g, cx, cy, str, col) {
  g.font = `400 96px "Anton"`; const w = g.measureText(str).width + 70, h = 130;
  glow(g, cx, cy, w * 0.8, col, 0.4);
  rr(g, cx - w / 2, cy - h / 2, w, h, 30); g.fillStyle = alpha('#04140a', 0.85); g.fill(); g.lineWidth = 8; g.strokeStyle = col; g.stroke();
  text(g, str, cx, cy + 2, { size: 96, font: 'Anton', weight: 400, color: col, glow: 26, glowColor: alpha(col, 0.9) });
}
// bloodshot whites, clipped to each eyeball (eye geometry of rig2d face(): ±0.34r, −0.16r, radius 0.2r·eyeSize)
function veins(g, cx, cy, r, eyeSize = 1) {
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 0.34 * r, ey = cy - 0.16 * r, er = 0.2 * r * eyeSize;
    g.save(); g.beginPath(); g.arc(ex, ey, er, 0, Math.PI * 2); g.clip();
    g.strokeStyle = alpha('#d81a20', 0.75); g.lineWidth = Math.max(2, r * 0.012); g.lineCap = 'round';
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.3 * sx; g.beginPath(); let px = ex + Math.cos(a) * er, py = ey + Math.sin(a) * er; g.moveTo(px, py);
      for (let q = 1; q <= 4; q++) { const d = er * (1 - q * 0.16); px = ex + Math.cos(a + Math.sin(q * 2.3 + k) * 0.25) * d; py = ey + Math.sin(a + Math.sin(q * 1.7 + k) * 0.25) * d; g.lineTo(px, py); } g.stroke(); }
    g.restore();
  }
}
// the YouTube timer sits bottom-right: keep that corner dark and empty
function calmCorner(g) { const gr = g.createRadialGradient(E.W, E.H, 0, E.W, E.H, 520); gr.addColorStop(0, 'rgba(2,2,6,.92)'); gr.addColorStop(1, 'rgba(2,2,6,0)'); g.fillStyle = gr; g.fillRect(E.W - 600, E.H - 600, 600, 600); }
const WRECK = { eyes: 'ball', brows: 'worried', mouth: 'wavy', eyeSize: 1.25, pupil: 0.22, bags: 1 };

// T1 — "¿ESE SOY YO?": the hero (DÍA 1, green) looks into the mirror; the reflection is him at DÍA 180 (red)
registerShot('t1', { draw(g) {
  const cam = { z: 1.05, x: -300, y: 20 };
  bathroom(g, 0, cam, { flicker: 0.75, reflection: (g) => {
    g.fillStyle = 'rgba(6,8,20,.35)'; g.fillRect(584, 154, 752, 652);
    bigFace(g, 960, 600, 232, { outfit: HERO, face: WRECK, look: [-0.7, 0.05], rimColor: '#ff5a5a', rimSide: -1 });
  } });
  veil(g, '#05060f', 0.68);
  // reflection eyes are inside the layer transform: recompute their screen position (wall depth 0.8)
  const zf = 1 + (cam.z - 1) * 0.8, toS = (px, py) => [(px - E.W / 2 - cam.x * 0.8) * zf + E.W / 2, (py - E.H / 2 - cam.y * 0.8) * zf + E.H / 2];
  const [rx, ry] = toS(960, 600); veins(g, rx, ry, 232 * zf, 1.25);
  glow(g, rx, ry, 360, RED, 0.25);
  const [lx, ly] = toS(960, 250); led(g, lx, ly, 'DÍA 180', null, RED, 120);
  bigFace(g, 430, 790, 300, { outfit: HERO, face: { eyes: 'ball', brows: 'raised', mouth: 'oBig', eyeSize: 1.15, pupil: 0.4 }, look: [0.85, -0.1], rimColor: '#ffd400', rimSide: 1 });
  neon(g, 430, 405, 'DÍA 1', GREEN);
  headline(g, [['¿ESE', WHITE, 105], ['SOY YO?', YEL, 140]], 55, 22, -0.05);
  calmCorner(g);
} });

// T2 — "NUNCA MÁS": from the ceiling, wide-awake bloodshot eyes on the pillow; a red LED: 547 DÍAS SIN DORMIR
registerShot('t2', { draw(g) {
  const z = 3.8, hx = 760, hy = 610, cam = { z, x: (TD.head.x - E.W / 2) - (hx - E.W / 2) / z, y: (TD.head.y - E.H / 2) - (hy - E.H / 2) / z };
  topDown(g, 0, cam, { face: WRECK, look: [0.15, -0.05] });
  veil(g, '#04050c', 0.62);
  const r = TD.head.r * z; veins(g, hx, hy, r, 1.25);
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = linGrad(g, E.W, 0, 0, 0, [alpha(RED, 0.8), alpha(RED, 0)]); g.fillRect(0, 0, E.W, E.H); g.restore();
  led(g, 1500, 300, '547', 'DÍAS SIN DORMIR', RED, 200);
  headline(g, [['NUNCA', WHITE, 140], ['MÁS', YEL, 200]], 60, 26, -0.06);
  calmCorner(g);
} });

// T3 — "ESTO ES REAL": left asleep in green light (8 H), right wrecked in red light (0 H)
registerShot('t3', { draw(g) {
  g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(1010, 0); g.lineTo(910, E.H); g.lineTo(0, E.H); g.clip();
  const z = 3.0, hx = 470, hy = 640;
  topDown(g, 0, { z, x: (TD.head.x - E.W / 2) - (hx - E.W / 2) / z, y: (TD.head.y - E.H / 2) - (hy - E.H / 2) / z }, { face: { eyes: 'closed', brows: null, mouth: 'smile' } });
  veil(g, '#020a04', 0.45); g.globalCompositeOperation = 'soft-light'; g.fillStyle = alpha(GREEN, 0.55); g.fillRect(0, 0, E.W, E.H); g.globalCompositeOperation = 'source-over';
  neon(g, hx, 300, '8 H', GREEN); g.restore();
  g.save(); g.beginPath(); g.moveTo(1010, 0); g.lineTo(E.W, 0); g.lineTo(E.W, E.H); g.lineTo(910, E.H); g.clip();
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#14040a', '#2a0610', '#0a0206']); g.fillRect(0, 0, E.W, E.H); glow(g, 1450, 640, 700, RED, 0.28);
  bigFace(g, 1420, 680, 285, { outfit: HERO, face: WRECK, look: [-0.2, 0], rimColor: '#ff5a5a', rimSide: -1 }); veins(g, 1420, 680, 285, 1.25);
  led(g, 1420, 280, '0 H', null, RED, 120); calmCorner(g); g.restore();
  seg(g, [[1010, -10], [910, E.H + 10]], 14, INK); seg(g, [[1010, -10], [910, E.H + 10]], 6, WHITE);
  headline(g, [['ESTO ES', WHITE, 120], ['REAL', YEL, 170]], E.W / 2 - 40, 20, -0.05, 'center');
} });
