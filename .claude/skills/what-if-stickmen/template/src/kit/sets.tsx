import React from 'react';
import {random} from 'remotion';
import {Svg} from '../engine/camera';
import {darken, lighten, mix} from '../engine/color';
import {FONT, HAND} from './ui';

/* ------------------------------ building blocks ------------------------------ */

const Grad: React.FC<{id: string; stops: [number, string][]; x2?: number; y2?: number}> = ({id, stops, x2 = 0, y2 = 1}) => (
	<linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
		{stops.map(([o, c], i) => (
			<stop key={i} offset={o} stopColor={c} />
		))}
	</linearGradient>
);

export const Win: React.FC<{x: number; y: number; w: number; h: number; sky: [string, string]; frame?: string; night?: boolean; curtains?: string; id: string}> = ({
	x,
	y,
	w,
	h,
	sky,
	frame = '#f1ece0',
	night,
	curtains,
	id,
}) => (
	<g>
		<defs>
			<Grad id={id} stops={[[0, sky[0]], [1, sky[1]]]} />
		</defs>
		<rect x={x - 12} y={y - 12} width={w + 24} height={h + 24} rx={4} fill={frame} />
		<rect x={x} y={y} width={w} height={h} fill={`url(#${id})`} />
		{night
			? Array.from({length: 18}).map((_, i) => (
					<rect key={i} x={x + 10 + random(id + 'bx' + i) * (w - 30)} y={y + h * 0.55 + random(id + 'by' + i) * h * 0.4} width={8} height={10} fill="#ffd27a" opacity={0.7} />
				))
			: null}
		{night ? <rect x={x} y={y + h * 0.62} width={w} height={h * 0.38} fill="#141a3a" opacity={0.85} /> : null}
		<line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={frame} strokeWidth={10} />
		<line x1={x} y1={y + h * 0.45} x2={x + w} y2={y + h * 0.45} stroke={frame} strokeWidth={8} />
		<polygon points={`${x + 20},${y + h} ${x + 70},${y + h} ${x + w * 0.55},${y} ${x + w * 0.55 - 50},${y}`} fill="#fff" opacity={night ? 0.05 : 0.18} />
		<rect x={x - 26} y={y + h + 10} width={w + 52} height={16} rx={3} fill={darken(frame, 0.08)} />
		{curtains ? (
			<>
				<path d={`M${x - 60},${y - 30} h${w * 0.32} q-20,${h * 0.5} 10,${h + 60} h-${w * 0.32 - 10} z`} fill={curtains} />
				<path d={`M${x + w + 60},${y - 30} h-${w * 0.32} q20,${h * 0.5} -10,${h + 60} h${w * 0.32 - 10} z`} fill={curtains} />
				<rect x={x - 80} y={y - 40} width={w + 160} height={10} rx={5} fill={darken(curtains, 0.35)} />
			</>
		) : null}
	</g>
);

const Poster: React.FC<{x: number; y: number; w: number; h: number; c: string; children?: React.ReactNode; tilt?: number}> = ({x, y, w, h, c, children, tilt = 0}) => (
	<g transform={`rotate(${tilt} ${x + w / 2} ${y + h / 2})`}>
		<rect x={x} y={y} width={w} height={h} fill={c} />
		<rect x={x} y={y} width={w} height={h} fill="none" stroke="#000" opacity={0.12} strokeWidth={4} />
		<circle cx={x + 8} cy={y + 8} r={4} fill="#d23b3b" />
		<circle cx={x + w - 8} cy={y + 8} r={4} fill="#d23b3b" />
		{children}
	</g>
);

const Floor: React.FC<{y: number; c: string; plank?: boolean; tiles?: boolean}> = ({y, c, plank, tiles}) => (
	<g>
		<rect x={-400} y={y} width={2800} height={600} fill={c} />
		<rect x={-400} y={y} width={2800} height={10} fill={darken(c, 0.25)} />
		{plank
			? Array.from({length: 8}).map((_, i) => <line key={i} x1={-400} y1={y + 24 + i * i * 9} x2={2400} y2={y + 24 + i * i * 9} stroke={darken(c, 0.12)} strokeWidth={2} />)
			: null}
		{tiles
			? Array.from({length: 30}).map((_, i) => <line key={i} x1={-400 + i * 100} y1={y} x2={-400 + i * 100 - 300} y2={y + 600} stroke={darken(c, 0.1)} strokeWidth={2} />)
			: null}
	</g>
);

