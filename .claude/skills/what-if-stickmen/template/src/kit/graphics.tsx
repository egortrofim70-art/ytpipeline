import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useVideoConfig} from 'remotion';
import {Stickman} from '../engine/Stickman';
import {Grain, Vignette} from '../engine/camera';
import {CAST} from '../story/cast';
import {STORY} from '../story/config';
import {env, idle} from './actions';
import {clamp, ease} from './kit';
import {AgeBadge, FONT} from './ui';

/* Motion-graphics pieces proven in the reference video. Everything here animates in,
   lives (drift / pulse) and animates out — never a static text that just appears. */

/* Callout: dot + ring pulse on a detail, a line draws out to a label pill. World or screen space. */
// align: 'side' (default) — label grows away from the dot; 'center' — label centred on the line end
// (use it in shorts: the 9:16 window is only ~600 px wide)
export const Callout: React.FC<{f: number; t0: number; t1: number; from: [number, number]; to: [number, number]; text: string; c?: string; size?: number; align?: 'side' | 'center'}> = ({
	f,
	t0,
	t1,
	from,
	to,
	text,
	c = '#ffc94a',
	size = 34,
	align = 'side',
}) => {
	const k = env(f, t0, t1, 10, 8);
	if (k <= 0) return null;
	const draw = interpolate(f, [t0, t0 + 12], [0, 1], {...clamp, easing: ease});
	const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
	const left = to[0] < from[0];
	const w = text.length * size * 0.66 + 40;
	return (
		<g opacity={k}>
			<circle cx={from[0]} cy={from[1]} r={10 * draw} fill={c} />
			<circle cx={from[0]} cy={from[1]} r={10 + 26 * draw} fill="none" stroke={c} strokeWidth={3} opacity={1 - draw} />
			<line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={c} strokeWidth={5} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} strokeLinecap="round" />
			<g transform={`translate(${to[0]},${to[1]})`} opacity={interpolate(f, [t0 + 8, t0 + 16], [0, 1], clamp)}>
				<rect x={align === 'center' ? -w / 2 : left ? -w : 0} y={-size} width={w} height={size * 1.9} rx={size * 0.95} fill="#11142c" stroke={c} strokeWidth={4} />
				<text x={align === 'center' ? 0 : left ? -w / 2 : w / 2} y={size * 0.35} textAnchor="middle" fontSize={size} fontFamily={FONT} fontWeight={800} fill="#fff">
					{text}
				</text>
			</g>
		</g>
	);
};

/* ID card / passport / certificate that slides in, counts a number up and gets a stamp.
   f = local frame; numberAt = [frameStart, frameEnd] of the count; stampAt = frame of the slam. */
