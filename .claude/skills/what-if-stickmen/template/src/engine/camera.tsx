import React, {createContext, useContext} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

export type Cam = {x: number; y: number; zoom: number; focus: number; farBlur?: number; nearBlur?: number};
const Ctx = createContext<Cam>({x: 0, y: 0, zoom: 1, focus: 1});

export const Camera: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => (
	<Ctx.Provider value={cam}>
		<AbsoluteFill style={{overflow: 'hidden'}}>{children}</AbsoluteFill>
	</Ctx.Provider>
);

// A flat plane at a given distance from the camera. depth 1 = focal subject plane,
// >1 farther (moves and scales less, softly blurred), <1 closer (moves more, strongly blurred).
export const Layer: React.FC<{depth: number; children: React.ReactNode; blend?: React.CSSProperties['mixBlendMode']; opacity?: number; sharp?: boolean}> = ({
	depth,
	children,
	blend,
	opacity,
	sharp,
}) => {
	const c = useContext(Ctx);
	const k = 1 / depth;
	const s = 1 + (c.zoom - 1) * k;
	const dk = k - 1 / c.focus;
	const b = dk < 0 ? -dk * (c.farBlur ?? 2.5) : dk * (c.nearBlur ?? 9);
	return (
		<AbsoluteFill
			style={{
				transform: `translate(${-c.x * k}px, ${-c.y * k}px) scale(${s})`,
				filter: b > 0.25 && !sharp ? `blur(${b.toFixed(2)}px)` : undefined,
				mixBlendMode: blend,
				opacity,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

export const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
	<svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
		{children}
	</svg>
);

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.18}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{mixBlendMode: 'overlay', opacity, pointerEvents: 'none'}}>
			<svg width={1920} height={1080}>
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 9} />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.55, color = '0,0,0'}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse at 50% 50%, rgba(${color},0) 55%, rgba(${color},${strength}) 100%)`,
			pointerEvents: 'none',
		}}
	/>
);

export const Dust: React.FC<{n?: number; seed: string; color?: string; size?: [number, number]; speed?: number; opacity?: number}> = ({
	n = 40,
	seed,
	color = '#fff',
	size = [1.5, 4],
	speed = 0.4,
	opacity = 0.6,
}) => {
	const f = useCurrentFrame();
	return (
		<Svg>
			{Array.from({length: n}).map((_, i) => {
				const r = (k: string) => random(`${seed}-${i}-${k}`);
				const x = ((r('x') * 2200 + f * speed * (r('vx') - 0.3) * 2) % 2200) - 140;
				const y = r('y') * 1180 - 50 + Math.sin(f / 40 + r('p') * 6) * 14 - f * speed * r('vy') * 0.6;
				const s = size[0] + r('s') * (size[1] - size[0]);
				const o = opacity * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(f / 18 + r('o') * 9)));
				return <circle key={i} cx={x} cy={y} r={s} fill={color} opacity={o} />;
			})}
		</Svg>
	);
};

export const Letterbox: React.FC<{h?: number}> = ({h = 34}) => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<div style={{position: 'absolute', top: 0, left: 0, right: 0, height: h, background: '#000'}} />
		<div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: h, background: '#000'}} />
	</AbsoluteFill>
);
