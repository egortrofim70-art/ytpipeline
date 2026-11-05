// shots/01_night.js — s01–s09: lies down, closes eyes, nothing happens, the hours start counting.
import { E, registerShot, layer, blurLayer, veil, ease, prog, lerp, key, shake } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { bedroom, lyingHero, moonlight, alarmClock, BX, MT, HEAD, CLOCK } from '../sets/bedroom.js';
import { topDown, TD } from '../sets/topdown.js';
import { sheepBubble } from '../sets/props.js';
import { sleepBadge } from '../sets/badge.js';
import { F } from '../cast.js';

export const camAt = (cx, cy, z, r = 0) => ({ z, x: cx - E.W / 2, y: cy - E.H / 2, r });
export const camLerp = (a, b, k) => ({ z: lerp(a.z, b.z, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), r: lerp(a.r || 0, b.r || 0, k) });
export const blinkAt = (t, per = 3.3) => (t % per) > per - 0.12;

// s01 "Представь: ты ложишься спать," — establishing, slow push toward the bed
registerShot('s01', { draw(g, t, info) {
  const k = ease.inOut(t / info.dur), cam = camLerp(camAt(1010, 600, 1.22), camAt(960, 620, 1.34), k);
  const { M } = bedroom(g, t, cam, { clockH: 23 });
  layer(g, cam, 1, (g) => lyingHero(g, M, { face: F.calm, blink: blinkAt(t + 1) }));
  moonlight(g, t, cam);
  sleepBadge(g, info.globalT);
} });

// s02 "закрываешь глаза" — ceiling close-up on the pillow; the lids come down on "глаза"
registerShot('s02', { draw(g, t, info) {
  const cam = camAt(TD.head.x, TD.head.y + 20, lerp(3.0, 3.25, ease.inOut(t / info.dur)), -0.03);
  topDown(g, t, cam, { face: F.calm, lid: lerp(0.3, 1, ease.inOut(prog(t, 0.45, 0.75))), look: [0, 0.2] });
  FX.dust(g, t, { count: 26, color: '#dfe6ff', a: 0.3, speed: 6 });
  sleepBadge(g, info.globalT);
} });

// s03 "— и ничего не происходит." — jump-in tighter; eyes snap wide open on "и" and search the room
registerShot('s03', { draw(g, t, info) {
  const open = t > 0.13, pop = open ? 1 - ease.out(prog(t, 0.13, 0.4)) : 0;
  const cam = camAt(TD.head.x, TD.head.y + 10, lerp(3.55, 3.7, ease.inOut(t / info.dur)) + pop * 0.08, 0.04);
  const look = key(t, [[0, [0, 0]], [0.5, [0, 0]], [0.62, [-1, 0.1]], [0.98, [-1, 0.1]], [1.1, [1, -0.1]], [1.45, [1, -0.1]], [1.58, [0, -0.8]]], ease.out);
  topDown(g, t, cam, { face: open ? F.awake : F.calm, lid: open ? 0 : 1, look });
  sleepBadge(g, info.globalT);
} });

// s04 "Проходит час." — insert: the alarm clock, hands sweep a whole hour; the counter appears on "час"
registerShot('s04', { draw(g, t, info) {
  const bc = camAt(CLOCK.x + 120, CLOCK.y + 40, 2.1);
  blurLayer(g, 10, (g) => { const { M } = bedroom(g, t, bc, { clockH: 23 }); layer(g, bc, 1, (g) => lyingHero(g, M, { face: F.awake })); });
  veil(g, '#070916', 0.38);
  const r = lerp(240, 262, ease.inOut(t / info.dur)), h = lerp(23, 24, ease.inOut(prog(t, 0, 0.6)));
  const [sx, sy] = t > 0.6 ? shake(t, 6 * (1 - prog(t, 0.6, 0.9)), 28) : [0, 0];
  alarmClock(g, E.W * 0.42 + sx, E.H * 0.54 + sy, r, h, { alarm: 6 });
  FX.dust(g, t, { count: 30, color: '#dfe6ff', a: 0.35, speed: 8 });
  sleepBadge(g, info.globalT);
} });

