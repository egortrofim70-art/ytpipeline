import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import TL from './timeline.json';
import {AngleCtx, L as EL, Line, ShotCtx, SpeakOverride, TalkOverride} from '../lie/core';
import {Stickman} from '../Stickman';
import {CAST, idle} from '../lie/cast';
import {SHOT_TIMES} from '../lie/Episode';
import {AgeBadge, FONT} from '../lie/ui';
import {clamp, ease} from '../lie/kit';
import {Grain, Vignette} from '../camera';

// The vertical short re-cuts the episode: every voice line of the short is laid over
// a stretch of an episode shot (played 1:1, so badge clicks and actions stay in sync),
// cropped to 9:16. Lines without a fitting episode moment get a native vertical card.

const LINES = TL.lines as Line[];
export const SHORT_FRAMES = TL.total as number;
const SL = (id: string) => LINES.find((l) => l.id.startsWith(id))!;

const W = 1080;
const H = 1920;
const BASE = H / 1080; // 16:9 frame scaled to fill the height

type Crop = {cx?: number; cy?: number; z?: number};
// at: the segment starts this many frames into its line (a cut inside one line); then the
// episode frame at the segment start is EL(ep).from + off exactly
type Seg = {line: string; at?: number; ep?: string; off?: number; cont?: boolean; hold?: boolean; a?: Crop; b?: Crop; C?: React.FC<{f: number; dur: number}>};

/* ------------------------------- native cards ------------------------------- */

const Board: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = 'radial-gradient(ellipse at 50% 40%, #2f4a3d 0%, #1b2b24 70%, #101a15 100%)'}) => (
	<AbsoluteFill style={{background: bg}}>
		<svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
			{children}
		</svg>
		<Vignette strength={0.5} color="6,10,8" />
		<Grain opacity={0.1} />
	</AbsoluteFill>
);
const HAND = "'Caveat', cursive";

const RuleCardV: React.FC<{f: number; dur: number}> = ({f}) => {
	const {fps} = useVideoConfig();
	const k = spring({frame: f, fps, config: {damping: 12, stiffness: 140}});
	const people = 14;
	return (
		<Board>
			<rect x={50} y={250} width={980} height={1420} rx={18} fill="none" stroke="#6b4a2a" strokeWidth={26} />
			<g transform={`translate(540,${470 - (1 - k) * 60}) scale(${0.85 + 0.15 * k})`} opacity={k}>
				<text textAnchor="middle" fontSize={84} fontFamily={HAND} fontWeight={700} fill="#f6e7a1">
					ПРАВИЛО
				</text>
			</g>
			{Array.from({length: people}).map((_, i) => {
				const on = interpolate(f, [12 + i * 3, 18 + i * 3], [0, 1], clamp);
				return (
					<g key={i} transform={`translate(${190 + (i % 5) * 175},${700 + Math.floor(i / 5) * 175}) scale(${on})`}>
						<circle r={52} fill="#000" stroke="#ffe0c8" strokeWidth={4} />
						<text y={-66} textAnchor="middle" fontSize={34} fontFamily={FONT} fill="#ff6a5a">
							+1
						</text>
					</g>
				);
			})}
			<g opacity={interpolate(f, [20, 32], [0, 1], clamp)}>
				<text x={540} y={1330} textAnchor="middle" fontSize={64} fontFamily={HAND} fontWeight={700} fill="#f4f1e6">
					Год — за каждого,
				</text>
				<text x={540} y={1420} textAnchor="middle" fontSize={64} fontFamily={HAND} fontWeight={700} fill="#f4f1e6">
					кто поверил
				</text>
				<text x={540} y={1530} textAnchor="middle" fontSize={78} fontFamily={HAND} fontWeight={700} fill="#ffc94a">
					ЛИЧНО ТЕБЕ
				</text>
				<line x1={300} y1={1550} x2={300 + 480 * interpolate(f, [45, 60], [0, 1], {...clamp, easing: ease})} y2={1550} stroke="#ffc94a" strokeWidth={8} strokeLinecap="round" />
			</g>
		</Board>
	);
};