const Wall: React.FC<{top: string; bot: string; id: string; trim?: string; trimY?: number}> = ({top, bot, id, trim, trimY = 640}) => (
	<g>
		<defs>
			<Grad id={id} stops={[[0, top], [1, bot]]} />
		</defs>
		<rect x={-400} y={-300} width={2800} height={1300} fill={`url(#${id})`} />
		{trim ? <rect x={-400} y={trimY} width={2800} height={12} fill={trim} /> : null}
	</g>
);

export const Lamp: React.FC<{x: number; y: number; on?: number; c?: string}> = ({x, y, on = 1, c = '#ffe3a0'}) => (
	<g>
		<line x1={x} y1={-300} x2={x} y2={y - 30} stroke="#2a2a32" strokeWidth={4} />
		<path d={`M${x - 60},${y} Q${x},${y - 70} ${x + 60},${y} Z`} fill="#2b2f3a" />
		<ellipse cx={x} cy={y} rx={30} ry={8} fill={c} opacity={0.3 + 0.7 * on} />
		<circle cx={x} cy={y + 10} r={160} fill={c} opacity={0.12 * on} />
	</g>
);

/* --------------------------------- bedroom ---------------------------------- */

export const Bedroom: React.FC<{night?: boolean; f: number; ring?: boolean}> = ({night, f, ring}) => (
	<Svg>
		<Wall id={night ? 'br-wn' : 'br-wd'} top={night ? '#1d2550' : '#a9cfe0'} bot={night ? '#2a3366' : '#d8e8e6'} trim={night ? '#141a3d' : '#9ec2c9'} trimY={720} />
		<Win id={night ? 'br-sn' : 'br-sd'} x={760} y={170} w={420} h={330} sky={night ? ['#0b1030', '#2a2f63'] : ['#ffb27a', '#ffe1a8']} night={night} curtains={night ? '#3a4380' : '#f2b21c'} />
		{night ? <circle cx={1080} cy={240} r={30} fill="#eef1ff" /> : <circle cx={980} cy={430} r={46} fill="#fff4d0" opacity={0.9} />}
		<Poster x={260} y={190} w={180} h={250} c={night ? '#2a3a7a' : '#2f5e9c'} tilt={-3}>
			<path d="M350,250 l20,60 h-40 z" fill="#f2f2f2" />
			<rect x={340} y={310} width={20} height={40} fill="#f2f2f2" />
			<path d="M340,350 l-12,24 h44 l-12,-24 z" fill="#ff7a3a" />
			<text x={350} y={420} textAnchor="middle" fontSize={24} fontFamily={FONT} fill="#fff">
				МАРС
			</text>
		</Poster>
		<Poster x={1360} y={220} w={200} h={140} c={night ? '#5a2f6a' : '#e86aa0'} tilt={4}>
			<text x={1460} y={305} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#fff">
				LVL 99
			</text>
		</Poster>
		<rect x={1340} y={420} width={320} height={14} fill={night ? '#3a3050' : '#b98a5a'} />
		{['#d94a3a', '#2f6fd8', '#3aa37a', '#f2b21c', '#8b5cf6'].map((c, i) => (
			<rect key={i} x={1360 + i * 34} y={346 + (i % 2) * 8} width={26} height={74 - (i % 2) * 8} fill={night ? darken(c, 0.4) : c} />
		))}
		<Floor y={880} c={night ? '#2a2440' : '#c99a6a'} plank />
		{/* desk */}
		<rect x={80} y={640} width={420} height={18} fill={night ? '#3a3050' : '#b98a5a'} />
		<rect x={100} y={658} width={16} height={230} fill={night ? '#2a2440' : '#8a6a44'} />
		<rect x={460} y={658} width={16} height={230} fill={night ? '#2a2440' : '#8a6a44'} />
		<rect x={160} y={560} width={150} height={84} rx={6} fill="#2b2f3a" />
		<rect x={170} y={570} width={130} height={62} fill={night ? '#3d6fd6' : '#1b2030'} />
		{/* bed */}
		<rect x={1180} y={700} width={720} height={150} rx={20} fill={night ? '#3a3050' : '#8a6a44'} />
		<rect x={1860} y={560} width={40} height={300} rx={12} fill={night ? '#3a3050' : '#8a6a44'} />
		<rect x={1200} y={660} width={680} height={90} rx={36} fill={night ? '#d9d4e6' : '#f6f2e8'} />
		<rect x={1740} y={624} width={140} height={60} rx={26} fill="#fff" />
		{/* nightstand + alarm */}
		<rect x={1020} y={720} width={130} height={170} rx={8} fill={night ? '#3a3050' : '#a9805a'} />
		<g transform={`translate(1085,${690}) rotate(${ring ? Math.sin(f * 2.6) * 9 : 0})`}>
			<circle r={34} fill="#d94a3a" />
			<circle r={26} fill="#fff8ec" />
			<line x1={0} y1={0} x2={0} y2={-18} stroke="#222" strokeWidth={4} />
			<line x1={0} y1={0} x2={13} y2={4} stroke="#222" strokeWidth={4} />
			<circle cx={-26} cy={-30} r={12} fill="#c7c9d3" />
			<circle cx={26} cy={-30} r={12} fill="#c7c9d3" />
		</g>
		{ring ? (
			<g stroke="#ffd34a" strokeWidth={5} strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(f * 1.3)}>
				<path d="M1030,640 l-18,-14 M1022,668 l-24,-2 M1140,640 l18,-14 M1148,668 l24,-2" />
			</g>
		) : null}
	</Svg>
);

