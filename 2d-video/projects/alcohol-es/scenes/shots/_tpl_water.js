// _tpl_water.js — templates of "Что если ты перестанешь пить воду?". (g, t, info); knobs from beats.py params.
import { E, S, ease, prog, lerp, clamp, key, rr, seg, circle, ring, poly, text, measure, glow, alpha, shade, mix, linGrad, rng, shake, FONTS, layer, blurLayer, veil } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { drawFigure, POSES, breathe, posesAt, walkPose, bigFace } from '/engine/rig2d.js';
import { GY, HS } from '../sets/bedroom.js';
import { kitchen } from '../sets/week.js';
import { office } from '../sets/places.js';
import { HERO, F } from '../cast.js';
import { camAt, camLerp, blinkAt } from './_tpl_night.js';
import { icon } from './_tpl_sci.js';
import { placeTag } from './_tpl_hunger.js';

const ui = () => S().ui, RED = '#ff5a4a', BLUE = '#6ab8ff', BP = () => ui().blueprint, GOLD = () => ui().gold, CREAM = () => ui().cream;
const K = (info, t) => ease.inOut(t / info.dur);
const pop = (t, at, d = 0.35) => ease.outBack(prog(t, at, at + d));
const fin = (t, at, d = 0.3) => ease.out(prog(t, at, at + d));
const fc = (n) => (typeof n === 'string' ? F[n] : n) || F.talk;
const label = (g, s, x, y, o = {}) => text(g, s, x, y, { size: o.size || 34, font: FONTS.ui, weight: 900, color: o.color || CREAM(), spacing: o.spacing ?? 3, align: o.align || 'center', alpha: o.a ?? 1, glow: o.glow || 0, glowColor: o.glowColor });
const glowLabel = (g, s, x, y, a, size = 56, col = GOLD()) => label(g, s, x, y, { size, color: col, a, glow: 18, glowColor: alpha(col, 0.55) });
function zoom(g, z, cx = E.W / 2, cy = E.H / 2) { g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); }
function bp(g) { UI.blueprint(g, { grid: 60, a: 0.08 }); glow(g, E.W / 2, E.H / 2, 1000, BP(), 0.06); }
function sepia(g, a = 0.3) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(200,150,90,${a})`; g.fillRect(0, 0, E.W, E.H); g.restore(); }
function heat(g, a = 0.25) { g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(255,140,40,${a})`; g.fillRect(0, 0, E.W, E.H); g.restore(); }
const RUNNER = { top: 'tshirt', color: '#e85a3a', head: 'capBack', headColor: '#f2f0e8' };
const NOMAD = { top: 'trench', color: '#2a4a8a', head: 'hood', headColor: '#2a4a8a' };
const PROSPECTOR = { top: 'trench', color: '#8a6a4a', head: 'fedora', headColor: '#5a4030' };
const MCGEE = { top: 'suit', color: '#4a4a3a', head: 'fedora', headColor: '#3a3a2a', face: 'glasses' };

