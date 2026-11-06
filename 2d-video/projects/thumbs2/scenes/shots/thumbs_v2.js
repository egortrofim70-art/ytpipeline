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
function headline(g, rows, cx, y, rot = -0.03) {
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
  glow(g, 1380, 760, 380, RED, 0.45); alarmClock(g, 1380, 760, 150, 3, { alarm: 6 });
  badge(g, 1380, 520, '0 HORAS', RED, 96);
  headline(g, [['NO PODRÁS', WHITE, 150], ['DORMIR', YEL, 210]], 1380, 40);
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
  headline(g, [['НЕ ЕЛ', WHITE, 170], ['382 ДНЯ', YEL, 220]], 1420, 50);
  vign(g, 0.6); calmCorner(g);
} });

// ---------- 3. ¿Y si dejaras el azúcar? — shocked face, a giant donut with a red slash, "30 DÍAS / SIN AZÚCAR"
registerShot('v_sug', { draw(g) {
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#0c0418', '#1a0826', '#07030e']); g.fillRect(0, 0, E.W, E.H);
  glow(g, FX0, FY0, 760, '#ff4fa0', 0.22);
  bigFace(g, FX0, FY0, R, { outfit: HERO, face: { eyes: 'ball', brows: 'raised', mouth: 'oBig', eyeSize: 1.3, pupil: 0.28 }, look: [0.8, 0.1], rimColor: '#ff9ad0', rimSide: 1 });
  const dx = 1380, dy = 740; glow(g, dx, dy, 420, '#ff7ab0', 0.45);
  g.save(); g.translate(dx, dy); g.scale(3.0, 3.0); icon(g, 'donut', 0, 0, 1, '#fff', 0); g.restore();
  g.save(); g.translate(dx, dy); g.rotate(-0.7); rr(g, -300, -26, 600, 52, 26); g.fillStyle = INK; g.fill(); rr(g, -290, -18, 580, 36, 18); g.fillStyle = RED; g.fill(); g.restore();
  headline(g, [['30 DÍAS', YEL, 220], ['SIN AZÚCAR', WHITE, 150]], 1400, 40);
  vign(g, 0.55); calmCorner(g);
} });

// ---------- 4. Что если ты перестанешь пить воду? — dried, desperate face, a glowing glass just out of reach, "НИ КАПЛИ / 3 ДНЯ"
registerShot('v_wat', { draw(g) {
  blurLayer(g, 18, (g) => office(g, 0, camAt(1100, 560, 1.4))); veil(g, '#08040a', 0.75);
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,90,30,.45)'; g.fillRect(0, 0, E.W, E.H); g.restore();
  glow(g, FX0, FY0, 760, '#ff6a2a', 0.25);
  bigFace(g, FX0, FY0, R, { outfit: HERO, face: { eyes: 'ball', brows: 'worried', mouth: 'oBig', eyeSize: 1.25, pupil: 0.22, lid: 0.3, bags: 1 }, look: [0.9, -0.1], rimColor: '#ffb07a', rimSide: 1 });
  dryFace(g, FX0, FY0, R);
  const gx = 1380, gy = 790; glow(g, gx, gy, 460, BLUE, 0.6);
  g.save(); g.translate(gx, gy); g.scale(3.0, 3.0); icon(g, 'water', 0, 0, 1, BLUE, 0); g.restore();
  for (const [x, y, s] of [[gx - 120, gy - 120, 0.22], [gx + 110, gy - 60, 0.18], [gx - 60, gy + 60, 0.16]]) { g.save(); g.translate(x, y); g.scale(s, s); icon(g, 'droplet', 0, 0, 1, '#e8f6ff', 0); g.restore(); }
  headline(g, [['18 ДНЕЙ', YEL, 220], ['БЕЗ ВОДЫ', WHITE, 140]], 1380, 30);
  vign(g, 0.55); calmCorner(g);
} });

