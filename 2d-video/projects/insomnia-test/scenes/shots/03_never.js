// shots/03_never.js — s14–s16: looks up at us, the night swallows the dawn, "Никогда".
import { E, registerShot, layer, blurLayer, veil, ease, prog, lerp, mood, shake } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { bigFace } from '/engine/rig2d.js';
import { bedroom, moonlight, thrownBlanket } from '../sets/bedroom.js';
import { sleepBadge } from '../sets/badge.js';
import { HERO, F } from '../cast.js';
import { camAt, camLerp } from './01_night.js';
import { sittingHero } from './02_phone_dawn.js';

export const roomBg = (g, t, dawn, cam) => blurLayer(g, 14, (g) => bedroom(g, t, cam, { dawn, clockH: 5 }));

// s14 "А теперь представь," — he lifts his head out of his hands and looks straight at us
registerShot('s14', { draw(g, t, info) {
  const M = mood('night');
  roomBg(g, t, 0.6, camAt(1200, 520, 1.5)); veil(g, '#070916', 0.4);
  const lift = ease.out(prog(t, 0, 0.5)), r = lerp(300, 322, ease.inOut(t / info.dur));
  bigFace(g, E.W * 0.47, lerp(E.H * 0.74, E.H * 0.6, lift), r, { outfit: HERO, face: { ...F.tired, lid: lerp(0.6, 0.3, lift) }, look: [0, lerp(0.8, 0, lift)], rimColor: M.rim, rimSide: 1, blink: t > 0.85 && t < 0.97 });
  FX.dust(g, t, { count: 24, color: '#dfe6ff', a: 0.25, speed: 6 });
  sleepBadge(g, info.globalT);
} });

// s15 "что эта ночь не закончится." — slow pull-out; the dawn drains back into deep night
registerShot('s15', { draw(g, t, info) {
  const k = ease.inOut(t / info.dur), dawn = lerp(0.6, 0, ease.inOut(prog(t, 0.1, info.dur - 0.2)));
  const cam = camLerp(camAt(1080, 640, 1.32), camAt(990, 560, 0.95, -0.02), k);
  const { M } = bedroom(g, t, cam, { dawn, clockH: 5 });
  layer(g, cam, 1, (g) => { thrownBlanket(g); sittingHero(g, M, t, { face: F.sad }); });
  moonlight(g, t, cam, { dawn });
  sleepBadge(g, info.globalT);
} });

// s16 "Никогда." — flash in, crash zoom on the eyes, rings, cold tint
registerShot('s16', { draw(g, t, info) {
  const M = mood('night');
  roomBg(g, t, 0, camAt(900, 500, 1.4)); veil(g, '#04050c', 0.6);
  const r = lerp(470, 600, ease.out(prog(t, 0, 0.28))) + t * 20, [sx, sy] = shake(t, 10 * (1 - prog(t, 0, 0.5)), 32);
  const cx = E.W / 2 + sx, cy = E.H * 0.45 + 0.16 * r + sy;
  bigFace(g, cx, cy, r, { outfit: HERO, face: F.fear, look: [0, 0], rimColor: M.rim, rimSide: 1 });
  FX.rings(g, cx, E.H * 0.45, t, { count: 3, r0: 200, r1: 900, speed: 1.2, color: '#cfe0ff', a: 0.35 });
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(80,120,255,.35)'; g.fillRect(0, 0, E.W, E.H); g.restore();
  sleepBadge(g, info.globalT);
} });
