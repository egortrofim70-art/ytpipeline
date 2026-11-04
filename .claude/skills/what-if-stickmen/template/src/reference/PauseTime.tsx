import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera, Grain, Layer, Svg, Vignette} from '../engine/camera';
import {darken, lighten} from '../engine/color';
import {frontHand, Pose, Stickman} from '../engine/Stickman';

/* ---------------------------------------------------------------------------
   Timeline (30 fps, 300 frames)
   A  0–99   wide: rainy night bus stop, car rushes in toward the puddle
   B  100–159 close-up: hero smirks, raises hand, SNAP -> world freezes
   C  160–299 wide: frozen world (desaturated), hero walks out of the splash,
             counter runs out, time resumes, splash lands on the empty spot
--------------------------------------------------------------------------- */
const SNAP = 130;
const FREEZE_AT = 131; // world time stops at this value
const RESUME = 252;
const worldTime = (f: number) => (f <= FREEZE_AT ? f : f < RESUME ? FREEZE_AT : FREEZE_AT + (f - RESUME));

const HERO = '#f2b21c';
const HS = 0.95; // hero scale in wide shots
const HIP = 905 - 147; // hip height so the shoes sit on the sidewalk
const LAMP_T = 'translate(760,905) scale(1.25) translate(-760,-905)';
const SHELTER_T = 'translate(1470,905) scale(1.7) translate(-1470,-905)';
const FACADE_T = 'translate(960,880) scale(1.35) translate(-960,-880)';
const PUDDLE_X = 1000;
const SIDEWALK_Y = 905;
const SPLASH_T0 = 124; // world time when the front wheel hits the puddle
const CAR_SPEED = 40;
const wheelX = (wt: number) => PUDDLE_X + CAR_SPEED * (wt - SPLASH_T0);

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.inOut(Easing.cubic);

/* ----------------------------- background -------------------------------- */

export const Sky: React.FC<{wt: number}> = ({wt}) => (
	<Svg>
		<defs>
			<linearGradient id="pt-sky" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#070b1f" />
				<stop offset="0.55" stopColor="#141c44" />
				<stop offset="1" stopColor="#2a2f63" />
			</linearGradient>
			<radialGradient id="pt-moon">
				<stop offset="0" stopColor="#dfe6ff" stopOpacity="0.55" />
				<stop offset="1" stopColor="#8fa0ff" stopOpacity="0" />
			</radialGradient>
		</defs>
		<rect x={-400} y={-300} width={2800} height={1300} fill="url(#pt-sky)" />
		{Array.from({length: 70}).map((_, i) => (
			<circle
				key={i}
				cx={random('ps' + i) * 2600 - 300}
				cy={random('py' + i) * 520 - 150}
				r={0.8 + random('pr' + i) * 1.5}
				fill="#fff"
				opacity={0.25 + 0.35 * (0.5 + 0.5 * Math.sin(wt / 9 + i * 1.7))}
			/>
		))}
		<circle cx={1560} cy={150} r={170} fill="url(#pt-moon)" />
		<circle cx={1560} cy={150} r={44} fill="#eef1ff" />
		<circle cx={1574} cy={140} r={9} fill="#d6dcf5" />
		<circle cx={1548} cy={164} r={6} fill="#d6dcf5" />
		{[
			[300, 120, 700, 26],
			[1300, 230, 900, 22],
			[700, 330, 1200, 18],
		].map(([x, y, w, h], i) => (
			<ellipse key={i} cx={x + wt * 0.25} cy={y} rx={w / 2} ry={h} fill="#3a4180" opacity={0.35} />
		))}
	</Svg>
);

export const Skyline: React.FC<{wt: number}> = ({wt}) => {
	const blds = [
		[-300, 330, 260],
		[-60, 250, 180],
		[110, 380, 220],
		[300, 200, 170],
		[450, 300, 260],
		[690, 160, 150],
		[820, 280, 230],
		[1030, 220, 200],
		[1210, 340, 170],
		[1360, 260, 260],
		[1600, 190, 180],
		[1760, 310, 230],
		[1970, 230, 260],
	];
	return (
		<Svg>
			{blds.map(([x, top, w], i) => (
				<g key={i}>
					<rect x={x} y={top} width={w} height={800} fill={i % 2 ? '#141a38' : '#18204a'} />
					{Array.from({length: Math.floor(w / 34)}).map((_, c) =>
						Array.from({length: 12}).map((__, r) => {
							const k = `${i}-${c}-${r}`;
							if (random('w' + k) > 0.32) return null;
							const flick = random('f' + k) > 0.92 ? (Math.sin(wt * 0.6 + random('fp' + k) * 9) > 0 ? 1 : 0.25) : 1;
							return <rect key={k} x={x + 12 + c * 34} y={top + 20 + r * 40} width={14} height={18} fill={random('c' + k) > 0.3 ? '#ffd27a' : '#9fd8ff'} opacity={0.55 * flick} />;
						}),
					)}
				</g>
			))}
			<rect x={1440} y={140} width={6} height={130} fill="#141a38" />
			<circle cx={1443} cy={138} r={6} fill="#ff4a4a" opacity={Math.floor(wt / 20) % 2 ? 1 : 0.15} />
			<rect x={-400} y={520} width={2800} height={300} fill="#1a2150" opacity={0.35} />
		</Svg>
	);
};

export const Neon: React.FC<{x: number; y: number; text: string; c: string; size: number; on: number}> = ({x, y, text, c, size, on}) => (
	<g opacity={0.25 + 0.75 * on}>
		<text x={x} y={y} fontSize={size} fontFamily="'Rubik', sans-serif" fontWeight={900} fill="none" stroke={c} strokeWidth={10} opacity={0.35} style={{filter: 'blur(6px)'}}>
			{text}
		</text>
		<text x={x} y={y} fontSize={size} fontFamily="'Rubik', sans-serif" fontWeight={900} fill={lighten(c, 0.55)} stroke={c} strokeWidth={2}>
			{text}
		</text>
	</g>
);

