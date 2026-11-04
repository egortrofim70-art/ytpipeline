import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useVideoConfig, Easing} from 'remotion';
import {Cam, Camera, Dust, Grain, Layer, Svg, Vignette} from '../engine/camera';
import {Stickman, Pose} from '../engine/Stickman';
import {CAST} from '../story/cast';
import {STORY} from '../story/config';
import {crowdLook, idle, run, walk} from './actions';
import {applyAngle, counterAt, counterChangedAgo, useAngle, useShot} from './core';
import {AgeBadge, FONT} from './ui';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.inOut(Easing.cubic);

/* camera that frames world point (X,Y) at zoom z (for depth-1 layers) */
export const camOn = (X: number, Y: number, z: number, extra: Partial<Cam> = {}): Cam => ({
	x: (X - 960) * z,
	y: (Y - 540) * z,
	zoom: z,
	focus: 1,
	farBlur: z > 1.6 ? 7 : 3,
	nearBlur: 10,
	...extra,
});
export const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
	x: a.x + (b.x - a.x) * k,
	y: a.y + (b.y - a.y) * k,
	zoom: a.zoom + (b.zoom - a.zoom) * k,
	focus: 1,
	farBlur: (a.farBlur ?? 3) + ((b.farBlur ?? 3) - (a.farBlur ?? 3)) * k,
	nearBlur: 10,
});
/* slow push from one framing to another across the whole shot */
export const usePush = (a: Cam, b: Cam) => {
	const {f, dur} = useShot();
	return mixCam(a, b, interpolate(f, [0, dur], [0, 1], {...clamp, easing: ease}));
};

/* key light: a soft warm (or cool) pool from one side and a darker floor, in screen space */
export type Light = {x?: number; y?: number; c?: string; o?: number; night?: boolean};
const KeyLight: React.FC<{l: Light}> = ({l}) => {
	const c = l.c ?? (l.night ? '150,170,255' : '255,232,190');
	return (
		<>
			<AbsoluteFill style={{background: `radial-gradient(ellipse at ${l.x ?? 28}% ${l.y ?? 12}%, rgba(${c},${l.o ?? 0.38}) 0%, rgba(${c},0) 58%)`, mixBlendMode: 'soft-light', pointerEvents: 'none'}} />
			<AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(10,8,30,0.22) 100%)', mixBlendMode: 'multiply', pointerEvents: 'none'}} />
		</>
	);
};

export const Stage: React.FC<{cam: Cam; bg?: string; children: React.ReactNode; grain?: number; vig?: number; dust?: string; light?: Light | false; still?: boolean}> = ({
	cam: cam0,
	bg = '#101225',
	children,
	grain = 0.1,
	vig = 0.45,
	dust,
	light = {},
	still,
}) => {
	const {gf} = useShot();
	const a = useAngle();
	const cam = still ? cam0 : applyAngle(cam0, a, gf);
	return (
	<AbsoluteFill style={{background: bg}}>
		<Camera cam={cam}>
			{children}
			{dust ? (
				<Layer depth={0.8}>
					<Dust seed={'d' + dust} n={30} color={dust} size={[1.2, 3.5]} speed={0.3} opacity={0.45} />
				</Layer>
			) : null}
		</Camera>
		{light ? <KeyLight l={light} /> : null}
		<Vignette strength={vig} color="8,8,24" />
		<Grain opacity={grain} />
	</AbsoluteFill>
	);
};

/* volumetric light shafts from a window (world space, put inside a Layer) */
export const Rays: React.FC<{x: number; y: number; w: number; len?: number; angle?: number; c?: string; o?: number}> = ({x, y, w, len = 900, angle = 28, c = '#fff3d0', o = 0.16}) => {
	const {gf} = useShot();
	const id = `ray${Math.round(x)}_${Math.round(y)}`;
	return (
		<Svg>
			<defs>
				<linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={c} stopOpacity={o} />
					<stop offset="1" stopColor={c} stopOpacity={0} />
				</linearGradient>
			</defs>
			<g transform={`translate(${x},${y}) skewX(${-angle})`} style={{mixBlendMode: 'screen', filter: 'blur(6px)'}}>
				{[0, 0.3, 0.55, 0.8].map((p, i) => (
					<rect key={i} x={w * p - w * 0.08} y={0} width={w * (0.12 + 0.06 * Math.sin(gf / 40 + i))} height={len} fill={`url(#${id})`} opacity={0.7 + 0.3 * Math.sin(gf / 33 + i * 2)} />
				))}
			</g>
		</Svg>
	);
};

/* badge over the hero, pops and flashes whenever the number clicks */
export const HeroBadge: React.FC<{x: number; y: number; s?: number; value?: number}> = ({x, y, s = 1, value}) => {
	const {gf} = useShot();
	const v = value ?? counterAt(gf);
	const ago = counterChangedAgo(gf);
	const pop = 1 + 0.28 * Math.exp(-Math.max(0, ago) / 4) * (ago >= 0 ? 1 : 0);
	const ring = interpolate(ago, [0, 14], [0, 1], clamp);
	const prev = counterAt(gf - Math.max(0, ago) - 2);
	const delta = Math.round(v - prev);
	const fly = interpolate(ago, [0, 30], [0, 1], clamp);
	return (
		<g>
			{ago >= 0 && ago < 30 && delta !== 0 ? (
				<g>
					{Array.from({length: 12}).map((_, i) => {
						const a = (i / 12) * Math.PI * 2 + random('sp' + i) * 0.4;
						const d = (40 + 160 * fly) * s * (0.7 + random('sd' + i) * 0.6);
						return <circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d * 0.7 + fly * fly * 60 * s} r={(5 - 4 * fly) * s} fill="#ffe08a" opacity={1 - fly} />;
					})}
					<text x={x + 130 * s} y={y - 20 * s - fly * 90 * s} fontSize={54 * s} fontFamily={FONT} fill={delta > 0 ? '#ff6a5a' : '#9ff0b0'} opacity={1 - fly * fly} textAnchor="middle">
						{delta > 0 ? `+${delta}` : `−${-delta}`}
					</text>
				</g>
			) : null}
			{ago >= 0 && ago < 14 ? <circle cx={x} cy={y} r={60 + ring * 140 * s} fill="none" stroke="#ffe08a" strokeWidth={8 * (1 - ring)} opacity={1 - ring} /> : null}
			<AgeBadge x={x} y={y} value={v} pop={pop} s={s} label={STORY.counter?.label} c={STORY.counter?.color} />
		</g>
	);
};

