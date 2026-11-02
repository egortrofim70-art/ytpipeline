import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type Expression = 'neutral' | 'happy' | 'scared' | 'shocked' | 'tired' | 'smug' | 'angry';

export type CharacterProps = {
	x?: number;
	y?: number;
	scale?: number;
	expression?: Expression;
	walking?: boolean;
	running?: boolean;
	lying?: boolean; // rotates the WHOLE rig 90° as one rigid unit (bed pose)
	bobbing?: boolean;
	armRaise?: number; // 0..1, raises right arm (e.g. pointing/waving)
	faceTilt?: number; // degrees, subtle head-only tilt (curious look)
	shirtColor?: string;
	pantsColor?: string;
	headColor?: string;
	glow?: boolean; // soft colored rim halo to pop off a dark background
};

// True stickman proportions (reference: big round head, thin uniform-width
// line limbs, no hands/shoes blobs, simple colored shirt shape, almost no
// neck overlap).
const HEAD_R = 58;
const NECK_OVERLAP = 4;
const SHOULDER_W = 54; // shirt width at top, narrower than head diameter
const WAIST_W = 42;
const SHIRT_H = 70;
const LIMB_STROKE = 9; // thin stick line thickness
const ARM_LEN = 78;
const LEG_LEN = 108;

const EXPRESSIONS: Record<
	Expression,
	{browAngle: number; browY: number; mouth: string; eyeScale: number}
> = {
	neutral: {browAngle: 0, browY: -100, mouth: 'M -13 17 Q 0 20 13 17', eyeScale: 1},
	happy: {browAngle: 0, browY: -100, mouth: 'M -14 11 Q 0 28 14 11', eyeScale: 1},
	scared: {browAngle: 16, browY: -6, mouth: 'M -10 21 Q 0 15 10 21', eyeScale: 1.2},
	shocked: {
		browAngle: 20,
		browY: -9,
		mouth: 'M -7 15 Q 0 32 7 15 Q 0 36 -7 15 Z',
		eyeScale: 1.35,
	},
	tired: {browAngle: -2, browY: 7, mouth: 'M -12 18 Q 0 15 12 18', eyeScale: 0.5},
	smug: {browAngle: -12, browY: -3, mouth: 'M -13 14 Q -2 19 15 8', eyeScale: 0.8},
	angry: {browAngle: -18, browY: -2, mouth: 'M -12 22 Q 0 17 12 22', eyeScale: 0.9},
};

// `browY: -100` is a sentinel meaning "no eyebrows" (neutral/happy in the
// reference channel often show no brows at all, just eyes + mouth).

let gradientIdCounter = 0;