export const Facades: React.FC<{wt: number}> = ({wt}) => {
	const flicker = (s: string) => (random(s + Math.floor(wt / 3)) > 0.93 ? 0 : 1);
	return (
		<Svg>
			<g transform={FACADE_T}>
			<defs>
				<linearGradient id="pt-win" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#ffd98f" />
					<stop offset="1" stopColor="#f2a24c" />
				</linearGradient>
			</defs>
			{/* noodle shop */}
			<rect x={-320} y={160} width={900} height={720} fill="#232a55" />
			<rect x={-320} y={160} width={900} height={14} fill="#2e3768" />
			{[0, 1, 2, 3].map((i) => (
				<g key={i}>
					<rect x={-260 + i * 210} y={220} width={130} height={150} fill={i === 2 ? '#1a1f40' : 'url(#pt-win)'} opacity={i === 2 ? 1 : 0.85} />
					<rect x={-260 + i * 210} y={290} width={130} height={6} fill="#232a55" />
					<rect x={-264 + i * 210} y={366} width={138} height={10} fill="#2e3768" />
				</g>
			))}
			<rect x={-300} y={520} width={860} height={44} fill="#c0453b" />
			{Array.from({length: 11}).map((_, i) => (
				<path key={i} d={`M${-300 + i * 78},564 q39,34 78,0`} fill={i % 2 ? '#e6e0d0' : '#c0453b'} />
			))}
			<rect x={-280} y={600} width={820} height={270} fill="#ffc977" opacity={0.85} />
			<rect x={-280} y={600} width={820} height={270} fill="#ff8a5a" opacity={0.25} />
			{[[-180, 1.1], [60, 0.9], [330, 1]].map(([x, s], i) => (
				<g key={i} transform={`translate(${x},870) scale(${s})`}>
					<circle cx={0} cy={-170} r={30} fill="#5a3a40" opacity={0.75} />
					<rect x={-28} y={-140} width={56} height={140} rx={22} fill="#5a3a40" opacity={0.75} />
				</g>
			))}
			<rect x={-280} y={780} width={820} height={18} fill="#8a5a3a" />
			{[-200, -40, 120, 280, 440].map((x, i) => (
				<g key={i}>
					<path d={`M${x},700 l10,-50 h30 l10,50 z`} fill="#fff4d8" opacity={0.85} />
					<circle cx={x + 25} cy={712} r={14} fill="#e94d4d" opacity={0.8} />
				</g>
			))}
			<Neon x={110} y={490} text="NOODLES" c="#ff4f8b" size={68} on={flicker('n1')} />
			{/* apartment entrance */}
			<rect x={580} y={60} width={720} height={820} fill="#1c2247" />
			{[0, 1, 2].map((r) =>
				[0, 1, 2, 3].map((c) => {
					const lit = random(`ap${r}${c}`) > 0.4;
					return (
						<g key={`${r}${c}`}>
							<rect x={630 + c * 170} y={120 + r * 150} width={100} height={110} fill={lit ? 'url(#pt-win)' : '#121735'} opacity={lit ? 0.75 : 1} />
							<rect x={624 + c * 170} y={228 + r * 150} width={112} height={9} fill="#283063" />
							{lit && random(`aps${r}${c}`) > 0.5 ? <rect x={630 + c * 170} y={120 + r * 150} width={40} height={110} fill="#c97a3a" opacity={0.5} /> : null}
						</g>
					);
				}),
			)}
			<rect x={840} y={600} width={200} height={280} fill="#2b3366" />
			<rect x={858} y={618} width={164} height={262} fill="#ffcf80" opacity={0.6} />
			<rect x={936} y={618} width={8} height={262} fill="#2b3366" />
			<rect x={820} y={580} width={240} height={22} fill="#39427d" />
			<circle cx={940} cy={560} r={10} fill="#fff1c8" />
			<circle cx={940} cy={560} r={40} fill="#ffd98f" opacity={0.2} />
			<rect x={600} y={480} width={70} height={60} fill="#3a4378" />
			<rect x={610} y={540} width={6} height={340} fill="#3a4378" />
			{/* laundromat */}
			<rect x={1300} y={240} width={950} height={640} fill="#202853" />
			<rect x={1360} y={300} width={820} height={130} fill="#1a2046" />
			<Neon x={1395} y={400} text="LAUNDRY" c="#3fe0e8" size={74} on={flicker('n2')} />
			<rect x={1340} y={520} width={860} height={350} fill="#9fe6ee" opacity={0.55} />
			{[0, 1, 2, 3, 4].map((i) => (
				<g key={i}>
					<rect x={1370 + i * 165} y={700} width={130} height={170} fill="#e9eef5" />
					<circle cx={1435 + i * 165} cy={790} r={46} fill="#4b6a8a" />
					<circle cx={1435 + i * 165} cy={790} r={36} fill="#7fb3d9" />
					<path
						d={`M${1405 + i * 165},${795 + Math.sin(wt / 6 + i) * 6} q15,-12 30,0 t30,0`}
						stroke="#d6f0ff"
						strokeWidth={6}
						fill="none"
						transform={`rotate(${(wt * 9 + i * 70) % 360} ${1435 + i * 165} 790)`}
					/>
				</g>
			))}
			</g>
			<rect x={-400} y={870} width={2800} height={14} fill="#11152e" />
		</Svg>
	);
};

export const Ripples: React.FC<{wt: number; seed: string; n: number; area: [number, number, number, number]; color?: string}> = ({wt, seed, n, area, color = '#a9c2f2'}) => (
	<>
		{Array.from({length: n}).map((_, i) => {
			const r = (k: string) => random(`${seed}${i}${k}`);
			const P = 22 + r('p') * 14;
			const t = ((wt + r('o') * P) % P) / P;
			const cycle = Math.floor((wt + r('o') * P) / P);
			const x = area[0] + random(`${seed}${i}x${cycle}`) * area[2];
			const y = area[1] + random(`${seed}${i}y${cycle}`) * area[3];
			const rx = 3 + 24 * t;
			return <ellipse key={i} cx={x} cy={y} rx={rx} ry={rx * 0.28} stroke={color} strokeWidth={1.6} fill="none" opacity={(1 - t) * 0.7} />;
		})}
	</>
);

