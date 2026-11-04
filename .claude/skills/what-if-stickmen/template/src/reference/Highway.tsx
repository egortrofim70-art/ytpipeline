import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {Camera, Dust, Grain, Layer, Svg, Vignette} from '../engine/camera';
import {Pose, Stickman} from '../engine/Stickman';

const VP = {x: 1480, y: 592};
const CH = 600; // camera height above road
const P = (lat: number, d: number): [number, number] => [VP.x + lat / d, VP.y + CH / d];

export const HighwaySky: React.FC<{f: number}> = ({f}) => (
	<Svg>
		<defs>
			<linearGradient id="hw-sky" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#2a1f45" />
				<stop offset="0.3" stopColor="#4d3466" />
				<stop offset="0.55" stopColor="#9a5476" />
				<stop offset="0.72" stopColor="#e07a6c" />
				<stop offset="0.82" stopColor="#f6a36a" />
				<stop offset="0.88" stopColor="#ffc985" />
			</linearGradient>
			<radialGradient id="hw-sun">
				<stop offset="0" stopColor="#fff7d6" stopOpacity="1" />
				<stop offset="0.12" stopColor="#ffd890" stopOpacity="0.9" />
				<stop offset="0.45" stopColor="#ff9f6a" stopOpacity="0.35" />
				<stop offset="1" stopColor="#ff8a6a" stopOpacity="0" />
			</radialGradient>
		</defs>
		<rect x={-400} y={-300} width={2800} height={1000} fill="url(#hw-sky)" />
		{Array.from({length: 40}).map((_, i) => (
			<circle key={i} cx={random('st' + i) * 2400 - 200} cy={random('sy' + i) * 260 - 120} r={1 + random('sr' + i) * 1.4} fill="#fff" opacity={0.25 + 0.3 * Math.sin(f / 10 + i)} />
		))}
		{[
			[300, 120, 900, 7, 0.18],
			[900, 190, 1200, 9, 0.22],
			[200, 290, 1400, 6, 0.25],
			[1100, 350, 900, 10, 0.3],
			[500, 430, 1500, 8, 0.35],
			[1400, 470, 800, 5, 0.4],
		].map(([x, y, w, h, o], i) => (
			<ellipse key={i} cx={x + f * (0.15 + i * 0.05)} cy={y} rx={w / 2} ry={h} fill="#ffc0a8" opacity={o} />
		))}
		<circle cx={1560} cy={585} r={520} fill="url(#hw-sun)" />
		<circle cx={1560} cy={590} r={26} fill="#fffbe8" />
		<ellipse cx={1560} cy={590} rx={1100} ry={5} fill="#ffe2b0" opacity={0.5} />
	</Svg>
);

export const HighwayMesas: React.FC = () => (
	<Svg>
		<defs>
			<linearGradient id="hw-haze" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#ffbe86" stopOpacity="0" />
				<stop offset="0.5" stopColor="#ffc98e" stopOpacity="0.75" />
				<stop offset="1" stopColor="#f0a07e" stopOpacity="0" />
			</linearGradient>
		</defs>
		<path d="M-300,600 L-300,560 L120,556 L160,540 L420,538 L470,556 L900,560 L1200,566 L1700,560 L1760,548 L2020,544 L2060,560 L2300,562 L2300,600 Z" fill="#9b6478" opacity={0.55} />
		<rect x={-400} y={520} width={2800} height={130} fill="url(#hw-haze)" />
	</Svg>
);

