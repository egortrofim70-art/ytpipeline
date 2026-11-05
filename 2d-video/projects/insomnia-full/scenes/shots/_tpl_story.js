// _tpl_story.js — story templates: Italy 1984, the doctor, the family, Randy Gardner, the hospital, Venice, Sonia, the ending.
import { E, S, ease, prog, lerp, clamp, key, rr, seg, circle, ring, poly, text, measure, glow, alpha, shade, linGrad, rng, shake, FONTS, layer, blurLayer, veil, mood } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import * as UI from '/engine/ui2d.js';
import { drawFigure, POSES, breathe, posesAt, walkPose, bigFace, face as drawFaceAt } from '/engine/rig2d.js';
import { bedroom, lyingHero, moonlight, GY, HS, BX, MT, HEAD } from '../sets/bedroom.js';
import { street } from '../sets/week.js';
import { hospital, hospitalPatient, HB, MON, office, DESK, venice, ratCage } from '../sets/places.js';
import { HERO, SILVANO, LUGARESI, GAMBETTI, RANDY, SONIA, ERIC, WIFE, VENETO, F } from '../cast.js';
import { camAt, camLerp, blinkAt, sittingHero } from './_tpl_night.js';
import { icon } from './_tpl_sci.js';

const ui = () => S().ui, RED = '#ff5a4a';
const K = (info, t) => ease.inOut(t / info.dur);
const pop = (t, at, d = 0.35) => ease.outBack(prog(t, at, at + d));
const fc = (n) => (typeof n === 'string' ? F[n] : n) || F.tired;
const label = (g, s, x, y, o = {}) => text(g, s, x, y, { size: o.size || 34, font: FONTS.ui, weight: 900, color: o.color || ui().cream, spacing: o.spacing ?? 3, align: o.align || 'center', alpha: o.a ?? 1, glow: o.glow || 0, glowColor: o.glowColor });
const who = (n) => ({ hero: HERO, silvano: SILVANO, lugaresi: LUGARESI, gambetti: GAMBETTI, randy: RANDY, sonia: SONIA, eric: ERIC, wife: WIFE, veneto: VENETO })[n] || HERO;
// a place/year tag in the lower left: "ITALIA · 1984"
export function placeTag(g, t, str, at = 0.15) {
  const a = ease.out(prog(t, at, at + 0.35)); if (a <= 0 || !str) return;
  const w = measure(g, str, 40, FONTS.ui, 900) + 70, x = 70, y = E.H - 150;
  g.save(); g.globalAlpha *= a; g.translate(-(1 - a) * 60, 0);
  rr(g, x, y, w, 76, 12); g.fillStyle = 'rgba(10,10,24,0.88)'; g.fill(); g.fillStyle = '#ffd400'; g.fillRect(x, y, 8, 76);
  text(g, str, x + 36, y + 40, { size: 40, font: FONTS.ui, weight: 900, color: '#ffffff', align: 'left', spacing: 3 }); g.restore();
}
function wordBubble(g, t, x, y, str, at, o = {}) {
  const a = pop(t, at, 0.3); if (a <= 0) return;
  const w = measure(g, str, 44, FONTS.ui, 900) + 70;
  g.save(); g.translate(x, y); g.scale(a, a);
  rr(g, -w / 2, -42, w, 84, 42); g.fillStyle = o.bg || '#f4efe6'; g.fill();
  poly(g, [[o.tail ?? -w * 0.2, 38], [(o.tail ?? -w * 0.2) - 30 * (o.dir || 1), 70], [(o.tail ?? -w * 0.2) + 20 * (o.dir || 1), 38]], o.bg || '#f4efe6');
  text(g, str, 0, 2, { size: 44, font: FONTS.ui, weight: 900, color: o.color || '#1a1622' }); g.restore();
}

