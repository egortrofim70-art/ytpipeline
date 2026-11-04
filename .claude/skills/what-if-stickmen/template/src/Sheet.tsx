import React from 'react';
import {AbsoluteFill, Freeze} from 'remotion';
import {Long} from './Long';
import {Short} from './Short';
import {FONT} from './kit/ui';

/* Storyboard / contact sheet: many frames of Long or Short in one picture.
   tools/storyboard.mjs renders it as a single still. */
export type SheetProps = {comp: 'Long' | 'Short'; frames: number[]; cols: number; title?: string};
export const SHEET_W = 1920;
export const sheetSize = (p: SheetProps) => {
	const cw = SHEET_W / p.cols;
	const ch = p.comp === 'Long' ? (cw * 9) / 16 : (cw * 16) / 9;
	return {width: SHEET_W, height: Math.ceil(p.frames.length / p.cols) * ch + (p.title ? 60 : 0), cw, ch};
};

export const Sheet: React.FC<SheetProps> = (p) => {
	const {cw, ch} = sheetSize(p);
	const W = p.comp === 'Long' ? 1920 : 1080;
	const s = cw / W;
	const top = p.title ? 60 : 0;
	return (
		<AbsoluteFill style={{background: '#111'}}>
			{p.title ? <div style={{height: 60, color: '#fff', fontFamily: FONT, fontSize: 30, fontWeight: 800, padding: '10px 20px'}}>{p.title}</div> : null}
			{p.frames.map((fr, i) => (
				<div key={i} style={{position: 'absolute', left: (i % p.cols) * cw, top: top + Math.floor(i / p.cols) * ch, width: cw, height: ch, overflow: 'hidden', outline: '2px solid #000'}}>
					<div style={{width: W, height: p.comp === 'Long' ? 1080 : 1920, transform: `scale(${s})`, transformOrigin: '0 0', position: 'relative'}}>
						<Freeze frame={fr}>{p.comp === 'Long' ? <Long sound={false} /> : <Short sound={false} />}</Freeze>
					</div>
					<div style={{position: 'absolute', left: 6, top: 4, color: '#ffe04a', fontFamily: FONT, fontSize: 20, fontWeight: 800, textShadow: '0 1px 3px #000'}}>
						{i + 1} · {(fr / 30).toFixed(1)}s
					</div>
				</div>
			))}
		</AbsoluteFill>
	);
};