// ======================= B-variants (new concepts) =======================
function phone(g, cx, cy, s, str, col = '#9fd8ff') {
  g.save(); g.translate(cx, cy); g.scale(s, s); glow(g, 0, 0, 260, col, 0.5);
  rr(g, -110, -200, 220, 400, 30); g.fillStyle = '#0c0e14'; g.fill(); rr(g, -96, -184, 192, 368, 20); g.fillStyle = '#16304a'; g.fill();
  text(g, str, 0, -30, { size: 84, font: HF, weight: 700, color: '#ffffff', glow: 20, glowColor: alpha(col, 0.9) }); g.restore();
}
// insomnia B — "180 DÍAS / SIN DORMIR": wrecked face, phone glowing 3:00
registerShot('b_ins', { draw(g) {
  blurLayer(g, 18, (g) => bedroom(g, 0, camAt(1000, 560, 1.4), { dawn: 0 })); veil(g, '#03040c', 0.75);
  glow(g, 520, FY0, 760, '#6a8aff', 0.25);
  bigFace(g, 520, FY0, 380, { outfit: HERO, face: { eyes: 'ball', brows: 'worried', mouth: 'wavy', eyeSize: 1.3, pupil: 0.15, lid: 0.25, bags: 1 }, look: [0.7, 0], rimColor: '#9fd8ff', rimSide: 1 });
  veins(g, 520, FY0, 380, 1.3);
  phone(g, 1400, 740, 1.3, '3:00', '#bfe8ff');
  headline(g, [['180 DÍAS', YEL, 210], ['SIN DORMIR', WHITE, 140]], 1400, 30);
  vign(g, 0.6); calmCorner(g);
} });
// hunger B — "ЕГО ЗАБЫЛИ / В КАМЕРЕ": face behind glowing cell bars, red sticker 18 ДНЕЙ
registerShot('b_hun', { draw(g) {
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#0a0c0a', '#161a16', '#060806']); g.fillRect(0, 0, E.W, E.H);
  glow(g, 560, FY0, 700, '#9ab0c8', 0.22);
  bigFace(g, 560, FY0, 360, { outfit: { ...HERO, color: '#5a7a9a', head: 'curly', headColor: '#2a1e16' }, face: { eyes: 'ball', brows: 'worried', mouth: 'oBig', eyeSize: 1.25, pupil: 0.25, bags: 1 }, look: [0.6, -0.2], rimColor: '#cfe0ff', rimSide: 1 });
  for (let i = 0; i < 6; i++) { const x = 230 + i * 130; seg(g, [[x, 120], [x, 1080]], 34, INK); seg(g, [[x, 120], [x, 1080]], 22, '#5a6066'); seg(g, [[x - 6, 120], [x - 6, 1080]], 5, alpha('#cfe0ff', 0.6)); }
  seg(g, [[190, 330], [960, 330]], 30, '#4a5056');
  badge(g, 1400, 560, '18 ДНЕЙ', RED, 120);
  headline(g, [['ЕГО ЗАБЫЛИ', WHITE, 140], ['В КАМЕРЕ', YEL, 190]], 1400, 40);
  vign(g, 0.6); calmCorner(g);
} });
// sugar B — "TU CEREBRO / SIN AZÚCAR": shocked face, a glowing pink brain with lightning, sticker DÍA 3
registerShot('b_sug', { draw(g) {
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#0c0418', '#1a0826', '#07030e']); g.fillRect(0, 0, E.W, E.H);
  glow(g, 500, FY0, 760, '#ff4fa0', 0.22);
  bigFace(g, 500, FY0, 380, { outfit: HERO, face: { eyes: 'ball', brows: 'raised', mouth: 'oBig', eyeSize: 1.3, pupil: 0.28 }, look: [0.8, 0], rimColor: '#ff9ad0', rimSide: 1 });
  glow(g, 1400, 760, 420, '#ff4fa0', 0.55); g.save(); g.translate(1400, 760); g.scale(3.2, 3.2); icon(g, 'brain', 0, 0, 1, '#ff8ac8', 0); g.restore();
  for (const [x, y, sx] of [[1130, 640, -1], [1670, 640, 1]]) { g.save(); g.translate(x, y); g.scale(sx * 2.2, 2.2); poly(g, [[0, -60], [30, -10], [6, -6], [26, 54], [-12, 0], [10, -2]], YEL); g.restore(); }
  badge(g, 1400, 1000, 'DÍA 3', RED, 90, -0.04);
  headline(g, [['TU CEREBRO', WHITE, 150], ['SIN AZÚCAR', YEL, 180]], 1400, 30);
  vign(g, 0.55); calmCorner(g);
} });
// water B — "ПИЛ КРОВЬ / ЧТОБЫ ВЫЖИТЬ": desperate dry face, a glowing red drop, sticker 9 ДНЕЙ
registerShot('b_wat', { draw(g) {
  g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#14060a', '#2a0c10', '#0a0306']); g.fillRect(0, 0, E.W, E.H);
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,120,40,.35)'; g.fillRect(0, 0, E.W, E.H); g.restore();
  glow(g, 500, FY0, 760, '#ff6a2a', 0.25);
  bigFace(g, 500, FY0, 380, { outfit: { top: 'tshirt', color: '#e85a3a', head: 'none' }, face: { eyes: 'ball', brows: 'worried', mouth: 'oBig', eyeSize: 1.25, pupil: 0.22, lid: 0.3, bags: 1 }, look: [0.9, -0.1], rimColor: '#ffb07a', rimSide: 1 });
  dryFace(g, 500, FY0, 380);
  glow(g, 1400, 740, 420, RED, 0.6); g.save(); g.translate(1400, 740); g.scale(3.0, 3.0); icon(g, 'blood', 0, 0, 1, RED, 0); g.restore();
  badge(g, 1400, 1010, '9 ДНЕЙ', '#c81a1a', 90, -0.04);
  headline(g, [['ПИЛ КРОВЬ', WHITE, 160], ['ЧТОБЫ ВЫЖИТЬ', YEL, 130]], 1380, 30);
  vign(g, 0.55); calmCorner(g);
} });
