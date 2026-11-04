import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useVideoConfig} from 'remotion';
import {Pose, Stickman, rigPoints, toLocal} from '../Stickman';
import {CAST, SIT, ageK, blend, env, gesture, idle, reach, run, walk, walkTo} from './cast';
import {Chair} from '../props';
import {Actor, heroAge, useSpeaking, talkOf, useShot} from './core';
import {CrowdRow, HeroBadge, Layer, Mirror, Pop, Rays, Sleeper, Stage, Svg, camOn, clamp, ease, flash, mixCam, usePush} from './kit';
import {Bedroom, Blanket, Corridor, Counter, ClassroomEve, Elevator, Entrance, HallBack, Kitchen, KitchenTable, Pharmacy, SchoolYard, Toilet} from './sets';
import {Accent, Board, Bubble, Cite, FONT, PhoneChat, RuleCard} from './ui';

const Flash: React.FC<{o: number; c?: string}> = ({o, c = '#fff'}) => (o > 0.01 ? <AbsoluteFill style={{background: c, opacity: o}} /> : null);

/* hero scale incl. the growth with age, and the head centre of an Actor on a floor/seat */
const heroS = (gf: number, s: number) => s * (1 + 0.07 * ageK(heroAge(gf)));
const headY = (floorOrHip: number, s: number, seated = false) => (seated ? floorOrHip : floorOrHip - 157 * s) - 164 * s;
/* hand to the mouth (sip / spoon / finger to lips), rig-local */
const toMouth = (p: Pose, k: number, dx = 26) => {
	const h = rigPoints(p).head;
	return reach(p, 'F', [h[0] + dx, h[1] + 26], k);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* hero in bed with a free pose (Sleeper from kit has a fixed one): rotated so the head lies on the pillow.
   In this frame local -x points up out of the blanket, so armF ≈ [-90, …] raises the arm. */
const InBed: React.FC<{x: number; y: number; s?: number; pose: Pose; talk?: number; expr?: any; look?: [number, number]; handF?: any}> = ({x, y, s = 0.95, pose, talk = 0, expr = 'sleepy', look = [0.4, -0.5], handF}) => {
	const {gf} = useShot();
	return (
		<g transform={`translate(${x},${y}) rotate(84)`}>
			<Stickman id="inbed" x={0} y={0} scale={s} pose={pose} {...CAST.leva} expr={expr} talk={talk} age={ageK(heroAge(gf))} look={look} faceTurn={0.2} handF={handF} />
		</g>
	);
};
const BED_POSE: Pose = {lean: 0, head: -10, armB: [4, 10], armF: [6, 12], legB: [0, 0], legF: [3, 0]};

/* ================================ COLD OPEN ================================ */

export const S01: React.FC = () => {
	const {f, gf} = useShot();
	const cam = usePush(camOn(960, 520, 1.0), camOn(960, 470, 1.18));
	return (
		<Stage cam={cam} bg="#cfe3dc" dust="#f2fff6">
			<Layer depth={1.6}>
				<Toilet f={f} />
			</Layer>
			<Layer depth={1.6}>
				<Svg>
					<Mirror x={575} y={165} w={770} h={490} id="m01">
						<Actor who="leva" x={960} floor={1080} s={1.7} facing={-1} faceTurn={0.15} expr="worried" look={[0, 0]} pose={{...idle(gf), armF: [40, 90], armB: [-10, 20]}} />
						<HeroBadge x={960} y={400} s={0.9} />
					</Mirror>
				</Svg>
			</Layer>
			<Layer depth={0.55}>
				<Svg>
					<circle cx={1560} cy={1040} r={170} fill="#000" />
					<rect x={1300} y={1060} width={560} height={300} rx={120} fill="#f2b21c" />
				</Svg>
			</Layer>
		</Stage>
	);
};

const SmokeHall: React.FC<{run?: boolean}> = ({run: r = true}) => {
	const {f, gf} = useShot();
	const alarm = 0.5 + 0.5 * Math.sin(gf / 5);
	return (
		<>
			<Layer depth={2.2}>
				<HallBack f={gf} smoke={1} disco={0.15} />
			</Layer>
			<Layer depth={1.6}>
				<Svg>
					<CrowdRow n={14} x0={-200} x1={1700} floor={760} s={0.7} mode={r ? 'panic' : 'stand'} seed="h1" dir={1} t={f} />
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Svg>
					<CrowdRow n={9} x0={-300} x1={1500} floor={980} s={1} mode={r ? 'run' : 'stand'} seed="h2" dir={1} t={f} />
				</Svg>
			</Layer>
			<AbsoluteFill style={{background: '#ff2a2a', mixBlendMode: 'overlay', opacity: 0.25 * alarm}} />
		</>
	);
};

/* «За стеной — актовый зал…»: Лёва (34) bursts into the doorway, grabs the frame, freezes at the crowd */
export const S02: React.FC = () => {
	const {f, gf, at} = useShot();
	const r = f - at('002');
	const cam = usePush(camOn(900, 560, 1.0), camOn(1060, 540, 1.14));
	const w = walkTo(r, -6, 22, -420, 170, 2, 0.5);
	let p: Pose = w.pose;
	p = reach(p, 'B', [-70, -150], env(r, 18, 400, 8, 8)); // hand on the door frame
	const shock = env(r, 128, 400, 6, 8);
	p = {...p, lean: p.lean - 8 * shock, head: p.head - 6 * shock};
	const alarm = 0.5 + 0.5 * Math.sin(gf / 5);
	return (
		<Stage cam={cam} bg="#1b1f40" light={{x: 50, y: 0, c: '255,90,80', o: 0.35 * alarm}}>
			<SmokeHall />
			<Layer depth={0.8} sharp>
				<Svg>
					<rect x={-400} y={-200} width={300} height={1500} fill="#0e1028" />
					<rect x={-110} y={-200} width={36} height={1500} fill="#2a2f5a" />
					<Actor who="leva" x={w.x} floor={1240} s={1.5} facing={1} faceTurn={0.6} look={[0.9, 0]} expr={shock > 0.5 ? 'wide' : 'worried'} mouth={shock > 0.5 ? 'open' : undefined} pose={p} vx={w.vx} bob={w.bob} uid="l02" />
				</Svg>
			</Layer>
		</Stage>
	);
};

/* close-ups on the hero in the smoke.
   S03 «Ты знаешь, как их спасти. Для этого нужно соврать.» — fist, then the hand creeps to the chin.
   S04 «Если тебе поверят все триста — … трёхсотлетним.» — eyes widen, hands to the head, the badge glitches to 334. */
const HeroClose: React.FC<{mode: 'know' | 'cost'}> = ({mode}) => {
	const {f, gf, at} = useShot();
	const cam = usePush(camOn(960, 400, 1.0, {farBlur: 9}), camOn(960, 360, 1.16, {farBlur: 9}));
	let p: Pose = {...idle(gf), armF: [10, 20]};
	let expr: any = 'angry';
	let over = false;
	let ghost = false;
	if (mode === 'know') {
		const r = f - at('003');
		const fist = env(r, 6, 50, 8, 8);
		p = reach(p, 'F', [38, -98 + Math.sin(r / 2) * 3 * fist], fist);
		const doubt = env(r, 58, 140, 10, 10);
		p = gesture('rubChin', p, doubt, f);
		over = doubt > 0.5;
		expr = doubt > 0.3 ? 'worried' : 'angry';
	} else {
		const r = f - at('004');
		expr = r > 20 ? 'wide' : 'worried';
		const grab = env(r, 70, 200, 10, 10);
		p = gesture('handsOnHead', p, grab, f);
		over = grab > 0.5;
		ghost = r > 75 && Math.floor(f / 4) % 2 === 0;
	}
	return (
		<Stage cam={cam} bg="#1b1f40" light={{x: 30, y: 10, c: '255,120,90', o: 0.4}}>
			<Layer depth={6}>
				<HallBack f={gf} smoke={1} disco={0.2} />
			</Layer>
			<AbsoluteFill style={{background: '#ff2a2a', mixBlendMode: 'overlay', opacity: 0.18 + 0.12 * Math.sin(gf / 5)}} />
			<Layer depth={1}>
				<Svg>
					<Actor who="leva" x={960} floor={1650} s={3.2} faceTurn={0.25} expr={expr} mouth={mode === 'cost' && expr === 'wide' ? 'open' : undefined} look={mode === 'cost' ? [0.6 * Math.sin(f / 9), 0] : [0.1, 0]} pose={p} hideLegs armOver={over} shadow={false} uid="lclose" />
					{ghost ? <HeroBadge x={960} y={250} s={1.2} value={334} /> : <HeroBadge x={960} y={250} s={1.2} />}
				</Svg>
			</Layer>
		</Stage>
	);
};
export const S03: React.FC = () => <HeroClose mode="know" />;
export const S04: React.FC = () => <HeroClose mode="cost" />;

/* title card with the three tiny lies */
export const S05: React.FC = () => {
	const {f, at, gf} = useShot();
	const {fps} = useVideoConfig();
	const k = spring({frame: f, fps, config: {damping: 13, stiffness: 120}});
	const t0 = at('005');
	const lies = [
		{w: '«нормально»', at: t0 + 120},
		{w: '«уже выхожу»', at: t0 + 165},
		{w: '«я сделал уроки»', at: t0 + 215},
	];
	const n = lies.filter((l) => f >= l.at).length;
	// shrugs at «Не за большую. За любую.», flinches and grabs his face at every «+1»
	let p: Pose = gesture('shrug', idle(gf), env(f, t0 + 96, t0 + 150, 8, 8), f);
	let hit = 0;
	let over = false;
	for (const l of lies) {
		const kk = env(f, l.at, l.at + 34, 4, 10);
		hit = Math.max(hit, Math.exp(-Math.max(0, f - l.at) / 4) * (f >= l.at ? 1 : 0));
		if (kk > 0) {
			p = gesture('touchFace', p, kk, f);
			over = over || kk > 0.5;
		}
	}
	return (
		<Board tint="#22285c">
			<g transform={`translate(960,230) scale(${k})`}>
				<text textAnchor="middle" fontSize={64} fontFamily={FONT} fill="#fff">
					ЧТО, ЕСЛИ БЫ ТЫ СТАРЕЛ
				</text>
				<text y={84} textAnchor="middle" fontSize={64} fontFamily={FONT} fill="#ffc94a">
					НА ГОД ЗА КАЖДУЮ ЛОЖЬ?
				</text>
			</g>
			<Stickman id="t5" x={960} y={760} scale={1.3} pose={p} squash={0.08 * hit} {...CAST.leva} age={ageK(16 + n * 6)} expr={n ? (hit > 0.3 ? 'wide' : 'worried') : 'normal'} faceTurn={0.1} look={[0, 0]} armOver={over} />
			<HeroBadgeStatic x={960} y={430} v={16 + n} pop={lies.some((l) => f >= l.at && f < l.at + 8)} />
			{lies.map((l, i) => (
				<Bubble key={i} x={[460, 1460, 520][i]} y={[600, 620, 900][i]} w={360} h={90} t={f - l.at} tail={[i === 1 ? -170 : 170, 70]}>
					<text textAnchor="middle" y={12} fontSize={34} fontFamily="'Rubik', sans-serif" fontWeight={700} fill="#1b1e2a">
						{l.w}
					</text>
					<text x={150} y={-30} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#ff6a5a">
						+1
					</text>
				</Bubble>
			))}
		</Board>
	);
};
const HeroBadgeStatic: React.FC<{x: number; y: number; v: number; pop: boolean}> = ({x, y, v, pop}) => {
	return (
		<g transform={`translate(${x},${y}) scale(${pop ? 1.18 : 1})`}>
			<rect x={-110} y={-32} width={220} height={64} rx={32} fill="#11142c" stroke="#ffc94a" strokeWidth={4} />
			<text x={-84} y={9} fontSize={22} fontFamily={FONT} fill="#ffe7a8">
				ВОЗРАСТ
			</text>
			<text x={90} y={15} textAnchor="end" fontSize={40} fontFamily={FONT} fill="#fff">
				{v}
			</text>
		</g>
	);
};

/* rewind: two weeks back */
export const S06: React.FC = () => {
	const {f, dur} = useShot();
	const spin = -f * 38;
	return (
		<AbsoluteFill style={{background: '#0d1030'}}>
			<svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{transform: `scale(${1.12 - 0.12 * interpolate(f, [0, dur], [0, 1], clamp)}) rotate(${-2 + 4 * interpolate(f, [0, dur], [0, 1], clamp)}deg)`}}>
				{Array.from({length: 30}).map((_, i) => (
					<rect key={i} x={0} y={((i * 47 + f * 40) % 1100) - 20} width={1920} height={3} fill="#fff" opacity={0.06} />
				))}
				<g transform="translate(960,470)">
					<circle r={190} fill="#f6f2e4" />
					<circle r={190} fill="none" stroke="#2b2f3a" strokeWidth={16} />
					{Array.from({length: 12}).map((_, i) => (
						<line key={i} x1={0} y1={-165} x2={0} y2={-150} stroke="#2b2f3a" strokeWidth={6} transform={`rotate(${i * 30})`} />
					))}
					<line x1={0} y1={0} x2={0} y2={-120} stroke="#2b2f3a" strokeWidth={10} strokeLinecap="round" transform={`rotate(${spin / 12})`} />
					<line x1={0} y1={0} x2={0} y2={-160} stroke="#d23b3b" strokeWidth={6} strokeLinecap="round" transform={`rotate(${spin})`} />
				</g>
				{Array.from({length: 8}).map((_, i) => {
					const t = ((f * 0.03 + i / 8) % 1);
					return (
						<g key={i} transform={`translate(${200 + i * 210},${900 - t * 900}) rotate(${(1 - t) * 40 - 20})`} opacity={1 - t}>
							<rect x={-55} y={-60} width={110} height={120} rx={8} fill="#fbf8ef" />
							<rect x={-55} y={-60} width={110} height={30} rx={8} fill="#d23b3b" />
							<text y={36} textAnchor="middle" fontSize={50} fontFamily={FONT} fill="#1b1e2a">
								{14 - i}
							</text>
						</g>
					);
				})}
				<text x={960} y={800} textAnchor="middle" fontSize={70} fontFamily={FONT} fill="#ffc94a" opacity={interpolate(f, [10, 20, dur - 6, dur], [0, 1, 1, 0], clamp)}>
					◀◀ 2 НЕДЕЛИ НАЗАД
				</text>
				{/* Лёва moonwalks backwards across the bottom and gets younger on the way */}
				{(() => {
					const u = interpolate(f, [0, dur], [0, 1], clamp);
					const x = lerp(1820, 120, u);
					return (
						<g opacity={interpolate(f, [0, 6, dur - 6, dur], [0, 1, 1, 0], clamp)}>
							<Stickman id="rw" x={x} y={985} scale={0.45} facing={1} pose={walk(-f * 0.45)} {...CAST.leva} age={1 - u} expr="wide" look={[-0.6, 0]} faceTurn={0.6} rimW={1.6} />
							<g transform={`translate(${x},${985 - 125})`}>
								<rect x={-46} y={-20} width={92} height={40} rx={20} fill="#11142c" stroke="#ffc94a" strokeWidth={3} />
								<text y={11} textAnchor="middle" fontSize={28} fontFamily={FONT} fill="#fff">
									{Math.round(lerp(34, 16, u))}
								</text>
							</g>
						</g>
					);
				})()}
			</svg>
		</AbsoluteFill>
	);
};