/* Blanket drawn in front of the sleeping hero */
export const Blanket: React.FC<{night?: boolean; f: number; lift?: number}> = ({night, f, lift = 0}) => (
	<Svg>
		<path
			d={`M1200,${720 - lift} Q1380,${650 + Math.sin(f / 18) * 6 - lift} 1560,${690 - lift} T1880,${700 - lift} L1880,800 Q1540,840 1200,800 Z`}
			fill={night ? '#3a5fb0' : '#f2b21c'}
		/>
		<path d={`M1240,${742 - lift} Q1400,${700 - lift} 1560,${720 - lift}`} stroke={night ? '#5a7fd0' : '#ffd65a'} strokeWidth={8} fill="none" strokeLinecap="round" />
	</Svg>
);

/* --------------------------------- kitchen ---------------------------------- */

export const Kitchen: React.FC<{night?: boolean}> = ({night}) => (
	<Svg>
		<Wall id={night ? 'kt-wn' : 'kt-wd'} top={night ? '#2a2a48' : '#f3e6c4'} bot={night ? '#3a3352' : '#ecd9ac'} />
		{/* tiles */}
		{Array.from({length: 12}).map((_, r) =>
			Array.from({length: 30}).map((__, c) => (
				<rect key={`${r}-${c}`} x={-300 + c * 90 + (r % 2) * 45} y={430 + r * 40} width={86} height={36} fill={night ? '#3d3a5c' : '#fbf3dc'} opacity={0.6} />
			)),
		)}
		<Win id={night ? 'kt-sn' : 'kt-sd'} x={820} y={150} w={360} h={260} sky={night ? ['#0b1030', '#2a2f63'] : ['#9fd2f0', '#e6f4fb']} night={night} frame={night ? '#c9c4dc' : '#ffffff'} />
		{/* upper cabinets */}
		{[100, 330, 1340, 1570].map((x, i) => (
			<g key={i}>
				<rect x={x} y={150} width={220} height={220} rx={8} fill={night ? '#4b4568' : '#7fb8a4'} />
				<rect x={x + 100} y={250} width={20} height={40} rx={6} fill={night ? '#8a84a8' : '#e6f4ef'} />
			</g>
		))}
		{/* counter */}
		<rect x={-300} y={640} width={1000} height={24} fill={night ? '#5a5478' : '#d9c09a'} />
		<rect x={-300} y={664} width={1000} height={260} fill={night ? '#3a3556' : '#6aa892'} />
		<rect x={240} y={570} width={90} height={70} rx={10} fill="#e8e8ee" />
		<path d="M330,590 q30,0 30,20 q0,20 -30,20" stroke="#c9c9d3" strokeWidth={8} fill="none" />
		<rect x={80} y={600} width={60} height={40} rx={8} fill="#2b2f3a" />
		{/* fridge with dad photo */}
		<rect x={1500} y={420} width={270} height={480} rx={18} fill={night ? '#c9c6dc' : '#f4f6fa'} />
		<line x1={1500} y1={560} x2={1770} y2={560} stroke="#b9bcc8" strokeWidth={4} />
		<rect x={1530} y={470} width={10} height={60} rx={4} fill="#9aa0ae" />
		<g transform="translate(1640,620) rotate(-5)">
			<rect x={-50} y={-62} width={100} height={124} fill="#fff" stroke="#ddd" strokeWidth={2} />
			<rect x={-42} y={-54} width={84} height={90} fill="#9fd2f0" />
			<circle cx={0} cy={-24} r={16} fill="#000" />
			<rect x={-14} y={-8} width={28} height={42} rx={8} fill="#3a6fd2" />
			<rect x={18} y={10} width={18} height={24} rx={3} fill="#6b4a2a" />
			<circle cx={0} cy={-58} r={6} fill="#d94a3a" />
		</g>
		<Floor y={900} c={night ? '#3a3050' : '#d8b48c'} tiles />
		{night ? <Lamp x={960} y={330} c="#ffd69a" /> : null}
	</Svg>
);