export const Street: React.FC<{wt: number}> = ({wt}) => (
	<Svg>
		<defs>
			<linearGradient id="pt-walk" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#3a4374" />
				<stop offset="1" stopColor="#2a3160" />
			</linearGradient>
			<linearGradient id="pt-road" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#1d2245" />
				<stop offset="1" stopColor="#12152d" />
			</linearGradient>
			<linearGradient id="pt-refl" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#fff" stopOpacity="0.9" />
				<stop offset="1" stopColor="#fff" stopOpacity="0" />
			</linearGradient>
		</defs>
		<rect x={-400} y={880} width={2800} height={80} fill="url(#pt-walk)" />
		{Array.from({length: 30}).map((_, i) => (
			<rect key={i} x={-380 + i * 100} y={884} width={3} height={74} fill="#2a3160" />
		))}
		<rect x={-400} y={958} width={2800} height={20} fill="#4a5490" />
		<rect x={-400} y={976} width={2800} height={400} fill="url(#pt-road)" />
		{/* neon reflections on wet asphalt */}
		{[
			[-150, 560, '#ff4f8b', 0.28],
			[860, 120, '#ffd98f', 0.32],
			[1420, 700, '#3fe0e8', 0.22],
		].map(([x, w, c, o], i) => (
			<g key={i} style={{filter: 'blur(10px)'}}>
				<rect x={x as number} y={890} width={w as number} height={60} fill={c as string} opacity={(o as number) * 0.7} />
				<rect x={x as number} y={985} width={w as number} height={210} fill="url(#pt-refl)" opacity={o as number} style={{mixBlendMode: 'screen'}} />
			</g>
		))}
		{Array.from({length: 9}).map((_, i) => (
			<rect key={i} x={-300 + i * 300} y={1066} width={150} height={10} rx={4} fill="#c9cfe6" opacity={0.35} />
		))}
		{/* puddle */}
		<ellipse cx={PUDDLE_X} cy={1010} rx={210} ry={26} fill="#0c0f22" />
		<ellipse cx={PUDDLE_X} cy={1010} rx={210} ry={26} fill="#5b6cc0" opacity={0.25} />
		<ellipse cx={PUDDLE_X - 60} cy={1006} rx={60} ry={6} fill="#ffd98f" opacity={0.45} />
		<Ripples wt={wt} seed="pud" n={7} area={[PUDDLE_X - 170, 1000, 340, 20]} color="#c8d6ff" />
		<Ripples wt={wt} seed="walk" n={16} area={[-200, 892, 2300, 60]} />
		<Ripples wt={wt} seed="road" n={18} area={[-200, 1000, 2300, 90]} color="#8798d6" />
	</Svg>
);

/* Lamp post standing on the sidewalk; its cone of light is drawn separately (screen blend). */
export const LampPost: React.FC<{wt: number}> = ({wt}) => (
	<Svg>
		<g transform={LAMP_T}>
		<rect x={752} y={300} width={16} height={600} fill="#151a35" />
		<rect x={744} y={880} width={32} height={22} rx={4} fill="#151a35" />
		<path d="M760,310 q0,-40 60,-40 h60" stroke="#151a35" strokeWidth={12} fill="none" />
		<path d="M840,262 h80 l-10,30 h-60 z" fill="#1d2347" />
		<rect x={856} y={290} width={48} height={8} rx={4} fill="#fff4cf" opacity={0.9 + 0.1 * Math.sin(wt)} />
		</g>
	</Svg>
);

export const LampCone: React.FC = () => (
	<Svg>
		<defs>
			<linearGradient id="pt-cone" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#ffe3a0" stopOpacity="0.55" />
				<stop offset="1" stopColor="#ffb860" stopOpacity="0.05" />
			</linearGradient>
			<radialGradient id="pt-pool">
				<stop offset="0" stopColor="#ffd68a" stopOpacity="0.55" />
				<stop offset="1" stopColor="#ffd68a" stopOpacity="0" />
			</radialGradient>
		</defs>
		<g transform={LAMP_T}>
		<polygon points="856,296 904,296 1150,905 610,905" fill="url(#pt-cone)" />
		<ellipse cx={880} cy={910} rx={330} ry={40} fill="url(#pt-pool)" />
		<circle cx={880} cy={300} r={46} fill="#fff1c8" opacity={0.18} />
		</g>
	</Svg>
);

export const Shelter: React.FC = () => (
	<Svg>
		<g transform={SHELTER_T}>
		<rect x={1290} y={640} width={360} height={18} rx={4} fill="#2b3366" />
		<rect x={1300} y={656} width={10} height={250} fill="#2b3366" />
		<rect x={1630} y={656} width={10} height={250} fill="#2b3366" />
		<rect x={1310} y={670} width={320} height={190} fill="#9fd8ff" opacity={0.12} />
		<line x1={1330} y1={680} x2={1380} y2={850} stroke="#fff" strokeWidth={3} opacity={0.15} />
		{/* lit advert */}
		<rect x={1500} y={676} width={118} height={170} fill="#e9f3ff" />
		<rect x={1506} y={682} width={106} height={158} fill="#3b6fd8" />
		<path d="M1530,760 a29,29 0 0 1 58,0 z" fill="#ffd34a" />
		<line x1={1559} y1={760} x2={1559} y2={796} stroke="#ffd34a" strokeWidth={4} />
		<line x1={1522} y1={712} x2={1598} y2={808} stroke="#ff4a4a" strokeWidth={7} strokeLinecap="round" />
		<text x={1559} y={830} fontSize={18} fill="#fff" textAnchor="middle" fontFamily="'Rubik', sans-serif">
			RAIN 100%
		</text>
		<rect x={1320} y={840} width={160} height={14} rx={4} fill="#3a4378" />
		<rect x={1700} y={600} width={8} height={304} fill="#2b3366" />
		<rect x={1676} y={560} width={56} height={56} rx={10} fill="#2f5fd0" stroke="#e9f3ff" strokeWidth={4} />
		<text x={1704} y={600} fontSize={30} fill="#fff" textAnchor="middle" fontFamily="'Rubik', sans-serif">
			9
		</text>
		</g>
	</Svg>
);

