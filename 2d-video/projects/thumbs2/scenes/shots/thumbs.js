// thumbs.js — YouTube thumbnails for hunger-ru, sugar-es and water-ru (2 each), drawn with the videos' own sets and hero.
// Rules (what-if-stickmen/references/thumbnail.md): ¾ dark, only hero + text + 1–2 glowing objects lit; 2–4 words, never on a face;
// a number as the hook (red vs green); bottom-right corner kept calm (YouTube timer).
import { E, registerShot, layer, blurLayer, veil, rr, seg, circle, ring, poly, text, glow, alpha, linGrad, shade } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { bigFace, drawFigure, POSES } from '/engine/rig2d.js';
import { kitchen } from '../sets/week.js';
import { office } from '../sets/places.js';
import { FR, fridgeOpen, fatMan } from '../sets/hunger.js';
import { GY, HS } from '../sets/bedroom.js';
import { HERO } from '../cast.js';
import { icon } from './_tpl_sci.js';

const YEL = '#fce011', WHITE = '#fdfdfd', RED = '#e0141c', GREEN = '#29ce32', BLUE = '#3aa8ff', PINK = '#ff4fa0', INK = '#030103', HF = 'Oswald';
const camAt = (cx, cy, z) => ({ z, x: cx - E.W / 2, y: cy - E.H / 2 });

// ultra-bold condensed caps, thick black outline + hard drop shadow, slight tilt
function headline(g, rows, x, y, rot = -0.05, align = 'left') {
  g.save(); g.translate(x, y); g.rotate(rot);
  let yy = 0;
  for (const [str, col, size] of rows) {
    const o = { size, font: HF, weight: 700, align, base: 'top', spacing: 1 };
    text(g, str, size * 0.06, yy + size * 0.07, { ...o, color: INK, stroke: size * 0.2, strokeColor: INK });
    text(g, str, 0, yy, { ...o, color: col, stroke: size * 0.15, strokeColor: INK });
    yy += size * 1.12;
  }
  g.restore();
}
function led(g, cx, cy, str, sub, col = RED, size = 170) {
  g.font = `700 ${size}px "${HF}"`; const w = Math.max(g.measureText(str).width + 90, 300), h = size * 1.3 + (sub ? 56 : 0);
  glow(g, cx, cy, w * 0.9, col, 0.45);
  rr(g, cx - w / 2 - 14, cy - h / 2 - 14, w + 28, h + 28, 22); g.fillStyle = '#14161c'; g.fill();
  rr(g, cx - w / 2, cy - h / 2, w, h, 14); g.fillStyle = '#050304'; g.fill();
  text(g, str, cx, cy - (sub ? 26 : 0), { size, font: HF, weight: 700, color: col, glow: 40, glowColor: alpha(col, 0.9) });
  if (sub) text(g, sub, cx, cy + h / 2 - 40, { size: 40, font: HF, weight: 700, color: alpha(col, 0.95), spacing: 3 });
}
function tag(g, cx, cy, str, col, size = 96) {
  g.font = `700 ${size}px "${HF}"`; const w = g.measureText(str).width + 70, h = size * 1.35;
  glow(g, cx, cy, w * 0.8, col, 0.4);
  rr(g, cx - w / 2, cy - h / 2, w, h, 26); g.fillStyle = alpha('#05070a', 0.88); g.fill(); g.lineWidth = 8; g.strokeStyle = col; g.stroke();
  text(g, str, cx, cy + 2, { size, font: HF, weight: 700, color: col, glow: 26, glowColor: alpha(col, 0.9) });
}
function arrow(g, x0, y0, x1, y1, col = YEL, w = 26) {
  const a = Math.atan2(y1 - y0, x1 - x0); seg(g, [[x0, y0], [x1 - Math.cos(a) * 50, y1 - Math.sin(a) * 50]], w + 14, INK); seg(g, [[x0, y0], [x1 - Math.cos(a) * 50, y1 - Math.sin(a) * 50]], w, col);
  g.save(); g.translate(x1, y1); g.rotate(a); poly(g, [[0, 0], [-80, -50], [-80, 50]], INK); poly(g, [[-8, 0], [-70, -38], [-70, 38]], col); g.restore();
}
function calmCorner(g) { const gr = g.createRadialGradient(E.W, E.H, 0, E.W, E.H, 520); gr.addColorStop(0, 'rgba(2,2,6,.92)'); gr.addColorStop(1, 'rgba(2,2,6,0)'); g.fillStyle = gr; g.fillRect(E.W - 600, E.H - 600, 600, 600); }
function vign(g, a = 0.75) { const gr = g.createRadialGradient(E.W * 0.5, E.H * 0.5, 300, E.W * 0.5, E.H * 0.5, 1200); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, E.W, E.H); }
const WRECK = { eyes: 'ball', brows: 'worried', mouth: 'wavy', eyeSize: 1.25, pupil: 0.22, bags: 1 };
const SHOCK = { eyes: 'ball', brows: 'raised', mouth: 'oBig', eyeSize: 1.3, pupil: 0.3 };