/* one year instead of three hundred */
const CostCard: React.FC<{f: number; dur: number}> = ({f}) => {
	const {fps} = useVideoConfig();
	const a = spring({frame: f, fps, config: {damping: 12}});
	const strike = interpolate(f, [26, 40], [0, 1], {...clamp, easing: ease});
	const b = spring({frame: f - 40, fps, config: {damping: 9, stiffness: 160}});
	return (
		<Board bg="radial-gradient(ellipse at 50% 45%, #2a2f5e 0%, #161a38 70%, #0c0e22 100%)">
			<g transform={`translate(540,640) scale(${a})`} opacity={a}>
				<text textAnchor="middle" fontSize={56} fontFamily={FONT} fill="#9aa3d8">
					300 ЧЕЛОВЕК ПОВЕРИЛИ БЫ ТЕБЕ
				</text>
				<text y={190} textAnchor="middle" fontSize={190} fontFamily={FONT} fill="#ff6a5a">
					+300
				</text>
				<line x1={-300} y1={130} x2={-300 + 600 * strike} y2={130} stroke="#fff" strokeWidth={18} strokeLinecap="round" />
			</g>
			{f > 38 ? (
				<g transform={`translate(540,1180) scale(${b})`}>
					<text textAnchor="middle" fontSize={56} fontFamily={FONT} fill="#ffe08a">
						ПОВЕРИЛА ОДНА АНЯ
					</text>
					<AgeBadge x={0} y={150} value={35} s={2.6} />
					<text y={330} textAnchor="middle" fontSize={120} fontFamily={FONT} fill="#ffc94a">
						+1 ГОД
					</text>
				</g>
			) : null}
		</Board>
	);
};

/* top: passport 16, bottom: mirror 34 — the vertical version of the episode's split */
const SplitV: React.FC<{f: number; dur: number}> = ({f}) => {
	const {fps} = useVideoConfig();
	const a = spring({frame: f, fps, config: {damping: 15, stiffness: 150}});
	const b = spring({frame: f - 5, fps, config: {damping: 15, stiffness: 150}});
	const push = 1 + 0.04 * (f / 40);
	const half = (top: boolean, k: number, label: string, num: string, c: string, age: number, expr: 'normal' | 'worried') => (
		<g transform={`translate(${(top ? -1 : 1) * (1 - k) * 1100},0)`}>
			<polygon points={top ? '0,0 1080,0 1080,900 0,1020' : '0,1020 1080,900 1080,1920 0,1920'} fill={top ? '#1d2a4a' : '#3a1d2a'} />
			<g transform={`translate(0,${top ? 0 : 940})`}>
				<text x={540} y={150} textAnchor="middle" fontSize={64} fontFamily={FONT} fill="#fff" opacity={0.9}>
					{label}
				</text>
				<Stickman id={'sv' + label} x={330} y={640} scale={1.9} pose={idle(f, top ? 1 : 2)} {...CAST.leva} age={age} expr={expr} look={[0, 0]} faceTurn={0} />
				<text x={720} y={600} textAnchor="middle" fontSize={260} fontFamily={FONT} fill={c}>
					{num}
				</text>
			</g>
		</g>
	);
	return (
		<AbsoluteFill style={{background: '#0c0e22'}}>
			<svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{transform: `scale(${push})`, transformOrigin: '50% 50%'}}>
				{half(true, a, 'ПО ПАСПОРТУ', '16', '#9ff0b0', 0, 'normal')}
				{half(false, b, 'В ЗЕРКАЛЕ', '34', '#ffc94a', 1, 'worried')}
				<line x1={0} y1={1020} x2={1080} y2={900} stroke="#fff" strokeWidth={10} opacity={Math.min(a, b)} />
			</svg>
			<Grain opacity={0.1} />
		</AbsoluteFill>
	);
};

/* ---------------------------------- the cut --------------------------------- */

