import React from 'react';
import {random} from 'remotion';
import {Pose, Stickman, ikArm, rigPoints} from '../engine/Stickman';

export type SM = React.ComponentProps<typeof Stickman>;
export type Base = Omit<SM, 'x' | 'y' | 'pose' | 'id'>;



export const idle = (f: number, seed = 0): Pose => ({
	lean: 1.5 + Math.sin(f / 23 + seed) * 1.2,
	head: Math.sin(f / 31 + seed * 2) * 2.5,
	armB: [-6 + Math.sin(f / 23 + seed) * 1.5, 16],
	armF: [6 + Math.sin(f / 23 + seed) * 1.5, 18],
	legB: [-3, 2],
	legF: [4, 2],
});

export const blinkAt = (f: number, seed = 0, period = 90) => {
	const t = (f + Math.floor(random('bl' + seed) * period)) % period;
	return t < 4 ? Math.sin((t / 4) * Math.PI) : 0;
};

export const walk = (ph: number): Pose => ({
	lean: 5,
	head: -3,
	armF: [-24 * Math.sin(ph), 22 + 10 * Math.max(0, -Math.sin(ph))],
	armB: [24 * Math.sin(ph), 22 + 10 * Math.max(0, Math.sin(ph))],
	legF: [28 * Math.sin(ph), 6 + 38 * Math.max(0, Math.cos(ph))],
	legB: [-28 * Math.sin(ph), 6 + 38 * Math.max(0, -Math.cos(ph))],
});

export const run = (ph: number): Pose => ({
	lean: 18,
	head: -10,
	armF: [-55 * Math.sin(ph) + 10, 80],
	armB: [55 * Math.sin(ph) + 10, 80],
	legF: [20 + 45 * Math.sin(ph), 30 + 60 * Math.max(0, -Math.cos(ph))],
	legB: [20 - 45 * Math.sin(ph), 30 + 60 * Math.max(0, Math.cos(ph))],
});

export const SIT: Pose = {lean: -4, head: 0, armB: [25, 70], armF: [35, 65], legB: [88, 85], legF: [92, 90]};

// A crowd member with a deterministic look.
const CROWD_COLORS = ['#f2b21c', '#d94a3a', '#3aa37a', '#2f6fd8', '#8b5cf6', '#e86aa0', '#f08a3c', '#3fc1c9', '#9aa3b5', '#5b6bd6'];
const CROWD_HAIR = ['short', 'bun', 'ponytail', 'spiky', 'bob', 'cap', 'none', 'short'] as const;
export const crowdLook = (i: number, seed = 'c'): Base => ({
	color: CROWD_COLORS[Math.floor(random(seed + 'col' + i) * CROWD_COLORS.length)],
	hair: CROWD_HAIR[Math.floor(random(seed + 'h' + i) * CROWD_HAIR.length)],
	hairColor: CROWD_COLORS[Math.floor(random(seed + 'hc' + i) * CROWD_COLORS.length)],
	rimW: 2,
});

/* ================================ ACTIONS =================================
   Poses are plain data, so every action is a function base pose -> new pose.
   Combine them: gesture(reach(walkTo(...).pose ...)). Time everything with env(). */

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const sm = (x: number) => {
	const c = Math.max(0, Math.min(1, x));
	return c * c * (3 - 2 * c);
};
/* 0→1→0 envelope: rises over `inn` frames after t0, holds until t1, falls over `out` */
export const env = (f: number, t0: number, t1: number, inn = 10, out = 10) => Math.min(sm((f - t0) / inn), 1 - sm((f - t1) / out));

export const blend = (a: Pose, b: Pose, k: number): Pose => ({
	lean: lerp(a.lean, b.lean, k),
	head: lerp(a.head, b.head, k),
	armB: [lerp(a.armB[0], b.armB[0], k), lerp(a.armB[1], b.armB[1], k)],
	armF: [lerp(a.armF[0], b.armF[0], k), lerp(a.armF[1], b.armF[1], k)],
	legB: [lerp(a.legB[0], b.legB[0], k), lerp(a.legB[1], b.legB[1], k)],
	legF: [lerp(a.legF[0], b.legF[0], k), lerp(a.legF[1], b.legF[1], k)],
});

/* put a hand on a rig-local point (see Stickman toLocal); k blends from the base pose */
export const reach = (p: Pose, side: 'F' | 'B', t: [number, number], k = 1): Pose => {
	const r = rigPoints(p);
	const a = ikArm(side === 'F' ? r.shF : r.shB, t);
	const key = side === 'F' ? 'armF' : 'armB';
	return {...p, [key]: [lerp(p[key][0], a[0], k), lerp(p[key][1], a[1], k)]} as Pose;
};