/* --------------------------------- rain ---------------------------------- */

export const Rain: React.FC<{wt: number; seed: string; n: number; len: number; w: number; speed: number; color: string; opacity: number; shelter?: boolean}> = ({
	wt,
	seed,
	n,
	len,
	w,
	speed,
	color,
	opacity,
	shelter,
}) => (
	<Svg>
		{Array.from({length: n}).map((_, i) => {
			const r = (k: string) => random(`${seed}${i}${k}`);
			const H = 1400;
			const y = ((r('y') * H + wt * speed * (0.8 + r('s') * 0.4)) % H) - 160;
			const x = r('x') * 2500 - 300 - y * 0.12;
			if (shelter && x > 1160 && x < 1780 && y > 455) return null;
			return <line key={i} x1={x} y1={y} x2={x - len * 0.12} y2={y + len} stroke={color} strokeWidth={w} strokeLinecap="round" opacity={opacity * (0.5 + r('o') * 0.5)} />;
		})}
	</Svg>
);

/* --------------------------------- car ----------------------------------- */

export const Car: React.FC<{wt: number; moving: boolean}> = ({wt, moving}) => {
	const wx = wheelX(wt);
	const spin = wt * CAR_SPEED * 1.25;
	const body = '#c0453b';
	const wheel = (x: number) => (
		<g transform={`translate(${x},0)`}>
			<circle r={47} fill="#0d0f1c" />
			<circle r={26} fill="#8c93ad" />
			<g transform={`rotate(${spin})`}>
				{[0, 72, 144, 216, 288].map((a) => (
					<rect key={a} x={-3} y={-24} width={6} height={20} fill="#454b66" transform={`rotate(${a})`} />
				))}
			</g>
			<circle r={7} fill="#c9cede" />
		</g>
	);
	return (
		<Svg>
			<defs>
				<linearGradient id="pt-beam" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#fff2b8" stopOpacity="0.55" />
					<stop offset="1" stopColor="#fff2b8" stopOpacity="0" />
				</linearGradient>
			</defs>
			<g transform={`translate(${wx},1040) scale(1.02)`}>
				<polygon points="112,-72 760,-170 760,60" fill="url(#pt-beam)" style={{mixBlendMode: 'screen'}} />
				{moving
					? [-40, -70, -100].map((y, i) => (
							<line key={i} x1={-470 - i * 40} y1={y} x2={-700 - i * 60} y2={y} stroke="#c9d6ff" strokeWidth={3} opacity={0.35} strokeLinecap="round" />
						))
					: null}
				<ellipse cx={-170} cy={46} rx={330} ry={14} fill="#05060f" opacity={0.6} />
				<path d="M-450,-20 L-450,-92 Q-440,-108 -400,-110 L-330,-114 L-270,-178 Q-255,-190 -230,-190 L-110,-190 Q-80,-190 -60,-170 L10,-112 L95,-104 Q125,-98 128,-70 L128,-20 Q120,8 90,8 L-430,8 Q-450,4 -450,-20 Z" fill={body} />
				<path d="M-440,-92 Q-430,-104 -400,-106 L95,-100" stroke={lighten(body, 0.4)} strokeWidth={5} fill="none" opacity={0.8} />
				<path d="M-450,-30 L128,-30 L128,-20 Q120,8 90,8 L-430,8 Q-450,4 -450,-20 Z" fill={darken(body, 0.35)} />
				<path d="M-310,-114 L-262,-170 Q-252,-178 -236,-178 L-180,-178 L-180,-114 Z" fill="#1d2a52" />
				<path d="M-166,-178 L-112,-178 Q-88,-178 -72,-162 L-20,-114 L-166,-114 Z" fill="#1d2a52" />
				<line x1={-250} y1={-170} x2={-220} y2={-120} stroke="#cfe0ff" strokeWidth={6} opacity={0.35} />
				<line x1={-120} y1={-170} x2={-90} y2={-124} stroke="#cfe0ff" strokeWidth={6} opacity={0.35} />
				<rect x={-200} y={-80} width={26} height={7} rx={3} fill={darken(body, 0.45)} />
				<line x1={-180} y1={-110} x2={-180} y2={-30} stroke={darken(body, 0.3)} strokeWidth={3} />
				<ellipse cx={112} cy={-70} rx={14} ry={11} fill="#fff6c8" />
				<circle cx={112} cy={-70} r={34} fill="#fff2b8" opacity={0.35} />
				<rect x={-452} y={-86} width={12} height={24} rx={3} fill="#ff3a3a" />
				<circle cx={-450} cy={-74} r={26} fill="#ff3a3a" opacity={0.25} />
				{wheel(0)}
				{wheel(-330)}
			</g>
		</Svg>
	);
};

/* -------------------------------- splash --------------------------------- */