const SEGS: Seg[] = [
	{line: 's01', ep: '001', off: 120, a: {cx: 960, z: 1.0}, b: {cx: 960, cy: 480, z: 1.15}},
	{line: 's02', ep: '001', off: 14, a: {cx: 690}, b: {cx: 1050}},
	{line: 's02', at: 40, ep: '001', off: 204, a: {cx: 1000, z: 1.0}, b: {cx: 980, z: 1.08}},
	{line: 's02', at: 118, ep: '001', off: 352, a: {cx: 960, z: 1.0}, b: {cx: 960, z: 1.06}},
	{line: 's02', at: 168, C: SplitV},
	{line: 's03', ep: '010', off: 85, a: {cx: 1150}, b: {cx: 1220, cy: 520, z: 1.12}},
	{line: 's04', ep: '011', off: 0},
	{line: 's05', ep: '012', off: 0},
	{line: 's06', ep: '013', off: 0},
	{line: 's07', ep: '014', off: 0},
	{line: 's08', ep: '015', off: 0},
	{line: 's09', ep: '016', off: 0, hold: true},
	{line: 's10', ep: '035', off: 170},
	{line: 's11', ep: '036', off: 0},
	{line: 's12', ep: '037', off: 20},
	{line: 's13', C: RuleCardV},
	{line: 's14', ep: '072', off: 0},
	{line: 's15', ep: '074', off: 0},
	{line: 's16', ep: '078', off: 0},
	{line: 's17', ep: '080', off: 0, a: {z: 1}, b: {cy: 430, z: 1.35}},
	{line: 's18', ep: '083', off: 0},
	{line: 's19', ep: '084', off: 0},
	{line: 's20', ep: '085', off: 0},
	{line: 's21', ep: '087', off: 0},
	{line: 's22', ep: '089', off: 0, a: {cx: 900}},
	{line: 's23', C: CostCard},
	{line: 's24', ep: '098', off: 0},
	{line: 's25', ep: '101', off: 0, a: {cx: 820, z: 1.1}, b: {cx: 760, cy: 560, z: 1.3}},
	{line: 's26', ep: '114', off: 0, hold: true, a: {cx: 1150, z: 1.0}, b: {cx: 1060, z: 1.06}},
];

const LEAD = 6;
const TIMED = (() => {
	const out: (Seg & {start: number; end: number; ep0: number})[] = [];
	SEGS.forEach((s, i) => {
		const start = i === 0 ? 0 : s.at !== undefined ? SL(s.line).from + s.at : SL(s.line).from - LEAD;
		const prev = out[i - 1];
		const ep0 =
			s.cont && prev
				? prev.ep0 + (start - prev.start)
				: s.ep
					? s.at !== undefined
						? EL(s.ep).from + (s.off ?? 0)
						: EL(s.ep).from + (s.off ?? 0) - (i === 0 ? SL(s.line).from : LEAD)
					: 0;
		out.push({...s, start, end: 0, ep0});
	});
	out.forEach((s, i) => (s.end = i + 1 < out.length ? out[i + 1].start : SHORT_FRAMES));
	return out;
})();
export const SHORT_SEGS = TIMED;

/* short's own lip flaps, by short frame */
const talkAt = (sp: string, f: number) => {
	for (const l of LINES) {
		if (l.sp !== sp || f < l.from || f >= l.from + l.dur) continue;
		const i = f - l.from;
		return ((l.env[i] ?? 0) + (l.env[i + 1] ?? 0)) / 2;
	}
	return 0;
};

/* camera target by the short's own lines: the line owning a moment (from LEAD frames before it
   until the next one takes over); a quick narrator beat like «Щёлк» stays on the previous face */
const speakerAt = (f: number) => {
	let k = -1;
	for (let i = 0; i < LINES.length; i++) if (LINES[i].from - LEAD <= f) k = i;
	while (k > 0 && LINES[k].sp === 'N' && LINES[k].dur < 40 && LINES[k - 1].sp !== 'N') k--;
	return k >= 0 ? LINES[k].sp : null;
};

const lerpCrop = (a: Crop = {}, b: Crop = a, k: number) => {
	const m = (x?: number, y?: number, d = 0) => (x ?? d) + ((y ?? x ?? d) - (x ?? d)) * k;
	return {cx: m(a.cx, b.cx, 960), cy: m(a.cy, b.cy, 540), z: m(a.z, b.z, 1)};
};

