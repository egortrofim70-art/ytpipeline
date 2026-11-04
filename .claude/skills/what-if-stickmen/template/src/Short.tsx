import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import STL from './story/short-timeline.json';
import {AngleCtx, L as EL, LINES, Line, ShotCtx, SpeakOverride, TalkOverride, TOTAL} from './kit/core';
import {SHOT_TIMES, TimedShot} from './kit/coverage';
import {clamp, ease} from './kit/kit';
import {Caption} from './kit/graphics';
import {ShotHost, VoiceTrack, whipAt} from './Long';
import {SHORT, Seg} from './story/short';
import {STORY} from './story/config';

/* 9:16 version. Two modes (src/story/short.ts):
   crop  — shorts-only video: the same shots and voice as Long, each shot cropped to 9:16
           around ShotDef.focus (or replaced by its native vertical ShotDef.V).
   recut — "both" formats: a separate short voice timeline (short-timeline.json) laid over
           stretches of the long's shots, cropped per segment; cards can be native vertical. */
const W = 1080;
const H = 1920;
const BASE = H / 1080; // a 16:9 frame scaled to fill the height

type Crop = {cx?: number; cy?: number; z?: number};
const lerpCrop = (a: Crop = {}, b: Crop = a, k: number) => {
	const m = (x?: number, y?: number, d = 0) => (x ?? d) + ((y ?? x ?? d) - (x ?? d)) * k;
	return {cx: m(a.cx, b.cx, 960), cy: m(a.cy, b.cy, 540), z: m(a.z, b.z, 1)};
};
/* place a 1920x1080 child so that frame point (cx, cy) sits in the middle of the 9:16 canvas */
const CropBox: React.FC<{c: {cx: number; cy: number; z: number}; children: React.ReactNode}> = ({c, children}) => {
	const S = BASE * Math.max(1, c.z);
	const cx = Math.min(1920 - W / 2 / S, Math.max(W / 2 / S, c.cx));
	const cy = Math.min(1080 - H / 2 / S, Math.max(H / 2 / S, c.cy));
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
			<div style={{position: 'absolute', width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${W / 2 - cx * S}px, ${H / 2 - cy * S}px) scale(${S})`}}>{children}</div>
		</AbsoluteFill>
	);
};

/* ------------------------------- crop mode ------------------------------- */
const CropShot: React.FC<{s: TimedShot}> = ({s}) => {
	const f = useCurrentFrame();
	const dur = s.end - s.start;
	if (s.V) {
		const V = s.V;
		return <ShotHost start={s.start} end={s.end} C={V} own={s.own} />;
	}
	const fx = Array.isArray(s.focus) ? s.focus : [s.focus ?? 960, s.focus ?? 960];
	const k = interpolate(f, [0, dur], [0, 1], {...clamp, easing: ease});
	const z = (s.zoom ?? 1) * (1 + 0.04 * k); // never static: a slow push on every shot
	return (
		<CropBox c={{cx: fx[0] + (fx[1] - fx[0]) * k, cy: 540, z}}>
			<ShotHost start={s.start} end={s.end} C={s.C} own={s.own} />
		</CropBox>
	);
};

/* ------------------------------- recut mode ------------------------------ */
const SLINES = STL.lines as Line[];
const SL = (id: string) => {
	const l = SLINES.find((x) => x.id.startsWith(id));
	if (!l) throw new Error('no short line ' + id);
	return l;
};
const LEAD = 6;
const timed = () => {
	if (SHORT.mode !== 'recut') return [];
	const out: (Seg & {start: number; end: number; ep0: number})[] = [];
	SHORT.segs.forEach((s, i) => {
		const start = i === 0 ? 0 : s.at !== undefined ? SL(s.line).from + s.at : SL(s.line).from - LEAD;
		const prev = out[i - 1];
		const ep0 = s.cont && prev ? prev.ep0 + (start - prev.start) : s.ep ? (s.at !== undefined ? EL(s.ep).from + (s.off ?? 0) : EL(s.ep).from + (s.off ?? 0) - (i === 0 ? SL(s.line).from : LEAD)) : 0;
		out.push({...s, start, end: 0, ep0});
	});
	out.forEach((s, i) => (s.end = i + 1 < out.length ? out[i + 1].start : STL.total));
	return out;
};
const TIMED = timed();
const talkAt = (sp: string, f: number) => {
	for (const l of SLINES) {
		if (l.sp !== sp || f < l.from || f >= l.from + l.dur) continue;
		const i = f - l.from;
		return ((l.env[i] ?? 0) + (l.env[i + 1] ?? 0)) / 2;
	}
	return 0;
};
/* who the camera is on: the line owning the moment; a quick narrator beat (< 40 frames)
   stays on the previous face so dialogue never flashes the wide shot */
const speakerAt = (f: number) => {
	let k = -1;
	for (let i = 0; i < SLINES.length; i++) if (SLINES[i].from - LEAD <= f) k = i;
	while (k > 0 && SLINES[k].sp === 'N' && SLINES[k].dur < 40 && SLINES[k - 1].sp !== 'N') k--;
	return k >= 0 ? SLINES[k].sp : null;
};
const RecutSeg: React.FC<{seg: (typeof TIMED)[number]}> = ({seg}) => {
	const f = useCurrentFrame();
	const dur = seg.end - seg.start;
	if (seg.C) return <seg.C f={f} dur={dur} />;
	const at = (g: number) => SHOT_TIMES.find((s) => g >= s.start && g < s.end) ?? SHOT_TIMES[SHOT_TIMES.length - 1];
	// hold: stay inside the shot the segment opened on (its last frame freezes, the crop keeps moving)
	const gf = seg.hold ? Math.min(seg.ep0 + f, at(seg.ep0).end - 1) : seg.ep0 + f;
	const shot = at(gf);
	const ctx = {f: gf - shot.start, gf, dur: shot.end - shot.start, start: shot.start, at: (n: string) => EL(n).from - shot.start, end: (n: string) => EL(n).from + EL(n).dur - shot.start};
	const c = lerpCrop(seg.a, seg.b, interpolate(f, [0, dur], [0, 1], {...clamp, easing: ease}));
	const C = shot.C;
	return (
		<CropBox c={c}>
			<TalkOverride.Provider value={(sp, g) => talkAt(sp, g - seg.ep0 + seg.start)}>
				<SpeakOverride.Provider value={(g) => speakerAt(g - seg.ep0 + seg.start)}>
					<ShotCtx.Provider value={ctx}>
						<AngleCtx.Provider value={{k: 0, t: f, len: dur}}>
							<C />
						</AngleCtx.Provider>
					</ShotCtx.Provider>
				</SpeakOverride.Provider>
			</TalkOverride.Provider>
		</CropBox>
	);
};

export const SHORT_FRAMES = SHORT.mode === 'recut' ? STL.total : TOTAL;

export const Short: React.FC<{sound?: boolean}> = ({sound = true}) => {
	const f = useCurrentFrame();
	const lines = SHORT.mode === 'recut' ? SLINES : LINES;
	const last = lines[lines.length - 1];
	const w = SHORT.mode === 'crop' ? whipAt(f) : null;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="whipBlurV" x="-20%" y="0%" width="140%" height="100%">
					<feGaussianBlur stdDeviation={`${w ? 50 * w.k : 0} 0`} />
				</filter>
			</svg>
			<AbsoluteFill style={w ? {transform: `translateX(${w.dir * 160 * w.k}px) scale(${1 + 0.1 * w.k})`, filter: 'url(#whipBlurV)'} : undefined}>
				{SHORT.mode === 'recut'
					? TIMED.map((s, i) => (
							<Sequence key={i} from={s.start} durationInFrames={s.end - s.start} name={s.line}>
								<RecutSeg seg={s} />
							</Sequence>
						))
					: SHOT_TIMES.map((s, i) => (
							<Sequence key={i} from={s.start} durationInFrames={s.end - s.start} name={`shot ${i + 1} @${s.at}`}>
								<CropShot s={s} />
							</Sequence>
						))}
			</AbsoluteFill>
			{SHORT.hook && lines[1] ? <Caption f={f} from={0} to={lines[1].from - 4} top={190} lines={SHORT.hook} size={92} /> : null}
			{STORY.endCaption && last ? <Caption f={f} from={last.from + last.dur + 8} to={SHORT_FRAMES} top={1450} lines={STORY.endCaption} size={72} /> : null}
			{sound ? (
				<>
					{SHORT.mode === 'recut'
						? SLINES.map((l) => (
								<Sequence key={l.id} from={l.from} durationInFrames={l.dur + 4}>
									<Audio src={staticFile(l.file)} startFrom={l.trimStart} />
								</Sequence>
							))
						: <VoiceTrack />}
					<Audio src={staticFile(SHORT.bed ?? STORY.bed)} />
				</>
			) : null}
			<AbsoluteFill style={{background: '#000', opacity: interpolate(f, [0, 6], [1, 0], {extrapolateRight: 'clamp'})}} />
		</AbsoluteFill>
	);
};