const SPLASH_N = 46;
const G = 2.2;
export const Splash: React.FC<{wt: number}> = ({wt}) => {
	const u = wt - SPLASH_T0;
	if (u < 0) return null;
	const sheetGrow = interpolate(u, [0, 8], [0, 1], clamp);
	const sheetFade = interpolate(u, [9, 16], [1, 0], clamp);
	return (
		<Svg>
			<defs>
				<linearGradient id="pt-water" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#e8f4ff" stopOpacity="0.85" />
					<stop offset="1" stopColor="#7fa8e6" stopOpacity="0.25" />
				</linearGradient>
			</defs>
			{sheetFade > 0 ? (
				<g opacity={sheetFade * 0.6}>
					<path
						d={`M${PUDDLE_X - 150},1010 C${PUDDLE_X - 210},${1010 - 260 * sheetGrow} ${PUDDLE_X - 40},${1010 - 330 * sheetGrow} ${PUDDLE_X + 40},${1010 - 300 * sheetGrow} C${PUDDLE_X + 10},${1010 - 200 * sheetGrow} ${PUDDLE_X - 30},${1010 - 80 * sheetGrow} ${PUDDLE_X + 60},1010 Z`}
						fill="url(#pt-water)"
					/>
					<path
						d={`M${PUDDLE_X + 20},1010 C${PUDDLE_X + 40},${1010 - 220 * sheetGrow} ${PUDDLE_X + 160},${1010 - 280 * sheetGrow} ${PUDDLE_X + 220},${1010 - 230 * sheetGrow} C${PUDDLE_X + 150},${1010 - 170 * sheetGrow} ${PUDDLE_X + 120},${1010 - 60 * sheetGrow} ${PUDDLE_X + 170},1010 Z`}
						fill="url(#pt-water)"
						opacity={0.8}
					/>
				</g>
			) : null}
			{Array.from({length: SPLASH_N}).map((_, i) => {
				const r = (k: string) => random(`spl${i}${k}`);
				const vx = (r('vx') - 0.5) * 18;
				const vy = -26 - r('vy') * 14;
				const delay = r('d') * 4;
				const t = u - delay;
				if (t < 0) return null;
				const landY = SIDEWALK_Y + r('ly') * 40;
				const x = PUDDLE_X + (r('x0') - 0.5) * 260 + vx * t;
				const y = 1008 + vy * t + 0.5 * G * t * t;
				if (vy + G * t > 0 && y > landY) return null;
				const ang = (Math.atan2(vy + G * t, vx) * 180) / Math.PI;
				const s = 3 + r('s') * 7;
				return (
					<g key={i} transform={`translate(${x},${y}) rotate(${ang})`}>
						<ellipse rx={s * 2.2} ry={s * 0.55} fill="#cfe4ff" opacity={0.85} />
						<ellipse cx={s * 0.5} cy={-s * 0.2} rx={s * 0.6} ry={s * 0.25} fill="#fff" />
					</g>
				);
			})}
		</Svg>
	);
};

