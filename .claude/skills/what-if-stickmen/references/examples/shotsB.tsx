import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useVideoConfig} from 'remotion';
import {Pose, Stickman, toLocal} from '../Stickman';
import {CAST, SIT, ageK, blend, env, gesture, idle, reach, run, walk, walkTo} from './cast';
import {Actor, L, heroAge, useSpeaking, useShot} from './core';
import {CrowdRow, Extra, HeroBadge, Layer, Pop, Rays, Stage, Svg, camOn, clamp, ease, flash, mixCam, usePush} from './kit';
import {Corridor, Counter, HallBack, Kitchen, KitchenTable, NightStreet, Shop} from './sets';
import {Accent, AgeBadge, Board, Bubble, Cite, FONT, RuleCard} from './ui';
import {Chair} from '../props';

const Flash: React.FC<{o: number; c?: string}> = ({o, c = '#fff'}) => (o > 0.01 ? <AbsoluteFill style={{background: c, opacity: o}} /> : null);

/* ------------------------------ local helpers ------------------------------ */
// hero scale including the age growth the Actor applies
const heroS = (gf: number, s: number) => s * (1 + 0.07 * ageK(heroAge(gf)));
// world y of a standing figure's hip / head centre / badge
const hipY = (floor: number, s: number) => floor - 157 * s;
const headY = (floor: number, s: number) => floor - 321 * s;
const badgeY = (floor: number, s: number) => floor - 426 * s;
// same for a seated figure (seat = hip y)
const seatBadgeY = (seat: number, s: number) => seat - 269 * s;
// little nods: head offset while k > 0
const nod = (f: number, k: number, amp = 8, sp = 4) => Math.sin(f / sp) * amp * k;
// horizontal motion blur for a group of fast movers (crowds)
const Blur: React.FC<{id: string; amt: number; children: React.ReactNode}> = ({id, amt, children}) =>
	amt < 0.6 ? (
		<>{children}</>
	) : (
		<>
			<defs>
				<filter id={id} x="-20%" y="-10%" width="140%" height="120%">
					<feGaussianBlur stdDeviation={`${amt} 0`} />
				</filter>
			</defs>
			<g filter={`url(#${id})`}>{children}</g>
		</>
	);
// flickering warm light over fire scenes (screen space)
const FireGlow: React.FC<{o?: number}> = ({o = 1}) => {
	const {gf} = useShot();
	const fl = 0.75 + 0.25 * Math.sin(gf / 2.3) * Math.sin(gf / 3.7 + 1);
	return (
		<>
			<AbsoluteFill style={{background: `radial-gradient(ellipse at 78% 18%, rgba(255,140,40,${0.42 * fl * o}) 0%, rgba(255,80,20,0) 60%)`, mixBlendMode: 'screen', pointerEvents: 'none'}} />
			<AbsoluteFill style={{background: '#ff2a2a', mixBlendMode: 'overlay', opacity: (0.12 + 0.08 * Math.sin(gf / 5)) * o, pointerEvents: 'none'}} />
		</>
	);
};
// flames licking a curtain (world space), k = size 0..1
const Flames: React.FC<{x: number; y: number; k: number; w?: number}> = ({x, y, k, w = 220}) => {
	const {gf} = useShot();
	if (k <= 0.02) return null;
	return (
		<g transform={`translate(${x},${y})`}>
			<ellipse cx={0} cy={-40 * k} rx={w * 0.9 * k} ry={160 * k} fill="#ff7a2a" opacity={0.35} style={{filter: 'blur(20px)'}} />
			{Array.from({length: 7}).map((_, i) => {
				const ph = gf / 3 + i * 1.7;
				const h = (90 + 70 * Math.abs(Math.sin(ph))) * k;
				const cx = (i - 3) * (w / 7) * k;
				return (
					<g key={i}>
						<path d={`M${cx - 26 * k},0 Q${cx - 20 * k},${-h * 0.6} ${cx + Math.sin(ph) * 10},${-h} Q${cx + 20 * k},${-h * 0.6} ${cx + 26 * k},0 Z`} fill="#ff6a2a" />
						<path d={`M${cx - 13 * k},0 Q${cx - 10 * k},${-h * 0.4} ${cx + Math.sin(ph) * 6},${-h * 0.62} Q${cx + 10 * k},${-h * 0.4} ${cx + 13 * k},0 Z`} fill="#ffd34a" />
					</g>
				);
			})}
		</g>
	);
};
const Mic: React.FC = () => <rect x={-8} y={-50} width={16} height={50} rx={8} fill="#2b2f3a" />;

/* ========================== A WEEK WITHOUT LIES ========================== */

export const S31: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('056');
	const {fps} = useVideoConfig();
	// part 1: Лёва holds his mouth shut while questions buzz around him
	const out = interpolate(f, [t0 + 285, t0 + 305], [0, 1], {...clamp, easing: ease});
	const hold = env(f, t0 + 40, t0 + 300, 10, 10);
	let lp: Pose = reach({...idle(gf), head: nod(f, hold, 3, 2)}, 'F', [18, -138], hold);
	lp = gesture('scratch', lp, env(f, t0 + 150, t0 + 240, 8, 8) * 0, f);
	const panels = [
		{who: 'mom', q: '«Как тебе мой суп?»', at: t0 + 302, g: 'presentF' as const, item: <g><ellipse cx={30} cy={-6} rx={38} ry={14} fill="#f4f6fa" /><ellipse cx={30} cy={-10} rx={30} ry={8} fill="#e86a3a" /></g>},
		{who: 'sveta', q: '«Я нормально выгляжу?»', at: t0 + 344, g: 'touchFace' as const, item: null},
		{who: 'gosha', q: '«Ты на меня не злишься?»', at: t0 + 390, g: 'shrug' as const, item: null},
	];
	return (
		<Board tint="#2a2350">
			<text x={960} y={140} textAnchor="middle" fontSize={50} fontFamily={FONT} fill="#fff" opacity={interpolate(f, [t0, t0 + 20], [0, 1], clamp)}>
				ВОПРОСЫ, НА КОТОРЫЕ НЕЛЬЗЯ ОТВЕТИТЬ ЧЕСТНО
			</text>
			{out < 1 ? (
				<g transform={`translate(0,${out * 900})`}>
					{Array.from({length: 9}).map((_, i) => {
						const a = f / (30 + i * 4) + i * 0.7;
						const rr = 300 + 60 * Math.sin(f / 20 + i);
						const k = interpolate(f, [t0 + 150 + i * 10, t0 + 160 + i * 10], [0, 1], clamp);
						return (
							<text key={i} x={960 + Math.cos(a) * rr * 1.4} y={600 + Math.sin(a) * rr * 0.6} textAnchor="middle" fontSize={60 + (i % 3) * 20} fontFamily={FONT} fill={['#ffc94a', '#ff6a5a', '#9ff0b0'][i % 3]} opacity={k}>
								?
							</text>
						);
					})}
					<Stickman id="h31" x={960} y={hipY(1000, 1.5)} scale={1.5} pose={lp} {...CAST.leva} age={ageK(heroAge(gf))} expr={hold > 0.5 ? 'worried' : 'normal'} look={[Math.sin(f / 9) * 0.8, 0]} faceTurn={0.1} armOver={hold > 0.5} />
					{hold > 0.5 ? <text x={1090} y={420 + (f % 30)} fontSize={40} fill="#9fd8ff" opacity={1 - (f % 30) / 30}>💧</text> : null}
				</g>
			) : null}
			{panels.map((p, i) => {
				const k = spring({frame: f - p.at + 10, fps, config: {damping: 12, stiffness: 120}});
				if (f < p.at - 10) return null;
				const gk = env(f, p.at, p.at + 400, 10, 10);
				const base = {...idle(gf, i), head: nod(f, gk, 4, 6)};
				const pose = p.g === 'presentF' ? gesture('presentF', base, gk, f) : gesture(p.g, base, gk, f);
				return (
					<g key={i} transform={`translate(${380 + i * 580},${620 + (1 - k) * 700}) rotate(${(1 - k) * (i - 1) * 12})`}>
						<rect x={-250} y={-330} width={500} height={600} rx={30} fill="#f3e6c4" />
						<Stickman id={'q' + i} x={0} y={180 - 157 * 1.1} scale={1.1} pose={pose} {...CAST[p.who]} faceTurn={0.1} look={[0, 0]} mouth={i === 0 ? 'smile' : i === 2 ? 'frown' : 'smile'} expr={i === 2 ? 'sad' : 'normal'} talk={(gf + i * 7) % 20 < 10 && f < p.at + 40 ? 0.6 : 0} handItem={p.item} armOver={p.g === 'touchFace' && gk > 0.5} />
						<rect x={-230} y={-310} width={460} height={80} rx={40} fill="#fbf8ef" />
						<text y={-258} textAnchor="middle" fontSize={32} fontFamily="'Rubik', sans-serif" fontWeight={700} fill="#1b1e2a">
							{p.q}
						</text>
					</g>
				);
			})}
		</Board>
	);
};

/* Kang Lee: kids learn to lie */
export const S32: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('057');
	const ages = [
		{a: 2, p: 30, at: t0 + 120},
		{a: 3, p: 50, at: t0 + 170},
		{a: 4, p: 80, at: t0 + 215},
	];
	const brain = interpolate(f, [t0 + 330, t0 + 350], [0, 1], clamp);
	return (
		<Board>
			<text x={960} y={120} textAnchor="middle" fontSize={46} fontFamily={FONT} fill="#fff">
				СКОЛЬКО ДЕТЕЙ УМЕЮТ УБЕДИТЕЛЬНО СОВРАТЬ
			</text>
			<line x1={300} y1={820} x2={1620} y2={820} stroke="#5a6080" strokeWidth={4} />
			{ages.map((g, i) => {
				const k = interpolate(f, [g.at, g.at + 30], [0, 1], {...clamp, easing: ease});
				const h = 5 * g.p * k;
				const x = 520 + i * 440;
				// each kid acts out a little lie once its bar is up
				const act = env(f, g.at + 30, g.at + 2000, 10, 10);
				const kidS = 0.5 + i * 0.06;
				let pose: Pose = idle(gf, i);
				if (i === 0) pose = reach(reach(pose, 'F', [-30, -60], act), 'B', [-34, -56], act); // hides a cookie behind the back
				if (i === 1) pose = {...pose, head: -12 * act + nod(f, act, 4, 5)}; // whistles, looking away
				if (i === 2) pose = gesture('point', pose, act, f); // "это не я"
				const hop = Math.abs(Math.sin(f / 6 + i)) * 10 * act;
				return (
					<g key={i}>
						<rect x={x - 90} y={820 - h} width={180} height={h} rx={10} fill={['#7fb8ff', '#ffc94a', '#ff6a5a'][i]} />
						<text x={x} y={800 - h} textAnchor="middle" fontSize={64} fontFamily={FONT} fill="#fff" opacity={k}>
							{Math.round(g.p * k)}%
						</text>
						<Stickman id={'kid' + i} x={x + 150} y={820 - 157 * kidS - hop} scale={kidS} facing={i === 2 ? -1 : 1} pose={pose} color={['#7fb8ff', '#ffc94a', '#ff6a5a'][i]} hair="short" rimW={1.6} faceTurn={0.2} look={i === 1 ? [0.8, -0.6] : [0, 0]} mouth={act > 0.5 ? (i === 1 ? 'open' : 'smirk') : 'line'} handF={i === 2 && act > 0.5 ? 'point' : undefined} handItem={i === 0 && act > 0.5 ? <circle r={14} fill="#c98a4a" /> : null} />
						{i === 1 && act > 0.5 ? (
							<text x={x + 200} y={660 - ((f * 1.5) % 50)} fontSize={34} fill="#fff" opacity={1 - ((f * 1.5) % 50) / 50}>
								♪
							</text>
						) : null}
						<text x={x} y={1050} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#cfd4ef">
							{g.a} ГОДА
						</text>
					</g>
				);
			})}
			<g opacity={brain} transform={`translate(1640,330) scale(${1 + 0.06 * Math.sin(f / 5)})`}>
				<ellipse rx={110} ry={80} fill="#ff9fc8" />
				<path d="M-70,-20 q30,-40 60,0 q30,-40 60,0 M-80,20 q40,-30 80,0 q40,-30 80,0" stroke="#d96a9a" strokeWidth={8} fill="none" />
				{[0, 1, 2].map((i) => (
					<circle key={i} cx={Math.cos(f / 10 + i * 2.1) * 150} cy={Math.sin(f / 10 + i * 2.1) * 100} r={14} fill="#ffe7a8" />
				))}
				<text y={140} textAnchor="middle" fontSize={26} fontFamily={FONT} fill="#ffd6e8">
					«у других свои мысли»
				</text>
			</g>
			<Cite text="Kang Lee, University of Toronto" t={f - t0} />
		</Board>
	);
};