/* head-relative targets (local space, before head tilt) */
const headPt = (p: Pose, dx: number, dy: number): [number, number] => {
	const h = rigPoints(p).head;
	return [h[0] + dx, h[1] + dy];
};

export type Gesture = 'touchFace' | 'rubChin' | 'facepalm' | 'scratch' | 'shrug' | 'point' | 'handsOnHead' | 'wave' | 'armsCrossed' | 'think' | 'fist' | 'presentF' | 'stop';
/* gesture applied on top of a base pose, k = 0..1 strength; f drives small loops (rubbing, waving) */
export const gesture = (g: Gesture, base: Pose, k: number, f = 0): Pose => {
	if (k <= 0) return base;
	switch (g) {
		case 'touchFace': // fingertips on the cheek, slow rub
			return reach({...base, head: base.head - 6 * k}, 'F', headPt(base, 26 + Math.sin(f / 6) * 4, 18 + Math.cos(f / 6) * 4), k);
		case 'rubChin':
			return reach({...base, head: base.head - 4 * k}, 'F', headPt(base, 18 + Math.sin(f / 4) * 5, 44), k);
		case 'facepalm':
			return reach({...base, head: base.head + 14 * k, lean: base.lean + 6 * k}, 'F', headPt(base, 34, -6), k);
		case 'scratch':
			return reach({...base, head: base.head - 10 * k}, 'F', headPt(base, -10 + Math.sin(f / 2.5) * 6, -50), k);
		case 'think':
			return reach(reach({...base, head: base.head - 8 * k}, 'F', headPt(base, 20, 40), k), 'B', [10, -70], k);
		case 'shrug':
			return {...base, head: base.head + 8 * k, armF: [lerp(base.armF[0], 40, k), lerp(base.armF[1], 100, k)], armB: [lerp(base.armB[0], -40, k), lerp(base.armB[1], -100 + 200, k)]};
		case 'point':
			return {...base, armF: [lerp(base.armF[0], 92, k), lerp(base.armF[1], 4, k)]};
		case 'presentF':
			return {...base, armF: [lerp(base.armF[0], 70, k), lerp(base.armF[1], 40, k)]};
		case 'stop':
			return {...base, lean: base.lean - 4 * k, armF: [lerp(base.armF[0], 100, k), lerp(base.armF[1], -10, k)]};
		case 'handsOnHead':
			// hands grab the head from the front and the top, so it reads even in profile
			return reach(reach({...base, lean: base.lean - 5 * k, head: base.head + Math.sin(f / 3) * 3 * k}, 'F', headPt(base, 44, -20), k), 'B', headPt(base, 10, -58), k);
		case 'wave':
			return {...base, armF: [lerp(base.armF[0], 150 + Math.sin(f / 2.2) * 18, k), lerp(base.armF[1], 25, k)]};
		case 'armsCrossed':
			return reach(reach(base, 'F', [-14, -62], k), 'B', [30, -66], k);
		case 'fist':
			return {...base, armF: [lerp(base.armF[0], 120 + Math.abs(Math.sin(f / 3)) * 20, k), lerp(base.armF[1], 70, k)]};
	}
	return base;
};

/* walk from x0 to x1 between frames t0..t1 with ease in/out and settling into idle */
export const walkTo = (f: number, t0: number, t1: number, x0: number, x1: number, seed = 0, speed = 0.3) => {
	const u = Math.max(0, Math.min(1, (f - t0) / Math.max(1, t1 - t0)));
	const e = u * u * (3 - 2 * u);
	const x = lerp(x0, x1, e);
	const moving = f > t0 && f < t1;
	const step = moving ? Math.min(1, Math.min(u, 1 - u) * 6) : 0;
	const ph = (f - t0) * speed * 1.15;
	const pose = blend(idle(f, seed), walk(ph), step);
	const vx = ((x1 - x0) * 6 * u * (1 - u)) / Math.max(1, t1 - t0);
	return {x, pose, facing: (x1 >= x0 ? 1 : -1) as 1 | -1, vx, moving, bob: moving ? Math.abs(Math.sin(ph)) * 4 : 0};
};

/* two people shaking hands: returns arm-adjusted poses; mid = world point between them */
export const handshake = (pA: Pose, pB: Pose, k: number, f: number, A: {x: number; y: number; s: number; facing: 1 | -1}, B: {x: number; y: number; s: number; facing: 1 | -1}) => {
	const midX = (A.x + B.x) / 2;
	const midY = A.y - 70 * A.s + Math.sin(f / 2.6) * 10 * k;
	const la: [number, number] = [((midX - A.x) / A.s) * A.facing, (midY - A.y) / A.s];
	const lb: [number, number] = [((midX - B.x) / B.s) * B.facing, (midY - B.y) / B.s];
	return {a: reach(pA, 'F', la, k), b: reach(pB, 'F', lb, k), mid: [midX, midY] as [number, number]};
};
