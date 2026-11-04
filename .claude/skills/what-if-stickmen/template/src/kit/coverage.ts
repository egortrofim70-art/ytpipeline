import type React from 'react';
import {L, LINES, TOTAL} from './core';
import {SHOTS} from '../story/shots';

/* A shot starts LEAD frames before its first line (the picture leads the voice a hair).
   ShotDef fields:
     at    line id prefix the shot starts on ('007'), off = extra frames
     C     the scene component (16:9 world)
     own   the shot cuts itself (no automatic coverage angles); ownCuts = its cut frames (local) for the checker
     whip  enter this shot with a whip-pan (new location)
     focus 9:16 crop centre x in the 16:9 frame (number or [start, end] pan) for shorts-only videos
     zoom  extra crop zoom for the short (1 = full height)
     V     native vertical component used by the short instead of cropping C (cards, charts) */
export type ShotDef = {at: string; off?: number; C: React.FC; own?: boolean; ownCuts?: number[]; whip?: boolean; focus?: number | [number, number]; zoom?: number; V?: React.FC};
export const LEAD = 6;
// a shot whose line is gone (script edited, timeline rebuilt) is skipped instead of breaking the whole video
const hasLine = (id: string) => LINES.some((l) => l.id.startsWith(id));
export const SHOT_TIMES = SHOTS.filter((s, i) => i === 0 || hasLine(s.at)).map((s, i) => ({...s, start: i === 0 ? 0 : L(s.at).from - LEAD + (s.off ?? 0)})).map((s, i, arr) => ({
	...s,
	end: i + 1 < arr.length ? arr[i + 1].start : TOTAL,
}));
export type TimedShot = (typeof SHOT_TIMES)[number];

/* Rule: a new framing every 3–10 s. Shots longer than 10 s get coverage cuts placed on
   line starts or on pauses inside a line, aiming at ~6 s per angle. */
const MIN_A = 90;
const MAX_A = 240;
const AIM = 175;
const CANDS = (() => {
	const out: {at: number; w: number}[] = [];
	for (const l of LINES) {
		out.push({at: l.from - LEAD, w: 45});
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
export const WHIPS = SHOT_TIMES.filter((s, i) => s.whip && i > 0).map((s) => s.start);