const EpisodeCrop: React.FC<{seg: (typeof TIMED)[number]; f: number; dur: number}> = ({seg, f, dur}) => {
	const at = (g: number) => SHOT_TIMES.find((s) => g >= s.start && g < s.end) ?? SHOT_TIMES[SHOT_TIMES.length - 1];
	// hold: stay inside the shot the segment opened on (freeze its last frame)
	const gf = seg.hold ? Math.min(seg.ep0 + f, at(seg.ep0).end - 1) : seg.ep0 + f;
	const shot = at(gf);
	const ctx = {f: gf - shot.start, gf, dur: shot.end - shot.start, start: shot.start, at: (n: string) => EL(n).from - shot.start, end: (n: string) => EL(n).from + EL(n).dur - shot.start};
	const c = lerpCrop(seg.a, seg.b, interpolate(f, [0, dur], [0, 1], {...clamp, easing: ease}));
	const S = BASE * Math.max(1, c.z);
	// keep the 16:9 frame covering the whole 9:16 canvas
	const cx = Math.min(1920 - W / 2 / S, Math.max(W / 2 / S, c.cx));
	const cy = Math.min(1080 - H / 2 / S, Math.max(H / 2 / S, c.cy));
	const C = shot.C;
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
			<div style={{position: 'absolute', width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${W / 2 - cx * S}px, ${H / 2 - cy * S}px) scale(${S})`}}>
				<TalkOverride.Provider value={(sp, g) => talkAt(sp, g - seg.ep0 + seg.start)}>
					<SpeakOverride.Provider value={(g) => speakerAt(g - seg.ep0 + seg.start)}>
						<ShotCtx.Provider value={ctx}>
							{/* one slow push per segment (the 9:16 crop already sets the framing) */}
							<AngleCtx.Provider value={{k: 0, t: f, len: dur}}>
								<C />
							</AngleCtx.Provider>
						</ShotCtx.Provider>
					</SpeakOverride.Provider>
				</TalkOverride.Provider>
			</div>
		</AbsoluteFill>
	);
};

const SegHost: React.FC<{seg: (typeof TIMED)[number]}> = ({seg}) => {
	const f = useCurrentFrame();
	const dur = seg.end - seg.start;
	if (seg.C) return <seg.C f={f} dur={dur} />;
	return <EpisodeCrop seg={seg} f={f} dur={dur} />;
};

/* hook title over the opening, and the closing tease */
const Caption: React.FC<{f: number; from: number; to: number; top: number; lines: string[]; c?: string; size?: number}> = ({f, from, to, top, lines, c = '#fff', size = 84}) => {
	const {fps} = useVideoConfig();
	if (f < from || f > to) return null;
	const k = spring({frame: f - from, fps, config: {damping: 14, stiffness: 160}});
	const o = interpolate(f, [to - 10, to], [1, 0], clamp);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center', opacity: o, transform: `translateY(${(1 - k) * 40}px) scale(${0.9 + 0.1 * k})`}}>
				{lines.map((t, i) => (
					<div key={i} style={{fontFamily: FONT, fontSize: size, lineHeight: 1.12, color: i === lines.length - 1 ? c : '#fff', WebkitTextStroke: '3px #0b0d1e', paintOrder: 'stroke', textShadow: '0 8px 24px rgba(0,0,0,.6)'}}>
						{t}
					</div>
				))}
			</div>
		</AbsoluteFill>
	);
};

export const Short: React.FC<{music?: boolean}> = ({music = true}) => {
	const f = useCurrentFrame();
	const s02 = SL('s02');
	const last = SL('s26');
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{TIMED.map((s, i) => (
				<Sequence key={i} from={s.start} durationInFrames={s.end - s.start} name={s.line}>
					<SegHost seg={s} />
				</Sequence>
			))}
			<Caption f={f} from={0} to={s02.from - 4} top={190} lines={['ЧТО ЕСЛИ', '+1 ГОД', 'ЗА КАЖДУЮ ЛОЖЬ?']} c="#ffc94a" size={96} />
			<Caption f={f} from={last.from + last.dur + 8} to={SHORT_FRAMES} top={1450} lines={['ГДЕ ПАПА?', 'ПОЛНАЯ ИСТОРИЯ — НА КАНАЛЕ']} c="#ffc94a" size={72} />
			{LINES.map((l) => (
				<Sequence key={l.id} from={l.from} durationInFrames={l.dur + 4} name={l.id}>
					<Audio src={staticFile(l.file)} startFrom={l.trimStart} />
				</Sequence>
			))}
			{music ? <Audio src={staticFile('sfx/short_bed.wav')} /> : null}
			<AbsoluteFill style={{background: '#000', opacity: interpolate(f, [0, 6], [1, 0], {extrapolateRight: 'clamp'})}} />
		</AbsoluteFill>
	);
};