// ===================== ЧТО ЕСЛИ ТЫ ПЕРЕСТАНЕШЬ ЕСТЬ? =====================
// H1 — 382 ДНЯ БЕЗ ЕДЫ: Angus before (207 kg, red) → after (82 kg, green), the hero shocked in the corner
registerShot('h1', { draw(g) {
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#0a0410', '#1a0a18', '#05030a']); g.fillRect(0, 0, E.W, E.H);
  glow(g, 560, 640, 620, RED, 0.35); glow(g, 1380, 640, 560, GREEN, 0.3);
  fatMan(g, { x: 560, y: 1110, s: 2.9, fat: 1, color: '#4a7ab8', rim: '#ff7a6a', rimDir: [-1, -0.3], face: WRECK, look: [0.4, 0] });
  fatMan(g, { x: 1380, y: 1110, s: 2.9, fat: 0.08, color: '#4a7ab8', rim: '#7aff8a', rimDir: [1, -0.3], face: { eyes: 'ball', brows: 'raised', mouth: 'smile' }, look: [-0.3, 0] });
  arrow(g, 860, 640, 1160, 600);
  tag(g, 300, 470, '207 КГ', RED, 100); tag(g, 1650, 470, '82 КГ', GREEN, 100);
  headline(g, [['382 ДНЯ', YEL, 170], ['БЕЗ ЕДЫ', WHITE, 120]], 960, 18, -0.03, 'center');
  vign(g, 0.6); calmCorner(g);
} });
// H2 — ТЕЛО ЕСТ СЕБЯ: dark kitchen, the empty fridge blazing cold light on a wrecked hero; red LED «ДЕНЬ 30»
registerShot('h2', { draw(g) {
  const cam = camAt(1560, 560, 1.75);
  kitchen(g, 0, cam);
  layer(g, cam, 1, (g) => fridgeOpen(g, 1));
  veil(g, '#04060c', 0.55); glow(g, 1420, 520, 700, '#bfe0ff', 0.25);
  bigFace(g, 470, 760, 320, { outfit: HERO, face: WRECK, look: [0.8, 0], rimColor: '#cfe6ff', rimSide: 1 });
  led(g, 1520, 900, 'ДЕНЬ 30', null, RED, 120);
  headline(g, [['ТЕЛО ЕСТ', WHITE, 140], ['САМО СЕБЯ', YEL, 160]], 60, 44, -0.05);
  calmCorner(g);
} });

