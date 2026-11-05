// _tpl_night.js — bedroom / night templates (the hook and every later callback to the bed).
// A template is (g, t, info); its knobs come from shots.json → params (merged into info).
import { E, layer, blurLayer, veil, ease, prog, lerp, key, shake, seg, mood } from '/engine/core.js';
import * as FX from '/engine/fx2d.js';
import { drawFigure, POSES, breathe, posesAt, walkPose, bigFace } from '/engine/rig2d.js';
import { bedroom, lyingHero, thrownBlanket, moonlight, alarmClock, GY, HS, BX, BW, MT, HEAD, CLOCK, WIN } from '../sets/bedroom.js';
import { topDown, TD } from '../sets/topdown.js';
import { sheepBubble, phoneScreen } from '../sets/props.js';
import { kitchen, desk, laptopScreen, street, bathroom } from '../sets/week.js';
import { HERO, F } from '../cast.js';

export const camAt = (cx, cy, z, r = 0) => ({ z, x: cx - E.W / 2, y: cy - E.H / 2, r });
export const camLerp = (a, b, k) => ({ z: lerp(a.z, b.z, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), r: lerp(a.r || 0, b.r || 0, k) });
export const blinkAt = (t, per = 3.3) => (t % per) > per - 0.12;
const face = (n) => (typeof n === 'string' ? F[n] : n) || F.tired;
const K = (info, t) => ease.inOut(t / info.dur);

// ---- sitting on the foot end of the bed, in profile (shadow under the feet, not the hip)
const SIT_SLUMP = { head: [18, -166], sh: [8, -140], hip: [0, -72], eF: [30, -104], hF: [46, -80], eB: [24, -102], hB: [40, -78], kF: [46, -72], fF: [50, 0], kB: [42, -70], fB: [40, 0] };
const SIT_HANDS = { head: [24, -158], sh: [10, -136], hip: [0, -72], eF: [44, -96], hF: [34, -150], eB: [38, -94], hB: [28, -146], kF: [46, -72], fF: [50, 0], kB: [42, -70], fB: [40, 0] };
export const SIT_X = BX + BW - 40;
export function sittingHero(g, M, t, o = {}) {
  const pose = breathe(posesAt(t, [[0, SIT_SLUMP], [o.handsAt ?? 99, SIT_HANDS]], 0.45), t, 0.6, 2);
  g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(SIT_X + 46 * HS, GY + 2, 40 * HS * 0.6, 6 * HS, 0, 0, Math.PI * 2); g.fill();
  drawFigure(g, { x: SIT_X, y: GY, s: HS, facing: 1, outfit: o.outfit || HERO, pose, shadow: false, face: face(o.face), blink: (t % 3.1) > 3.0, rim: { color: M.rim, dir: [1, -0.4] } });
}

