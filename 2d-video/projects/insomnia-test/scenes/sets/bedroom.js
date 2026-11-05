// sets/bedroom.js — hero's bedroom at night, side view. World is fixed so every shot of this room matches.
// Light: one key = moonlight from the window (right), spilled as god rays onto the bed and a pool on the floor.
import { E, mood, layer, rr, seg, circle, ring, poly, linGrad, glow, alpha, shade, mix, lerp, clamp } from '/engine/core.js';
import { face } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';

export const GY = 864;                       // floor line
export const HS = 1.67;                      // hero scale: seated hip (72 rig units) lands exactly on the mattress
export const BX = 620, BW = 540;             // bed: head end x, length
export const MT = GY - 72 * HS;              // mattress top (744)
export const HEAD = { x: BX + 78, y: MT - 30, r: 26 * HS };
export const NS = { x: 440, w: 140, top: GY - 160 };
export const CLOCK = { x: NS.x + 70, y: NS.top - 34, r: 30 };
export const WIN = { x: 1290, y: 200, w: 430, h: 420 };

const NIGHT_SKY = ['#0b1030', '#1c2456', '#2c2c66', '#3a3470'];
const DAWN_SKY = ['#283066', '#5a4c8c', '#b57a92', '#f0a878'];
const skyAt = (k) => NIGHT_SKY.map((c, i) => mix(c, DAWN_SKY[i], clamp(k)));

export function bedroom(g, t, cam, o = {}) {
  const M = mood('night'), dawn = o.dawn || 0;
  const wall = mix(M.wall, '#5a4a7a', dawn * 0.35);
  layer(g, cam, 0.75, (g) => {
    g.fillStyle = linGrad(g, 0, -E.H, 0, GY, [shade(wall, -0.45), shade(wall, -0.1), wall]); g.fillRect(-E.W, -E.H * 2, E.W * 4, GY + E.H * 2 + 20);
    // framed picture above the bed — one quiet detail, not clutter
    rr(g, 780, 360, 200, 150, 6); g.fillStyle = shade(wall, -0.4); g.fill();
    rr(g, 792, 372, 176, 126, 3); g.fillStyle = shade(wall, -0.15); g.fill();
    poly(g, [[792, 498], [850, 420], [890, 465], [920, 432], [968, 498]], shade(wall, -0.32));
    // window: sky, moon, stars, skyline, mullions
    const sky = skyAt(dawn);
    FX.windowFrame(g, { x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, cols: 2, rows: 2, frame: shade(wall, -0.55), bar: 12 }, (g, x, y, w, h) => {
      g.fillStyle = linGrad(g, 0, y, 0, y + h, sky); g.fillRect(x, y, w, h);
      if (dawn < 0.95) { FX.stars(g, t, { area: [x, y, w, h * 0.55], count: 34, seed: 9 }); g.save(); g.globalAlpha *= 1; g.restore(); }
      const ma = 1 - clamp(dawn * 1.3);
      if (ma > 0) { g.save(); g.globalAlpha *= ma; circle(g, x + 118, y + 108, 34, '#eef1ff'); glow(g, x + 118, y + 108, 170, '#dfe6ff', 0.55); g.restore(); }
      if (dawn > 0) glow(g, x + w * 0.6, y + h, w * 0.9, '#ffb28a', 0.35 * dawn);
      FX.skyline(g, { x, y: y + h, w, minH: 40, maxH: h * 0.38, color: mix('#141838', '#2a2450', dawn), windowColor: alpha('#ffcf8a', 0.75), lit: 0.18, seed: 6 });
    });
    rr(g, WIN.x - 24, WIN.y + WIN.h, WIN.w + 48, 16, 4); g.fillStyle = shade(wall, -0.35); g.fill();   // sill
    // curtains, pulled to the sides
    seg(g, [[WIN.x - 110, WIN.y - 46], [WIN.x + WIN.w + 110, WIN.y - 46]], 8, shade(wall, -0.6));
    for (const [cx, dir] of [[WIN.x - 92, 1], [WIN.x + WIN.w + 12, -1]]) {
      const cw = 80, ch = WIN.h + 150, cy = WIN.y - 44, col = mix('#2c3470', wall, 0.35);
      g.fillStyle = linGrad(g, cx, 0, cx + cw, 0, [shade(col, -0.25), col, shade(col, -0.35)]); rr(g, cx, cy, cw, ch, 10); g.fill();
      g.strokeStyle = alpha('#000', 0.22); g.lineWidth = 3; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(cx + (i * cw) / 4, cy + 6); g.lineTo(cx + (i * cw) / 4 + dir * 4, cy + ch - 6); g.stroke(); }
    }
    glow(g, WIN.x + WIN.w / 2, WIN.y + WIN.h / 2, 420, dawn > 0.3 ? '#ffc3a0' : M.key, 0.08);
  });
  layer(g, cam, 1, (g) => {
    // floor reaches far below the frame, so no camera move can reveal a black gap
    const floor = mix(M.floor, '#3a3460', dawn * 0.3);
    g.fillStyle = linGrad(g, 0, GY, 0, GY + 420, [shade(floor, 0.12), shade(floor, -0.15)]); g.fillRect(-E.W, GY, E.W * 4, E.H * 3);
    FX.floorLines(g, GY, GY + 600, 'rgba(0,0,0,.18)', 0.08);
    g.fillStyle = shade(wall, -0.3); g.fillRect(-E.W, GY - 12, E.W * 4, 12);                 // baseboard
    rr(g, 560, GY + 16, 760, 54, 26); g.fillStyle = mix('#4a3d6e', floor, 0.4); g.fill();      // rug
    FX.pool(g, 1080, GY + 52, 380, 44, '#b8c6ff', 0.14 + 0.1 * dawn);
    nightstand(g, o.clockH ?? 23, o.alarm ?? 6);
    bedBack(g);
  });
  return { M, dawn };
}