export const IdCard: React.FC<{
	f: number;
	title?: string;
	fields: [string, string][];
	numberLabel: string;
	number: number;
	numberAt?: [number, number];
	stamp?: string;
	stampAt?: number;
	who?: string;
	age?: number;
	tint?: string;
}> = ({f, title = 'ПАСПОРТ', fields, numberLabel, number, numberAt = [2, 28], stamp, stampAt = 44, who = STORY.hero, age = 0, tint = '#7a1f2b'}) => {
	const {fps} = useVideoConfig();
	const inK = spring({frame: f, fps, config: {damping: 16, stiffness: 90}});
	const n = Math.round(interpolate(f, numberAt, [0, number], {...clamp, easing: ease}));
	const st = spring({frame: f - stampAt, fps, config: {damping: 9, stiffness: 220}});
	const shake = f > stampAt && f < stampAt + 10 ? Math.sin(f * 3) * (stampAt + 10 - f) * 0.8 : 0;
	const push = interpolate(f, [0, 90], [1.08, 1.25], clamp);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 40% 35%, #3a4a6b 0%, #1d2440 60%, #0d1022 100%)'}}>
			<svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{transform: `scale(${push}) translate(${shake}px, ${shake * 0.4}px)`, transformOrigin: '52% 50%'}}>
				{Array.from({length: 18}).map((_, i) => (
					<circle key={i} cx={random('pd' + i) * 1920} cy={(random('pe' + i) * 1080 - f * (0.3 + random('pf' + i)) + 2000) % 1080} r={2 + random('pg' + i) * 3} fill="#fff" opacity={0.15} />
				))}
				<g transform={`translate(960,${560 + (1 - inK) * 700}) rotate(${-4 + (1 - inK) * 18})`}>
					<rect x={-600} y={-330} width={1200} height={660} rx={26} fill="#000" opacity={0.35} transform="translate(18,26)" style={{filter: 'blur(14px)'}} />
					<rect x={-600} y={-330} width={1200} height={660} rx={26} fill={tint} />
					<rect x={-584} y={-314} width={1168} height={628} rx={18} fill="#f3ead6" />
					{Array.from({length: 26}).map((_, i) => (
						<path key={i} d={`M-584,${-300 + i * 24} C-300,${-320 + i * 24} 300,${-280 + i * 24} 584,${-300 + i * 24}`} stroke="#d9c9a6" strokeWidth={1.5} fill="none" opacity={0.6} />
					))}
					<text x={-540} y={-250} fontSize={30} fontFamily={FONT} fontWeight={800} fill={tint} letterSpacing={6}>
						{title}
					</text>
					<clipPath id="idPhoto">
						<rect x={-540} y={-200} width={300} height={380} rx={8} />
					</clipPath>
					<rect x={-540} y={-200} width={300} height={380} rx={8} fill="#d8e6ee" />
					<g clipPath="url(#idPhoto)">
						<Stickman id="idc" x={-390} y={250} scale={1.9} pose={{lean: 0, head: 0, armB: [-6, 10], armF: [6, 10], legB: [0, 0], legF: [0, 0]}} {...CAST[who]} age={age} mouth="smile" look={[0, 0]} faceTurn={0} rimW={1.5} />
					</g>
					<rect x={-540} y={-200} width={300} height={380} rx={8} fill="none" stroke="#9aa9b3" strokeWidth={3} />
					{fields.map(([k, v], i) => (
						<g key={k} opacity={interpolate(f, [8 + i * 6, 16 + i * 6], [0, 1], clamp)}>
							<text x={-180} y={-150 + i * 80} fontSize={24} fontFamily={FONT} fill="#9a8a6a">
								{k}
							</text>
							<text x={-180} y={-112 + i * 80} fontSize={40} fontFamily={FONT} fontWeight={800} fill="#2b2a33">
								{v}
							</text>
						</g>
					))}
					<text x={-180} y={110} fontSize={24} fontFamily={FONT} fill="#9a8a6a">
						{numberLabel}
					</text>
					<text x={-186} y={250} fontSize={170} fontFamily={FONT} fontWeight={900} fill="#1f8a4a">
						{n}
					</text>
					{stamp && f > stampAt ? (
						<g transform={`translate(330,-150) rotate(-12) scale(${1 + (1 - st) * 1.4})`} opacity={Math.min(1, st * 1.4)}>
							<rect x={-250} y={-70} width={500} height={140} rx={14} fill="none" stroke="#c42b2b" strokeWidth={10} />
							<text y={22} textAnchor="middle" fontSize={56} fontFamily={FONT} fontWeight={900} fill="#c42b2b">
								{stamp}
							</text>
						</g>
					) : null}
				</g>
			</svg>
			<Vignette strength={0.5} />
			<Grain opacity={0.1} />
		</AbsoluteFill>
	);
};

/* Neon counter: flickers on, digits roll from `from` to `to`, then pops with a ring. World space. */
export const NeonCounter: React.FC<{f: number; x: number; y: number; on: number; rollAt: [number, number]; from: number; to: number; s?: number; label?: string}> = ({f, x, y, on, rollAt, from, to, s = 1, label}) => {
	if (f < on) return null;
	const vis = f < on + 22 ? (random('nf' + Math.floor(f / 2)) > 0.45 ? 1 : 0.15) : 1;
	const v = interpolate(f, rollAt, [from, to], {...clamp, easing: Easing.in(Easing.cubic)});
	const lock = f - rollAt[1];
	const pop = lock >= 0 && lock < 12 ? 1 + 0.3 * Math.exp(-lock / 4) : 1;
	const ring = interpolate(lock, [0, 16], [0, 1], clamp);
	return (
		<g opacity={vis}>
			<ellipse cx={x} cy={y} rx={170 * s} ry={60 * s} fill="#ffc94a" opacity={0.25} style={{filter: 'blur(18px)'}} />
			{ring > 0 && ring < 1 ? <circle cx={x} cy={y} r={(70 + ring * 160) * s} fill="none" stroke="#ffe08a" strokeWidth={8 * (1 - ring)} opacity={1 - ring} /> : null}
			<AgeBadge x={x} y={y} value={v} s={s * pop} label={label ?? STORY.counter?.label} c={STORY.counter?.color} />
		</g>
	);
};

/* Split comparison. Horizontal (left | right, for 16:9) or vertical (top / bottom, for 9:16).
   Two halves slide in from opposite sides; each shows a label, a figure and a big number. */
