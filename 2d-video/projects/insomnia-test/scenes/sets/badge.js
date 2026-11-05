// sets/badge.js — the escalating "без сна" counter. Driven by GLOBAL time so it stays continuous across cuts.
// Look matches the channel's earlier badge: dark card, yellow #FFD400 border, top-right corner.
import { E, rr, text, measure, glow, alpha, ease, prog, clamp, lerp, FONTS } from '/engine/core.js';

const YEL = '#ffd400';
// [globalT, value, unit] — each step lands on its spoken word: "час", "второй", "Три", "Пять", "Первый", "третий", "пятый", "неделю"
const STEPS = [[6.08, 1, 'h'], [7.08, 2, 'h'], [11.52, 3, 'h'], [15.28, 5, 'h'], [23.52, 1, 'd'], [25.52, 3, 'd'], [27.44, 5, 'd'], [31.12, 7, 'd']];
const plural = (n, f) => (n % 10 === 1 && n % 100 !== 11 ? f[0] : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? f[1] : f[2]);
const UNITS = { h: ['ЧАС', 'ЧАСА', 'ЧАСОВ'], d: ['ДЕНЬ', 'ДНЯ', 'ДНЕЙ'] };

export function sleepBadge(g, gt) {
  if (gt < STEPS[0][0]) return;
  let i = 0; while (i + 1 < STEPS.length && gt >= STEPS[i + 1][0]) i++;
  const [t0, v, u] = STEPS[i], since = gt - t0, unitSwitch = i > 0 && STEPS[i - 1][2] !== u;
  const appear = ease.outBack(prog(gt, STEPS[0][0], STEPS[0][0] + 0.45));
  const pop = i === 0 ? 1 : lerp(unitSwitch ? 1.32 : 1.16, 1, ease.outBack(prog(since, 0, 0.32)));
  const flash = 1 - ease.out(prog(since, 0, 0.45));
  const w = 330, h = 116, x = E.W - w - 56, y = 48, cx = x + w / 2, cy = y + h / 2;
  g.save();
  g.translate(cx, cy); g.scale(appear * pop, appear * pop); g.translate(-cx, -cy);
  g.globalAlpha *= clamp(appear * 1.4);
  glow(g, cx, cy, w * 0.75, YEL, 0.10 + 0.22 * flash);
  rr(g, x, y, w, h, 16); g.fillStyle = 'rgba(10,10,24,0.93)'; g.fill();
  g.lineWidth = 3; g.strokeStyle = unitSwitch && flash > 0 ? lerpColor(flash) : YEL; rr(g, x, y, w, h, 16); g.stroke();
  text(g, 'БЕЗ СНА', x + 26, y + 30, { size: 22, font: FONTS.ui, weight: 900, color: alpha('#ffffff', 0.72), align: 'left', spacing: 3 });
  const num = String(v), ns = 64;
  text(g, num, x + 24, y + 80, { size: ns, font: FONTS.ui, weight: 900, color: flash > 0.5 ? '#ffffff' : YEL, align: 'left', glow: 14 + 16 * flash, glowColor: alpha(YEL, 0.7) });
  const nw = measure(g, num, ns, FONTS.ui, 900);
  text(g, plural(v, UNITS[u]), x + 24 + nw + 14, y + 84, { size: 34, font: FONTS.ui, weight: 900, color: '#ffffff', align: 'left', spacing: 1 });
  g.restore();
}
const lerpColor = (k) => (k > 0.5 ? '#ff6f61' : YEL);