// ===================== ¿Y SI DEJARAS EL AZÚCAR? =====================
// S1 — PEOR QUE LA COCAÍNA: a rat on the sweet bottle (pink glow) vs the ignored cocaine one; LED 94%
registerShot('s1', { draw(g) {
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#05030c', '#120820', '#05030a']); g.fillRect(0, 0, E.W, E.H);
  glow(g, 820, 640, 640, PINK, 0.45);
  for (const [x, col, name, lit] of [[820, PINK, 'AZÚCAR', 1], [1440, '#8a9ab8', 'COCAÍNA', 0]]) {
    rr(g, x - 130, 420, 260, 380, 36); g.fillStyle = alpha(col, lit ? 0.45 : 0.15); g.fill(); g.strokeStyle = col; g.lineWidth = 10; g.stroke();
    seg(g, [[x, 800], [x, 900]], 22, col); text(g, name, x, 370, { size: 70, font: HF, weight: 700, color: col, stroke: 14, strokeColor: INK, glow: lit ? 30 : 0, glowColor: alpha(col, 0.8) });
    if (lit) for (let i = 0; i < 4; i++) { rr(g, x - 90 + (i % 2) * 100, 520 + Math.floor(i / 2) * 110, 80, 80, 10); g.fillStyle = '#ffffff'; g.fill(); }
  }
  g.save(); g.translate(860, 960); g.scale(-3.2, 3.2); icon(g, 'rat', 0, 0, 1, '#e8ecf4', 0); g.restore();
  g.save(); g.translate(1430, 990); g.scale(1.2, 1.2); g.globalAlpha = 0.5; icon(g, 'rat', 0, 0, 1, '#8a9ab8', 0); g.restore();
  led(g, 290, 640, '94%', 'LO ELIGIÓ', PINK, 120);
  headline(g, [['PEOR QUE', WHITE, 110], ['LA COCAÍNA', YEL, 150]], 960, 36, -0.03, 'center');
  vign(g, 0.55); calmCorner(g);
} });
// S2 — 30 DÍAS SIN AZÚCAR: split — left red: soda + a pile of sugar cubes, wrecked face; right green: the hero glowing, happy
registerShot('s2', { draw(g) {
  g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(1000, 0); g.lineTo(900, E.H); g.lineTo(0, E.H); g.clip();
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#14040a', '#2a0610', '#0a0206']); g.fillRect(0, 0, E.W, E.H); glow(g, 450, 620, 600, RED, 0.3);
  bigFace(g, 430, 760, 270, { outfit: HERO, face: WRECK, look: [0.3, 0.2], rimColor: '#ff6a5a', rimSide: -1 });
  g.save(); g.translate(790, 520); g.rotate(0.2); g.scale(2.2, 2.2); icon(g, 'soda', 0, 0, 1, RED, 0); g.restore();
  for (let i = 0; i < 6; i++) { const x = 620 + (i % 3) * 95, y = 980 - Math.floor(i / 3) * 95; rr(g, x - 42, y - 42, 84, 84, 10); g.fillStyle = '#f6f6fa'; g.fill(); g.strokeStyle = '#b8bccc'; g.lineWidth = 4; g.stroke(); }
  tag(g, 430, 330, '40 G', RED, 100); g.restore();
  g.save(); g.beginPath(); g.moveTo(1000, 0); g.lineTo(E.W, 0); g.lineTo(E.W, E.H); g.lineTo(900, E.H); g.clip();
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#03140a', '#062a14', '#020a06']); g.fillRect(0, 0, E.W, E.H); glow(g, 1430, 640, 640, GREEN, 0.35);
  bigFace(g, 1430, 700, 290, { outfit: HERO, face: { eyes: 'happy', brows: 'raised', mouth: 'smile' }, look: [0, 0], rimColor: '#7aff8a', rimSide: 1 });
  for (const [x, y] of [[1120, 420], [1740, 380], [1700, 720], [1150, 760]]) FX.sparkle(g, x, y, 40, '#e8ffd8', 0.95);
  g.save(); g.translate(1760, 560); g.scale(1.6, 1.6); icon(g, 'strawberry', 0, 0, 1, GREEN, 0); g.restore();
  calmCorner(g); g.restore();
  seg(g, [[1000, -10], [900, E.H + 10]], 14, INK); seg(g, [[1000, -10], [900, E.H + 10]], 6, WHITE);
  headline(g, [['30 DÍAS', YEL, 170], ['SIN AZÚCAR', WHITE, 120]], E.W / 2 - 20, 16, -0.03, 'center');
} });

