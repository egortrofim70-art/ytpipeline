import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AngleCtx, L, LINES, ShotCtx, TOTAL} from './kit/core';
import {SHOT_TIMES, WHIPS, cutsFor} from './kit/coverage';
import {STORY} from './story/config';
import {Caption} from './kit/graphics';

/* One shot on the long timeline: gives it the shot context (frames, line lookups) and
   the current coverage angle. */
export const ShotHost: React.FC<{start: number; end: number; C: React.FC; own?: boolean; f?: number}> = ({start, end, C, own, f: fOverride}) => {
	const fr = useCurrentFrame();
	const f = fOverride ?? fr;
	const gf = start + f;
	const ctx = {f, gf, dur: end - start, start, at: (n: string) => L(n).from - start, end: (n: string) => L(n).from + L(n).dur - start};
	const cuts = own ? [start] : cutsFor(start, end);
	let k = 0;
	while (k + 1 < cuts.length && gf >= cuts[k + 1]) k++;
	const angle = {k, t: gf - cuts[k], len: (cuts[k + 1] ?? end) - cuts[k]};
	return (
		<ShotCtx.Provider value={ctx}>
			<AngleCtx.Provider value={angle}>
				<C />
			</AngleCtx.Provider>
		</ShotCtx.Provider>
	);
};

/* whip-pan into a new location: old frame flies left, new arrives from the right, smeared */
const WHIP_LEN = 5;
export const whipAt = (f: number) => {
	for (const b of WHIPS) {
		const d = f - b;
		if (d >= -WHIP_LEN && d < WHIP_LEN) {
			const k = d < 0 ? (d + WHIP_LEN + 1) / (WHIP_LEN + 1) : 1 - d / WHIP_LEN;
			return {k: k * k, dir: d < 0 ? -1 : 1};
		}
	}
	return null;
};

export const VoiceTrack: React.FC = () => (
	<>
		{LINES.map((l) => (
			<Sequence key={l.id} from={l.from} durationInFrames={l.dur + 4} name={l.id}>
				<Audio src={staticFile(l.file)} startFrom={l.trimStart} />
			</Sequence>
		))}
	</>
);

export const Long: React.FC<{sound?: boolean}> = ({sound = true}) => {
	const f = useCurrentFrame();
	const w = whipAt(f);
	const last = LINES[LINES.length - 1];
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="whipBlur" x="-20%" y="0%" width="140%" height="100%">
					<feGaussianBlur stdDeviation={`${w ? 60 * w.k : 0} 0`} />
				</filter>
			</svg>
			<AbsoluteFill style={w ? {transform: `translateX(${w.dir * 260 * w.k}px) scale(${1 + 0.12 * w.k})`, filter: 'url(#whipBlur)'} : undefined}>
				{SHOT_TIMES.map((s, i) => (
					<Sequence key={i} from={s.start} durationInFrames={s.end - s.start} name={`shot ${i + 1} @${s.at}`}>
						<ShotHost start={s.start} end={s.end} C={s.C} own={s.own} />
					</Sequence>
				))}
			</AbsoluteFill>
			{STORY.endCaption && last ? <Caption f={f} from={last.from + last.dur + 8} to={TOTAL} top={760} lines={STORY.endCaption} size={64} /> : null}
			{sound ? (
				<>
					<VoiceTrack />
					<Audio src={staticFile(STORY.bed)} volume={STORY.musicVolume ?? 1} />
				</>
			) : null}
			<AbsoluteFill style={{background: '#000', opacity: interpolate(f, [0, 8], [1, 0], {extrapolateRight: 'clamp'})}} />
		</AbsoluteFill>
	);
};
export const LONG_FRAMES = TOTAL;
