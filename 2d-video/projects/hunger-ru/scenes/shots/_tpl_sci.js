// _tpl_sci.js — explanation templates: blueprint brain, prions, DNA, EEG, family tree, coin, globe, data cards, icon rows.
import { E, S, ease, prog, lerp, clamp, key, rr, seg, circle, ring, poly, text, measure, glow, alpha, shade, linGrad, rng, shake, FONTS, blurLayer, veil, layer } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { bigFace, POSES } from '/engine/rig2d.js';
import { bedroom } from '../sets/bedroom.js';
import { HERO, F } from '../cast.js';
import { camAt } from './_tpl_night.js';
import { extraIcon } from './_icons.js';

const ui = () => S().ui;
const BP = () => ui().blueprint, GOLD = () => ui().gold, RED = '#ff5a4a';
const K = (info, t) => ease.inOut(t / info.dur);
const pop = (t, at, d = 0.35) => ease.outBack(prog(t, at, at + d));
function zoom(g, z, cx = E.W / 2, cy = E.H / 2) { g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); }
function bg(g, t, kind, info) {
  if (kind === 'room') { blurLayer(g, 16, (g) => bedroom(g, t, camAt(1000, 560, 1.4), { dawn: 0 })); veil(g, '#05060f', 0.62); return; }
  if (kind === 'red') { g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#14040a', '#2a0812', '#0a0206']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H / 2, 900, RED, 0.18); return; }
  if (kind === 'dark') { g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#07081a', '#10142e', '#07081a']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H / 2, 900, '#3a4aa0', 0.25); return; }
  UI.blueprint(g, { grid: 60, a: 0.08 }); glow(g, E.W / 2, E.H / 2, 1000, BP(), 0.06);
}
const label = (g, s, x, y, o = {}) => text(g, s, x, y, { size: o.size || 34, font: FONTS.ui, weight: 900, color: o.color || ui().cream, spacing: o.spacing ?? 3, align: o.align || 'center', alpha: o.a ?? 1, glow: o.glow || 0, glowColor: o.glowColor });

// ---------- icons (flat line-art; colour c, scale s, centred on x,y) ----------
export function icon(g, name, x, y, s = 1, c = BP(), t = 0) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  const st = (w = 6) => { g.strokeStyle = c; g.lineWidth = w; };
  if (extraIcon(g, name, c, t)) { g.restore(); return; }
  switch (name) {
    case 'virus': st(); g.beginPath(); g.arc(0, 0, 44, 0, 7); g.stroke(); for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 + t * 0.4; seg(g, [[Math.cos(a) * 44, Math.sin(a) * 44], [Math.cos(a) * 66, Math.sin(a) * 66]], 6, c); circle(g, Math.cos(a) * 70, Math.sin(a) * 70, 8, c); } break;
    case 'bacteria': st(); rr(g, -70, -30, 140, 60, 30); g.stroke(); for (const k of [-1, 1]) { g.beginPath(); g.moveTo(k * 70, 0); for (let q = 0; q < 4; q++) g.lineTo(k * (78 + q * 12), (q % 2 ? 12 : -12) * Math.cos(t * 6 + q)); g.stroke(); } break;
    case 'protein': st(7); g.beginPath(); for (let q = 0; q <= 60; q++) { const a = q * 0.42, r = 10 + q * 0.75; g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8); } g.stroke(); break;
    case 'prion': st(7); g.beginPath(); for (let q = 0; q <= 9; q++) g.lineTo(-60 + q * 13, (q % 2 ? -34 : 34) * (q % 3 ? 1 : 0.5)); g.stroke(); break;
    case 'pill': rr(g, -70, -28, 140, 56, 28); g.fillStyle = c; g.fill(); g.save(); rr(g, -70, -28, 140, 56, 28); g.clip(); g.fillStyle = '#f2f4fa'; g.fillRect(0, -40, 80, 80); g.restore(); break;
    case 'shield': st(7); g.beginPath(); g.moveTo(0, -70); g.quadraticCurveTo(56, -56, 60, -40); g.quadraticCurveTo(58, 30, 0, 74); g.quadraticCurveTo(-58, 30, -60, -40); g.quadraticCurveTo(-56, -56, 0, -70); g.closePath(); g.stroke(); break;
    case 'flame': g.fillStyle = c; g.beginPath(); g.moveTo(0, -72); g.quadraticCurveTo(54, -10, 40, 30); g.quadraticCurveTo(28, 70, 0, 70); g.quadraticCurveTo(-28, 70, -40, 30); g.quadraticCurveTo(-54, -10, 0, -72); g.fill(); break;
    case 'flask': st(); g.beginPath(); g.moveTo(-18, -66); g.lineTo(-18, -16); g.lineTo(-58, 60); g.lineTo(58, 60); g.lineTo(18, -16); g.lineTo(18, -66); g.stroke(); seg(g, [[-30, -66], [30, -66]], 6, c); g.fillStyle = alpha(c, 0.35); g.beginPath(); g.moveTo(-40, 26); g.lineTo(40, 26); g.lineTo(58, 60); g.lineTo(-58, 60); g.fill(); break;
    case 'scalpel': st(); seg(g, [[-70, 40], [10, -20]], 10, c); g.fillStyle = c; g.beginPath(); g.moveTo(10, -26); g.quadraticCurveTo(70, -70, 76, -40); g.lineTo(18, -12); g.fill(); break;
    case 'cow': g.fillStyle = c; rr(g, -70, -30, 120, 64, 26); g.fill(); rr(g, 36, -56, 52, 46, 18); g.fill(); for (const lx of [-56, -28, 14, 38]) g.fillRect(lx, 28, 12, 40); g.fillStyle = '#0b1324'; for (const [sx, sy, r] of [[-40, -8, 12], [-6, 10, 10], [18, -12, 8]]) circle(g, sx, sy, r, '#0b1324'); seg(g, [[44, -54], [36, -74]], 6, c); seg(g, [[80, -54], [88, -74]], 6, c); break;
    case 'head': st(7); g.beginPath(); g.arc(0, -6, 54, 0, 7); g.stroke(); seg(g, [[-30, 48], [-40, 74], [40, 74], [30, 48]], 7, c); break;
    case 'moon': g.fillStyle = c; g.beginPath(); g.arc(0, 0, 56, 0, 7); g.fill(); g.fillStyle = '#0b1324'; g.beginPath(); g.arc(22, -16, 50, 0, 7); g.fill(); break;
    case 'heart': g.fillStyle = c; g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(-80, 0, -50, -70, 0, -30); g.bezierCurveTo(50, -70, 80, 0, 0, 60); g.fill(); break;
    case 'dna': for (let q = 0; q < 9; q++) { const yy = -70 + q * 17, a = q * 0.7 + t * 2; const x1 = Math.sin(a) * 34, x2 = -x1; seg(g, [[x1, yy], [x2, yy]], 4, alpha(c, 0.6)); circle(g, x1, yy, 7, c); circle(g, x2, yy, 7, c); } break;
    case 'brain': st(6); g.beginPath(); g.ellipse(0, 0, 70, 52, 0, 0, 7); g.stroke(); for (const [a, b] of [[-40, -20], [0, -30], [36, -14], [-20, 16], [24, 20]]) { g.beginPath(); g.arc(a, b, 18, 0.2, 3.4); g.stroke(); } break;
  }
  g.restore();
}
function cross(g, x, y, k, s = 1) { if (k <= 0) return; const r = 80 * s * clamp(k * 1.2); seg(g, [[x - r, y - r], [x - r + 2 * r * clamp(k * 2), y - r + 2 * r * clamp(k * 2)]], 14 * s, RED); if (k > 0.5) seg(g, [[x + r, y - r], [x + r - 2 * r * clamp((k - 0.5) * 2), y - r + 2 * r * clamp((k - 0.5) * 2)]], 14 * s, RED); }

