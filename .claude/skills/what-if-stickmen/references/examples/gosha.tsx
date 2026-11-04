import React from 'react';
import {interpolate} from 'remotion';
import {Pose, toLocal} from '../Stickman';
import {blend, env, gesture, idle, reach, walkTo} from './cast';
import {Actor, heroAge, useShot, useSpeaking} from './core';
import {HeroBadge, Layer, Pop, Stage, Svg, camOn, clamp, ease, mixCam, usePush} from './kit';
import {Corridor, SchoolYard} from './sets';
import {Bubble, FONT} from './ui';
import {ageK} from './cast';

/* Лёва & Гоша: meeting, bragging, the stubble test and the two lie tests — staged with
   entrances, a handshake and gestures timed to the words. */

const heroScale = (gf: number, s: number) => s * (1 + 0.07 * ageK(heroAge(gf)));
/* head centre of an Actor standing on `floor` (world) */
const headOf = (x: number, floor: number, s: number): [number, number] => [x, floor - 157 * s - 164 * s];

/* ------------------------------ schoolyard intro ----------------------------- */
export const S13: React.FC = () => {
	const {f, gf, at} = useShot();
	const t0 = at('021');
	const r = f - t0;
	const cam = usePush(camOn(960, 560, 1.0), camOn(930, 540, 1.12));
	const FL = 900;
	const gw = walkTo(r, -8, 48, -260, 830, 2, 0.34);
	const lw = walkTo(r, -2, 52, 2200, 1110, 5, 0.32);
	const sG = 1.1;
	const sL = heroScale(gf, 1.1);
	let gp: Pose = gw.pose;
	let lp: Pose = lw.pose;
	// handshake on «твой лучший друг с первого класса»
	const hs = env(r, 50, 88, 8, 8);
	if (hs > 0) {
		const midX = (gw.x + lw.x) / 2;
		const midY = FL - 157 * sG - 60 + Math.sin(r / 2.4) * 9 * hs;
		gp = reach(gp, 'F', toLocal(midX, midY, gw.x, FL - 157 * sG, sG, 1), hs);
		lp = reach(lp, 'F', toLocal(midX, midY, lw.x, FL - 157 * sL, sL, -1), hs);
	}
	// bragging, beat by beat
	gp = gesture('presentF', gp, env(r, 96, 132, 8, 8), r);
	gp = {...gp, ...(env(r, 146, 186, 6, 8) > 0 ? {armF: [interpolate(env(r, 146, 186, 6, 8), [0, 1], [gp.armF[0], 168]), 4] as [number, number], head: -18} : {})};
	const pull = env(r, 198, 262, 6, 8);
	if (pull > 0) {
		const up = Math.abs(Math.sin((r - 198) / 5));
		gp = blend(gp, {...gp, lean: 0, armF: [165, 25 + 60 * up], armB: [-165, -25 - 60 * up] as any, legF: [4, 0], legB: [-4, 0]}, pull);
	}
	const whisper = env(r, 272, 360, 8, 10);
	gp = blend(gp, {...gp, lean: 14, head: 10}, whisper);
	gp = reach(gp, 'F', [30, -150], whisper);
	const shh = env(r, 364, 440, 8, 10);
	gp = reach(gp, 'F', [26, -140], shh);
	lp = gesture('shrug', lp, env(r, 100, 132, 6, 8), r);
	lp = gesture('rubChin', lp, env(r, 290, 350, 8, 8), r);
	const gH = headOf(gw.x, FL, sG);
	const lH = headOf(lw.x, FL, sL);
	return (
		<Stage cam={cam} bg="#7fc0ea" dust="#ffffff" light={{x: 70, y: 5, o: 0.5}}>
			<Layer depth={2.2}>
				<SchoolYard f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="gosha" x={gw.x} floor={FL} s={sG} facing={hs > 0 || whisper > 0 ? 1 : gw.moving ? 1 : 1} faceTurn={gw.moving || hs > 0 || whisper > 0 ? 0.6 : 0.2} look={whisper > 0 ? [0.9, 0] : shh > 0 ? [0, 0] : [0.3, 0]} expr={shh > 0 ? 'wide' : 'normal'} mouth={hs > 0 ? 'smile' : 'smirk'} pose={gp} vx={gw.vx} bob={gw.bob} armOver={shh > 0.5} uid="g13" />
					<Actor who="leva" x={lw.x} floor={FL} s={1.1} facing={-1} faceTurn={lw.moving || hs > 0 || whisper > 0 ? 0.6 : 0.3} look={[0.6, 0]} expr={r > 96 && r < 140 ? 'sleepy' : 'normal'} mouth={hs > 0 ? 'smile' : undefined} pose={lp} vx={lw.vx} bob={lw.bob} armOver={env(r, 290, 350, 8, 8) > 0.5} uid="l13" />
					<HeroBadge x={lH[0]} y={lH[1] - 105 * sL} s={0.75} />
					<g opacity={env(r, 146, 200, 4, 8)}><Bubble x={gH[0] - 330} y={gH[1] - 150} w={300} h={160} t={r - 146} tail={[230, 120]} thought>
						<path d="M0,-50 l24,60 h-48 z" fill="#d23b3b" />
						<rect x={-14} y={10} width={28} height={36} fill="#9aa3b5" />
						<text y={66} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="#1b1e2a">
							ДЯДЯ-КОСМОНАВТ
						</text>
					</Bubble></g>
					<g opacity={env(r, 200, 274, 4, 8)}><Bubble x={gH[0] - 120} y={gH[1] - 200} w={300} h={130} t={r - 200} tail={[0, 110]} thought>
						<text y={10} textAnchor="middle" fontSize={44} fontFamily={FONT} fill="#1b1e2a">
							40×
						</text>
						<text y={46} textAnchor="middle" fontSize={20} fontFamily={FONT} fill="#555">
							ПОДТЯГИВАНИЙ
						</text>
					</Bubble></g>
					<g opacity={env(r, 274, 440, 4, 10)}><Bubble x={gH[0] + 380} y={gH[1] - 150} w={320} h={160} t={r - 274} tail={[-230, 140]} thought>
						<rect x={-12} y={-50} width={24} height={50} rx={12} fill="#2b2f3a" />
						<rect x={-4} y={0} width={8} height={30} fill="#2b2f3a" />
						<text y={66} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="#1b1e2a">
							🤫 ЗНАКОМ С РЭПЕРОМ
						</text>
					</Bubble></g>
				</Svg>
			</Layer>
		</Stage>
	);
};