/* ================================ MORNING ================================= */

/* «…ни разу в жизни не вставал по первому будильнику»: asleep with Zzz, then an arm flails out
   of the blanket hunting for the ringing clock and flops back */
export const S07: React.FC = () => {
	const {f, gf, at} = useShot();
	const r = f - at('007');
	const cam = usePush(camOn(1300, 560, 1.15), camOn(1380, 610, 1.34));
	const wake = talkOf('LEVA', gf);
	const flail = env(r, 118, 250, 8, 10);
	const pose: Pose = blend({...BED_POSE, head: BED_POSE.head + Math.sin(gf / 30) * 3}, {...BED_POSE, head: -20, armF: [-100 + 38 * Math.sin(r / 3), 40 + 34 * Math.abs(Math.sin(r / 2.4))]}, flail);
	const lift = flail * 8 * Math.abs(Math.sin(r / 4));
	return (
		<Stage cam={cam} bg="#a9cfe0" dust="#fff6d8" light={{x: 45, y: 20, o: 0.5}}>
			<Layer depth={1.4}>
				<Bedroom f={gf} ring={f < at('008') + 10} />
			</Layer>
			<Layer depth={1.4}>
				<Rays x={800} y={180} w={360} len={720} angle={-32} o={0.2} />
			</Layer>
			<Layer depth={1.4}>
				<Svg>
					<InBed x={1500} y={700} pose={pose} talk={wake} expr={flail > 0.3 ? 'angry' : 'sleepy'} />
					{r < 118
						? [0, 1, 2].map((i) => {
								const t = ((r + i * 22) % 66) / 66;
								return (
									<text key={i} x={1690 + t * 70} y={600 - t * 150} fontSize={34 + t * 24} fontFamily={FONT} fill="#2b3366" opacity={Math.sin(t * Math.PI) * 0.8}>
										Z
									</text>
								);
							})
						: null}
				</Svg>
			</Layer>
			<Layer depth={1.4}>
				<Blanket f={gf} lift={lift} />
			</Layer>
			<Layer depth={1.4}>
				<Svg>{f >= at('009') - 4 ? <HeroBadge x={1655} y={560} s={0.85} /> : null}</Svg>
			</Layer>
			<Accent text="ЛЁВА · 16 ЛЕТ · ТВЕРЬ · 10 «Б»" t={f - 20} dur={at('008') - 10} y={930} />
		</Stage>
	);
};