export function nightstand(g, hours, alarm) {
  const c = '#2a2346', top = shade(c, 0.25);
  for (const lx of [NS.x + 10, NS.x + NS.w - 22]) { g.fillStyle = shade(c, -0.3); g.fillRect(lx, NS.top + 120, 12, GY - NS.top - 120); }
  rr(g, NS.x, NS.top, NS.w, 124, 8); g.fillStyle = c; g.fill();
  rr(g, NS.x - 6, NS.top - 8, NS.w + 12, 14, 5); g.fillStyle = top; g.fill();
  rr(g, NS.x + 14, NS.top + 46, NS.w - 28, 4, 2); g.fillStyle = alpha('#000', 0.3); g.fill();
  circle(g, NS.x + NS.w / 2, NS.top + 76, 6, shade(top, 0.3));
  alarmClock(g, CLOCK.x, CLOCK.y, CLOCK.r, hours, { alarm });
}

// twin-bell alarm clock; `hours` is a 24h float (23.5 = 23:30), `alarm` the gold alarm hand
export function alarmClock(g, x, y, r, hours, o = {}) {
  const red = '#d9483a', ink = '#1a1622';
  seg(g, [[x - r * 0.55, y + r * 0.8], [x - r * 0.75, y + r * 1.12]], r * 0.14, shade(red, -0.3));
  seg(g, [[x + r * 0.55, y + r * 0.8], [x + r * 0.75, y + r * 1.12]], r * 0.14, shade(red, -0.3));
  for (const sx of [-1, 1]) { circle(g, x + sx * r * 0.62, y - r * 0.86, r * 0.34, '#c9cbd8'); circle(g, x + sx * r * 0.62 - r * 0.08, y - r * 0.94, r * 0.1, '#eef0f8'); }
  seg(g, [[x, y - r * 1.02], [x, y - r * 1.2]], r * 0.1, '#c9cbd8');
  circle(g, x, y, r, red); circle(g, x - r * 0.25, y - r * 0.3, r * 0.3, alpha('#fff', 0.18));
  circle(g, x, y, r * 0.78, '#fff7ea');
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; seg(g, [[x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62], [x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7]], r * 0.05, ink); }
  const ang = (v) => v * Math.PI * 2 - Math.PI / 2, h12 = (((hours % 12) + 12) % 12) / 12, mn = ((hours % 1) + 1) % 1;
  if (o.alarm != null) seg(g, [[x, y], [x + Math.cos(ang(((o.alarm % 12) / 12))) * r * 0.5, y + Math.sin(ang(((o.alarm % 12) / 12))) * r * 0.5]], r * 0.05, '#e0a32a');
  seg(g, [[x, y], [x + Math.cos(ang(h12)) * r * 0.42, y + Math.sin(ang(h12)) * r * 0.42]], r * 0.09, ink);
  seg(g, [[x, y], [x + Math.cos(ang(mn)) * r * 0.62, y + Math.sin(ang(mn)) * r * 0.62]], r * 0.06, ink);
  circle(g, x, y, r * 0.07, ink);
}

