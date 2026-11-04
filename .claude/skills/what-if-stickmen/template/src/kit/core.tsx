import React, {createContext, useContext} from 'react';
import {Easing, interpolate} from 'remotion';
import TL from '../story/timeline.json';
import {STORY} from '../story/config';
import {Stickman} from '../engine/Stickman';
import {CAST} from '../story/cast';
import {blinkAt, idle} from './actions';

export type Line = {id: string; sp: string; text: string; file: string; trimStart: number; from: number; dur: number; env: number[]};
export const LINES = TL.lines as Line[];
export const TOTAL = TL.total as number;

// lines are addressed by the 3-digit prefix of their id: L('012')
const byPrefix = new Map(LINES.map((l) => [l.id.slice(0, 3), l]));
export const L = (n: string) => {
	const l = byPrefix.get(n);
	if (!l) throw new Error('no line ' + n);
	return l;
};
export const lineEnd = (n: string) => L(n).from + L(n).dur;

/* The on-screen counter (age, money, lives… — STORY.counter) over the whole video.
   Keys are tied to lines: {line: '012', off: 6, v: 17, roll: 6} = becomes 17 six frames
   into line 012, rolling over 6 frames. Tie every change to the word that causes it. */
type CounterKey = {at: number; v: number; roll: number};
let KEYS: CounterKey[] | null = null;
const keys = () =>
	(KEYS ??= (STORY.counter?.keys ?? [{line: LINES[0]?.id ?? '001', off: 0, v: 0, roll: 0}]).filter((k, i) => i === 0 || LINES.some((l) => l.id.startsWith(k.line))).map((k, i) => ({
		at: i === 0 ? 0 : L(k.line).from + (k.off ?? 0),
		v: k.v,
		roll: k.roll ?? 0,
	})));
export const counterAt = (gf: number) => {
	const K = keys();
	let v = K[0].v;
	for (let i = 1; i < K.length; i++) {
		const k = K[i];
		if (gf < k.at) break;
		v = k.roll ? interpolate(gf, [k.at, k.at + k.roll], [K[i - 1].v, k.v], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)}) : k.v;
	}
	return v;
};
/* frames since the counter last changed (for the pop / sparks) */
export const counterChangedAgo = (gf: number) => {
	let last = -999;
	for (const k of keys()) if (gf >= k.at + k.roll) last = k.at + k.roll;
	return gf - last;
};
// the hero's body ageing (stubble, wrinkles, broader frame) follows the counter if the story wants it
export const heroAgeK = (gf: number) => (STORY.heroAge ? Math.max(0, Math.min(1, STORY.heroAge(counterAt(gf)))) : 0);

/* loudness of a speaker at a global frame */
export const talkOf = (sp: string, gf: number) => {
	for (const l of LINES) {
		if (l.sp !== sp) continue;
		if (gf >= l.from && gf < l.from + l.dur) {
			const i = gf - l.from;
			return ((l.env[i] ?? 0) + (l.env[i + 1] ?? 0)) / 2;
		}
	}
	return 0;
};
/* lets another cut (the short) drive lip flaps from its own voice timeline */
export const TalkOverride = createContext<((sp: string, gf: number) => number) | null>(null);

/* who the camera should be on: the line that owns this moment. A line takes over a few
   frames before it starts and holds through short pauses, so dialogue cuts go straight
   from face to face without flashing the wide shot in between. */
export const speakingNow = (gf: number) => {
	let cur: Line | null = null;
	for (const l of LINES) {
		if (l.from - 6 > gf) break;
		cur = l;
	}
	return cur && gf < cur.from + cur.dur + 12 ? cur.sp : null;
};
export const SpeakOverride = createContext<((gf: number) => string | null) | null>(null);
export const useSpeaking = (gf: number) => {
	const ov = useContext(SpeakOverride);
	return ov ? ov(gf) : speakingNow(gf);
};

/* per-shot context */
export type Shot = {f: number; gf: number; dur: number; start: number; at: (n: string) => number; end: (n: string) => number};
export const ShotCtx = createContext<Shot>({f: 0, gf: 0, dur: 1, start: 0, at: () => 0, end: () => 0});
export const useShot = () => useContext(ShotCtx);

type SM = React.ComponentProps<typeof Stickman>;
/* A cast member placed on a floor line, with automatic blink, breathing and lip flap,
   a soft contact shadow, and horizontal motion blur when it moves fast (vx, px/frame). */
export const Actor: React.FC<
	Partial<SM> & {who: string; x: number; floor?: number; s?: number; sp?: string; seat?: number; seed?: number; uid?: string; vx?: number; bob?: number; shadow?: boolean}
