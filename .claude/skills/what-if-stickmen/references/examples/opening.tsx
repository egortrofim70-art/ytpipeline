import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useVideoConfig} from 'remotion';
import {Stickman} from '../Stickman';
import {CAST, env, gesture, idle, reach, walkTo} from './cast';
import {Actor, useShot} from './core';
import {Layer, Mirror, Stage, Svg, camOn, clamp, ease, mixCam} from './kit';
import {Toilet} from './sets';
import {AgeBadge, FONT} from './ui';
import {Grain, Vignette} from '../camera';

/* Cold open, cut by hand on the words of line 001 (r = frames into the line):
   A passport "16" · B he walks up to the mirror · C stubble / wrinkle / hoodie close-ups
   · D the badge lights up, split screen 16 vs 34. */

const R0 = 12; // line 001 starts here
const A_END = R0 + 80;
const B_END = R0 + 210;
const C_END = R0 + 340;

/* --------------------------------- passport -------------------------------- */
const Passport: React.FC<{f: number}> = ({f}) => {
	const {fps} = useVideoConfig();
	const r = f - R0;
	const inK = spring({frame: f, fps, config: {damping: 16, stiffness: 90}});
	const n = Math.round(interpolate(r, [2, 28], [0, 16], {...clamp, easing: ease}));
	const stamp = spring({frame: r - 44, fps, config: {damping: 9, stiffness: 220}});
	const shake = r > 44 && r < 54 ? Math.sin(r * 3) * (54 - r) * 0.8 : 0;
	const push = interpolate(f, [0, A_END], [1.12, 1.3]);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 40% 35%, #3a4a6b 0%, #1d2440 60%, #0d1022 100%)'}}>
			<svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{transform: `scale(${push}) translate(${shake}px, ${shake * 0.4}px)`, transformOrigin: '52% 50%'}}>
				{Array.from({length: 18}).map((_, i) => (
					<circle key={i} cx={random('pd' + i) * 1920} cy={(random('pe' + i) * 1080 - f * (0.3 + random('pf' + i))) % 1080} r={2 + random('pg' + i) * 3} fill="#fff" opacity={0.15} />
				))}
				<g transform={`translate(960,${560 + (1 - inK) * 700}) rotate(${-4 + (1 - inK) * 18})`}>
					<rect x={-600} y={-330} width={1200} height={660} rx={26} fill="#000" opacity={0.35} transform="translate(18,26)" style={{filter: 'blur(14px)'}} />
					<rect x={-600} y={-330} width={1200} height={660} rx={26} fill="#7a1f2b" />
					<rect x={-584} y={-314} width={1168} height={628} rx={18} fill="#f3ead6" />
					{Array.from({length: 26}).map((_, i) => (
						<path key={i} d={`M-584,${-300 + i * 24} C-300,${-320 + i * 24} 300,${-280 + i * 24} 584,${-300 + i * 24}`} stroke="#d9c9a6" strokeWidth={1.5} fill="none" opacity={0.6} />
					))}
					<text x={-540} y={-250} fontSize={30} fontFamily={FONT} fill="#7a1f2b" letterSpacing={6}>
						ПАСПОРТ
					</text>
					<clipPath id="ppPhoto">
						<rect x={-540} y={-200} width={300} height={380} rx={8} />
					</clipPath>
					<rect x={-540} y={-200} width={300} height={380} rx={8} fill="#d8e6ee" />
					<g clipPath="url(#ppPhoto)">
						<Stickman id="pp16" x={-390} y={250} scale={1.9} pose={{lean: 0, head: 0, armB: [-6, 10], armF: [6, 10], legB: [0, 0], legF: [0, 0]}} {...CAST.leva} mouth="smile" look={[0, 0]} faceTurn={0} rimW={1.5} />
					</g>
					<rect x={-540} y={-200} width={300} height={380} rx={8} fill="none" stroke="#9aa9b3" strokeWidth={3} />
					{[
						['ФАМИЛИЯ', 'ЛЕВИН'],
						['ИМЯ', 'ЛЕВ'],
						['ГОРОД', 'ТВЕРЬ'],
					].map(([k, v], i) => (
						<g key={k} opacity={interpolate(f, [8 + i * 6, 16 + i * 6], [0, 1], clamp)}>
							<text x={-180} y={-150 + i * 80} fontSize={24} fontFamily={FONT} fill="#9a8a6a">
								{k}
							</text>
							<text x={-180} y={-112 + i * 80} fontSize={40} fontFamily={FONT} fill="#2b2a33">
								{v}
							</text>
						</g>
					))}
					<text x={-180} y={110} fontSize={24} fontFamily={FONT} fill="#9a8a6a">
						ВОЗРАСТ
					</text>
					<text x={-186} y={250} fontSize={170} fontFamily={FONT} fill="#1f8a4a">
						{n}
					</text>
					<g transform={`translate(330,-150) rotate(-12) scale(${r > 44 ? 1 + (1 - stamp) * 1.4 : 0})`} opacity={r > 44 ? Math.min(1, stamp * 1.4) : 0}>
						<rect x={-230} y={-70} width={460} height={140} rx={14} fill="none" stroke="#c42b2b" strokeWidth={10} />
						<text y={22} textAnchor="middle" fontSize={56} fontFamily={FONT} fill="#c42b2b">
							ПО ПАСПОРТУ
						</text>
					</g>
				</g>
			</svg>
			<Vignette strength={0.5} />
			<Grain opacity={0.1} />
		</AbsoluteFill>
	);
};