function bedBack(g) {
  const wood = '#2e2548', light = shade(wood, 0.25);
  rr(g, BX - 28, MT - 176, 32, GY - (MT - 176), 12); g.fillStyle = wood; g.fill();                     // headboard
  rr(g, BX - 22, MT - 166, 6, 120, 3); g.fillStyle = alpha(light, 0.5); g.fill();
  rr(g, BX + BW - 6, MT - 40, 24, GY - (MT - 40), 8); g.fillStyle = wood; g.fill();                   // footboard
  g.fillStyle = shade(wood, -0.15); g.fillRect(BX, MT + 38, BW, 46);                                     // side rail
  g.fillStyle = shade(wood, -0.35); g.fillRect(BX + 8, MT + 84, 14, GY - MT - 84); g.fillRect(BX + BW - 26, MT + 84, 14, GY - MT - 84);
  rr(g, BX, MT, BW, 46, 14); g.fillStyle = '#aab1d6'; g.fill();                                         // mattress
  rr(g, BX + 8, MT - 40, 132, 50, 22); g.fillStyle = '#dde0f2'; g.fill();                               // pillow
  rr(g, BX + 16, MT - 34, 100, 10, 5); g.fillStyle = alpha('#fff', 0.35); g.fill();
}

// the hero lying under the covers. mode: 'up' (on back, face to ceiling), 'front' (rolled toward camera), 'away' (rolled away)
export function lyingHero(g, M, o = {}) {
  const mode = o.mode || 'up', hx = HEAD.x + (o.dx || 0), hy = HEAD.y + (o.dy || 0), r = HEAD.r;
  // head + rim (moonlight comes from the upper right)
  circle(g, hx + r * 0.08, hy - r * 0.06, r * 1.03, M.rim);
  circle(g, hx, hy, r, '#0a0c16');
  if (mode === 'up') { g.save(); g.translate(hx, hy); g.rotate(-Math.PI / 2); face(g, 0, 0, r, { expr: o.expr, look: o.look, blink: o.blink, override: o.face }); g.restore(); }
  else if (mode === 'front') face(g, hx, hy, r, { expr: o.expr, look: o.look, blink: o.blink, override: o.face, front: true });
  // blanket: contour follows the body underneath
  const side = mode === 'up' ? 0 : 1, k = o.rustle || 0;
  const bump = (base, a) => MT - base - a * side + Math.sin(k * 9) * 3 * (k > 0 ? 1 : 0);
  const pts = [[BX + 104, MT + 8], [BX + 118, bump(34, 10)], [BX + 190, bump(44, 18)], [BX + 300, bump(42, 14)], [BX + 370, bump(34, 22)], [BX + 450, bump(22, 12)], [BX + 505, bump(30, 6)], [BX + BW + 8, MT - 4]];
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; g.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2); }
  g.lineTo(BX + BW + 8, MT - 4); g.lineTo(BX + BW + 12, MT + 64); g.lineTo(BX + 100, MT + 64); g.closePath();
  const bc = o.blanket || '#3c4f96';
  g.fillStyle = linGrad(g, 0, MT - 50, 0, MT + 64, [shade(bc, 0.28), bc, shade(bc, -0.3)]); g.fill();
  g.save(); g.beginPath(); g.rect(BX + 96, MT - 120, 120, 200); g.clip();                               // folded sheet: a band along the top edge
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; g.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2); }
  g.strokeStyle = '#cdd3ec'; g.lineWidth = 18; g.lineCap = 'round'; g.stroke(); g.restore();
  g.strokeStyle = alpha('#000', 0.16); g.lineWidth = 3;
  for (const fx of [BX + 230, BX + 330, BX + 430]) { g.beginPath(); g.moveTo(fx, MT - 20); g.quadraticCurveTo(fx + 14, MT + 20, fx + 4, MT + 58); g.stroke(); }
  if (o.arm) {                                                                                          // arm flopped out over the covers
    const a = clamp(o.arm), sh = [BX + 130, MT - 26], el = [lerp(BX + 150, BX + 200, a), lerp(MT - 18, MT - 44, a)], hd = [lerp(BX + 170, BX + 262, a), lerp(MT - 10, MT - 40, a)];
    seg(g, [sh, el, hd], 22, M.rim); seg(g, [sh, el, hd], 18, '#0a0c16');
    circle(g, hd[0] + 3, hd[1], 13, M.rim); circle(g, hd[0], hd[1], 12, '#0a0c16');
  }
}

// moonlight shafts from the window onto the bed + dust floating in them (drawn last, additive)
export function moonlight(g, t, cam, o = {}) {
  const k = 1 - clamp((o.dawn || 0) * 0.8);
  layer(g, cam, 0.9, (g) => {
    FX.godRays(g, WIN.x + WIN.w * 0.45, WIN.y + WIN.h * 0.4, { angle: 2.42, spread: 0.42, len: 1200, color: '#b8c6ff', a: 0.06 * k, t, count: 6 });
    FX.dust(g, t, { area: [BX - 60, MT - 360, 760, 420], count: 46, color: '#dfe6ff', a: 0.42, speed: 9 });
  });
}
