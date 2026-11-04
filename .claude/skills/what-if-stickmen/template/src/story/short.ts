import type React from 'react';

/* How the vertical version is made.
   crop  — shorts-only video: Short = the same shots as Long, cropped to 9:16 around
           ShotDef.focus — an x on the SCREEN after the shot camera (default 960 = centre,
           where the shot camera already puts the hero/speaker). The 9:16 window shows only
           ~607 px of the 1920 width (960 ± 300): keep faces, hands, badges inside it.
           Cards/charts get a native vertical ShotDef.V (Board vertical, Split vertical).
   recut — "long + short": the short has its own (shorter) script and voice
           (short-lines.json -> short-timeline.json); each short line is laid over a stretch
           of a long shot. Segment fields:
             line  short line id prefix ('s04'); at = start this many frames INTO the line
             ep    long line id prefix whose shot is played; off = frames into it
             cont  continue the previous segment's footage; hold = freeze on the shot's last frame
             a, b  9:16 crop at segment start / end: {cx, cy, z}
             C     a native vertical card instead of long footage */
export type Seg = {
	line: string;
	at?: number;
	ep?: string;
	off?: number;
	cont?: boolean;
	hold?: boolean;
	a?: {cx?: number; cy?: number; z?: number};
	b?: {cx?: number; cy?: number; z?: number};
	C?: React.FC<{f: number; dur: number}>;
};

export const SHORT: {mode: 'crop'; hook?: string[]; bed?: string} | {mode: 'recut'; segs: Seg[]; hook?: string[]; bed?: string} = {
	mode: 'crop',
	hook: ['ЧТО ЕСЛИ', 'НАД ГОЛОВОЙ — ШАГОМЕР?'],
};