/* shop: walk in, «Нет. Шестнадцать.» — «Шутник.» — sells the energy drink anyway */
export const S33: React.FC = () => {
	const {f, gf, at} = useShot();
	const sp = useSpeaking(gf);
	const P = usePush(camOn(1100, 540, 1.0), camOn(1000, 520, 1.1));
	const cam = sp === 'SELLER' ? camOn(720, 560, 1.8, {farBlur: 6}) : sp === 'LEVA' ? camOn(1180, 560, 1.8, {farBlur: 6}) : P;
	const w = walkTo(f, 4, 70, 2150, 1200, 3, 0.32);
	const s = heroS(gf, 1.05);
	let lp: Pose = w.pose;
	// puts the can on the counter
	lp = reach(lp, 'F', toLocal(940, 712, w.x, hipY(900, s), s, -1), env(f, 72, at('058') + 150, 8, 10));
	// «Нет. Шестнадцать.» — head shake + hand on chest
	const no = env(f, at('059'), at('059') + 50, 4, 8);
	lp = {...lp, head: lp.head + Math.sin(f / 2) * 10 * no};
	lp = reach(lp, 'F', [10, -86], env(f, at('059') + 20, at('060') + 10, 6, 8));
	// takes the can and shrugs
	const take = env(f, at('061') + 20, at('061') + 200, 8, 10);
	lp = gesture('shrug', lp, env(f, at('061') + 30, at('061') + 70, 6, 8), f);
	// seller: squints, laughs, slides the can
	let sp2: Pose = idle(gf, 2);
	const ask = env(f, at('058') + 80, at('059') + 40, 8, 8);
	sp2 = gesture('point', sp2, ask * 0.6, f);
	const laugh = env(f, at('060') - 2, at('060') + 50, 4, 10);
	sp2 = {...sp2, lean: sp2.lean - 10 * laugh + Math.sin(f / 2) * 3 * laugh, head: sp2.head - 14 * laugh};
	const give = env(f, at('061'), at('061') + 40, 6, 6);
	sp2 = reach(sp2, 'F', toLocal(interpolate(give, [0, 1], [860, 940]), 712, 700, hipY(900, 1), 1, 1), give);
	const canX = f < at('061') ? 940 : interpolate(f, [at('061'), at('061') + 20], [940, 975], clamp);
	return (
		<Stage cam={cam} bg="#f2efe6" light={{x: 75, y: 15, c: '220,245,255', o: 0.4}}>
			<Layer depth={1.5}>
				<Shop f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="seller" x={700} s={1.0} faceTurn={0.6} look={[0.8, 0]} expr={ask > 0.5 ? 'angry' : laugh > 0.3 ? 'sleepy' : 'normal'} mouth={laugh > 0.3 ? 'open' : f > at('060') ? 'smirk' : 'line'} pose={sp2} handF={ask > 0.4 ? 'point' : undefined} />
					<Actor who="leva" x={w.x} s={1.05} facing={-1} faceTurn={0.6} look={[0.8, 0]} expr={no > 0.2 ? 'worried' : 'normal'} pose={lp} vx={w.vx} bob={w.bob} handItem={take > 0.5 ? <rect x={-10} y={-40} width={26} height={54} rx={6} fill="#7cf04a" /> : null} />
					<HeroBadge x={w.x} y={badgeY(900, s)} s={0.8} />
				</Svg>
			</Layer>
			<Layer depth={0.9}>
				<Counter c="#7a6a5a" top="#d9cdb6" x={380} w={600} />
				<Svg>{take < 0.5 && f > 80 ? <rect x={canX - 13} y={698} width={26} height={54} rx={6} fill="#7cf04a" stroke="#2b5a1a" strokeWidth={2} /> : null}</Svg>
			</Layer>
			{laugh > 0.3 ? (
				<Layer depth={1}>
					<Svg>
						<text x={760} y={330} fontSize={44} fontFamily={FONT} fill="#d23b3b" opacity={laugh} transform={`rotate(-8 760 330)`}>
							ХА-ХА
						</text>
					</Svg>
				</Layer>
			) : null}
		</Stage>
	);
};

/* radio + Anya: Лёва melts by the lockers; then she walks up to him */
export const S34: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('062');
	const approach = f > at('063');
	const aw = walkTo(f, at('063'), at('063') + 75, 2100, 1180, 6, 0.3);
	const P = usePush(camOn(960, 520, 1.0), camOn(1000, 520, 1.1));
	const cam = approach ? mixCam(P, camOn(980, 560, 1.25), interpolate(f, [at('063') + 60, at('063') + 110], [0, 1], {...clamp, easing: ease})) : P;
	const s = heroS(gf, 1.05);
	const dream = env(f, t0 + 30, at('063'), 20, 10);
	let lp: Pose = {...idle(gf, 1), lean: idle(gf, 1).lean - 8 * dream, head: Math.sin(f / 18) * 9 * dream};
	lp = gesture('think', lp, env(f, t0 + 200, at('063') - 10, 14, 10) * 0.7, f);
	// startled: straightens, looks behind him, points at himself
	const who = env(f, at('063') + 70, at('063') + 140, 6, 10);
	lp = reach(lp, 'F', [12, -96], who);
	// passers-by in the background
	return (
		<Stage cam={cam} bg="#f1e6c8" light={{x: 30, y: 8, o: 0.42}}>
			<Layer depth={1.6}>
				<Corridor f={gf} radio={approach ? 0 : 1} />
			</Layer>
			<Layer depth={1.25}>
				<Svg>
					{[0, 1, 2].map((i) => {
						const st = t0 + i * 110;
						const pw = walkTo(f, st, st + 160, i % 2 ? -200 : 2100, i % 2 ? 2100 : -200, i, 0.34);
						return f > st && f < st + 160 ? <Extra key={i} i={i + 20} x={pw.x} floor={860} s={0.85} pose={pw.pose} seed="p34" facing={pw.facing} /> : null;
					})}
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Svg>
					{!approach ? (
						<g transform={`translate(1500,330) scale(${1 + 0.02 * Math.sin(f / 4)})`}>
							<circle r={190} fill="#2a2350" stroke="#ffd34a" strokeWidth={8} />
							{[0, 1, 2].map((i) => {
								const k = ((f / 30 + i / 3) % 1);
								return <circle key={i} r={190 + k * 120} fill="none" stroke="#ffd34a" strokeWidth={5} opacity={(1 - k) * 0.6} />;
							})}
							<clipPath id="rc">
								<circle r={182} />
							</clipPath>
							<g clipPath="url(#rc)">
								<Actor who="anya" x={0} floor={420} s={1.4} faceTurn={0.2} look={[0, 0]} hideLegs talk={(gf % 14) < 7 ? 0.5 : 0.1} pose={reach(idle(gf, 3), 'F', [24, -144], 1)} handItem={<Mic />} shadow={false} />
							</g>
							<text y={240} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#ffd34a">
								ПЕРЕМЕНА FM
							</text>
						</g>
					) : (
						<Actor who="anya" x={aw.x} s={1.0} facing={-1} faceTurn={aw.moving ? 0.6 : 0.6} look={[0.8, 0]} pose={gesture('wave', aw.pose, env(f, at('063') + 70, at('063') + 110, 6, 8), f)} vx={aw.vx} bob={aw.bob} mouth="smile" />
					)}
					<Actor who="leva" x={760} s={1.05} faceTurn={who > 0.3 ? -0.3 : 0.6} look={who > 0.3 ? [-0.8, 0] : approach ? [0.8, 0] : [0.5, -0.4]} expr={approach ? 'wide' : 'sleepy'} mouth="smile" pose={lp} />
					<HeroBadge x={760} y={badgeY(900, s)} s={0.8} />
					{dream > 0.3 ? (
						<g transform={`translate(${800 + Math.sin(f / 10) * 30},${300 - ((f - t0) % 60) * 2})`} opacity={(1 - ((f - t0) % 60) / 60) * dream}>
							<path d="M0,10 C-30,-20 -10,-40 0,-20 C10,-40 30,-20 0,10 Z" fill="#ff5a8a" />
						</g>
					) : null}
				</Svg>
			</Layer>
		</Stage>
	);
};

/* «Скажите честно, как вам эфир?» — «Скучно… но голос…» — she blushes and leaves */
export const S35: React.FC = () => {
	const {f, gf, at} = useShot();
	const sp = useSpeaking(gf);
	const blush = f > at('066') + 120;
	const lw = walkTo(f, at('067') + 10, at('067') + 90, 1180, 2200, 8, 0.36);
	const ax = lw.x;
	const cam = sp === 'ANYA' ? camOn(1170, 560, 1.8, {farBlur: 6}) : sp === 'LEVA' ? camOn(780, 560, 1.75, {farBlur: 6}) : camOn(960, 540, 1.05);
	const s = heroS(gf, 1.05);
	// Anya: hands clasped, hopeful; then covers her face and leaves
	let ap: Pose = idle(gf, 3);
	const hope = env(f, at('064') - 6, at('066') + 100, 8, 10);
	ap = reach(reach(ap, 'F', [16, -92], hope), 'B', [12, -90], hope);
	const cover = env(f, at('066') + 120, at('067') + 40, 8, 8);
	ap = gesture('touchFace', ap, cover, f);
	ap = blend(ap, lw.pose, lw.moving ? 1 : 0);
	// Лёва: «Скучно.» flat shrug, «как прогноз погоды» presents, «но голос…» hand on heart
	let lp: Pose = idle(gf, 1);
	lp = gesture('shrug', lp, env(f, at('066'), at('066') + 30, 6, 8), f);
	lp = gesture('presentF', lp, env(f, at('066') + 36, at('066') + 99, 8, 8), f);
	lp = reach(lp, 'F', [4, -92], env(f, at('066') + 114, at('066') + 225, 8, 10));
	lp = gesture('scratch', lp, env(f, at('067') + 118, at('067') + 220, 8, 10), f);
	const leave = lw.moving || f > at('067') + 90;
	return (
		<Stage cam={{...cam, x: cam.x + Math.sin(f / 60) * 8}} bg="#f1e6c8" light={{x: 30, y: 8, o: 0.42}}>
			<Layer depth={1.6}>
				<Corridor f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="leva" x={760} s={1.05} faceTurn={0.6} look={leave ? [0.9, 0] : [0.8, 0]} expr={leave ? 'worried' : 'normal'} pose={lp} armOver={env(f, at('067') + 118, at('067') + 220, 8, 10) > 0.5} />
					<HeroBadge x={760} y={badgeY(900, s)} s={0.8} />
					<Actor who="anya" x={ax} s={1.0} facing={leave ? 1 : -1} faceTurn={0.6} look={[0.8, 0]} pose={ap} vx={lw.vx} bob={lw.bob} expr={blush ? 'wide' : 'normal'} mouth={blush ? 'flat' : 'smile'} armOver={cover > 0.5} />
					{blush ? (
						<g transform={`translate(${ax},${headY(900, 1) + 14})`}>
							<ellipse cx={leave ? 30 : -30} cy={0} rx={12} ry={6} fill="#ff6a9a" opacity={0.85} />
							<ellipse cx={leave ? -18 : 18} cy={0} rx={12} ry={6} fill="#ff6a9a" opacity={0.85} />
						</g>
					) : null}
					{f > at('066') + 114 && f < at('066') + 225 ? (
						<g transform={`translate(${880 + Math.sin(f / 7) * 20},${headY(900, s) - 60 - ((f - at('066')) % 50) * 1.6})`} opacity={1 - ((f - at('066')) % 50) / 50}>
							<path d="M0,10 C-30,-20 -10,-40 0,-20 C10,-40 30,-20 0,10 Z" fill="#ff5a8a" />
						</g>
					) : null}
				</Svg>
			</Layer>
		</Stage>
	);
};

