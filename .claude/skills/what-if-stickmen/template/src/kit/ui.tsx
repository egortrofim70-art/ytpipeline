import React from 'react';
import {angle2D, useAngle, useShot} from './core';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {lighten} from '../engine/color';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
// open-licence fonts shipped in public/fonts (OFL): Rubik for UI, Caveat for chalk/handwriting
export const FONT = "'Rubik', sans-serif";
export const HAND = "'Caveat', cursive";

/* Age badge over the hero. `value` may be fractional while it is rolling. */
export const AgeBadge: React.FC<{x: number; y: number; value: number; pop?: number; s?: number; c?: string; label?: string}> = ({
	x,
	y,
	value,
	pop = 1,
	s = 1,
	c = '#ffc94a',
	label = 'ВОЗРАСТ',
}) => {
	const v = Math.floor(value);
	const frac = value - v;
	const digits = String(v);
	// the pill grows with the label and the number (any counter: age, steps, money…)
	const dw = Math.max(2, digits.length, String(v + 1).length) * 27;
	const lw = label.length * 16 + 10;
	const w = 26 + lw + 18 + dw + 22;
	const cid = `agclip${Math.round(x)}_${Math.round(y)}`;
	return (
		<g transform={`translate(${x},${y}) scale(${s * pop})`}>
			<rect x={-w / 2 - 8} y={-38} width={w + 16} height={76} rx={38} fill={c} opacity={0.22} style={{filter: 'blur(12px)'}} />
			<rect x={-w / 2} y={-32} width={w} height={64} rx={32} fill="#11142c" stroke={c} strokeWidth={4} />
			<path d="M-9,32 L0,47 L9,32 Z" fill={c} />
			<text x={-w / 2 + 26} y={9} fontSize={22} fontFamily={FONT} fontWeight={700} fill={lighten(c, 0.55)} letterSpacing={1.5}>
				{label}
			</text>
			<clipPath id={cid}>
				<rect x={w / 2 - 22 - dw} y={-26} width={dw + 14} height={52} />
			</clipPath>
			<g clipPath={`url(#${cid})`}>
				<text x={w / 2 - 20} y={15 - frac * 46} textAnchor="end" fontSize={40} fontFamily={FONT} fontWeight={800} fill="#fff">
					{v}
				</text>
				{frac > 0.01 ? (
					<text x={w / 2 - 20} y={15 + 46 - frac * 46} textAnchor="end" fontSize={40} fontFamily={FONT} fontWeight={800} fill="#fff">
						{v + 1}
					</text>
				) : null}
			</g>
		</g>
	);
};

/* Comic speech / thought bubble in world space. */
export const Bubble: React.FC<{x: number; y: number; w: number; h: number; t: number; tail?: [number, number]; thought?: boolean; children: React.ReactNode; fill?: string}> = ({
	x,
	y,
	w,
	h,
	t,
	tail,
	thought,
	children,
	fill = '#fbf8ef',
}) => {
	const {fps} = useVideoConfig();
	const k = spring({frame: t, fps, config: {damping: 8, stiffness: 170, mass: 0.8}});
	if (t < 0) return null;
	const rot = Math.sin(t / 3) * 7 * Math.exp(-t / 10);
	const bob = Math.sin(t / 22) * 4;
	return (
		<g transform={`translate(${x},${y + bob}) rotate(${rot}) scale(${k})`} opacity={Math.min(1, k * 1.5)}>
			<rect x={-w / 2 + 6} y={-h / 2 + 12} width={w} height={h} rx={thought ? h / 2 : 22} fill="#000" opacity={0.18} style={{filter: 'blur(8px)'}} />
			<rect x={-w / 2 - 4} y={-h / 2 - 4} width={w + 8} height={h + 8} rx={thought ? h / 2 + 4 : 26} fill="#1b1e2a" opacity={0.85} />
			{tail && !thought ? <path d={`M${-14},${h / 2 - 4} L${tail[0]},${tail[1]} L${14},${h / 2 - 4} Z`} fill={fill} /> : null}
			{tail && thought ? (
				<>
					<circle cx={tail[0] * 0.45} cy={h / 2 + (tail[1] - h / 2) * 0.45} r={11} fill={fill} />
					<circle cx={tail[0] * 0.8} cy={h / 2 + (tail[1] - h / 2) * 0.8} r={6} fill={fill} />
				</>
			) : null}
			<rect x={-w / 2} y={-h / 2} width={w} height={h} rx={thought ? h / 2 : 22} fill={fill} />
			{children}
		</g>
	);
};