/* ------------------------------ corridor two-shot ----------------------------- */
const LX = 770;
const FLc = 900;
const TwoShot: React.FC<{children?: React.ReactNode; gx?: number; gPose?: Pose; lPose?: Pose; gExpr?: any; lExpr?: any; gMouth?: any; gLook?: [number, number]; lLook?: [number, number]; gHand?: any; lHand?: any; gOver?: boolean; lOver?: boolean; gvx?: number; gbob?: number}> = ({
	children,
	gx = 1150,
	gPose,
	lPose,
	gExpr = 'normal',
	lExpr = 'normal',
	gMouth,
	gLook = [-0.8, 0],
	lLook = [0.8, 0],
	gHand,
	lHand,
	gOver,
	lOver,
	gvx = 0,
	gbob = 0,
}) => {
	const {f, gf} = useShot();
	const sp = useSpeaking(gf);
	const mid = (LX + gx) / 2;
	const wide = camOn(mid, 560, 1.05);
	const target = sp === 'GOSHA' ? camOn(gx - 20, 560, 1.75, {farBlur: 6}) : sp === 'LEVA' ? camOn(LX + 30, 560, 1.75, {farBlur: 6}) : wide;
	const sL = heroScale(gf, 1.05);
	const lH = headOf(LX, FLc, sL);
	return (
		<Stage cam={{...target, x: target.x + Math.sin(f / 50) * 10}} bg="#f1e6c8" light={{x: 20, y: 10, o: 0.42}}>
			<Layer depth={1.6}>
				<Corridor f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="leva" x={LX} floor={FLc} s={1.05} faceTurn={0.6} look={lLook} expr={lExpr} pose={lPose} handF={lHand} armOver={lOver} uid="l2s" />
					<Actor who="gosha" x={gx} floor={FLc} s={1.0} facing={-1} faceTurn={0.6} look={gLook} expr={gExpr} pose={gPose} mouth={gMouth} handF={gHand} armOver={gOver} vx={gvx} bob={gbob} uid="g2s" />
					<HeroBadge x={LX} y={lH[1] - 110 * sL} s={0.75} />
					{children}
				</Svg>
			</Layer>
		</Stage>
	);
};

/* «Я старею, когда вру» — «Я тоже. Морально.» — Гоша trogает щетину — «Проверим.» */
export const S15: React.FC = () => {
	const {f, gf, at} = useShot();
	const r25 = f - at('025');
	// Гоша steps in to touch the stubble, then steps back
	const inW = walkTo(r25, 6, 34, 1150, 905, 7, 0.3);
	const outW = walkTo(r25, 132, 160, 905, 1150, 7, 0.3);
	const back = r25 >= 132;
	const gx = back ? outW.x : inW.x;
	const w = back ? outW : inW;
	let gp: Pose = w.pose;
	let lp: Pose = idle(gf, 1);
	// Лёва rubs his chin while confessing, then offers it
	lp = gesture('rubChin', lp, env(f, at('023'), at('023') + 80, 8, 10), f);
	const offer = env(r25, 0, 140, 12, 12);
	lp = {...lp, head: lp.head - 16 * offer, lean: lp.lean + 6 * offer};
	// «Морально» — a shrug
	gp = gesture('shrug', gp, env(f, at('024') + 20, at('024') + 60, 6, 8), f);
	// finger on the stubble
	const sL = heroScale(gf, 1.05);
	const lH = headOf(LX, FLc, sL);
	const chin: [number, number] = [LX + 22 * sL, lH[1] + 42 * sL];
	const touch = env(r25, 36, 128, 10, 10);
	gp = reach({...gp, lean: gp.lean + 8 * touch}, 'F', toLocal(chin[0] + Math.sin(r25 / 4) * 4 * touch, chin[1], gx, FLc - 157, 1, -1), touch);
	// «Проверим.» — rubs hands, serious
	const plan = env(f, at('026') - 4, at('026') + 40, 6, 10);
	gp = reach(reach(gp, 'F', [22, -70 + Math.sin(f / 2) * 6], plan), 'B', [26, -72 - Math.sin(f / 2) * 6], plan);
	return (
		<TwoShot
			gx={gx}
			gPose={gp}
			lPose={lp}
			lOver={env(f, at('023'), at('023') + 80, 8, 10) > 0.5}
			gHand={touch > 0.5 ? 'point' : undefined}
			gExpr={r25 > 60 ? 'worried' : 'normal'}
			gMouth={f < at('025') ? 'smirk' : 'flat'}
			gLook={touch > 0 ? [-0.6, -0.3] : [-0.8, 0]}
			lLook={touch > 0 ? [0.4, -0.6] : [0.8, 0]}
			lExpr={offer > 0.5 ? 'worried' : 'normal'}
			gvx={w.vx}
			gbob={w.bob}
		/>
	);
};

