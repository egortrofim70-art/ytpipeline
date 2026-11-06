// thumbs_v2.js — one clean thumbnail per video (v2 after review): one big face, one glowing object, a 2-line headline
// in a readable zone (never on the face, never in a corner), nothing small or noisy; bottom-right kept dark for the timer.
import { E, registerShot, blurLayer, veil, rr, seg, circle, ring, poly, text, glow, alpha, linGrad } from '/engine/core.js';
import { bigFace } from '/engine/rig2d.js';
import { bedroom, alarmClock } from '../sets/bedroom.js';
import { kitchen } from '../sets/week.js';
import { office } from '../sets/places.js';
import { HERO } from '../cast.js';
import { icon } from './_tpl_sci.js';

const YEL = '#fce011', WHITE = '#fdfdfd', RED = '#ff2a2a', BLUE = '#3aa8ff', INK = '#030103', HF = 'Oswald';
const camAt = (cx, cy, z) => ({ z, x: cx - E.W / 2, y: cy - E.H / 2 });

// big condensed headline: black outline + hard shadow; rows = [[text, colour, size]]; centred on cx
function headline(g, rows, cx, y, rot = 0) {
  g.save(); g.translate(cx, y); g.rotate(rot);
  let yy = 0;
  for (const [str, col, size] of rows) {
    const o = { size, font: HF, weight: 700, align: 'center', base: 'top', spacing: 2 };
    text(g, str, size * 0.05, yy + size * 0.06, { ...o, color: INK, stroke: size * 0.22, strokeColor: INK });
    text(g, str, 0, yy, { ...o, color: col, stroke: size * 0.16, strokeColor: INK });
    yy += size * 1.04;
  }
  g.restore();
}
// a red "sticker" box behind one word, for the number hook
function badge(g, cx, cy, str, bg = RED, size = 120, rot = 0.04) {
  g.save(); g.translate(cx, cy); g.rotate(rot); g.font = `700 ${size}px "${HF}"`; const w = g.measureText(str).width + 80, h = size * 1.32;
  rr(g, -w / 2 + 10, -h / 2 + 12, w, h, 18); g.fillStyle = INK; g.fill(); rr(g, -w / 2, -h / 2, w, h, 18); g.fillStyle = bg; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
  text(g, str, 0, 4, { size, font: HF, weight: 700, color: WHITE }); g.restore();
}
function slash(g, x, y, half = 300, rot = -0.7) { g.save(); g.translate(x, y); g.rotate(rot); rr(g, -half, -30, half * 2, 60, 30); g.fillStyle = INK; g.fill(); rr(g, -half + 10, -21, half * 2 - 20, 42, 21); g.fillStyle = RED; g.fill(); g.restore(); }
function calmCorner(g) { const gr = g.createRadialGradient(E.W, E.H, 0, E.W, E.H, 400); gr.addColorStop(0, 'rgba(2,2,6,.95)'); gr.addColorStop(1, 'rgba(2,2,6,0)'); g.fillStyle = gr; g.fillRect(E.W - 420, E.H - 420, 420, 420); }
function vign(g, a = 0.7) { const gr = g.createRadialGradient(E.W * 0.45, E.H * 0.5, 350, E.W * 0.45, E.H * 0.5, 1250); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, E.W, E.H); }
function veins(g, cx, cy, r, eyeSize = 1) {
  for (const sx of [-1, 1]) {
    const ex = cx + sx * 0.34 * r, ey = cy - 0.16 * r, er = 0.2 * r * eyeSize;
    g.save(); g.beginPath(); g.arc(ex, ey, er, 0, Math.PI * 2); g.clip(); g.strokeStyle = alpha('#d81a20', 0.8); g.lineWidth = Math.max(2, r * 0.012); g.lineCap = 'round';
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2 + 0.3 * sx; g.beginPath(); let px = ex + Math.cos(a) * er, py = ey + Math.sin(a) * er; g.moveTo(px, py); for (let q = 1; q <= 4; q++) { const d = er * (1 - q * 0.16); px = ex + Math.cos(a + Math.sin(q * 2.3 + k) * 0.25) * d; py = ey + Math.sin(a + Math.sin(q * 1.7 + k) * 0.25) * d; g.lineTo(px, py); } g.stroke(); }
    g.restore();
  }
}
// cracked, dried lips + a sunken-cheek shade on a bigFace at cx,cy,r
function dryFace(g, cx, cy, r) {
  g.strokeStyle = alpha('#c8a080', 0.55); g.lineWidth = r * 0.012; for (const dx of [-0.12, -0.03, 0.06, 0.14]) { g.beginPath(); g.moveTo(cx + dx * r, cy + 0.33 * r); g.lineTo(cx + (dx + 0.02) * r, cy + 0.42 * r); g.stroke(); }
  for (const s of [-1, 1]) { g.fillStyle = alpha('#2a2440', 0.6); g.beginPath(); g.ellipse(cx + s * 0.55 * r, cy + 0.18 * r, 0.16 * r, 0.26 * r, s * 0.2, 0, Math.PI * 2); g.fill(); }
}
const R = 400, FX0 = 600, FY0 = 640;   // the face: big, left of centre