/* ---------------------------------- callout -------------------------------- */
const Callout: React.FC<{f: number; t0: number; t1: number; from: [number, number]; to: [number, number]; text: string; c?: string}> = ({f, t0, t1, from, to, text, c = '#ffc94a'}) => {
	const k = env(f, t0, t1, 10, 8);
	if (k <= 0) return null;
	const draw = interpolate(f, [t0, t0 + 12], [0, 1], {...clamp, easing: ease});
	const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
	const left = to[0] < from[0];
	return (
		<g opacity={k}>
			<circle cx={from[0]} cy={from[1]} r={10 * draw} fill={c} />
			<circle cx={from[0]} cy={from[1]} r={10 + 26 * draw} fill="none" stroke={c} strokeWidth={3} opacity={1 - draw} />
			<line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={c} strokeWidth={5} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} strokeLinecap="round" />
			<g transform={`translate(${to[0]},${to[1]})`} opacity={interpolate(f, [t0 + 8, t0 + 16], [0, 1], clamp)}>
				<rect x={left ? -text.length * 24 - 40 : 0} y={-34} width={text.length * 24 + 40} height={64} rx={32} fill="#11142c" stroke={c} strokeWidth={4} />
				<text x={left ? -text.length * 12 - 20 : text.length * 12 + 20} y={12} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#fff">
					{text}
				</text>
			</g>
		</g>
	);
};

/* ------------------------------ mirror set-ups ------------------------------ */
// reflection head centre for floor 1080, s = 1.95 (×1.07 hero growth at 34): ~ (960, 410)
const HEAD: [number, number] = [960, 410];

const MirrorScene: React.FC<{f: number}> = ({f}) => {
	const {gf} = useShot();
	const r = f - R0;
	// B: walks into the mirror from the right, stops, leans in on «мужик»
	const w = walkTo(f, A_END - 4, A_END + 58, 1500, 960, 3, 0.32);
	const lean = interpolate(r, [130, 175], [0, 1], {...clamp, easing: ease});
	const s = 1.7 + 0.25 * lean;
	let pose = {...w.pose, lean: w.pose.lean + 4 * lean};
	// C: touches the stubble, then the wrinkle, then tugs the hoodie and looks down
	pose = gesture('touchFace', pose, env(r, 214, 248, 8, 8), f);
	pose = reach(pose, 'F', [14, -188], env(r, 250, 282, 8, 8));
	const hood = env(r, 286, 360, 8, 10);
	pose = reach(reach({...pose, head: pose.head + 22 * hood}, 'F', [18, -96], hood), 'B', [-20, -92], hood);
	// D: looks up at the badge
	const up = interpolate(r, [345, 365], [0, 1], {...clamp, easing: ease});
	pose = {...pose, head: pose.head - 16 * up};
	const expr = r < 120 ? 'normal' : r < 214 ? 'wide' : 'worried';
	const look: [number, number] = hood > 0.5 ? [0.1, 1] : up > 0.5 ? [0, -1] : r > 214 ? [0.2, 0.2] : [0, 0];

	// camera: B wide → slow dolly in; C close on the face; D tilt up to the badge
	let cam;
	if (f < B_END) cam = mixCam(camOn(1060, 470, 1.0), camOn(960, 440, 1.35), interpolate(f, [A_END, B_END], [0, 1], {...clamp, easing: ease}));
	else if (f < C_END) {
		const k = interpolate(r, [210, 286, 300, 340], [0, 0.25, 0.6, 1], {...clamp, easing: ease});
		cam = mixCam(camOn(960, 455, 2.3, {farBlur: 0}), camOn(960, 520, 1.5, {farBlur: 0}), k);
	} else {
		const k = interpolate(r, [340, 400], [0, 1], {...clamp, easing: ease});
		cam = mixCam(camOn(960, 400, 1.6, {farBlur: 0}), camOn(960, 290, 2.0, {farBlur: 0}), k);
	}
	// badge: neon flicker-on, digits scramble, lock on 34 on «тридцать четыре»
	const on = r < 350 ? 0 : r < 372 ? (random('nf' + Math.floor(r / 2)) > 0.45 ? 1 : 0.15) : 1;
	const scr = interpolate(r, [372, 404], [16, 34], {...clamp, easing: Easing.in(Easing.cubic)});
	const pop = r >= 400 && r < 412 ? 1 + 0.3 * Math.exp(-(r - 400) / 4) : 1;
	const ring = interpolate(r, [400, 416], [0, 1], clamp);
	return (
		<Stage cam={cam} bg="#cfe3dc" light={{x: 50, y: 0, c: '225,255,240', o: 0.45}} still>
			<Layer depth={1}>
				<Toilet f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Mirror x={575} y={165} w={770} h={490} id="m01">
						<rect x={575} y={165} width={770} height={490} fill="#a8c4c0" />
						<rect x={575} y={165} width={770} height={490} fill="#e8fff6" opacity={0.18} />
						<Actor who="leva" x={w.x} floor={1080} s={s} facing={-1} faceTurn={w.moving ? 0.6 : 0.12} expr={expr} look={look} pose={pose} vx={w.vx} bob={w.bob} armOver={r > 210 && r < 290} shadow={false} uid="mirror-leva" />
						{on > 0 ? (
							<g opacity={on}>
								<ellipse cx={960} cy={HEAD[1] - 175} rx={170} ry={60} fill="#ffc94a" opacity={0.25} style={{filter: 'blur(18px)'}} />
								{ring > 0 && ring < 1 ? <circle cx={960} cy={HEAD[1] - 175} r={70 + ring * 160} fill="none" stroke="#ffe08a" strokeWidth={8 * (1 - ring)} opacity={1 - ring} /> : null}
								<AgeBadge x={960} y={HEAD[1] - 175} value={scr} s={1.05 * pop} />
							</g>
						) : null}
					</Mirror>
					<rect x={575} y={165} width={770} height={490} fill="url(#mirrorSheen)" opacity={0.5} />
					<defs>
						<linearGradient id="mirrorSheen" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0.35" stopColor="#fff" stopOpacity={0} />
							<stop offset="0.45" stopColor="#fff" stopOpacity={0.22} />
							<stop offset="0.5" stopColor="#fff" stopOpacity={0} />
						</linearGradient>
					</defs>
					<Callout f={r} t0={202} t1={250} from={[HEAD[0] + 30, HEAD[1] + 78]} to={[HEAD[0] + 210, HEAD[1] + 150]} text="ЩЕТИНА" />
					<Callout f={r} t0={240} t1={286} from={[HEAD[0] + 6, HEAD[1] - 40]} to={[HEAD[0] - 200, HEAD[1] - 120]} text="МОРЩИНА" />
					<Callout f={r} t0={288} t1={340} from={[960, 590]} to={[700, 470]} text="ТВОЯ ТОЛСТОВКА" c="#f2b21c" />
				</Svg>
			</Layer>
			{/* the real Лёва, out of focus over the shoulder */}
			{f < B_END ? (
				<Layer depth={0.55}>
					<Svg>
						<g transform={`translate(${interpolate(f, [A_END - 4, A_END + 58], [700, 0], {...clamp, easing: ease})},0)`}>
							<circle cx={1560} cy={1010} r={170} fill="#000" />
							<rect x={1300} y={1040} width={560} height={300} rx={120} fill="#f2b21c" />
						</g>
					</Svg>
				</Layer>
			) : null}
		</Stage>
	);
};