/* test one: «я вчера видел НЛО» — «Врёшь.» */
export const S16: React.FC = () => {
	const {f, gf, at} = useShot();
	let lp: Pose = idle(gf, 1);
	let gp: Pose = idle(gf, 4);
	// Лёва points at the sky with big eyes
	const ufo = env(f, at('028') + 4, at('028') + 90, 8, 10);
	lp = {...lp, head: lp.head - 14 * ufo, armF: [interpolate(ufo, [0, 1], [lp.armF[0], 160]), interpolate(ufo, [0, 1], [lp.armF[1], 4])]};
	// Гоша crosses his arms, unimpressed
	gp = gesture('armsCrossed', gp, env(f, at('028') + 30, at('030') + 60, 10, 10), f);
	gp = {...gp, head: gp.head + 6 * env(f, at('029'), at('029') + 30, 4, 8)};
	return (
		<TwoShot lPose={lp} gPose={gp} lHand={ufo > 0.5 ? 'point' : undefined} lExpr={ufo > 0.3 ? 'wide' : 'normal'} lLook={ufo > 0.5 ? [0.2, -1] : [0.8, 0]} gExpr="sleepy" gMouth="flat">
			<Bubble x={LX - 290} y={430} w={260} h={170} t={f - at('028') - 10} tail={[150, 60]}>
				<ellipse cx={0} cy={-6} rx={80} ry={22} fill="#9aa3b5" />
				<ellipse cx={0} cy={-24} rx={36} ry={22} fill="#bfe6ff" />
				<path d="M-40,14 l-20,50 M40,14 l20,50" stroke="#ffd34a" strokeWidth={6} opacity={0.7} />
				<text y={74} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="#1b1e2a">
					НЛО
				</text>
			</Bubble>
			<Pop t={f - at('030') - 8} x={960} y={300}>
				<rect x={-150} y={-30} width={300} height={60} rx={30} fill="#1f8a4a" />
				<text y={12} textAnchor="middle" fontSize={28} fontFamily={FONT} fill="#fff">
					НЕ ПОВЕРИЛ · +0
				</text>
			</Pop>
		</TwoShot>
	);
};

/* test two: «у тебя шнурок развязался» — Гоша looks down — «О. У тебя морщина.» */
export const S17: React.FC = () => {
	const {f, gf, at} = useShot();
	let lp: Pose = idle(gf, 1);
	let gp: Pose = idle(gf, 4);
	const pointDown = env(f, at('031') + 10, at('031') + 70, 8, 10);
	lp = {...lp, armF: [interpolate(pointDown, [0, 1], [lp.armF[0], 40]), interpolate(pointDown, [0, 1], [lp.armF[1], 2])]};
	const look = env(f, at('031') + 50, at('033') - 6, 10, 8);
	gp = blend(gp, {...gp, lean: 28, head: 30, armF: [40, 30], armB: [30, 30]}, look);
	const oh = env(f, at('033') - 4, at('033') + 140, 6, 10);
	gp = gesture('point', gp, oh, f);
	lp = reach(lp, 'F', [16, -186], env(f, at('033') + 20, at('033') + 140, 8, 10));
	return (
		<TwoShot
			lPose={lp}
			gPose={gp}
			lHand={pointDown > 0.5 ? 'point' : undefined}
			gHand={oh > 0.5 ? 'point' : undefined}
			lOver={env(f, at('033') + 20, at('033') + 140, 8, 10) > 0.5}
			gLook={look > 0.3 ? [0, 1] : [-0.8, 0]}
			gExpr={oh > 0.2 ? 'wide' : 'normal'}
			lExpr={oh > 0.2 ? 'wide' : 'normal'}
		>
			<Pop t={f - at('032') - 22} x={LX - 260} y={420}>
				<rect x={-130} y={-30} width={260} height={60} rx={30} fill="#d23b3b" />
				<text y={12} textAnchor="middle" fontSize={28} fontFamily={FONT} fill="#fff">
					ПОВЕРИЛ · +1
				</text>
			</Pop>
		</TwoShot>
	);
};
