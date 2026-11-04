import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {Camera, Dust, Grain, Layer, Letterbox, Svg, Vignette} from '../engine/camera';
import {Bottle, Chair, Desk} from '../engine/props';
import {POSES, Stickman} from '../engine/Stickman';

const Wall: React.FC<{f: number}> = ({f}) => {
	const sec = Math.floor(f / 30) + 12;
	return (
		<Svg>
			<defs>
				<linearGradient id="cl-wall" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stopColor="#e9dcb6" />
					<stop offset="0.7" stopColor="#f3e8c6" />
					<stop offset="1" stopColor="#f8efd2" />
				</linearGradient>
				<linearGradient id="cl-floor" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#d2ab8c" />
					<stop offset="1" stopColor="#b88a6e" />
				</linearGradient>
				<linearGradient id="cl-glass" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#8fb8d8" />
					<stop offset="1" stopColor="#c9dfee" />
				</linearGradient>
				<linearGradient id="cl-board" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#34503f" />
					<stop offset="1" stopColor="#253a2e" />
				</linearGradient>
			</defs>
			<rect x={-300} y={-200} width={2600} height={1000} fill="url(#cl-wall)" />
			<rect x={-300} y={560} width={2600} height={220} fill="#e4d2a6" />
			<rect x={-300} y={556} width={2600} height={10} fill="#8a7458" />
			<rect x={-300} y={760} width={2600} height={500} fill="url(#cl-floor)" />
			<rect x={-300} y={760} width={2600} height={8} fill="#a07a60" />
			{/* chalkboard */}
			<rect x={-160} y={130} width={480} height={360} rx={6} fill="#7b4c2c" />
			<rect x={-146} y={144} width={452} height={332} fill="url(#cl-board)" />
			<g fontFamily="'Caveat', cursive" fontWeight={700}>
				<text x={-120} y={230} fontSize={46} fill="#f4e7a1">
					Homework:
				</text>
				<text x={-90} y={300} fontSize={44} fill="#f6f2e4">
					p. 6–10
				</text>
				<text x={-110} y={420} fontSize={52} fill="#f4e7a1">
					FRIDAY
				</text>
			</g>
			<rect x={-140} y={478} width={440} height={10} fill="#5e3a22" />
			<rect x={40} y={468} width={30} height={9} rx={2} fill="#f6f2e4" />
			<rect x={-150} y={70} width={150} height={44} rx={3} fill="#f3f1ea" />
			<text x={-75} y={102} fontSize={26} fill="#d23b3b" textAnchor="middle" fontFamily="'Rubik', sans-serif" fontWeight={700}>
				J
			</text>
			{/* periodic table */}
			<rect x={380} y={270} width={240} height={160} fill="#f7f5ef" />
			<rect x={390} y={278} width={220} height={10} fill="#d8d6d0" />
			{Array.from({length: 7}).map((_, r) =>
				Array.from({length: 14}).map((__, c) => {
					if (r < 2 && c > 1 && c < 12) return null;
					const cols = ['#e86a6a', '#f3a95b', '#f2d35b', '#8bd17c', '#6cc0e8', '#a68be0', '#e88bc4'];
					return <rect key={`${r}-${c}`} x={394 + c * 15.5} y={298 + r * 17} width={12} height={13} fill={cols[(c + r * 3) % 7]} opacity={0.9} />;
				}),
			)}
			{/* clock */}
			<g transform="translate(560,170)">
				<circle r={66} fill="#3a3a3f" />
				<circle r={58} fill="#fbfaf5" />
				{Array.from({length: 12}).map((_, i) => (
					<line key={i} x1={0} y1={-50} x2={0} y2={-44} stroke="#333" strokeWidth={3} transform={`rotate(${i * 30})`} />
				))}
				<line x1={0} y1={0} x2={0} y2={-30} stroke="#222" strokeWidth={5} strokeLinecap="round" transform="rotate(-60)" />
				<line x1={0} y1={0} x2={0} y2={-44} stroke="#222" strokeWidth={4} strokeLinecap="round" transform="rotate(0)" />
				<line x1={0} y1={8} x2={0} y2={-48} stroke="#d23b3b" strokeWidth={2} transform={`rotate(${sec * 6})`} />
				<circle r={4} fill="#d23b3b" />
			</g>
			{/* THINK poster */}
			<rect x={690} y={270} width={140} height={190} fill="#2f5e9c" />
			<circle cx={760} cy={330} r={28} fill="#f7d65a" />
			<rect x={750} y={352} width={20} height={16} rx={3} fill="#e0e0e0" />
			<text x={760} y={430} fontSize={30} fill="#fff" textAnchor="middle" fontFamily="'Rubik', sans-serif" fontWeight={900}>
				THINK!
			</text>
			{/* map */}
			<rect x={890} y={258} width={300} height={170} fill="#8a6a4c" />
			<rect x={898} y={266} width={284} height={154} fill="#d8ebf0" />
			{[
				[960, 310, 50, 26],
				[1050, 300, 36, 20],
				[1130, 316, 40, 18],
				[1000, 370, 26, 34],
				[1120, 380, 30, 22],
				[940, 380, 18, 14],
			].map(([x, y, rx, ry], i) => (
				<ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#6ab56a" />
			))}
			{/* window */}
			<rect x={1230} y={100} width={860} height={470} fill="#3f3b3b" />
			<rect x={1250} y={120} width={400} height={420} fill="url(#cl-glass)" />
			<rect x={1670} y={120} width={400} height={420} fill="url(#cl-glass)" />
			{[1300, 1360, 1720, 1790].map((x, i) => (
				<polygon key={i} points={`${x},540 ${x + 60},540 ${x + 220},120 ${x + 160},120`} fill="#fff" opacity={0.22} />
			))}
			{Array.from({length: 24}).map((_, i) => {
				const x = 1260 + random('sn' + i) * 800;
				const y = 120 + ((random('sy' + i) * 420 + f * (0.6 + random('sv' + i))) % 420);
				return <circle key={i} cx={x} cy={y} r={2 + random('sr' + i) * 2} fill="#fff" opacity={0.75} />;
			})}
			<rect x={1210} y={560} width={900} height={20} fill="#6b5b4b" />
			{/* globe + plant on sill */}
			<rect x={1355} y={540} width={8} height={22} fill="#555" />
			<circle cx={1359} cy={510} r={36} fill="#3e8fd6" />
			<path d="M1335,495 q15,-10 25,5 q-5,15 -20,10 z M1365,515 q12,-6 18,8 q-10,12 -18,2 z" fill="#5cb85c" />
			<path d="M1325,510 a36,36 0 0 1 68,0" stroke="#b33" strokeWidth={4} fill="none" />
			<path d="M1950,560 l-8,-34 h44 l-8,34 z" fill="#c4643c" />
			{[-30, -10, 10, 30].map((a, i) => (
				<ellipse key={i} cx={1964 + a * 0.7} cy={505} rx={8} ry={20} fill="#4a9a4a" transform={`rotate(${a} ${1964 + a * 0.7} 520)`} />
			))}
			{[1490, 1520, 1540].map((x, i) => (
				<Bottle key={i} x={x} y={560} c={['#d24a4a', '#3a6fd2', '#4aa04a'][i]} />
			))}
			{/* teacher desk */}
			<rect x={-120} y={600} width={420} height={18} fill="#c99a62" />
			<rect x={-100} y={618} width={380} height={170} fill="#a77e50" />
			<rect x={180} y={640} width={80} height={120} fill="#8e6a42" />
			<rect x={190} y={690} width={60} height={6} fill="#6a4e30" />
			<path d="M120,600 L135,520 L180,500" stroke="#2c2c30" strokeWidth={6} fill="none" />
			<path d="M160,486 L215,496 L200,520 Z" fill="#2c2c30" />
			<rect x={10} y={574} width={70} height={26} fill="#f2c94c" />
			<rect x={14} y={566} width={64} height={10} fill="#e86a6a" />
		</Svg>
	);
};