/* Bond & DePaulo: 54 vs 50 — mom nods at «я сделал уроки», the coin flips */
export const S36: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('068');
	const k = interpolate(f, [t0 + 260, t0 + 300], [0, 1], {...clamp, easing: ease});
	const flipT = (f % 45) / 45;
	const coinY = -Math.sin(flipT * Math.PI) * 220;
	const coin = flipT * Math.PI * 4;
	const lie = Math.floor(f / 60) % 2 === 0 && f < t0 + 250;
	return (
		<Board>
			<text x={960} y={120} textAnchor="middle" fontSize={46} fontFamily={FONT} fill="#fff">
				КАК ЧАСТО ЛЮДИ РАСПОЗНАЮТ ЛОЖЬ
			</text>
			<g transform="translate(560,520)">
				<Stickman id="dp" x={-60} y={160} scale={1.1} pose={{...idle(gf), head: nod(f, 1, 7, 5)}} {...CAST.mom} faceTurn={0.4} look={[0.7, 0]} expr="normal" mouth="smile" />
				<Stickman id="dpl" x={150} y={250} scale={0.75} facing={-1} pose={gesture('presentF', idle(gf, 2), 1, f)} {...CAST.leva} faceTurn={0.4} look={[0.7, 0]} mouth="smirk" talk={lie && f % 20 < 10 ? 0.5 : 0} />
				{lie ? (
					<g transform="translate(190,-70)">
						<rect x={-130} y={-34} width={260} height={60} rx={22} fill="#fbf8ef" />
						<text y={6} textAnchor="middle" fontSize={24} fontFamily={FONT} fill="#1b1e2a">
							«я сделал уроки»
						</text>
					</g>
				) : null}
				<text y={-260} textAnchor="middle" fontSize={110} fontFamily={FONT} fill="#ffc94a" opacity={k}>
					{Math.round(54 * k)}%
				</text>
				<text y={-190} textAnchor="middle" fontSize={30} fontFamily={FONT} fill="#cfd4ef" opacity={k}>
					ЧЕЛОВЕК
				</text>
			</g>
			<g transform="translate(1360,560)">
				<ellipse cy={140} rx={110 * (1 - 0.4 * Math.sin(flipT * Math.PI))} ry={16} fill="#000" opacity={0.3} />
				<g transform={`translate(0,${coinY}) scale(${Math.abs(Math.cos(coin))},1)`}>
					<circle r={110} fill={Math.cos(coin) > 0 ? '#ffd34a' : '#e0b030'} stroke="#b88a10" strokeWidth={10} />
					<text y={30} textAnchor="middle" fontSize={84} fontFamily={FONT} fill="#b88a10">
						{Math.cos(coin) > 0 ? '₽' : '1'}
					</text>
				</g>
				<text y={-300} textAnchor="middle" fontSize={110} fontFamily={FONT} fill="#9aa3b5" opacity={k}>
					{Math.round(50 * k)}%
				</text>
				<text y={-230} textAnchor="middle" fontSize={30} fontFamily={FONT} fill="#cfd4ef" opacity={k}>
					МОНЕТКА
				</text>
			</g>
			<text x={960} y={960} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#ffb0a8" opacity={interpolate(f, [t0 + 330, t0 + 350], [0, 1], clamp)}>
				206 исследований · разница почти незаметна
			</text>
			<Cite text="Bond & DePaulo, 2006" t={f - t0} />
		</Board>
	);
};

/* Pinocchio effect: Гоша pokes the nose, thermal view */
export const S37: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('069');
	const thermal = f > t0 + 120;
	const stamp = interpolate(f, [t0 + 330, t0 + 340], [3, 1], clamp);
	const P = usePush(camOn(960, 500, 1.4), camOn(960, 560, 1.6));
	const s = heroS(gf, 1.05);
	const nose: [number, number] = [820 + 22 * s, headY(900, s) + 8 * s];
	// Гоша pokes repeatedly
	const poke = env(f, t0 + 10, t0 + 2000, 10, 10);
	const tap = Math.max(0, Math.sin(f / 4)) * 8;
	let gp: Pose = idle(gf, 4);
	gp = reach({...gp, lean: gp.lean + 8 * poke}, 'F', toLocal(nose[0] + tap, nose[1], 1060, hipY(900, 1), 1, -1), poke);
	let lp: Pose = gesture('armsCrossed', idle(gf, 1), env(f, t0 + 30, t0 + 2000, 10, 10), f);
	lp = {...lp, head: lp.head + (tap > 4 ? 4 : 0)};
	return (
		<Stage cam={P} bg="#f1e6c8" light={{x: 30, y: 8, o: 0.42}}>
			<Layer depth={1.6}>
				<Corridor f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="leva" x={820} s={1.05} faceTurn={0.7} look={[0.4, 0.3]} expr="sleepy" mouth="flat" pose={lp} />
					<Actor who="gosha" x={1060} s={1.0} facing={-1} faceTurn={0.6} look={[0.8, 0]} pose={gp} handF="point" mouth="smirk" />
					{thermal ? <circle cx={nose[0]} cy={nose[1]} r={34} fill="#ff3a1a" opacity={0.65 + 0.2 * Math.sin(f / 4)} style={{filter: 'blur(10px)'}} /> : null}
				</Svg>
			</Layer>
			{thermal ? (
				<AbsoluteFill style={{mixBlendMode: 'color', background: 'linear-gradient(180deg, #2a00ff 0%, #00e0ff 35%, #ffe000 65%, #ff3a00 100%)', opacity: 0.55}} />
			) : null}
			{thermal ? (
				<AbsoluteFill>
					<svg viewBox="0 0 1920 1080" width={1920} height={1080}>
						<rect x={60} y={60} width={1800} height={960} fill="none" stroke="#fff" strokeWidth={3} opacity={0.6} />
						<line x1={60} y1={60 + ((f * 6) % 960)} x2={1860} y2={60 + ((f * 6) % 960)} stroke="#fff" strokeWidth={2} opacity={0.25} />
						<text x={100} y={120} fontSize={34} fontFamily="Consolas, monospace" fill="#fff">
							{f % 30 < 15 ? '●' : '○'} REC · ТЕПЛОВИЗОР · {(36.6 + 0.4 * Math.abs(Math.sin(f / 20))).toFixed(1)}°C
						</text>
						{f > t0 + 330 ? (
							<g transform={`translate(1480,860) rotate(-12) scale(${stamp})`}>
								<rect x={-220} y={-50} width={440} height={100} rx={10} fill="none" stroke="#ff4a4a" strokeWidth={8} />
								<text y={18} textAnchor="middle" fontSize={50} fontFamily={FONT} fill="#ff4a4a">
									НЕ ДОКАЗАНО
								</text>
							</g>
						) : null}
						<text x={1860} y={1040} textAnchor="end" fontSize={22} fontFamily="'Rubik', sans-serif" fill="#fff" opacity={0.8}>
							Университет Гранады, 2012 (диссертация)
						</text>
					</svg>
				</AbsoluteFill>
			) : null}
		</Stage>
	);
};

/* Kelly 2012: ten weeks — calendar ticks, beating heart, a hug */
export const S38: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('070');
	const {fps} = useVideoConfig();
	const hug = env(f, t0 + 330, t0 + 2000, 12, 10);
	return (
		<Board tint="#1e3a34">
			<text x={960} y={120} textAnchor="middle" fontSize={46} fontFamily={FONT} fill="#fff">
				110 ЧЕЛОВЕК · 10 НЕДЕЛЬ БЕЗ ЛЖИ
			</text>
			{Array.from({length: 10}).map((_, i) => {
				const k = spring({frame: f - t0 - 100 - i * 14, fps, config: {damping: 9, stiffness: 180}});
				return (
					<g key={i} transform={`translate(${300 + i * 147},420)`}>
						<rect x={-60} y={-80} width={120} height={150} rx={14} fill="#fbf8ef" />
						<rect x={-60} y={-80} width={120} height={36} rx={14} fill="#3aa37a" />
						<text y={-52} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="#fff">
							НЕД {i + 1}
						</text>
						<text y={40} textAnchor="middle" fontSize={64} fontFamily={FONT} fill="#3aa37a" opacity={Math.min(1, k)} transform={`scale(${Math.max(0, k)})`}>
							✓
						</text>
					</g>
				);
			})}
			<g opacity={interpolate(f, [t0 + 260, t0 + 280], [0, 1], clamp)} transform={`translate(560,720)`}>
				<g transform={`scale(${1 + 0.12 * Math.max(0, Math.sin(f / 4)) ** 4})`}>
					<path d="M0,30 C-60,-20 -40,-70 0,-40 C40,-70 60,-20 0,30 Z" fill="#ff5a6a" />
				</g>
				<text x={90} y={14} fontSize={46} fontFamily={FONT} fill="#9ff0b0">
					меньше жалоб на здоровье
				</text>
			</g>
			<g opacity={interpolate(f, [t0 + 320, t0 + 340], [0, 1], clamp)} transform="translate(560,860)">
				<Stickman id="hg1" x={-40} y={60} scale={0.42} pose={reach(idle(gf), 'F', [70, -100], hug)} {...CAST.leva} faceTurn={0.6} look={[0.8, 0]} mouth="smile" />
				<Stickman id="hg2" x={40} y={60} scale={0.42} facing={-1} pose={reach(idle(gf, 2), 'F', [70, -100], hug)} {...CAST.mom} faceTurn={0.6} look={[0.8, 0]} mouth="smile" />
				<text x={90} y={14} fontSize={46} fontFamily={FONT} fill="#9ff0b0">
					лучше отношения с близкими
				</text>
			</g>
			<Cite text="Kelly & Wang, University of Notre Dame, 2012 (связь, не причина)" t={f - t0} />
		</Board>
	);
};

/* calculator: keys light up, the old man crumbles */
export const S39: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('071');
	const typed = ['1', '1 ×', '1 × 365', '1 × 365 =', '365'];
	const step = Math.max(0, Math.min(4, Math.floor((f - t0 - 20) / 26)));
	const pressKey = [12, 3, 6, 15, 15][step];
	const pressing = (f - t0 - 20) % 26 < 6 && f > t0 + 20 && f < t0 + 150;
	const old = interpolate(f, [t0 + 150, t0 + 240], [0, 1], clamp);
	const shake = old > 0.7 ? Math.sin(f / 1.5) * 3 : 0;
	return (
		<Board tint="#2a2350">
			<g transform={`translate(620,560) rotate(${-3 + Math.sin(f / 40) * 1.5})`}>
				<rect x={-230} y={-360} width={460} height={720} rx={40} fill="#2b2f3a" />
				<rect x={-200} y={-320} width={400} height={150} rx={14} fill="#b9e6c4" />
				<text x={180} y={-220} textAnchor="end" fontSize={step === 4 ? 96 : 64} fontFamily="Consolas, monospace" fill="#1b2b24">
					{typed[step]}
				</text>
				{step === 4 ? (
					<text x={180} y={-176} textAnchor="end" fontSize={28} fontFamily={FONT} fill="#1b2b24">
						ЛЕТ В ГОД
					</text>
				) : null}
				{Array.from({length: 16}).map((_, i) => {
					const on = pressing && i === pressKey;
					return <rect key={i} x={-190 + (i % 4) * 98} y={-130 + Math.floor(i / 4) * 110 + (on ? 6 : 0)} width={84} height={92} rx={14} fill={on ? '#ffe08a' : i % 4 === 3 ? '#f08a3c' : '#4b5161'} />;
				})}
				{f < t0 + 150 ? (
					<g transform={`translate(${-190 + (pressKey % 4) * 98 + 50},${-130 + Math.floor(pressKey / 4) * 110 + 60 + (pressing ? 0 : -24)})`}>
						<rect x={-12} y={0} width={24} height={150} rx={12} fill="#f2b21c" />
						<circle r={16} fill="#0b0b0d" />
					</g>
				) : null}
			</g>
			<g transform={`translate(${1330 + shake},0)`}>
				<Stickman id="old39" x={0} y={900 - 157 * 1.2} scale={1.2} pose={{...idle(gf), lean: old * 22, head: old * 14, armF: [old * 30, 20 + old * 40]}} {...CAST.leva} age={0.3 + 0.7 * old} hair={old > 0.5 ? 'grey' : 'short'} hairColor="#e6e6e6" expr={old > 0.5 ? 'sleepy' : 'wide'} faceTurn={0.1} look={[0, 0]} handItem={old > 0.6 ? <rect x={-4} y={0} width={8} height={170} rx={4} fill="#8a6a44" /> : null} />
				<AgeBadge x={0} y={430 + old * 40} value={Math.round(34 + 365 * old)} c="#ff6a5a" />
				{old > 0.8 ? <ellipse cx={0} cy={905} rx={140} ry={14} fill="#cfd4ef" opacity={0.25} style={{filter: 'blur(4px)'}} /> : null}
			</g>
		</Board>
	);
};

