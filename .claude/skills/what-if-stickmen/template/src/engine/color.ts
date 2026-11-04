const toRgb = (h: string) => {
	const n = parseInt(h.replace('#', ''), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (r: number[]) =>
	'#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

export const mix = (a: string, b: string, t: number) => {
	const x = toRgb(a);
	const y = toRgb(b);
	return toHex(x.map((v, i) => v + (y[i] - v) * t));
};
export const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
export const darken = (c: string, t: number) => mix(c, '#000000', t);