export const KitchenTable: React.FC<{night?: boolean; mugs?: number}> = ({night, mugs = 2}) => (
	<Svg>
		<ellipse cx={960} cy={720} rx={430} ry={46} fill={night ? '#6a5a7a' : '#c98a5a'} />
		<ellipse cx={960} cy={712} rx={430} ry={42} fill={night ? '#8a7aa0' : '#e0a774'} />
		<rect x={700} y={740} width={20} height={190} fill={night ? '#4a3d5a' : '#9a6a44'} />
		<rect x={1200} y={740} width={20} height={190} fill={night ? '#4a3d5a' : '#9a6a44'} />
		{Array.from({length: mugs}).map((_, i) => (
			<g key={i} transform={`translate(${860 + i * 200},690)`}>
				<rect x={-22} y={-40} width={44} height={44} rx={8} fill={i ? '#3a6fd2' : '#f2b21c'} />
				<path d="M22,-30 q18,0 18,14 q0,14 -18,14" stroke={i ? '#3a6fd2' : '#f2b21c'} strokeWidth={7} fill="none" />
			</g>
		))}
	</Svg>
);

/* -------------------------------- elevator ---------------------------------- */

export const Elevator: React.FC<{f: number}> = ({f}) => (
	<Svg>
		<Wall id="el-w" top="#9aa3b8" bot="#7d8699" />
		{Array.from({length: 7}).map((_, i) => (
			<line key={i} x1={-300 + i * 400} y1={-300} x2={-300 + i * 400} y2={1100} stroke="#6c7488" strokeWidth={6} />
		))}
		<rect x={520} y={110} width={880} height={760} rx={10} fill="#c7d3e6" />
		<rect x={540} y={130} width={840} height={720} rx={6} fill="#a9b9d4" />
		<polygon points="600,850 700,850 1050,130 950,130" fill="#fff" opacity={0.12} />
		<rect x={1500} y={360} width={110} height={300} rx={10} fill="#5a6278" />
		{Array.from({length: 8}).map((_, i) => (
			<circle key={i} cx={1530 + (i % 2) * 50} cy={400 + Math.floor(i / 2) * 60} r={16} fill={i === 5 ? '#ffd34a' : '#c9cfdd'} />
		))}
		<rect x={1495} y={300} width={120} height={44} rx={6} fill="#141a2e" />
		<text x={1555} y={333} textAnchor="middle" fontSize={30} fontFamily={FONT} fill="#ff6a5a">
			{Math.max(1, 9 - Math.floor(f / 25))}
		</text>
		<rect x={-400} y={-300} width={2800} height={60} fill="#e9eef6" opacity={0.9} />
		<Floor y={900} c="#5a6278" />
	</Svg>
);

/* -------------------------------- pharmacy ---------------------------------- */

export const Pharmacy: React.FC = () => (
	<Svg>
		<Wall id="ph-w" top="#8fcabb" bot="#6fb3a2" />
		{[0, 1, 2, 3].map((r) => (
			<g key={r}>
				<rect x={-200} y={200 + r * 130} width={2300} height={12} fill="#9fc9bf" />
				{Array.from({length: 40}).map((_, i) => {
					const c = ['#e86a6a', '#3d6fd6', '#f2b21c', '#3aa37a', '#ffffff', '#8b5cf6'][Math.floor(random('ph' + r + i) * 6)];
					const h = 60 + random('phh' + r + i) * 50;
					return <rect key={i} x={-180 + i * 58} y={200 + r * 130 - h} width={44} height={h} rx={4} fill={c} opacity={0.9} />;
				})}
			</g>
		))}
		<g transform="translate(960,90)">
			<rect x={-50} y={-16} width={100} height={32} fill="#3fae8f" />
			<rect x={-16} y={-50} width={32} height={100} fill="#3fae8f" />
		</g>
		<Floor y={900} c="#bcd8d2" tiles />
	</Svg>
);