/* ================================ FRIDAY ================================== */

const DiscoHall: React.FC<{smoke?: number; children?: React.ReactNode; crowdMode?: 'dance' | 'run' | 'stand' | 'panic'; t?: number; heroX?: number; heroPose?: Pose; heroExpr?: any; heroLook?: [number, number]; heroHand?: any; heroOver?: boolean; disco?: number; anyaPose?: Pose; anyaExpr?: any; blurCrowd?: number}> = ({
	smoke = 0,
	children,
	crowdMode = 'dance',
	t = 0,
	heroX = 1500,
	heroPose,
	heroExpr,
	heroLook = [-0.6, 0],
	heroHand,
	heroOver,
	disco = 1,
	anyaPose,
	anyaExpr,
	blurCrowd = 0,
}) => {
	const {gf} = useShot();
	const s = heroS(gf, 1.0);
	return (
		<>
			<Layer depth={2}>
				<HallBack f={gf} smoke={smoke} disco={disco} />
			</Layer>
			<Layer depth={1.4}>
				<Svg>
					<Blur id="dcb1" amt={blurCrowd * 0.7}>
						<CrowdRow n={13} x0={-100} x1={1650} floor={790} s={0.75} mode={crowdMode} seed="r1" dir={1} t={t} />
					</Blur>
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="anya" x={960} floor={560} s={0.75} faceTurn={0.2} look={[0, 0]} pose={anyaPose ?? reach({...idle(gf), head: Math.sin(gf / 7) * 6 * disco}, 'F', [34, -150], 1)} expr={anyaExpr} armOver />
					<Actor who="leva" x={heroX} s={1.0} faceTurn={0.4} look={heroLook} facing={-1} chestText="РОДИТЕЛЬ" pose={heroPose} expr={heroExpr} handF={heroHand} armOver={heroOver} />
					<HeroBadge x={heroX} y={badgeY(900, s)} s={0.75} />
					<Blur id="dcb2" amt={blurCrowd}>
						<CrowdRow n={7} x0={-200} x1={1300} floor={1000} s={1.05} mode={crowdMode} seed="r2" dir={1} t={t} />
					</Blur>
					{children}
				</Svg>
			</Layer>
		</>
	);
};

export const S40: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('072');
	// the camera visits: the hall · Лёва at the wall · Гоша · Аня on stage
	const wide = camOn(960, 540, 1.0);
	const leva = camOn(1450, 560, 1.6, {farBlur: 5});
	const gosha = camOn(760, 640, 1.5, {farBlur: 5});
	const anya = camOn(960, 400, 1.7, {farBlur: 5});
	const k1 = interpolate(f, [t0 + 110, t0 + 140], [0, 1], {...clamp, easing: ease});
	const k2 = interpolate(f, [t0 + 245, t0 + 275], [0, 1], {...clamp, easing: ease});
	const k3 = interpolate(f, [t0 + 405, t0 + 435], [0, 1], {...clamp, easing: ease});
	const cam = mixCam(mixCam(mixCam(wide, leva, k1), gosha, k2), anya, k3);
	const ph = gf / 5;
	// Гоша moonwalks across the floor
	const gx = 520 + Math.sin(f / 70) * 220;
	// Лёва: awkward chaperone — arms crossed, off-beat nodding, a tiny wave
	let lp: Pose = gesture('armsCrossed', idle(gf, 1), 1, f);
	lp = {...lp, head: Math.sin(f / 5.5) * 6};
	lp = gesture('wave', lp, env(f, t0 + 200, t0 + 240, 6, 8) * 0.8, f);
	return (
		<Stage cam={cam} bg="#1b1f40" dust="#ffd6f0" light={{x: 50, y: 0, c: '255,140,220', o: 0.35}}>
			<DiscoHall heroPose={lp} heroLook={[-0.6, 0.1]} anyaPose={reach({...idle(gf), head: Math.sin(gf / 7) * 8}, 'F', [34, -150], 1)}>
				<Actor who="gosha" x={gx} floor={990} s={1.05} facing={Math.cos(f / 70) > 0 ? -1 : 1} pose={{lean: Math.sin(ph) * 20, head: Math.sin(ph * 2) * 14, armF: [150 + Math.sin(ph) * 30, -40], armB: [-150, 40], legF: [30 + Math.sin(ph) * 30, 40], legB: [-20, 10]}} expr="sleepy" mouth="open" vx={Math.cos(f / 70) * 3} />
			</DiscoHall>
		</Stage>
	);
};

export const S41: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('073');
	const smoke = interpolate(f, [t0 + 60, t0 + 160], [0, 1], clamp);
	const P = usePush(camOn(1450, 300, 2.2, {farBlur: 5}), camOn(1450, 260, 2.4, {farBlur: 5}));
	const scream = f > t0 + 220;
	const cam = scream ? {...camOn(1000, 700, 1.5, {farBlur: 5}), x: camOn(1000, 700, 1.5).x + Math.sin(f * 1.7) * 6} : P;
	const sparks = Math.floor(f / 2);
	const fire = interpolate(f, [t0 + 40, t0 + 200], [0, 0.7], clamp);
	return (
		<Stage cam={cam} bg="#1b1f40" light={{x: 75, y: 20, c: '255,170,90', o: 0.5}}>
			<Layer depth={1}>
				<HallBack f={gf} smoke={smoke} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Flames x={1420} y={330} k={fire} w={160} />
					{Array.from({length: 10}).map((_, i) => {
						const r = (k: string) => random(`sp${sparks}${i}${k}`);
						if (r('on') < 0.35) return null;
						return <line key={i} x1={1420} y1={200} x2={1420 + (r('x') - 0.5) * 120} y2={200 + r('y') * 90} stroke="#ffe08a" strokeWidth={4} strokeLinecap="round" />;
					})}
					<circle cx={1420} cy={200} r={30} fill="#ff9a3a" opacity={0.5 + 0.4 * Math.sin(f)} style={{filter: 'blur(8px)'}} />
					{scream ? (
						<>
							{[0, 1, 2, 3].map((i) => (
								<Extra key={i} i={i + 40} x={700 + i * 210} floor={1040} s={1.05} seed="s41" facing={i % 2 ? -1 : 1} pose={{...idle(gf, i), lean: Math.sin(f / 3 + i) * 5, armF: [125 + Math.sin(f / 2 + i) * 15, 30], armB: [-125 - Math.sin(f / 2 + i) * 15, -30]}} expr="wide" />
							))}
							<Bubble x={760} y={480} w={300} h={100} t={f - t0 - 222} tail={[40, 110]} fill="#ff4a4a">
								<text y={16} textAnchor="middle" fontSize={50} fontFamily={FONT} fill="#fff">
									ПОЖАР!
								</text>
							</Bubble>
						</>
					) : null}
				</Svg>
			</Layer>
			<FireGlow o={fire} />
		</Stage>
	);
};

export const S42: React.FC = () => {
	const {f, gf} = useShot();
	const P = usePush(camOn(960, 560, 1.0), camOn(1150, 560, 1.12));
	const panic = f > 20;
	return (
		<Stage cam={{...P, x: P.x + Math.sin(f * 1.3) * 4}} bg="#1b1f40" light={{x: 75, y: 15, c: '255,160,80', o: 0.45}}>
			<DiscoHall smoke={1} crowdMode={panic ? 'panic' : 'stand'} t={Math.max(0, f - 20)} disco={0.2} heroExpr="wide" heroPose={gesture('handsOnHead', idle(gf, 1), env(f, 10, 400, 6, 6), f)} heroOver blurCrowd={panic ? 6 : 0} anyaExpr="wide" />
			<FireGlow />
		</Stage>
	);
};

/* The Station nightclub plan */
export const S43: React.FC = () => {
	const {f, at} = useShot();
	const t0 = at('075');
	const flow = interpolate(f, [t0 + 200, t0 + 420], [0, 1], clamp);
	const jam = interpolate(f, [t0 + 380, t0 + 460], [0, 1], clamp);
	const bars = interpolate(f, [at('076'), at('076') + 60], [0, 1], {...clamp, easing: ease});
	const showBars = f > at('076') - 10;
	const draw = interpolate(f, [t0, t0 + 50], [0, 1], {...clamp, easing: ease});
	return (
		<Board tint="#2a1a24">
			<text x={960} y={100} textAnchor="middle" fontSize={44} fontFamily={FONT} fill="#fff">
				КЛУБ «СТЕЙШН», США, 2003
			</text>
			{!showBars ? (
				<g>
					<rect x={460} y={200} width={1000} height={640} rx={10} fill="none" stroke="#cfd4ef" strokeWidth={8} strokeDasharray={3280} strokeDashoffset={3280 * (1 - draw)} />
					<rect x={500} y={240} width={260} height={160} fill="#ff6a3a" opacity={0.4 + 0.3 * Math.sin(f / 3)} />
					<text x={630} y={330} textAnchor="middle" fontSize={30} fontFamily={FONT} fill="#fff">
						СЦЕНА
					</text>
					{[
						[1460, 720, 'ГЛАВНЫЙ ВХОД', '#ffc94a'],
						[460, 760, 'выход', '#5ad08a'],
						[1100, 840, 'выход', '#5ad08a'],
						[780, 200, 'выход', '#5ad08a'],
					].map(([x, y, t, c], i) => (
						<g key={i} opacity={interpolate(f, [t0 + 40 + i * 8, t0 + 50 + i * 8], [0, 1], clamp)}>
							<rect x={(x as number) - 40} y={(y as number) - 14} width={80} height={28} fill={c as string} />
							<text x={x as number} y={(y as number) + (i === 3 ? -24 : 50)} textAnchor="middle" fontSize={24} fontFamily={FONT} fill={c as string}>
								{t}
							</text>
						</g>
					))}
					{Array.from({length: 150}).map((_, i) => {
						const sx = 560 + random('st' + i) * 820;
						const sy = 430 + random('sy' + i) * 380;
						const toMain = random('tm' + i) < 0.66;
						const tx = toMain ? 1420 - random('jx' + i) * 140 * (0.3 + jam) : [480, 1100, 780][Math.floor(random('o' + i) * 3)];
						const ty = toMain ? 720 + (random('jy' + i) - 0.5) * 120 * (0.4 + jam * 0.4) : [760, 820, 220][Math.floor(random('o' + i) * 3)];
						const k = Math.min(1, flow * (0.7 + random('sp' + i) * 0.6));
						const jit = jam * (toMain ? Math.sin(f / 2 + i) * 3 : 0);
						return <circle key={i} cx={sx + (tx - sx) * k + jit} cy={sy + (ty - sy) * k} r={8} fill={toMain ? '#ffc94a' : '#5ad08a'} />;
					})}
					<text x={1180} y={600} fontSize={64} fontFamily={FONT} fill="#ffc94a" opacity={flow}>
						≈ 2/3
					</text>
					<g opacity={jam} transform={`translate(1600,320) scale(${1 + 0.05 * Math.sin(f / 3) * jam})`}>
						<circle r={90} fill="none" stroke="#ff4a4a" strokeWidth={10} />
						<path d={`M0,0 L0,-70 M0,0 L${Math.sin(f / 8) * 50},${-Math.cos(f / 8) * 50}`} stroke="#ff4a4a" strokeWidth={6} strokeLinecap="round" opacity={0.5} />
						<text y={20} textAnchor="middle" fontSize={50} fontFamily={FONT} fill="#ff4a4a">
							1:30
						</text>
						<text y={140} textAnchor="middle" fontSize={26} fontFamily={FONT} fill="#ffb0a8">
							ДАВКА У ДВЕРИ
						</text>
					</g>
				</g>
			) : (
				<g>
					{[
						{t: 'почти все — к одной двери', v: 270, c: '#ff6a5a', y: 400},
						{t: 'все выходы', v: 120, c: '#5ad08a', y: 640},
					].map((b, i) => (
						<g key={i}>
							<text x={300} y={b.y - 30} fontSize={38} fontFamily={FONT} fill="#fff">
								{b.t}
							</text>
							<rect x={300} y={b.y} width={4.6 * b.v * bars} height={90} rx={12} fill={b.c} />
							<text x={320 + 4.6 * b.v * bars} y={b.y + 64} fontSize={50} fontFamily={FONT} fill={b.c}>
								{i === 0 ? '≈ 4,5 мин' : '≈ 2 мин'}
							</text>
						</g>
					))}
				</g>
			)}
			<Cite text="NIST, расследование пожара в The Station (2003)" t={f - t0} />
		</Board>
	);
};