export const HighwayGround: React.FC<{f: number}> = ({f}) => {
	const speed = 0.11;
	const road = [P(-1700, 0.4), P(-1700, 400), P(160, 400), P(160, 0.4)];
	const dashGap = 2.2;
	const dashes = [];
	for (let i = 0; i < 40; i++) {
		const d = 0.45 + ((i * dashGap - f * speed * 3) % (40 * dashGap) + 40 * dashGap) % (40 * dashGap);
		const d2 = d + 1;
		const w = 16;
		const a = P(-780 - w, d);
		const b = P(-780 + w, d);
		const c = P(-780 + w, d2);
		const e = P(-780 - w, d2);
		dashes.push({d, pts: [a, b, c, e]});
	}
	dashes.sort((x, y) => y.d - x.d);
	const poles = [];
	const gap = 7;
	for (let i = 0; i < 14; i++) {
		const d = 0.7 + ((i * gap - f * speed * 3) % (14 * gap) + 14 * gap) % (14 * gap);
		poles.push(d);
	}
	poles.sort((a, b) => b - a);
	const posts = [];
	for (let i = 0; i < 30; i++) {
		const d = 0.6 + ((i * 3 - f * speed * 3) % 90 + 90) % 90;
		posts.push(d);
	}
	posts.sort((a, b) => b - a);
	const poleTop = (d: number) => {
		const b = P(-3300, d);
		return [b[0], b[1] - 1150 / d] as [number, number];
	};
	return (
		<Svg>
			<defs>
				<linearGradient id="hw-ground" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#e6a07c" />
					<stop offset="0.15" stopColor="#c07a7c" />
					<stop offset="0.5" stopColor="#8a5c78" />
					<stop offset="1" stopColor="#5a4268" />
				</linearGradient>
				<linearGradient id="hw-road" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#a87e92" />
					<stop offset="0.1" stopColor="#64507a" />
					<stop offset="0.6" stopColor="#47395f" />
					<stop offset="1" stopColor="#3a2f52" />
				</linearGradient>
				<linearGradient id="hw-sheen" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#ffb98a" stopOpacity="0" />
					<stop offset="1" stopColor="#ffb98a" stopOpacity="0.35" />
				</linearGradient>
			</defs>
			<rect x={-400} y={VP.y - 2} width={2800} height={900} fill="url(#hw-ground)" />
			<polygon points={road.map((p) => p.join(',')).join(' ')} fill="url(#hw-road)" />
			<polygon points={road.map((p) => p.join(',')).join(' ')} fill="url(#hw-sheen)" />
			{/* shoulder lines */}
			{[-1640, 110].map((lat, i) => {
				const pts = [P(lat - 9, 0.4), P(lat - 9, 400), P(lat + 9, 400), P(lat + 9, 0.4)];
				return <polygon key={i} points={pts.map((p) => p.join(',')).join(' ')} fill="#f4e6e6" opacity={0.85} />;
			})}
			{dashes.map((x, i) => (
				<polygon key={i} points={x.pts.map((p) => p.join(',')).join(' ')} fill="#ffd7a0" opacity={Math.min(1, 6 / x.d)} />
			))}
			{/* road speckles */}
			{Array.from({length: 60}).map((_, i) => {
				const d = 0.5 + ((random('sp' + i) * 30 - f * speed * 3) % 30 + 30) % 30;
				const p = P(-1600 + random('sl' + i) * 1700, d);
				return <ellipse key={i} cx={p[0]} cy={p[1]} rx={5 / d} ry={2.5 / d} fill="#3a2e4c" opacity={0.6} />;
			})}
			{posts.map((d, i) => {
				const b = P(420, d);
				return (
					<g key={i}>
						<rect x={b[0] - 4 / d} y={b[1] - 70 / d} width={8 / d} height={70 / d} fill="#efe2e6" />
						<rect x={b[0] - 4 / d} y={b[1] - 66 / d} width={8 / d} height={14 / d} fill="#ff6a4a" />
					</g>
				);
			})}
			{/* wires */}
			{poles.slice(0, -1).map((d, i) => {
				const a = poleTop(d);
				const b = poleTop(poles[i + 1]);
				return [0, 1, 2].map((k) => {
					const dy = 30 + k * 20;
					const a2: [number, number] = [a[0] + (k - 1) * 50 / d, a[1] + dy / d];
					const b2: [number, number] = [b[0] + (k - 1) * 50 / poles[i + 1], b[1] + dy / poles[i + 1]];
					const mx = (a2[0] + b2[0]) / 2;
					const my = (a2[1] + b2[1]) / 2 + 40 / Math.min(d, poles[i + 1]);
					return <path key={`${i}-${k}`} d={`M${a2.join(',')} Q${mx},${my} ${b2.join(',')}`} stroke="#3a2a48" strokeWidth={Math.max(0.8, 2.4 / Math.min(d, poles[i + 1]))} fill="none" opacity={0.8} />;
				});
			})}
			{poles.map((d, i) => {
				const b = P(-3300, d);
				const t = poleTop(d);
				const w = 16 / d;
				return (
					<g key={i} opacity={Math.min(1, 0.4 + 3 / d)}>
						<rect x={b[0] - w / 2} y={t[1]} width={w} height={b[1] - t[1]} fill="#3d2c4a" />
						<rect x={b[0] - 70 / d} y={t[1] + 26 / d} width={140 / d} height={9 / d} fill="#3d2c4a" />
					</g>
				);
			})}
		</Svg>
	);
};