/* ------------------------------ split 16 vs 34 ------------------------------ */
const Split: React.FC<{f: number}> = ({f}) => {
	const {fps} = useVideoConfig();
	const r = f - R0;
	const a = spring({frame: r - 405, fps, config: {damping: 15, stiffness: 140}});
	const b = spring({frame: r - 411, fps, config: {damping: 15, stiffness: 140}});
	if (r < 405) return null;
	const panel = (side: -1 | 1, k: number, label: string, num: string, c: string, age: number, expr: any) => (
		<g transform={`translate(${side * (1 - k) * 1000},0)`}>
			<polygon points={side < 0 ? '0,0 1010,0 910,1080 0,1080' : '1010,0 1920,0 1920,1080 910,1080'} fill={side < 0 ? '#1d2a4a' : '#3a1d2a'} />
			<g transform={`translate(${side < 0 ? 470 : 1440},0)`}>
				<text y={180} textAnchor="middle" fontSize={54} fontFamily={FONT} fill="#fff" opacity={0.85}>
					{label}
				</text>
				<Stickman id={'sp' + side} x={0} y={700} scale={1.9} pose={idle(f, side)} {...CAST.leva} age={age} expr={expr} look={[0, 0]} faceTurn={0} />
				<text y={1000} textAnchor="middle" fontSize={190} fontFamily={FONT} fill={c}>
					{num}
				</text>
			</g>
		</g>
	);
	return (
		<AbsoluteFill>
			<svg viewBox="0 0 1920 1080" width={1920} height={1080}>
				{panel(-1, a, 'ПО ПАСПОРТУ', '16', '#9ff0b0', 0, 'normal')}
				{panel(1, b, 'В ЗЕРКАЛЕ', '34', '#ffc94a', 1, 'worried')}
				<line x1={1010} y1={0} x2={910} y2={1080} stroke="#fff" strokeWidth={8} opacity={Math.min(a, b)} />
			</svg>
		</AbsoluteFill>
	);
};

export const S01: React.FC = () => {
	const {f} = useShot();
	if (f < A_END) return <Passport f={f} />;
	return (
		<>
			<MirrorScene f={f} />
			<Split f={f} />
		</>
	);
};