/* our hall from above */
const HallPlan: React.FC<{mode: 'jam' | 'side' | 'flow'; t: number; extras?: React.ReactNode}> = ({mode, t, extras}) => {
	const side = mode !== 'jam';
	const k = Math.min(1, t / 160);
	return (
		<Board tint="#1b1f40">
			<rect x={360} y={160} width={1200} height={760} rx={10} fill="#2a2d55" stroke="#cfd4ef" strokeWidth={6} />
			<rect x={420} y={180} width={1080} height={120} fill="#3a2a40" />
			<text x={960} y={252} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#ffb0c0">
				СЦЕНА
			</text>
			<rect x={1500} y={760} width={70} height={140} fill="#ffc94a" />
			<text x={1640} y={840} fontSize={28} fontFamily={FONT} fill="#ffc94a">
				ГЛАВНЫЕ ДВЕРИ
			</text>
			<rect x={340} y={300} width={30} height={120} fill={side ? '#5ad08a' : '#3a6a4a'} />
			{side ? <circle cx={355} cy={360} r={70 + 10 * Math.sin(t / 5)} fill="#5ad08a" opacity={0.2} /> : null}
			<text x={300} y={290} textAnchor="end" fontSize={28} fontFamily={FONT} fill="#5ad08a" opacity={side ? 1 : 0.5}>
				В СПОРТЗАЛ
			</text>
			{Array.from({length: 300}).map((_, i) => {
				const sx = 460 + random('hp' + i) * 1000;
				const sy = 360 + random('hq' + i) * 520;
				let tx = sx;
				let ty = sy;
				let kk: number;
				if (mode === 'jam' || mode === 'side') {
					tx = 1440 - random('jj' + i) * 260;
					ty = 830 + (random('jk' + i) - 0.5) * 140;
					kk = mode === 'side' ? 0.45 : Math.min(1, k * (0.6 + random('sp' + i) * 0.8));
				} else {
					// a river: the ones nearest the side door turn first
					const lane = random('ln' + i);
					tx = 340 - lane * 200;
					ty = 360 + (random('lk' + i) - 0.5) * 80;
					const delay = (Math.hypot(sx - 355, sy - 360) / 1200) * 160;
					kk = interpolate(t, [delay, delay + 140], [0, 1], {...clamp, easing: ease});
				}
				return <circle key={i} cx={sx + (tx - sx) * kk} cy={sy + (ty - sy) * kk} r={7} fill={mode === 'flow' ? (kk > 0.05 ? '#9ff0b0' : '#ffc94a') : '#ffc94a'} />;
			})}
			{mode === 'flow'
				? [0, 1, 2].map((i) => {
						const p = ((t / 40 + i / 3) % 1);
						return <path key={i} d={`M${1200 - p * 700},${560 - p * 160} l-30,-14 l0,28 z`} fill="#9ff0b0" opacity={Math.sin(p * Math.PI) * 0.8} />;
					})
				: null}
			{extras}
		</Board>
	);
};
export const S44: React.FC = () => {
	const {f, at} = useShot();
	const r = f - at('077');
	const ruler = interpolate(r, [70, 110], [0, 1], {...clamp, easing: ease});
	const open = r > 166;
	const eye = r > 205;
	return (
		<HallPlan
			mode="side"
			t={f}
			extras={
				<g>
					<g opacity={ruler}>
						<line x1={370} y1={330} x2={370 + 160 * ruler} y2={250} stroke="#fff" strokeWidth={4} strokeDasharray="12 8" />
						<text x={460} y={235} fontSize={36} fontFamily={FONT} fill="#fff">
							10 М
						</text>
					</g>
					{open ? (
						<g transform={`translate(240,470) scale(${Math.min(1, (r - 166) / 8)})`}>
							<rect x={-90} y={-30} width={180} height={56} rx={28} fill="#1f8a4a" />
							<text y={10} textAnchor="middle" fontSize={28} fontFamily={FONT} fill="#fff">
								ОТКРЫТА
							</text>
						</g>
					) : null}
					{eye ? (
						<g transform={`translate(560,520) scale(${Math.min(1, (r - 205) / 8)})`}>
							<ellipse rx={70} ry={38} fill="#fbf8ef" />
							<circle r={22} fill="#1b1e2a" />
							<line x1={-80} y1={50} x2={80} y2={-50} stroke="#ff4a4a" strokeWidth={12} strokeLinecap="round" />
						</g>
					) : null}
					<path d={`M${520 + Math.sin(f / 5) * 12},360 l-60,0 m24,-22 l-24,22 l24,22`} stroke="#5ad08a" strokeWidth={10} fill="none" strokeLinecap="round" />
				</g>
			}
		/>
	);
};

/* «В спортзал! Через боковую!» — nobody listens */
export const S45: React.FC = () => {
	const {f, gf, at} = useShot();
	const shout = f < at('079') + 20;
	const P = usePush(camOn(1300, 590, 1.7, {farBlur: 6}), camOn(1250, 590, 1.9, {farBlur: 6}));
	const P2 = usePush(camOn(960, 360, 1.6), camOn(960, 340, 1.8));
	const cam = f > at('079') + 120 ? P2 : P;
	// waves both arms, then points at the side door; gets shoved, hands drop
	let hp: Pose = idle(gf, 1);
	const wave = env(f, 0, at('078') + 30, 4, 8);
	hp = blend(hp, {...hp, armF: [150 + Math.sin(f / 2) * 20, 30], armB: [-150 - Math.sin(f / 2) * 20, 30] as [number, number]}, wave);
	const pt = env(f, at('078') + 34, at('079') + 40, 6, 8);
	hp = gesture('point', hp, pt, f);
	const shove = env(f, at('079') + 45, at('079') + 80, 4, 12);
	hp = {...hp, lean: hp.lean - 16 * shove};
	const lost = env(f, at('079') + 80, at('079') + 250, 10, 10);
	hp = gesture('handsOnHead', hp, lost * 0.6, f);
	return (
		<Stage cam={{...cam, x: cam.x + Math.sin(f * 1.1) * 3}} bg="#1b1f40" light={{x: 75, y: 15, c: '255,160,80', o: 0.45}}>
			<DiscoHall smoke={1} crowdMode="panic" t={f + 80} disco={0.2} heroX={1300 + shove * 30} heroPose={hp} heroExpr={shout ? 'angry' : 'worried'} heroHand={pt > 0.5 ? 'point' : undefined} heroLook={[-0.8, 0]} blurCrowd={6} anyaExpr="wide" anyaPose={reach(idle(gf), 'F', [30, -120], 1)}>
				{/* runners brush past him in the foreground */}
				<Blur id="s45fg" amt={8}>
					{[0, 1, 2].map((i) => {
						const x = ((f * 14 + i * 520) % 2200) - 200;
						return <Extra key={i} i={i + 60} x={x} floor={1080} s={1.25} seed="fg45" facing={1} pose={run(f * 0.5 + i)} expr="wide" />;
					})}
				</Blur>
			</DiscoHall>
			<FireGlow />
			{shout ? (
				<AbsoluteFill>
					<svg viewBox="0 0 1920 1080" width={1920} height={1080}>
						{[0, 1, 2].map((i) => {
							const k = ((f / 12 + i / 3) % 1);
							return <path key={i} d={`M${880 - k * 260},${320 - k * 80} q-40,60 0,120`} stroke="#fff" strokeWidth={8 * (1 - k)} fill="none" opacity={1 - k} />;
						})}
					</svg>
				</AbsoluteFill>
			) : null}
		</Stage>
	);
};

/* runs, jumps onto the stage; Anya frozen at the booth */
export const S46: React.FC = () => {
	const {f, gf, dur} = useShot();
	const k = interpolate(f, [0, dur * 0.7], [0, 1], {...clamp, easing: ease});
	const P = usePush(camOn(1100, 480, 1.3), camOn(1000, 420, 1.5));
	const x = 1650 - 570 * k;
	// floor: hall (900) until he reaches the stage edge, a jump arc, then the stage (560)
	const jumpK = interpolate(x, [1420, 1560], [1, 0], clamp);
	const floor = interpolate(jumpK, [0, 1], [900, 560]) - Math.sin(jumpK * Math.PI) * 160;
	const running = k < 1;
	const s = heroS(gf, 1.0);
	const tremble = Math.sin(f * 2.3) * 2;
	return (
		<Stage cam={P} bg="#1b1f40" light={{x: 75, y: 15, c: '255,160,80', o: 0.45}}>
			<Layer depth={1}>
				<HallBack f={gf} smoke={1} disco={0.1} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<g transform={`translate(${tremble},0)`}>
						<Actor who="anya" x={960} floor={560} s={0.75} faceTurn={0.2} look={[0, 0]} expr="wide" mouth="open" pose={reach({...idle(gf), lean: -4}, 'F', [30, -100], 1)} handItem={<Mic />} />
					</g>
					<Actor who="leva" x={x} floor={floor} s={1.0} facing={-1} pose={running ? (jumpK > 0 && jumpK < 1 ? {...run(f * 0.5), legF: [70, 90], legB: [40, 80]} : run(f * 0.5)) : gesture('stop', idle(gf), 0.5, f)} expr="angry" vx={running ? -10 : 0} shadow={jumpK === 0 || jumpK === 1} />
					<HeroBadge x={x} y={badgeY(floor, s)} s={0.75} />
				</Svg>
			</Layer>
			<FireGlow />
		</Stage>
	);
};