// ---------- sets ----------
function dunes(g, t, cam, o = {}) {
  const storm = o.storm || 0, night = o.night || 0;
  layer(g, cam, 0.12, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [mix('#e8a060', '#0a0c22', night), mix('#f2c890', '#1a1a3a', night), mix('#f8dcb0', '#3a2a3a', night)]); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 40);
    if (night > 0.5) { FX.stars(g, t, { count: 140 }); FX.moon(g, 1500, 180, 46); } else FX.sun(g, 1450, 200, 70); });
  layer(g, cam, 0.4, (g) => FX.hills(g, { y: GY - 220, amp: 110, color: mix('#d89a5a', '#2a2030', night), seed: 5, freq: 0.003 }));
  layer(g, cam, 0.7, (g) => FX.hills(g, { y: GY - 90, amp: 70, color: mix('#e8ae6a', '#3a2a30', night), seed: 11, freq: 0.004 }));
  layer(g, cam, 1, (g) => { g.fillStyle = linGrad(g, 0, GY, 0, GY + 400, [mix('#f2c080', '#4a3a3a', night), mix('#d89a5a', '#2a2028', night)]); g.fillRect(-E.W * 2, GY, E.W * 6, E.H * 3);
    for (let i = -6; i < 30; i++) { g.strokeStyle = alpha('#a86a3a', 0.25); g.lineWidth = 3; g.beginPath(); g.moveTo(i * 160, GY + 30 + (i % 3) * 40); g.quadraticCurveTo(i * 160 + 80, GY + 10 + (i % 3) * 40, i * 160 + 160, GY + 30 + (i % 3) * 40); g.stroke(); } });
  if (storm > 0) { g.save(); g.fillStyle = `rgba(210,150,80,${0.55 * storm})`; g.fillRect(0, 0, E.W, E.H); g.restore(); const r = rng(3); g.strokeStyle = alpha('#fff0d8', 0.35 * storm); g.lineWidth = 2; for (let i = 0; i < 70; i++) { const y = r() * E.H, x = ((r() * E.W * 2 + t * 1500) % (E.W + 400)) - 200; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 220, y + 30); g.stroke(); } }
  return { rim: night > 0.5 ? '#cfe0ff' : '#fff1d0', rimDir: [0.6, -0.8] };
}
function sonoran(g, t, cam, o = {}) {
  layer(g, cam, 0.12, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, ['#5a8ad0', '#b8cce0', '#f4dcb0']); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 40); FX.sun(g, 1500, 180, 60); });
  layer(g, cam, 0.4, (g) => { g.fillStyle = '#9a6a5a'; g.beginPath(); g.moveTo(-E.W, GY - 120); for (let x = -E.W; x <= E.W * 3; x += 120) g.lineTo(x, GY - 140 - Math.abs(Math.sin(x * 0.003)) * 260); g.lineTo(E.W * 3, GY); g.lineTo(-E.W, GY); g.fill(); });
  layer(g, cam, 1, (g) => { g.fillStyle = linGrad(g, 0, GY, 0, GY + 300, ['#d8b080', '#b88a5a']); g.fillRect(-E.W * 2, GY, E.W * 6, E.H * 3);
    for (const [x, s] of [[220, 1.2], [1500, 1.5], [2300, 1.1], [-400, 1.3]]) { const c = '#3a6a3a'; rr(g, x - 26 * s, GY - 380 * s, 52 * s, 380 * s, 26 * s); g.fillStyle = c; g.fill(); rr(g, x - 110 * s, GY - 260 * s, 30 * s, 120 * s, 15 * s); g.fill(); rr(g, x - 110 * s, GY - 160 * s, 90 * s, 28 * s, 14 * s); g.fill(); rr(g, x + 70 * s, GY - 300 * s, 30 * s, 140 * s, 15 * s); g.fill(); rr(g, x + 26 * s, GY - 190 * s, 74 * s, 28 * s, 14 * s); g.fill(); }
    if (o.camp) { poly(g, [[1000, GY], [1150, GY - 220], [1300, GY]], '#e8dcc0'); seg(g, [[1150, GY - 220], [1150, GY]], 5, '#8a6a4a'); g.fillStyle = '#4a6a8a'; g.beginPath(); g.ellipse(1420, GY - 20, 90, 24, 0, 0, Math.PI * 2); g.fill(); glow(g, 1420, GY - 20, 120, '#9fd8ff', 0.3); } });
  return { rim: '#fff1d0', rimDir: [-0.6, -0.8] };
}
function ocean(g, t, cam) {
  layer(g, cam, 0.12, (g) => { g.fillStyle = linGrad(g, 0, -E.H, 0, GY, ['#3a7ad0', '#9ac8e8', '#e8f0f0']); g.fillRect(-E.W * 2, -E.H * 2, E.W * 6, GY + E.H * 2 + 40); FX.sun(g, 1400, 200, 70); });
  const sea = (y, amp, col, sp, ph) => { g.fillStyle = col; g.beginPath(); g.moveTo(-E.W, E.H * 3); for (let x = -E.W; x <= E.W * 3; x += 30) g.lineTo(x, y + Math.sin(x * 0.006 + t * sp + ph) * amp); g.lineTo(E.W * 3, E.H * 3); g.fill(); };
  layer(g, cam, 0.5, (g) => sea(GY - 160, 12, '#2a6ab0', 0.8, 0));
  return { sea, rim: '#fff1d0', rimDir: [0.6, -0.8] };
}

