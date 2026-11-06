// sets/badge.js — the escalating "без воды" counter. Driven by GLOBAL time so it stays continuous across cuts.
// Steps come from config.json → badge: [[globalT, value, unit], ...], written by build_story.py from the spoken words.
import { E, rr, text, measure, glow, alpha, ease, prog, clamp, lerp, FONTS } from '/engine/core.js';

const YEL = '#ffd400';
const UNITS = { n: ['МИНУТА', 'МИНУТЫ', 'МИНУТ'], h: ['ЧАС', 'ЧАСА', 'ЧАСОВ'], d: ['ДЕНЬ', 'ДНЯ', 'ДНЕЙ'], w: ['НЕДЕЛЯ', 'НЕДЕЛИ', 'НЕДЕЛЬ'], m: ['МЕСЯЦ', 'МЕСЯЦА', 'МЕСЯЦЕВ'], y: ['ГОД', 'ГОДА', 'ЛЕТ'] };
const plural = (n) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 1 : 2; };
const unitWord = (v, u) => UNITS[u][plural(v)];

export function sleepBadge(g, gt, info = {}) {
  const steps = E.cfg.badge || [];
  if (!steps.length || gt < steps[0][0] || info.noBadge) return;
  let i = 0; while (i + 1 < steps.length && gt >= steps[i + 1][0]) i++;
  const [t0, v, u] = steps[i], since = gt - t0, unitSwitch = i > 0 && steps[i - 1][2] !== u;
  const appear = ease.outBack(prog(gt, steps[0][0], steps[0][0] + 0.45));
  const pop = i === 0 ? 1 : lerp(unitSwitch ? 1.32 : 1.16, 1, ease.outBack(prog(since, 0, 0.32)));
  const flash = 1 - ease.out(prog(since, 0, 0.45));
  const num = String(v), ns = 64, uw = unitWord(v, u);
  const w = Math.max(330, 52 + measure(g, num, ns, FONTS.ui, 900) + 14 + measure(g, uw, 34, FONTS.ui, 900)), h = 116, x = E.W - w - 56, y = 48, cx = x + w / 2, cy = y + h / 2;
  g.save();
  g.translate(cx, cy); g.scale(appear * pop, appear * pop); g.translate(-cx, -cy);
  g.globalAlpha *= clamp(appear * 1.4);
  glow(g, cx, cy, w * 0.75, YEL, 0.10 + 0.22 * flash);
  rr(g, x, y, w, h, 16); g.fillStyle = 'rgba(10,10,24,0.93)'; g.fill();
  g.lineWidth = 3; g.strokeStyle = unitSwitch && flash > 0.5 ? '#ff6f61' : YEL; rr(g, x, y, w, h, 16); g.stroke();
  text(g, 'БЕЗ СИГАРЕТ', x + 26, y + 30, { size: 22, font: FONTS.ui, weight: 900, color: alpha('#ffffff', 0.72), align: 'left', spacing: 3 });
  text(g, num, x + 24, y + 80, { size: ns, font: FONTS.ui, weight: 900, color: flash > 0.5 ? '#ffffff' : YEL, align: 'left', glow: 14 + 16 * flash, glowColor: alpha(YEL, 0.7) });
  text(g, uw, x + 24 + measure(g, num, ns, FONTS.ui, 900) + 14, y + 84, { size: 34, font: FONTS.ui, weight: 900, color: '#ffffff', align: 'left', spacing: 1 });
  g.restore();
}