export const Character: React.FC<CharacterProps> = ({
	x = 0,
	y = 0,
	scale = 1,
	expression = 'neutral',
	walking = false,
	running = false,
	lying = false,
	bobbing = true,
	armRaise = 0,
	faceTilt = 0,
	shirtColor = '#FFD400',
	pantsColor = '#111111',
	headColor = '#0A0A0A',
	glow = true,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const gradId = React.useRef(`charHeadGrad${gradientIdCounter++}`).current;
	const glowId = React.useRef(`charGlow${gradientIdCounter++}`).current;

	const expr = EXPRESSIONS[expression];
	const showBrows = expr.browY > -50;

	const bob = bobbing && !lying ? Math.sin((frame / fps) * Math.PI * 2 * 0.9) * 3 : 0;

	const isMoving = (walking || running) && !lying;
	const speedMul = running ? 3.4 : 2.2;
	const legAmp = running ? 42 : 22;
	const armAmp = running ? 55 : 18;
	const walkPhase = (frame / fps) * Math.PI * 2 * speedMul;
	const legSwing = isMoving ? Math.sin(walkPhase) * legAmp : lying ? -6 : 0;
	const legSwing2 = isMoving ? Math.sin(walkPhase + Math.PI) * legAmp : lying ? 6 : 0;
	const armSwing = isMoving ? Math.sin(walkPhase + Math.PI) * armAmp : lying ? -4 : 0;
	const armSwing2 = isMoving ? Math.sin(walkPhase) * armAmp : lying ? 4 : 0;
	const walkBob = isMoving ? Math.abs(Math.sin(walkPhase)) * (running ? 10 : 5) : 0;
	const lean = running ? 12 : 0;
	const wholeBodyRotation = lean + (lying ? -90 : 0);

	const raiseAnim = spring({
		frame,
		fps,
		config: {damping: 14, stiffness: 120},
		durationInFrames: 12,
	});

	const totalY = y + bob - walkBob;
	// When lying, the rig rotates -90° around the shirt's mid-point; shift the
	// whole svg left so the character (head now pointing left) still sits with
	// its torso roughly where x/y was aimed, instead of swinging off-screen.
	const totalX = x - (lying ? SHIRT_H / 2 + HEAD_R * 0.3 : 0);

	const shirtPath = `
		M ${-SHOULDER_W / 2} 0
		L ${-WAIST_W / 2} ${SHIRT_H}
		L ${WAIST_W / 2} ${SHIRT_H}
		L ${SHOULDER_W / 2} 0
		Q 0 ${12} ${-SHOULDER_W / 2} 0
		Z
	`;

	const headCenterY = -(SHIRT_H - NECK_OVERLAP + HEAD_R);

	const Silhouette = ({forGlow}: {forGlow?: boolean}) => (
		<>
			<g transform={`translate(-12 ${SHIRT_H / 2}) rotate(${legSwing})`}>
				<line x1={0} y1={0} x2={0} y2={LEG_LEN} stroke={forGlow ? shirtColor : pantsColor} strokeWidth={LIMB_STROKE} strokeLinecap="round" />
			</g>
			<g transform={`translate(${-SHOULDER_W / 2 + 3} 8) rotate(${armSwing})`}>
				<line x1={0} y1={0} x2={0} y2={ARM_LEN} stroke={shirtColor} strokeWidth={LIMB_STROKE} strokeLinecap="round" />
			</g>
			<g transform={`translate(12 ${SHIRT_H / 2}) rotate(${legSwing2})`}>
				<line x1={0} y1={0} x2={0} y2={LEG_LEN} stroke={forGlow ? shirtColor : pantsColor} strokeWidth={LIMB_STROKE} strokeLinecap="round" />
			</g>
			<path d={shirtPath} fill={shirtColor} />
			<g
				transform={`translate(${SHOULDER_W / 2 - 3} 8) rotate(${
					-armSwing2 - armRaise * 120 * raiseAnim
				})`}
			>
				<line x1={0} y1={0} x2={0} y2={ARM_LEN} stroke={shirtColor} strokeWidth={LIMB_STROKE} strokeLinecap="round" />
			</g>
			<g transform={`translate(0 ${headCenterY + SHIRT_H / 2}) rotate(${faceTilt})`}>
				<circle cx={0} cy={0} r={HEAD_R} fill={forGlow ? shirtColor : `url(#${gradId})`} />
			</g>
		</>
	);

	return (
		<svg
			width={360}
			height={360}
			viewBox="-180 -180 360 360"
			style={{
				position: 'absolute',
				left: totalX - 180,
				top: totalY - 180,
				transform: `scale(${scale})`,
				overflow: 'visible',
			}}
		>
			<defs>
				<radialGradient id={gradId} cx="38%" cy="32%" r="75%">
					<stop offset="0%" stopColor="#3a3a3a" />
					<stop offset="45%" stopColor="#151515" />
					<stop offset="100%" stopColor={headColor} />
				</radialGradient>
				<filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
					<feGaussianBlur stdDeviation="10" />
				</filter>
			</defs>

			<g transform={`translate(0 ${SHIRT_H / 2}) rotate(${wholeBodyRotation})`}>
				{/* soft colored halo behind the character so it reads against a dark bg */}
				{glow && (
					<g opacity={0.45} filter={`url(#${glowId})`}>
						<Silhouette forGlow />
					</g>
				)}

				{/* grounding shadow (skip while lying flat) */}
				{!lying && (
					<ellipse
						cx={0}
						cy={SHIRT_H + LEG_LEN + 6}
						rx={60}
						ry={14}
						fill="rgba(0,0,0,0.35)"
						filter={`url(#${glowId})`}
					/>
				)}

				<Silhouette />

				{/* face (kept separate so eyes/brows/mouth sit above the glow + gradient head) */}
				<g transform={`translate(0 ${headCenterY + SHIRT_H / 2}) rotate(${faceTilt})`}>
					{showBrows && (
						<>
							<g transform={`translate(${-HEAD_R * 0.33} ${-HEAD_R * 0.18 + expr.browY}) rotate(${-expr.browAngle})`}>
								<rect x={-12} y={-3} width={24} height={5} rx={2.5} fill="#ffffff" />
							</g>
							<g transform={`translate(${HEAD_R * 0.33} ${-HEAD_R * 0.18 + expr.browY}) rotate(${expr.browAngle})`}>
								<rect x={-12} y={-3} width={24} height={5} rx={2.5} fill="#ffffff" />
							</g>
						</>
					)}

					<ellipse cx={-HEAD_R * 0.32} cy={0} rx={7.5 * expr.eyeScale} ry={9 * expr.eyeScale} fill="#ffffff" />
					<ellipse cx={HEAD_R * 0.32} cy={0} rx={7.5 * expr.eyeScale} ry={9 * expr.eyeScale} fill="#ffffff" />

					<path d={expr.mouth} transform="translate(0 15)" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" fill="none" />
				</g>
			</g>
		</svg>
	);
};