// ---------- 1. ¿Y si nunca más pudieras dormir?  — bloodshot wide-awake face, red alarm clock, "NO PODRÁS / DORMIR"
registerShot('v_ins', { draw(g) {
  blurLayer(g, 18, (g) => bedroom(g, 0, camAt(1000, 560, 1.4), { dawn: 0 })); veil(g, '#04050e', 0.7);
  glow(g, FX0, FY0, 760, '#3a5aff', 0.28);
  const face = { eyes: 'ball', brows: 'worried', mouth: 'flat', eyeSize: 1.35, pupil: 0.16, bags: 1 };
  bigFace(g, FX0, FY0, R, { outfit: HERO, face, look: [0, 0], rimColor: '#9ab8ff', rimSide: 1 });
  veins(g, FX0, FY0, R, 1.35);
  glow(g, 1380, 760, 380, RED, 0.45); alarmClock(g, 1380, 800, 140, 3, { alarm: 6 });
  badge(g, 1380, 560, '0 HORAS', RED, 96);
  headline(g, [['NO PODRÁS', WHITE, 150], ['DORMIR', YEL, 200]], 1380, 90);
  vign(g, 0.6); calmCorner(g);
} });

// ---------- 2. Что если ты перестанешь есть? — shocked face, an empty glowing plate, "НЕ ЕЛ / 382 ДНЯ"
registerShot('v_hun', { draw(g) {
  blurLayer(g, 18, (g) => kitchen(g, 0, camAt(1300, 560, 1.4))); veil(g, '#06030a', 0.72);
  glow(g, 500, FY0, 760, '#ff8a3a', 0.22);
  bigFace(g, 500, FY0, 380, { outfit: HERO, face: { eyes: 'ball', brows: 'raised', mouth: 'oBig', eyeSize: 1.3, pupil: 0.28, bags: 0.6 }, look: [0.8, 0.1], rimColor: '#ffc08a', rimSide: 1 });
  const px = 1420, py = 760; glow(g, px, py, 420, '#ffe2a8', 0.45);
  g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(px + 14, py + 26, 290, 110, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f2f4f8'; g.beginPath(); g.ellipse(px, py, 290, 110, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#c8ccd6'; g.lineWidth = 8; g.beginPath(); g.ellipse(px, py - 4, 190, 70, 0, 0, Math.PI * 2); g.stroke();
  for (const [x, w] of [[px - 330, 1], [px + 330, -1]]) { seg(g, [[x, py - 150], [x, py + 130]], 20, '#c8ccd6'); if (w > 0) for (const d of [-16, 0, 16]) seg(g, [[x + d, py - 210], [x + d, py - 140]], 9, '#c8ccd6'); else { g.fillStyle = '#c8ccd6'; g.beginPath(); g.ellipse(x, py - 180, 22, 60, 0, 0, Math.PI * 2); g.fill(); } }
  g.save(); g.translate(px, py - 20); g.rotate(-0.55); rr(g, -380, -30, 760, 60, 30); g.fillStyle = INK; g.fill(); rr(g, -370, -21, 740, 42, 21); g.fillStyle = RED; g.fill(); g.restore();
  headline(g, [['НЕ ЕЛ', WHITE, 160], ['382 ДНЯ', YEL, 210]], 1420, 80);
  vign(g, 0.6); calmCorner(g);
} });

// ---------- 3. ¿Y si dejaras el azúcar? — shocked face, a giant donut with a red slash, "30 DÍAS / SIN AZÚCAR"
registerShot('v_sug', { draw(g) {
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#0c0418', '#1a0826', '#07030e']); g.fillRect(0, 0, E.W, E.H);
  glow(g, FX0, FY0, 760, '#ff4fa0', 0.22);
  bigFace(g, FX0, FY0, R, { outfit: HERO, face: { eyes: 'ball', brows: 'raised', mouth: 'oBig', eyeSize: 1.3, pupil: 0.28 }, look: [0.8, 0.1], rimColor: '#ff9ad0', rimSide: 1 });
  const dx = 1380, dy = 790; glow(g, dx, dy, 420, '#ff7ab0', 0.45);
  g.save(); g.translate(dx, dy); g.scale(3.0, 3.0); icon(g, 'donut', 0, 0, 1, '#fff', 0); g.restore();
  g.save(); g.translate(dx, dy); g.rotate(-0.7); rr(g, -300, -26, 600, 52, 26); g.fillStyle = INK; g.fill(); rr(g, -290, -18, 580, 36, 18); g.fillStyle = RED; g.fill(); g.restore();
  headline(g, [['30 DÍAS', YEL, 200], ['SIN AZÚCAR', WHITE, 140]], 1400, 100);
  vign(g, 0.55); calmCorner(g);
} });

// ---------- 4. Что если ты перестанешь пить воду? — dried, desperate face, a glowing glass just out of reach, "НИ КАПЛИ / 3 ДНЯ"
registerShot('v_wat', { draw(g) {
  blurLayer(g, 18, (g) => office(g, 0, camAt(1100, 560, 1.4))); veil(g, '#08040a', 0.75);
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,90,30,.45)'; g.fillRect(0, 0, E.W, E.H); g.restore();
  glow(g, FX0, FY0, 760, '#ff6a2a', 0.25);
  bigFace(g, FX0, FY0, R, { outfit: HERO, face: { eyes: 'ball', brows: 'worried', mouth: 'oBig', eyeSize: 1.25, pupil: 0.22, lid: 0.3, bags: 1 }, look: [0.9, -0.1], rimColor: '#ffb07a', rimSide: 1 });
  dryFace(g, FX0, FY0, R);
  const gx = 1380, gy = 800; glow(g, gx, gy, 460, BLUE, 0.6);
  g.save(); g.translate(gx, gy); g.scale(3.0, 3.0); icon(g, 'water', 0, 0, 1, BLUE, 0); g.restore();
  for (const [x, y, s] of [[gx - 120, gy - 120, 0.22], [gx + 110, gy - 60, 0.18], [gx - 60, gy + 60, 0.16]]) { g.save(); g.translate(x, y); g.scale(s, s); icon(g, 'droplet', 0, 0, 1, '#e8f6ff', 0); g.restore(); }
  headline(g, [['18 ДНЕЙ', YEL, 200], ['БЕЗ ВОДЫ', WHITE, 140]], 1380, 80);
  slash(g, gx, gy, 300);
  vign(g, 0.55); calmCorner(g);
} });