/* mom calling from the doorway */
/* mom leans into the doorway and calls; «Встал!» — a thumbs-up from under the blanket, eyes shut */
export const S08: React.FC = () => {
	const {f, gf, at} = useShot();
	const P = usePush(camOn(700, 560, 1.0), camOn(940, 560, 1.1));
	const cam = useSpeaking(gf) === 'LEVA' ? camOn(1520, 640, 1.55, {farBlur: 5}) : P;
	const w = walkTo(f, -4, 24, -280, 60, 1, 0.36);
	let mp: Pose = w.pose;
	mp = toMouth(mp, env(f, at('008') - 4, at('008') + 36, 6, 8), 46);
	mp = gesture('armsCrossed', mp, env(f, at('009') + 34, at('009') + 200, 10, 10), f);
	const thumb = env(f, at('009') - 4, at('009') + 60, 5, 10);
	const bed: Pose = blend({...BED_POSE, head: BED_POSE.head + Math.sin(gf / 30) * 3}, {...BED_POSE, armF: [-92, 6]}, thumb);
	return (
		<Stage cam={cam} bg="#a9cfe0" dust="#fff6d8" light={{x: 45, y: 20, o: 0.5}}>
			<Layer depth={1.4}>
				<Bedroom f={gf} />
			</Layer>
			<Layer depth={1.4}>
				<Rays x={800} y={180} w={360} len={720} angle={-32} o={0.2} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<rect x={-120} y={170} width={300} height={740} fill="#efe6cf" />
					<rect x={-100} y={190} width={260} height={720} fill="#fff6e4" />
					<Actor who="mom" x={w.x} s={1.05} faceTurn={0.6} look={[0.8, 0]} pose={mp} vx={w.vx} bob={w.bob} expr={f > at('009') + 30 ? 'sad' : 'normal'} mouth={f > at('009') + 30 ? 'flat' : undefined} uid="m08" />
					<InBed x={1500} y={700} pose={bed} talk={talkOf('LEVA', gf)} handF={thumb > 0.5 ? 'point' : undefined} />
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Blanket f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<HeroBadge x={1655} y={560} s={0.85} />
				</Svg>
			</Layer>
		</Stage>
	);
};

/* kitchen Q&A: three tiny lies */
export const S10: React.FC = () => {
	const {f, gf, at} = useShot();
	const sp = useSpeaking(gf);
	const wide = camOn(960, 560, 1.0);
	const momC = camOn(640, 630, 1.7, {farBlur: 6});
	const levC = camOn(1270, 560, 1.7, {farBlur: 6});
	const target = sp === 'MOM' ? momC : sp === 'LEVA' ? levC : wide;
	const cam = mixCam(target, target, 0);
	const pour = f < at('011');
	// mom: pours, then turns with a hand on the hip («Уроки сделал?») and points («Зубы чистил?»)
	let mp: Pose = {...idle(gf), armF: pour ? [70, 40] : [20, 30]};
	mp = gesture('presentF', mp, env(f, at('011') - 4, at('011') + 40, 6, 8), f);
	mp = gesture('point', mp, env(f, at('014') - 4, at('014') + 40, 5, 8), f);
	// Лёва: a big yawn, an «Ага» shrug, flinches + rubs his chin on each click, a fake grin on «Конечно»
	let lp: Pose = {...SIT, armF: [60, 50]};
	const yawn = env(f, 6, 70, 10, 12);
	lp = blend(lp, {...SIT, lean: -12, head: -16, armF: [168, 30], armB: [-160, 30]}, yawn);
	lp = gesture('shrug', lp, env(f, at('012') - 2, at('012') + 26, 4, 8), f);
	const c1 = env(f, at('013'), at('013') + 30, 3, 8);
	const c2 = env(f, at('016'), at('016') + 40, 3, 10);
	lp = gesture('rubChin', lp, Math.max(c1, c2), f);
	const flinch = Math.max(Math.exp(-Math.max(0, f - at('013')) / 3) * (f >= at('013') ? 1 : 0), Math.exp(-Math.max(0, f - at('016')) / 3) * (f >= at('016') ? 1 : 0));
	const grin = f >= at('015') - 2 && f < at('015') + 30;
	return (
		<Stage cam={{...cam, x: cam.x + Math.sin(f / 60) * 10}} bg="#f3e6c4" dust="#fff6d8" light={{x: 50, y: 10, o: 0.45}}>
			<Layer depth={1.5}>
				<Kitchen />
			</Layer>
			<Layer depth={1.5}>
				<Rays x={840} y={170} w={320} len={760} angle={-24} o={0.18} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="mom" x={640} s={1.05} faceTurn={0.6} look={[0.8, 0.1]} pose={mp} handF={f > at('014') && f < at('014') + 40 ? 'point' : undefined} expr={f > at('014') ? 'worried' : 'normal'} handItem={pour ? <g><rect x={-14} y={-46} width={44} height={50} rx={8} fill="#2b2f3a" /><rect x={26} y={-6} width={6} height={80} fill="#6b3a1a" /></g> : undefined} />
					<Chair x={1270} y={800} facing={-1} />
					<Chair x={640} y={800} facing={1} />
					<Actor who="leva" x={1270} s={1} facing={-1} seat={790} pose={lp} squash={0.06 * flinch} faceTurn={0.6} look={f > at('012') - 2 && f < at('013') ? [-0.7, -0.4] : flinch > 0.2 ? [0, -1] : [0.8, 0]} expr={yawn > 0.3 ? 'sleepy' : flinch > 0.2 || c2 > 0.2 ? 'wide' : 'sleepy'} mouth={yawn > 0.4 ? 'open' : grin ? 'smile' : undefined} armOver={c1 > 0.5 || c2 > 0.5} />
					<HeroBadge x={1270} y={500} s={0.8} />
				</Svg>
			</Layer>
			<Layer depth={1}>
				<KitchenTable />
			</Layer>
		</Stage>
	);
};

/* elevator mirror */
/* elevator mirror. 016: sees the price-tag badge («девятнадцать»), feels the stubble.
   017: rubs the mirror, steps into the corner (the badge follows), swats at it, gives up («раз сорок»). */
export const S11: React.FC = () => {
	const {f, gf, at} = useShot();
	const r16 = f - at('016');
	const r17 = f - at('017');
	const cam = usePush(camOn(960, 520, 1.15), camOn(960, 470, 1.38));
	// reflection x (the real Лёва stands mirrored in the foreground)
	const w = walkTo(r17, 82, 124, 960, 700, 4, 0.32);
	const x = w.x;
	let p: Pose = r17 > 82 && r17 < 124 ? w.pose : idle(gf);
	const lookUp = env(r16, 100, 190, 10, 10);
	p = {...p, head: p.head - 14 * lookUp};
	const chin = env(r16, 178, 300, 8, 10);
	p = gesture('touchFace', p, chin, f);
	const rubC = env(r16, 260, 330, 6, 10);
	p = gesture('rubChin', p, rubC, f);
	const wipe = env(r17, 0, 40, 6, 6);
	p = blend(p, {...p, armF: [96 + 26 * Math.sin(r17 / 2.2), 24 + 10 * Math.cos(r17 / 2.2)]}, wipe);
	const swat = env(r17, 160, 232, 6, 10);
	p = blend(p, {...p, head: -16, armF: [170 + 28 * Math.sin(r17 / 2.3), 30], lean: 4 * Math.sin(r17 / 2.3)}, swat);
	p = gesture('shrug', p, env(r17, 240, 330, 8, 10), f);
	const pop = r16 >= 150 && r16 < 162 ? 1 : 0;
	const lean = env(r16, 250, 340, 12, 12);
	const s = 1.35 + 0.18 * lean;
	const sH = heroS(gf, s);
	const hy = headY(1080, sH);
	const expr = swat > 0.3 ? 'angry' : lookUp > 0.3 || chin > 0.3 ? 'wide' : r17 > 230 ? 'sad' : 'sleepy';
	return (
		<Stage cam={cam} bg="#7d8699" light={{x: 50, y: 0, c: '235,245,255', o: 0.45}}>
			<Layer depth={1.3}>
				<Elevator f={f} />
			</Layer>
			<Layer depth={1.3} sharp>
				<Svg>
					<Mirror x={540} y={130} w={840} h={720} id="m11">
						<Actor who="leva" x={x} floor={1080} s={s} facing={-1} faceTurn={r17 > 82 && r17 < 124 ? 0.6 : 0.1} look={lookUp > 0.3 || swat > 0.3 ? [0, -1] : chin > 0.3 ? [0.2, 0.3] : [0, -0.1]} expr={expr} mouth={pop ? 'open' : undefined} pose={p} squash={0.05 * pop} vx={w.vx} bob={w.bob} armOver={chin > 0.5 || rubC > 0.5} shadow={false} uid="lr" />
						<HeroBadge x={x + (swat > 0 ? Math.sin(r17 / 1.7) * 14 * swat : 0)} y={hy - 112 * sH} s={0.85} />
						{wipe > 0 ? <path d={`M${x - 160},${hy + 40} q80,-60 160,0 q80,60 160,0`} stroke="#fff" strokeWidth={14} fill="none" opacity={0.25 * wipe} strokeLinecap="round" /> : null}
					</Mirror>
				</Svg>
			</Layer>
			<Layer depth={0.6}>
				<Svg>
					<g transform={`translate(${960 - x},0)`}>
						<circle cx={960} cy={1000} r={150} fill="#000" />
						<path d="M760,1100 Q960,980 1160,1100 Z" fill="#f2b21c" />
					</g>
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Pop t={r17 - 250} x={x + 260} y={hy - 60}>
						<rect x={-150} y={-34} width={300} height={68} rx={34} fill="#11142c" stroke="#ffc94a" strokeWidth={4} />
						<text y={12} textAnchor="middle" fontSize={30} fontFamily={FONT} fill="#fff">
							ПРОВЕРОК: ×40
						</text>
					</Pop>
				</Svg>
			</Layer>
		</Stage>
	);
};