// ---------- blueprint brain (side cutaway inside a head outline). centre BC, scale s ----------
function brain(g, t, info, cx, cy, s) {
  const c = BP(), mode = info.mode || 'intro', gold = GOLD();
  g.save(); g.translate(cx, cy); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = alpha(c, 0.5); g.lineWidth = 5; g.beginPath(); g.arc(0, 10, 330, Math.PI * 0.95, Math.PI * 2.32); g.stroke();            // head outline
  g.beginPath(); g.moveTo(-310, 120); g.quadraticCurveTo(-340, 260, -180, 330); g.stroke();
  g.strokeStyle = c; g.lineWidth = 6; g.beginPath();                                                                                    // cerebrum
  g.moveTo(-250, 60); g.bezierCurveTo(-300, -120, -120, -250, 40, -240); g.bezierCurveTo(220, -230, 300, -100, 280, 30); g.bezierCurveTo(270, 110, 200, 130, 140, 120);
  g.bezierCurveTo(60, 110, -20, 150, -110, 140); g.bezierCurveTo(-200, 130, -240, 110, -250, 60); g.stroke();
  g.lineWidth = 4; g.strokeStyle = alpha(c, 0.55);
  for (const [x, y, r, a0, a1] of [[-160, -80, 60, 3.6, 5.6], [-60, -170, 70, 3.4, 5.9], [80, -170, 64, 3.6, 6.1], [190, -80, 60, 4.0, 6.6], [-150, 40, 50, 3.4, 5.8], [160, 30, 54, 3.8, 6.4], [0, -60, 50, 3.3, 6.0]]) { g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); }
  g.strokeStyle = c; g.lineWidth = 6; g.beginPath(); g.ellipse(170, 170, 90, 56, -0.2, 0, 7); g.stroke();                                 // cerebellum
  for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(170, 170, 70 - k * 16, 40 - k * 9, -0.2, 3.4, 6); g.stroke(); }
  g.beginPath(); g.moveTo(40, 120); g.quadraticCurveTo(70, 220, 40, 330); g.moveTo(100, 120); g.quadraticCurveTo(110, 230, 90, 330); g.stroke();   // brainstem
  if (mode === 'clean' || mode === 'dirty') {        // sleep washes the brain; without it the waste piles up
    g.save(); g.beginPath(); g.moveTo(-250, 60); g.bezierCurveTo(-300, -120, -120, -250, 40, -240); g.bezierCurveTo(220, -230, 300, -100, 280, 30); g.bezierCurveTo(270, 110, 200, 130, 140, 120); g.bezierCurveTo(60, 110, -20, 150, -110, 140); g.bezierCurveTo(-200, 130, -240, 110, -250, 60); g.clip();
    const r = rng(12), wave = mode === 'clean' ? ((t * 0.5) % 1.3) * 700 - 350 : -9999;
    for (let i = 0; i < 70; i++) { const x = -260 + r() * 540, y = -230 + r() * 360, gone = mode === 'clean' && x < wave, grow = mode === 'dirty' ? clamp((t - r() * info.dur * 0.8) / 0.4) : 1;
      if (!gone && grow > 0) circle(g, x, y, (5 + r() * 7) * grow, alpha(mode === 'dirty' ? '#ff7a5a' : '#c8a070', 0.85)); }
    if (mode === 'clean') { g.fillStyle = linGrad(g, wave - 160, 0, wave + 40, 0, [alpha('#6ad0ff', 0), alpha('#6ad0ff', 0.45), alpha('#6ad0ff', 0)]); g.fillRect(wave - 160, -260, 200, 420); }
    g.restore();
  }
  // thalamus
  const tx = 30, ty = 20, th = mode === 'intro' ? pop(t, info.hiAt ?? 0.6) : mode === 'clean' || mode === 'dirty' ? 0 : 1, pulse = 0.5 + 0.5 * Math.sin(t * 5);
  if (th > 0) {
    glow(g, tx, ty, 150 * th, mode === 'destroy' || mode === 'sponge' ? RED : gold, (0.35 + 0.2 * pulse) * th);
    g.fillStyle = alpha(mode === 'destroy' || mode === 'sponge' ? '#ff8a6a' : gold, 0.85 * th); g.beginPath(); g.ellipse(tx, ty, 62 * th, 40 * th, 0.15, 0, 7); g.fill();
    if (mode === 'destroy') { const r = rng(5), dead = prog(t, 0.2, info.dur - 0.2); for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 34; circle(g, tx + Math.cos(a) * d * 1.5, ty + Math.sin(a) * d, 7, r() < dead ? '#2a0a0a' : '#fff4d0'); } }
    if (mode === 'sponge') { const r = rng(9), n = Math.floor(prog(t, 0.1, info.dur * 0.8) * 22); for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 32; circle(g, tx + Math.cos(a) * d * 1.6, ty + Math.sin(a) * d, 4 + r() * 6, '#1a0606'); } }
    if (mode === 'switch') {   // sensory lines from eyes and ears run into the thalamus, then switch off
      const off = ease.inOut(prog(t, info.offAt ?? 1.0, (info.offAt ?? 1.0) + 0.5));
      for (const [px, py] of [[-300, -40], [-290, 10], [-60, 260], [250, -150]]) { g.setLineDash([14, 12]); g.lineDashOffset = -t * 60; seg(g, [[px, py], [tx, ty]], 5, alpha(gold, 0.9 * (1 - off))); g.setLineDash([]); circle(g, px, py, 12, alpha(gold, 1 - off * 0.7)); }
      if (off > 0) { circle(g, tx, ty - 90, 30, alpha('#0b1324', 0.9)); text(g, 'OFF', tx, ty - 90, { size: 26, font: FONTS.ui, weight: 900, color: RED, alpha: off }); }
    }
  }
  g.restore();
  if (th > 0.6 && info.callout !== false) UI.callout(g, t, { at: [cx + tx * s, cy + ty * s], to: [cx + 380 * s, cy - 200 * s], str: info.calloutText || 'TÁLAMO', color: mode === 'destroy' || mode === 'sponge' ? '#ff9a8a' : GOLD(), size: 40, start: (info.hiAt ?? 0.6) + 0.2 });
}