// ======================= B-variants v2 (one clear object each) =======================
function bedIcon(g, cx, cy, s) { g.save(); g.translate(cx, cy); g.scale(s, s);
  rr(g, -170, -10, 340, 70, 12); g.fillStyle = '#6a5a9a'; g.fill(); rr(g, -180, -120, 26, 230, 10); g.fillStyle = '#3a2e5a'; g.fill(); rr(g, 154, -40, 26, 150, 10); g.fill();
  rr(g, -150, -60, 110, 56, 24); g.fillStyle = '#f2f0fa'; g.fill(); rr(g, -50, -54, 220, 60, 20); g.fillStyle = '#4a6ad8'; g.fill(); g.restore(); }
// insomnia B — a bed crossed out: "180 DÍAS / SIN DORMIR"
registerShot('b_ins', { draw(g) {
  blurLayer(g, 18, (g) => bedroom(g, 0, camAt(1000, 560, 1.4), { dawn: 0 })); veil(g, '#03040c', 0.75);
  glow(g, 520, FY0, 760, '#6a8aff', 0.25);
  bigFace(g, 520, FY0, 380, { outfit: HERO, face: { eyes: 'ball', brows: 'worried', mouth: 'flat', eyeSize: 1.35, pupil: 0.16, bags: 1 }, look: [0, 0], rimColor: '#9fd8ff', rimSide: 1 });
  veins(g, 520, FY0, 380, 1.35);
  glow(g, 1400, 790, 380, '#6a8aff', 0.4); bedIcon(g, 1400, 790, 1.35); slash(g, 1400, 780, 300);
  headline(g, [['180 DÍAS', YEL, 200], ['SIN DORMIR', WHITE, 140]], 1400, 90);
  vign(g, 0.6); calmCorner(g);
} });
// hunger B — the bathroom scale: "СБРОСИЛ / 125 КГ", sticker БЕЗ ЕДЫ
registerShot('b_hun', { draw(g) {
  blurLayer(g, 18, (g) => office(g, 0, camAt(1100, 560, 1.4))); veil(g, '#06030a', 0.72);
  glow(g, 500, FY0, 760, '#5fe39a', 0.18);
  bigFace(g, 500, FY0, 380, { outfit: HERO, face: { eyes: 'ball', brows: 'raised', mouth: 'oBig', eyeSize: 1.3, pupil: 0.28 }, look: [0.8, 0.2], rimColor: '#a8ffc8', rimSide: 1 });
  const sx = 1410, sy = 790; glow(g, sx, sy, 380, '#5fe39a', 0.35);
  rr(g, sx - 250, sy - 170, 500, 340, 50); g.fillStyle = '#eef1f6'; g.fill(); g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
  rr(g, sx - 170, sy - 120, 340, 130, 18); g.fillStyle = '#0c1410'; g.fill();
  text(g, '82 КГ', sx, sy - 52, { size: 96, font: HF, weight: 700, color: '#6fffb0', glow: 20, glowColor: 'rgba(111,255,176,.7)' });
  for (const fx of [-110, 110]) { rr(g, sx + fx - 50, sy + 40, 100, 90, 30); g.fillStyle = '#c8ccd6'; g.fill(); }
  badge(g, sx, 560, 'БЕЗ ЕДЫ', RED, 90);
  headline(g, [['СБРОСИЛ', WHITE, 150], ['125 КГ', YEL, 200]], 1410, 70);
  vign(g, 0.55); calmCorner(g);
} });
// sugar B — a soda can crossed out: "MIRA LO QUE / PASA", sticker DÍA 30
registerShot('b_sug', { draw(g) {
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#14040a', '#26060e', '#0a0206']); g.fillRect(0, 0, E.W, E.H);
  glow(g, 500, FY0, 760, '#ff5a4a', 0.2);
  bigFace(g, 500, FY0, 380, { outfit: HERO, face: { eyes: 'ball', brows: 'raised', mouth: 'oBig', eyeSize: 1.3, pupil: 0.28 }, look: [0.8, 0.1], rimColor: '#ffb0a0', rimSide: 1 });
  const cx = 1400, cy = 830; glow(g, cx, cy, 380, RED, 0.45);
  g.save(); g.translate(cx, cy); g.rotate(0.12); g.scale(2.8, 2.8); icon(g, 'soda', 0, 0, 1, RED, 0); g.restore(); slash(g, cx, cy, 290);
  badge(g, cx, 530, 'DÍA 30', '#1fae3a', 90);
  headline(g, [['MIRA LO QUE', WHITE, 150], ['PASA', YEL, 200]], 1400, 90);
  vign(g, 0.55); calmCorner(g);
} });
// water B — too much water: a huge bottle "7 Л", headline "7 ЛИТРОВ / ЗА 3 ЧАСА", sticker ОПАСНО
registerShot('b_wat', { draw(g) {
  blurLayer(g, 18, (g) => office(g, 0, camAt(1100, 560, 1.4))); veil(g, '#02060e', 0.75);
  glow(g, 500, FY0, 760, BLUE, 0.22);
  bigFace(g, 500, FY0, 380, { outfit: HERO, face: { eyes: 'ball', brows: 'worried', mouth: 'oBig', eyeSize: 1.3, pupil: 0.22 }, look: [0.8, 0], rimColor: '#9fd8ff', rimSide: 1 });
  const bx = 1400, by = 850; glow(g, bx, by, 420, BLUE, 0.5);
  rr(g, bx - 40, by - 300, 80, 50, 10); g.fillStyle = '#2a6ad8'; g.fill(); rr(g, bx - 70, by - 260, 140, 60, 20); g.fillStyle = alpha('#cfe8ff', 0.9); g.fill();
  rr(g, bx - 150, by - 210, 300, 420, 60); g.fillStyle = alpha('#cfe8ff', 0.35); g.fill(); g.lineWidth = 10; g.strokeStyle = '#e8f6ff'; g.stroke();
  rr(g, bx - 140, by - 120, 280, 320, 50); g.fillStyle = alpha(BLUE, 0.85); g.fill();
  text(g, '7 Л', bx, by + 40, { size: 130, font: HF, weight: 700, color: WHITE, stroke: 12, strokeColor: INK });
  badge(g, bx, 490, 'ОПАСНО', RED, 76);
  headline(g, [['7 ЛИТРОВ', YEL, 180], ['ЗА 3 ЧАСА', WHITE, 120]], 1400, 70);
  vign(g, 0.55); calmCorner(g);
} });