/* pharmacy: mom never lies */
export const S12: React.FC = () => {
	const {f, gf, at} = useShot();
	const sp = useSpeaking(gf);
	const P = usePush(camOn(960, 540, 1.0), camOn(960, 540, 1.08));
	const cam = sp === 'MOM' ? camOn(760, 610, 1.6) : P;
	const shock = f > at('019') + 30;
	const r = f - at('018');
	// mom serves the queue: hands pill boxes over the counter, beat after beat
	let mp: Pose = idle(gf);
	const give = Math.max(env(r, 30, 70, 8, 8), env(r, 100, 140, 8, 8), env(r, 160, 196, 8, 8));
	mp = blend(mp, {...mp, lean: 8, armF: [86, 14]}, give);
	// «Нет, Света. Не идёт.» — a calm head shake; then a shrug at «не умеет врать»
	const shake = env(f, at('019') - 2, at('019') + 50, 4, 8);
	mp = {...mp, head: mp.head + Math.sin(f / 2.4) * 11 * shake};
	mp = gesture('shrug', mp, env(f, at('020') + 10, at('020') + 70, 8, 10), f);
	// Света sweeps in, fluffs her new hair, gets the truth, clutches her head and storms off
	const inW = walkTo(r, 210, 250, 2200, 1220, 6, 0.34);
	const outW = walkTo(f, at('020') + 40, at('020') + 100, 1220, 2300, 6, 0.4);
	const leaving = f > at('020') + 40;
	const sw = leaving ? outW : inW;
	let sp2: Pose = sw.pose;
	const fluff = env(r, 250, 360, 8, 8);
	sp2 = reach({...sp2, head: sp2.head - 10 * fluff + Math.sin(f / 5) * 5 * fluff}, 'F', [10 + Math.sin(f / 3) * 6, -250], fluff);
	sp2 = gesture('handsOnHead', sp2, env(f, at('019') + 30, at('020') + 36, 6, 8), f);
	const sx = sw.x;
	const hairY = 900 - 157 * 1.02 - 125 * 1.02 - 50 - sw.bob;
	return (
		<Stage cam={cam} bg="#e2f2ee" dust="#ffffff" light={{x: 55, y: 0, c: '235,255,248', o: 0.45}}>
			<Layer depth={1.6}>
				<Pharmacy />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="momWork" x={760} s={1.05} faceTurn={0.5} look={sx < 2000 ? [0.8, 0] : [0.3, 0.2]} pose={mp} handItem={give > 0.3 ? <rect x={-14} y={-20} width={30} height={22} rx={3} fill="#fff" stroke="#3fae8f" strokeWidth={3} /> : undefined} mouth={shake > 0 ? 'flat' : undefined} />
					<Actor who="sveta" x={sx} s={1.02} facing={leaving ? 1 : -1} faceTurn={0.6} look={[0.9, 0]} expr={shock ? (leaving ? 'angry' : 'wide') : 'normal'} mouth={shock ? 'open' : 'smile'} pose={sp2} vx={sw.vx} bob={sw.bob} armOver={false} uid="sv12" />
					<g transform={`translate(${sx + 2},${hairY})`}>
						{[-60, -30, 0, 30, 60].map((dx, i) => (
							<circle key={i} cx={dx} cy={-90 - Math.abs(dx) * -0.4 - (i % 2) * 30} r={46} fill="#ff8ac4" />
						))}
						<circle cx={0} cy={-150} r={50} fill="#ff9fd0" />
					</g>
				</Svg>
			</Layer>
			<Layer depth={0.9}>
				<Counter />
			</Layer>
			<Accent text="мама не умеет врать" t={f - at('020')} dur={110} c="#9ff0b0" />
		</Stage>
	);
};

/* ================================== GOSHA ================================== */

export const S13: React.FC = () => {
	const {f, gf, at} = useShot();
	const cam = usePush(camOn(960, 540, 1.0), camOn(900, 520, 1.15));
	const t0 = at('021');
	return (
		<Stage cam={cam} bg="#7fc0ea">
			<Layer depth={2.2}>
				<SchoolYard f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="gosha" x={900} s={1.15} faceTurn={0.2} look={[0, 0]} expr="normal" mouth="smirk" pose={{...idle(gf), armF: [100 + Math.sin(f / 9) * 20, 40], armB: [-20, 30]}} />
					<Bubble x={480} y={330} w={300} h={160} t={f - t0 - 70} tail={[220, 140]} thought>
						<path d="M0,-50 l24,60 h-48 z" fill="#d23b3b" />
						<rect x={-14} y={10} width={28} height={36} fill="#9aa3b5" />
						<text y={66} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="#1b1e2a">
							ДЯДЯ-КОСМОНАВТ
						</text>
					</Bubble>
					<Bubble x={960} y={210} w={300} h={130} t={f - t0 - 130} tail={[0, 120]} thought>
						<text y={10} textAnchor="middle" fontSize={44} fontFamily={FONT} fill="#1b1e2a">
							40×
						</text>
						<text y={46} textAnchor="middle" fontSize={20} fontFamily={FONT} fill="#555">
							ПОДТЯГИВАНИЙ
						</text>
					</Bubble>
					<Bubble x={1450} y={340} w={300} h={160} t={f - t0 - 190} tail={[-230, 140]} thought>
						<rect x={-12} y={-50} width={24} height={50} rx={12} fill="#2b2f3a" />
						<rect x={-4} y={0} width={8} height={30} fill="#2b2f3a" />
						<text y={66} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="#1b1e2a">
							🤫 ЗНАКОМ С РЭПЕРОМ
						</text>
					</Bubble>
				</Svg>
			</Layer>
		</Stage>
	);
};

/* Serota 2010 infographic */
export const S14: React.FC = () => {
	const {f, at} = useShot();
	const t0 = at('022');
	const show = (d: number) => interpolate(f, [t0 + d, t0 + d + 25], [0, 1], clamp);
	const grid = show(110);
	const grey = show(300);
	const gosha = show(470);
	return (
		<Board>
			<text x={960} y={110} textAnchor="middle" fontSize={46} fontFamily={FONT} fill="#fff" opacity={show(0)}>
				1000 ЧЕЛОВЕК · СКОЛЬКО РАЗ СОВРАЛИ ЗА СУТКИ
			</text>
			{Array.from({length: 1000}).map((_, i) => {
				const c = i % 50;
				const r = Math.floor(i / 50);
				const isZero = random('sz' + i) < 0.6;
				const big = !isZero && random('sb' + i) < 0.12;
				const col = grey > 0.5 ? (isZero ? '#5a6080' : big ? '#ff5a5a' : '#ffc94a') : '#ffc94a';
				return <circle key={i} cx={410 + c * 22} cy={200 + r * 24} r={big && grey > 0.5 ? 9 : 7} fill={col} opacity={grid * (i / 1000 < grid ? 1 : 0)} />;
			})}
			<g opacity={show(200)}>
				<text x={960} y={720} textAnchor="middle" fontSize={90} fontFamily={FONT} fill="#ffc94a">
					≈ 1,65 в среднем
				</text>
			</g>
			<g opacity={grey}>
				<circle cx={480} cy={800} r={12} fill="#5a6080" />
				<text x={505} y={812} fontSize={34} fontFamily={FONT} fill="#cfd4ef">
					60% — НИ РАЗУ
				</text>
				<circle cx={1080} cy={800} r={12} fill="#ff5a5a" />
				<text x={1105} y={812} fontSize={34} fontFamily={FONT} fill="#ffb0a8">
					немногие заядлые вруны
				</text>
			</g>
			<g opacity={gosha} transform={`translate(1650,${940 - gosha * 40})`}>
				<Stickman id="g14" x={0} y={0} scale={0.55} pose={idle(f)} {...CAST.gosha} mouth="smirk" />
				<text x={0} y={-150} textAnchor="middle" fontSize={30} fontFamily={FONT} fill="#ff6a5a">
					ГОША
				</text>
			</g>
			<Cite text="Serota, Levine & Boster, 2010" t={f - t0} />
		</Board>
	);
};

/* corridor two-shot */
const LevaGosha: React.FC<{children?: React.ReactNode; levaExpr?: any; goshaExpr?: any; goshaPose?: any; levaPose?: any; goshaLook?: [number, number]; goshaMouth?: any}> = ({
	children,
	levaExpr = 'normal',
	goshaExpr = 'normal',
	goshaPose,
	levaPose,
	goshaLook = [-0.8, 0],
	goshaMouth,
}) => {
	const {f, gf} = useShot();
	const sp = useSpeaking(gf);
	const wide = camOn(960, 560, 1.05);
	const cl = sp === 'GOSHA' ? camOn(1150, 580, 1.7, {farBlur: 6}) : sp === 'LEVA' ? camOn(770, 580, 1.7, {farBlur: 6}) : wide;
	return (
		<Stage cam={{...cl, x: cl.x + Math.sin(f / 50) * 8}} bg="#f1e6c8">
			<Layer depth={1.6}>
				<Corridor f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="leva" x={770} s={1.05} faceTurn={0.6} look={[0.8, 0]} expr={levaExpr} pose={levaPose} />
					<Actor who="gosha" x={1150} s={1.0} facing={-1} faceTurn={0.6} look={goshaLook} expr={goshaExpr} pose={goshaPose} mouth={goshaMouth} />
					<HeroBadge x={770} y={410} s={0.75} />
					{children}
				</Svg>
			</Layer>
		</Stage>
	);
};

