import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type Expression = 'neutral' | 'happy' | 'scared' | 'shocked' | 'tired' | 'smug' | 'angry';

export type CharacterProps = {
	x?: number;
	y?: number;
	scale?: number;
	expression?: Expression;
	walking?: boolean;
	running?: boolean;
	lying?: boolean;
	bobbing?: boolean;
	armRaise?: number; // 0..1, raises right arm (e.g. pointing/waving)
	faceTilt?: number; // degrees, subtle head-only tilt (curious look)
	shirtColor?: string;
	pantsColor?: string;
	headColor?: string;
	glow?: boolean; // soft colored rim halo to pop off a dark background
	transitionInFrames?: number; // how long it takes to settle into `expression` on mount
	stillness?: boolean; // freeze idle bob/sway for a tense, held reaction pose (no "shivering" at tight zooms)
	toss?: boolean; // slow side-to-side rock, for "tossing and turning, can't sleep"
	prop?: 'phone' | null; // small held prop attached to the raised front hand
};

const HEAD_R = 58;
const NECK_H = 9;
const NECK_W = HEAD_R * 0.4;
const SHOULDER_W = 54;
const WAIST_W = 42;
const SHIRT_H = 70;
const LIMB_STROKE = 9;
const ARM_LEN = 78;
const LEG_LEN = 108;

// Mouth is built from 4 numbers so it can be smoothly interpolated between
// any two expressions instead of snapping between hand-drawn path strings:
// width = half-width, curve = up(+)/down(-) bend of the lip line,
// open = vertical gap between the top and bottom lip (0 = thin closed line).
type FaceParams = {
	browAngle: number;
	browY: number; // -100 sentinel = no eyebrows drawn
	eyeScale: number;
	mouthWidth: number;
	mouthCurve: number;
	mouthOpen: number;
};