/* big close-up: thinking it through */
export const S47: React.FC = () => {
	const {f, gf, at, dur} = useShot();
	const ghost = f > at('082') + 40 && f < at('082') + 150 && Math.floor(f / 4) % 2 === 0;
	const rule3 = f > at('082') + 170;
	const P = usePush(camOn(960, 400, 1.0, {farBlur: 9}), camOn(960, 380, 1.15, {farBlur: 9}));
	const r1 = f - at('081');
	const r2 = f - at('082');
	let p: Pose = idle(gf, 1);
	// «И тут ты понимаешь» — eyes go wide; «настоящий пожар» — hands to head; «Нужна ложь…» — rubs chin
	p = gesture('handsOnHead', p, env(r1, 92, 150, 8, 10), f);
	p = gesture('rubChin', p, env(r1, 230, 330, 8, 10), f);
	// «трёхсотлетним» — touches his face; «но правило третье» — finger up
	p = gesture('touchFace', p, env(r2, 60, 160, 8, 10), f);
	const idea = env(r2, 180, 400, 6, 10);
	p = {...p, armF: [interpolate(idea, [0, 1], [p.armF[0], 168]), interpolate(idea, [0, 1], [p.armF[1], 6])]};
	const over = env(r2, 60, 160, 8, 10) > 0.5 || env(r1, 230, 330, 8, 10) > 0.5;
	const expr = idea > 0.3 ? 'normal' : r2 > 0 && r2 < 170 ? 'wide' : r1 > 40 ? 'worried' : 'normal';
	return (
		<Stage cam={P} bg="#1b1f40" light={{x: 75, y: 15, c: '255,160,80', o: 0.45}}>
			<Layer depth={6}>
				<HallBack f={gf} smoke={1} disco={0.15} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="leva" x={960} floor={1650} s={3.2} faceTurn={0.25} expr={expr} look={idea > 0.3 ? [0.3, -0.8] : [0.3, -0.3]} hideLegs chestText="РОДИТЕЛЬ" pose={p} armOver={over} handF={idea > 0.5 ? 'point' : undefined} shadow={false} />
					{ghost ? <HeroBadge x={960} y={250} s={1.2} value={334} /> : <HeroBadge x={960} y={250} s={1.2} />}
					{r1 > 150 && r1 < 225 ? (
						<Bubble x={1480} y={360} w={420} h={260} t={r1 - 150} tail={[-200, 180]} thought>
							<g transform="translate(0,20) scale(0.45)">
								{Array.from({length: 7}).map((_, i) => (
									<Stickman key={i} id={'tb' + i} x={-330 + i * 110 + ((f * 9) % 110)} y={60} scale={0.8} pose={run(f * 0.6 + i)} color={['#d94a3a', '#3aa37a', '#2f6fd8', '#8b5cf6'][i % 4]} hair="short" rimW={1.4} expr="wide" />
								))}
							</g>
							<text y={-90} textAnchor="middle" fontSize={30} fontFamily={FONT} fill="#d23b3b">
								«ПОЖАР!» = ЕЩЁ БЫСТРЕЕ
							</text>
						</Bubble>
					) : null}
				</Svg>
			</Layer>
			<FireGlow o={0.7} />
			<Accent text="ПРАВИЛО 3: считаются только те, кому соврал ТЫ" t={rule3 ? f - at('082') - 170 : -1} dur={dur} y={900} c="#9ff0b0" />
		</Stage>
	);
};

/* takes Anya by the shoulders; «Щёлк. Тридцать пять.» */
export const S48: React.FC = () => {
	const {f, gf, at} = useShot();
	const sp = useSpeaking(gf);
	const believe = f >= at('085') - 6;
	const cam = sp === 'LEVA' ? camOn(1040, 300, 2.1, {farBlur: 8}) : believe ? camOn(880, 280, 2.3, {farBlur: 8}) : camOn(960, 320, 1.6, {farBlur: 6});
	const LXs = 1020;
	const s = heroS(gf, 0.95);
	const grab = env(f, at('083') + 10, at('085') + 40, 10, 10);
	const shoulderA: [number, number] = [880 + 6, 560 - 157 * 0.8 - 104 * 0.8];
	let lp: Pose = {...idle(gf, 1), lean: 8};
	lp = reach(lp, 'F', toLocal(shoulderA[0] + 14, shoulderA[1] + 6, LXs, hipY(560, s), s, -1), grab);
	lp = reach(lp, 'B', toLocal(shoulderA[0] - 4, shoulderA[1] + 2, LXs, hipY(560, s), s, -1), grab);
	// after the click he touches his face
	lp = gesture('touchFace', lp, env(f, at('085') + 50, at('085') + 140, 8, 10), f);
	const shake = believe ? 0 : Math.sin(f * 2.1) * 1.5;
	let ap: Pose = {...idle(gf), armF: [40, 60], head: believe ? Math.sin(f / 3) * 6 * env(f, at('085') - 6, at('085') + 40, 4, 8) : shake};
	ap = reach(ap, 'F', [30, -100], 1);
	return (
		<Stage cam={{...cam, x: cam.x + Math.sin(f / 30) * 6}} bg="#1b1f40" light={{x: 75, y: 15, c: '255,160,80', o: 0.45}}>
			<Layer depth={1}>
				<HallBack f={gf} smoke={1} disco={0.1} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="anya" x={880} floor={560} s={0.8} faceTurn={0.6} look={[0.9, -0.1]} expr={believe ? 'normal' : 'wide'} pose={ap} handItem={<Mic />} />
					<Actor who="leva" x={LXs} floor={560} s={0.95} facing={-1} faceTurn={0.6} look={[0.9, 0]} expr="worried" pose={lp} armOver={env(f, at('085') + 50, at('085') + 140, 8, 10) > 0.5} />
					<HeroBadge x={LXs} y={badgeY(560, s)} s={0.65} />
				</Svg>
			</Layer>
			<FireGlow o={0.6} />
		</Stage>
	);
};

/* Anya on the mic: the crowd stops and turns */
export const S49: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('087');
	const P = usePush(camOn(960, 510, 1.7, {farBlur: 6}), camOn(960, 520, 1.0));
	const lift = interpolate(f, [at('086') + 20, t0 - 4], [0, 1], {...clamp, easing: ease});
	let ap: Pose = idle(gf);
	ap = reach(ap, 'F', [interpolate(lift, [0, 1], [30, 22]), interpolate(lift, [0, 1], [-100, -142])], 1);
	ap = reach(ap, 'B', [-6, -170], env(f, t0 - 10, t0 + 400, 8, 10)); // presses the headphone
	const calm = f > t0 + 40;
	return (
		<Stage cam={P} bg="#1b1f40" light={{x: 50, y: 10, c: '170,240,255', o: 0.4}}>
			<Layer depth={2}>
				<HallBack f={gf} smoke={1} disco={0} />
			</Layer>
			<Layer depth={1.4}>
				<Svg>
					<Blur id="s49a" amt={calm ? 0 : 5}>
						<CrowdRow n={13} x0={-100} x1={1650} floor={790} s={0.75} mode={calm ? 'stand' : 'panic'} seed="r1" t={calm ? 0 : f} />
					</Blur>
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="anya" x={960} floor={560} s={0.75} faceTurn={0.1} look={[0, 0]} pose={ap} handItem={<Mic />} armOver={lift > 0.6} expr={f > t0 ? 'normal' : 'worried'} />
					{f > t0
						? [0, 1, 2, 3].map((i) => {
								const k = ((f - t0) / 50 + i / 4) % 1;
								return <ellipse key={i} cx={960} cy={420} rx={60 + k * 900} ry={30 + k * 420} fill="none" stroke="#9ff0f0" strokeWidth={6} opacity={(1 - k) * 0.6} />;
							})
						: null}
					{[0, 1, 2, 3, 4, 5, 6].map((i) => {
						const turn = interpolate(f, [t0 + 20 + i * 6, t0 + 34 + i * 6], [0, 1], clamp);
						return <Extra key={i} i={i} x={-50 + i * 210} floor={1000 + (i % 2) * 14} s={1.05} seed="r2" facing={turn > 0.5 ? -1 : 1} pose={turn > 0.5 ? {...idle(gf, i), head: -14} : run(f * 0.5 + i)} expr={turn > 0.5 ? 'normal' : 'wide'} />;
					})}
				</Svg>
			</Layer>
			<FireGlow o={0.4} />
		</Stage>
	);
};

export const S50: React.FC = () => {
	const {f} = useShot();
	return <HallPlan mode="flow" t={f} />;
};

/* Гоша the traffic controller */
export const S51: React.FC = () => {
	const {f, gf, at} = useShot();
	const P = usePush(camOn(380, 520, 1.5), camOn(420, 500, 1.65));
	const sweep = Math.sin(f / 5);
	const shoutK = env(f, at('090'), at('090') + 60, 4, 8);
	let gp: Pose = {...idle(gf), lean: -4, armF: [100 + sweep * 50, 20], armB: [-100 + sweep * 50, 20] as [number, number]};
	gp = gesture('point', gp, shoutK, f);
	gp = {...gp, legF: [Math.abs(sweep) * 8, 0]};
	return (
		<Stage cam={P} bg="#1b1f40" light={{x: 10, y: 30, c: '170,255,200', o: 0.4}}>
			<Layer depth={1}>
				<HallBack f={gf} smoke={0.8} disco={0} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Rays x={120} y={440} w={140} len={500} angle={-14} c="#d8ffe6" o={0.18} />
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Svg>
					<CrowdRow n={9} x0={300} x1={1100} floor={900} s={0.95} mode="walk" seed="w1" dir={-1} t={f} />
					<Actor who="gosha" x={290} s={1.0} facing={1} faceTurn={0.4} look={[0.6, 0]} pose={gp} mouth="open" expr="wide" handF={shoutK > 0.5 ? 'point' : undefined} />
					{shoutK > 0.2 ? (
						<Bubble x={430} y={260} w={320} h={100} t={f - at('090')} tail={[-90, 110]} fill="#9ff0b0">
							<text y={16} textAnchor="middle" fontSize={40} fontFamily={FONT} fill="#1b1e2a">
								СЮДА!
							</text>
						</Bubble>
					) : null}
				</Svg>
			</Layer>
		</Stage>
	);
};

/* firefighters walk in and put out the curtain */
export const S52: React.FC = () => {
	const {f, gf} = useShot();
	const P = usePush(camOn(960, 520, 1.05), camOn(1000, 480, 1.15));
	const fire = interpolate(f, [30, 170], [0.9, 0], clamp);
	return (
		<Stage cam={P} bg="#1b1f40" light={{x: 75, y: 20, c: '255,170,90', o: 0.4 * fire + 0.1}}>
			<Layer depth={1.2}>
				<HallBack f={gf} smoke={Math.max(0, 1 - f / 140)} disco={0} />
				<Svg>
					<Flames x={1440} y={330} k={fire} w={220} />
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Svg>
					{[1180, 1380].map((x0, i) => {
						const w = walkTo(f, 0, 30, x0 - 600, x0, i, 0.34);
						const spray = env(f, 30, 400, 6, 6);
						const pose = blend(w.pose, {...idle(gf, i), armF: [100, 0], armB: [80, 10]}, spray);
						return (
							<g key={i}>
								<Stickman id={'ff' + i} x={w.x} y={900 - 157} scale={1} facing={1} pose={pose} color="#2b2f3a" hair="cap" hairColor="#d23b3b" rimW={2} shoe="#111" />
								{spray > 0.5 ? (
									<>
										<path d={`M${w.x + 120},${560} Q${w.x + 260},${300 + Math.sin(f / 6 + i) * 20} ${1420 + i * 40},${260}`} stroke="#bfe6ff" strokeWidth={12} fill="none" opacity={0.7} strokeLinecap="round" />
										{Array.from({length: 6}).map((_, j) => (
											<circle key={j} cx={1420 + i * 40 + (random(`d${i}${j}${Math.floor(f / 3)}`) - 0.5) * 80} cy={260 + random(`e${i}${j}${Math.floor(f / 3)}`) * 80} r={5} fill="#dff4ff" opacity={0.8} />
										))}
									</>
								) : null}
							</g>
						);
					})}
				</Svg>
			</Layer>
			<FireGlow o={fire} />
			<Accent text="2 МИНУТЫ · ВСЕ ВЫШЛИ" t={f - 30} dur={140} c="#9ff0b0" />
		</Stage>
	);
};

/* =============================== THE STREET =============================== */

