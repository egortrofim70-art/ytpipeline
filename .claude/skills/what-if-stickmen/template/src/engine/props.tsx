import React from 'react';
import {darken, lighten} from './color';

// Desk: (x, y) = top-left corner of the desktop slab.
export const Desk: React.FC<{x: number; y: number; w?: number; h?: number; top?: string; body?: string; front?: boolean}> = ({
	x,
	y,
	w = 300,
	h = 170,
	top = '#e2b67e',
	body = '#4b5161',
	front = false,
}) => (
	<g>
		<rect x={x + 16} y={y + 18} width={10} height={h} fill={darken(body, 0.25)} />
		<rect x={x + w - 26} y={y + 18} width={10} height={h} fill={darken(body, 0.25)} />
		{front ? <rect x={x + 6} y={y + 16} width={w - 12} height={h * 0.62} rx={4} fill={body} /> : <rect x={x + 10} y={y + 16} width={w - 20} height={56} rx={3} fill={body} />}
		{front ? <rect x={x + 6} y={y + 16} width={w - 12} height={8} fill={lighten(body, 0.15)} /> : null}
		<rect x={x} y={y} width={w} height={20} rx={4} fill={top} />
		<rect x={x} y={y} width={w} height={6} rx={3} fill={lighten(top, 0.25)} />
		<rect x={x} y={y + 16} width={w} height={4} fill={darken(top, 0.2)} />
	</g>
);

// Chair: (x, y) = seat center.
export const Chair: React.FC<{x: number; y: number; facing?: 1 | -1; seat?: string; leg?: string}> = ({x, y, facing = 1, seat = '#c99a62', leg = '#2c2f38'}) => (
	<g transform={`translate(${x},${y}) scale(${facing},1)`}>
		<rect x={-52} y={-150} width={12} height={150} fill={leg} />
		<rect x={-58} y={-150} width={22} height={74} rx={5} fill={seat} />
		<rect x={-48} y={6} width={9} height={128} fill={leg} />
		<rect x={42} y={6} width={9} height={128} fill={leg} />
		<rect x={-58} y={-6} width={116} height={16} rx={5} fill={seat} />
		<rect x={-58} y={-6} width={116} height={5} rx={3} fill={lighten(seat, 0.25)} />
	</g>
);

export const Bottle: React.FC<{x: number; y: number; c: string}> = ({x, y, c}) => (
	<g>
		<rect x={x - 9} y={y - 48} width={18} height={48} rx={4} fill={c} />
		<rect x={x - 9} y={y - 54} width={18} height={9} rx={2} fill={darken(c, 0.3)} />
		<rect x={x - 5} y={y - 40} width={4} height={30} rx={2} fill={lighten(c, 0.4)} opacity={0.7} />
	</g>
);

export const Badge: React.FC<{x: number; y: number; text: string; border: string; s?: number}> = ({x, y, text, border, s = 1}) => {
	const w = text.length * 19 + 36;
	return (
		<g transform={`translate(${x},${y}) scale(${s})`}>
			<rect x={-w / 2 - 4} y={-26} width={w + 8} height={52} rx={14} fill={border} />
			<rect x={-w / 2} y={-22} width={w} height={44} rx={11} fill="#23232a" />
			<text x={0} y={10} textAnchor="middle" fontFamily="'Rubik', sans-serif" fontWeight={900} fontSize={28} fill={lighten(border, 0.45)} letterSpacing={1}>
				{text}
			</text>
		</g>
	);
};