export const WATER = {
  // the Sahara. mode: storm (runner pushing through a sandstorm) | shrine (night, bats under a little dome) | found (nomads and a camel)
  sahara(g, t, info) {
    const mode = info.mode || 'storm';
    if (mode === 'shrine') {
      const z = info.z || 1.25, cam = camLerp(camAt(960, z > 1.4 ? 560 : 600, z), camAt(980, z > 1.4 ? 550 : 590, z + 0.13), K(info, t)), { rim } = dunes(g, t, cam, { night: 1 });
      layer(g, cam, 1, (g) => { rr(g, 700, GY - 300, 520, 300, 8); g.fillStyle = '#5a4a48'; g.fill(); g.fillStyle = '#5a4a48'; g.beginPath(); g.arc(960, GY - 300, 200, Math.PI, Math.PI * 2); g.fill(); rr(g, 900, GY - 200, 120, 200, 60); g.fillStyle = '#14100e'; g.fill();
        for (let i = 0; i < 6; i++) { const x = 760 + i * 80 + Math.sin(t * 3 + i) * 20, y = GY - 420 + Math.sin(t * 5 + i * 2) * 40 - (i % 2) * 60, w = 30 + 14 * Math.sin(t * 22 + i); g.fillStyle = '#0a0808'; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w / 2, y - 18, x, y); g.quadraticCurveTo(x + w / 2, y - 18, x + w, y); g.quadraticCurveTo(x, y + 14, x - w, y); g.fill(); }
        drawFigure(g, { x: 960, y: GY, s: HS * 0.95, facing: 1, outfit: RUNNER, pose: breathe({ ...POSES.reach, eF: [26, -196], hF: [30, -236] }, t, 0.6), face: { eyes: 'ball', brows: 'worried', mouth: 'oBig', lid: 0.4, bags: 1 }, look: [0.2, -1], rim: { color: rim, dir: [0.4, -1] } }); });
      placeTag(g, t, info.tag); return;
    }
    const night = 0, cam = camLerp(camAt(info.cx ?? 960, 620, 1.35), camAt((info.cx ?? 960) + 60, 610, 1.45), K(info, t)), { rim, rimDir } = dunes(g, t, cam, { storm: mode === 'storm' ? 1 : 0, night });
    layer(g, cam, 1, (g) => {
      if (mode === 'storm') { const hx = 760 + t * 70, p = walkPose(t * 4), lean = { ...p, head: [p.head[0] + 18, p.head[1] + 10], sh: [p.sh[0] + 10, p.sh[1] + 6], eF: [24, -176], hF: [30, -206] };
        drawFigure(g, { x: hx, y: GY, s: HS, facing: 1, outfit: RUNNER, pose: lean, rot: 0.08, face: { eyes: 'ball', brows: 'worried', mouth: 'flat', lid: 0.6 }, look: [0, 0.3], rim: { color: rim, dir: rimDir } }); }
      if (mode === 'found') { const k = ease.out(prog(t, 0, info.dur * 0.7));
        g.fillStyle = '#c89a6a'; g.beginPath(); g.ellipse(1300, GY - 200, 150, 70, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(1260, GY - 250, 60, 46, 0, 0, Math.PI * 2); g.fill(); for (const lx of [1200, 1240, 1360, 1400]) { g.fillRect(lx, GY - 160, 18, 160); } seg(g, [[1430, GY - 220], [1500, GY - 330], [1530, GY - 320]], 26, '#c89a6a'); circle(g, 1540, GY - 322, 26, '#c89a6a');
        drawFigure(g, { x: lerp(1500, 1130, k), y: GY, s: HS, facing: -1, outfit: NOMAD, pose: k < 1 ? walkPose(t * 5) : breathe({ ...POSES.reach, eF: [34, -130], hF: [58, -110] }, t, 0.6), face: F.fear, look: [-0.8, 0.5], rim: { color: rim, dir: rimDir } });
        const lx = 800, ly = GY - 30; rr(g, lx, ly - 20, 220, 40, 18); g.fillStyle = RUNNER.color; g.fill(); circle(g, lx - 20, ly - 10, 40, '#0a0c16'); seg(g, [[lx + 220, ly], [lx + 330, ly + 6]], 16, '#0a0c16'); }
    });
    heat(g, 0.18); placeTag(g, t, info.tag);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 60);
  },
  // a map of the route: the race line and his path drifting 200+ km off it
  routeMap(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#e8c890', '#d8a868']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    const r = rng(2); for (let i = 0; i < 40; i++) { g.strokeStyle = alpha('#a86a3a', 0.25); g.lineWidth = 3; const x = r() * E.W, y = r() * E.H; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 60, y - 20, x + 120, y); g.stroke(); }
    seg(g, [[E.W * 0.55, 120], [E.W * 0.55, E.H - 120]], 6, alpha('#3a2a1a', 0.5)); label(g, 'МАРОККО', E.W * 0.75, 160, { size: 40, color: '#5a3a1a' }); label(g, 'АЛЖИР', E.W * 0.3, 160, { size: 40, color: '#5a3a1a' });
    g.setLineDash([22, 14]); seg(g, [[E.W * 0.8, E.H * 0.8], [E.W * 0.72, E.H * 0.55], [E.W * 0.78, E.H * 0.3]], 8, '#3a2a1a'); g.setLineDash([]); label(g, 'ТРАССА', E.W * 0.86, E.H * 0.55, { size: 34, color: '#3a2a1a' });
    const p = ease.inOut(prog(t, info.at ?? 0.3, info.dur * 0.85)), pts = [[E.W * 0.73, E.H * 0.5], [E.W * 0.6, E.H * 0.55], [E.W * 0.45, E.H * 0.45], [E.W * 0.3, E.H * 0.6], [E.W * 0.2, E.H * 0.5]];
    g.strokeStyle = RED; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); const n = (pts.length - 1) * p; for (let i = 0; i <= Math.floor(n); i++) g.lineTo(...pts[i]); if (n < pts.length - 1) { const i = Math.floor(n), f = n - i; g.lineTo(lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)); } g.stroke();
    if (p > 0.95) { circle(g, ...pts[4], 18, RED); glow(g, ...pts[4], 80, RED, 0.5); }
    if (info.caption) glowLabel(g, info.caption, E.W * 0.4, E.H * 0.88, fin(t, info.capAt ?? info.dur * 0.7), 64, '#a8201a');
    placeTag(g, t, info.tag);
  },
  // kitchen: the hero reaches for the tap, a red cross locks it
  tap(g, t, info) {
    const at = info.at ?? 0.6, cam = camLerp(camAt(1150, 600, 1.6), camAt(1170, 590, 1.72), K(info, t)), { rim, rimDir } = kitchen(g, t, cam);
    layer(g, cam, 1, (g) => {
      rr(g, 1180, GY - 182 - 10, 200, 14, 6); g.fillStyle = '#9aa0b0'; g.fill(); seg(g, [[1280, GY - 188], [1280, GY - 280], [1230, GY - 290], [1220, GY - 260]], 12, '#c8ccd8');
      if (t < at) for (let i = 0; i < 3; i++) { const u = ((t * 1.6 + i / 3) % 1); circle(g, 1220, GY - 250 + u * 60, 6, alpha(BLUE, 1 - u)); }
      drawFigure(g, { x: 1060, y: GY, s: HS, facing: 1, outfit: HERO, pose: breathe(posesAt(t, [[0, POSES.stand], [0.3, { ...POSES.reach, eF: [40, -170], hF: [70, -176] }], [at + 0.3, POSES.shrug]], 0.3), t, 0.6), face: t > at ? fc('fear') : fc('talk'), look: [0.8, -0.1], rim: { color: rim, dir: rimDir } });
      const k = fin(t, at, 0.25); if (k > 0) { g.save(); g.translate(1240, GY - 270); g.scale(k, k); seg(g, [[-60, -60], [60, 60]], 16, RED); seg(g, [[60, -60], [-60, 60]], 16, RED); g.restore(); }
    });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? at), 64, RED);
  },
  // the blueprint body slowly filling with water up to `level`; optional organ callouts and buckets
  waterBody(g, t, info) {
    bp(g);
    const cx = E.W * 0.38, base = E.H * 0.95, s = 3.6, H = 232 * s, lvl = lerp(info.from ?? 0, info.level ?? 0.6, ease.inOut(prog(t, info.at ?? 0.1, (info.at ?? 0.1) + 1.4)));
    g.save(); g.beginPath(); g.rect(cx - 260, base - H * lvl, 520, H * lvl); g.clip(); UI.lineFigure(g, { x: cx, y: base, s, color: BLUE }); g.fillStyle = alpha(BLUE, 0.14); g.fillRect(cx - 260, base - H, 520, H); g.restore();
    UI.lineFigure(g, { x: cx, y: base, s, color: alpha(BP(), 0.7) });
    const wy = base - H * lvl; for (let x = cx - 240; x < cx + 240; x += 6) circle(g, x, wy + Math.sin(x * 0.05 + t * 4) * 4, 2, alpha('#cfe8ff', 0.8));
    label(g, `${Math.round(lvl * 100)}%`, cx + 300, wy, { size: 64, color: BLUE, align: 'left' });
    (info.callouts || []).forEach(([str, y, at]) => { const a = fin(t, at); if (a > 0) { seg(g, [[cx + 40, base - y * s], [E.W * 0.62, base - y * s]], 3, alpha(GOLD(), a)); label(g, str, E.W * 0.63, base - y * s, { size: 44, align: 'left', color: GOLD(), a }); } });
    if (info.buckets) for (let i = 0; i < 4; i++) { const a = pop(t, info.buckets + i * 0.2); if (a <= 0) continue; const x = E.W * 0.66 + i * 150, y = E.H * 0.7; g.save(); g.translate(x, y); g.scale(a, a); poly(g, [[-50, -60], [50, -60], [38, 60], [-38, 60]], alpha(BLUE, 0.85)); ring(g, 0, -60, 50, 5, '#cfe8ff'); g.restore(); }
    if (info.caption) glowLabel(g, info.caption, E.W * 0.7, 110, fin(t, info.capAt ?? 0.3), 56, BLUE);
  },
  // the brain's thirst sensor fires and the hormone travels down to the kidneys
  thirstSignal(g, t, info) {
    bp(g);
    const at = info.at ?? 0.5, bx = E.W * 0.32, by = E.H * 0.4, kx = E.W * 0.7, ky = E.H * 0.62;
    icon(g, 'brain', bx, by, 2.6, BP(), t); const pulse = t > at ? 0.5 + 0.5 * Math.sin((t - at) * 8) : 0; glow(g, bx + 20, by + 30, 120, RED, 0.5 * pulse); circle(g, bx + 20, by + 30, 18, t > at ? RED : alpha(BP(), 0.6));
    icon(g, 'kidney', kx, ky, 1.8, t > (info.kAt ?? at + 0.9) ? GOLD() : BP(), t);
    if (t > at + 0.2) for (let i = 0; i < 6; i++) { const u = ((t - at) * 0.6 + i / 6) % 1, x = lerp(bx + 40, kx - 60, u), y = lerp(by + 60, ky - 40, u) - Math.sin(u * Math.PI) * 120; circle(g, x, y, 12, alpha(GOLD(), 1 - u * 0.5)); }
    label(g, info.text1 ?? 'ДАТЧИК ЖАЖДЫ', bx, by + 220, { size: 40, color: RED, a: fin(t, at) });
    label(g, info.text2 ?? 'ВАЗОПРЕССИН', (bx + kx) / 2, E.H * 0.2, { size: 46, color: GOLD(), a: fin(t, at + 0.4) });
    label(g, info.text3 ?? 'ПОЧКИ: ЭКОНОМИМ', kx, ky + 170, { size: 40, color: GOLD(), a: fin(t, info.kAt ?? at + 0.9) });
  },
  // urine colour strip: pale → amber → brown, the pointer slides to `to` (0..1)
  urineScale(g, t, info) {
    bp(g);
    const cols = ['#f8f4c0', '#f2e690', '#e8c850', '#d8a030', '#b8741a', '#7a4a1a'], x0 = E.W * 0.15, w = E.W * 0.7, y = E.H * 0.5, n = cols.length;
    cols.forEach((c, i) => { rr(g, x0 + i * w / n + 6, y - 90, w / n - 12, 180, 18); g.fillStyle = c; g.fill(); });
    const p = lerp(info.from ?? 0, info.to ?? 0.8, ease.inOut(prog(t, 0.2, info.dur * 0.8))), px = x0 + p * w;
    poly(g, [[px - 30, y - 150], [px + 30, y - 150], [px, y - 100]], '#ffffff'); seg(g, [[px, y - 100], [px, y + 100]], 4, '#ffffff');
    label(g, 'НОРМА', x0 + w * 0.12, y + 150, { size: 38, color: '#f2e690' }); label(g, 'ОБЕЗВОЖИВАНИЕ', x0 + w * 0.85, y + 150, { size: 38, color: '#d8a030' });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 140, fin(t, info.capAt ?? 0.3), 56);
  },
  // a skin pinch on the forearm: the fold snaps back (healthy) or stays up like dough
  pinch(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#1a1420', '#2a2030']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H / 2, 700, '#ffd09a', 0.15);
    const skin = '#c88a6a', y = E.H * 0.58, at = info.at ?? 0.4, rel = at + 0.6, stay = info.mode !== 'healthy';
    const fold = t < at ? 0 : t < rel ? ease.out(prog(t, at, at + 0.3)) : stay ? lerp(1, 0.8, prog(t, rel, info.dur)) : 1 - ease.out(prog(t, rel, rel + 0.25));
    g.fillStyle = skin; g.beginPath(); g.moveTo(-50, y - 120); g.lineTo(E.W / 2 - 160, y - 120); g.quadraticCurveTo(E.W / 2 - 60, y - 120 - 220 * fold, E.W / 2, y - 130 - 260 * fold); g.quadraticCurveTo(E.W / 2 + 60, y - 120 - 220 * fold, E.W / 2 + 160, y - 120); g.lineTo(E.W + 50, y - 120); g.lineTo(E.W + 50, y + 160); g.lineTo(-50, y + 160); g.fill();
    g.strokeStyle = alpha('#8a5a40', 0.6); g.lineWidth = 4; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(E.W / 2 - 60 + i * 30, y - 120 - 60 * fold); g.lineTo(E.W / 2 - 50 + i * 25, y - 120 - 200 * fold); g.stroke(); }
    if (t > at && t < rel) for (const s of [-1, 1]) { circle(g, E.W / 2 + s * 40, y - 140 - 230 * fold, 46, '#0a0c16'); }
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 120, fin(t, info.capAt ?? rel), 60, stay ? RED : '#6fffb0');
  },
  // the kidney as a filter: a huge tub of water goes in, a small glass comes out
  kidneyFlow(g, t, info) {
    bp(g);
    const kx = E.W / 2, ky = E.H * 0.5; icon(g, 'kidney', kx, ky, 3.0, GOLD(), t);
    const lx = E.W * 0.15, rx = E.W * 0.85;
    rr(g, lx - 160, ky - 120, 320, 240, 30); g.fillStyle = alpha(BLUE, 0.5); g.fill(); g.strokeStyle = BLUE; g.lineWidth = 6; g.stroke();
    label(g, info.inText || '≈ 180 Л', lx, ky + 180, { size: 56, color: BLUE }); label(g, info.inSub ?? 'В СУТКИ ЧЕРЕЗ ПОЧКИ', lx, ky + 240, { size: 30 });
    const a = fin(t, info.outAt ?? 1.2); g.save(); g.globalAlpha *= a; icon(g, 'water', rx, ky, 1.6, BLUE, t); label(g, info.outText || '1–2 Л', rx, ky + 180, { size: 56, color: '#f2e690' }); label(g, 'ВЫХОДИТ', rx, ky + 240, { size: 30 }); g.restore();
    for (let i = 0; i < 8; i++) { const u = ((t * 0.7 + i / 8) % 1); circle(g, lerp(lx + 170, kx - 180, u), ky + Math.sin(u * 9 + i) * 30, 9, alpha(BLUE, 1 - u)); }
    for (let i = 0; i < 8; i++) { const u = ((t * 0.7 + i / 8) % 1); circle(g, lerp(kx - 100, kx - 260, u), ky - 120 - u * 140, 7, alpha('#ff8a7a', 1 - u)); } label(g, '↻ ОБРАТНО В КРОВЬ', kx - 200, ky - 300, { size: 32, color: '#ff8a7a', a: fin(t, 0.4) });
  },
  // the body overheating: a figure going red, a thermometer climbing
  overheat(g, t, info) {
    bp(g);
    const k = ease.inOut(prog(t, 0.2, info.dur - 0.3)), cx = E.W * 0.38, base = E.H * 0.95;
    glow(g, cx, base - 420, 500, RED, 0.35 * k); UI.lineFigure(g, { x: cx, y: base, s: 3.6, color: mix('#9fd8ff', RED, k) });
    for (let i = 0; i < 6; i++) { const u = ((t * 0.5 + i / 6) % 1); g.strokeStyle = alpha('#ffb07a', 0.5 * k * (1 - u)); g.lineWidth = 5; g.beginPath(); for (let y = 0; y < 120; y += 8) g.lineTo(cx - 150 + i * 60 + Math.sin(y * 0.1 + t * 4) * 10, base - 820 - u * 120 - y); g.stroke(); }
    const tx = E.W * 0.72, ty = E.H * 0.5; rr(g, tx - 40, ty - 300, 80, 480, 40); g.fillStyle = 'rgba(10,18,36,.9)'; g.fill(); g.strokeStyle = BP(); g.lineWidth = 5; g.stroke(); circle(g, tx, ty + 200, 70, RED);
    const h = lerp(140, 440, k); rr(g, tx - 18, ty + 180 - h, 36, h, 18); g.fillStyle = RED; g.fill();
    text(g, `${(lerp(36.6, info.to ?? 39.5, k)).toFixed(1).replace('.', ',')}°`, tx + 90, ty - 200, { size: 80, font: FONTS.ui, weight: 900, color: RED, align: 'left' });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 100, fin(t, info.capAt ?? 0.3), 56, '#ff8a7a');
  },
  // thick blood: red cells packing tighter in a vessel; the heart beats faster
  thickBlood(g, t, info) {
    bp(g);
    const y0 = E.H * 0.3, y1 = E.H * 0.7, k = ease.inOut(prog(t, 0.2, info.dur - 0.3));
    g.fillStyle = alpha('#ff5a4a', 0.12 + 0.2 * k); g.fillRect(0, y0, E.W, y1 - y0); seg(g, [[0, y0], [E.W, y0]], 8, '#ff8a7a'); seg(g, [[0, y1], [E.W, y1]], 8, '#ff8a7a');
    const n = Math.round(lerp(30, 90, k)), r = rng(5), sp = lerp(260, 120, k);
    for (let i = 0; i < n; i++) { const x = ((r() * E.W * 1.2 + t * sp) % (E.W + 100)) - 50, y = lerp(y0 + 40, y1 - 40, r()); g.fillStyle = '#d8303a'; g.beginPath(); g.ellipse(x, y, 34, 20, r() * 3, 0, Math.PI * 2); g.fill(); g.fillStyle = '#a81a24'; g.beginPath(); g.ellipse(x, y, 14, 8, 0, 0, Math.PI * 2); g.fill(); }
    const bpm = Math.round(lerp(70, info.bpm ?? 110, k)), beat = 1 + 0.15 * Math.max(0, Math.sin(t * Math.PI * 2 * bpm / 60)) ** 6; icon(g, 'heart', E.W * 0.86, E.H * 0.16, 0.7 * beat, RED, t); text(g, `${bpm}`, E.W * 0.78, E.H * 0.16, { size: 64, font: FONTS.ui, weight: 900, color: RED, align: 'right' });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, E.H * 0.86, fin(t, info.capAt ?? 0.4), 56, '#ff8a7a');
  },
  // Arizona 1905: the prospector staggering among saguaros | McGee's camp by the water
  sonora(g, t, info) {
    const mode = info.mode || 'walk', cam = camLerp(camAt(info.cx ?? 960, 620, 1.3), camAt((info.cx ?? 960) + 60, 610, 1.4), K(info, t)), { rim, rimDir } = sonoran(g, t, cam, { camp: mode === 'camp' });
    layer(g, cam, 1, (g) => {
      if (mode === 'walk') { const hx = 700 + t * 50, p = walkPose(t * 2.6), droop = { ...p, head: [p.head[0] + 22, p.head[1] + 20], sh: [p.sh[0] + 12, p.sh[1] + 10] };
        drawFigure(g, { x: hx, y: GY, s: HS, facing: 1, outfit: PROSPECTOR, pose: droop, rot: 0.06 + Math.sin(t * 1.5) * 0.04, face: { eyes: 'ball', brows: 'worried', mouth: 'oBig', lid: 0.6, bags: 1 }, look: [0, 0.6], rim: { color: rim, dir: rimDir } }); }
      else { drawFigure(g, { x: 900, y: GY, s: HS, facing: 1, outfit: MCGEE, pose: breathe(posesAt(t, [[0, POSES.stand], [info.helpAt ?? 0.6, { ...POSES.reach, eF: [34, -130], hF: [60, -110] }]], 0.3), t, 0.6), face: F.fear, look: [0.6, 0.5], rim: { color: rim, dir: rimDir } });
        const lx = 1020, ly = GY - 30; rr(g, lx, ly - 20, 220, 40, 18); g.fillStyle = PROSPECTOR.color; g.fill(); circle(g, lx - 20, ly - 10, 40, '#0a0c16'); seg(g, [[lx + 220, ly], [lx + 330, ly + 6]], 16, '#0a0c16'); }
    });
    heat(g, 0.15); sepia(g, 0.22); placeTag(g, t, info.tag);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 60);
  },
  // a raft on the open ocean: the hero dips a cup… and a red cross over it
  raft(g, t, info) {
    const cam = camLerp(camAt(960, 600, 1.3), camAt(980, 590, 1.4), K(info, t)), { sea, rim, rimDir } = ocean(g, t, cam), at = info.at ?? 99;
    layer(g, cam, 1, (g) => { const bob = Math.sin(t * 1.4) * 10; g.save(); g.translate(0, bob); g.rotate(Math.sin(t * 1.1) * 0.02);
      rr(g, 700, GY - 40, 520, 50, 10); g.fillStyle = '#8a5a32'; g.fill(); for (let i = 0; i < 6; i++) seg(g, [[720 + i * 90, GY - 40], [720 + i * 90, GY + 10]], 4, '#5a3a1a');
      drawFigure(g, { x: 920, y: GY - 40, s: HS, facing: 1, outfit: HERO, pose: breathe({ ...POSES.sit, eF: [34, -110], hF: [64, -90] }, t, 0.6), face: { eyes: 'ball', brows: 'worried', mouth: 'flat', lid: 0.5, bags: 0.8 }, look: [0.8, 0.6], rim: { color: rim, dir: rimDir } }); g.restore(); });
    layer(g, cam, 1.08, (g) => { sea(GY + 10, 18, '#1a5aa0', 1.1, 2); sea(GY + 70, 24, '#14467e', 1.4, 4); });
    const k = fin(t, at, 0.25); if (k > 0) { g.save(); g.translate(E.W * 0.6, E.H * 0.35); g.scale(k, k); icon(g, 'water', 0, 0, 1.4, BLUE, t); seg(g, [[-90, -90], [90, 90]], 16, RED); seg(g, [[90, -90], [-90, 90]], 16, RED); g.restore(); }
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 60);
  },
  // a camel at a trough; the litre counter climbs
  camel(g, t, info) {
    const cam = camLerp(camAt(980, 600, 1.3), camAt(1000, 590, 1.4), K(info, t)), { rim } = dunes(g, t, cam, {});
    layer(g, cam, 1, (g) => { const x = 900, y = GY, c = '#c8946a', drink = Math.sin(t * 6) * 6;
      g.fillStyle = c; g.beginPath(); g.ellipse(x, y - 250, 190, 90, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(x - 20, y - 330, 90, 70, 0, Math.PI, Math.PI * 2); g.fill();
      for (const lx of [-140, -90, 90, 140]) { g.fillRect(x + lx - 12, y - 190, 24, 190); }
      g.strokeStyle = c; g.lineWidth = 46; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 160, y - 270); g.quadraticCurveTo(x + 300, y - 260, x + 330, y - 90 + drink); g.stroke(); g.fillStyle = c; g.beginPath(); g.ellipse(x + 350, y - 70 + drink, 50, 30, 0.4, 0, Math.PI * 2); g.fill(); circle(g, x + 338, y - 88 + drink, 6, '#2a1a10');
      rr(g, x + 260, y - 60, 260, 60, 10); g.fillStyle = '#6a6a74'; g.fill(); rr(g, x + 270, y - 54, 240, 30, 6); g.fillStyle = alpha(BLUE, 0.8); g.fill(); });
    if (info.counter) { const v = Math.round(lerp(0, info.counter, ease.out(prog(t, info.at ?? 0.3, info.dur * 0.85)))); text(g, `${v} Л`, E.W * 0.78, E.H * 0.25, { size: 120, font: FONTS.ui, weight: 900, color: BLUE, glow: 24, glowColor: alpha(BLUE, 0.5) }); }
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 60);
    if (info.humpLabel) { const a = fin(t, info.humpAt ?? 0.5); label(g, info.humpLabel, E.W * 0.42, E.H * 0.26, { size: 60, color: GOLD(), a }); }
  },
  // the radio contest: contestants on a stage with water bottles; a prize box; a timer
  contest(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#1a1030', '#3a1a4a']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); for (const x of [300, 960, 1620]) FX.lightCone(g, x, -60, { angle: Math.PI / 2, spread: 0.3, len: 1000, color: '#ffe2c0', a: 0.12 });
    const cam = camAt(960, 600, lerp(1.2, 1.3, K(info, t)));
    layer(g, cam, 1, (g) => { rr(g, 200, GY - 20, 1520, 40, 8); g.fillStyle = '#5a3a6a'; g.fill();
      for (const [x, c, i] of [[600, '#5ad0a0', 0], [960, '#c07aff', 1], [1320, '#ff8a3a', 2]]) { const SIP = { ...POSES.holdFront, eF: [26, -150], hF: [16, -192] }; drawFigure(g, { x, y: GY - 20, s: HS, facing: 1, outfit: { top: 'tshirt', color: c, head: i === 1 ? 'ponytail' : 'curly', headColor: '#2a1a12' }, prop: 'cup', pose: breathe(posesAt(t + i * 0.4, [[0, POSES.holdFront], [0.5, SIP], [1.1, POSES.holdFront], [1.7, SIP]], 0.25), t, 0.6, i), face: F.tired, look: [0.6, -0.2], rim: { color: '#ffe2c0', dir: [0, -1] } });
        for (let b = 0; b < 2 + i + Math.floor(t); b++) { rr(g, x + 60 + (b % 3) * 26, GY - 80 - Math.floor(b / 3) * 70, 22, 60, 8); g.fillStyle = alpha(BLUE, 0.85); g.fill(); } }
      rr(g, 1580, GY - 200, 160, 180, 10); g.fillStyle = '#f4f4f8'; g.fill(); label(g, 'ПРИЗ', 1660, GY - 110, { size: 40, color: '#1a1622' }); });
    placeTag(g, t, info.tag || 'КАЛИФОРНИЯ · 2007');
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 60);
  },
  // water rushes into a cell and it swells; inside a skull outline the brain presses against the bone
  swell(g, t, info) {
    bp(g);
    const k = ease.inOut(prog(t, info.at ?? 0.3, info.dur - 0.2)), cx = E.W * 0.3, cy = E.H * 0.5, r = lerp(150, 240, k);
    g.fillStyle = alpha(BLUE, 0.12 + 0.2 * k); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); ring(g, cx, cy, r, 6, BLUE); circle(g, cx, cy, 40, alpha(BP(), 0.5));
    for (let i = 0; i < 10; i++) { const an = i * 0.63 + t, u = ((t * 0.8 + i / 10) % 1), d = lerp(r + 160, r - 10, u); circle(g, cx + Math.cos(an) * d, cy + Math.sin(an) * d, 7, alpha(BLUE, 1 - u)); }
    label(g, 'КЛЕТКА', cx, cy + r + 60, { size: 40 });
    const sx = E.W * 0.7, sy = E.H * 0.5; g.strokeStyle = '#e8e4d8'; g.lineWidth = 14; g.beginPath(); g.arc(sx, sy, 240, Math.PI * 0.85, Math.PI * 2.15); g.stroke();
    g.save(); g.translate(sx, sy); g.scale(lerp(2.4, 2.9, k), lerp(2.4, 2.9, k)); icon(g, 'brain', 0, 0, 1, k > 0.6 ? RED : BP(), t); g.restore();
    if (k > 0.6) glow(g, sx, sy, 300, RED, 0.3 * (k - 0.6) * 2.5);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 100, fin(t, info.capAt ?? 0.4), 56, '#ff8a7a');
  },
  // people walking a dusty path with water jugs (respectful, warm light)
  waterWalk(g, t, info) {
    const cam = camAt(980 + t * 40, 620, 1.3), { rim, rimDir } = sonoran(g, t, cam, {});
    layer(g, cam, 1, (g) => { for (let i = 0; i < 3; i++) { const x = 700 + i * 260 + t * 70, p = walkPose(t * 4 + i), CARRY = { ...p, eF: [10, -196], hF: [4, -236], eB: [-6, -196], hB: [-2, -236] };
      drawFigure(g, { x, y: GY, s: HS * (i === 1 ? 0.8 : 1), facing: 1, outfit: { top: 'dress', color: ['#d85a3a', '#3a8ad8', '#d8a83a'][i], head: i === 1 ? 'ponytail' : 'bun', headColor: '#1a1210', kid: i === 1 }, pose: CARRY, face: F.tired, look: [0.3, 0], rim: { color: rim, dir: rimDir } });
      const hy = GY - (i === 1 ? 0.72 : 1) * HS * 250; rr(g, x - 30, hy - 60, 60, 66, 14); g.fillStyle = '#d8c8a0'; g.fill(); } });
    sepia(g, 0.12); placeTag(g, t, info.tag);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 56);
  },
  // desert survival: noon in the shade of a rock (sitting still) | walking at night under the moon
  survive(g, t, info) {
    const night = info.mode === 'night', cam = camLerp(camAt(960, 620, 1.35), camAt(980, 610, 1.45), K(info, t)), { rim, rimDir } = dunes(g, t, cam, { night: night ? 1 : 0 });
    layer(g, cam, 1, (g) => {
      if (!night) { g.fillStyle = '#8a5a3a'; g.beginPath(); g.moveTo(780, GY); g.quadraticCurveTo(800, GY - 420, 1100, GY - 400); g.quadraticCurveTo(1300, GY - 380, 1320, GY); g.fill(); g.fillStyle = alpha('#2a1a14', 0.4); g.beginPath(); g.ellipse(1000, GY + 10, 260, 40, 0, 0, Math.PI * 2); g.fill();
        drawFigure(g, { x: 960, y: GY, s: HS, facing: 1, outfit: HERO, pose: breathe({ ...POSES.sit, head: [14, -170], hip: [0, -40], kF: [50, -60], fF: [60, 0], kB: [44, -58], fB: [50, 0] }, t, 0.4), face: { eyes: 'ball', brows: null, mouth: 'flat', lid: 0.5 }, look: [0.6, 0], shadow: false, rim: { color: rim, dir: rimDir } }); }
      else drawFigure(g, { x: 700 + t * 90, y: GY, s: HS, facing: 1, outfit: HERO, pose: walkPose(t * 4.5), face: F.talk, look: [0.6, -0.2], rim: { color: rim, dir: rimDir } });
    });
    if (!night) heat(g, 0.2);
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 60, night ? '#cfe0ff' : GOLD());
  },
  // the elderly: grandma in an armchair; the hero sets a glass of water beside her
  elderly(g, t, info) {
    const cam = camLerp(camAt(1000, 640, 1.5), camAt(1010, 630, 1.6), K(info, t)), { rim, rimDir } = office(g, t, cam), at = info.at ?? 0.8;
    layer(g, cam, 1, (g) => { rr(g, 720, GY - 210, 260, 210, 30); g.fillStyle = '#7a3a4a'; g.fill(); rr(g, 690, GY - 140, 320, 70, 20); g.fillStyle = '#8a4a5a'; g.fill();
      drawFigure(g, { x: 840, y: GY - 10, s: HS, facing: 1, outfit: { top: 'dress', color: '#5a7ab8', head: 'bun', headColor: '#d8d8d8', face: 'glasses' }, pose: breathe({ ...POSES.sit, head: [10, -172] }, t, 0.5), face: F.smile, look: [0.6, 0], shadow: false, rim: { color: rim, dir: rimDir } });
      rr(g, 1080, GY - 150, 140, 16, 4); g.fillStyle = '#6a4228'; g.fill(); g.fillStyle = '#4a3020'; g.fillRect(1140, GY - 134, 16, 134);
      const put = ease.inOut(prog(t, 0.3, at)); drawFigure(g, { x: 1330, y: GY, s: HS, facing: -1, outfit: HERO, pose: breathe(posesAt(t, [[0, POSES.holdFront], [0.3, { ...POSES.reach, eF: [40, -150], hF: [66, -140] }], [at + 0.3, POSES.relaxed]], 0.3), t, 0.6), face: F.smile, look: [-0.6, 0.2], rim: { color: rim, dir: rimDir } });
      if (t > at) { g.save(); g.translate(1150, GY - 180); icon(g, 'water', 0, 0, 0.4, BLUE, t); g.restore(); } else { g.save(); g.translate(lerp(1330 - 66 * HS, 1150, put), lerp(GY - 140 * HS, GY - 180, put)); icon(g, 'water', 0, 0, 0.4, BLUE, t); g.restore(); }
    });
    if (info.caption) glowLabel(g, info.caption, E.W / 2, 110, fin(t, info.capAt ?? 0.3), 56);
  },
};