// ---------- smoke A — strained craving face, a big lit cigarette crossed out, sticker ДЕНЬ 3, "БРОСИЛ / КУРИТЬ"
function bigCig(g, cx, cy, s, rot = -0.35) {
  g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(s, s);
  rr(g, -150, -20, 300, 40, 12); g.fillStyle = '#f4f2ec'; g.fill(); rr(g, -150, -20, 90, 40, 12); g.fillStyle = '#d89a5a'; g.fill();
  g.lineWidth = 5; g.strokeStyle = INK; rr(g, -150, -20, 300, 40, 12); g.stroke();
  rr(g, 138, -20, 22, 40, 8); g.fillStyle = '#ff5a1a'; g.fill(); glow(g, 152, 0, 90, '#ff6a2a', 0.9);
  g.strokeStyle = 'rgba(230,236,248,.75)'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); for (let k = 0; k <= 16; k++) { const u = k / 16; g.lineTo(160 + Math.sin(u * 7) * 26 * u, -30 - u * 190); } g.stroke();
  g.restore();
}
registerShot('v_smk', { draw(g) {
  blurLayer(g, 18, (g) => kitchen(g, 0, camAt(1200, 560, 1.4))); veil(g, '#0a0402', 0.72);
  glow(g, 500, FY0, 760, '#ff8a3a', 0.22);
  bigFace(g, 500, FY0, 380, { outfit: HERO, face: { eyes: 'ball', brows: 'worried', mouth: 'wavy', eyeSize: 1.3, pupil: 0.24 }, look: [0.85, 0.05], rimColor: '#ffb07a', rimSide: 1 });
  veins(g, 500, FY0, 380, 1.3);
  const cx = 1400, cy = 830; glow(g, cx, cy, 400, '#ff6a2a', 0.35);
  bigCig(g, cx - 40, cy + 10, 1.6, 0.32); slash(g, cx, cy, 310, -0.85);
  badge(g, cx, 545, 'ДЕНЬ 3', RED, 90);
  headline(g, [['БРОСИЛ', WHITE, 150], ['КУРИТЬ', YEL, 200]], 1400, 80);
  vign(g, 0.55); calmCorner(g);
} });
// ---------- smoke B — the twist: shocked face, ONE lit cigarette in a red danger ring, "1 ЗАТЯЖКА / И ВСЁ ЗАНОВО"
registerShot('b_smk', { draw(g) {
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#14040a', '#26060e', '#0a0206']); g.fillRect(0, 0, E.W, E.H);
  glow(g, 500, FY0, 760, '#ff5a4a', 0.2);
  bigFace(g, 500, FY0, 380, { outfit: HERO, face: { eyes: 'ball', brows: 'raised', mouth: 'oBig', eyeSize: 1.35, pupil: 0.26 }, look: [0.85, 0.1], rimColor: '#ffb0a0', rimSide: 1 });
  const cx = 1400, cy = 820; glow(g, cx, cy, 420, RED, 0.4);
  g.lineWidth = 34; g.strokeStyle = INK; g.beginPath(); g.arc(cx, cy, 250, 0, Math.PI * 2); g.stroke(); g.lineWidth = 22; g.strokeStyle = RED; g.stroke();
  bigCig(g, cx - 30, cy + 30, 1.45, -0.3);
  headline(g, [['1 ЗАТЯЖКА', YEL, 180], ['И ВСЁ ЗАНОВО', WHITE, 120]], 1400, 80);
  vign(g, 0.55); calmCorner(g);
} });