export const S53: React.FC = () => {
	const {f, gf, at} = useShot();
	const sp = useSpeaking(gf);
	const aw = walkTo(f, 6, at('092') + 70, -250, 800, 2, 0.32);
	const step = walkTo(f, at('097'), at('097') + 30, 800, 930, 2, 0.3);
	const ax = f >= at('097') ? step.x : aw.x;
	const moving = aw.moving || step.moving;
	const AXc = ax;
	const cam = sp === 'ANYA' ? camOn(AXc + 10, 560, 1.8, {farBlur: 6}) : sp === 'LEVA' ? camOn(1110, 560, 1.8, {farBlur: 6}) : camOn(960, 540, 1.05);
	const s = heroS(gf, 1.05);
	// Anya: arrives, arms crossed «Это была не учебная», laughs through tears, punches his shoulder
	let ap: Pose = moving ? (f >= at('097') ? step.pose : aw.pose) : idle(gf, 3);
	ap = gesture('armsCrossed', ap, env(f, at('093') - 4, at('095') + 80, 8, 10), f);
	const laugh = f > at('096') + 60;
	ap = gesture('touchFace', ap, env(f, at('096') + 60, at('096') + 140, 6, 10), f);
	if (laugh) ap = {...ap, lean: ap.lean + Math.sin(f / 3) * 4};
	const punch = env(f, at('097') + 70, at('097') + 100, 4, 10);
	ap = reach(ap, 'F', toLocal(1110 - 14, hipY(900, s) - 100 * s, ax, hipY(900, 1), 1, 1), punch);
	// Лёва: leaning at the fence, rubs his neck, then hand on heart for the confession
	let lp: Pose = {...idle(gf, 1), lean: -6};
	lp = gesture('scratch', lp, env(f, at('094'), at('094') + 80, 8, 10), f);
	lp = reach(lp, 'F', [6, -90], env(f, at('095') + 20, at('095') + 160, 8, 10));
	lp = {...lp, lean: lp.lean - 10 * punch};
	return (
		<Stage cam={{...cam, x: cam.x + Math.sin(f / 70) * 10}} bg="#070b1f" dust="#cfe0ff" light={{night: true, x: 80, y: 30}}>
			<Layer depth={2.2}>
				<NightStreet f={gf} />
			</Layer>
			<Layer depth={1.4}>
				<Svg>
					{[0, 1].map((i) => {
						const pw = walkTo(f, 60 + i * 200, 360 + i * 200, 2100, -300, i + 7, 0.24);
						return pw.moving ? <Extra key={i} i={i + 80} x={pw.x} floor={860} s={0.8} pose={pw.pose} seed="blk" facing={-1} /> : null;
					})}
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="anya" x={ax} s={1.0} facing={1} faceTurn={0.6} look={[0.8, 0]} expr={laugh ? 'sad' : 'normal'} mouth={laugh ? 'smile' : 'line'} pose={ap} vx={moving ? (f >= at('097') ? step.vx : aw.vx) : 0} bob={moving ? (f >= at('097') ? step.bob : aw.bob) : 0} armOver={env(f, at('096') + 60, at('096') + 140, 6, 10) > 0.5} />
					{laugh ? <path d={`M${ax - 10},${headY(900, 1) + 10 + ((f * 2) % 30)} q-5,9 0,12 q5,-3 0,-12 z`} fill="#9fd8ff" /> : null}
					<Actor who="leva" x={1110} s={1.05} facing={-1} faceTurn={0.6} look={[0.8, 0]} expr={laugh ? 'normal' : 'worried'} mouth={f > at('097') + 80 ? 'smile' : undefined} chestText="РОДИТЕЛЬ" pose={lp} armOver={env(f, at('094'), at('094') + 80, 8, 10) > 0.5} />
					<HeroBadge x={1110} y={badgeY(900, s)} s={0.8} />
				</Svg>
			</Layer>
			<AbsoluteFill style={{background: Math.floor(gf / 8) % 2 ? '#ff2a2a' : '#2a5aff', mixBlendMode: 'overlay', opacity: 0.12}} />
		</Stage>
	);
};

/* the badge goes back: 35 → 34 */
export const S54: React.FC = () => {
	const {f, gf, at} = useShot();
	const card = f > at('099') + 30;
	const P = usePush(camOn(1120, 500, 2.3, {farBlur: 8}), camOn(1120, 480, 2.6, {farBlur: 8}));
	const change = at('098') + 60;
	const shake = f > change && f < change + 14 ? Math.sin(f * 3) * (change + 14 - f) : 0;
	if (card) {
		const t = f - at('099') - 30;
		return <RuleCard n="2" title="ПРАВИЛО" text="Правда ничего не возвращает" t={t} strike={interpolate(t, [40, 70], [0, 1], clamp)} fix="Правда возвращает год — если тебе поверили" />;
	}
	let p: Pose = idle(gf, 1);
	p = gesture('touchFace', p, env(f, change + 6, change + 120, 6, 10), f);
	p = {...p, head: p.head - 10 * env(f, at('098') + 30, change, 6, 6)};
	const s = heroS(gf, 1.05);
	return (
		<Stage cam={{...P, x: P.x + shake, y: P.y + shake * 0.5}} bg="#070b1f" light={{night: true, x: 60, y: 20}}>
			<Layer depth={2.2}>
				<NightStreet f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="leva" x={1120} s={1.05} facing={-1} faceTurn={0.4} look={f < change ? [0.2, -0.9] : [0.2, 0]} expr="wide" mouth="open" chestText="РОДИТЕЛЬ" pose={p} armOver={env(f, change + 6, change + 120, 6, 10) > 0.5} />
					<HeroBadge x={1120} y={badgeY(900, s)} s={0.8} />
					{f > change && f < change + 30
						? Array.from({length: 10}).map((_, i) => {
								const a = (i / 10) * Math.PI * 2;
								const k = (f - change) / 30;
								return <circle key={i} cx={1120 + Math.cos(a) * 160 * k} cy={badgeY(900, s) + Math.sin(a) * 90 * k} r={6 * (1 - k)} fill="#ffe08a" />;
							})
						: null}
				</Svg>
			</Layer>
			<Flash o={flash(f, change, 6) * 0.4} c="#ffe08a" />
		</Stage>
	);
};

/* 18 people to convince — and they all laugh */
export const S55: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('100');
	const {fps} = useVideoConfig();
	const laugh = f > t0 + 222;
	const faces = [
		...['mom', 'mom', 'mom'].map((w) => ({w, label: 'МАМА'})),
		{w: 'gosha', label: 'ГОША'},
		...Array.from({length: 14}).map((_, i) => ({w: 'crowd' + i, label: ''})),
	];
	const lk = spring({frame: f - t0 - 222, fps, config: {damping: 13}});
	return (
		<Board tint="#22285c">
			<text x={960} y={130} textAnchor="middle" fontSize={50} fontFamily={FONT} fill="#fff">
				ВЕРНУТЬ 18 ЛЕТ = УБЕДИТЬ 18 ЧЕЛОВЕК
			</text>
			{faces.map((p, i) => {
				const x = 300 + (i % 9) * 165;
				const y = 380 + Math.floor(i / 9) * 300;
				const k = spring({frame: f - t0 - 40 - i * 6, fps, config: {damping: 10, stiffness: 160}});
				const look = p.w.startsWith('crowd') ? {color: ['#d94a3a', '#3aa37a', '#2f6fd8', '#8b5cf6', '#e86aa0', '#f08a3c'][i % 6], hair: (['short', 'bun', 'ponytail', 'bob'] as const)[i % 4], rimW: 1.6} : CAST[p.w];
				const bob = laugh ? Math.abs(Math.sin(f / 3 + i)) * 10 : 0;
				return (
					<g key={i} opacity={Math.min(1, k)} transform={`translate(${x},${y - bob}) scale(${Math.max(0, k)}) translate(${-x},${-y})`}>
						<Stickman id={'f55' + i} x={x} y={y + 60} scale={0.55} pose={{...idle(gf, i), lean: laugh ? Math.sin(f / 3 + i) * 8 : 0}} {...look} faceTurn={0.1} look={[0, 0]} hideLegs expr={laugh ? 'sleepy' : 'normal'} mouth={laugh ? 'open' : 'line'} />
						{p.label ? (
							<text x={x} y={y + 130} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="#ffe7a8">
								{p.label}
							</text>
						) : null}
						<text x={x + 40} y={y - 80} textAnchor="middle" fontSize={34} fontFamily={FONT} fill={laugh ? '#ff6a5a' : '#9aa3b5'}>
							{laugh ? 'ХА' : '?'}
						</text>
					</g>
				);
			})}
			{laugh ? (
				<g transform={`translate(${1560 + (1 - lk) * 600},0)`}>
					<Stickman id="l55" x={0} y={hipY(1060, 1.0)} scale={1.0} facing={-1} pose={reach(reach(idle(gf, 1), 'F', [50, -170], 1), 'B', [40, -170], 1)} {...CAST.leva} age={1} expr="worried" faceTurn={0.4} look={[0.6, 0]} />
					<g transform="translate(-40,690) rotate(-6)">
						<rect x={-110} y={-44} width={220} height={88} rx={8} fill="#fbf8ef" stroke="#1b1e2a" strokeWidth={4} />
						<text y={16} textAnchor="middle" fontSize={44} fontFamily={FONT} fill="#1b1e2a">
							МНЕ 16
						</text>
					</g>
				</g>
			) : (
				<g transform="translate(960,1000)">
					<HeroBadge x={0} y={0} s={1} />
				</g>
			)}
		</Board>
	);
};

/* ================================ THE KITCHEN =============================== */

export const S56: React.FC = () => {
	const {f, gf, at} = useShot();
	const sp = useSpeaking(gf);
	const momBadge = interpolate(f, [at('107') + 60, at('107') + 80], [0, 1], clamp);
	const P = usePush(camOn(960, 540, 1.0), camOn(960, 520, 1.1));
	const cam = sp === 'MOM' ? camOn(700, 560, 1.7, {farBlur: 6}) : sp === 'LEVA' ? camOn(1240, 560, 1.7, {farBlur: 6}) : P;
	const s = heroS(gf, 1.05);
	// Лёва comes in, stands by the table, slowly sits
	const w = walkTo(f, 6, at('101') + 80, 2150, 1270, 5, 0.3);
	const sitK = interpolate(f, [at('105') + 4, at('105') + 44], [0, 1], {...clamp, easing: ease});
	const x = interpolate(sitK, [0, 1], [w.x, 1240]);
	const seat = interpolate(sitK, [0, 1], [hipY(900, s), 790]);
	let lp: Pose = blend(w.pose, SIT, sitK);
	lp = gesture('shrug', lp, env(f, at('103'), at('103') + 30, 4, 8), f);
	lp = gesture('touchFace', lp, env(f, at('104') + 30, at('105') + 4, 6, 6), f);
	const lean = env(f, at('106') - 4, at('107') + 60, 6, 10);
	lp = {...lp, lean: lp.lean + 12 * lean};
	// mom: hands round the mug; points above her own head on «Свою вижу»
	let mp: Pose = reach(reach({...SIT}, 'F', [130, -120], 1), 'B', [120, -116], 1);
	mp = reach(mp, 'F', [20, -300], env(f, at('107') + 30, at('107') + 95, 8, 10));
	mp = {...mp, head: nod(f, env(f, at('107') + 100, at('107') + 260, 10, 10), 4, 9)};
	return (
		<Stage cam={{...cam, x: cam.x + Math.sin(f / 80) * 8}} bg="#2a2a48" light={{night: true, x: 50, y: 25, c: '255,214,160', o: 0.4}}>
			<Layer depth={1.5}>
				<Kitchen night />
				<Svg>
					<ellipse cx={1000} cy={170} rx={200} ry={60} fill="#ffd9a0" opacity={0.25} style={{filter: 'blur(20px)'}} />
				</Svg>
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Chair x={700} y={800} facing={1} />
					<Chair x={1240} y={800} facing={-1} />
					<Actor who="mom" x={700} seat={790} pose={mp} faceTurn={0.6} look={w.moving ? [0.9, -0.1] : [0.8, 0]} expr="sad" />
					{momBadge > 0 ? <AgeBadge x={700} y={500} value={50} s={0.8 * momBadge} c="#ff9ad8" /> : null}
					<Actor who="leva" x={x} facing={-1} s={1.05} seat={sitK > 0 ? seat : undefined} pose={lp} faceTurn={0.6} look={[0.8, 0]} expr="worried" vx={w.vx} bob={w.bob} armOver={env(f, at('104') + 30, at('105') + 4, 6, 6) > 0.5} />
					<HeroBadge x={x} y={sitK > 0 ? seatBadgeY(seat, s) : badgeY(900, s)} s={0.8} />
				</Svg>
			</Layer>
			<Layer depth={1}>
				<KitchenTable night mugs={1} />
			</Layer>
		</Stage>
	);
};