> = ({who, x, floor = 900, s = 1, sp, seat, seed = 0, uid, vx = 0, bob = 0, shadow = true, ...rest}) => {
	const {gf} = useShot();
	const base = CAST[who];
	for (const k of Object.keys(rest)) if ((rest as any)[k] === undefined) delete (rest as any)[k];
	const speaker = sp ?? base.sp ?? who.toUpperCase();
	const ov = useContext(TalkOverride);
	const talk = ov ? ov(speaker, gf) : talkOf(speaker, gf);
	const isHero = who === STORY.hero;
	const ak = isHero ? heroAgeK(gf) : 0;
	const grow = 1 + (STORY.heroGrow ?? 0) * ak;
	const scale = s * grow;
	const y = (seat !== undefined ? seat : floor - 157 * scale) - bob * scale;
	const id = uid ?? who + seed + '-' + Math.round(x);
	// horizontal motion blur from speed: only fast moves smear, a walk stays readable
	const blur = Math.max(0, Math.min(9, (Math.abs(vx) - 6) * 0.45));
	const body = (
		<Stickman
			id={id}
			x={x}
			y={y}
			scale={scale}
			pose={rest.pose ?? idle(gf, seed + x / 100)}
			blink={rest.blink ?? blinkAt(gf, seed + x)}
			talk={talk}
			age={isHero && STORY.heroAge ? ak : rest.age}
			{...base}
			{...rest}
		/>
	);
	return (
		<g>
			{shadow && seat === undefined ? <ellipse cx={x} cy={floor + 4} rx={(66 - bob * 2) * scale} ry={11 * scale} fill="#000" opacity={0.22} style={{filter: 'blur(5px)'}} /> : null}
			{blur > 0.6 ? (
				<>
					<defs>
						<filter id={'mb-' + id} x="-30%" y="-10%" width="160%" height="120%">
							<feGaussianBlur stdDeviation={`${blur} 0`} />
						</filter>
					</defs>
					<g filter={`url(#mb-${id})`}>{body}</g>
				</>
			) : (
				body
			)}
		</g>
	);
};

/* ---------------------------- auto coverage angles ----------------------------
   Long shots are split into "angles" (3–8 s, cut on speech pauses) by the episode host.
   Stage applies each angle as a different lens/framing on top of the shot's own camera,
   and every angle keeps moving (slow push + slide + a little handheld) — no static frames. */
export type Angle = {k: number; t: number; len: number};
export const AngleCtx = createContext<Angle>({k: 0, t: 0, len: 1});
export const useAngle = () => useContext(AngleCtx);

type CamLike = {x: number; y: number; zoom: number};
const VARIANTS = [
	{m: 1, dx: 0, dy: 0, sx: 1},
	{m: 1.32, dx: 0, dy: -60, sx: -1},
	{m: 1.14, dx: -60, dy: -16, sx: 1},
	{m: 1.42, dx: 50, dy: -70, sx: -1},
	{m: 1.12, dx: 60, dy: -10, sx: 1},
];
export const applyAngle = <C extends CamLike>(cam: C, a: Angle, gf: number): C => {
	const v = VARIANTS[a.k % VARIANTS.length];
	const prog = Math.max(0, Math.min(1, a.t / Math.max(1, a.len)));
	// close-ups go wider on alternate angles instead of tighter
	let m = v.m;
	if (cam.zoom >= 1.55 && a.k % 2 === 1) m = Math.max(1.05 / cam.zoom, 0.8);
	if (cam.zoom * m > 2.7) m = 2.7 / cam.zoom;
	m *= 1 + 0.05 * prog;
	return {
		...cam,
		zoom: cam.zoom * m,
		x: cam.x * m + v.dx + v.sx * 36 * (prog - 0.5) + Math.sin(gf / 47) * 5,
		y: cam.y * m + v.dy + Math.sin(gf / 61) * 3.5,
	};
};
/* the same idea for flat cards (boards, rule cards): each angle is a visible new view —
   the card turns a few degrees in 3D (left / right / slightly from below) and keeps
   drifting — without zooming in far enough to crop the titles */
const CARD = [
	{ry: 0, rx: 0, m: 1},
	{ry: -9, rx: 2, m: 0.95},
	{ry: 8, rx: -2, m: 0.96},
	{ry: -4, rx: 5, m: 1.04},
];
export const angle2D = (a: Angle, gf: number) => {
	const v = CARD[a.k % CARD.length];
	const prog = Math.max(0, Math.min(1, a.t / Math.max(1, a.len)));
	const m = v.m * (1.01 + 0.035 * prog);
	const ry = v.ry * (1 - 0.25 * prog) + Math.sin(gf / 90) * 0.8;
	const dx = (a.k % 2 ? -1 : 1) * 16 * (prog - 0.5) + Math.sin(gf / 53) * 3;
	return `perspective(2200px) translateX(${dx}px) rotateY(${ry}deg) rotateX(${v.rx}deg) scale(${m})`;
};

/* counter changes on the global timeline (for the checker and the sound tool) */
export const counterChanges = () => keys().slice(1).map((k) => ({at: k.at, roll: k.roll, v: k.v}));