/* Short on-screen accent caption (lower third), only used on key beats. */
export const Accent: React.FC<{text: string; t: number; dur: number; sub?: string; y?: number; c?: string}> = ({text, t, dur, sub, y = 900, c = '#ffc94a'}) => {
	if (t < 0 || t > dur) return null;
	const inK = interpolate(t, [0, 8], [0, 1], {...clamp});
	const outK = interpolate(t, [dur - 8, dur], [1, 0], {...clamp});
	const o = Math.min(inK, outK);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: y,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					opacity: o,
					transform: `translateY(${(1 - inK) * 18}px)`,
				}}
			>
				<div style={{position: 'relative', background: 'rgba(14,16,36,0.88)', border: `3px solid ${c}`, borderRadius: 18, padding: '10px 28px', color: '#fff', fontFamily: FONT, fontSize: 38, letterSpacing: 1, overflow: 'hidden', transform: `scale(${0.9 + 0.1 * inK})`}}>
						<div style={{position: 'absolute', left: 0, bottom: 0, height: 6, width: `${interpolate(t, [4, 18], [0, 100], clamp)}%`, background: c}} />
						{text.split(' ').map((w, i) => {
							const wk = interpolate(t, [2 + i * 3, 9 + i * 3], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
							return (
								<span key={i} style={{display: 'inline-block', marginRight: 12, opacity: Math.min(1, wk * 1.4), transform: `translateY(${(1 - wk) * 26}px) scale(${0.6 + 0.4 * wk})`}}>
									{w}
								</span>
							);
						})}
					</div>
				{sub ? <div style={{marginTop: 8, color: '#e8e4d8', fontFamily: FONT, fontSize: 26, textShadow: '0 2px 8px #000'}}>{sub}</div> : null}
			</div>
		</AbsoluteFill>
	);
};

/* Full-frame rule card: chalkboard slate with a number and one line of rule text. */
export const RuleCard: React.FC<{n: string; title: string; text: string; t: number; strike?: number; fix?: string; icon?: React.ReactNode}> = ({n, title, text, t, strike = 0, fix, icon}) => {
	const {fps} = useVideoConfig();
	const {gf} = useShot();
	const ang = useAngle();
	const k = spring({frame: t, fps, config: {damping: 12, stiffness: 140}});
	const slide = spring({frame: t + 4, fps, config: {damping: 16, stiffness: 120}});
	// text spans roughly the middle of the slate; the chalk travels across it
	const write = interpolate(t, [10, 10 + Math.max(18, text.length * 1.1)], [0.2, 0.82], clamp) + (t > 10 + text.length * 1.1 ? 1 : 0);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #2f4a3d 0%, #1b2b24 70%, #101a15 100%)', transform: `translateY(${(1 - slide) * 120}px) rotate(${(1 - slide) * -2}deg)`}}>
			<svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{transform: angle2D(ang, gf), transformOrigin: '50% 45%'}}>
				<rect x={120} y={80} width={1680} height={920} rx={18} fill="none" stroke="#6b4a2a" strokeWidth={28} />
				{Array.from({length: 40}).map((_, i) => (
					<circle key={i} cx={(i * 397) % 1600 + 160} cy={(i * 211) % 820 + 120} r={60 + (i % 5) * 20} fill="#fff" opacity={0.012} />
				))}
				<g transform={`translate(960,${300 - (1 - k) * 60}) scale(${0.85 + 0.15 * k})`} opacity={k}>
					<text textAnchor="middle" fontSize={64} fontFamily={HAND} fontWeight={700} fill="#f6e7a1">
						{title} {n}
					</text>
				</g>
				{icon ? <g transform={`translate(960,520) scale(${k})`}>{icon}</g> : null}
				<clipPath id={`chalk${n}${t < 0 ? 0 : 1}`}>
						<rect x={0} y={700} width={write * 1920} height={120} />
					</clipPath>
					{write > 0 && write < 1 ? (
						<g>
							{Array.from({length: 10}).map((_, i) => (
								<circle key={i} cx={write * 1920 - 10 + random('cd' + i + t) * 30} cy={760 + random('ce' + i + t) * 40 + (i % 3) * 6} r={1.5 + random('cf' + i) * 2.5} fill="#f4f1e6" opacity={0.6} />
							))}
						</g>
					) : null}
					<g>
						<text x={960} y={780} textAnchor="middle" fontSize={50} fontFamily={HAND} fontWeight={700} fill="#f4f1e6" clipPath={`url(#chalk${n}${t < 0 ? 0 : 1})`}>
							{text}
						</text>
					{strike > 0 ? <line x1={420} y1={765} x2={420 + 1080 * strike} y2={765} stroke="#ff6a5a" strokeWidth={9} strokeLinecap="round" /> : null}
					{fix && strike >= 1 ? (
						<text x={960} y={880} textAnchor="middle" fontSize={50} fontFamily={HAND} fontWeight={700} fill="#9ff0b0">
							{fix}
						</text>
					) : null}
				</g>
			</svg>
		</AbsoluteFill>
	);
};

