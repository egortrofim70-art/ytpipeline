// sets/props.js — thought bubble with jumping sheep, phone lock screen.
import { E, rr, seg, circle, ring, text, glow, alpha, shade, linGrad, ease, prog, clamp, lerp, FONTS } from '/engine/core.js';

function sheep(g, x, y, s, legPhase = 0) {
  const ink = '#1a1622';
  for (const [lx, ph] of [[-16, 0], [-6, 1], [10, 0], [18, 1]]) seg(g, [[x + lx * s, y + 8 * s], [x + (lx + Math.sin(legPhase + ph * 3) * 4) * s, y + 26 * s]], 4 * s, ink);
  const wool = [[-14, 0, 13], [0, -6, 15], [14, 0, 13], [-6, 6, 12], [8, 6, 12]];
  for (const [dx, dy, r] of wool) circle(g, x + dx * s, y + dy * s, (r + 2.6) * s, '#2a2650');
  for (const [dx, dy, r] of wool) circle(g, x + dx * s, y + dy * s, r * s, '#ffffff');
  g.fillStyle = ink; g.beginPath(); g.ellipse(x + 26 * s, y - 6 * s, 9 * s, 7 * s, 0.3, 0, Math.PI * 2); g.fill();
  circle(g, x + 29 * s, y - 8 * s, 1.6 * s, '#fff');
}

// cloud bubble centred at (cx, cy); tail dots trail toward (tx, ty). Sheep jump a fence; the count goes up per jump.
export function sheepBubble(g, t, cx, cy, tx, ty, o = {}) {
  const a = ease.outBack(prog(t, 0, 0.28)), w = 300, h = 190;
  if (a <= 0) return;
  g.save(); g.translate(cx, cy); g.scale(a, a); g.translate(-cx, -cy);
  for (let i = 0; i < 3; i++) { const k = (i + 1) / 4; circle(g, lerp(tx, cx - w * 0.3, k), lerp(ty, cy + h * 0.45, k), 8 + i * 6, alpha('#eef0fa', 0.92)); }
  for (const [dx, dy, r] of [[-110, 10, 78], [-40, -48, 88], [50, -50, 84], [118, 4, 76], [40, 52, 82], [-60, 54, 76]]) circle(g, cx + dx, cy + dy, r, alpha('#eef0fa', 0.94));
  const fx = cx + 10, fy = cy + 58;                                                                       // fence
  seg(g, [[fx - 30, fy], [fx - 30, fy - 52]], 6, '#7a5a3a'); seg(g, [[fx + 30, fy], [fx + 30, fy - 52]], 6, '#7a5a3a');
  seg(g, [[fx - 40, fy - 40], [fx + 40, fy - 40]], 6, '#9a7448'); seg(g, [[fx - 40, fy - 18], [fx + 40, fy - 18]], 6, '#9a7448');
  const period = o.period || 0.34, n = Math.floor(Math.max(0, t - 0.15) / period);
  for (let i = Math.max(0, n - 1); i <= n; i++) {
    const p = (t - 0.15 - i * period) / (period * 1.6); if (p < 0 || p > 1) continue;
    const x = lerp(cx - 150, cx + 160, p), y = fy - 30 - Math.sin(Math.PI * clamp(p)) * 70;
    sheep(g, x, y, 1.6, t * 20);
  }
  text(g, String((o.start || 1) + Math.max(0, n)), cx + 115, cy - 82, { size: 50, font: FONTS.ui, weight: 900, color: '#2a2650', align: 'center' });
  g.restore();
}

// lock screen held in a hand; `time` / `note` are the only words on it
export function phoneScreen(g, t, cx, cy, o = {}) {
  const w = 470, h = 900, x = cx - w / 2, y = cy - h / 2, lit = o.lit ?? 1;
  glow(g, cx, cy, 760, '#8fd0ff', 0.28 * lit);
  rr(g, x - 14, y - 14, w + 28, h + 28, 64); g.fillStyle = '#0a0b12'; g.fill();
  g.save(); rr(g, x, y, w, h, 52); g.clip();
  g.fillStyle = linGrad(g, 0, y, 0, y + h, ['#1d2a6a', '#3a2f7a', '#141a40']); g.fillRect(x, y, w, h);
  glow(g, cx + 90, y + h * 0.75, 380, '#7a6ad0', 0.45);
  g.restore();
  rr(g, cx - 60, y + 22, 120, 30, 15); g.fillStyle = '#0a0b12'; g.fill();                                  // notch
  text(g, o.date || 'jueves, 6 de noviembre', cx, y + 150, { size: 30, font: FONTS.ui, weight: 800, color: alpha('#ffffff', 0.8) });
  text(g, o.time || '03:12', cx, y + 260, { size: 156, font: FONTS.ui, weight: 900, color: '#ffffff', glow: 20, glowColor: alpha('#bfe4ff', 0.6) });
  const na = ease.outBack(prog(t, o.noteAt ?? 0.35, (o.noteAt ?? 0.35) + 0.35));
  if (na > 0) {
    const ny = y + 470; g.save(); g.translate(cx, ny + 50); g.scale(na, na); g.translate(-cx, -(ny + 50));
    rr(g, x + 28, ny, w - 56, 100, 26); g.fillStyle = alpha('#ffffff', 0.16); g.fill();
    ring(g, x + 82, ny + 50, 22, 4, '#ffd400'); seg(g, [[x + 82, ny + 50], [x + 82, ny + 36]], 4, '#ffd400'); seg(g, [[x + 82, ny + 50], [x + 92, ny + 54]], 4, '#ffd400');
    text(g, o.note || 'Alarma · 06:00', x + 124, ny + 52, { size: 32, font: FONTS.ui, weight: 900, color: '#ffffff', align: 'left' });
    g.restore();
  }
  // thumb over the right edge
  const th = [cx + w / 2 + 60, cy + 230];
  seg(g, [[th[0] + 160, th[1] + 260], th, [th[0] - 70, th[1] - 40]], 74, alpha('#b8c8ff', 0.9));
  seg(g, [[th[0] + 160, th[1] + 260], th, [th[0] - 70, th[1] - 40]], 68, '#0a0c16');
}