export const S15: React.FC = () => {
	const {f, gf, at} = useShot();
	const touch = f > at('025') + 20;
	return (
		<LevaGosha
			goshaExpr={touch ? 'worried' : 'normal'}
			goshaMouth={f < at('025') ? 'smirk' : 'flat'}
			goshaPose={touch ? {...idle(gf), armF: [120 + Math.sin(f / 4) * 4, 50], lean: 8} : undefined}
		/>
	);
};

export const S16: React.FC = () => {
	const {f, at} = useShot();
	return (
		<LevaGosha levaExpr="normal" goshaMouth="flat" goshaExpr="sleepy">
			<Bubble x={640} y={260} w={260} h={170} t={f - at('028') - 10} tail={[90, 120]}>
				<ellipse cx={0} cy={-6} rx={80} ry={22} fill="#9aa3b5" />
				<ellipse cx={0} cy={-24} rx={36} ry={22} fill="#bfe6ff" />
				<path d="M-40,14 l-20,50 M40,14 l20,50" stroke="#ffd34a" strokeWidth={6} opacity={0.7} />
				<text y={74} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="#1b1e2a">
					НЛО
				</text>
			</Bubble>
			<Pop t={f - at('030') - 8} x={770} y={150}>
				<rect x={-150} y={-30} width={300} height={60} rx={30} fill="#1f8a4a" />
				<text y={12} textAnchor="middle" fontSize={28} fontFamily={FONT} fill="#fff">
					НЕ ПОВЕРИЛ · +0
				</text>
			</Pop>
		</LevaGosha>
	);
};

export const S17: React.FC = () => {
	const {f, gf, at} = useShot();
	const look = f > at('031') + 50 && f < at('033') - 6;
	return (
		<LevaGosha
			goshaLook={look ? [0, 1] : [-0.8, 0]}
			goshaPose={look ? {...idle(gf), head: 28, lean: 10} : f > at('033') ? {...idle(gf), armF: [95, 20]} : undefined}
			goshaExpr={f > at('033') ? 'wide' : 'normal'}
			levaExpr={f > at('033') ? 'wide' : 'normal'}
		>
			<Pop t={f - at('032') - 22} x={770} y={150}>
				<rect x={-130} y={-30} width={260} height={60} rx={30} fill="#d23b3b" />
				<text y={12} textAnchor="middle" fontSize={28} fontFamily={FONT} fill="#fff">
					ПОВЕРИЛ · +1
				</text>
			</Pop>
		</LevaGosha>
	);
};

const BelieveIcon: React.FC = () => (
	<g>
		<Stickman id="ri" x={-160} y={60} scale={0.7} pose={idle(0)} {...CAST.leva} rimW={1.5} mouth="open" />
		<path d="M-60,-120 h130 a20,20 0 0 1 20,20 v40 a20,20 0 0 1 -20,20 h-70 l-30,24 v-24 h-30 a20,20 0 0 1 -20,-20 v-40 a20,20 0 0 1 20,-20 z" fill="#fbf8ef" />
		<text x={5} y={-70} textAnchor="middle" fontSize={30} fontFamily={FONT} fill="#1b1e2a">
			ЛОЖЬ
		</text>
		<Stickman id="ri2" x={170} y={60} scale={0.7} facing={-1} pose={idle(0)} {...CAST.gosha} rimW={1.5} expr="wide" />
		<text x={170} y={-130} textAnchor="middle" fontSize={44} fontFamily={FONT} fill="#9ff0b0">
			✓
		</text>
		<text x={330} y={-40} fontSize={64} fontFamily={FONT} fill="#ff6a5a">
			+1
		</text>
	</g>
);
export const S18: React.FC = () => {
	const {f} = useShot();
	return <RuleCard n="1" title="ПРАВИЛО" text="Год — только если тебе поверили" t={f} icon={<BelieveIcon />} />;
};

/* ================================ NIGHT CHAT =============================== */

export const S19: React.FC = () => {
	const {f, at, gf} = useShot();
	const t0 = at('035');
	const msgs = [
		{at: t0 + 30, from: 'Катя', text: 'завтра алгебра!!! я ничего не понимаю'},
		{at: t0 + 60, from: 'Дима', text: 'всё, я труп'},
		{at: t0 + 85, from: 'Соня', text: 'кто-нибудь решил 5 номер??'},
		{at: t0 + 250, from: 'Лёва', text: 'Расслабьтесь. Марина Петровна сказала, контрольную перенесли', me: true, reads: Math.min(14, Math.max(0, Math.floor((f - t0 - 330) / 6)))},
		...Array.from({length: 7}).map((_, i) => ({at: at('036') + 30 + i * 12, from: ['Катя', 'Дима', 'Соня', 'Артём', 'Вика', 'Рома', 'Лиза'][i], text: 'УРААА 🎉'})),
	];
	const cam = usePush(camOn(900, 540, 1.0), camOn(920, 520, 1.1));
	// the phone buzzes on every incoming message
	let buzz = 0;
	for (const m of msgs) if (!(m as any).me && f >= m.at) buzz = Math.max(buzz, Math.exp(-(f - m.at) / 5));
	const bx = Math.sin(f * 2.7) * 7 * buzz;
	// Лёва in bed, face lit by the screen: worried → typing with a smirk → fist pump at the «ура»
	const typing = env(f, t0 + 150, t0 + 252, 6, 8);
	const party = env(f, at('036') + 36, at('036') + 120, 6, 10);
	let lp: Pose = idle(gf, 2);
	lp = reach(lp, 'F', [118, -120 + Math.sin(f / 1.6) * 5 * typing], 0.9);
	lp = gesture('fist', lp, party, f);
	const expr = party > 0.2 ? 'wide' : typing > 0.2 ? 'normal' : 'worried';
	const mouth = party > 0.2 ? 'smile' : typing > 0.2 ? 'smirk' : 'flat';
	return (
		<Stage cam={cam} bg="#1d2550" light={{night: true, x: 60, y: 50, c: '120,170,255', o: 0.5}}>
			<Layer depth={4}>
				<Bedroom night f={gf} />
			</Layer>
			<AbsoluteFill style={{background: '#0a0d24', opacity: 0.55}} />
			<Layer depth={1.25}>
				<Svg>
					<ellipse cx={420} cy={700} rx={330} ry={260} fill="#7fb0ff" opacity={0.18 + 0.1 * typing} style={{filter: 'blur(40px)'}} />
					<Actor who="leva" x={360} floor={1320} s={1.9} facing={1} faceTurn={0.6} look={[0.9, 0.25]} expr={expr} mouth={mouth} pose={lp} hideLegs shadow={false} rim="#9fc4ff" uid="l19" />
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Svg>
					<g transform={`translate(${bx + 80},0) rotate(${bx * 0.3},1040,560)`}>
						<PhoneChat t={f} msgs={msgs} title="10 «Б» 🔥 (28)" x={960} y={560} s={1.1} />
					</g>
				</Svg>
			</Layer>
		</Stage>
	);
};

/* the jump to 34 */
export const S20: React.FC = () => {
	const {f, gf, at} = useShot();
	const r = f - at('037');
	const shake = r > 40 && r < 95 ? Math.sin(f * 2.1) * 7 : 0;
	const cam = usePush(camOn(960, 520, 1.1), camOn(960, 420, 1.45));
	// «Телефон вибрирует» — phone buzzing in hand; «Футболка становится тесной в плечах» — he pulls at
	// the tee while the badge rolls; «Ты бежишь к зеркалу» — lunges in; «Тридцать четыре» — hands on head
	const phone = r < 92;
	let p: Pose = idle(gf);
	p = reach(p, 'F', [40, -60 + Math.sin(f * 2.2) * 4 * (r < 30 ? 1 : 0)], phone ? 1 : 0);
	const tug = env(r, 34, 92, 8, 6);
	p = reach(reach({...p, head: p.head + 18 * tug}, 'F', [26, -104 + Math.sin(r / 2) * 5], tug), 'B', [-8, -102 - Math.sin(r / 2) * 5], tug);
	const lunge = interpolate(r, [94, 116], [0, 1], {...clamp, easing: ease});
	const grab = env(r, 116, 240, 6, 10);
	p = gesture('handsOnHead', p, grab, f);
	const s = 1.6 + 0.35 * lunge;
	const sH = heroS(gf, s);
	const fl = 1180 + 80 * lunge;
	const hy = headY(fl, sH);
	return (
		<Stage cam={{...cam, x: cam.x + shake, y: cam.y + shake * 0.6}} bg="#1d2550" light={{night: true, x: 50, y: 30, o: 0.5}}>
			<Layer depth={1.4}>
				<Bedroom night f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<rect x={560} y={120} width={800} height={780} rx={10} fill="#3a4380" />
					<Mirror x={580} y={140} w={760} h={740} id="m20">
						<rect x={580} y={140} width={760} height={740} fill="#28306a" />
						<ellipse cx={960} cy={hy + 60} rx={260} ry={220} fill="#7fb0ff" opacity={phone ? 0.16 : 0.05} style={{filter: 'blur(30px)'}} />
						<Actor
							who="leva"
							x={960}
							floor={fl}
							s={s}
							facing={-1}
							faceTurn={0.1}
							look={tug > 0.3 ? [0, 1] : phone ? [0.3, 0.6] : [0, 0]}
							expr={r < 34 ? 'normal' : 'wide'}
							mouth={r > 40 ? 'open' : undefined}
							color="#dcdcdc"
							outfit="tee"
							pose={p}
							squash={tug > 0 ? -0.03 * Math.abs(Math.sin(r / 2)) * tug : 0}
							armOver={grab > 0.5}
							shadow={false}
							handItem={phone ? <g transform={`translate(${r < 30 ? Math.sin(f * 2.6) * 3 : 0},0)`}><rect x={-12} y={-34} width={26} height={44} rx={5} fill="#141a2e" /><rect x={-9} y={-30} width={20} height={34} rx={3} fill="#7fb0ff" /></g> : undefined}
							uid="l20"
						/>
						<HeroBadge x={960} y={hy - 115 * sH} s={1} />
					</Mirror>
				</Svg>
			</Layer>
			<Flash o={flash(f, at('037') + 90, 8)} />
		</Stage>
	);
};

