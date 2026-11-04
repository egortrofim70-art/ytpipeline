// Разбор превью-референсов в цифры: палитра (k-means), яркость, насыщенность,
// доля «неона», доля тёмного фона, контраст. node analyze-refs.mjs
// Режет коллажи на отдельные превью (сетка задаётся ниже) и печатает JSON.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const FF = process.env.FFMPEG ?? 'ffmpeg';
const W = 320, H = 180; // каждое превью приводим к 16:9 320x180
// коллаж -> список превью: [x, y, w, h] в пикселях исходника + подпись
const SETS = {
	'refs/1.webp': [[14, 10, 870, 490, 'INFINITE AURA?'], [14, 530, 870, 490, 'I OWN THIS ROOM.'], [14, 1048, 870, 490, 'infinite money']],
	'refs/2.webp': [[18, 12, 637, 358, 'puppies'], [679, 12, 637, 358, 'SAVE'], [1340, 12, 637, 358, 'YOU girls school'], [18, 510, 637, 358, 'murderer'], [679, 510, 637, 358, 'body swap'], [1340, 510, 637, 358, 'LUCK'], [18, 1040, 637, 345, 'triple faces'], [679, 1040, 637, 345, "I'M NOT GAY!"], [1340, 1040, 637, 345, 'oh yeah.']],
	'refs/3.webp': [[35, 0, 638, 356, 'NO ESCAPE'], [697, 0, 638, 356, 'NEVER TIRED'], [1359, 0, 638, 356, 'I CAN SEE IT p5'], [35, 528, 638, 358, 'WHY ME?!'], [697, 528, 638, 358, 'NOT BROKE AGAIN!'], [1359, 528, 638, 358, 'I SEE IT!'], [35, 1027, 638, 358, 'I TOOK IT'], [697, 1027, 638, 358, 'STEAL YEARS. PREQUEL'], [1359, 1027, 638, 358, 'I CAN SEE IT p4']],
};
const rgb = (file, [x, y, w, h]) => {
	const r = spawnSync(FF, ['-v', 'error', '-i', file, '-vf', `crop=${w}:${h}:${x}:${y},scale=${W}:${H}`, '-f', 'image2pipe', '-c:v', 'rawvideo', '-pix_fmt', 'rgb24', '-'], {maxBuffer: 2 ** 28});
	if (r.status) throw new Error(r.stderr.toString());
	return r.stdout;
};
const hsv = (r, g, b) => {
	const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
	let h = 0;
	if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return [((h * 60) + 360) % 360, mx ? d / mx : 0, mx / 255];
};
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const kmeans = (px, k = 6) => {
	let C = Array.from({length: k}, (_, i) => px[Math.floor((i + 0.5) * px.length / k)].slice());
	let n;
	for (let it = 0; it < 12; it++) {
		const S = C.map(() => [0, 0, 0]); n = C.map(() => 0);
		for (const p of px) {
			let bi = 0, bd = 1e9;
			C.forEach((c, i) => { const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2; if (d < bd) { bd = d; bi = i; } });
			S[bi][0] += p[0]; S[bi][1] += p[1]; S[bi][2] += p[2]; n[bi]++;
		}
		C = C.map((c, i) => (n[i] ? S[i].map((v) => v / n[i]) : c));
	}
	return C.map((c, i) => ({hex: hex(c), share: +(n[i] / px.length).toFixed(2)})).sort((a, b) => b.share - a.share);
};
const out = [];
for (const [file, tiles] of Object.entries(SETS)) for (const t of tiles) {
	const buf = rgb(file, t);
	const px = []; let L = 0, S = 0, neon = 0, dark = 0, yellow = 0, white = 0, red = 0, green = 0, cyan = 0, purple = 0, Ls = [];
	for (let i = 0; i < buf.length; i += 3) {
		const p = [buf[i], buf[i + 1], buf[i + 2]]; px.push(p);
		const [h, s, v] = hsv(...p); L += v; S += s; Ls.push(v);
		if (s > 0.6 && v > 0.75) neon++;
		if (v < 0.22) dark++;
		if (s > 0.5 && v > 0.7 && h >= 40 && h <= 62) yellow++;
		if (s < 0.12 && v > 0.9) white++;
		if (s > 0.5 && v > 0.5 && (h < 12 || h > 345)) red++;
		if (s > 0.5 && v > 0.5 && h > 90 && h < 150) green++;
		if (s > 0.5 && v > 0.5 && h >= 170 && h < 210) cyan++;
		if (s > 0.4 && v > 0.35 && h >= 255 && h < 300) purple++;
	}
	Ls.sort((a, b) => a - b);
	const N = px.length, pc = (x) => +(100 * x / N).toFixed(1);
	out.push({file, title: t[4], brightness: +(L / N).toFixed(2), saturation: +(S / N).toFixed(2), contrast_p95_p5: +(Ls[Math.floor(N * 0.95)] - Ls[Math.floor(N * 0.05)]).toFixed(2),
		pct: {dark_bg: pc(dark), neon: pc(neon), yellow: pc(yellow), white: pc(white), red: pc(red), green: pc(green), cyan: pc(cyan), purple: pc(purple)}, palette: kmeans(px)});
}
fs.writeFileSync('refs/analysis.json', JSON.stringify(out, null, 1));
const fam = (f) => out.filter(f);
const avg = (a, k) => +(a.reduce((s, x) => s + (k.includes('.') ? x.pct[k.split('.')[1]] : x[k]), 0) / a.length).toFixed(2);
for (const [name, set] of [['A: чёрный стикмен (1 и 3)', fam((o) => !o.file.includes('2.webp'))], ['B: белая голова (2)', fam((o) => o.file.includes('2.webp'))]]) {
	console.log(`\n== ${name}: ${set.length} превью`);
	for (const k of ['brightness', 'saturation', 'contrast_p95_p5', 'pct.dark_bg', 'pct.neon', 'pct.yellow', 'pct.white', 'pct.red', 'pct.green', 'pct.cyan', 'pct.purple']) console.log(k.padEnd(18), avg(set, k));
}
for (const o of out) console.log(o.title.padEnd(22), 'L', o.brightness, 'S', o.saturation, 'dark', o.pct.dark_bg + '%', 'neon', o.pct.neon + '%', o.palette.slice(0, 5).map((p) => p.hex + ' ' + Math.round(p.share * 100) + '%').join('  '));