// s05 "Потом второй." — side medium: he slowly rolls over onto his side, away from us
registerShot('s05', { draw(g, t, info) {
  const k = ease.inOut(t / info.dur), cam = camLerp(camAt(BX + 230, MT - 60, 1.62), camAt(BX + 210, MT - 55, 1.72), k);
  const { M } = bedroom(g, t, cam, { clockH: 0.6 });
  layer(g, cam, 1, (g) => lyingHero(g, M, { face: F.tired, turn: ease.inOut(prog(t, 0.15, 0.85)), look: [0.3, 0] }));
  moonlight(g, t, cam);
  sleepBadge(g, info.globalT);
} });

// s06 "Ты ворочаешься," — closer: rolls back onto his back, then a restless half-turn and back again
registerShot('s06', { draw(g, t, info) {
  const cam = camLerp(camAt(BX + 190, MT - 55, 2.0, -0.012), camAt(BX + 180, MT - 50, 2.1, 0.014), ease.inOut(t / info.dur));
  const { M } = bedroom(g, t, cam, { clockH: 1.4 });
  const turn = key(t, [[0, 1], [0.45, 0], [0.7, 0], [0.88, 0.4], [1.08, 0]], ease.inOut);
  layer(g, cam, 1, (g) => lyingHero(g, M, { face: F.tired, turn, look: [lerp(-0.4, 0.4, ease.inOut(prog(t, 0.45, 1))), -0.3] }));
  moonlight(g, t, cam);
  sleepBadge(g, info.globalT);
} });

// s07 "считаешь овец," — he stares up; a thought bubble of sheep jumping a fence, the count rising
registerShot('s07', { draw(g, t, info) {
  const cam = camLerp(camAt(BX + 260, MT - 120, 1.6), camAt(BX + 300, MT - 170, 1.66), ease.inOut(t / info.dur));
  const { M } = bedroom(g, t, cam, { clockH: 1.8 });
  layer(g, cam, 1, (g) => {
    lyingHero(g, M, { face: F.tired, look: [1, 0.4] });
    const bx = HEAD.x + 290, by = HEAD.y - 230;
    g.save(); g.translate(bx, by); g.scale(1.08, 1.08); g.translate(-bx, -by);
    sheepBubble(g, t, bx, by, HEAD.x + 40, HEAD.y - 50, { period: 0.3, start: 1 }); g.restore();
  });
  moonlight(g, t, cam);
  sleepBadge(g, info.globalT);
} });

// s08 "смотришь в потолок." — from the ceiling: wide awake, staring straight into the lens; slow rotating push
registerShot('s08', { draw(g, t, info) {
  const k = ease.inOut(t / info.dur), cam = camLerp(camAt(960, 560, 1.0, -0.025), camAt(960, 500, 1.1, 0.025), k);
  topDown(g, t, cam, { face: F.awake, look: [0, 0], blink: blinkAt(t + 0.4, 2.9) });
  FX.dust(g, t, { count: 34, color: '#dfe6ff', a: 0.28, speed: 5 });
  sleepBadge(g, info.globalT);
} });

// s09 "Три часа ночи." — insert again, other side of frame: hands land on 3:00 exactly on "Три"
registerShot('s09', { draw(g, t, info) {
  const bc = camAt(CLOCK.x - 60, CLOCK.y + 60, 2.3);
  blurLayer(g, 12, (g) => { const { M } = bedroom(g, t, bc, { clockH: 3 }); layer(g, bc, 1, (g) => lyingHero(g, M, { face: F.awake })); });
  veil(g, '#070916', 0.42);
  const h = lerp(2.4, 3, ease.out(prog(t, 0, 0.12))), [sx, sy] = t > 0.12 ? shake(t, 7 * (1 - prog(t, 0.12, 0.45)), 30) : [0, 0];
  const r = lerp(255, 275, ease.inOut(t / info.dur));
  alarmClock(g, E.W * 0.6 + sx, E.H * 0.55 + sy, r, h, { alarm: 6 });
  FX.dust(g, t, { count: 30, color: '#dfe6ff', a: 0.35, speed: 8, seed: 7 });
  sleepBadge(g, info.globalT);
} });