const IMPACT = SPLASH_T0 + 22; // world time the water lands on the sidewalk
export const Impact: React.FC<{wt: number}> = ({wt}) => {
	const t = wt - IMPACT;
	if (t < 0 || t > 40) return null;
	const k = interpolate(t, [0, 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<Svg>
			{[0, 1, 2].map((i) => {
				const kk = interpolate(t - i * 4, [0, 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
				return <ellipse key={i} cx={PUDDLE_X + 20} cy={918} rx={40 + 260 * kk} ry={8 + 30 * kk} stroke="#d8e6ff" strokeWidth={4 - i} fill="none" opacity={(1 - kk) * 0.9} />;
			})}
			<ellipse cx={PUDDLE_X + 20} cy={920} rx={80 + 120 * k} ry={14 + 10 * k} fill="#5d76c8" opacity={0.45 * (1 - t / 40)} />
			{Array.from({length: 18}).map((_, i) => {
				const a = (-160 + (i / 17) * 140) * (Math.PI / 180);
				const sp = 7 + random('cr' + i) * 9;
				const x = PUDDLE_X + 20 + Math.cos(a) * sp * t;
				const y = 912 + Math.sin(a) * sp * t + 0.6 * t * t;
				if (y > 935) return null;
				return <circle key={i} cx={x} cy={y} r={3 + random('crs' + i) * 4} fill="#e1edff" />;
			})}
		</Svg>
	);
};

/* ------------------------------ UI elements ------------------------------ */

const TimeBadge: React.FC<{x: number; y: number; value: string; pop: number; glow: number; s?: number; paused: boolean}> = ({x, y, value, pop, glow, s = 1, paused}) => {
	const c = paused ? '#7ff0ff' : '#ffd36a';
	return (
		<g transform={`translate(${x},${y}) scale(${s * pop})`}>
			<rect x={-122} y={-34} width={252} height={68} rx={34} fill={c} opacity={0.25 * glow} style={{filter: 'blur(12px)'}} />
			<rect x={-114} y={-30} width={236} height={60} rx={30} fill="#0f1430" stroke={c} strokeWidth={4} />
			<path d="M-8,30 L0,44 L8,30 Z" fill={c} />
			{paused ? (
				<g fill={c}>
					<rect x={-92} y={-14} width={9} height={28} rx={2} />
					<rect x={-78} y={-14} width={9} height={28} rx={2} />
				</g>
			) : (
				<path d="M-92,-14 L-68,0 L-92,14 Z" fill={c} />
			)}
			<text x={-58} y={9} fontSize={24} fontFamily="'Rubik', sans-serif" fill={lighten(c, 0.6)} letterSpacing={2}>
				TIME
			</text>
			<text x={70} y={13} fontSize={36} textAnchor="middle" fontFamily="'Rubik', sans-serif" fill="#fff">
				{value}
			</text>
		</g>
	);
};

export const Onoma: React.FC<{x: number; y: number; text: string; t: number; c: string; rot?: number; size?: number}> = ({x, y, text, t, c, rot = -8, size = 64}) => {
	if (t < 0 || t > 26) return null;
	const s = interpolate(t, [0, 4, 7], [0.2, 1.25, 1], clamp);
	const o = interpolate(t, [18, 26], [1, 0], clamp);
	return (
		<g transform={`translate(${x},${y - t * 1.2}) rotate(${rot}) scale(${s})`} opacity={o}>
			<text textAnchor="middle" fontSize={size} fontFamily="'Rubik', sans-serif" fill="#10132a" stroke="#10132a" strokeWidth={14} strokeLinejoin="round">
				{text}
			</text>
			<text textAnchor="middle" fontSize={size} fontFamily="'Rubik', sans-serif" fill={c}>
				{text}
			</text>
		</g>
	);
};

/* -------------------------------- poses ---------------------------------- */

const idle = (f: number): Pose => ({
	lean: 2 + Math.sin(f / 22) * 1.2,
	head: Math.sin(f / 30) * 2,
	armB: [-4, 18],
	armF: [6 + Math.sin(f / 22) * 1.5, 22],
	legB: [-3, 2],
	legF: [5, 3],
});

const walk = (ph: number): Pose => ({
	lean: 6,
	head: -4,
	armF: [-24 * Math.sin(ph), 22 + 10 * Math.max(0, -Math.sin(ph))],
	armB: [24 * Math.sin(ph), 22 + 10 * Math.max(0, Math.sin(ph))],
	legF: [28 * Math.sin(ph), 6 + 38 * Math.max(0, Math.cos(ph))],
	legB: [-28 * Math.sin(ph), 6 + 38 * Math.max(0, -Math.cos(ph))],
});

/* ------------------------------ world (wide) ----------------------------- */

const World: React.FC<{wt: number; carMoving: boolean; hero: React.ReactNode; fx?: React.ReactNode; look?: string}> = ({wt, carMoving, hero, fx, look}) => {
	const L: React.FC<{children: React.ReactNode}> = ({children}) => (look ? <AbsoluteFill style={{filter: look}}>{children}</AbsoluteFill> : <>{children}</>);
	return (
	<>
		<Layer depth={14}>
			<L>
			<Sky wt={wt} />
		</L>
		</Layer>
		<Layer depth={4}>
			<L>
			<Skyline wt={wt} />
		</L>
		</Layer>
		<Layer depth={1.25}>
			<L>
			<Facades wt={wt} />
		</L>
		</Layer>
		<Layer depth={1.25}>
			<L>
			<Rain wt={wt} seed="rfar" n={160} len={22} w={1.5} speed={30} color="#8da2e0" opacity={0.45} />
		</L>
		</Layer>
		<Layer depth={1}>
			<L>
			<Street wt={wt} />
			<LampPost wt={wt} />
			<Shelter />
		</L>
		</Layer>
		<Layer depth={1} blend="screen">
			<L>
			<LampCone />
		</L>
		</Layer>
		<Layer depth={1}>{hero}</Layer>
		<Layer depth={0.92}>
			<L>
			<Car wt={wt} moving={carMoving} />
			<Splash wt={wt} />
			<Impact wt={wt} />
		</L>
		</Layer>
		<Layer depth={1}>
			<L>
			<Rain wt={wt} seed="rmid" n={140} len={34} w={2.2} speed={44} color="#b9c8f2" opacity={0.6} shelter />
			{/* rain lit inside the lamp cone */}
			<svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
				<defs>
					<clipPath id="pt-coneclip">
						<polygon points="856,296 904,296 1150,905 610,905" transform={LAMP_T} />
					</clipPath>
				</defs>
				<g clipPath="url(#pt-coneclip)">
					{Array.from({length: 70}).map((_, i) => {
						const r = (k: string) => random(`rc${i}${k}`);
						const y = ((r('y') * 800 + wt * 40) % 800) + 120;
						const x = 560 + r('x') * 700 - y * 0.12 + 100;
						return <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 30} stroke="#fff1c4" strokeWidth={2} opacity={0.75} strokeLinecap="round" />;
					})}
				</g>
			</svg>
		</L>
		</Layer>
		{fx}
		<Layer depth={0.5}>
			<L>
			<Rain wt={wt} seed="rnear" n={26} len={90} w={5} speed={80} color="#d9e4ff" opacity={0.35} />
		</L>
		</Layer>
	</>
	);
};

/* ------------------------------- shot A ---------------------------------- */

const ShotA: React.FC<{f: number}> = ({f}) => {
	const {fps} = useVideoConfig();
	const wt = worldTime(f);
	const turned = f >= 62;
	const turnPop = spring({frame: f - 62, fps, config: {damping: 9, stiffness: 220}});
	const badgePop = spring({frame: f - 14, fps, config: {damping: 10, stiffness: 160}});
	const shake = f > 86 ? Math.sin(f * 2.3) * 3 * interpolate(f, [86, 99], [0.3, 1]) : 0;
	const cam = {
		x: interpolate(f, [0, 99], [-50, 20], {easing: ease}) + shake,
		y: interpolate(f, [0, 99], [40, 30], {easing: ease}) + shake * 0.6,
		zoom: interpolate(f, [0, 99], [0.86, 0.92], {easing: ease}),
		focus: 1,
		farBlur: 3,
		nearBlur: 10,
	};
	const glare = interpolate(f, [70, 99], [0, 1], clamp);
	const blink = (f % 64 < 4 ? Math.sin(((f % 64) / 4) * Math.PI) : 0) * (turned ? 0 : 1);
	const heroX = 1000;
	const hero = (
		<Svg>
			<ellipse cx={heroX + 10} cy={SIDEWALK_Y + 6} rx={68} ry={10} fill="#05060f" opacity={0.45} />
			<Stickman
				id="heroA"
				x={heroX}
				y={HIP}
				scale={HS}
				facing={turned ? -1 : 1}
				squash={turned ? (1 - turnPop) * 0.08 : 0}
				pose={turned ? {...idle(f), lean: -4, head: 8, armF: [20, 30], armB: [-14, 20]} : idle(f)}
				color={HERO}
				hood
				expr={turned ? 'wide' : 'sleepy'}
				look={turned ? [0.9, 0] : [0.3, 0.2]}
				mouth={turned ? 'open' : 'flat'}
				blink={blink}
				faceTurn={0.7}
				rim="#ffdca0"
				rimW={2}
				light={[2, -2]}
			/>
			{badgePop > 0.01 ? <TimeBadge x={heroX + (turned ? -12 : 12)} y={SIDEWALK_Y - 412} value="10s" pop={badgePop} glow={0.7 + 0.3 * Math.sin(f / 8)} paused={false} /> : null}
			{turned ? <Onoma x={heroX - 110} y={SIDEWALK_Y - 350} text="!" t={f - 62} c="#ffd36a" rot={-10} size={90} /> : null}
		</Svg>
	);
	return (
		<AbsoluteFill>
			<Camera cam={cam}>
				<World wt={wt} carMoving hero={hero} />
			</Camera>
			<AbsoluteFill
				style={{
					mixBlendMode: 'screen',
					opacity: glare,
					background: 'radial-gradient(ellipse 45% 60% at 0% 75%, rgba(255,240,190,0.75), rgba(255,240,190,0) 70%)',
				}}
			/>
		</AbsoluteFill>
	);
};

/* ------------------------------- shot B ---------------------------------- */

export const Bokeh: React.FC<{wt: number; desat: number}> = ({wt, desat}) => (
	<Svg>
		{Array.from({length: 26}).map((_, i) => {
			const r = (k: string) => random(`bk${i}${k}`);
			const cols = ['#ffd27a', '#ff4f8b', '#3fe0e8', '#ffb35a', '#9fb4ff'];
			const c = cols[Math.floor(r('c') * cols.length)];
			const s = 30 + r('s') * 90;
			return (
				<circle
					key={i}
					cx={r('x') * 2100 - 90 + Math.sin(wt / 50 + i) * 10}
					cy={r('y') * 900 - 40}
					r={s}
					fill={c}
					opacity={(0.18 + r('o') * 0.25) * (1 - desat * 0.4)}
					stroke={lighten(c, 0.4)}
					strokeWidth={3}
					strokeOpacity={0.35}
				/>
			);
		})}
	</Svg>
);

const ShotB: React.FC<{f: number}> = ({f}) => {
	const {fps} = useVideoConfig();
	const l = f - 100;
	const wt = worldTime(f);
	const frozen = f > FREEZE_AT;
	const desat = interpolate(f, [SNAP + 1, SNAP + 7], [0, 1], clamp);
	const lookCam = l >= 10;
	const turnPop = spring({frame: l - 10, fps, config: {damping: 9, stiffness: 240}});
	const raise = spring({frame: l - 14, fps, config: {damping: 11, stiffness: 120}});
	const snapK = f >= SNAP ? spring({frame: f - SNAP, fps, config: {damping: 7, stiffness: 300}}) : 0;
	const shake = f >= SNAP ? Math.sin((f - SNAP) * 2.7) * 9 * Math.exp(-(f - SNAP) / 5) : 0;
	const cam = {
		x: interpolate(l, [0, 59], [-20, 20]) + shake,
		y: shake * 0.7,
		zoom: interpolate(l, [0, 59], [1.0, 1.06]) + (f >= SNAP ? 0.03 * Math.exp(-(f - SNAP) / 6) : 0),
		focus: 1,
		farBlur: 3,
		nearBlur: 10,
	};
	const glare = interpolate(l, [0, 26, 31], [0.55, 1, 0.9], clamp) * (frozen ? 0.85 : 1);
	const heroX = 900;
	const hipY = 1240;
	const s = 3.6;
	// hand position for FX: approximate from the raised arm pose
	const armF: [number, number] = [interpolate(raise, [0, 1], [10, 118]) + (f >= SNAP ? -8 * snapK : 0), interpolate(raise, [0, 1], [20, 48])];

	const poseB: Pose = {lean: lookCam ? -3 : -6, head: lookCam ? -6 + 4 * Math.sin(l / 12) : 6, armB: [-6, 10], armF, legB: [0, 0], legF: [0, 0]};
	const hp = frontHand(poseB, heroX, hipY, s, lookCam ? 1 : -1);
	const hand = {x: hp[0], y: hp[1]};
	const ring = (d: number) => interpolate(f - SNAP - d, [0, 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<AbsoluteFill style={{background: '#0b1026'}}>
			<Camera cam={cam}>
				<AbsoluteFill style={{filter: `saturate(${1 - desat * 0.8}) sepia(${0.7 * desat}) hue-rotate(${180 * desat}deg) saturate(${1 + 0.9 * desat}) brightness(${1 - desat * 0.1})`}}>
					<Layer depth={5}>
						<AbsoluteFill style={{transform: 'scale(2.3) translate(40px,-30px)', transformOrigin: '50% 55%', filter: 'blur(16px)'}}>
							<Sky wt={wt} />
							<Skyline wt={wt} />
							<Facades wt={wt} />
							<Street wt={wt} />
							<LampCone />
						</AbsoluteFill>
					</Layer>
					<Layer depth={3}>
						<Bokeh wt={wt} desat={desat} />
					</Layer>
					<Layer depth={1.6}>
						<Rain wt={wt} seed="bmid" n={90} len={40} w={2.4} speed={46} color="#c3d0f5" opacity={0.5} />
					</Layer>
				</AbsoluteFill>
				<AbsoluteFill
					style={{
						mixBlendMode: 'screen',
						opacity: glare * (1 - desat * 0.5),
						background: 'radial-gradient(ellipse 50% 70% at -5% 60%, rgba(255,240,190,0.85), rgba(255,240,190,0) 70%)',
					}}
				/>
				<Layer depth={1}>
					<Svg>
						<Stickman
							id="heroB"
							x={heroX}
							y={hipY}
							scale={s}
							facing={lookCam ? 1 : -1}
							squash={lookCam ? (1 - turnPop) * 0.05 - snapK * 0.0 : 0}
							pose={poseB}
							color={HERO}
							hood
							hideLegs
							expr={lookCam ? 'normal' : 'wide'}
							look={lookCam ? [0.05, 0.05] : [0.9, 0]}
							lidL={lookCam ? 0.38 : 0}
							lidR={lookCam ? (f > SNAP + 12 && f < SNAP + 22 ? 1 : 0.38) : 0}
							mouth={lookCam ? 'smirk' : 'open'}
							faceTurn={lookCam ? 0.2 : 0.7}
							handF={f >= SNAP ? 'point' : 'snap'}
							rim="#ffdca0"
							rimW={1.4}
							light={[1.2, -1]}
						/>
						<TimeBadge x={heroX + 30} y={300} s={1.5} value="10s" pop={1 + snapK * 0.08} glow={1} paused={f >= SNAP} />
						{f >= SNAP ? (
							<>
								{[0, 4, 8].map((d) => {
									const k = ring(d);
									return k > 0 && k < 1 ? <circle key={d} cx={hand.x} cy={hand.y} r={30 + k * 900} stroke="#bff6ff" strokeWidth={10 * (1 - k)} fill="none" opacity={1 - k} /> : null;
								})}
								{Array.from({length: 8}).map((_, i) => {
									const a = (i / 8) * Math.PI * 2 + 0.3;
									const k = interpolate(f - SNAP, [0, 8], [0, 1], clamp);
									const r0 = 50 + k * 60;
									const r1 = r0 + 50 * (1 - k);
									return (
										<line key={i} x1={hand.x + Math.cos(a) * r0} y1={hand.y + Math.sin(a) * r0} x2={hand.x + Math.cos(a) * r1} y2={hand.y + Math.sin(a) * r1} stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={1 - k} />
									);
								})}
								<Onoma x={hand.x + 180} y={hand.y - 60} text="SNAP!" t={f - SNAP} c="#7ff0ff" rot={8} size={96} />
							</>
						) : null}
					</Svg>
				</Layer>
				<Layer depth={0.6}>
					<Rain wt={wt} seed="bnear" n={18} len={120} w={7} speed={90} color="#dfe8ff" opacity={0.3} />
				</Layer>
			</Camera>
			<AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [SNAP, SNAP + 1, SNAP + 4], [0, 0.9, 0], clamp)}} />
		</AbsoluteFill>
	);
};