/* Phone in hand showing a messenger chat. Messages appear at their own local frame. */
export type ChatMsg = {at: number; from: string; text: string; me?: boolean; reads?: number};
export const PhoneChat: React.FC<{t: number; msgs: ChatMsg[]; title: string; x?: number; y?: number; s?: number}> = ({t, msgs, title, x = 960, y = 560, s = 1}) => {
	const {fps} = useVideoConfig();
	const shown = msgs.filter((m) => t >= m.at);
	const H = 860;
	let yy = 0;
	const items = shown.map((m) => {
		const lines = Math.ceil(m.text.length / 26);
		const h = 34 + lines * 34 + (m.me ? 0 : 26);
		const it = {m, y: yy, h};
		// layout grows with the pop-in, so the list scrolls smoothly instead of jumping
		yy += (h + 14) * spring({frame: t - m.at, fps, config: {damping: 18, stiffness: 160}});
		return it;
	});
	const typing = msgs.find((m) => !m.me && t < m.at && t >= m.at - 22);
	if (typing) yy += 64;
	const scroll = Math.max(0, yy - (H - 200));
	return (
		<g transform={`translate(${x},${y}) scale(${s})`}>
			<rect x={-250} y={-H / 2 - 20} width={500} height={H + 40} rx={60} fill="#15171f" />
			<rect x={-232} y={-H / 2} width={464} height={H} rx={44} fill="#e9eef6" />
			<rect x={-232} y={-H / 2} width={464} height={96} rx={44} fill="#3d6fd6" />
			<rect x={-232} y={-H / 2 + 50} width={464} height={46} fill="#3d6fd6" />
			<text x={0} y={-H / 2 + 62} textAnchor="middle" fontSize={26} fontFamily={FONT} fill="#fff">
				{title}
			</text>
			<clipPath id="phoneclip">
				<rect x={-232} y={-H / 2 + 96} width={464} height={H - 96} />
			</clipPath>
			<g clipPath="url(#phoneclip)">
				<g transform={`translate(0,${-H / 2 + 120 - scroll})`}>
					{items.map(({m, y: my, h}, i) => {
						const k = spring({frame: t - m.at, fps, config: {damping: 14, stiffness: 200}});
						const bw = Math.min(380, 40 + Math.min(m.text.length, 26) * 14);
						const bx = m.me ? 210 - bw : -210;
						const words: string[] = [];
						let cur = '';
						for (const w of m.text.split(' ')) {
							if ((cur + ' ' + w).trim().length > 26) {
								words.push(cur.trim());
								cur = w;
							} else cur += ' ' + w;
						}
						words.push(cur.trim());
						return (
							<g key={i} transform={`translate(0,${my}) scale(${k})`} opacity={k}>
								<rect x={bx} y={0} width={bw} height={h} rx={20} fill={m.me ? '#d6f5c4' : '#fff'} />
								{!m.me ? (
									<text x={bx + 18} y={28} fontSize={20} fontFamily={FONT} fill="#3d6fd6">
										{m.from}
									</text>
								) : null}
								{words.map((w, j) => (
									<text key={j} x={bx + 18} y={(m.me ? 34 : 60) + j * 34} fontSize={26} fontFamily={FONT} fill="#1b1e2a">
										{w}
									</text>
								))}
								{m.me && m.reads !== undefined ? (
									<text x={bx + bw - 14} y={h - 10} textAnchor="end" fontSize={18} fontFamily={FONT} fill="#3a9a4a">
										✓✓ {m.reads}
									</text>
								) : null}
							</g>
						);
					})}
						{typing ? (
							<g transform={`translate(-210,${yy - 64})`}>
								<rect x={0} y={0} width={110} height={50} rx={25} fill="#fff" />
								{[0, 1, 2].map((i) => (
									<circle key={i} cx={30 + i * 25} cy={25 - Math.max(0, Math.sin(t / 3 - i)) * 6} r={7} fill="#9aa3b5" />
								))}
							</g>
						) : null}
					</g>
				</g>
			</g>
	);
};

/* Dark infographic board used for the science facts. */
/* Infographic backdrop. vertical = 1080x1920 for native vertical cards in shorts. */
export const Board: React.FC<{children: React.ReactNode; tint?: string; vertical?: boolean}> = ({children, tint = '#1a2150', vertical}) => {
	const W = vertical ? 1080 : 1920;
	const H = vertical ? 1920 : 1080;
	const {gf} = useShot();
	const ang = useAngle();
	return (
	<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, ${lighten(tint, 0.12)} 0%, ${tint} 55%, #090b1d 100%)`}}>
		<svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{transform: angle2D(ang, gf), transformOrigin: '50% 45%'}}>
			{Array.from({length: Math.ceil(H / 46)}).map((_, i) => (
				<line key={i} x1={0} y1={i * 46} x2={W} y2={i * 46} stroke="#ffffff" opacity={0.03} />
			))}
			{Array.from({length: Math.ceil(W / 46)}).map((_, i) => (
				<line key={'v' + i} x1={i * 46} y1={0} x2={i * 46} y2={H} stroke="#ffffff" opacity={0.03} />
			))}
			{children}
		</svg>
	</AbsoluteFill>
	);
};

/* source of a fact; default bottom-right of a 16:9 card, pass x/y (e.g. 1040, 1880) on vertical cards */
export const Cite: React.FC<{text: string; t: number; x?: number; y?: number}> = ({text, t, x = 1860, y = 1040}) => (
	<text x={x} y={y} textAnchor="end" fontSize={22} fontFamily={FONT} fill="#aab3d6" opacity={interpolate(t, [6, 16], [0, 0.85], clamp)}>
		{text}
	</text>
);