// ---------- protein chain: normal spirals vs misfolded zigzags; misfolding spreads from one to the next ----------
function protein(g, x, y, s, k, wob) {  // k: 0 normal spiral, 1 misfolded zigzag
  g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  const c = k < 0.5 ? BP() : RED; g.strokeStyle = c; g.lineWidth = 7; g.beginPath();
  for (let q = 0; q <= 40; q++) { const a = q * 0.45 + wob, r = 8 + q * 1.0, sx = Math.cos(a) * r, sy = Math.sin(a) * r * 0.85; const zx = -50 + q * 2.5, zy = (q % 8 < 4 ? -1 : 1) * 34 * ((q % 4) / 4 - 0.5) * 2; g.lineTo(lerp(sx, zx, k), lerp(sy, zy, k)); }
  g.stroke(); if (k > 0.5) glow(g, 0, 0, 70, RED, 0.25 * k); g.restore();
}

export const SCI = {
  title(g, t, info) {             // glowing title over a dark/room background
    bg(g, t, info.bg || 'room', info);
    UI.titleCard(g, t, { lines: info.lines || ['INSOMNIO', 'FAMILIAR FATAL'], sub: info.sub || null, dur: info.dur + 0.6, y: E.H / 2 });
    FX.dust(g, t, { count: 30, color: '#ffe2bd', a: 0.25 });
  },
  bigNumber(g, t, info) {         // one number, huge, with a label; value can count from→to
    bg(g, t, info.bg || 'blueprint', info);
    const at = info.at ?? 0.1, a = pop(t, at, 0.4), z = lerp(1, 1.06, K(info, t));
    if (info.pre) { g.save(); zoom(g, z); { const pa = ease.outBack(prog(t, 0, 0.35)), ready = t > (info.at ?? 0.1); g.save(); g.translate(E.W / 2, ready ? E.H * 0.53 - (info.size || 230) * 0.78 : E.H * 0.5); const ps = ready ? 1 : 1.5 * pa; g.scale(ps, ps); label(g, info.pre, 0, 0, { size: 52, color: ready ? ui().cream : GOLD(), glow: ready ? 0 : 18, glowColor: alpha(GOLD(), 0.5), spacing: 5 }); g.restore(); } g.restore(); }
    g.save(); zoom(g, z); g.globalAlpha *= clamp(a * 1.5);
    if (info.icon) icon(g, info.icon, E.W / 2, E.H * 0.26, 1.3 * a, info.iconColor || GOLD(), t);
    let v = info.value; if (info.from != null) { const p = ease.out(prog(t, at, at + (info.count || 1.2))); const n = lerp(info.from, info.to, p); v = (info.decimals ? n.toFixed(info.decimals) : Math.round(n).toLocaleString('ru-RU')) + (info.suffix || ''); }
    const col = info.color || GOLD(), size = info.size || 230;
    g.save(); g.translate(E.W / 2, E.H * 0.53); g.scale(a, a);
    text(g, String(v), 0, 0, { size, font: FONTS.ui, weight: 900, color: col, glow: 40, glowColor: alpha(col, 0.6) }); g.restore();
    if (info.label) label(g, info.label, E.W / 2, E.H * 0.53 + size * 0.62, { size: 54, a: ease.out(prog(t, at + 0.25, at + 0.6)) });
    if (info.sub) label(g, info.sub, E.W / 2, E.H * 0.53 + size * 0.62 + 66, { size: 32, color: alpha(ui().cream, 0.7), a: ease.out(prog(t, at + 0.5, at + 0.9)) });
    g.restore();
  },
  iconRow(g, t, info) {           // icons pop in one by one, some get a red cross; optional final highlight
    bg(g, t, info.bg || 'blueprint', info);
    if (info.caption) label(g, info.caption, E.W / 2, E.H * 0.17, { size: 56, color: GOLD(), a: ease.out(prog(t, 0, 0.3)), glow: 16, glowColor: alpha(GOLD(), 0.5) });
    const items = info.items || [], n = items.length, gap = Math.min(440, (E.W * 0.82) / Math.max(1, n));
    items.forEach((it, i) => {
      const x = E.W / 2 + (i - (n - 1) / 2) * gap, y = E.H * 0.46, a = pop(t, it.at ?? 0.1 + i * 0.3);
      if (a <= 0) return;
      const hi = it.hi != null && t > it.hi, col = hi ? GOLD() : it.color || BP();
      if (hi) glow(g, x, y, 220, GOLD(), 0.3);
      icon(g, it.icon, x, y, 1.5 * a * (hi ? 1.15 : 1), col, t);
      if (it.label) label(g, it.label, x, y + 150, { size: 38, color: hi ? GOLD() : ui().cream, a });
      if (it.cross != null) cross(g, x, y, ease.out(prog(t, it.cross, it.cross + 0.3)), 1.1);
    });
  },
  brain(g, t, info) {
    bg(g, t, 'blueprint', info);
    const z = lerp(info.z0 || 1, info.z1 || 1.08, K(info, t)), fx = info.focus ? lerp(0, 1, ease.inOut(prog(t, 0, info.dur))) : 0;
    g.save(); zoom(g, z, E.W / 2 + fx * 60, E.H / 2); brain(g, t, info, E.W * 0.46, E.H * 0.56, info.s || 1.12); g.restore();
  },
  prions(g, t, info) {            // grid of PrP proteins; mode normal | misfold | spread
    bg(g, t, 'blueprint', info);
    const mode = info.mode || 'normal', cols = 7, rows = 3, sx = 230, sy = 230, x0 = E.W / 2 - ((cols - 1) * sx) / 2, y0 = E.H * 0.52 - ((rows - 1) * sy) / 2;
    const z = lerp(1, 1.05, K(info, t)); g.save(); zoom(g, z);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = x0 + c * sx, y = y0 + r * sy, i = r * cols + c, d = Math.hypot(c - 3, r - 1);
      let k = 0;
      if (mode === 'misfold' && c === 3 && r === 1) k = ease.inOut(prog(t, info.at ?? 0.6, (info.at ?? 0.6) + 0.6));
      if (mode === 'spread') k = ease.inOut(prog(t, (info.at ?? 0.3) + d * 0.32, (info.at ?? 0.3) + d * 0.32 + 0.4));
      const a = mode === 'normal' ? pop(t, 0.05 + i * 0.03) : 1; if (a <= 0) continue;
      protein(g, x, y, 0.9 * a, k, t * 0.6 + i);
      if (mode === 'spread' && k > 0.05 && k < 0.95) FX.rings(g, x, y, k, { count: 1, r0: 40, r1: 120, color: RED, a: 0.5 });
    }
    g.restore();
    if (mode === 'normal' && info.callout !== false) UI.callout(g, t, { at: [E.W / 2, E.H * 0.52], to: [E.W / 2 + 330, E.H * 0.2], str: 'PrP', color: GOLD(), size: 46, start: 0.6 });
    if (info.caption) label(g, info.caption, E.W / 2, E.H * 0.9, { size: 40, color: mode === 'normal' ? ui().cream : '#ff9a8a', a: ease.out(prog(t, info.capAt ?? 0.4, (info.capAt ?? 0.4) + 0.3)) });
  },
  dna(g, t, info) {               // horizontal helix scrolling; one letter flips on `at`; "3.000.000.000" counter
    bg(g, t, 'blueprint', info);
    const L = 'ATGCGTACCTGAGTCAATGCCGTA', at = info.at ?? 0.8, flip = t > at, scroll = Math.min(t, at) * 90;
    for (let q = 0; q < 26; q++) {
      const x = 120 + q * 70 - (scroll % 70), a = (x / 160) + t * 0.2, y1 = E.H * 0.45 + Math.sin(a) * 90, y2 = E.H * 0.45 - Math.sin(a) * 90;
      seg(g, [[x, y1], [x, y2]], 5, alpha(BP(), 0.45)); circle(g, x, y1, 10, BP()); circle(g, x, y2, 10, BP());
      const idx = (q + Math.floor(scroll / 70)) % L.length, mid = q === 13, ch = mid && flip ? 'A' : L[idx];
      const col = mid && flip ? RED : mid ? GOLD() : alpha(ui().cream, 0.75);
      text(g, mid && !flip ? 'G' : ch, x, E.H * 0.72, { size: mid ? 64 : 40, font: FONTS.ui, weight: 900, color: col, glow: mid ? 20 : 0, glowColor: alpha(col, 0.7) });
    }
    if (flip) { const k = ease.outBack(prog(t, at, at + 0.35)); g.save(); g.translate(120 + 13 * 70 - (scroll % 70), E.H * 0.72); g.scale(k, k); ring(g, 0, 0, 70, 6, RED); g.restore(); }
    if (info.counter) label(g, info.counter, E.W / 2, E.H * 0.9, { size: 46, color: GOLD(), a: ease.out(prog(t, info.counterAt ?? at + 0.4, (info.counterAt ?? at + 0.4) + 0.3)) });
  },
  eeg(g, t, info) {               // two recordings drawn left→right: normal night (waves deepen) vs his (flat, awake)
    bg(g, t, 'blueprint', info);
    const rows = [['SUEÑO NORMAL', 'sleep', BP()], [info.who || 'SILVANO', 'awake', RED]], p = prog(t, 0.15, info.dur * 0.85);
    rows.forEach(([name, kind, col], i) => {
      const y = E.H * (0.34 + i * 0.34), x0 = 260, x1 = E.W - 160;
      label(g, name, x0 - 20, y - 110, { size: 36, align: 'left', color: col });
      g.strokeStyle = col; g.lineWidth = 4; g.beginPath();
      for (let x = x0; x <= lerp(x0, x1, p); x += 3) { const u = (x - x0) / (x1 - x0), depth = kind === 'sleep' ? Math.min(1, u * 2.2) : 0;
        const v = kind === 'sleep' ? Math.sin(x * lerp(0.22, 0.04, depth)) * lerp(10, 70, depth) + (u > 0.35 && u < 0.45 ? Math.sin(x * 0.6) * 18 : 0) : Math.sin(x * 0.31) * 9 + Math.sin(x * 0.53 + 1) * 6;
        g.lineTo(x, y + v); }
      g.stroke();
    });
    if (info.verdict) label(g, info.verdict, E.W / 2, E.H * 0.92, { size: 44, color: '#ff9a8a', a: ease.out(prog(t, info.verdictAt ?? info.dur * 0.7, (info.verdictAt ?? info.dur * 0.7) + 0.3)) });
  },
  tree(g, t, info) {              // family tree back through generations; affected relatives in red; camera tilts down the years
    bg(g, t, 'blueprint', info);
    const gens = [['1765', 1], ['1800', 3], ['1850', 5], ['1900', 7], ['1950', 8], ['1984', 6]], r = rng(21);
    const tilt = lerp(0, -E.H * 0.9, ease.inOut(prog(t, 0.2, info.dur - 0.2)));
    g.save(); g.translate(0, tilt);
    let prev = [];
    gens.forEach(([yr, n], gi) => {
      const y = 180 + gi * 330, xs = Array.from({ length: n }, (_, i) => E.W / 2 + (i - (n - 1) / 2) * 200);
      label(g, yr, 120, y, { size: 40, align: 'left', color: alpha(ui().cream, 0.6) });
      xs.forEach((x, i) => { if (prev.length) { const px = prev[Math.min(prev.length - 1, Math.floor((i / n) * prev.length))]; seg(g, [[px, y - 330 + 50], [px, y - 165], [x, y - 165], [x, y - 50]], 3, alpha(BP(), 0.5)); }
        const aff = gi === 0 || gi === gens.length - 1 ? i === Math.floor(n / 2) : r() < 0.5; const a = pop(t, 0.1 + gi * 0.2);
        UI.lineFigure(g, { x, y: y + 44, s: 0.42 * a, color: aff ? RED : BP() }); if (aff) glow(g, x, y, 60, RED, 0.3 * a); });
      prev = xs;
    });
    g.restore();
    if (info.caption) label(g, info.caption, E.W / 2, E.H * 0.92, { size: 42, color: GOLD(), a: ease.out(prog(t, info.capAt ?? 0.6, (info.capAt ?? 0.6) + 0.3)) });
  },
  coin(g, t, info) {              // a coin spins: "50%"; parent figure on the left, child on the right
    bg(g, t, 'blueprint', info);
    const spin = t * 10, sx = Math.cos(spin), cx = E.W / 2, cy = E.H * 0.45, land = t > (info.landAt ?? info.dur - 0.5);
    UI.lineFigure(g, { x: 360, y: E.H * 0.78, s: 1.4, color: RED }); label(g, 'PADRE / MADRE', 360, E.H * 0.86, { size: 30 });
    UI.lineFigure(g, { x: E.W - 360, y: E.H * 0.78, s: 1.0, color: land ? RED : BP() }); label(g, 'HIJO', E.W - 360, E.H * 0.86, { size: 30 });
    g.save(); g.translate(cx, cy); g.scale(land ? 1 : Math.abs(sx) * 0.96 + 0.04, 1);
    circle(g, 0, 0, 180, GOLD()); ring(g, 0, 0, 160, 8, shade(GOLD(), -0.25)); g.restore();
    if (land || Math.abs(sx) > 0.4) text(g, '50%', cx, cy + 4, { size: 110, font: FONTS.ui, weight: 900, color: '#3a2a00' });
  },
  globe(g, t, info) {             // a blueprint globe with fewer than 100 dots appearing
    bg(g, t, 'blueprint', info);
    const cx = E.W / 2, cy = E.H * 0.48, R = 330, rot = t * 0.25;
    ring(g, cx, cy, R, 5, BP()); glow(g, cx, cy, R * 1.3, BP(), 0.08);
    g.strokeStyle = alpha(BP(), 0.35); g.lineWidth = 2;
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(cx, cy + k * R * 0.33, Math.sqrt(1 - (k * 0.33) ** 2) * R, 14, 0, 0, 7); g.stroke(); }
    for (let k = 0; k < 6; k++) { const a = ((k / 6) * Math.PI + rot) % Math.PI; g.beginPath(); g.ellipse(cx, cy, Math.abs(Math.cos(a)) * R, R, 0, 0, 7); g.stroke(); }
    const r = rng(33), n = Math.floor(prog(t, 0.2, info.dur * 0.7) * (info.dots || 70));
    for (let i = 0; i < n; i++) { const lat = (r() - 0.5) * 2.4, lon = r() * 6.28 + rot, z = Math.cos(lon); if (z < 0) continue; const x = cx + Math.sin(lon) * Math.cos(lat) * R, y = cy + Math.sin(lat) * R * 0.9; circle(g, x, y, 9, RED); glow(g, x, y, 26, RED, 0.5); }
    if (info.caption) label(g, info.caption, cx, E.H * 0.92, { size: 48, color: GOLD(), a: ease.out(prog(t, info.capAt ?? 0.5, (info.capAt ?? 0.5) + 0.3)) });
  },
  bodyChain(g, t, info) {         // blueprint body: organs light up red one after another; optional shield cracking
    bg(g, t, 'blueprint', info);
    const cx = E.W * 0.42, base = E.H * 0.92;
    UI.lineFigure(g, { x: cx, y: base, s: 3.4, color: alpha(BP(), 0.8) });
    const organs = [['brain', cx + 8, base - 700], ['heart', cx + 10, base - 520], ['shield', cx - 6, base - 420]];
    organs.forEach(([n, x, y], i) => { const k = ease.out(prog(t, (info.at ?? 0.3) + i * 0.45, (info.at ?? 0.3) + i * 0.45 + 0.3)); icon(g, n, x, y, 0.7, k > 0 ? RED : BP(), t); if (k > 0) glow(g, x, y, 120, RED, 0.35 * k); });
    if (info.shield) { const k = ease.out(prog(t, info.shield, info.shield + 0.4)); icon(g, 'shield', E.W * 0.72, E.H * 0.45, 2.2, k > 0.5 ? RED : GOLD(), t); if (k > 0) { seg(g, [[E.W * 0.72, E.H * 0.3], [E.W * 0.71, E.H * 0.42], [E.W * 0.73, E.H * 0.5], [E.W * 0.715, E.H * 0.6]], 6, alpha('#0b1324', k)); } }
    if (info.caption) label(g, info.caption, E.W * 0.72, E.H * 0.82, { size: 40, color: '#ff9a8a', a: ease.out(prog(t, info.capAt ?? 0.8, (info.capAt ?? 0.8) + 0.3)) });
  },
  nerves(g, t, info) {            // the autonomic system: nerve branches from the spine flicker and break
    bg(g, t, 'blueprint', info);
    const cx = E.W / 2, base = E.H * 0.95, br = ease.inOut(prog(t, info.breakAt ?? 0.8, (info.breakAt ?? 0.8) + 0.8));
    UI.lineFigure(g, { x: cx, y: base, s: 3.4, color: alpha(BP(), 0.6) });
    const r = rng(4);
    for (let i = 0; i < 16; i++) { const y = base - 640 + i * 26, side = i % 2 ? 1 : -1, len = 90 + r() * 120, broken = r() < br, fl = 0.6 + 0.4 * Math.sin(t * 20 + i * 3);
      const col = broken ? RED : GOLD(); g.strokeStyle = alpha(col, broken ? fl : 0.9); g.lineWidth = 4; g.beginPath(); g.moveTo(cx, y);
      g.quadraticCurveTo(cx + side * len * 0.5, y - 20, cx + side * len, y + 30 * (r() - 0.5)); g.stroke(); }
    if (info.caption) label(g, info.caption, E.W / 2, E.H * 0.08 + 40, { size: 42, color: GOLD(), a: ease.out(prog(t, 0.3, 0.6)) });
  },
  symptoms(g, t, info) {          // the hero's face with one symptom overlay: sweat | pressure | pupils | heart
    blurLayer(g, 14, (g) => bedroom(g, t, camAt(1100, 560, 1.5), { dawn: 0 })); veil(g, '#07081a', 0.45);
    const mode = info.mode || 'sweat', r = lerp(300, 330, K(info, t)), beat = mode === 'heart' ? Math.max(0, Math.sin(t * 14)) ** 8 : 0;
    const [sx, sy] = mode === 'heart' ? shake(t, 4 * beat, 30) : [0, 0];
    const fc = mode === 'pupils' ? { ...F.awake, pupil: lerp(0.42, 0.16, ease.inOut(prog(t, 0.3, 1.0))), eyeSize: 1.3 } : mode === 'heart' ? F.fear : F.tired;
    const cx = mode === 'pupils' ? E.W / 2 : E.W * 0.38, cy = mode === 'pupils' ? E.H * 0.5 + r * 0.6 : E.H * 0.6, rr2 = mode === 'pupils' ? r * 1.9 : r;
    bigFace(g, cx + sx, cy + sy, rr2, { outfit: HERO, face: fc, look: [0, 0], rimColor: '#b8c8ff', rimSide: 1 });
    if (mode === 'sweat') { const rd = rng(7); for (let i = 0; i < 9; i++) { const x = cx - r * 0.7 + rd() * r * 1.4, y0 = cy - r * 0.8 + rd() * r * 0.6, y = y0 + ((t * 90 + i * 40) % 160); g.fillStyle = alpha('#bfe4ff', 0.85); g.beginPath(); g.moveTo(x, y - 16); g.quadraticCurveTo(x + 11, y + 4, x, y + 10); g.quadraticCurveTo(x - 11, y + 4, x, y - 16); g.fill(); } }
    if (mode === 'pressure') { const v = 0.5 + 0.45 * Math.sin(t * 4.5) * Math.sin(t * 1.7 + 1); const gx = E.W * 0.75, gy = E.H * 0.55; g.strokeStyle = alpha(BP(), 0.6); g.lineWidth = 16; g.beginPath(); g.arc(gx, gy, 200, Math.PI, Math.PI * 2); g.stroke();
      g.strokeStyle = RED; g.beginPath(); g.arc(gx, gy, 200, Math.PI * 1.75, Math.PI * 2); g.stroke(); seg(g, [[gx, gy], [gx + Math.cos(Math.PI * (1 + v)) * 180, gy + Math.sin(Math.PI * (1 + v)) * 180]], 10, '#ffffff'); circle(g, gx, gy, 18, '#ffffff'); label(g, 'ДАВЛЕНИЕ', gx, gy + 70, { size: 40 }); }
    if (mode === 'heart') { const x0 = E.W * 0.6, w = E.W * 0.36, y = E.H * 0.5; g.strokeStyle = RED; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 80; i++) { const ph = (i / 80) * 6 + t * 4, c = ph % 1; const v = c > 0.4 && c < 0.45 ? -1 : c > 0.45 && c < 0.5 ? 0.7 : 0; g.lineTo(x0 + (i / 80) * w, y + v * 130); } g.stroke();
      icon(g, 'heart', E.W * 0.78, E.H * 0.24, 0.9 + beat * 0.25, RED); label(g, `${Math.round(lerp(120, 150, K(info, t)))} УД/МИН`, E.W * 0.78, E.H * 0.76, { size: 50, color: '#ff9a8a' }); }
  },
};