const runPose = (ph: number): Pose => {
	const s = Math.sin(ph);
	const c = Math.cos(ph);
	return {
		lean: 46 + 3 * Math.sin(ph * 2),
		head: -34,
		armF: [-35 * s + 10, 70 + 20 * c],
		armB: [35 * s + 10, 70 - 20 * c],
		legF: [45 + 45 * s, 40 + 50 * Math.max(0, -c)],
		legB: [45 - 45 * s, 40 + 50 * Math.max(0, c)],
	};
};

export const HighwaySparks: React.FC<{f: number; cx: number; cy: number}> = ({f, cx, cy}) => {
	const t = Math.floor(f / 3);
	return (
		<g>
			{Array.from({length: 5}).map((_, i) => {
				const r = (k: string) => random(`spk-${t}-${i}-${k}`);
				if (r('on') < 0.35) return null;
				const x0 = cx + (r('x') - 0.5) * 360;
				const y0 = cy + (r('y') - 0.5) * 300;
				let d = `M${x0},${y0}`;
				let x = x0;
				let y = y0;
				for (let k = 0; k < 4; k++) {
					x += (r('dx' + k) - 0.5) * 30;
					y += 14 + r('dy' + k) * 14;
					d += ` L${x},${y}`;
				}
				return (
					<g key={i}>
						<path d={d} stroke="#9fd8ff" strokeWidth={7} fill="none" opacity={0.35} strokeLinejoin="round" />
						<path d={d} stroke="#f2fbff" strokeWidth={2.2} fill="none" strokeLinejoin="round" />
					</g>
				);
			})}
		</g>
	);
};

export const Highway: React.FC = () => {
	const f = useCurrentFrame();
	const e = Easing.inOut(Easing.cubic);
	const cam = {
		x: interpolate(f, [0, 150], [-90, 70], {easing: e}),
		y: interpolate(f, [0, 150], [30, -10], {easing: e}),
		zoom: interpolate(f, [0, 150], [1.0, 1.12], {easing: e}),
		focus: 1,
		farBlur: 2,
		nearBlur: 10,
	};
	const ph = f * 0.42;
	const bob = -10 * Math.abs(Math.sin(ph));
	return (
		<AbsoluteFill style={{background: '#2a1f45'}}>
			<Camera cam={cam}>
				<Layer depth={14}>
					<HighwaySky f={f} />
				</Layer>
				<Layer depth={8}>
					<HighwayMesas />
				</Layer>
				<Layer depth={2.6}>
					<HighwayGround f={f} />
				</Layer>
				<Layer depth={1}>
					<Svg>
						<ellipse cx={760} cy={985} rx={200} ry={22} fill="#2a1f3a" opacity={0.35} />
						<Stickman
							id="runner"
							x={700}
							y={760 + bob}
							scale={1.9}
							pose={runPose(ph)}
							color="#f2b21c"
							shoe="#f2b21c"
							expr="angry"
							look={[0.5, -0.1]}
							mouth="flat"
							faceTurn={0.9}
							rim="#ffae6e"
							rimW={2}
							light={[2.5, -2]}
						/>
						<HighwaySparks f={f} cx={760} cy={800} />
					</Svg>
				</Layer>
				<Layer depth={0.55}>
					<Dust seed="hw-fg" n={14} color="#ffd9b0" size={[5, 12]} speed={1.2} opacity={0.5} />
				</Layer>
			</Camera>
			{/* sun bloom + horizon flare */}
			<AbsoluteFill
				style={{
					mixBlendMode: 'screen',
					background: 'radial-gradient(ellipse 40% 30% at 80% 55%, rgba(255,190,120,0.45), rgba(255,140,100,0) 70%)',
				}}
			/>
			<Dust seed="hw-mid" n={50} color="#ffe6c8" size={[1, 2.6]} speed={0.6} opacity={0.5} />
			<Vignette strength={0.5} color="20,10,40" />
			<Grain opacity={0.14} />
		</AbsoluteFill>
	);
};
