// register.js — every shot in story/shots.json is drawn by the template named in params.tpl.
// On top of any template: zoom punches on emphasis words (params.punch: [t…]), kinetic word stamps
// (params.stamp: {text, at, color, y, size} or a list), and the "без еды" counter.
import { E, registerShot, ease, prog, clamp, text, alpha, shake, FONTS } from '/engine/core.js';
import { NIGHT } from './_tpl_night.js';
import { SCI } from './_tpl_sci.js';
import { STORY } from './_tpl_story.js';
import { HUNGER } from './_tpl_hunger.js';
import { SUGAR } from './_tpl_sugar.js';
import { sleepBadge } from '../sets/badge.js';

const TPL = { ...NIGHT, ...SCI, ...STORY, ...HUNGER, ...SUGAR };

function stamp(g, t, s) {
  const at = s.at ?? 0.1, k = prog(t, at, at + 0.2); if (t < at) return;
  const a = clamp((t - at) / 0.06) * (s.until != null ? 1 - clamp((t - s.until) / 0.2) : 1); if (a <= 0) return;
  const sc = 1 + 1.4 * (1 - ease.outBack(k)), [sx, sy] = shake(t, 10 * (1 - k), 40), col = s.color || '#ffffff';
  g.save(); g.globalAlpha *= a; g.translate(E.W / 2 + sx + (s.x || 0), (s.y ?? E.H * 0.5) + sy); g.rotate(s.rot ?? -0.04); g.scale(sc, sc);
  text(g, s.text, 0, 0, { size: s.size || 170, font: FONTS.title, weight: 700, color: col, stroke: 22, strokeColor: '#05060c', glow: 34, glowColor: alpha(col === '#ffffff' ? '#ff5a4a' : col, 0.75), spacing: 6 });
  g.restore();
}

for (const sh of E.shots || []) {
  const p = sh.params || {}, T = TPL[p.tpl];
  registerShot(sh.id, { draw(g, t, info) {
    if (!T) throw new Error(`unknown template "${p.tpl}" in ${sh.id}`);
    const punches = info.punch || [];
    let z = 1; for (const pt of punches) if (t >= pt) z += 0.06 * Math.exp(-(t - pt) * 7);
    g.save(); if (z !== 1) { g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2); }
    T(g, t, info);
    g.restore();
    for (const s of [].concat(info.stamp || [])) stamp(g, t, s);
    sleepBadge(g, info.globalT, info);
  } });
}