export const Counter: React.FC<{c?: string; top?: string; x?: number; w?: number}> = ({c = '#4b8f80', top = '#e9f4f1', x = 300, w = 1320}) => (
	<Svg>
		<rect x={x} y={770} width={w} height={200} rx={6} fill={c} />
		<rect x={x - 10} y={752} width={w + 20} height={24} rx={6} fill={top} />
		<rect x={x + 40} y={800} width={w - 80} height={6} fill={lighten(c, 0.2)} />
	</Svg>
);

/* ------------------------------- school yard -------------------------------- */

export const SchoolYard: React.FC<{f: number}> = ({f}) => (
	<Svg>
		<Wall id="sy-sky" top="#7fc0ea" bot="#d6eefa" />
		{[200, 900, 1500].map((x, i) => (
			<ellipse key={i} cx={x + f * 0.2} cy={120 + i * 30} rx={130} ry={34} fill="#fff" opacity={0.8} />
		))}
		<rect x={-200} y={230} width={2300} height={680} fill="#c4604a" />
		{Array.from({length: 18}).map((_, r) => (
			<line key={r} x1={-200} y1={250 + r * 38} x2={2100} y2={250 + r * 38} stroke="#a94f3c" strokeWidth={3} />
		))}
		{Array.from({length: 2}).map((_, r) =>
			Array.from({length: 9}).map((__, c) => (
				<g key={`${r}${c}`}>
					<rect x={-120 + c * 250} y={300 + r * 230} width={150} height={150} fill="#e9f4fb" />
					<rect x={-112 + c * 250} y={308 + r * 230} width={134} height={134} fill="#a9d4ee" />
					<line x1={-45 + c * 250} y1={300 + r * 230} x2={-45 + c * 250} y2={450 + r * 230} stroke="#e9f4fb" strokeWidth={6} />
				</g>
			)),
		)}
		<rect x={760} y={210} width={400} height={64} rx={6} fill="#2b3366" />
		<text x={960} y={254} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#fff">
			ШКОЛА № 7
		</text>
		<Floor y={900} c="#9aa3b5" />
		{[120, 1780].map((x, i) => (
			<g key={i}>
				<rect x={x - 12} y={660} width={24} height={240} fill="#6b4a2a" />
				<circle cx={x} cy={620} r={110} fill="#4aa04a" />
				<circle cx={x - 60} cy={660} r={70} fill="#3d8f3d" />
				<circle cx={x + 70} cy={650} r={76} fill="#5ab85a" />
			</g>
		))}
	</Svg>
);

/* -------------------------------- corridor ---------------------------------- */

export const Corridor: React.FC<{f: number; radio?: number}> = ({f, radio = 0}) => (
	<Svg>
		<Wall id="co-w" top="#f1e6c8" bot="#e6d6aa" trim="#9a8a6a" trimY={600} />
		<rect x={-400} y={612} width={2800} height={300} fill="#6aa892" />
		{Array.from({length: 9}).map((_, i) => (
			<g key={i}>
				<rect x={60 + i * 120} y={400} width={110} height={500} rx={4} fill="#3d6fd6" />
				<rect x={70 + i * 120} y={430} width={90} height={8} fill="#2f5ab0" />
				<rect x={70 + i * 120} y={446} width={90} height={8} fill="#2f5ab0" />
				<rect x={140 + i * 120} y={640} width={8} height={40} rx={3} fill="#c9d4f0" />
			</g>
		))}
		<rect x={1220} y={250} width={300} height={200} fill="#c9a06a" />
		{['#fbf8ef', '#ffe08a', '#bfe3ff', '#ffc9c9'].map((c, i) => (
			<rect key={i} x={1240 + (i % 2) * 140} y={268 + Math.floor(i / 2) * 90} width={120} height={78} fill={c} transform={`rotate(${(i % 3) - 1} ${1300 + (i % 2) * 140} 300)`} />
		))}
		<Win id="co-win" x={1620} y={200} w={300} h={360} sky={['#9fd2f0', '#e6f4fb']} />
		{/* radio speaker */}
		<g transform="translate(1100,200)">
			<rect x={-8} y={-60} width={16} height={60} fill="#555" />
			<path d="M-40,0 L40,0 L70,80 L-70,80 Z" fill="#8a94a8" />
			<ellipse cx={0} cy={80} rx={70} ry={16} fill="#5a6278" />
			{radio > 0
				? [0, 1, 2].map((i) => {
						const k = ((f / 18 + i / 3) % 1);
						return <path key={i} d={`M${-70 - k * 80},${110 + k * 40} Q0,${150 + k * 120} ${70 + k * 80},${110 + k * 40}`} stroke="#ffd34a" strokeWidth={5} fill="none" opacity={(1 - k) * radio} />;
					})
				: null}
		</g>
		<Floor y={900} c="#d6c4a0" tiles />
	</Svg>
);