const FACE: Record<Expression, FaceParams> = {
	neutral: {browAngle: 0, browY: -100, eyeScale: 1, mouthWidth: 13, mouthCurve: 3, mouthOpen: 4},
	happy: {browAngle: 0, browY: -100, eyeScale: 1, mouthWidth: 15, mouthCurve: 17, mouthOpen: 4},
	scared: {browAngle: 16, browY: -6, eyeScale: 1.2, mouthWidth: 10, mouthCurve: -6, mouthOpen: 5},
	shocked: {browAngle: 20, browY: -9, eyeScale: 1.35, mouthWidth: 8, mouthCurve: 0, mouthOpen: 22},
	tired: {browAngle: -2, browY: 7, eyeScale: 0.5, mouthWidth: 12, mouthCurve: -3, mouthOpen: 3},
	smug: {browAngle: -12, browY: -3, eyeScale: 0.8, mouthWidth: 15, mouthCurve: 9, mouthOpen: 4},
	angry: {browAngle: -18, browY: -2, eyeScale: 0.9, mouthWidth: 12, mouthCurve: -5, mouthOpen: 5},
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mouthPath(width: number, curve: number, open: number): string {
	const top = -open / 2 + curve;
	const bottom = open / 2 + curve;
	return `M ${-width} 0 Q 0 ${top} ${width} 0 Q 0 ${bottom} ${-width} 0 Z`;
}

let instanceCounter = 0;

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
	transitionInFrames = 14,
	stillness = false,
	toss = false,
	prop = null,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ids = React.useRef({
		grad: `charHeadGrad${instanceCounter++}`,
		glow: `charGlow${instanceCounter++}`,
		shadow: `charShadow${instanceCounter++}`,
	}).current;

	// Ease from a neutral resting face into the target expression over the
	// first `transitionInFrames` local frames, instead of snapping instantly
	// the moment a Sequence cuts to a new pose - this is what reads as
	// "animated" rather than "slideshow with a new expression pasted on".
	const target = FACE[expression];
	const settle = interpolate(frame, [0, transitionInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.16, 1, 0.3, 1),
	});
	const rest = FACE.neutral;
	const face: FaceParams = {
		browAngle: lerp(rest.browAngle, target.browAngle, settle),
		browY: lerp(rest.browY < -50 ? 10 : rest.browY, target.browY < -50 ? 10 : target.browY, settle),
		eyeScale: lerp(rest.eyeScale, target.eyeScale, settle),
		mouthWidth: lerp(rest.mouthWidth, target.mouthWidth, settle),
		mouthCurve: lerp(rest.mouthCurve, target.mouthCurve, settle),
		mouthOpen: lerp(rest.mouthOpen, target.mouthOpen, settle),
	};
	const showBrows = settle > 0.05 && (target.browY > -50 || settle < 1);

	// Blink independent of expression: a quick vertical eye-close every ~3.7s.
	// Suppressed during the expression-settle window so a scene cut doesn't
	// show two eye animations stacking (settle easing the eye size +
	// a blink) at once, which read as a glitch rather than two separate beats.
	const blinkPeriod = 110;
	const blinkPhase = frame % blinkPeriod;
	const blinkT = frame > transitionInFrames + 4 && blinkPhase < 6 ? Math.sin((blinkPhase / 6) * Math.PI) : 0;
	const blinkScale = 1 - blinkT * 0.9;

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
	const tossAngle = toss ? Math.sin((frame / fps) * Math.PI * 2 * 0.3) * 7 : 0;
	const wholeBodyRotation = lean + tossAngle + (lying ? -90 : 0);

	const raiseAnim = spring({
		frame,
		fps,
		config: {damping: 14, stiffness: 120},
		durationInFrames: 12,
	});
	const frontArmAngle = -armSwing2 - armRaise * 120 * raiseAnim;

	// Idle motion: a slow weight-settle breathing cycle (not a pure levitating
	// sine) - rises slowly, settles back down with a touch of ease, and the
	// contact shadow shrinks/grows inversely so the character reads as
	// grounded instead of floating in place.
	const idleCycle = (frame / fps) * (Math.PI * 2) * 0.55;
	const idleActive = bobbing && !lying && !isMoving && !stillness && !toss;
	const bob = idleActive ? (Math.sin(idleCycle) * 0.5 + Math.sin(idleCycle * 2) * 0.15) * 2.5 : 0;
	const sway = idleActive ? Math.sin(idleCycle * 0.5) * 1.5 : 0;

	const totalY = y + bob - walkBob;
	const totalX = x - (lying ? SHIRT_H / 2 + HEAD_R * 0.3 : 0) + sway;
	const groundRise = Math.max(0, bob); // >0 while character is "up" in its idle cycle
	const shadowScale = 1 - groundRise * 0.025;

	const shirtPath = `
		M ${-SHOULDER_W / 2} 0
		L ${-WAIST_W / 2} ${SHIRT_H}
		L ${WAIST_W / 2} ${SHIRT_H}
		L ${SHOULDER_W / 2} 0
		Q 0 ${12} ${-SHOULDER_W / 2} 0
		Z
	`;

	// Simple straight column, NOT tapered - a trapezoid that flares wider
	// toward the shoulders read as an upside-down funnel sitting on the
	// collar (reported by the user). A plain rect reads as a neck.
	const neckPath = `
		M ${-NECK_W / 2} ${-NECK_H - 4}
		L ${-NECK_W / 2} 4
		L ${NECK_W / 2} 4
		L ${NECK_W / 2} ${-NECK_H - 4}
		Z
	`;

	// Head sits directly on top of the neck, which sits on top of the shirt
	// (shirt top = local y 0, neck spans -NECK_H..0): headCenterY is expressed
	// relative to the outer group's own translate(SHIRT_H/2), so we subtract
	// that back out to land the head's bottom edge exactly on the neck's top.
	const headCenterY = -(NECK_H + HEAD_R) - SHIRT_H / 2;
	const mouth = mouthPath(face.mouthWidth, face.mouthCurve, Math.max(face.mouthOpen, 2.5));

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
			{/* neck drawn BEFORE the shirt so the collar tucks over its base
			    instead of the neck sitting on top of the sweater */}
			<path d={neckPath} fill={forGlow ? shirtColor : headColor} opacity={forGlow ? 1 : 0.92} />
			<path d={shirtPath} fill={shirtColor} />
			<g transform={`translate(${SHOULDER_W / 2 - 3} 8) rotate(${frontArmAngle})`}>
				<line x1={0} y1={0} x2={0} y2={ARM_LEN} stroke={shirtColor} strokeWidth={LIMB_STROKE} strokeLinecap="round" />
				{prop === 'phone' && !forGlow && (
					// counter-rotate by -frontArmAngle so the phone stays visually
					// upright no matter how the arm is angled, like something
					// actually held in a hand rather than welded to the forearm
					<g transform={`translate(0 ${ARM_LEN + 6}) rotate(${-frontArmAngle})`}>
						<rect x={-9} y={-17} width={18} height={30} rx={2} fill="#9fd4ff" opacity={0.55} filter={`url(#${ids.glow})`} />
						<rect x={-13} y={-22} width={26} height={44} rx={5} fill="#0d1a33" stroke="#4a90ff" strokeWidth={2} />
						<rect x={-9} y={-17} width={18} height={30} rx={2} fill="#9fd4ff" opacity={0.9} />
					</g>
				)}
			</g>
			<g transform={`translate(0 ${headCenterY + SHIRT_H / 2}) rotate(${faceTilt})`}>
				<circle cx={0} cy={0} r={HEAD_R} fill={forGlow ? shirtColor : `url(#${ids.grad})`} />
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
				<radialGradient id={ids.grad} cx="38%" cy="32%" r="75%">
					<stop offset="0%" stopColor="#3a3a3a" />
					<stop offset="45%" stopColor="#151515" />
					<stop offset="100%" stopColor={headColor} />
				</radialGradient>
				<filter id={ids.glow} x="-60%" y="-60%" width="220%" height="220%">
					<feGaussianBlur stdDeviation="10" />
				</filter>
				<filter id={ids.shadow} x="-60%" y="-60%" width="220%" height="220%">
					<feGaussianBlur stdDeviation="3" />
				</filter>
			</defs>

			<g transform={`translate(0 ${SHIRT_H / 2}) rotate(${wholeBodyRotation})`}>
				{glow && (
					<g opacity={0.45} filter={`url(#${ids.glow})`}>
						<Silhouette forGlow />
					</g>
				)}

				{!lying && (
					<ellipse
						cx={0}
						cy={SHIRT_H + LEG_LEN + 6}
						rx={58 * shadowScale}
						ry={11 * shadowScale}
						fill="rgba(0,0,0,0.6)"
						filter={`url(#${ids.shadow})`}
					/>
				)}

				<Silhouette />

				<g transform={`translate(0 ${headCenterY + SHIRT_H / 2}) rotate(${faceTilt})`}>
					{showBrows && (
						<>
							<g transform={`translate(${-HEAD_R * 0.33} ${-HEAD_R * 0.18 + face.browY}) rotate(${-face.browAngle})`}>
								<rect x={-12} y={-3} width={24} height={5} rx={2.5} fill="#ffffff" />
							</g>
							<g transform={`translate(${HEAD_R * 0.33} ${-HEAD_R * 0.18 + face.browY}) rotate(${face.browAngle})`}>
								<rect x={-12} y={-3} width={24} height={5} rx={2.5} fill="#ffffff" />
							</g>
						</>
					)}

					<g transform={`translate(${-HEAD_R * 0.32} 0) scale(1 ${blinkScale})`}>
						<ellipse cx={0} cy={0} rx={7.5 * face.eyeScale} ry={9 * face.eyeScale} fill="#ffffff" />
					</g>
					<g transform={`translate(${HEAD_R * 0.32} 0) scale(1 ${blinkScale})`}>
						<ellipse cx={0} cy={0} rx={7.5 * face.eyeScale} ry={9 * face.eyeScale} fill="#ffffff" />
					</g>

					<path d={mouth} transform="translate(0 15)" fill="#ffffff" />
				</g>
			</g>
		</svg>
	);
};
