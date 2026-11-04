/* Used by tools/check-plans.mjs (bundled for Node): every plan's length, the whips and
   counter changes on the timeline. Not part of the video. */
import {SHOT_TIMES, WHIPS, cutsFor} from './coverage';
import {counterChanges} from './core';
import {SHORT} from '../story/short';
import STL from '../story/short-timeline.json';

export const report = () => {
	const plans: {shot: number; at: string; start: number; len: number; own: boolean}[] = [];
	SHOT_TIMES.forEach((s, i) => {
		const cuts = s.own ? [s.start, ...(s.ownCuts ?? []).map((c) => s.start + c)] : cutsFor(s.start, s.end);
		cuts.forEach((c, k) => plans.push({shot: i + 1, at: s.at, start: c, len: (cuts[k + 1] ?? s.end) - c, own: !!s.own}));
	});
	let short: {line: string; start: number; len: number}[] = [];
	if (SHORT.mode === 'recut') {
		const SL = (id: string) => STL.lines.find((x: any) => x.id.startsWith(id))!;
		const starts = SHORT.segs.map((s, i) => (i === 0 ? 0 : s.at !== undefined ? SL(s.line).from + s.at : SL(s.line).from - 6));
		short = SHORT.segs.map((s, i) => ({line: s.line, start: starts[i], len: (starts[i + 1] ?? STL.total) - starts[i]}));
	}
	return {plans, whips: WHIPS, counter: counterChanges(), short, mode: SHORT.mode};
};