export const S21: React.FC = () => {
	const {f} = useShot();
	return (
		<RuleCard
			n="1"
			title="ПРАВИЛО"
			text="Год — за КАЖДОГО, кто поверил"
			t={f}
			icon={
				<g>
					{Array.from({length: 14}).map((_, i) => (
						<g key={i} transform={`translate(${(i % 7) * 90 - 270},${Math.floor(i / 7) * 110 - 80})`} opacity={f > 10 + i * 3 ? 1 : 0}>
							<circle r={30} fill="#000" stroke="#ffe0c8" strokeWidth={3} />
							<text y={-40} textAnchor="middle" fontSize={26} fontFamily={FONT} fill="#ff6a5a">
								+1
							</text>
						</g>
					))}
				</g>
			}
		/>
	);
};

export const S22: React.FC = () => {
	const {f, at} = useShot();
	const t0 = at('039');
	const msgs = [
		{at: -100, from: 'Лёва', text: 'Расслабьтесь. Марина Петровна сказала, контрольную перенесли', me: true, reads: 14},
		{at: t0 + 20, from: 'Лёва', text: 'Я соврал. Контрольная будет', me: true, reads: 14},
		{at: t0 + 110, from: 'Дима', text: '😂😂😂'},
		{at: t0 + 140, from: 'Катя', text: 'Лёва, хорош прикалываться'},
	];
	const card = f > t0 + 220;
	if (card) return <RuleCard n="2" title="ПРАВИЛО" text="Правда ничего не возвращает?" t={f - t0 - 220} />;
	return (
		<Board tint="#151a3a">
			<PhoneChat t={f} msgs={msgs} title="10 «Б» 🔥 (28)" x={960} y={560} s={1.1} />
		</Board>
	);
};

export const S23: React.FC = () => {
	const {f, at, gf} = useShot();
	const t0 = at('040');
	const fw = interpolate(f, [t0 + 20, t0 + 60], [0, 1], {...clamp, easing: ease});
	return (
		<Board tint="#1d2550">
			<g transform="translate(470,560) scale(0.8)">
				<PhoneChat t={f} msgs={[{at: -10, from: 'Гоша', text: 'Переслано: контрольную перенесли!'}]} title="10 «А» (25)" x={0} y={0} s={1} />
			</g>
			<path d={`M760,560 C900,${560 - 120 * fw} 1060,${560 - 120 * fw} ${760 + 420 * fw},560`} stroke="#ffc94a" strokeWidth={8} fill="none" strokeDasharray="20 14" />
			{Array.from({length: 25}).map((_, i) => (
				<g key={i} transform={`translate(${1250 + (i % 5) * 90},${330 + Math.floor(i / 5) * 95})`} opacity={interpolate(f, [t0 + 60 + i * 3, t0 + 70 + i * 3], [0, 1], clamp)}>
					<circle r={34} fill="#000" stroke="#ffe0c8" strokeWidth={3} />
					<text y={8} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="#9ff0b0">
						✓
					</text>
				</g>
			))}
			<g transform="translate(960,980)">
				<HeroBadge x={0} y={-30} s={1} />
				<text y={50} textAnchor="middle" fontSize={28} fontFamily={FONT} fill="#9ff0b0" opacity={interpolate(f, [t0 + 200, t0 + 215], [0, 1], clamp)}>
					ВСЁ ЕЩЁ 34 · СОВРАЛ НЕ ТЫ
				</text>
			</g>
		</Board>
	);
};

export const S24: React.FC = () => {
	const {f, at} = useShot();
	return (
		<RuleCard
			n="3"
			title="ПРАВИЛО"
			text="Считаются только те, кому соврал ТЫ САМ"
			t={f}
			icon={
				<g opacity={interpolate(f, [at('041') + 200, at('041') + 220], [0, 1], clamp)}>
					<text textAnchor="middle" y={20} fontSize={54} fontFamily={FONT} fill="#ffc94a">
						⭐ ЗАПОМНИ ⭐
					</text>
				</g>
			}
		/>
	);
};

/* ============================= MORNING AT 34 ============================== */

export const S25: React.FC = () => {
	const {f, gf, at} = useShot();
	const flash44 = f > at('044') + 40;
	const sp = useSpeaking(gf);
	const P1 = usePush(camOn(1640, 600, 2.4), camOn(1640, 600, 2.6));
	const P2 = usePush(camOn(960, 540, 1.0), camOn(900, 520, 1.12));
	const cam = flash44 ? P1 : sp === 'MOM' ? camOn(700, 590, 1.7, {farBlur: 6}) : P2;
	const cakes = interpolate(f, [at('044') + 180, at('044') + 300], [0, 1], clamp);
	const turned = f > at('043') + 50;
	// mom sips and stares over the mug; after «Ты похож на папу» she turns away and wipes an eye
	const sip = env(f, at('042'), at('043') - 4, 10, 10) * (0.55 + 0.45 * Math.sin(f / 14));
	let mp: Pose = {...SIT, armF: [70, 70], head: turned ? -16 : 0};
	mp = toMouth(mp, Math.max(0, sip), 30);
	const wipe = env(f, at('044') + 50, at('044') + 170, 10, 12);
	mp = gesture('touchFace', mp, wipe, f);
	// Лёва spoons cereal, freezes mid-air when she speaks, then stares into the bowl
	const eating = f < at('043') - 2;
	const spoon = eating ? 0.5 + 0.5 * Math.sin(f / 9) : f < at('044') ? 0.45 : 0;
	let lp: Pose = SIT;
	lp = toMouth(lp, spoon, 28);
	const down = env(f, at('044') - 4, at('044') + 400, 12, 12);
	lp = {...lp, head: lp.head + 16 * down, lean: lp.lean + 6 * down};
	return (
		<Stage cam={cam} bg="#f3e6c4" dust="#fff6d8" light={{x: 50, y: 10, o: 0.45}}>
			<Layer depth={1.5}>
				<Kitchen />
			</Layer>
			<Layer depth={1.5}>
				<Rays x={840} y={170} w={320} len={760} angle={-24} o={0.16} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Chair x={700} y={800} facing={1} />
					<Chair x={1240} y={800} facing={-1} />
					<Actor who="mom" x={700} s={1.05} seat={790} pose={mp} faceTurn={turned ? -0.4 : 0.6} look={turned ? [-0.8, 0.3] : [0.8, 0]} expr="sad" armOver={wipe > 0.5} handItem={wipe < 0.3 ? <g><rect x={-6} y={-26} width={34} height={36} rx={7} fill="#3a6fd2" /><path d="M28,-18 q14,0 14,11 q0,11 -14,11" stroke="#3a6fd2" strokeWidth={6} fill="none" /></g> : undefined} />
					<Actor who="leva" x={1240} facing={-1} seat={790} pose={lp} faceTurn={0.6} look={down > 0.3 ? [0.4, 1] : f > at('043') - 4 ? [0.9, 0] : [0.5, 0.6]} expr={down > 0.3 ? 'sad' : f > at('043') - 4 ? 'wide' : 'normal'} armOver={spoon > 0.6} handItem={spoon > 0 ? <g><line x1={0} y1={0} x2={-22} y2={-20} stroke="#c9ccd6" strokeWidth={5} strokeLinecap="round" /><ellipse cx={-24} cy={-22} rx={8} ry={5} fill="#c9ccd6" /></g> : undefined} />
					<HeroBadge x={1240} y={490} s={0.8} />
				</Svg>
			</Layer>
			<Layer depth={1}>
				<KitchenTable mugs={0} />
				<Svg>
					<ellipse cx={1120} cy={694} rx={58} ry={14} fill="#fbf6ee" />
					<path d="M1062,694 q58,46 116,0 z" fill="#e86a6a" />
					<ellipse cx={1120} cy={692} rx={50} ry={9} fill="#f2d48a" />
				</Svg>
			</Layer>
			{cakes > 0 ? (
				<AbsoluteFill style={{background: 'rgba(20,16,40,0.78)', opacity: cakes}}>
					<svg viewBox="0 0 1920 1080" width={1920} height={1080}>
						{Array.from({length: 11}).map((_, i) => (
							<g key={i} transform={`translate(${170 + i * 158},${560 + (i % 2) * 40})`} opacity={interpolate(f, [at('044') + 190 + i * 10, at('044') + 200 + i * 10], [0, 1], clamp)}>
								<rect x={-55} y={-30} width={110} height={70} rx={12} fill="#f6d0e0" />
								<rect x={-55} y={-30} width={110} height={18} rx={9} fill="#fff" />
								<text y={28} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#c94a7a">
									{i + 6}
								</text>
								<rect x={-3} y={-62} width={6} height={32} fill="#7fb8ff" />
								<ellipse cx={0} cy={-70} rx={6} ry={10} fill="#ffd34a" />
								<text y={-110} textAnchor="middle" fontSize={26} fontFamily="'Rubik', sans-serif" fontWeight={700} fill="#ffe7a8">
									«скоро»
								</text>
							</g>
						))}
					</svg>
				</AbsoluteFill>
			) : null}
		</Stage>
	);
};