const Rays: React.FC<{f: number}> = ({f}) => {
	const o = 0.11 + 0.03 * Math.sin(f / 25);
	return (
		<Svg>
			<defs>
				<linearGradient id="cl-ray" x1="1" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#fff8e0" stopOpacity="1" />
					<stop offset="1" stopColor="#fff8e0" stopOpacity="0" />
				</linearGradient>
			</defs>
			<polygon points="1260,130 1660,130 1020,1100 380,1100" fill="url(#cl-ray)" opacity={o} />
			<polygon points="1680,130 2070,130 1600,1100 980,1100" fill="url(#cl-ray)" opacity={o * 0.9} />
		</Svg>
	);
};

const FPaper: React.FC<{shake: number}> = ({shake}) => (
	<g transform={`rotate(${-8 + shake}) translate(-14,-118)`}>
		<rect x={0} y={0} width={110} height={140} fill="#fbfbf7" stroke="#c9c9c9" strokeWidth={1.5} />
		<rect x={8} y={8} width={70} height={5} fill="#555" />
		<rect x={8} y={17} width={50} height={3} fill="#999" />
		{Array.from({length: 7}).map((_, i) => (
			<g key={i}>
				<rect x={8} y={32 + i * 14} width={52} height={3} fill="#aaa" />
				{i === 3 ? (
					<path d={`M68,${33 + i * 14} l4,4 l8,-8`} stroke="#3a9a4a" strokeWidth={2.5} fill="none" />
				) : (
					<path d={`M68,${28 + i * 14} l9,9 M77,${28 + i * 14} l-9,9`} stroke="#d63030" strokeWidth={2.5} />
				)}
			</g>
		))}
		<circle cx={90} cy={22} r={15} fill="none" stroke="#d63030" strokeWidth={3} />
		<text x={90} y={31} textAnchor="middle" fontSize={24} fontWeight={900} fill="#d63030" fontFamily="'Rubik', sans-serif">
			F
		</text>
	</g>
);

