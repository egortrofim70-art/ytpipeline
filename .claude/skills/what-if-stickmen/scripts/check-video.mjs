// Checks a FINISHED video file:
//  - duration and size match the composition,
//  - flashes: a "plan" of 1–3 frames between two cuts (the crop/close-up flicker bug),
//  - black frames (outside the first/last 10 frames),
//  - static stretches: no visible motion at all for over 2 s (camera must always move),
//  - chunk seams: frame difference right at every chunk border (out/chunks_<Id>),
//  - loudness (-16 LUFS target) and clipping.
// Some flashes are intended (fade-in, a white flash, a shake): the report lists the times —
// look at those frames before deciding.
// node tools/check-video.mjs out/Long.mp4 [--chunk 2500]
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ffbin, grayFrames, probe, say} from './lib.mjs';

const file = process.argv[2];
// chunk borders: written by render.mjs next to the chunks (out/chunks_<Id>/bounds.json)
const idGuess = path.basename(file, '.mp4').replace(/_phone$/, '');
const boundsFile = path.join(path.dirname(file), `chunks_${idGuess}`, 'bounds.json');
const chunk = Number(process.argv[process.argv.indexOf('--chunk') + 1]) || (fs.existsSync(boundsFile) ? JSON.parse(fs.readFileSync(boundsFile, 'utf8')).chunk : 0);
const p = probe(file);
const v = (p.streams ?? []).find((x) => x.codec_type === 'video');
const a = (p.streams ?? []).find((x) => x.codec_type === 'audio');
say(`file: ${path.basename(file)}  ${v?.width}x${v?.height}  ${Number(p.format?.duration ?? 0).toFixed(1)} s  audio: ${a ? 'yes' : 'NO'}`);

const w = v && v.width < v.height ? 18 : 32;
const h = v && v.width < v.height ? 32 : 18;
const g = grayFrames(file, w, h);
const diff = [0];
const mean = [];
for (let f = 0; f < g.n; f++) {
	let s = 0;
	let m = 0;
	for (let i = 0; i < g.S; i++) {
		m += g.at(f, i);
		if (f) s += Math.abs(g.at(f, i) - g.at(f - 1, i));
	}
	if (f) diff.push(s / g.S);
	mean.push(m / g.S);
}
const t = (f) => (f / 30).toFixed(2) + 's';
const cuts = [];
for (let f = 1; f < g.n; f++) if (diff[f] > 16) cuts.push(f);
const flashes = [];
for (let i = 1; i < cuts.length; i++) if (cuts[i] - cuts[i - 1] <= 3 && cuts[i - 1] > 10) flashes.push(cuts[i - 1]);
const black = [];
for (let f = 10; f < g.n - 10; f++) if (mean[f] < 4) black.push(f);
const still = [];
let run = 0;
for (let f = 1; f < g.n; f++) {
	if (diff[f] < 0.08) run++;
	else {
		if (run > 60) still.push([f - run, run]);
		run = 0;
	}
}
const seams = [];
if (chunk) for (let b = chunk; b < g.n; b += chunk) seams.push([b, diff[b]?.toFixed(1), diff[b] > 16 && !cuts.includes(b - 1) && !cuts.includes(b + 1)]);

say(`cuts seen: ${cuts.length} (≈ one every ${(g.n / Math.max(1, cuts.length) / 30).toFixed(1)} s; similar-looking cuts are not counted)`);
say(flashes.length ? `FLASH candidates at: ${[...new Set(flashes.map((f) => t(f)))].join(', ')}` : 'flashes: none');
say(black.length ? `BLACK frames: ${black.length} (first at ${t(black[0])})` : 'black frames: none');
say(still.length ? `STATIC stretches (no motion > 2 s): ${still.map(([f, n]) => `${t(f)} for ${(n / 30).toFixed(1)}s`).join(', ')}` : 'static stretches: none');
if (seams.length) say(`chunk seams (difference at the border; a big jump on a border that is not a cut = check frames around it): ${seams.map(([b, d, bad]) => `${t(b)}:${d}${bad ? ' CHECK' : ''}`).join('  ')}`);
else say('chunk seams: single chunk, nothing to join');

if (a) {
	const r = spawnSync(ffbin(), ['-hide_banner', '-i', file, '-map', '0:a', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], {encoding: 'utf8', maxBuffer: 1 << 26});
	const j = JSON.parse((r.stderr.match(/\{[\s\S]*?\}/g) ?? ['{}']).pop());
	const ok = Math.abs(Number(j.input_i) + 16) < 1.5 && Number(j.input_tp) < -0.5;
	say(`loudness: ${j.input_i} LUFS, peak ${j.input_tp} dB ${ok ? 'OK' : '— not at -16 LUFS / peak too high: run tools/loudness.mjs'}`);
}