export const S57: React.FC = () => {
	const {f, gf, at} = useShot();
	const P = usePush(camOn(700, 560, 2.0, {farBlur: 8}), camOn(700, 540, 2.2, {farBlur: 8}));
	const shown = interpolate(f, [at('110'), at('110') + 20], [0, 1], clamp);
	// sips her tea, then lowers the mug and looks down at «Пятьдесят»
	const sip = env(f, 20, at('109') + 10, 12, 12);
	let mp: Pose = reach({...SIT}, 'F', [130, -120], 1);
	mp = reach({...mp, head: -6 * sip}, 'F', [34, -144], sip);
	mp = {...mp, head: mp.head + 12 * env(f, at('110'), at('110') + 300, 8, 10)};
	return (
		<Stage cam={P} bg="#2a2a48" light={{night: true, x: 50, y: 25, c: '255,214,160', o: 0.45}}>
			<Layer depth={1.5}>
				<Kitchen night />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Chair x={700} y={800} facing={1} />
					<Actor who="mom" x={700} seat={790} pose={mp} faceTurn={0.4} look={shown > 0.5 ? [0.3, 0.6] : [0.6, 0]} expr="sad" handItem={sip > 0.3 ? <g><rect x={-18} y={-30} width={36} height={36} rx={6} fill="#f2b21c" /></g> : null} armOver={sip > 0.6} />
					<g opacity={0.6 + 0.4 * shown} transform={`translate(700,480) scale(${1 + 0.15 * shown * Math.max(0, Math.sin((f - at('110')) / 3)) * Math.exp(-(f - at('110')) / 20)}) translate(-700,-480)`}>
						<AgeBadge x={700} y={480} value={50} s={0.7 * (0.8 + 0.2 * shown)} c="#ff9ad8" />
					</g>
					<text x={700} y={420} textAnchor="middle" fontSize={20} fontFamily={FONT} fill="#ffd6ee" opacity={interpolate(f, [10, 30], [0, 1], clamp)}>
						ПО ПАСПОРТУ 39
					</text>
				</Svg>
			</Layer>
			<Layer depth={1}>
				<KitchenTable night mugs={sip > 0.3 ? 0 : 1} />
			</Layer>
		</Stage>
	);
};

/* 11 birthdays: little Лёва grows along the cakes, mom says «скоро» each time */
export const S58: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('111');
	const {fps} = useVideoConfig();
	const n = Math.max(0, Math.min(11, Math.floor((f - t0 - 140) / 18)));
	const cur = Math.max(0, n - 1);
	const kidX = 160 + cur * 160;
	return (
		<Board tint="#2a1f3a">
			<text x={960} y={120} textAnchor="middle" fontSize={44} fontFamily={FONT} fill="#ffd6ee">
				11 ДНЕЙ РОЖДЕНИЯ · 11 РАЗ «СКОРО»
			</text>
			{Array.from({length: 11}).map((_, i) => {
				const on = i < n;
				const k = spring({frame: f - t0 - 140 - i * 18, fps, config: {damping: 10, stiffness: 180}});
				const blown = i < n - 1;
				return (
					<g key={i} transform={`translate(${160 + i * 160},${520 + (i % 2) * 40}) scale(${on ? 0.8 + 0.2 * Math.min(1, k) : 0.8})`} opacity={on ? 1 : 0.25}>
						<rect x={-55} y={-30} width={110} height={70} rx={12} fill="#f6d0e0" />
						<rect x={-55} y={-30} width={110} height={18} rx={9} fill="#fff" />
						<text y={28} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#c94a7a">
							{i + 6}
						</text>
						<rect x={-3} y={-62} width={6} height={32} fill="#7fb8ff" />
						{on && !blown ? <ellipse cx={Math.sin(f / 2) * 2} cy={-70} rx={6} ry={10} fill="#ffd34a" /> : null}
						{blown ? <path d={`M0,-66 q-8,-14 0,-26 q8,-12 0,-24`} stroke="#cfd4ef" strokeWidth={3} fill="none" opacity={0.5} /> : null}
						{on ? (
							<text y={-110} textAnchor="middle" fontSize={26} fontFamily="'Rubik', sans-serif" fontWeight={700} fill="#ffe7a8">
								«скоро»
							</text>
						) : null}
					</g>
				);
			})}
			{n > 0 ? (
				<Stickman id="kid58" x={kidX} y={760 - 157 * (0.35 + cur * 0.03)} scale={0.35 + cur * 0.03} pose={gesture('point', idle(gf, 2), 0.6, f)} {...CAST.leva} faceTurn={0.2} look={[0.4, -0.4]} mouth="frown" rimW={1.4} />
			) : null}
			<g transform="translate(960,860)">
				<Stickman id="m58" x={-160} y={60} scale={0.8} pose={{...idle(gf), head: nod(f, n > 0 ? 1 : 0, 5, 6)}} {...CAST.mom} expr="sad" faceTurn={0.1} look={[0, 0]} hideLegs />
				<AgeBadge x={140} y={0} value={39 + n} c="#ff9ad8" />
			</g>
		</Board>
	);
};

/* «Мам. Где папа?» — she looks at the window, takes his hand */
export const S59: React.FC = () => {
	const {f, gf, at} = useShot();
	const window_ = env(f, at('113'), at('113') + 60, 10, 10);
	const hand = env(f, at('113') + 55, 9999, 20, 10);
	const s = heroS(gf, 1.0);
	const MX = 800;
	const LXk = 1110;
	const meet: [number, number] = [962, 640];
	const P = usePush(camOn(960, 520, 1.25), camOn(960, 540, 1.05));
	const handsCam = camOn(960, 600, 1.7, {farBlur: 6});
	const momCam = camOn(MX, 560, 1.9, {farBlur: 6});
	const cam = f >= at('114') - 6 ? momCam : mixCam(P, handsCam, env(f, at('113') + 60, 1e9, 20, 1));
	let mp: Pose = {...SIT, lean: 0};
	mp = {...mp, head: -18 * window_};
	mp = reach({...mp, lean: mp.lean + 18 * hand}, 'F', toLocal(meet[0] - 8, meet[1], MX, 790, 1, 1), hand);
	let lp: Pose = {...SIT, lean: 6 * env(f, 0, at('112') + 40, 8, 10)};
	lp = reach({...lp, lean: lp.lean + 18 * hand}, 'F', toLocal(meet[0] + 8, meet[1], LXk, 790, s, -1), hand);
	return (
		<Stage cam={cam} bg="#2a2a48" dust="#ffe6c0" light={{night: true, x: 50, y: 25, c: '255,214,160', o: 0.45}}>
			<Layer depth={1.5}>
				<Kitchen night />
				<Rays x={860} y={160} w={280} len={700} angle={-18} c="#c9d4ff" o={0.12} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Chair x={MX} y={800} facing={1} />
					<Chair x={LXk} y={800} facing={-1} />
					<Actor who="mom" x={MX} seat={790} pose={mp} faceTurn={window_ > 0.5 ? -0.5 : 0.6} look={window_ > 0.5 ? [-0.6, -0.4] : [0.8, 0]} expr="sad" />
					<AgeBadge x={MX} y={500} value={50} s={0.7} c="#ff9ad8" />
					<Actor who="leva" x={LXk} facing={-1} seat={790} pose={lp} faceTurn={0.6} look={hand > 0.5 ? [0.6, 0.5] : [0.8, 0]} expr="worried" />
					<HeroBadge x={LXk} y={seatBadgeY(790, s)} s={0.8} />
				</Svg>
			</Layer>
			<Layer depth={1}>
				<KitchenTable night mugs={0} />
			</Layer>
			{hand > 0.9 ? (
				<Layer depth={1}>
					<Svg>
						<circle cx={meet[0] - 8} cy={meet[1]} r={11} fill="#0b0b0d" />
						<circle cx={meet[0] + 8} cy={meet[1] + 2} r={11} fill="#0b0b0d" />
					</Svg>
				</Layer>
			) : null}
		</Stage>
	);
};

/* outro: the three little lies get crossed out, a comment is typed, subscribe gets clicked */
export const S60: React.FC = () => {
	const {f, gf, at, dur} = useShot();
	const {fps} = useVideoConfig();
	const t0 = at('115');
	const sub = spring({frame: f - (at('116') + 165), fps, config: {damping: 10}});
	const chips = [
		{t: '«нормально»', a: t0 + 135},
		{t: '«уже выхожу»', a: t0 + 170},
		{t: '«мне нравится подарок»', a: t0 + 213},
	];
	const typeK = interpolate(f, [t0 + 280, t0 + 360], [0, 1], clamp);
	const comment = 'мне было бы 23 😅';
	const click = at('116') + 195;
	const cursorK = interpolate(f, [at('116') + 170, click], [0, 1], {...clamp, easing: ease});
	const pressed = f > click && f < click + 8;
	return (
		<Board tint="#22285c">
			<text x={960} y={160} textAnchor="middle" fontSize={56} fontFamily={FONT} fill="#fff">
				А ТЫ ПРОЖИЛ БЫ ДЕНЬ БЕЗ ЛЖИ?
			</text>
			{chips.map((c, i) => {
				const k = spring({frame: f - c.a, fps, config: {damping: 11, stiffness: 160}});
				const strike = interpolate(f, [c.a + 18, c.a + 30], [0, 1], clamp);
				const w = c.t.length * 22 + 60;
				const x = 960 + (i - 1) * 470;
				return f > c.a ? (
					<g key={i} transform={`translate(${x},270) scale(${k})`}>
						<rect x={-w / 2} y={-34} width={w} height={64} rx={32} fill="#fbf8ef" />
						<text y={10} textAnchor="middle" fontSize={30} fontFamily={FONT} fill="#1b1e2a">
							{c.t}
						</text>
						<line x1={-w / 2 + 16} y1={-2} x2={-w / 2 + 16 + (w - 32) * strike} y2={-2} stroke="#e8352f" strokeWidth={6} strokeLinecap="round" />
					</g>
				) : null;
			})}
			<Stickman id="o1" x={760} y={820 - 157 * 1.2} scale={1.2} pose={gesture('wave', idle(gf), env(f, at('116') + 220, 99999, 8, 8), f)} {...CAST.leva} age={0.95} faceTurn={0.2} look={[0.2, 0]} mouth="smile" />
			<AgeBadge x={760} y={300 + 60} value={34} />
			<Stickman id="o2" x={1160} y={820 - 157 * 1.15} scale={1.15} facing={-1} pose={{...idle(gf, 3), head: nod(f, 1, 3, 12)}} {...CAST.mom} faceTurn={0.2} look={[0.2, 0]} mouth={f > at('116') + 209 ? 'smile' : 'line'} />
			<AgeBadge x={1160} y={312 + 60} value={50} c="#ff9ad8" />
			{typeK > 0 && f < at('116') + 150 ? (
				<g transform="translate(960,920)">
					<rect x={-360} y={-44} width={720} height={88} rx={20} fill="#fbf8ef" />
					<circle cx={-310} cy={0} r={24} fill="#f2b21c" />
					<text x={-270} y={12} fontSize={34} fontFamily="'Rubik', sans-serif" fill="#1b1e2a">
						{comment.slice(0, Math.round(comment.length * typeK))}
						{f % 20 < 10 ? '|' : ''}
					</text>
				</g>
			) : null}
			{sub > 0.01 ? (
				<g transform={`translate(960,960) scale(${sub * (pressed ? 0.92 : 1)})`}>
					<rect x={-230} y={-50} width={460} height={100} rx={50} fill={f > click ? '#7a7f8f' : '#e8352f'} />
					<text y={16} textAnchor="middle" fontSize={44} fontFamily={FONT} fill="#fff">
						{f > click ? 'ВЫ ПОДПИСАНЫ ✓' : 'ПОДПИСАТЬСЯ'}
					</text>
				</g>
			) : null}
			{cursorK > 0 && f < click + 40 ? (
				<g transform={`translate(${1500 - 420 * cursorK},${1060 - 90 * cursorK}) scale(${pressed ? 0.85 : 1})`}>
					<path d="M0,0 L0,44 L12,32 L22,54 L30,50 L20,29 L36,29 Z" fill="#fff" stroke="#1b1e2a" strokeWidth={3} />
				</g>
			) : null}
			<rect x={0} y={0} width={1920} height={1080} fill="#000" opacity={interpolate(f, [dur - 30, dur], [0, 1], clamp)} />
		</Board>
	);
};