// icon: your own picture (sun, snow, planet…) drawn instead of the figure, centred at 0,0 (~400 px);
// the big text shrinks to fit when it is longer than 2–3 characters
type Half = {label: string; num: string; color: string; who?: string; age?: number; expr?: 'normal' | 'worried' | 'wide' | 'sad' | 'angry'; bg?: string; icon?: React.ReactNode};
export const Split: React.FC<{f: number; a: Half; b: Half; vertical?: boolean}> = ({f, a, b, vertical}) => {
	const {fps} = useVideoConfig();
	const ka = spring({frame: f, fps, config: {damping: 15, stiffness: 150}});
	const kb = spring({frame: f - 5, fps, config: {damping: 15, stiffness: 150}});
	const W = vertical ? 1080 : 1920;
	const H = vertical ? 1920 : 1080;
	const push = 1 + 0.03 * (f / 40);
	const half = (h: Half, first: boolean, k: number) => {
		const poly = vertical ? (first ? '0,0 1080,0 1080,900 0,1020' : '0,1020 1080,900 1080,1920 0,1920') : first ? '0,0 1010,0 910,1080 0,1080' : '1010,0 1920,0 1920,1080 910,1080';
		const shift = vertical ? `translate(${(first ? -1 : 1) * (1 - k) * 1100},0)` : `translate(${(first ? -1 : 1) * (1 - k) * 1000},0)`;
		const o = vertical ? {x: 0, y: first ? 0 : 940} : {x: first ? 0 : 960, y: 0};
		return (
			<g transform={shift}>
				<polygon points={poly} fill={h.bg ?? (first ? '#1d2a4a' : '#3a1d2a')} />
				<g transform={`translate(${o.x},${o.y})`}>
					<text x={vertical ? 540 : 470} y={vertical ? 150 : 180} textAnchor="middle" fontSize={vertical ? 64 : 54} fontFamily={FONT} fontWeight={800} fill="#fff" opacity={0.9}>
						{h.label}
					</text>
					{h.icon ? (
						<g transform={`translate(${vertical ? 300 : 470},${vertical ? 520 : 520})`}>{h.icon}</g>
					) : (
						<Stickman id={'sp' + (first ? 'a' : 'b')} x={vertical ? 330 : 470} y={vertical ? 640 : 700} scale={1.9} pose={idle(f, first ? 1 : 2)} {...CAST[h.who ?? STORY.hero]} age={h.age ?? 0} expr={h.expr ?? 'normal'} look={[0, 0]} faceTurn={0} />
					)}
					<text x={vertical ? 720 : 470} y={vertical ? 600 : 1000} textAnchor="middle" fontSize={Math.min(vertical ? 260 : 190, (vertical ? 620 : 780) / Math.max(1, h.num.length * 0.62))} fontFamily={FONT} fontWeight={900} fill={h.color}>
						{h.num}
					</text>
				</g>
			</g>
		);
	};
	return (
		<AbsoluteFill style={{background: '#0c0e22'}}>
			<svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{transform: `scale(${push})`, transformOrigin: '50% 50%'}}>
				{half(a, true, ka)}
				{half(b, false, kb)}
				{vertical ? <line x1={0} y1={1020} x2={1080} y2={900} stroke="#fff" strokeWidth={10} opacity={Math.min(ka, kb)} /> : <line x1={1010} y1={0} x2={910} y2={1080} stroke="#fff" strokeWidth={8} opacity={Math.min(ka, kb)} />}
			</svg>
			<Grain opacity={0.1} />
		</AbsoluteFill>
	);
};

/* Big title / call-to-action words: spring in, hold, fade out. Screen space (HTML). */
export const Caption: React.FC<{f: number; from: number; to: number; top: number; lines: string[]; c?: string; size?: number}> = ({f, from, to, top, lines, c = '#ffc94a', size = 84}) => {
	const {fps} = useVideoConfig();
	if (f < from || f > to) return null;
	const k = spring({frame: f - from, fps, config: {damping: 14, stiffness: 160}});
	const o = interpolate(f, [to - 10, to], [1, 0], clamp);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center', opacity: o, transform: `translateY(${(1 - k) * 40}px) scale(${0.9 + 0.1 * k})`}}>
				{lines.map((t, i) => (
					<div key={i} style={{fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.12, color: i === lines.length - 1 ? c : '#fff', WebkitTextStroke: '3px #0b0d1e', paintOrder: 'stroke', textShadow: '0 8px 24px rgba(0,0,0,.6)'}}>
						{t}
					</div>
				))}
			</div>
		</AbsoluteFill>
	);
};