/* --------------------------------- toilet ----------------------------------- */

export const Toilet: React.FC<{f: number}> = ({f}) => {
	const flick = random('tl' + Math.floor(f / 3)) > 0.86 ? 0.35 : 1;
	return (
		<Svg>
			<Wall id="tl-w" top="#cfe3dc" bot="#b7d3c9" />
			{Array.from({length: 22}).map((_, r) =>
				Array.from({length: 34}).map((__, c) => <rect key={`${r}${c}`} x={-300 + c * 80} y={-200 + r * 60} width={76} height={56} fill="#e2efe9" opacity={0.55} />),
			)}
			<rect x={560} y={150} width={800} height={520} rx={12} fill="#8fa6a0" />
			<rect x={575} y={165} width={770} height={490} rx={6} fill="#bcd4dc" />
			<polygon points="640,655 720,655 1000,165 920,165" fill="#fff" opacity={0.15} />
			<rect x={700} y={700} width={520} height={50} rx={14} fill="#f4f6fa" />
			<rect x={900} y={750} width={120} height={150} fill="#e1e6ee" />
			<rect x={940} y={660} width={40} height={50} rx={6} fill="#b9c0cc" />
			<rect x={1500} y={260} width={420} height={640} fill="#6aa892" />
			<rect x={1520} y={280} width={380} height={600} fill="#7fb8a4" />
			<circle cx={1560} cy={600} r={10} fill="#4b8f80" />
			<Floor y={900} c="#a9bfb8" tiles />
			<g opacity={flick}>
				<rect x={860} y={40} width={200} height={20} rx={10} fill="#f6fff6" />
				<ellipse cx={960} cy={60} rx={500} ry={300} fill="#f2fff6" opacity={0.12} />
			</g>
		</Svg>
	);
};

/* ----------------------------- school entrance ------------------------------ */

export const Entrance: React.FC = () => (
	<Svg>
		<Wall id="en-w" top="#e8dcc0" bot="#d6c6a0" trim="#8a7a5a" trimY={620} />
		<rect x={-200} y={180} width={760} height={720} fill="#9fc9e6" opacity={0.6} />
		{[0, 1, 2].map((i) => (
			<rect key={i} x={-200 + i * 260} y={180} width={14} height={720} fill="#6a7a8a" />
		))}
		{/* guard booth */}
		<rect x={1180} y={360} width={620} height={540} fill="#8a6a44" />
		<rect x={1210} y={390} width={560} height={240} fill="#d6eefa" />
		<rect x={1210} y={500} width={560} height={10} fill="#8a6a44" />
		<rect x={1240} y={420} width={160} height={60} fill="#fff" />
		<text x={1320} y={460} textAnchor="middle" fontSize={26} fontFamily={FONT} fill="#2b3366">
			ОХРАНА
		</text>
		<rect x={1160} y={640} width={660} height={28} fill="#a9805a" />
		{/* turnstile */}
		<rect x={720} y={700} width={60} height={200} rx={8} fill="#5a6278" />
		<rect x={980} y={700} width={60} height={200} rx={8} fill="#5a6278" />
		<rect x={780} y={760} width={140} height={14} rx={7} fill="#c9cfdd" />
		<circle cx={750} cy={690} r={10} fill="#ff4a4a" />
		<Floor y={900} c="#bfae8a" tiles />
	</Svg>
);

/* -------------------------------- classroom --------------------------------- */

