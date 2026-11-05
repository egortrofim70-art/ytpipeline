// shots/02_phone_dawn.js — s10–s13: the phone at 3am, 5am through the window, gives up and sits on the edge.
import { E, registerShot, layer, blurLayer, veil, ease, prog, lerp, clamp, seg } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { drawFigure, POSES, breathe, posesAt as rigPosesAt } from '/engine/rig2d.js';
import { bedroom, moonlight, alarmClock, GY, HS, BX, BW, MT, WIN } from '../sets/bedroom.js';
import { topDown, TD } from '../sets/topdown.js';
import { phoneScreen } from '../sets/props.js';
import { sleepBadge } from '../sets/badge.js';
import { HERO, F } from '../cast.js';
import { camAt, camLerp } from './01_night.js';

// s10 "Ты берёшь телефон —" — ceiling, medium: the hand reaches to the nightstand, the screen lights his face
registerShot('s10', { draw(g, t, info) {
  const cam = camLerp(camAt(790, 280, 1.7), camAt(830, 270, 1.82), ease.inOut(t / info.dur));
  const reach = ease.inOut(prog(t, 0, 0.45)), lift = ease.inOut(prog(t, 0.45, 0.85));
  const inHand = t > 0.45, px = lerp(TD.phone.x, 830, lift), py = lerp(TD.phone.y, 250, lift);
  topDown(g, t, cam, { face: F.tired, look: [lerp(-0.6, -0.2, lift), -0.3], reach: reach * (1 - lift * 0.35), handX: px, handY: py,
    phoneInHand: inHand ? [px, py] : null, phoneLit: ease.out(prog(t, 0.7, 0.85)) });
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

const HUNCH = { ...POSES.sit, head: [16, -166], sh: [6, -140], eF: [30, -104], hF: [46, -84], eB: [22, -104], hB: [40, -82] };
const PALM = { ...POSES.sit, head: [14, -164], sh: [6, -140], eF: [34, -116], hF: [26, -158], eB: [26, -112], hB: [20, -154] };
export function sittingHero(g, M, t, o = {}) {
  const pose = breathe(rigPosesAt(t, [[0, HUNCH], [o.palmAt ?? 99, PALM]], 0.4), t, 0.6, 2);
  drawFigure(g, { x: BX + BW - 64, y: GY, s: HS, facing: 1, outfit: HERO, pose, face: o.face || F.tired, blink: (t % 3.1) > 3.0, rim: { color: M.rim, dir: [1, -0.35] } });
}
export function pushedBlanket(g) {
  const bc = '#3c4f96';
  for (const [x, y, w, h] of [[BX + 120, MT - 34, 220, 70], [BX + 260, MT - 22, 170, 60], [BX + 360, MT - 12, 110, 50]]) {
    g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); g.fillStyle = bc; g.fill();
  }
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; for (const fx of [BX + 200, BX + 300, BX + 390]) { g.beginPath(); g.moveTo(fx, MT - 26); g.quadraticCurveTo(fx + 20, MT, fx + 6, MT + 22); g.stroke(); }
}

// s13 "Будильник через час, а ты так и не уснул." — sitting on the edge, alarm clock big and soft in the foreground
registerShot('s13', { draw(g, t, info) {
  const cam = camLerp(camAt(1110, 680, 1.75), camAt(1125, 670, 1.88), ease.inOut(t / info.dur)), dawn = 0.62;
  const { M } = bedroom(g, t, cam, { dawn, clockH: 5 });
  layer(g, cam, 1, (g) => { pushedBlanket(g); sittingHero(g, M, t, { palmAt: 1.5 }); });
  moonlight(g, t, cam, { dawn });
  blurLayer(g, 9, (g) => alarmClock(g, 880, 770, 130, 5 + t / 3600 * 60, { alarm: 6 }), cam, 1.6);
  sleepBadge(g, info.globalT);
} });
