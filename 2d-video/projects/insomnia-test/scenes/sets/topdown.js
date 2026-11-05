// sets/topdown.js — the same bed seen from the ceiling. Moonlight falls in from the window on the right.
import { E, mood, layer, rr, seg, circle, poly, linGrad, glow, alpha, shade, mix, lerp, clamp } from '/engine/core.js';
import { face } from '/engine/rig2d.js';

export const TD = { head: { x: 960, y: 262, r: 74 }, stand: { x: 500, y: 170, w: 150, h: 150 }, phone: { x: 545, y: 238 } };

export function topDown(g, t, cam, o = {}) {
  const M = mood('night'), H = TD.head, br = 0.5 + 0.5 * Math.sin(t * 1.9);           // breathing 0..1
  layer(g, cam, 1, (g) => {
    const floor = shade(M.floor, 0.06);
    g.fillStyle = floor; g.fillRect(-E.W, -E.H, E.W * 4, E.H * 4);
    g.strokeStyle = alpha('#000', 0.16); g.lineWidth = 3; for (let x = -E.W; x < E.W * 3; x += 90) { g.beginPath(); g.moveTo(x, -E.H); g.lineTo(x, E.H * 3); g.stroke(); }
    rr(g, 250, 520, 380, 420, 30); g.fillStyle = mix('#3e3560', floor, 0.6); g.fill();                    // rug
    rr(g, 266, 536, 348, 388, 24); g.strokeStyle = alpha('#ffffff', 0.06); g.lineWidth = 4; g.stroke();
    // nightstand + alarm clock (top view) + phone
    const S = TD.stand; rr(g, S.x, S.y, S.w, S.h, 10); g.fillStyle = '#2f2850'; g.fill();
    rr(g, S.x + 8, S.y + 8, S.w - 16, S.h - 16, 8); g.fillStyle = '#382f5e'; g.fill();
    rr(g, S.x + 64, S.y + 22, 66, 42, 14); g.fillStyle = '#d9483a'; g.fill(); circle(g, S.x + 70, S.y + 22, 12, '#c9cbd8'); circle(g, S.x + 124, S.y + 22, 12, '#c9cbd8');
    if (!o.phoneInHand) { rr(g, TD.phone.x - 22, TD.phone.y - 40, 44, 80, 9); g.fillStyle = '#0c0e18'; g.fill(); }
    // bed
    rr(g, 680, 96, 560, 40, 12); g.fillStyle = '#2e2548'; g.fill();                                         // headboard
    rr(g, 690, 120, 540, 930, 18); g.fillStyle = '#2a2244'; g.fill();
    rr(g, 704, 134, 512, 900, 16); g.fillStyle = '#aab1d6'; g.fill();                                       // mattress
    rr(g, 770, 160 + br * 2, 380, 150, 46); g.fillStyle = '#dde0f2'; g.fill();                              // pillow
    rr(g, 800, 178, 320, 18, 9); g.fillStyle = alpha('#fff', 0.35); g.fill();
    // shoulders, then the head on the pillow
    g.fillStyle = o.shirt || '#ffd400'; g.beginPath(); g.ellipse(H.x, 372 + br * 3, 150, 62, 0, 0, Math.PI * 2); g.fill();
    circle(g, H.x + H.r * 0.07, H.y, H.r * 1.04, M.rim); circle(g, H.x, H.y, H.r, '#0a0c16');
    face(g, H.x, H.y, H.r, { expr: o.expr, look: o.look, blink: o.blink, override: o.face, front: true });
    // blanket with the folded sheet; lighter along the body ridge
    const by = 360 + br * 4, bc = '#3c4f96';
    g.fillStyle = linGrad(g, 712, 0, 1208, 0, [shade(bc, -0.3), shade(bc, 0.12), shade(bc, 0.22), shade(bc, 0.08), shade(bc, -0.3)]); rr(g, 708, by, 504, 1036 - by, 18); g.fill();
    rr(g, 708, by, 504, 58, 18); g.fillStyle = '#c9cfe8'; g.fill();
    g.strokeStyle = alpha('#000', 0.14); g.lineWidth = 4; for (const fy of [560, 700, 860]) { g.beginPath(); g.moveTo(730, fy); g.quadraticCurveTo(960, fy + 30, 1190, fy - 6); g.stroke(); }
    if (o.arms !== false) for (const sx of [-1, 1]) {                                                       // arms resting on the covers
      const sh = [H.x + sx * 118, by + 30], el = [H.x + sx * 148, by + 170], hd = [H.x + sx * 132, by + 300];
      if (o.reach != null && sx === -1) { const k = clamp(o.reach); el[0] = lerp(el[0], 760, k); el[1] = lerp(el[1], 230, k); hd[0] = lerp(hd[0], o.handX ?? TD.phone.x, k); hd[1] = lerp(hd[1], o.handY ?? TD.phone.y, k); }
      seg(g, [sh, el, hd], 34, alpha(M.rim, 0.9)); seg(g, [sh, el, hd], 30, '#0a0c16');
    }
    if (o.phoneInHand) {                                                                                     // phone back + screen spill
      const [px, py] = o.phoneInHand, lit = o.phoneLit || 0;
      if (lit > 0) { glow(g, H.x, H.y, H.r * 3.2, '#8fd0ff', 0.55 * lit); glow(g, px, py, 160, '#8fd0ff', 0.6 * lit); }
      rr(g, px - 26, py - 46, 52, 92, 10); g.fillStyle = '#0c0e18'; g.fill();
      rr(g, px - 26, py - 46, 52, 92, 10); g.strokeStyle = alpha('#8fd0ff', 0.7 * lit); g.lineWidth = 3; g.stroke();
    }
    // moonlight through the window panes, falling across the bed from the right
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = alpha('#b8c6ff', 0.09); poly(g, [[1560, -120], [2020, -120], [1360, 1200], [900, 1200]], alpha('#b8c6ff', 0.09));
    g.restore();
    g.save(); g.globalAlpha = 0.18; poly(g, [[1772, -120], [1800, -120], [1140, 1200], [1112, 1200]], '#060814'); g.restore();
  });
  return { M };
}