export const ClassroomEve: React.FC = () => (
	<Svg>
		<Wall id="ce-w" top="#e9d9ae" bot="#ddc994" trim="#8a7458" trimY={620} />
		<rect x={-400} y={632} width={2800} height={280} fill="#d2be8c" />
		<rect x={200} y={140} width={900} height={400} rx={6} fill="#7b4c2c" />
		<rect x={216} y={156} width={868} height={368} fill="#2f4a3a" />
		<text x={650} y={290} textAnchor="middle" fontSize={64} fontFamily={HAND} fill="#f6f2e4">
			Родительское
		</text>
		<text x={650} y={380} textAnchor="middle" fontSize={64} fontFamily={HAND} fill="#f6f2e4">
			собрание 10 «Б»
		</text>
		<Win id="ce-win" x={1320} y={160} w={480} h={360} sky={['#1b2350', '#3a3f7a']} night frame="#e9e2cc" />
		<Lamp x={700} y={60} c="#fff1c8" />
		<Floor y={900} c="#b88e72" plank />
	</Svg>
);

/* ---------------------------------- shop ------------------------------------ */

export const Shop: React.FC<{f: number}> = ({f}) => (
	<Svg>
		<Wall id="sh-w" top="#f2efe6" bot="#e2ddcc" />
		{[0, 1, 2, 3].map((r) => (
			<g key={r}>
				<rect x={-200} y={240 + r * 150} width={1100} height={14} fill="#b9b2a0" />
				{Array.from({length: 22}).map((_, i) => {
					const c = ['#e86a6a', '#f2b21c', '#3aa37a', '#3d6fd6', '#f08a3c'][Math.floor(random('sh' + r + i) * 5)];
					return <rect key={i} x={-190 + i * 50} y={240 + r * 150 - 80} width={40} height={80} rx={5} fill={c} />;
				})}
			</g>
		))}
		{/* drinks fridge */}
		<rect x={1260} y={160} width={520} height={740} rx={12} fill="#2b3040" />
		<rect x={1280} y={180} width={480} height={700} fill="#bfe8ff" opacity={0.85 + 0.1 * Math.sin(f / 5)} />
		{[0, 1, 2, 3].map((r) =>
			Array.from({length: 8}).map((_, i) => (
				<rect key={`${r}${i}`} x={1300 + i * 56} y={220 + r * 170} width={40} height={110} rx={8} fill={['#7cf04a', '#ff4a8a', '#ffd34a', '#3d6fd6'][(i + r) % 4]} />
			)),
		)}
		<Floor y={900} c="#c9c2b0" tiles />
	</Svg>
);

/* ------------------------------ assembly hall ------------------------------- */

export const HallBack: React.FC<{f: number; smoke?: number; disco?: number}> = ({f, smoke = 0, disco = 1}) => (
	<Svg>
		<Wall id="ha-w" top="#1b1f40" bot="#2a2d55" />
		{/* stage */}
		<rect x={300} y={560} width={1320} height={160} fill="#3a2a40" />
		<rect x={300} y={548} width={1320} height={16} fill="#6a4a5a" />
		<rect x={340} y={60} width={1240} height={500} fill="#2a1a2a" />
		{/* velvet curtains */}
		{Array.from({length: 7}).map((_, i) => (
			<path key={i} d={`M${340 + i * 40},60 q20,250 0,500 h40 q-20,-250 0,-500 z`} fill={i % 2 ? '#8a1f2e' : '#a32a3a'} />
		))}
		{Array.from({length: 7}).map((_, i) => (
			<path key={'r' + i} d={`M${1300 + i * 40},60 q20,250 0,500 h40 q-20,-250 0,-500 z`} fill={i % 2 ? '#8a1f2e' : '#a32a3a'} />
		))}
		<rect x={300} y={40} width={1320} height={60} fill="#7a1a28" />
		{/* garlands */}
		{[0, 1].map((g) => (
			<g key={g}>
				<path d={`M300,${130 + g * 60} Q960,${260 + g * 60} 1620,${130 + g * 60}`} stroke="#222" strokeWidth={3} fill="none" />
				{Array.from({length: 24}).map((_, i) => {
					const t = i / 23;
					const x = 300 + 1320 * t;
					const y = 130 + g * 60 + 4 * 130 * t * (1 - t);
					const c = ['#ff4f8b', '#ffd34a', '#3fe0e8', '#7cf04a'][(i + g) % 4];
					const on = 0.5 + 0.5 * Math.sin(f / 6 + i * 1.3 + g);
					return (
						<g key={i}>
							<circle cx={x} cy={y + 8} r={16} fill={c} opacity={0.25 * on * disco} />
							<circle cx={x} cy={y + 8} r={6} fill={c} opacity={0.4 + 0.6 * on} />
						</g>
					);
				})}
			</g>
		))}
		{/* DJ booth */}
		<rect x={860} y={470} width={200} height={80} rx={6} fill="#141826" />
		<rect x={870} y={480} width={180} height={12} fill="#3fe0e8" opacity={0.6 + 0.4 * Math.sin(f / 4)} />
		{/* side door (left) + main doors are off to the right in the wide */}
		<rect x={80} y={430} width={170} height={300} fill="#3a4378" />
		<rect x={94} y={444} width={142} height={286} fill="#1a2046" />
		<rect x={110} y={390} width={110} height={36} rx={4} fill="#1f8a4a" />
		<text x={165} y={416} textAnchor="middle" fontSize={20} fontFamily={FONT} fill="#e6ffe6">
			ВЫХОД
		</text>
		<rect x={1700} y={380} width={280} height={350} fill="#5a4a3a" />
		<rect x={1716} y={396} width={120} height={334} fill="#6b5a48" />
		<rect x={1844} y={396} width={120} height={334} fill="#6b5a48" />
		<Floor y={720} c="#3a3048" plank />
		{/* disco beams */}
		{disco > 0
			? [0, 1, 2, 3].map((i) => {
					const a = Math.sin(f / 30 + i * 1.7) * 30;
					const c = ['#ff4f8b', '#3fe0e8', '#ffd34a', '#8b5cf6'][i];
					return (
						<polygon
							key={i}
							points={`${600 + i * 240},40 ${600 + i * 240 + 18},40 ${600 + i * 240 + 300 + a * 12},900 ${600 + i * 240 - 160 + a * 12},900`}
							fill={c}
							opacity={0.09 * disco}
						/>
					);
				})
			: null}
		{smoke > 0 ? (
			<g opacity={smoke}>
				{Array.from({length: 9}).map((_, i) => (
					<ellipse key={i} cx={300 + i * 180 + Math.sin(f / 40 + i) * 40} cy={80 + (i % 3) * 50} rx={260} ry={90} fill="#8a8a9a" opacity={0.45} style={{filter: 'blur(18px)'}} />
				))}
			</g>
		) : null}
	</Svg>
);

