// shots/04_week.js — s17–s22: the week. Each counter step gets its own line, its own place and a worse face.
import { E, registerShot, layer, blurLayer, veil, ease, prog, lerp, key, clamp, shake } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { drawFigure, POSES, breathe, posesAt, walkPose, bigFace } from '/engine/rig2d.js';
import { GY, HS } from '../sets/bedroom.js';
import { kitchen, desk, laptopScreen, street, bathroom } from '../sets/week.js';
import { sleepBadge } from '../sets/badge.js';
import { HERO, F } from '../cast.js';
import { camAt, camLerp } from './01_night.js';

// s17 "Первый день ты ещё держишься." — kitchen, morning sun: mug in hand, a sip on "держишься"
const HOLD = { ...POSES.holdFront, eB: [-6, -134], hB: [-8, -100] };
const SIP = { ...HOLD, eF: [26, -150], hF: [16, -192] };
registerShot('s17', { draw(g, t, info) {
  const cam = camLerp(camAt(1040, 640, 1.55), camAt(1020, 630, 1.66), ease.inOut(t / info.dur));
  const { rim, rimDir } = kitchen(g, t, cam);
  layer(g, cam, 1, (g) => drawFigure(g, { x: 1080, y: GY, s: HS, facing: -1, outfit: HERO, prop: 'cup',
    pose: breathe(posesAt(t, [[0, HOLD], [0.95, SIP], [1.5, HOLD]], 0.3), t, 0.7), face: F.day1, blink: (t % 2.6) > 2.5, rim: { color: rim, dir: rimDir } }));
  sleepBadge(g, info.globalT);
} });

// s18 "На третий —" — the desk at night: typing, head getting heavy, laptop glow on his face
const TYPE = { ...POSES.sit, head: [14, -176], sh: [6, -144], eF: [34, -114], hF: [66, -106], eB: [28, -112], hB: [60, -104] };
registerShot('s18', { draw(g, t, info) {
  const cam = camLerp(camAt(1010, 650, 1.6), camAt(1030, 640, 1.7), ease.inOut(t / info.dur));
  const { rim, rimDir } = desk(g, t, cam);
  const tap = Math.sin(t * 26), nod = 0.5 + 0.5 * Math.sin(t * 2.4);
  const pose = { ...TYPE, hF: [TYPE.hF[0], TYPE.hF[1] + Math.max(0, tap) * 4], hB: [TYPE.hB[0], TYPE.hB[1] + Math.max(0, -tap) * 4], head: [TYPE.head[0] + nod * 4, TYPE.head[1] + nod * 8] };
  layer(g, cam, 1, (g) => {
    FX.chair(g, 900, GY, HS * 1.03, '#1e1a22');
    drawFigure(g, { x: 920, y: GY, s: HS, facing: 1, outfit: HERO, pose: breathe(pose, t, 0.4), face: { ...F.day3, lid: lerp(0.45, 0.62, nod) }, look: [0.6, 0.3], rim: { color: rim, dir: rimDir } });
  });
  sleepBadge(g, info.globalT);
} });

// s19 "путаешь слова." — insert: the message he's typing, two words swapped, flagged in red
registerShot('s19', { draw(g, t, info) {
  blurLayer(g, 14, (g) => desk(g, t, camAt(1080, 600, 2.0)));
  veil(g, '#05080c', 0.45);
  const z = lerp(1, 1.05, ease.inOut(t / info.dur));
  g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
  laptopScreen(g, t, E.W / 2, E.H / 2 + 20);
  g.restore();
  sleepBadge(g, info.globalT);
} });

// s20 "На пятый — засыпаешь на ходу," — the street: walking, slowing down, head dropping, eyes closing
registerShot('s20', { draw(g, t, info) {
  const slow = (tt) => tt - 0.16 * tt * tt;                       // walk distance with slowing pace
  const hx = 700 + 267 * slow(t), droop = ease.inOut(prog(t, 0.5, 1.6));
  const cam = camAt(hx + 90, 640, 1.5);
  const { rim, rimDir } = street(g, t, cam);
  const p = walkPose(slow(t) * Math.PI * 2 * 0.9);
  const pose = { ...p, head: [p.head[0] + droop * 14, p.head[1] + droop * 16], sh: [p.sh[0] + droop * 6, p.sh[1] + droop * 4] };
  layer(g, cam, 1, (g) => drawFigure(g, { x: hx, y: GY - 80, s: HS, facing: 1, outfit: HERO, pose, rot: droop * 0.06, face: { ...F.day5, lid: lerp(0.55, 1, droop) }, look: [0, 0.6], rim: { color: rim, dir: rimDir } }));
  sleepBadge(g, info.globalT);
} });

// s21 "но уснуть не можешь." — close-up: his head nods… and on "но" the eyes jolt wide open; the lids creep back down
registerShot('s21', { draw(g, t, info) {
  blurLayer(g, 14, (g) => street(g, t, camAt(1500, 560, 1.4)));
  veil(g, '#0a0c16', 0.3);
  const jolt = t > 0.12, j = jolt ? 1 - ease.out(prog(t, 0.12, 0.5)) : 0;
  const [sx, sy] = jolt ? shake(t, 12 * j, 30) : [0, 0];
  const tilt = jolt ? lerp(0.28, 0, ease.out(prog(t, 0.12, 0.3))) : 0.28;
  const lid = jolt ? lerp(0, 0.5, ease.inOut(prog(t, 0.6, info.dur))) : 1;
  const r = lerp(300, 330, ease.inOut(t / info.dur));
  bigFace(g, E.W * 0.5 + sx, E.H * 0.6 + sy + (jolt ? 0 : 30), r, { outfit: HERO, tilt, face: { ...(jolt ? F.fear : F.day5), lid, bags: 0.8 },
    look: key(t, [[0, [0, 0.6]], [0.14, [0, 0]], [0.7, [0, 0]], [0.85, [-0.8, 0]], [1.1, [0.8, 0]], [1.3, [0, 0]]], ease.out), rimColor: '#ffffff', rimSide: -1 });
  if (jolt) FX.rings(g, E.W * 0.5, E.H * 0.5, t - 0.12, { count: 2, r0: 260, r1: 700, speed: 1.6, color: '#ffffff', a: 0.35 * j });
  sleepBadge(g, info.globalT);
} });

// s22 "А через неделю…" — bathroom mirror: the reflection, pinpoint pupils, deep bags; the bar light flickers
registerShot('s22', { draw(g, t, info) {
  const k = ease.inOut(t / info.dur), cam = camLerp(camAt(960, 500, 1.0), camAt(960, 470, 1.2), k);
  const flicker = (t > 0.92 && t < 0.99) || (t > 1.55 && t < 1.6) || (t > 1.66 && t < 1.74) ? 0.15 : 1;
  const [sx, sy] = shake(t, 1.6, 9);
  bathroom(g, t, cam, { flicker, reflection: (g) => {
    bigFace(g, 960 + sx, 560 + sy, 232, { outfit: HERO, face: F.day7, look: key(t, [[0, [0, 0]], [0.9, [0, 0]], [1.05, [0.3, 0.2]], [1.6, [0, 0]]], ease.out), rimColor: '#e6f4ff', rimSide: 1 });
    g.fillStyle = `rgba(0,0,0,${0.55 * (1 - flicker)})`; g.fillRect(584, 154, 752, 652);
  } });
  g.fillStyle = `rgba(0,0,0,${0.45 * (1 - flicker)})`; g.fillRect(0, 0, E.W, E.H);
  sleepBadge(g, info.globalT);
} });