export const Classroom: React.FC = () => {
	const f = useCurrentFrame();
	const e = Easing.inOut(Easing.cubic);
	const cam = {
		x: interpolate(f, [0, 150], [-70, 80], {easing: e}),
		y: interpolate(f, [0, 150], [10, -20], {easing: e}),
		zoom: interpolate(f, [0, 150], [1.0, 1.1], {easing: e}),
		focus: 1,
		farBlur: 1.6,
		nearBlur: 12,
	};
	const lean = interpolate(f, [5, 45], [8, 26], {easing: Easing.out(Easing.back(1.4)), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const shake = Math.sin(f * 0.9) * (f > 45 ? 2 : 0.5);
	const scared = f > 55;
	const sweatY = scared ? ((f - 55) * 1.2) % 60 : 0;
	const blinkP = (s: number) => {
		const t = (f + s) % 80;
		return t < 4 ? Math.sin((t / 4) * Math.PI) : 0;
	};
	return (
		<AbsoluteFill style={{background: '#e9dcb6'}}>
			<Camera cam={cam}>
				<Layer depth={6}>
					<Wall f={f} />
				</Layer>
				<Layer depth={4} blend="screen">
					<Rays f={f} />
				</Layer>
				<Layer depth={2.2}>
					<Svg>
						<g transform="translate(260,90) scale(0.82)">
							<Chair x={980} y={760} facing={1} />
							<Stickman id="pink" x={985} y={752} scale={1.15} facing={-1} pose={POSES.sit} color="#e98aa8" hair="bun" expr="normal" look={[-0.6, 0]} blink={blinkP(30)} rim="#f6d6a6" rimW={2.4} />
							<Desk x={720} y={690} w={280} front />
							<Bottle x={800} y={690} c="#d24a4a" />
						</g>
					</Svg>
				</Layer>
				<Layer depth={1}>
					<Svg>
						<ellipse cx={1000} cy={1000} rx={760} ry={40} fill="#7a5640" opacity={0.18} />
						{/* left desk */}
						<Desk x={160} y={680} w={300} />
						<Bottle x={260} y={680} c="#3a6fd2" />
						<rect x={330} y={668} width={60} height={12} fill="#e86a6a" />
						{/* yellow student */}
						<Chair x={1270} y={760} facing={1} />
						<Stickman
							id="yellow"
							x={1262}
							y={750}
							scale={1.2}
							facing={-1}
							pose={{...POSES.sit, lean: scared ? -10 : -4, head: scared ? -6 : 0}}
							color="#f2b21c"
							expr={scared ? 'worried' : 'wide'}
							look={[1, scared ? 0.3 : -0.2]}
							mouth={scared ? 'frown' : 'flat'}
							blink={blinkP(0)}
							rim="#fff0d0"
							rimW={2.6}
							light={[2, -1]}
						/>
						{scared ? (
							<path d={`M1300,${505 + sweatY} q-9,14 0,20 q9,-6 0,-20 z`} fill="#bfe6ff" opacity={1 - sweatY / 60} />
						) : null}
						<Desk x={980} y={690} w={250} front />
						{/* teacher */}
						<Stickman
							id="teacher"
							x={830}
							y={690}
							scale={1.2}
							facing={1}
							pose={{lean, head: -lean * 0.6, armB: [-10 + lean * 0.3, 30], armF: [70 + lean * 0.4, 40], legB: [-6, 0], legF: [8, 4]}}
							color="#26355c"
							outfit="suit"
							shoe="#111"
							expr="angry"
							look={[1, 0.3]}
							mouth="flat"
							blink={blinkP(50)}
							rim="#fff0d0"
							rimW={2.6}
							light={[2, -1]}
							handItem={<FPaper shake={shake} />}
						/>
						{/* purple student */}
						<Chair x={1600} y={760} facing={1} />
						<Stickman
							id="purple"
							x={1592}
							y={750}
							scale={1.2}
							facing={-1}
							pose={POSES.sit}
							color="#7d4fc6"
							hair="short"
							expr="normal"
							look={[1, 0]}
							blink={blinkP(20)}
							rim="#fff0d0"
							rimW={2.6}
							light={[2, -1]}
						/>
						<Desk x={1340} y={690} w={230} front />
						<rect x={1560} y={850} width={110} height={140} rx={14} fill="#2a2b30" />
						<rect x={1590} y={836} width={50} height={18} rx={8} fill="none" stroke="#2a2b30" strokeWidth={8} />
						<rect x={1600} y={900} width={30} height={6} fill="#555" />
						<Desk x={1720} y={680} w={320} />
						<Bottle x={1800} y={680} c="#4aa04a" />
						<Bottle x={1950} y={680} c="#d2a04a" />
					</Svg>
				</Layer>
				<Layer depth={0.5}>
					<Svg>
						<g transform="translate(-260,880)">
							<rect x={0} y={0} width={520} height={34} rx={6} fill="#e2b67e" />
							<rect x={20} y={34} width={480} height={240} fill="#3d4250" />
						</g>
					</Svg>
				</Layer>
				<Layer depth={0.8}>
					<Dust seed="cl" n={40} color="#fffbe8" size={[1.5, 4]} speed={0.3} opacity={0.6} />
				</Layer>
			</Camera>
			<AbsoluteFill style={{mixBlendMode: 'soft-light', background: 'linear-gradient(110deg, rgba(120,90,60,0.35), rgba(255,240,200,0.25))'}} />
			<Vignette strength={0.35} color="60,40,20" />
			<Grain opacity={0.12} />
			<Letterbox h={30} />
		</AbsoluteFill>
	);
};