/* --------------------------------- street ----------------------------------- */

export const NightStreet: React.FC<{f: number}> = ({f}) => {
	const red = Math.floor(f / 8) % 2 === 0;
	return (
		<Svg>
			<Wall id="ns-sky" top="#070b1f" bot="#232a5a" />
			{Array.from({length: 50}).map((_, i) => (
				<circle key={i} cx={random('ns' + i) * 2200 - 100} cy={random('nsy' + i) * 260} r={1.3} fill="#fff" opacity={0.5} />
			))}
			<rect x={-200} y={200} width={2300} height={700} fill="#3a2a40" />
			{Array.from({length: 2}).map((_, r) =>
				Array.from({length: 9}).map((__, c) => (
					<rect key={`${r}${c}`} x={-120 + c * 250} y={280 + r * 230} width={150} height={150} fill={random('nw' + r + c) > 0.5 ? '#ffcf80' : '#1a2046'} opacity={0.8} />
				)),
			)}
			<rect x={-400} y={900} width={2800} height={300} fill="#1d2245" />
			{/* fence */}
			{Array.from({length: 40}).map((_, i) => (
				<rect key={i} x={-300 + i * 70} y={700} width={10} height={200} fill="#141a38" />
			))}
			<rect x={-300} y={720} width={2800} height={10} fill="#141a38" />
			<rect x={-300} y={860} width={2800} height={10} fill="#141a38" />
			{/* fire truck */}
			<g transform="translate(1250,905)">
				<rect x={0} y={-220} width={560} height={190} rx={12} fill="#c62a2a" />
				<rect x={430} y={-280} width={160} height={250} rx={14} fill="#d63a3a" />
				<rect x={450} y={-260} width={120} height={80} rx={8} fill="#9fd2f0" />
				<rect x={20} y={-250} width={380} height={18} fill="#c9cfdd" />
				{[90, 470].map((x) => (
					<g key={x}>
						<circle cx={x} cy={-20} r={44} fill="#141826" />
						<circle cx={x} cy={-20} r={20} fill="#8a92a8" />
					</g>
				))}
				<rect x={470} y={-300} width={80} height={20} rx={6} fill={red ? '#ff3a3a' : '#3a7aff'} />
				<circle cx={510} cy={-290} r={140} fill={red ? '#ff3a3a' : '#3a7aff'} opacity={0.18} />
			</g>
		</Svg>
	);
};