// ===================== ЧТО ЕСЛИ ТЫ ПЕРЕСТАНЕШЬ ПИТЬ ВОДУ? =====================
// W1 — ПИЛ КРОВЬ МЫШЕЙ: Sahara at night, the shrine, bats; red LED «ДЕНЬ 9»
registerShot('w1', { draw(g) {
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#05060f', '#120c1e', '#2a1a20']); g.fillRect(0, 0, E.W, E.H); FX.stars(g, 0, { count: 160 }); FX.moon(g, 1500, 170, 56);
  FX.hills(g, { y: 760, amp: 70, color: '#2a1e24', seed: 5, freq: 0.003 }); g.fillStyle = '#3a2a2a'; g.fillRect(0, 860, E.W, 300);
  rr(g, 540, 520, 760, 440, 8); g.fillStyle = '#4a3a3a'; g.fill(); g.beginPath(); g.arc(920, 520, 300, Math.PI, Math.PI * 2); g.fill(); rr(g, 820, 680, 200, 280, 100); g.fillStyle = '#0c0808'; g.fill();
  glow(g, 920, 760, 380, RED, 0.3);
  for (const [x, y, s] of [[560, 260, 1.6], [760, 180, 1.2], [1180, 230, 1.8], [1360, 330, 1.1], [980, 120, 1.3], [430, 420, 1.0]]) { const w = 60 * s; g.fillStyle = '#050304'; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w / 2, y - 34 * s, x, y); g.quadraticCurveTo(x + w / 2, y - 34 * s, x + w, y); g.quadraticCurveTo(x, y + 26 * s, x - w, y); g.fill(); }
  drawFigure(g, { x: 920, y: 990, s: 2.55, facing: 1, outfit: { top: 'tshirt', color: '#e85a3a', head: 'capBack', headColor: '#f2f0e8' }, pose: { ...POSES.reach, eF: [26, -196], hF: [30, -236] }, face: WRECK, look: [0.2, -1], rim: { color: '#ff7a6a', dir: [0.4, -1] } });
  led(g, 1560, 560, 'ДЕНЬ 9', 'БЕЗ ВОДЫ', RED, 120);
  headline(g, [['ПИЛ КРОВЬ', WHITE, 150], ['ЛЕТУЧИХ МЫШЕЙ', YEL, 120]], 50, 34, -0.05);
  vign(g, 0.5); calmCorner(g);
} });
// W2 — НИ КАПЛИ: the wrecked, dried-out hero; a glass of water glowing blue just out of reach; LED «72 ЧАСА»
registerShot('w2', { draw(g) {
  blurLayer(g, 16, (g) => office(g, 0, camAt(1100, 560, 1.4))); veil(g, '#08040a', 0.72);
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,90,40,.35)'; g.fillRect(0, 0, E.W, E.H); g.restore();
  bigFace(g, 640, 760, 360, { outfit: HERO, face: { eyes: 'ball', brows: 'worried', mouth: 'oBig', eyeSize: 1.2, pupil: 0.22, lid: 0.35, bags: 1 }, look: [0.9, -0.2], rimColor: '#ffb07a', rimSide: 1 });
  for (const [x, y, l] of [[560, 960, 50], [690, 950, 40], [620, 980, 30]]) seg(g, [[x, y], [x + 14, y + l * 0.4], [x - 6, y + l]], 5, alpha('#5a3a2a', 0.9));
  glow(g, 1400, 560, 420, BLUE, 0.55);
  g.save(); g.translate(1400, 560); g.scale(3.6, 3.6); icon(g, 'water', 0, 0, 1, BLUE, 0); g.restore();
  for (let i = 0; i < 3; i++) { g.save(); g.translate(1400 + (i - 1) * 70, 880 + i * 30); g.scale(0.55, 0.55); icon(g, 'droplet', 0, 0, 1, BLUE, 0); g.restore(); }
  arrow(g, 1000, 640, 1180, 600, BLUE, 18);
  led(g, 1440, 160, '72 ЧАСА', null, RED, 110);
  headline(g, [['НИ', WHITE, 150], ['КАПЛИ', YEL, 190]], 60, 20, -0.05);
  calmCorner(g);
} });
