import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AngleCtx, L, LINES, ShotCtx, TOTAL} from './core';
import * as A from './shotsA';
import * as B from './shotsB';
import * as O from './opening';
import * as G from './gosha';

// Each shot begins a few frames before its first line (or at an offset into it).
// own: the shot cuts itself (no automatic coverage angles)
type ShotDef = {at: string; off?: number; C: React.FC; own?: boolean};
const SHOTS: ShotDef[] = [
	{at: '001', C: O.S01, own: true},
	{at: '002', C: A.S02},
	{at: '003', C: A.S03},
	{at: '004', C: A.S04},
	{at: '005', C: A.S05},
	{at: '006', C: A.S06},
	{at: '007', C: A.S07},
	{at: '008', C: A.S08},
	{at: '010', off: 75, C: A.S10},
	{at: '016', off: 28, C: A.S11},
	{at: '018', C: A.S12},
	{at: '021', C: G.S13},
	{at: '022', C: A.S14},
	{at: '023', C: G.S15},
	{at: '027', C: G.S16},
	{at: '031', C: G.S17},
	{at: '034', C: A.S18},
	{at: '035', C: A.S19},
	{at: '037', C: A.S20},
	{at: '038', C: A.S21},
	{at: '039', C: A.S22},
	{at: '040', C: A.S23},
	{at: '041', C: A.S24},
	{at: '042', C: A.S25},
	{at: '045', C: A.S26},
	{at: '049', C: A.S27},
	{at: '050', C: A.S28},
	{at: '053', C: A.S29},
	{at: '054', C: A.S30},
	{at: '056', C: B.S31},
	{at: '057', C: B.S32},
	{at: '058', C: B.S33},
	{at: '062', C: B.S34},
	{at: '064', C: B.S35},
	{at: '068', C: B.S36},
	{at: '069', C: B.S37},
	{at: '070', C: B.S38},
	{at: '071', C: B.S39},
	{at: '072', C: B.S40},
	{at: '073', C: B.S41},
	{at: '074', C: B.S42},
	{at: '075', C: B.S43},
	{at: '077', C: B.S44},
	{at: '078', C: B.S45},
	{at: '080', C: B.S46},
	{at: '081', C: B.S47},
	{at: '083', C: B.S48},
	{at: '086', C: B.S49},
	{at: '088', C: B.S50},
	{at: '089', C: B.S51},
	{at: '091', C: B.S52},
	{at: '092', C: B.S53},
	{at: '098', C: B.S54},
	{at: '100', C: B.S55},
	{at: '101', C: B.S56},
	{at: '108', C: B.S57},
	{at: '111', C: B.S58},
	{at: '112', C: B.S59},
	{at: '115', C: B.S60},
];

const LEAD = 6;
export const SHOT_TIMES = SHOTS.map((s, i) => {
	const start = i === 0 ? 0 : L(s.at).from - LEAD + (s.off ?? 0);
	return {...s, start};
}).map((s, i, arr) => ({...s, end: i + 1 < arr.length ? arr[i + 1].start : TOTAL}));

/* Rule: a new framing every 3–10 s. Shots longer than 10 s get coverage cuts, placed
   on line starts or pauses inside a line, aiming at ~6 s per angle. */
const MIN_A = 90;
const MAX_A = 240;
const AIM = 175;
const CANDS = (() => {
	const out: {at: number; w: number}[] = [];
	for (const l of LINES) {
		out.push({at: l.from - 6, w: 45});
		let run = 0;
		l.env.forEach((v, i) => {
			if (v < 0.07) run++;
			else {
				if (run >= 5) out.push({at: l.from + i - Math.round(run / 2), w: 0});
				run = 0;
			}
		});
	}
	return out.sort((a, b) => a.at - b.at);
})();
export const cutsFor = (start: number, end: number) => {
	const cuts = [start];
	let pos = start;
	while (end - pos > 300) {
		const ok = CANDS.filter((c) => c.at >= pos + MIN_A && c.at <= pos + MAX_A && end - c.at >= MIN_A);
		const best = ok.sort((a, b) => Math.abs(a.at - pos - AIM) - a.w - (Math.abs(b.at - pos - AIM) - b.w))[0];
		pos = best ? best.at : pos + AIM;
		cuts.push(pos);
	}
	return cuts;
};

const ShotHost: React.FC<{start: number; end: number; C: React.FC; own?: boolean}> = ({start, end, C, own}) => {
	const f = useCurrentFrame();
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

// music sits well under the voice; the final mix is loudness-normalised after render
export const MUSIC_VOL = 0.3;

/* whip-pan into a new location: the old frame flies left, the new one arrives from the
   right, both smeared by a horizontal motion blur */
const WHIP_AT = ['002', '007', '016', '018', '021', '023', '035', '042', '072', '092', '101', '115'];
const WHIPS = WHIP_AT.map((a) => SHOT_TIMES.find((s) => s.at === a)?.start).filter((x): x is number => x !== undefined);
const WHIP_LEN = 5;
const whipAt = (f: number) => {
	for (const b of WHIPS) {
		const d = f - b;
		if (d >= -WHIP_LEN && d < WHIP_LEN) {
			const k = d < 0 ? (d + WHIP_LEN + 1) / (WHIP_LEN + 1) : 1 - d / WHIP_LEN;
			return {k: k * k, dir: d < 0 ? -1 : 1};
		}
	}
	return null;
};

export const Episode: React.FC<{music?: boolean}> = ({music = true}) => {
	const f = useCurrentFrame();
	const w = whipAt(f);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id="whipBlur" x="-20%" y="0%" width="140%" height="100%">
					<feGaussianBlur stdDeviation={`${w ? 60 * w.k : 0} 0`} />
				</filter>
			</svg>
			<AbsoluteFill style={w ? {transform: `translateX(${w.dir * 260 * w.k}px) scale(${1 + 0.12 * w.k})`, filter: 'url(#whipBlur)'} : undefined}>
				{SHOT_TIMES.map((s, i) => (
					<Sequence key={i} from={s.start} durationInFrames={s.end - s.start} name={'S' + (i + 1) + ' ' + s.at}>
						<ShotHost start={s.start} end={s.end} C={s.C} own={s.own} />
					</Sequence>
				))}
			</AbsoluteFill>
			{LINES.map((l) => (
				<Sequence key={l.id} from={l.from} durationInFrames={l.dur + 4} name={l.id}>
					<Audio src={staticFile(l.file)} startFrom={l.trimStart} />
				</Sequence>
			))}
			{music ? <Audio src={staticFile('sfx/lie_bed.wav')} volume={MUSIC_VOL} /> : null}
			<AbsoluteFill style={{background: '#000', opacity: interpolate(f, [0, 10], [1, 0], {extrapolateRight: 'clamp'})}} />
		</AbsoluteFill>
	);
};

export const EPISODE_FRAMES = TOTAL;