/* school guard */
export const S26: React.FC = () => {
	const {f, gf, at} = useShot();
	const sp = useSpeaking(gf);
	const laugh = f > at('048');
	const P = usePush(camOn(1150, 540, 1.05), camOn(1200, 520, 1.15));
	const cam = sp === 'GUARD' ? camOn(1480, 580, 1.8, {farBlur: 6}) : sp === 'LEVA' ? camOn(900, 590, 1.8, {farBlur: 6}) : P;
	// Лёва walks up to the booth; the guard lifts a palm — stop
	const w = walkTo(f, -4, 44, -220, 900, 3, 0.32);
	let gp: Pose = idle(gf, 7);
	gp = gesture('stop', gp, env(f, at('045') + 26, at('047'), 8, 8), f);
	if (laugh) gp = {...gp, lean: -10 + Math.sin(f * 0.9) * 6, head: -14, armF: [70 + Math.abs(Math.sin(f / 3)) * 50, 80]}; // pounds the desk
	// «Я здесь учусь. Мне шестнадцать.» — hand on chest, then points at himself
	let lp: Pose = w.pose;
	lp = reach(lp, 'F', [26, -100], env(f, at('047') - 2, at('047') + 34, 6, 6));
	lp = reach(lp, 'F', [30, -118], env(f, at('047') + 36, at('047') + 76, 6, 8));
	// «правда … тоже бесплатная» — facepalm; «Только толку от неё ноль» — shrug
	const fp = env(f, at('048') + 96, at('048') + 178, 8, 10);
	lp = gesture('facepalm', lp, fp, f);
	lp = gesture('shrug', lp, env(f, at('048') + 182, at('048') + 260, 8, 10), f);
	return (
		<Stage cam={cam} bg="#e8dcc0" light={{x: 15, y: 10, o: 0.42}}>
			<Layer depth={1.4}>
				<Entrance />
			</Layer>
			<Layer depth={1.4}>
				<Rays x={-180} y={190} w={720} len={760} angle={-18} o={0.15} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="guard" x={1480} s={1.0} seat={560} facing={-1} hideLegs faceTurn={0.6} look={[0.8, 0]} pose={gp} lidL={laugh ? 1 : 0} lidR={laugh ? 1 : 0} mouth={laugh ? 'smile' : 'flat'} expr={!laugh && f > at('045') + 20 ? 'angry' : 'normal'} />
					{laugh ? (
						<>
							<path d={`M1452,${430 + ((f * 3) % 40)} q-6,10 0,14 q6,-4 0,-14 z`} fill="#9fd8ff" />
							<path d={`M1500,${434 + ((f * 3 + 20) % 40)} q-6,10 0,14 q6,-4 0,-14 z`} fill="#9fd8ff" />
						</>
					) : null}
					<Actor who="leva" x={w.x} s={1.05} faceTurn={0.6} look={[0.8, 0]} expr={laugh ? 'sad' : 'normal'} pose={lp} vx={w.vx} bob={w.bob} armOver={fp > 0.5} uid="l26" />
					<HeroBadge x={w.x} y={405} s={0.8} />
				</Svg>
			</Layer>
			<Layer depth={0.9}>
				<Svg>
					<rect x={1160} y={640} width={660} height={28} fill="#a9805a" />
				</Svg>
			</Layer>
		</Stage>
	);
};

export const S27: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('049');
	const r = f - t0;
	const cam = usePush(camOn(1100, 540, 1.05), camOn(900, 540, 1.1));
	// Гоша dashes in, presents his «uncle» to the guard and points at the sky — cosmonaut!
	const gIn = walkTo(r, -6, 34, -260, 1180, 5, 0.5);
	const gOut = walkTo(r, 150, 236, 1180, 520, 5, 0.34);
	const leaving = r > 150;
	const gw = leaving ? gOut : gIn;
	let gp: Pose = gw.pose;
	gp = blend(gp, {...gp, armB: [-80, 10]}, env(r, 40, 96, 6, 8)); // back hand toward Лёва
	gp = blend(gp, {...gp, head: -16, armF: [168, 4]}, env(r, 96, 146, 6, 8)); // up to the sky
	gp = gesture('fist', gp, env(r, 196, 240, 6, 8), f);
	// the guard believes: wide eyes and a salute
	let guard: Pose = idle(gf, 7);
	guard = reach(guard, 'F', [40, -190], env(r, 142, 240, 6, 10));
	// Лёва: awkward wave, then follows Гоша out
	const lw = walkTo(r, 150, 230, 900, 250, 2, 0.32);
	let lp: Pose = leaving ? lw.pose : idle(gf);
	lp = gesture('wave', lp, env(r, 108, 150, 6, 8), f);
	return (
		<Stage cam={cam} bg="#e8dcc0" light={{x: 15, y: 10, o: 0.42}}>
			<Layer depth={1.4}>
				<Entrance />
			</Layer>
			<Layer depth={1.4}>
				<Rays x={-180} y={190} w={720} len={760} angle={-18} o={0.15} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="guard" x={1480} s={1.0} seat={560} facing={-1} hideLegs faceTurn={0.6} look={[0.8, 0]} pose={guard} expr={r > 80 ? 'wide' : 'normal'} mouth={r > 142 ? 'smile' : undefined} />
					<Actor who="leva" x={lw.x} facing={leaving ? -1 : 1} s={1.05} faceTurn={0.6} look={leaving ? [0.8, 0] : [0.8, -0.1]} expr={r < 100 ? 'wide' : 'normal'} mouth={r > 108 && r < 150 ? 'smile' : undefined} pose={lp} vx={lw.vx} bob={lw.bob} uid="l27" />
					<HeroBadge x={lw.x} y={405 - lw.bob} s={0.8} />
					<Actor who="gosha" x={gw.x} s={1.0} facing={leaving ? -1 : 1} faceTurn={r > 190 ? 0.05 : 0.6} look={r > 190 ? [0, 0] : [0.8, 0]} lidL={r > 200 && r < 214 ? 1 : 0} mouth="smirk" pose={gp} handF={r > 96 && r < 146 ? 'point' : undefined} vx={gw.vx} bob={gw.bob} uid="g27" />
					<g opacity={env(r, 46, 150, 2, 10)}>
						<Bubble x={1330} y={330} w={260} h={120} t={r - 46} tail={[-90, 90]}>
							<path d="M-60,-20 l20,50 h-40 z" fill="#d23b3b" />
							<text x={30} y={16} textAnchor="middle" fontSize={24} fontFamily={FONT} fill="#1b1e2a">
								ДЯДЯ!
							</text>
						</Bubble>
					</g>
				</Svg>
			</Layer>
		</Stage>
	);
};