export const NIGHT = {
  // extreme close-up from the ceiling: eyes in the dark snap open on `openAt`
  eyesOpen(g, t, info) {
    const at = info.openAt ?? 0.15, open = t > at, pop = open ? 1 - ease.out(prog(t, at, at + 0.3)) : 0;
    const cam = camAt(TD.head.x, TD.head.y - 10, lerp(5.6, 5.9, K(info, t)) + pop * 0.25, 0.05);
    topDown(g, t, cam, { face: open ? F.awake : F.calm, lid: open ? 0 : 1, look: key(t, [[0, [0, 0]], [at + 0.35, [0, 0]], [at + 0.5, [-1, 0]], [at + 0.85, [1, 0]], [at + 1.2, [0, 0]]], ease.out) });
    veil(g, '#04050c', 0.25 * (1 - ease.out(prog(t, at, at + 0.4))));
  },
  bedWide(g, t, info) {
    const a = info.from || [1010, 600, 1.22], b = info.to || [960, 620, 1.34], cam = camLerp(camAt(...a), camAt(...b), K(info, t));
    const { M } = bedroom(g, t, cam, { clockH: info.clockH ?? 23, dawn: info.dawn || 0 });
    layer(g, cam, 1, (g) => lyingHero(g, M, { face: face(info.face || 'calm'), turn: info.turn || 0, blink: blinkAt(t + 1), collar: info.collar }));
    moonlight(g, t, cam, { dawn: info.dawn || 0 });
  },
  pillowClose(g, t, info) {     // ceiling close-up on the pillow; lids close on `closeAt`, or snap open on `openAt` and search
    const z0 = info.z || 3.0, r = info.roll ?? -0.03;
    if (info.closeAt != null) {
      const cam = camAt(TD.head.x, TD.head.y + 20, lerp(z0, z0 + 0.25, K(info, t)), r);
      topDown(g, t, cam, { face: F.calm, lid: lerp(0.3, 1, ease.inOut(prog(t, info.closeAt - 0.15, info.closeAt + 0.15))), look: [0, 0.2] });
    } else {
      const at = info.openAt ?? 0.13, open = t > at, pop = open ? 1 - ease.out(prog(t, at, at + 0.3)) : 0;
      const cam = camAt(TD.head.x, TD.head.y + 10, lerp(z0, z0 + 0.15, K(info, t)) + pop * 0.08, r);
      const look = key(t, [[0, [0, 0]], [at + 0.4, [0, 0]], [at + 0.5, [-1, 0.1]], [at + 0.85, [-1, 0.1]], [at + 0.97, [1, -0.1]], [at + 1.3, [1, -0.1]], [at + 1.45, [0, -0.8]]], ease.out);
      topDown(g, t, cam, { face: open ? F.awake : F.calm, lid: open ? 0 : 1, look });
    }
    FX.dust(g, t, { count: 26, color: '#dfe6ff', a: 0.3, speed: 6 });
  },
  clockInsert(g, t, info) {      // the alarm clock big; hands sweep hFrom→hTo and land on `landAt` with a jolt
    const right = info.side === 'right', bc = camAt(CLOCK.x + (right ? -60 : 120), CLOCK.y + (right ? 60 : 40), right ? 2.3 : 2.1);
    blurLayer(g, 11, (g) => { const { M } = bedroom(g, t, bc, { clockH: info.hTo ?? 0, dawn: info.dawn || 0 }); layer(g, bc, 1, (g) => lyingHero(g, M, { face: F.awake })); });
    veil(g, '#070916', 0.4);
    const land = info.landAt ?? 0.6, h = lerp(info.hFrom ?? 23, info.hTo ?? 24, ease.inOut(prog(t, 0, land)));
    const [sx, sy] = t > land ? shake(t, 7 * (1 - prog(t, land, land + 0.3)), 28) : [0, 0];
    alarmClock(g, E.W * (right ? 0.6 : 0.42) + sx, E.H * 0.54 + sy, lerp(245, 268, K(info, t)), h, { alarm: 6 });
    FX.dust(g, t, { count: 30, color: '#dfe6ff', a: 0.35, speed: 8 });
  },
  bedSide(g, t, info) {          // side medium of the lying hero; `turn` keyframes roll him away from camera and back
    const z = info.z || 1.62, cam = camLerp(camAt(BX + 230, MT - 60, z, info.roll0 || 0), camAt(BX + 210, MT - 55, z + 0.1, info.roll1 || 0), K(info, t));
    const { M } = bedroom(g, t, cam, { clockH: info.clockH ?? 1, dawn: info.dawn || 0 });
    const turn = info.turnKeys ? key(t, info.turnKeys, ease.inOut) : info.turn || 0;
    layer(g, cam, 1, (g) => lyingHero(g, M, { face: face(info.face), turn, look: info.look || [0.3, -0.2], collar: info.collar }));
    moonlight(g, t, cam, { dawn: info.dawn || 0 });
  },
  sheep(g, t, info) {
    const cam = camLerp(camAt(BX + 260, MT - 120, 1.6), camAt(BX + 300, MT - 170, 1.66), K(info, t));
    const { M } = bedroom(g, t, cam, { clockH: 1.8 });
    layer(g, cam, 1, (g) => {
      lyingHero(g, M, { face: F.tired, look: [1, 0.4] });
      const bx = HEAD.x + 290, by = HEAD.y - 230; g.save(); g.translate(bx, by); g.scale(1.08, 1.08); g.translate(-bx, -by);
      sheepBubble(g, t, bx, by, HEAD.x + 40, HEAD.y - 50, { period: 0.3, start: 1 }); g.restore();
    });
    moonlight(g, t, cam);
  },
  ceilingWide(g, t, info) {
    const cam = camLerp(camAt(960, 560, 1.0, -0.025), camAt(960, 500, 1.1, 0.025), K(info, t));
    topDown(g, t, cam, { face: face(info.face || 'awake'), look: [0, 0], blink: blinkAt(t + 0.4, 2.9) });
    FX.dust(g, t, { count: 34, color: '#dfe6ff', a: 0.28, speed: 5 });
  },
  phoneGrab(g, t, info) {        // arm out from under the blanket → phone off the nightstand → beside his face; screen lights him
    const cam = camLerp(camAt(790, 300, 1.62), camAt(815, 290, 1.74), K(info, t));
    const grab = [TD.phone.x, TD.phone.y + 34], d = info.dur;
    // 1) arm resting along his side on the blanket  2) almost straight out to the nightstand  3) elbow down on the mattress, phone up by his face
    const hand = key(t, [[0, [890, 525]], [d * 0.38, grab], [d * 0.47, grab], [d * 0.9, [842, 236]]], ease.inOut);
    const elbow = key(t, [[0, [872, 440]], [d * 0.38, [730, 330]], [d * 0.47, [730, 330]], [d * 0.9, [792, 402]]], ease.inOut);
    topDown(g, t, cam, { face: F.tired, look: key(t, [[0, [-0.8, 0]], [d * 0.45, [-0.9, -0.2]], [d * 0.9, [-0.7, -0.6]]]), hand, elbow, phoneHeld: t >= d * 0.43, phoneLit: ease.out(prog(t, d * 0.62, d * 0.8)) });
  },
  phoneScreen(g, t, info) {
    blurLayer(g, 16, (g) => topDown(g, t, camAt(TD.head.x, TD.head.y + 40, 2.2), { face: F.tired }));
    veil(g, '#05060f', 0.55);
    const z = lerp(1, 1.06, K(info, t)), dx = Math.sin(t * 1.7) * 6, dy = Math.sin(t * 1.3 + 1) * 5;
    g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
    phoneScreen(g, t, E.W * 0.5 + dx, E.H * 0.5 + 30 + dy, { time: info.time || '03:12', noteAt: info.noteAt ?? 0.45 });
    g.restore();
  },
  windowDawn(g, t, info) {
    const k = K(info, t), dawn = lerp(info.dawn0 ?? 0.5, info.dawn1 ?? 0.66, k);
    const cam = camLerp(camAt(WIN.x + WIN.w / 2 - 40, WIN.y + WIN.h / 2 - 10, 1.5), camAt(WIN.x + WIN.w / 2, WIN.y + WIN.h / 2 - 25, 1.62), k);
    bedroom(g, t, cam, { dawn, clockH: 5 });
    layer(g, cam, 0.75, (g) => {
      for (const [ox, oy, sp] of [[0, 0, 1], [60, 26, 0.92]]) {
        const bx = WIN.x - 40 + ox + t * 260 * sp, by = WIN.y + 150 + oy + Math.sin(t * 3 + ox) * 6, fl = Math.sin(t * 14 + ox) * 7;
        if (bx > WIN.x && bx < WIN.x + WIN.w) seg(g, [[bx - 14, by - fl], [bx, by], [bx + 14, by - fl]], 3.5, '#141838');
      }
    });
    moonlight(g, t, cam, { dawn });
  },
  sitEdge(g, t, info) {
    const a = info.from || [SIT_X - 40, 650, 1.7], b = info.to || [SIT_X - 30, 640, 1.84], dawn = info.dawn ?? 0.62;
    const cam = camLerp(camAt(...a), camAt(...b), K(info, t));
    const { M } = bedroom(g, t, cam, { dawn, clockH: 5 });
    layer(g, cam, 1, (g) => { thrownBlanket(g); sittingHero(g, M, t, { handsAt: info.handsAt, face: info.face }); });
    moonlight(g, t, cam, { dawn });
  },
  pullOut(g, t, info) {          // slow pull-out from the sitting hero; dawn drains back into night
    const dawn = lerp(info.dawn0 ?? 0.6, info.dawn1 ?? 0, ease.inOut(prog(t, 0.1, info.dur - 0.2)));
    const cam = camLerp(camAt(1080, 640, 1.32), camAt(990, 560, 0.95, -0.02), K(info, t));
    const { M } = bedroom(g, t, cam, { dawn, clockH: 5 });
    layer(g, cam, 1, (g) => { thrownBlanket(g); sittingHero(g, M, t, { face: info.face || 'sad' }); });
    moonlight(g, t, cam, { dawn });
  },
  faceLift(g, t, info) {         // big face: lifts his head out of his hands and looks at us
    const M = mood('night');
    blurLayer(g, 14, (g) => bedroom(g, t, camAt(1200, 520, 1.5), { dawn: info.dawn ?? 0.6, clockH: 5 })); veil(g, '#070916', 0.4);
    const lift = ease.out(prog(t, 0, 0.5)), r = lerp(300, 322, K(info, t));
    bigFace(g, E.W * 0.47, lerp(E.H * 0.74, E.H * 0.6, lift), r, { outfit: HERO, face: { ...face(info.face || 'tired'), lid: lerp(0.6, 0.3, lift) }, look: [0, lerp(0.8, 0, lift)], rimColor: M.rim, rimSide: 1, blink: t > 0.85 && t < 0.97 });
    FX.dust(g, t, { count: 24, color: '#dfe6ff', a: 0.25, speed: 6 });
  },
  crashEyes(g, t, info) {        // flash in, crash zoom on the eyes, rings, cold tint
    const M = mood('night');
    blurLayer(g, 14, (g) => bedroom(g, t, camAt(900, 500, 1.4), { dawn: 0, clockH: 5 })); veil(g, '#04050c', 0.6);
    const r = lerp(470, 600, ease.out(prog(t, 0, 0.28))) + t * 20, [sx, sy] = shake(t, 10 * (1 - prog(t, 0, 0.5)), 32);
    const cx = E.W / 2 + sx, cy = E.H * 0.45 + 0.16 * r + sy;
    bigFace(g, cx, cy, r, { outfit: info.outfit || HERO, face: face(info.face || 'fear'), look: [0, 0], rimColor: M.rim, rimSide: 1 });
    FX.rings(g, cx, E.H * 0.45, t, { count: 3, r0: 200, r1: 900, speed: 1.2, color: '#cfe0ff', a: 0.35 });
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(80,120,255,.35)'; g.fillRect(0, 0, E.W, E.H); g.restore();
  },
  kitchenSip(g, t, info) {
    const HOLD = { ...POSES.holdFront, eB: [-6, -134], hB: [-8, -100] }, SIP = { ...HOLD, eF: [26, -150], hF: [16, -192] };
    const cam = camLerp(camAt(1040, 640, 1.55), camAt(1020, 630, 1.66), K(info, t));
    const { rim, rimDir } = kitchen(g, t, cam), sa = info.sipAt ?? 0.9;
    layer(g, cam, 1, (g) => drawFigure(g, { x: 1080, y: GY, s: HS, facing: -1, outfit: HERO, prop: 'cup',
      pose: breathe(posesAt(t, [[0, HOLD], [sa, SIP], [sa + 0.55, HOLD]], 0.3), t, 0.7), face: face(info.face || 'day1'), blink: (t % 2.6) > 2.5, rim: { color: rim, dir: rimDir } }));
  },
  deskType(g, t, info) {
    const TYPE = { ...POSES.sit, head: [14, -176], sh: [6, -144], eF: [34, -114], hF: [66, -106], eB: [28, -112], hB: [60, -104] };
    const cam = camLerp(camAt(1010, 650, 1.6), camAt(1030, 640, 1.7), K(info, t));
    const { rim, rimDir } = desk(g, t, cam), tap = Math.sin(t * 26), nod = 0.5 + 0.5 * Math.sin(t * 2.4);
    const pose = { ...TYPE, hF: [TYPE.hF[0], TYPE.hF[1] + Math.max(0, tap) * 4], hB: [TYPE.hB[0], TYPE.hB[1] + Math.max(0, -tap) * 4], head: [TYPE.head[0] + nod * 4, TYPE.head[1] + nod * 8] };
    layer(g, cam, 1, (g) => { FX.chair(g, 900, GY, HS * 1.03, '#1e1a22');
      drawFigure(g, { x: 920, y: GY, s: HS, facing: 1, outfit: HERO, pose: breathe(pose, t, 0.4), face: { ...face(info.face || 'day3'), lid: lerp(0.45, 0.62, nod) }, look: [0.6, 0.3], rim: { color: rim, dir: rimDir } }); });
  },
  laptop(g, t, info) {
    blurLayer(g, 14, (g) => desk(g, t, camAt(1080, 600, 2.0))); veil(g, '#05080c', 0.45);
    const z = lerp(1, 1.05, K(info, t));
    g.save(); g.translate(E.W / 2, E.H / 2); g.scale(z, z); g.translate(-E.W / 2, -E.H / 2);
    laptopScreen(g, t, E.W / 2, E.H / 2 + 20, { typeDur: info.typeDur, flagAt: info.flagAt }); g.restore();
  },
  streetWalk(g, t, info) {       // walking, slowing down, head dropping, eyes closing
    const slow = (tt) => tt - 0.16 * tt * tt, hx = 700 + 267 * slow(t), droop = ease.inOut(prog(t, info.droop0 ?? 0.5, info.droop1 ?? 1.6));
    const cam = camAt(hx + 90, 640, 1.5), { rim, rimDir } = street(g, t, cam, { dusk: info.dusk });
    const p = walkPose(slow(t) * Math.PI * 2 * 0.9), pose = { ...p, head: [p.head[0] + droop * 14, p.head[1] + droop * 16], sh: [p.sh[0] + droop * 6, p.sh[1] + droop * 4] };
    layer(g, cam, 1, (g) => drawFigure(g, { x: hx, y: GY - 80, s: HS, facing: 1, outfit: info.outfit || HERO, pose, rot: droop * 0.06, face: { ...face(info.face || 'day5'), lid: lerp(0.55, 1, droop) }, look: [0, 0.6], rim: { color: rim, dir: rimDir } }));
  },
  joltFace(g, t, info) {         // head nods… on `joltAt` the eyes jolt open; the lids creep back down
    blurLayer(g, 14, (g) => street(g, t, camAt(1500, 560, 1.4), { dusk: info.dusk })); veil(g, '#0a0c16', 0.3);
    const ja = info.joltAt ?? 0.12, jolt = t > ja, j = jolt ? 1 - ease.out(prog(t, ja, ja + 0.38)) : 0, [sx, sy] = jolt ? shake(t, 12 * j, 30) : [0, 0];
    const tilt = jolt ? lerp(0.28, 0, ease.out(prog(t, ja, ja + 0.18))) : 0.28, lid = jolt ? lerp(0, 0.5, ease.inOut(prog(t, ja + 0.5, info.dur))) : 1;
    bigFace(g, E.W * 0.5 + sx, E.H * 0.6 + sy + (jolt ? 0 : 30), lerp(300, 330, K(info, t)), { outfit: HERO, tilt, face: { ...(jolt ? F.fear : F.day5), lid, bags: 0.8 },
      look: key(t, [[0, [0, 0.6]], [ja + 0.02, [0, 0]], [ja + 0.6, [0, 0]], [ja + 0.75, [-0.8, 0]], [ja + 1.0, [0.8, 0]], [ja + 1.2, [0, 0]]], ease.out), rimColor: '#ffffff', rimSide: -1 });
    if (jolt) FX.rings(g, E.W * 0.5, E.H * 0.5, t - ja, { count: 2, r0: 260, r1: 700, speed: 1.6, color: '#ffffff', a: 0.35 * j });
  },
  mirror(g, t, info) {           // bathroom mirror reflection; the bar light flickers
    const cam = camLerp(camAt(960, 500, 1.0), camAt(960, 470, 1.2), K(info, t));
    const fl = (info.flickers || [[0.92, 0.99], [1.55, 1.6], [1.66, 1.74]]).some(([a, b]) => t > a && t < b) ? 0.15 : 1, [sx, sy] = shake(t, 1.6, 9);
    bathroom(g, t, cam, { flicker: fl, reflection: (g) => {
      bigFace(g, 960 + sx, 560 + sy, 232, { outfit: info.outfit || HERO, face: face(info.face || 'day7'), look: key(t, [[0, [0, 0]], [0.9, [0, 0]], [1.05, [0.3, 0.2]], [1.6, [0, 0]]], ease.out), rimColor: '#e6f4ff', rimSide: 1 });
      g.fillStyle = `rgba(0,0,0,${0.55 * (1 - fl)})`; g.fillRect(584, 154, 752, 652);
    } });
    g.fillStyle = `rgba(0,0,0,${0.45 * (1 - fl)})`; g.fillRect(0, 0, E.W, E.H);
  },
};