/* a generic extra (crowd member) */
export const Extra: React.FC<{i: number; x: number; floor: number; s?: number; pose?: Pose; seed?: string; facing?: 1 | -1; expr?: React.ComponentProps<typeof Stickman>['expr']}> = ({
	i,
	x,
	floor,
	s = 1,
	pose,
	seed = 'c',
	facing = 1,
	expr,
}) => {
	const {gf} = useShot();
	return (
		<Stickman
			id={`x${seed}${i}`}
			x={x}
			y={floor - 157 * s}
			scale={s}
			facing={facing}
			pose={pose ?? idle(gf, i)}
			blink={(gf + i * 17) % 97 < 4 ? 1 : 0}
			expr={expr}
			look={[facing * 0.3, 0]}
			{...crowdLook(i, seed)}
		/>
	);
};

/* a row of people dancing / standing / running */
export const CrowdRow: React.FC<{n: number; x0: number; x1: number; floor: number; s: number; mode: 'dance' | 'stand' | 'run' | 'walk' | 'panic'; seed: string; dir?: 1 | -1; t?: number}> = ({
	n,
	x0,
	x1,
	floor,
	s,
	mode,
	seed,
	dir = 1,
	t = 0,
}) => {
	const {gf} = useShot();
	return (
		<>
			{Array.from({length: n}).map((_, i) => {
				const r = random(seed + i);
				let x = x0 + ((x1 - x0) * (i + 0.5)) / n + (r - 0.5) * 40;
				let pose: Pose;
				let facing: 1 | -1 = r > 0.5 ? 1 : -1;
				if (mode === 'dance') {
					const ph = gf / 7 + r * 6;
					pose = {lean: Math.sin(ph) * 8, head: Math.sin(ph * 2) * 10, armF: [120 + Math.sin(ph) * 40, 30], armB: [-120 + Math.cos(ph) * 40, 30], legF: [10 + Math.sin(ph) * 15, 10], legB: [-10, 10]};
				} else if (mode === 'run' || mode === 'panic') {
					facing = dir;
					const ph = gf * 0.45 + r * 6;
					x += dir * t * (5 + r * 3);
					pose = mode === 'panic' ? {...run(ph), armF: [150, 20], armB: [-140, 20]} : run(ph);
				} else if (mode === 'walk') {
					facing = dir;
					const ph = gf * 0.25 + r * 6;
					x += dir * t * (2 + r);
					pose = walk(ph);
				} else pose = idle(gf, i);
				return <Extra key={i} i={i} x={x} floor={floor + (r - 0.5) * 10} s={s} pose={pose} seed={seed} facing={facing} expr={mode === 'panic' ? 'wide' : undefined} />;
			})}
		</>
	);
};

/* mirror reflection: draws children mirrored about a vertical axis, cooled and clipped */
export const Mirror: React.FC<{x: number; y: number; w: number; h: number; id: string; children: React.ReactNode}> = ({x, y, w, h, id, children}) => (
	<g>
		<clipPath id={id}>
			<rect x={x} y={y} width={w} height={h} />
		</clipPath>
		<g clipPath={`url(#${id})`}>
			<g opacity={0.92}>{children}</g>
			<rect x={x} y={y} width={w} height={h} fill="#bfe6ff" opacity={0.16} />
			<polygon points={`${x + 40},${y + h} ${x + 110},${y + h} ${x + w * 0.5},${y} ${x + w * 0.5 - 70},${y}`} fill="#fff" opacity={0.12} />
		</g>
	</g>
);

/* hero lying in bed (head on pillow), mostly under the blanket */
export const Sleeper: React.FC<{x: number; y: number; s?: number; lift?: number; talk?: number; age?: number; expr?: React.ComponentProps<typeof Stickman>['expr']}> = ({x, y, s = 1, lift = 0, talk = 0, age = 0, expr = 'sleepy'}) => {
	const {gf} = useShot();
	return (
		<g transform={`translate(${x},${y - lift}) rotate(84)`}>
			<Stickman
				id="sleeper"
				x={0}
				y={0}
				scale={s}
				pose={{lean: 0, head: -10 + Math.sin(gf / 30) * 3, armB: [4, 10], armF: [6, 12], legB: [0, 0], legF: [3, 0]}}
				{...CAST[STORY.hero]}
				expr={expr}
				talk={talk}
				age={age}
				look={[0.4, -0.5]}
				faceTurn={0.2}
			/>
		</g>
	);
};

export const flash = (f: number, at: number, len = 6) => interpolate(f, [at, at + 1, at + len], [0, 0.85, 0], clamp);

export const Pop: React.FC<{t: number; children: React.ReactNode; x: number; y: number; s?: number}> = ({t, children, x, y, s = 1}) => {
	const {fps} = useVideoConfig();
	if (t < 0) return null;
	const k = spring({frame: t, fps, config: {damping: 10, stiffness: 170}});
	return <g transform={`translate(${x},${y}) scale(${k * s})`}>{children}</g>;
};

export {Layer, Svg};