/* parents' meeting */
type Room = {
	children?: React.ReactNode;
	tPose?: Pose;
	tFacing?: 1 | -1;
	tTurn?: number;
	tLook?: [number, number];
	tHand?: any;
	tOver?: boolean;
	tMouth?: any;
	lX?: number;
	lSeatK?: number; // 0 standing → 1 seated
	lPose?: Pose;
	lExpr?: any;
	lOver?: boolean;
	lLook?: [number, number];
	lFacing?: 1 | -1;
	lvx?: number;
	lbob?: number;
	pTurn?: number; // parents turn to stare at the «father»
	pLaugh?: number;
};
const LSIT: Pose = {...SIT, legF: [70, 110], legB: [66, 110]};
const ParentsRoom: React.FC<Room> = ({children, tPose, tFacing = 1, tTurn = 0.6, tLook = [0.8, 0], tHand, tOver, tMouth, lX = 1300, lSeatK = 1, lPose, lExpr, lOver, lLook = [0.8, 0], lFacing = -1, lvx = 0, lbob = 0, pTurn = 0, pLaugh = 0}) => {
	const {f, gf} = useShot();
	const sp = useSpeaking(gf);
	const P = usePush(camOn(960, 560, 1.0), camOn(1000, 540, 1.08));
	const cam = sp === 'TEACHER' ? camOn(560, 580, 1.7, {farBlur: 6}) : sp === 'LEVA' ? camOn(1300, 630, 1.6, {farBlur: 6}) : P;
	const sL = heroS(gf, 1);
	const standHip = 900 - 157 * sL;
	const hip = lerp(standHip, 800, lSeatK);
	return (
		<Stage cam={{...cam, x: cam.x + Math.sin(f / 70) * 8}} bg="#e9d9ae" light={{x: 36, y: 0, c: '255,232,180', o: 0.5}}>
			<Layer depth={1.5}>
				<ClassroomEve />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="teacher" x={560} s={1.05} facing={tFacing} faceTurn={tTurn} look={tLook} pose={tPose} handF={tHand} armOver={tOver} mouth={tMouth} uid="t28" />
					{[880, 1660].map((x, i) => {
						const turn = i === 0 ? pTurn : 0;
						const laugh = i === 0 ? pLaugh : 0;
						const pp = toMouth({...SIT, head: Math.sin(f / 3) * 4 * laugh}, laugh);
						return <Stickman key={i} id={'par' + i} x={x} y={800} scale={1} facing={-1} pose={pp} color={['#5a8a6a', '#a05a3a'][i]} hair={['bob', 'short'][i] as any} faceTurn={0.6 - 1.1 * turn} look={turn > 0.5 ? [-0.8, 0] : i === 1 && pTurn > 0.5 ? [0.9, 0] : [0.8, 0]} blink={(gf + i * 40) % 90 < 4 ? 1 : 0} rimW={2.2} mouth={laugh > 0.3 ? 'smile' : undefined} armOver={laugh > 0.5} />;
					})}
					<Actor who="leva" x={lX} facing={lFacing} seat={hip} pose={lPose ?? LSIT} faceTurn={0.6} look={lLook} expr={lExpr} armOver={lOver} vx={lvx} bob={lbob} shadow={lSeatK < 0.5} uid="l28" />
					<HeroBadge x={lX} y={hip - 285 * sL} s={0.8} />
					{children}
				</Svg>
			</Layer>
			<Layer depth={0.95}>
				<Svg>
					{[760, 1180, 1560].map((x, i) => (
						<g key={i}>
							<rect x={x} y={760} width={i === 1 ? 200 : 260} height={18} rx={4} fill="#e2b67e" />
							<rect x={x + 10} y={778} width={i === 1 ? 180 : 240} height={60} fill="#4b5161" />
							<rect x={x + 16} y={838} width={10} height={70} fill="#2c2f38" />
							<rect x={x + (i === 1 ? 170 : 230)} y={838} width={10} height={70} fill="#2c2f38" />
						</g>
					))}
				</Svg>
			</Layer>
		</Stage>
	);
};
/* 050 Лёва walks in and takes a seat («Ты идёшь сам. На себя.» — a little shrug); the teacher is writing
   on the board. 051 she turns: «Вы отец Лёвы?» presents, fixes her glasses, raises a finger for the PE
   teacher, taps her teeth for the parsley — Лёва sinks lower and facepalms, a parent snorts.
   052 «Я с ним поговорю.» — a nod. */
export const S28: React.FC = () => {
	const {f, gf, at} = useShot();
	const r = f - at('050');
	const t = f - at('051');
	const w = walkTo(r, -4, 66, 2150, 1300, 4, 0.32);
	const seatK = interpolate(r, [66, 90], [0, 1], {...clamp, easing: ease});
	let lp: Pose = blend(w.pose, LSIT, seatK);
	lp = gesture('shrug', lp, env(r, 104, 150, 6, 8), f);
	const sink = interpolate(t, [44, 280], [0, 1], clamp);
	lp = {...lp, lean: lp.lean - 12 * sink, head: lp.head + 10 * sink};
	const fp = env(t, 196, 300, 8, 10);
	lp = gesture('facepalm', lp, fp, f);
	const nod = env(f, at('052') - 2, at('052') + 34, 4, 8);
	lp = {...lp, head: lp.head + Math.sin(f / 2.5) * 10 * nod};
	// teacher
	const writing = f < at('051') - 4;
	let tp: Pose = writing ? {...idle(gf, 9), armF: [150 + Math.sin(f / 4) * 10, 40 + Math.sin(f / 3) * 10]} : idle(gf, 9);
	tp = gesture('presentF', tp, env(t, 0, 40, 6, 8), f);
	const glasses = env(t, 46, 100, 6, 8);
	tp = reach(tp, 'F', [rigPoints(tp).head[0] + 18, rigPoints(tp).head[1] - 6], glasses);
	const finger = env(t, 108, 162, 6, 8);
	tp = blend(tp, {...tp, armF: [166, 4]}, finger);
	const teeth = env(t, 206, 286, 6, 8);
	tp = toMouth(tp, teeth, 22);
	return (
		<ParentsRoom
			tPose={tp}
			tFacing={writing ? -1 : 1}
			tTurn={writing ? -0.5 : 0.6}
			tLook={writing ? [0.6, -0.4] : [0.8, 0]}
			tHand={finger > 0.5 || teeth > 0.5 ? 'point' : undefined}
			tOver={glasses > 0.5 || teeth > 0.5}
			tMouth={teeth > 0.3 ? 'smile' : undefined}
			lX={w.x}
			lSeatK={seatK}
			lPose={lp}
			lFacing={seatK > 0 || w.moving ? -1 : -1}
			lExpr={fp > 0.2 ? 'sad' : t > 44 ? 'worried' : 'normal'}
			lOver={fp > 0.5}
			lLook={sink > 0.4 ? [0.6, 0.6] : [0.8, 0]}
			lvx={w.vx}
			lbob={w.bob}
			pTurn={env(t, 110, 300, 10, 10)}
			pLaugh={env(t, 210, 300, 6, 10)}
		/>
	);
};

/* «Это правда. Ты действительно с ним поговоришь.» — a stern lecture with a wagging finger, close…
   «В зеркале.» — pull back: he is scolding his own reflection, ends with a sigh */
export const S29: React.FC = () => {
	const {f, gf, at} = useShot();
	const r = f - at('053');
	const back = interpolate(r, [80, 104], [0, 1], {...clamp, easing: ease});
	const cam = mixCam(camOn(990, 470, 2.1, {farBlur: 0}), camOn(960, 470, 1.1, {farBlur: 0}), back);
	let p: Pose = idle(gf);
	const wag = env(r, 0, 86, 6, 8);
	p = blend(p, {...p, lean: 8, armF: [96 + Math.sin(f / 2.2) * 9, 14]}, wag);
	const sigh = env(r, 92, 200, 8, 10);
	p = gesture('facepalm', p, sigh, f);
	const s = 1.7;
	const sH = heroS(gf, s);
	const hy = headY(1150, sH);
	return (
		<Stage cam={cam} bg="#cfe3dc" light={{x: 50, y: 0, c: '225,255,240', o: 0.45}}>
			<Layer depth={1}>
				<Toilet f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Mirror x={575} y={165} w={770} h={490} id="m29">
						<rect x={575} y={165} width={770} height={490} fill="#a8c4c0" />
						<Actor who="leva" x={960} floor={1150} s={s} facing={-1} faceTurn={0.15} look={[0, 0]} expr={sigh > 0.3 ? 'sad' : 'angry'} mouth={wag > 0.3 ? 'open' : undefined} pose={p} handF={wag > 0.5 ? 'point' : undefined} armOver={sigh > 0.5} shadow={false} uid="l29" />
						<HeroBadge x={960} y={hy - 105 * sH} s={0.9} />
					</Mirror>
				</Svg>
			</Layer>
		</Stage>
	);
};

/* 054 «И ещё.» finger up · «В пятницу дискотека» a little dance · «нужен сопровождающий» presents ·
   «Вы ведь придёте?» points at Лёва. 055 «Ты киваешь.» — he nods, sitting up straight. */
export const S30: React.FC = () => {
	const {f, gf, at} = useShot();
	const t = f - at('054');
	let tp: Pose = idle(gf, 9);
	tp = blend(tp, {...tp, armF: [166, 4]}, env(t, 0, 30, 5, 8));
	const dance = env(t, 34, 74, 6, 8);
	tp = blend(tp, {...tp, lean: Math.sin(t / 3) * 8, head: Math.sin(t / 1.5) * 8, armF: [120 + Math.sin(t / 3) * 30, 40], armB: [-120 - Math.sin(t / 3) * 30, 40]}, dance);
	tp = gesture('presentF', tp, env(t, 78, 140, 6, 8), f);
	const ask = env(t, 144, 240, 6, 10);
	tp = gesture('point', tp, ask, f);
	let lp: Pose = LSIT;
	const nod = env(f, at('055'), at('055') + 36, 4, 8);
	lp = {...lp, lean: lp.lean - 6 * env(t, 150, 400, 10, 10), head: lp.head + Math.sin(f / 2.5) * 12 * nod};
	return (
		<ParentsRoom tPose={tp} tHand={ask > 0.5 || env(t, 0, 30, 5, 8) > 0.5 ? 'point' : undefined} tMouth={dance > 0.3 || ask > 0.3 ? 'smile' : undefined} lPose={lp} lExpr={t > 140 ? 'wide' : 'worried'} pTurn={env(t, 150, 400, 10, 10)}>
			<Pop t={f - at('055') - 30} x={1300} y={170}>
				<rect x={-110} y={-28} width={220} height={56} rx={28} fill="#1f8a4a" />
				<text y={11} textAnchor="middle" fontSize={26} fontFamily={FONT} fill="#fff">
					ПРАВДА · +0
				</text>
			</Pop>
		</ParentsRoom>
	);
};
