// shots/02_phone_dawn.js — s10–s13: the phone at 3am, 5am through the window, gives up and sits on the edge.
import { E, registerShot, layer, blurLayer, veil, ease, prog, lerp, key, seg } from '/engine/core.js';
import { drawFigure, breathe, posesAt } from '/engine/rig2d.js';
import { bedroom, moonlight, thrownBlanket, GY, HS, BX, BW, WIN } from '../sets/bedroom.js';
import { topDown, TD } from '../sets/topdown.js';
import { phoneScreen } from '../sets/props.js';
import { sleepBadge } from '../sets/badge.js';
import { HERO, F } from '../cast.js';
import { camAt, camLerp } from './01_night.js';

// s10 "Ты берёшь телефон —" — ceiling: the arm comes out from under the blanket, picks the phone off the nightstand,
// brings it up beside his face; the screen lights him blue. The phone never leaves the hand once it's picked up.
const GRAB = [TD.phone.x, TD.phone.y + 34];                       // hand position that holds the phone where it lies
registerShot('s10', { draw(g, t, info) {
  const cam = camLerp(camAt(780, 300, 1.62), camAt(810, 290, 1.74), ease.inOut(t / info.dur));
  const hand = key(t, [[0, [880, 470]], [0.42, GRAB], [0.52, GRAB], [0.95, [838, 262]]], ease.inOut);
  const held = t >= 0.47, lit = ease.out(prog(t, 0.72, 0.9));
  topDown(g, t, cam, { face: F.tired, look: key(t, [[0, [-0.8, 0]], [0.5, [-0.9, -0.2]], [0.95, [-0.7, -0.5]]]), hand, phoneHeld: held, phoneLit: lit });
  sleepBadge(g, info.globalT);
} });

// s11 "просто глянуть время." — insert on the lock screen: 03:12, and the 06:00 alarm notification
registerShot('s11', { draw(g, t, info) {
  blurLayer(g, 16, (g) => topDown(g, t, camAt(TD.head.x, TD.head.y + 40, 2.2), { face: F.tired }));
  veil(g, '#05060f', 0.55);
  const z = lerp(1, 1.06, ease.inOut(t / info.dur)), dx = Math.sin(t * 1.7) * 6, dy = Math.sin(t * 1.3 + 1) * 5;
  g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
  phoneScreen(g, t, E.W * 0.5 + dx, E.H * 0.5 + 30 + dy, { time: '03:12', noteAt: 0.45 });
  g.restore();
  sleepBadge(g, info.globalT);
} });

// s12 "Пять утра." — the window: sky starting to pale, the moon fading, two birds cross
registerShot('s12', { draw(g, t, info) {
  const k = ease.inOut(t / info.dur), dawn = lerp(0.5, 0.66, k);
  const cam = camLerp(camAt(WIN.x + WIN.w / 2 - 40, WIN.y + WIN.h / 2 - 10, 1.5), camAt(WIN.x + WIN.w / 2, WIN.y + WIN.h / 2 - 25, 1.62), k);
  bedroom(g, t, cam, { dawn, clockH: 5 });
  layer(g, cam, 0.75, (g) => {
    for (const [ox, oy, sp] of [[0, 0, 1], [60, 26, 0.92]]) {
      const bx = WIN.x - 40 + ox + t * 260 * sp, by = WIN.y + 150 + oy + Math.sin(t * 3 + ox) * 6, fl = Math.sin(t * 14 + ox) * 7;
      if (bx > WIN.x && bx < WIN.x + WIN.w) seg(g, [[bx - 14, by - fl], [bx, by], [bx + 14, by - fl]], 3.5, '#141838');
    }
  });
  moonlight(g, t, cam, { dawn });
  sleepBadge(g, info.globalT);
} });

// sitting on the foot end of the bed, in profile, facing the window: hip on the mattress, knees bent over the end,
// shins hanging down to the floor past the bed. The contact shadow is drawn under the FEET (the rig's default sits under the hip).
const SIT_SLUMP = { head: [18, -166], sh: [8, -140], hip: [0, -72], eF: [30, -104], hF: [46, -80], eB: [24, -102], hB: [40, -78], kF: [46, -72], fF: [50, 0], kB: [42, -70], fB: [40, 0] };
const SIT_HANDS = { head: [24, -158], sh: [10, -136], hip: [0, -72], eF: [44, -96], hF: [34, -150], eB: [38, -94], hB: [28, -146], kF: [46, -72], fF: [50, 0], kB: [42, -70], fB: [40, 0] };
export const SIT_X = BX + BW - 40;
export function sittingHero(g, M, t, o = {}) {
  const pose = breathe(posesAt(t, [[0, SIT_SLUMP], [o.handsAt ?? 99, SIT_HANDS]], 0.45), t, 0.6, 2);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(SIT_X + 46 * HS, GY + 2, 40 * HS * 0.6, 6 * HS, 0, 0, Math.PI * 2); g.fill();
  drawFigure(g, { x: SIT_X, y: GY, s: HS, facing: 1, outfit: HERO, pose, shadow: false, face: o.face || F.tired, blink: (t % 3.1) > 3.0, rim: { color: M.rim, dir: [1, -0.4] } });
}

// s13 "Будильник через час, а ты так и не уснул." — sits up on the edge, slumped; on "а ты так и не уснул" his head drops into his hands
registerShot('s13', { draw(g, t, info) {
  const cam = camLerp(camAt(SIT_X - 40, 650, 1.7), camAt(SIT_X - 30, 640, 1.84), ease.inOut(t / info.dur)), dawn = 0.62;
  const { M } = bedroom(g, t, cam, { dawn, clockH: 5 });
  layer(g, cam, 1, (g) => { thrownBlanket(g); sittingHero(g, M, t, { handsAt: 1.5 }); });
  moonlight(g, t, cam, { dawn });
  sleepBadge(g, info.globalT);
} });