/* ------------------------------- shot C ---------------------------------- */

const ShotC: React.FC<{f: number}> = ({f}) => {
	const {fps} = useVideoConfig();
	const wt = worldTime(f);
	const resumed = f >= RESUME;
	const sat = resumed ? interpolate(f, [RESUME, RESUME + 8], [0.2, 1], clamp) : 0.2;
	const tint = (1 - sat) / 0.8;
	const look = tint > 0.001 ? `saturate(${sat}) sepia(${0.7 * tint}) hue-rotate(${180 * tint}deg) saturate(${1 + 0.9 * tint}) brightness(${1 - 0.08 * tint})` : undefined;
	const walkStart = 168;
	const walkEnd = 224;
	const prog = interpolate(f, [walkStart, walkEnd], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
	const heroX = 1000 + 420 * prog;
	const walking = f > walkStart && f < walkEnd;
	const ph = ((heroX - 1000) / 145) * Math.PI;
	const turned = f >= 232;
	const turnPop = spring({frame: f - 232, fps, config: {damping: 9, stiffness: 220}});
	const landF = RESUME + (IMPACT - FREEZE_AT);
	const flinch = spring({frame: f - landF, fps, config: {damping: 8, stiffness: 260}});
	const count = Math.max(0, Math.ceil(10 - (f - 170) / 7.5));
	const tickPop = f >= 170 && f < RESUME ? 1 + 0.18 * Math.exp(-((f - 170) % 7.5) / 2) : 1;
	const badgeOut = interpolate(f, [RESUME + 2, RESUME + 10], [1, 0], {...clamp, easing: Easing.in(Easing.back(2))});
	const impactShake = f >= landF ? Math.sin((f - landF) * 2.5) * 8 * Math.exp(-(f - landF) / 6) : 0;
	const cam = {
		x: interpolate(heroX, [1000, 1420], [-30, 140]) + impactShake,
		y: interpolate(f, [160, 299], [40, 30]) + impactShake * 0.5,
		zoom: interpolate(f, [160, 299], [0.9, 0.86], {easing: ease}) + (f >= landF ? 0.02 * Math.exp(-(f - landF) / 8) : 0),
		focus: 1,
		farBlur: 3,
		nearBlur: 10,
	};
	const wink = f > landF + 10 && f < landF + 20 ? 1 : 0;
	const pose: Pose = walking
		? walk(ph)
		: turned
			? {...idle(f), lean: 3, head: -6 + 3 * Math.sin(f / 10), armF: [resumed && f > landF + 4 ? 125 : 10, resumed && f > landF + 4 ? 60 : 20], armB: [-8, 20]}
			: idle(f);
	const bob = walking ? -6 * Math.abs(Math.cos(ph)) : 0;
	const hero = (
		<Svg>
			<ellipse cx={heroX + 10} cy={SIDEWALK_Y + 6} rx={68} ry={10} fill="#05060f" opacity={0.45} />
			<Stickman
				id="heroC"
				x={heroX}
				y={HIP + bob}
				scale={HS}
				facing={turned ? -1 : 1}
				squash={(turned ? (1 - turnPop) * 0.07 : 0) + (f >= landF ? (1 - flinch) * 0.06 : 0)}
				pose={pose}
				color={HERO}
				hood
				expr="normal"
				look={turned ? [0.6, 0.2] : [0.5, 0]}
				lidL={0.35}
				lidR={Math.max(0.35, wink)}
				mouth="smirk"
				faceTurn={0.8}
				handF={turned && resumed && f > landF + 4 ? 'point' : undefined}
				rim="#ffdca0"
				rimW={2}
				light={[2, -2]}
			/>
			{badgeOut > 0.01 ? <TimeBadge x={heroX} y={SIDEWALK_Y - 412} value={`${count}s`} pop={tickPop * badgeOut} glow={1} paused /> : null}
		</Svg>
	);
	const fx = (
		<Layer depth={0.92}>
			<Svg>
				<Onoma x={PUDDLE_X + 20} y={760} text="SPLOOSH!" t={f - landF} c="#9fd0ff" rot={-6} size={90} />
				{/* the dimensional ring left over from the snap passes through the scene */}
				{(() => {
					const k = interpolate(f, [160, 178], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
					return k < 1 ? <circle cx={1000} cy={560} r={300 + k * 1400} stroke="#bff6ff" strokeWidth={14 * (1 - k)} fill="none" opacity={(1 - k) * 0.8} /> : null;
				})()}
			</Svg>
		</Layer>
	);
	return (
		<AbsoluteFill>
			<Camera cam={cam}>
				<World wt={wt} carMoving={resumed} hero={hero} fx={fx} look={look} />
			</Camera>
			<AbsoluteFill style={{background: '#fff', opacity: interpolate(f, [RESUME, RESUME + 1, RESUME + 6], [0, 0.75, 0], clamp)}} />
		</AbsoluteFill>
	);
};

/* -------------------------------- master --------------------------------- */

export const PauseTime: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#070b1f'}}>
			<Audio src={staticFile('sfx/pausetime.wav')} />
			{f < 100 ? <ShotA f={f} /> : f < 160 ? <ShotB f={f} /> : <ShotC f={f} />}
			<Vignette strength={0.6} color="5,6,20" />
			<Grain opacity={0.13} />
			<AbsoluteFill style={{background: '#000', opacity: interpolate(f, [0, 8, 290, 299], [1, 0, 0, 1], clamp)}} />
		</AbsoluteFill>
	);
};
