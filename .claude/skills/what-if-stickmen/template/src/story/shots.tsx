import React from 'react';
import {toLocal} from '../engine/Stickman';
import {Pose} from '../engine/Stickman';
import {env, gesture, handshake, idle, reach, walkTo} from '../kit/actions';
import {Actor, counterAt, useShot, useSpeaking} from '../kit/core';
import type {ShotDef} from '../kit/coverage';
import {HeroBadge, Layer, Rays, Stage, Svg, camOn, mixCam, usePush} from '../kit/kit';
import {Corridor} from '../kit/sets';
import {Callout} from '../kit/graphics';

/* DEMO STORY (replace for every video). Shows the house rules in miniature:
   entrances from the frame edges, a gesture on the word, the counter tied to the line,
   a high-five via arm IK, a callout, camera that never stops. */

const FL = 900; // floor line of the corridor

/* 001 N: «Что если бы над твоей головой висел шагомер?» — the hero walks in from the left */
const S1: React.FC = () => {
	const {f, gf} = useShot();
	const w = walkTo(f, 4, 70, -200, 760, 1, 0.32);
	const cam = usePush(camOn(760, 560, 1.15), camOn(760, 520, 1.35));
	// looks up at the counter as soon as he stops
	const up = env(f, 72, 999, 10, 1);
	const pose: Pose = {...w.pose, head: w.pose.head - 14 * up};
	return (
		<Stage cam={cam} bg="#f1e6c8" light={{x: 20, y: 10, o: 0.42}}>
			<Layer depth={1.6}>
				<Corridor f={gf} />
			</Layer>
			<Layer depth={1.2}>
				<Rays x={1500} y={-40} w={300} angle={24} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="hero" x={w.x} floor={FL} s={1.05} facing={1} faceTurn={w.moving ? 0.6 : 0.3} look={up > 0.5 ? [0, -1] : [0.6, 0]} expr={up > 0.5 ? 'wide' : 'normal'} pose={pose} vx={w.vx} bob={w.bob} uid="h1" />
					<HeroBadge x={w.x} y={FL - 157 * 1.05 - 164 * 1.05 - 115} s={0.8} />
				</Svg>
			</Layer>
		</Stage>
	);
};

/* 002 FRIEND: «Ого, у тебя девять тысяч девятьсот девяносто девять шагов!»
   003 HERO: «Сейчас будет десять тысяч. Смотри.» — one step, the counter clicks, high-five */
const S2: React.FC = () => {
	const {f, gf, at} = useShot();
	const sp = useSpeaking(gf);
	const HX = 760;
	const fw = walkTo(f, -6, 40, 2150, 1150, 4, 0.34);
	const step = walkTo(f, at('003') + 20, at('003') + 40, HX, HX + 60, 1, 0.3);
	const hx = f < at('003') + 20 ? HX : step.x;
	let hp: Pose = f < at('003') + 20 ? idle(gf, 1) : step.pose;
	let fp: Pose = fw.pose;
	// the friend points at the badge on «Ого»
	fp = gesture('point', {...fp, head: fp.head - 10}, env(f, at('002'), at('002') + 70, 6, 10), f);
	// high-five after the click
	const five = env(f, at('003') + 48, at('003') + 75, 6, 8);
	if (five > 0) {
		const r = handshake(hp, fp, five, f, {x: hx, y: FL - 157 * 1.05, s: 1.05, facing: 1}, {x: fw.x, y: FL - 157, s: 1, facing: -1});
		hp = r.a;
		fp = r.b;
	}
	hp = gesture('touchFace', hp, env(f, at('003') - 4, at('003') + 18, 6, 6), f);
	const wide = camOn(960, 560, 1.05);
	const cam = sp === 'FRIEND' ? camOn(fw.x - 40, 540, 1.6, {farBlur: 6}) : sp === 'HERO' ? camOn(hx + 40, 540, 1.6, {farBlur: 6}) : wide;
	const v = counterAt(gf);
	return (
		<Stage cam={mixCam(cam, cam, 0)} bg="#f1e6c8" light={{x: 20, y: 10, o: 0.42}}>
			<Layer depth={1.6}>
				<Corridor f={gf} />
			</Layer>
			<Layer depth={1}>
				<Svg>
					<Actor who="hero" x={hx} floor={FL} s={1.05} faceTurn={0.6} look={[0.8, 0]} pose={hp} expr={v >= 10000 ? 'wide' : 'normal'} mouth={five > 0 ? 'smile' : undefined} armOver={env(f, at('003') - 4, at('003') + 18, 6, 6) > 0.5} vx={step.vx} bob={step.bob} uid="h2" />
					<Actor who="friend" x={fw.x} floor={FL} s={1} facing={-1} faceTurn={0.6} look={[-0.8, -0.2]} expr="wide" pose={fp} handF={env(f, at('002'), at('002') + 70, 6, 10) > 0.5 ? 'point' : undefined} vx={fw.vx} bob={fw.bob} uid="f2" />
					<HeroBadge x={hx} y={FL - 157 * 1.05 - 164 * 1.05 - 115} s={0.8} />
					<Callout f={f} t0={at('002') + 30} t1={at('002') + 90} from={[hx + 90, FL - 157 * 1.05 - 164 * 1.05 - 115]} to={[hx + 300, 180]} text="9 999" />
				</Svg>
			</Layer>
		</Stage>
	);
};

export const SHOTS: ShotDef[] = [
	{at: '001', C: S1},
	{at: '002', C: S2},
];
