// Builds the timeline from the voice clips: per line its start frame, length, trimmed
// start (silence cut off) and a 30 fps loudness envelope used for mouth flaps and for
// finding pauses (camera cuts land on them).
// node tools/prep-timeline.mjs [lines=src/story/lines.json] [out=src/story/timeline.json]
// Line fields: id "007_HERO", sp, t, optional reuse "003_N" (play another line's clip),
// cut (max seconds kept), gap (seconds of air after the line; default 0.35 narration / 0.25 dialogue).
// Clips: public/vo/<id>.mp3 (free voice) or public/vo/<id>_a.mp3 (ElevenLabs take a).
import fs from 'node:fs';
import path from 'node:path';
import {FPS, ROOT, decodePcm, readJson, say} from './lib.mjs';

const linesFile = process.argv[2] ?? 'src/story/lines.json';
const outFile = process.argv[3] ?? 'src/story/timeline.json';
const lines = readJson(linesFile);
// several takes of one line may exist (free voice, ElevenLabs take a): the newest file wins
const clip = (id) => {
	const found = [`${id}.mp3`, `${id}_a.mp3`, `${id}.wav`]
		.map((n) => ({n, p: path.join(ROOT, 'public', 'vo', n)}))
		.filter((x) => fs.existsSync(x.p))
		.sort((a, b) => fs.statSync(b.p).mtimeMs - fs.statSync(a.p).mtimeMs);
	if (!found.length) throw new Error(`missing voice clip for ${id} (public/vo/${id}.mp3)`);
	return `vo/${found[0].n}`;
};

let frame = Math.round(0.4 * FPS);
const out = [];
for (const l of lines) {
	const file = clip(l.reuse ?? l.id);
	const s = decodePcm(path.join(ROOT, 'public', file));
	const per = 16000 / FPS;
	const nF = Math.ceil(s.length / per);
	const env = [];
	let peak = 0;
	for (let i = 0; i < nF; i++) {
		let a = 0;
		const st = Math.floor(i * per);
		const en = Math.min(s.length, Math.floor((i + 1) * per));
		for (let j = st; j < en; j++) a += (s[j] / 32768) ** 2;
		const rms = Math.sqrt(a / Math.max(1, en - st));
		env.push(rms);
		peak = Math.max(peak, rms);
	}
	// trim silence/breaths at both ends so lines butt together naturally
	const thr = peak * 0.06;
	let a0 = env.findIndex((v) => v > thr);
	let a1 = env.length - 1 - [...env].reverse().findIndex((v) => v > thr);
	a0 = Math.max(0, a0 - 2);
	a1 = Math.min(env.length - 1, a1 + 3);
	if (l.cut) a1 = Math.min(a1, a0 + Math.round(l.cut * FPS));
	const dur = a1 - a0 + 1;
	const gap = Math.round((l.gap ?? (l.sp === 'N' ? 0.35 : 0.25)) * FPS);
	out.push({
		id: l.id,
		sp: l.sp,
		text: l.t ?? '',
		file,
		trimStart: a0,
		from: frame,
		dur,
		env: env.slice(a0, a1 + 1).map((v) => Math.round(Math.min(1, v / (peak || 1)) * 100) / 100),
	});
	frame += dur + gap;
}
// a line much faster or slower than the rest per letter is usually cut off or has extra noise
const rate = out.map((o) => o.dur / Math.max(4, (o.text || '').replace(/\s/g, '').length));
const med = [...rate].sort((a, b) => a - b)[Math.floor(rate.length / 2)] || 1;
out.forEach((o, i) => {
	if (o.text && (rate[i] > med * 1.9 || rate[i] < med * 0.45)) say(`CHECK ${o.id}: ${(o.dur / FPS).toFixed(1)} s for ${o.text.length} letters — listen to it (cut off, extra noise or wrong text?)`);
});
const total = frame + 2 * FPS;
fs.writeFileSync(path.join(ROOT, outFile), JSON.stringify({fps: FPS, total, lines: out}));
say(`timeline: ${out.length} lines, ${(total / FPS).toFixed(1)} s -> ${outFile}`);
