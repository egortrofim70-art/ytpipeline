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
    if (!o.phoneHeld) { rr(g, TD.phone.x - 28, TD.phone.y - 48, 56, 96, 10); g.fillStyle = '#0c0e18'; g.fill(); }
    // bed
    rr(g, 680, 96, 560, 40, 12); g.fillStyle = '#2e2548'; g.fill();                                         // headboard
    rr(g, 690, 120, 540, 930, 18); g.fillStyle = '#2a2244'; g.fill();
    rr(g, 704, 134, 512, 900, 16); g.fillStyle = '#aab1d6'; g.fill();                                       // mattress
    rr(g, 770, 160 + br * 2, 380, 150, 46); g.fillStyle = '#dde0f2'; g.fill();                              // pillow
    rr(g, 800, 178, 320, 18, 9); g.fillStyle = alpha('#fff', 0.35); g.fill();
    // covered up to the chin: just a yellow collar under the head on the pillow
    g.fillStyle = o.shirt || '#ffd400'; g.beginPath(); g.ellipse(H.x, H.y + H.r * 0.98, 64, 24, 0, 0, Math.PI * 2); g.fill();
    circle(g, H.x + H.r * 0.07, H.y, H.r * 1.04, M.rim); circle(g, H.x, H.y, H.r, '#0a0c16');
    face(g, H.x, H.y, H.r, { look: o.look, blink: o.blink, override: o.face, front: true, lid: o.lid });
    // blanket, lighter along the body ridge; its folded top edge is the same fabric, a shade lighter
    const by = H.y + H.r * 1.02 + br * 3, bc = '#3c4f96';
    g.fillStyle = linGrad(g, 712, 0, 1208, 0, [shade(bc, -0.3), shade(bc, 0.12), shade(bc, 0.22), shade(bc, 0.08), shade(bc, -0.3)]); rr(g, 708, by, 504, 1036 - by, 18); g.fill();
    rr(g, 708, by, 504, 46, 18); g.fillStyle = shade(bc, 0.32); g.fill();
    g.strokeStyle = alpha('#000', 0.14); g.lineWidth = 4; for (const fy of [560, 700, 860]) { g.beginPath(); g.moveTo(730, fy); g.quadraticCurveTo(960, fy + 30, 1190, fy - 6); g.stroke(); }
    if (o.hand) {                                                   // one arm out from under the blanket edge (2-bone IK, elbow bends outward)
      const S = [H.x - 104, by + 14], Hd = o.hand, L = 166, lit = o.phoneLit || 0;
      const dx = Hd[0] - S[0], dy = Hd[1] - S[1], d = Math.min(Math.hypot(dx, dy), 2 * L - 1), ux = dx / (d || 1), uy = dy / (d || 1);
      const hh = Math.sqrt(L * L - (d / 2) ** 2), mx = S[0] + ux * d / 2, my = S[1] + uy * d / 2;
      const c1 = [mx - uy * hh, my + ux * hh], c2 = [mx + uy * hh, my - ux * hh], E = c1[0] < c2[0] ? c1 : c2;
      if (lit > 0) { glow(g, H.x, H.y, H.r * 3.2, '#8fd0ff', 0.55 * lit); glow(g, Hd[0], Hd[1] - 30, 170, '#8fd0ff', 0.6 * lit); }
      if (o.phoneHeld) { rr(g, Hd[0] - 28, Hd[1] - 82, 56, 96, 10); g.fillStyle = '#0c0e18'; g.fill(); rr(g, Hd[0] - 28, Hd[1] - 82, 56, 96, 10); g.strokeStyle = alpha('#8fd0ff', 0.75 * lit); g.lineWidth = 3; g.stroke(); }
      seg(g, [S, E, Hd], 34, alpha(M.rim, 0.9)); seg(g, [S, E, Hd], 30, '#0a0c16');
      seg(g, [S, [lerp(S[0], E[0], 0.38), lerp(S[1], E[1], 0.38)]], 42, o.shirt || '#ffd400');                 // short sleeve
      circle(g, Hd[0], Hd[1], 20, '#0a0c16');
    }
    // moonlight through the window panes, falling across the bed from the right
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = alpha('#b8c6ff', 0.09); poly(g, [[1560, -120], [2020, -120], [1360, 1200], [900, 1200]], alpha('#b8c6ff', 0.09));
    g.restore();
    g.save(); g.globalAlpha = 0.18; poly(g, [[1772, -120], [1800, -120], [1140, 1200], [1112, 1200]], '#060814'); g.restore();
  });
  return { M };
}