export const STORY = {
  // a big close-up of anyone, on a blurred background of a known place; optional name tag
  face(g, t, info) {
    const bgk = info.bg || 'bedroom', cam = camAt(1100, 540, 1.5);
    blurLayer(g, 14, (g) => { if (bgk === 'office') office(g, t, cam); else if (bgk === 'hospital') hospital(g, t, cam, { night: true }); else if (bgk === 'street') street(g, t, cam, { dusk: info.dusk }); else if (bgk === 'blueprint') UI.blueprint(g, { grid: 60, a: 0.08 }); else bedroom(g, t, cam, { dawn: info.dawn || 0, clockH: 3 }); });
    veil(g, '#06070f', 0.4);
    const of = who(info.who || 'hero'), r = lerp(300, 330, K(info, t)), side = info.side === 'right' ? 0.6 : info.side === 'left' ? 0.4 : 0.5;
    bigFace(g, E.W * side, E.H * 0.6, r, { outfit: of, face: fc(info.face || 'tired'), look: info.lookKeys ? key(t, info.lookKeys, ease.inOut) : info.look || [0, 0], rimColor: bgk === 'office' ? '#ffd09a' : '#b8c8ff', rimSide: 1, blink: blinkAt(t + 0.5, 3.1) });
    FX.dust(g, t, { count: 22, color: '#dfe6ff', a: 0.22, speed: 5 });
    placeTag(g, t, info.tag);
  },
  // an Italian street at dusk, Silvano walking home; place tag
  italy(g, t, info) {
    const hx = 760 + t * 150, cam = camAt(hx + 120, 620, 1.35), { rim, rimDir } = street(g, t, cam, { dusk: 1 });
    layer(g, cam, 1, (g) => drawFigure(g, { x: hx, y: GY - 80, s: HS, facing: 1, outfit: SILVANO, pose: walkPose(t * Math.PI * 2 * 0.8), face: fc(info.face || 'tired'), rim: { color: '#ffd09a', dir: [-0.6, -0.8] } }));
    placeTag(g, t, info.tag || 'ITALIA · 1984');
  },
  // somebody lying awake in the side-view bed (Silvano: olive collar)
  awakeBed(g, t, info) {
    const cam = camLerp(camAt(BX + 260, MT - 80, info.z || 1.5), camAt(BX + 240, MT - 70, (info.z || 1.5) + 0.1), K(info, t));
    const { M } = bedroom(g, t, cam, { clockH: info.clockH ?? 2, dawn: info.dawn || 0 });
    layer(g, cam, 1, (g) => lyingHero(g, M, { face: fc(info.face || 'awake'), turn: info.turnKeys ? key(t, info.turnKeys, ease.inOut) : 0, look: info.look || [0.4, -0.3], collar: info.collar || (info.who === 'silvano' ? '#6f8a5a' : undefined), blink: blinkAt(t + 0.7) }));
    moonlight(g, t, cam);
    placeTag(g, t, info.tag);
  },
  // the doctor's office: doctor behind the desk, patient on a chair; diagnosis words pop from the doctor on cue
  doctor(g, t, info) {
    const cam = camLerp(camAt(1000, 640, 1.45), camAt(1010, 630, 1.55), K(info, t)), { rim, rimDir } = office(g, t, cam);
    const talkK = (info.words || []).some(([, at]) => t > at && t < at + 0.6) ? 1 : 0;
    layer(g, cam, 1, (g) => {
      FX.chair(g, 1180, GY, HS * 1.03, '#2a1a12');
      drawFigure(g, { x: 1200, y: GY, s: HS, facing: -1, outfit: LUGARESI, pose: breathe(posesAt(t, [[0, POSES.sit], [info.handAt ?? 99, { ...POSES.sit, eF: [30, -128], hF: [64, -130] }]], 0.35), t, 0.6), face: fc('talk'), talk: talkK ? Math.abs(Math.sin(t * 18)) : 0, rim: { color: rim, dir: [-1, -0.4] } });
      FX.chair(g, 640, GY, HS * 1.03, '#2a1a12');
      drawFigure(g, { x: 620, y: GY, s: HS, facing: 1, outfit: SILVANO, pose: breathe({ ...POSES.sit, head: [12, -174] }, t, 0.6, 1), face: fc(info.face || 'tired'), rim: { color: rim, dir: rimDir } });
    });
    (info.words || []).forEach(([w, at], i) => wordBubble(g, t, E.W * 0.6 + (i - 1) * 40, 220 + i * 120, w, at, { dir: 1, tail: 60 }));
    placeTag(g, t, info.tag);
  },
  // insert: pills pour into a palm; then a red cross + "NO FUNCIONA"
  pills(g, t, info) {
    blurLayer(g, 14, (g) => office(g, t, camAt(1000, 600, 2))); veil(g, '#0a0608', 0.45);
    const cx = E.W / 2, cy = E.H * 0.62, r = rng(3);
    seg(g, [[cx + 520, cy + 420], [cx + 120, cy + 60]], 150, '#0a0c16'); g.fillStyle = '#0a0c16'; g.beginPath(); g.ellipse(cx, cy, 220, 120, -0.1, 0, Math.PI * 2); g.fill();   // palm
    rr(g, cx - 330, cy - 470, 170, 230, 24); g.fillStyle = '#e88a3a'; g.fill(); rr(g, cx - 340, cy - 500, 190, 50, 12); g.fillStyle = '#f4f4f4'; g.fill();          // bottle
    for (let i = 0; i < 10; i++) { const p = clamp((t - 0.1 - i * 0.07) / 0.5), x = lerp(cx - 245, cx - 120 + r() * 240, ease.in(p)), y = lerp(cy - 240, cy - 60 + r() * 80, ease.in(p));
      g.save(); g.translate(x, y); g.rotate(r() * 6 + p * 4); rr(g, -34, -15, 68, 30, 15); g.fillStyle = i % 2 ? '#ffffff' : '#8ab4ff'; g.fill(); g.restore(); }
    const x = ease.out(prog(t, info.xAt ?? 1.1, (info.xAt ?? 1.1) + 0.3));
    if (x > 0) { seg(g, [[cx - 240, cy - 300], [cx - 240 + 480 * clamp(x * 2), cy - 300 + 480 * clamp(x * 2)]], 26, RED); if (x > 0.5) seg(g, [[cx + 240, cy - 300], [cx + 240 - 480 * clamp((x - 0.5) * 2), cy - 300 + 480 * clamp((x - 0.5) * 2)]], 26, RED);
      label(g, info.text || 'NO FUNCIONA', cx, E.H * 0.15, { size: 72, color: RED, a: x, glow: 20, glowColor: alpha(RED, 0.6) }); }
  },
  // the family portraits on the wall; each gets a black ribbon on cue
  portraits(g, t, info) {
    const wall = '#4a3a3a'; g.fillStyle = linGrad(g, 0, 0, 0, E.H, [shade(wall, -0.5), wall, shade(wall, -0.3)]); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    glow(g, E.W / 2, E.H * 0.3, 900, '#ffcf8a', 0.12);
    const items = info.items || [['PADRE', 0.2], ['TÍAS', 0.6], ['ABUELO', 1.0]], n = items.length, z = lerp(1, 1.08, K(info, t));
    g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
    items.forEach(([name, at], i) => {
      const x = E.W / 2 + (i - (n - 1) / 2) * 460, y = E.H * 0.44, a = pop(t, at, 0.3); if (a <= 0) return;
      g.save(); g.translate(x, y); g.scale(a, a);
      rr(g, -150, -190, 300, 380, 10); g.fillStyle = '#3a2614'; g.fill(); rr(g, -128, -168, 256, 336, 4); g.fillStyle = '#c8b896'; g.fill();
      const count = name === 'TÍAS' ? 2 : 1; for (let k = 0; k < count; k++) { const ox = count === 2 ? (k ? 56 : -56) : 0; circle(g, ox, -40, 52, '#3a2a20'); g.fillStyle = '#3a2a20'; g.beginPath(); g.ellipse(ox, 110, 90, 80, 0, Math.PI, Math.PI * 2); g.fill(); }
      const rb = ease.out(prog(t, at + 0.3, at + 0.55)); if (rb > 0) { g.save(); g.globalAlpha *= rb; seg(g, [[60, -190], [150, -100]], 26, '#0a0a0a'); g.restore(); }
      g.restore();
      label(g, name, x, y + 240, { size: 40, a });
    });
    g.restore();
  },
  // a dark room: relatives huddled, whispering; the word "LA MALDICIÓN" breathes in red
  whisper(g, t, info) {
    g.fillStyle = '#0c0a14'; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H * 0.7, 700, '#ff9a50', 0.18);
    const cam = camAt(960, 600, lerp(1.1, 1.22, K(info, t)));
    layer(g, cam, 1, (g) => { [[760, 1, WIFE], [900, 1, SILVANO], [1140, -1, { top: 'none' }], [1280, -1, { top: 'dress', color: '#5a3a4a', head: 'bun', headColor: '#2a1a14' }]].forEach(([x, f, of], i) =>
      drawFigure(g, { x, y: GY, s: HS, facing: f, outfit: of, pose: breathe({ ...POSES.stand, head: [12, -200], sh: [4, -172] }, t, 0.6, i), face: { eyes: 'ball', brows: 'worried', mouth: 'flat', lid: 0.3 }, look: [0.6, 0.2], rim: { color: '#ffb070', dir: [0, -1] } }));
      FX.pool(g, 1020, GY + 10, 420, 60, '#ff9a50', 0.25); });
    const a = ease.out(prog(t, info.at ?? 0.4, (info.at ?? 0.4) + 0.5)), br = 1 + 0.03 * Math.sin(t * 3);
    g.save(); g.translate(E.W / 2, 220); g.scale(br, br); text(g, info.text || 'LA MALDICIÓN', 0, 0, { size: 120, font: FONTS.title, weight: 700, color: RED, alpha: a, glow: 40, glowColor: alpha(RED, 0.7), spacing: 8 }); g.restore();
  },
  // Randy Gardner, 1964: a teenager by a wall calendar whose pages fly off 1→11
  randy(g, t, info) {
    const cam = camLerp(camAt(980, 620, 1.45), camAt(1000, 610, 1.55), K(info, t)), { rim, rimDir } = office(g, t, cam);
    const day = Math.min(11, 1 + Math.floor(prog(t, 0.2, info.dur * 0.8) * 10)), flip = (t * 10) % 1;
    layer(g, cam, 1, (g) => {
      rr(g, 1240, 420, 220, 250, 10); g.fillStyle = '#f4efe6'; g.fill(); rr(g, 1240, 420, 220, 60, 10); g.fillStyle = RED; g.fill();
      text(g, 'DÍA', 1350, 452, { size: 30, font: FONTS.ui, weight: 900, color: '#fff' }); text(g, String(day), 1350, 580, { size: 120, font: FONTS.ui, weight: 900, color: '#1a1622' });
      if (day < 11) { g.save(); g.globalAlpha = 1 - flip; g.translate(1350 + flip * 160, 545 - flip * 120); g.rotate(flip * 0.8); rr(g, -110, -95, 220, 190, 8); g.fillStyle = '#ece6da'; g.fill(); g.restore(); }
      drawFigure(g, { x: 980, y: GY, s: HS, facing: 1, outfit: RANDY, pose: breathe(posesAt(t, [[0, POSES.relaxed], [info.dur * 0.6, POSES.handsOnHead]], 0.4), t, 0.8), face: { ...F.day3, lid: lerp(0.2, 0.6, K(info, t)), bags: lerp(0, 0.7, K(info, t)) }, look: [0.7, -0.2], rim: { color: rim, dir: rimDir } });
    });
    placeTag(g, t, info.tag || 'EE. UU. · 1964');
  },
  // Randy's face, confused: a speech bubble of scrambled letters and floating hallucinations
  randyFace(g, t, info) {
    blurLayer(g, 14, (g) => office(g, t, camAt(1000, 560, 1.6))); veil(g, '#0a0812', 0.4);
    const r = lerp(290, 320, K(info, t));
    bigFace(g, E.W * 0.38, E.H * 0.62, r, { outfit: RANDY, face: { eyes: 'ball', brows: 'confused', mouth: 'wavy', lid: 0.45, bags: 0.7 }, look: key(t, [[0, [0.6, -0.2]], [0.8, [-0.6, -0.4]], [1.6, [0.6, 0]]], ease.inOut), rimColor: '#ffd09a', rimSide: 1 });
    wordBubble(g, t, E.W * 0.7, E.H * 0.26, info.scrambled || '¿Qeu djie ...?', info.at ?? 0.3, { dir: -1, tail: -80 });
    const rd = rng(8); for (let i = 0; i < 5; i++) { const a = ease.out(prog(t, (info.hallAt ?? 1.0) + i * 0.12, (info.hallAt ?? 1.0) + i * 0.12 + 0.4)); if (a <= 0) continue;
      const x = E.W * (0.6 + rd() * 0.35), y = E.H * (0.45 + rd() * 0.4) + Math.sin(t * 2 + i) * 20; g.save(); g.globalAlpha = 0.5 * a; icon(g, ['virus', 'moon', 'protein', 'heart', 'flame'][i], x, y, 0.8, ['#9fd8ff', '#ffd400', '#c09aff', '#ff8a9a', '#9affc8'][i], t); g.restore(); }
  },
  rats(g, t, info) {
    UI.blueprint(g, { grid: 60, a: 0.06 }); glow(g, E.W / 2, E.H * 0.5, 900, '#9fd8ff', 0.1);
    const z = lerp(1, 1.08, K(info, t)); g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
    ratCage(g, t, E.W / 2, E.H * 0.48, 1.25, { spin: 7 }); g.restore();
    const a = ease.out(prog(t, info.at ?? 0.5, (info.at ?? 0.5) + 0.35));
    if (a > 0) { text(g, info.text || '2–3 SEMANAS', E.W / 2, E.H * 0.88, { size: 80, font: FONTS.ui, weight: 900, color: ui().gold, alpha: a, glow: 24, glowColor: alpha(ui().gold, 0.6) }); }
  },
  // Randy asleep at last: "14 HORAS" — the switch that Silvano didn't have
  randySleep(g, t, info) {
    const cam = camLerp(camAt(BX + 260, MT - 80, 1.5), camAt(BX + 240, MT - 70, 1.6), K(info, t)), { M } = bedroom(g, t, cam, { clockH: 9, dawn: 0.9 });
    layer(g, cam, 1, (g) => { lyingHero(g, M, { face: { eyes: 'closed', brows: null, mouth: 'smile' }, collar: '#d64a33' });
      for (let i = 0; i < 3; i++) { const k = ((t * 0.7 + i / 3) % 1); text(g, 'z', HEAD.x + 60 + k * 120, HEAD.y - 60 - k * 160, { size: 40 + k * 50, font: FONTS.title, weight: 700, color: '#eef3ff', alpha: 1 - k }); } });
    const a = ease.out(prog(t, info.at ?? 0.4, (info.at ?? 0.4) + 0.35));
    if (a > 0) text(g, info.text || '14 HORAS', E.W * 0.7, E.H * 0.2, { size: 90, font: FONTS.ui, weight: 900, color: ui().gold, alpha: a, glow: 24, glowColor: alpha(ui().gold, 0.6) });
  },
  // a big "DORMIR" button pressed by Silvano's hand, again and again — nothing happens
  sleepButton(g, t, info) {
    g.fillStyle = linGrad(g, 0, 0, 0, E.H, ['#0a0c1a', '#161a34']); g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); glow(g, E.W / 2, E.H * 0.6, 700, '#ff5a4a', 0.12);
    const presses = info.presses || [0.35, 0.9, 1.4], down = presses.some((p) => t > p && t < p + 0.18), cx = E.W / 2, cy = E.H * 0.62;
    rr(g, cx - 330, cy + 40, 660, 120, 30); g.fillStyle = '#2a2e3a'; g.fill();
    g.fillStyle = '#7a1a14'; g.beginPath(); g.ellipse(cx, cy + 70, 270, 70, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = down ? '#c8301e' : RED; g.beginPath(); g.ellipse(cx, cy + (down ? 50 : 20), 260, 66, 0, 0, Math.PI * 2); g.fill();
    if (!down) { g.fillRect(cx - 260, cy + 20, 520, 50); g.fillStyle = '#7a1a14'; }
    text(g, 'DORMIR', cx, cy + (down ? 50 : 20), { size: 64, font: FONTS.ui, weight: 900, color: '#ffffff' });
    const hy = down ? cy - 30 : cy - 170 - Math.sin(t * 3) * 10;                                                 // Silvano's arm: olive sleeve -> forearm -> fist
    seg(g, [[cx + 70, hy - 330], [cx + 24, hy - 30]], 120, alpha('#b8c8ff', 0.6)); seg(g, [[cx + 70, hy - 330], [cx + 24, hy - 30]], 112, '#0a0c16');
    circle(g, cx + 20, hy, 74, '#0a0c16'); for (let k = 0; k < 3; k++) seg(g, [[cx - 30 + k * 30, hy - 30], [cx - 30 + k * 30, hy + 30]], 6, alpha('#b8c8ff', 0.35));
    rr(g, cx - 20, hy - 640, 190, 340, 40); g.fillStyle = '#6f8a5a'; g.fill(); rr(g, cx - 20, hy - 340, 190, 40, 16); g.fillStyle = shade('#6f8a5a', -0.25); g.fill();
    const nope = presses.find((p) => t > p + 0.18 && t < p + 0.5); if (nope != null) label(g, '…', cx + 330, cy - 120, { size: 90, color: alpha('#ffffff', 0.7) });
    const x = ease.out(prog(t, info.xAt ?? 1.9, (info.xAt ?? 1.9) + 0.3)); if (x > 0) label(g, info.text || 'SIN BOTÓN', cx, E.H * 0.16, { size: 80, color: RED, a: x, glow: 20, glowColor: alpha(RED, 0.6) });
  },
  // two weeks: the hero sits on the bed acting out a dream — eating with an invisible spoon, ghost objects around him
  stupor(g, t, info) {
    const cam = camLerp(camAt(1110, 660, 1.75), camAt(1120, 650, 1.85), K(info, t)), { M } = bedroom(g, t, cam, { clockH: 3 });
    const sp = Math.sin(t * 3.2), EAT = { head: [18, -166], sh: [8, -140], hip: [0, -72], eF: [34, -112], hF: [lerp(40, 22, (sp + 1) / 2), lerp(-110, -160, (sp + 1) / 2)], eB: [28, -104], hB: [48, -96], kF: [46, -72], fF: [50, 0], kB: [42, -70], fB: [40, 0] };
    layer(g, cam, 1, (g) => {
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(1120 + 77, GY + 2, 40, 10, 0, 0, Math.PI * 2); g.fill();
      drawFigure(g, { x: 1120, y: GY, s: HS, facing: 1, outfit: HERO, pose: EAT, shadow: false, face: F.blank, look: [0.6, 0], rim: { color: M.rim, dir: [1, -0.4] } });
      g.save(); g.globalAlpha = 0.35 + 0.15 * Math.sin(t * 2); rr(g, 1210, 640, 120, 16, 8); g.fillStyle = '#cfe0ff'; g.fill(); circle(g, 1270, 630, 28, '#cfe0ff'); g.restore();   // a ghost plate
    });
    for (let i = 0; i < 6; i++) { const a = 0.18 + 0.12 * Math.sin(t * 1.5 + i), x = E.W * (0.15 + i * 0.14), y = E.H * 0.25 + Math.sin(t + i * 2) * 40; g.save(); g.globalAlpha = a; icon(g, ['moon', 'heart', 'protein', 'flame', 'virus', 'moon'][i], x, y, 0.7, '#cfe0ff', t); g.restore(); }
    FX.fog(g, E.H * 0.55, E.H * 0.5, '#9aa8e0', 0.18);
  },
  // the bathroom scale: kilos dropping
  scale(g, t, info) {
    g.fillStyle = '#c8d0da'; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3);
    g.strokeStyle = alpha('#7a8494', 0.4); g.lineWidth = 3; for (let x = 0; x < E.W; x += 120) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, E.H); g.stroke(); } for (let y = 0; y < E.H; y += 120) { g.beginPath(); g.moveTo(0, y); g.lineTo(E.W, y); g.stroke(); }
    const z = lerp(1, 1.06, K(info, t)); g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
    rr(g, E.W / 2 - 360, E.H * 0.42, 720, 500, 60); g.fillStyle = '#f4f6fa'; g.fill(); rr(g, E.W / 2 - 160, E.H * 0.46, 320, 130, 16); g.fillStyle = '#1a2230'; g.fill();
    const kg = lerp(info.from ?? 78, info.to ?? 64, ease.out(prog(t, 0.2, info.dur - 0.2)));
    text(g, kg.toFixed(1) + ' kg', E.W / 2, E.H * 0.46 + 66, { size: 74, font: FONTS.ui, weight: 900, color: '#6fffb0', glow: 16, glowColor: 'rgba(111,255,176,.6)' });
    for (const fx of [-250, 250]) { rr(g, E.W / 2 + fx - 70, E.H * 0.66, 140, 220, 50); g.fillStyle = '#0a0c16'; g.fill(); seg(g, [[E.W / 2 + fx, E.H * 0.66], [E.W / 2 + fx * 0.8, -50]], 34, '#0a0c16'); }
    g.restore();
  },
  // the hero confused: the wall calendar spins its days, question marks around him
  confusion(g, t, info) {
    blurLayer(g, 12, (g) => bedroom(g, t, camAt(1000, 560, 1.4), { dawn: 0.3 })); veil(g, '#0a0812', 0.4);
    bigFace(g, E.W * 0.4, E.H * 0.62, lerp(290, 315, K(info, t)), { outfit: HERO, face: { eyes: 'ball', brows: 'confused', mouth: 'wavy', lid: 0.5, bags: 1 }, look: key(t, [[0, [0.7, -0.3]], [0.9, [-0.7, -0.3]], [1.7, [0.7, -0.3]]], ease.inOut), rimColor: '#b8c8ff', rimSide: 1 });
    const x = E.W * 0.76, y = E.H * 0.42; rr(g, x - 160, y - 190, 320, 380, 14); g.fillStyle = '#f4efe6'; g.fill(); rr(g, x - 160, y - 190, 320, 80, 14); g.fillStyle = RED; g.fill();
    text(g, ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'][Math.floor(t * 6) % 7], x, y - 150, { size: 40, font: FONTS.ui, weight: 900, color: '#fff' });
    text(g, String(1 + (Math.floor(t * 9) * 7) % 31), x, y + 30, { size: 150, font: FONTS.ui, weight: 900, color: '#1a1622' });
    for (let i = 0; i < 4; i++) { const a = pop(t, 0.2 + i * 0.25); if (a <= 0) continue; text(g, '?', E.W * (0.12 + i * 0.07), E.H * (0.25 + (i % 2) * 0.12) + Math.sin(t * 3 + i) * 12, { size: 110 * a, font: FONTS.title, weight: 700, color: ui().gold, alpha: 0.85 }); }
  },
  // fog: the hero lying in bed, the room drowning in mist
  fogBed(g, t, info) {
    const cam = camLerp(camAt(BX + 260, MT - 80, 1.45), camAt(BX + 250, MT - 80, 1.55), K(info, t)), { M } = bedroom(g, t, cam, { clockH: 4 });
    layer(g, cam, 1, (g) => lyingHero(g, M, { face: F.blank, look: [0, -0.5] })); moonlight(g, t, cam);
    for (let i = 0; i < 4; i++) FX.fog(g, E.H * (0.2 + i * 0.2) + Math.sin(t * 0.6 + i) * 30, E.H * 0.35, '#b8c4e8', 0.22);
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(160,170,230,.3)'; g.fillRect(0, 0, E.W, E.H); g.restore();
  },
  // hospital: a patient in bed; monitor mode/label; optional mask (anesthesia), panic spikes, visitor at the bedside
  hospitalBed(g, t, info) {
    const cam = camLerp(camAt(info.cx || 1040, 600, info.z || 1.3), camAt((info.cx || 1040) + 20, 590, (info.z || 1.3) + 0.1), K(info, t));
    const spike = info.panic ? Math.max(0, Math.sin(t * 3.5)) ** 4 : 0;
    const { rim } = hospital(g, t, cam, { night: info.night, monitor: info.monitor || 'ecg', monitorLabel: info.monitorLabel, monitorColor: info.monitorColor, spike });
    const p = who(info.who || 'hero');
    layer(g, cam, 1, (g) => {
      if (info.visitor) drawFigure(g, { x: HB.x + HB.w + 120, y: GY, s: HS, facing: -1, outfit: who(info.visitor), pose: breathe({ ...POSES.stand, head: [10, -202], eF: [16, -140], hF: [30, -124] }, t, 0.7), face: { eyes: 'ball', brows: 'worried', mouth: 'flat' }, look: [-0.6, 0.4], rim: { color: rim, dir: [0.4, -1] } });
      hospitalPatient(g, { collar: p.color, electrodes: info.electrodes, drawFace: (g, r) => drawFaceAt(g, 0, 0, r, { override: { ...fc(info.face || 'blank'), ...(info.panic && spike > 0.3 ? { eyeSize: 1.3, pupil: 0.25 } : {}) }, look: info.look || [0, 0] }) });
      if (info.mask) { const hx = HB.x + 76, hy = HB.top - 28; g.fillStyle = alpha('#d8f0ff', 0.85); g.beginPath(); g.ellipse(hx + 14, hy - 30, 34, 26, -0.3, 0, Math.PI * 2); g.fill(); seg(g, [[hx + 30, hy - 50], [hx + 120, hy - 200], [640, 380]], 5, alpha('#d8f0ff', 0.7)); }
      if (info.question) { const a = pop(t, info.question); if (a > 0) text(g, '?', HB.x + 120, HB.top - 140, { size: 140 * a, font: FONTS.title, weight: 700, color: ui().gold }); }
      if (info.doctor) drawFigure(g, { x: HB.x + HB.w + 140, y: GY, s: HS, facing: -1, outfit: who(info.doctor), pose: breathe(POSES.crossArms, t, 0.6), face: F.tired, look: [-0.5, 0.3], rim: { color: rim, dir: [0.4, -1] } });
    });
    if (info.panic) { g.save(); g.globalAlpha = 0.25 * spike; g.fillStyle = RED; g.fillRect(0, 0, E.W, E.H); g.restore(); }
    placeTag(g, t, info.tag);
  },
  // the Venetian doctor, 1765: sepia, candlelight, lying in an old bed
  venice(g, t, info) {
    const cam = camLerp(camAt(1000, 620, 1.35), camAt(1010, 610, 1.45), K(info, t)); venice(g, t, cam);
    layer(g, cam, 1, (g) => { const hx = 720, hy = GY - 180, r = 43; rr(g, 650, GY - 200, 130, 48, 20); g.fillStyle = '#e8dcc0'; g.fill();
      circle(g, hx + 4, hy - 4, r * 1.03, '#ffb060'); circle(g, hx, hy, r, '#0a0c16'); g.save(); g.translate(hx, hy); g.rotate(-Math.PI / 2); drawFaceAt(g, 0, 0, r, { override: F.blank }); g.restore();
      g.beginPath(); g.moveTo(745, GY - 146); g.quadraticCurveTo(800, GY - 200, 950, GY - 190); g.quadraticCurveTo(1100, GY - 180, 1240, GY - 150); g.lineTo(1244, GY - 96); g.lineTo(740, GY - 96); g.closePath(); g.fillStyle = '#8a3a2a'; g.fill(); });
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(200,150,90,.35)'; g.fillRect(0, 0, E.W, E.H); g.restore();
    placeTag(g, t, info.tag || 'VENECIA · 1765');
  },
  // a scientist presenting a blueprint board (icon + caption); year/place tag
  presenter(g, t, info) {
    UI.blueprint(g, { grid: 60, a: 0.07 });
    const cam = camAt(960, 560, lerp(1, 1.05, K(info, t)));
    layer(g, cam, 1, (g) => {
      rr(g, 820, 180, 900, 560, 20); g.fillStyle = 'rgba(11,19,36,.9)'; g.fill(); g.strokeStyle = alpha(ui().blueprint, 0.5); g.lineWidth = 3; g.stroke();
      const a = pop(t, info.at ?? 0.3, 0.4); if (a > 0) { g.save(); g.translate(1270, 430); g.scale(a, a); icon(g, info.icon || 'dna', 0, 0, 2.2, ui().gold, t); g.restore(); }
      if (info.caption) text(g, info.caption, 1270, 680, { size: 44, font: FONTS.ui, weight: 900, color: ui().cream, alpha: ease.out(prog(t, (info.at ?? 0.3) + 0.3, (info.at ?? 0.3) + 0.6)) });
      drawFigure(g, { x: 560, y: GY, s: HS, facing: 1, outfit: who(info.who || 'lugaresi'), pose: breathe(posesAt(t, [[0, POSES.relaxed], [info.at ?? 0.3, POSES.point]], 0.3), t, 0.7), face: fc('talk'), look: [0.8, -0.2], rim: { color: ui().blueprint, dir: [1, -0.4] } });
    });
    placeTag(g, t, info.tag);
  },
  // Sonia's story: mother (photo + candle) | test (result card) | change (lawyer → scientist with Eric) | lab (PrP going down)
  sonia(g, t, info) {
    const mode = info.mode || 'mother';
    if (mode === 'test') {
      blurLayer(g, 14, (g) => office(g, t, camAt(1000, 600, 2))); veil(g, '#060812', 0.5);
      const a = pop(t, 0.1, 0.4); g.save(); g.translate(E.W / 2, E.H / 2); g.scale(a, a); g.rotate(-0.03);
      rr(g, -380, -300, 760, 600, 14); g.fillStyle = '#f6f4ee'; g.fill();
      text(g, 'RESULTADO GENÉTICO', 0, -220, { size: 44, font: FONTS.ui, weight: 900, color: '#3a3a4a' });
      text(g, 'Gen PRNP · mutación D178N', 0, -120, { size: 38, font: FONTS.ui, weight: 800, color: '#5a5a6a' });
      const st = ease.outBack(prog(t, info.stampAt ?? 0.9, (info.stampAt ?? 0.9) + 0.25)); if (st > 0) { g.save(); g.translate(0, 80); g.rotate(-0.12); g.scale(1 + (1 - st) * 1.5, 1 + (1 - st) * 1.5); g.globalAlpha *= clamp(st * 2);
        rr(g, -260, -70, 520, 140, 14); g.strokeStyle = RED; g.lineWidth = 10; g.stroke(); text(g, 'POSITIVO', 0, 0, { size: 100, font: FONTS.ui, weight: 900, color: RED }); g.restore(); }
      g.restore(); return;
    }
    if (mode === 'lab') {
      UI.blueprint(g, { grid: 60, a: 0.07 });
      const cam = camAt(960, 560, lerp(1, 1.05, K(info, t)));
      layer(g, cam, 1, (g) => {
        rr(g, 980, 200, 760, 500, 18); g.fillStyle = 'rgba(11,19,36,.92)'; g.fill(); g.strokeStyle = alpha(ui().blueprint, 0.5); g.lineWidth = 3; g.stroke();
        text(g, 'PrP EN EL CEREBRO', 1360, 250, { size: 36, font: FONTS.ui, weight: 900, color: ui().cream });
        const p = ease.inOut(prog(t, 0.3, info.dur - 0.3)); g.strokeStyle = '#6fffb0'; g.lineWidth = 6; g.beginPath();
        for (let i = 0; i <= 50; i++) { const u = i / 50; if (u > p) break; g.lineTo(1040 + u * 640, 320 + 300 * (u < 0.3 ? 0 : ease.inOut((u - 0.3) / 0.7)) + Math.sin(u * 30) * 6); } g.stroke();
        drawFigure(g, { x: 560, y: GY, s: HS, facing: 1, outfit: { ...SONIA, top: 'labcoat' }, pose: breathe(POSES.point, t, 0.7), face: F.smile, look: [0.8, -0.2], rim: { color: ui().blueprint, dir: [1, -0.4] } });
        drawFigure(g, { x: 380, y: GY, s: HS, facing: 1, outfit: { ...ERIC, top: 'labcoat' }, pose: breathe(POSES.crossArms, t, 0.7, 2), face: F.smile, look: [0.8, 0], rim: { color: ui().blueprint, dir: [1, -0.4] } });
      });
      placeTag(g, t, info.tag); return;
    }
    // mother / change: a warm room
    const cam = camLerp(camAt(1000, 620, 1.45), camAt(1010, 610, 1.55), K(info, t)), { rim, rimDir } = office(g, t, cam);
    layer(g, cam, 1, (g) => {
      if (mode === 'mother') {
        rr(g, 1180, 470, 220, 260, 8); g.fillStyle = '#3a2614'; g.fill(); rr(g, 1196, 486, 188, 228, 4); g.fillStyle = '#d8c8a8'; g.fill();
        circle(g, 1290, 570, 46, '#3a2a20'); g.fillStyle = '#3a2a20'; g.beginPath(); g.ellipse(1290, 700, 80, 70, 0, Math.PI, Math.PI * 2); g.fill(); rr(g, 1236, 512, 108, 30, 14); g.fillStyle = '#2a1a14'; g.fill();
        rr(g, 1420, 700, 16, 40, 4); g.fillStyle = '#f2e6cc'; g.fill(); glow(g, 1428, 690, 120, '#ffb050', 0.5); poly(g, [[1428, 672], [1434, 690], [1422, 690]], '#ffd27a');
        drawFigure(g, { x: 1000, y: GY, s: HS, facing: 1, outfit: SONIA, pose: breathe({ ...POSES.sad }, t, 0.6), face: F.sad, look: [0.8, -0.1], rim: { color: rim, dir: rimDir } });
      } else {
        const sw = ease.inOut(prog(t, info.swapAt ?? 1.0, (info.swapAt ?? 1.0) + 0.3));
        drawFigure(g, { x: 900, y: GY, s: HS, facing: 1, outfit: sw > 0.5 ? { ...SONIA, top: 'labcoat' } : { ...SONIA, top: 'suit', color: '#3a3a4a' }, pose: breathe(sw > 0.5 ? POSES.cheer : POSES.holdFront, t, 0.7), face: sw > 0.5 ? F.smile : F.talk, look: [0.6, 0], rim: { color: rim, dir: rimDir } });
        if (sw > 0.5) drawFigure(g, { x: 1120, y: GY, s: HS, facing: -1, outfit: { ...ERIC, top: 'labcoat' }, pose: breathe(POSES.wave, t, 0.7, 2), face: F.smile, look: [-0.6, 0], rim: { color: rim, dir: [-1, -0.4] } });
        if (sw > 0 && sw < 1) { g.save(); g.globalAlpha = 1 - Math.abs(sw - 0.5) * 2; g.fillStyle = '#ffffff'; g.fillRect(-E.W, -E.H, E.W * 3, E.H * 3); g.restore(); }
      }
    });
    placeTag(g, t, info.tag);
  },
  // a pill bottle with an Italian label: doxycycline
  doxy(g, t, info) {
    blurLayer(g, 14, (g) => hospital(g, t, camAt(1000, 600, 1.8), {})); veil(g, '#08100e', 0.45);
    const a = pop(t, 0.1, 0.4), cx = E.W / 2, cy = E.H * 0.52, z = lerp(1, 1.06, K(info, t));
    g.save(); g.translate(cx, cy); g.scale(a * z, a * z);
    rr(g, -170, -260, 340, 470, 34); g.fillStyle = alpha('#e88a3a', 0.92); g.fill(); rr(g, -190, -320, 380, 80, 18); g.fillStyle = '#f4f4f4'; g.fill();
    rr(g, -150, -150, 300, 230, 10); g.fillStyle = '#f6f4ee'; g.fill(); ['#009246', '#f1f2f1', '#ce2b37'].forEach((c, i) => { g.fillStyle = c; g.fillRect(-150 + i * 100, -150, 100, 30); });
    text(g, 'DOXICICLINA', 0, -40, { size: 40, font: FONTS.ui, weight: 900, color: '#2a2a3a' }); text(g, 'ensayo clínico', 0, 20, { size: 28, font: FONTS.ui, weight: 800, color: '#6a6a7a' });
    g.restore(); placeTag(g, t, info.tag || 'ITALIA');
  },
  // the final question card (serif) over the night bedroom
  question(g, t, info) {
    blurLayer(g, 14, (g) => bedroom(g, t, camAt(1000, 560, 1.3), { dawn: 0 })); veil(g, '#05060f', 0.55);
    const lines = info.lines || ['¿Podrías vivir sabiendo', 'que tu cerebro podría', 'quitarte el sueño para siempre?'];
    lines.forEach((ln, i) => text(g, ln, E.W / 2, E.H * 0.36 + i * 110, { size: 76, font: FONTS.serif, weight: 900, italic: true, color: ui().cream, alpha: ease.out(prog(t, 0.2 + i * 0.35, 0.6 + i * 0.35)), glow: 18, glowColor: 'rgba(255,200,120,.45)' }));
  },
  endScreen(g, t, info) {
    UI.endScreen(g, t, { question: info.questionText || '¿Y si tu cuerpo pudiera matarte mientras duermes?', subscribeLabel: 'Suscribirse', cast: [HERO, SILVANO, LUGARESI, RANDY, SONIA], moodColors: ['#0a0c1e', '#141a3a', '#2a1a3a'], rim: '#b8c8ff' });
  },
};
