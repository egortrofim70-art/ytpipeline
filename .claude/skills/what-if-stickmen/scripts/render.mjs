// Full render of a composition, resumable, in chunks of frames:
//   1. picture rendered muted in chunks (a crash loses one chunk, not the whole video;
//      re-running skips finished chunks; delete one chunk file to redo only that part),
//   2. chunks joined without re-encoding,
//   3. voice + bed mixed directly from the timeline (seconds instead of an hour of a
//      Remotion audio pass) and normalised to -16 LUFS,
//   4. for vertical videos a small phone copy.
// GPU (ANGLE) is always on: without it blur layers render 20–30x slower.
//
// node tools/render.mjs Long|Short [--chunk 2500] [--fresh] [--estimate]
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, ffbin, npx, readJson, say} from './lib.mjs';

const args = process.argv.slice(2);
const id = args[0] ?? 'Long';
const short = id === 'Short';
// shorts in small chunks (~20 s): a failure costs little and memory stays low
const chunk = Number(args[args.indexOf('--chunk') + 1]) || (short ? 600 : 2500);
const cfg = readJson('src/story/render.json'); // {"long": {...}, "short": {...}} written by the story; see below
const c = (short ? cfg.short : cfg.long) ?? {};
const tlFile = c.timeline ?? 'src/story/timeline.json';
const TL = readJson(tlFile);
const total = TL.total;
const dir = path.join(ROOT, 'out', `chunks_${id}`);
if (args.includes('--fresh')) fs.rmSync(dir, {recursive: true, force: true});
fs.mkdirSync(dir, {recursive: true});
const out = path.join(ROOT, 'out', `${c.name ?? id}.mp4`);
// render.json may set "concurrency" (parallel browser tabs, default 6; lower it on weak machines)
const remotionArgs = (from, to, file, conc = c.concurrency ?? 6) => ['remotion', 'render', id, file, `--frames=${from}-${to}`, '--muted', '--gl=angle', '--concurrency=' + conc, '--crf=18', '--log=error', '--timeout=120000'];

/* quick time estimate: render 30 frames and extrapolate */
if (args.includes('--estimate')) {
	const t0 = Date.now();
	const mid = Math.floor(total / 2);
	await npx(remotionArgs(mid, mid + 29, path.join(dir, 'estimate.mp4')), {quiet: true});
	const took = Date.now() - t0;
	const bundle = Math.min(20000, took * 0.5); // each chunk re-bundles the project
	const perFrame = Math.max(10, took - bundle) / 30;
	const chunks = Math.ceil(total / chunk);
	const min = Math.max(1, Math.round((perFrame * total + bundle * chunks + 15000) / 60000));
	say(`estimate: ~${min} min for ${(total / 30).toFixed(0)} s of video (${chunks} chunk(s))`);
	process.exit(0);
}

let n = 0;
const files = [];
for (let s = 0; s < total; s += chunk, n++) {
	const e = Math.min(total - 1, s + chunk - 1);
	const f = path.join(dir, `c${String(n).padStart(2, '0')}.mp4`);
	files.push(f);
	if (fs.existsSync(f)) {
		say(`skip chunk ${n} (${s}-${e}), already rendered`);
		continue;
	}
	const started = Date.now();
	say(`chunk ${n + 1}/${Math.ceil(total / chunk)}: frames ${s}-${e}`);
	let ok = false;
	// retries go lighter: fewer parallel tabs (most failures are timeouts under load)
	for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
		const tmp = path.join(dir, 'tmp.mp4');
		const conc = Math.max(1, Math.floor((c.concurrency ?? 6) / attempt));
		ok = (await npx(remotionArgs(s, e, tmp, conc))) === 0;
		if (ok) fs.renameSync(tmp, f);
		else say(`chunk ${n + 1} failed, retrying with ${Math.max(1, Math.floor((c.concurrency ?? 6) / (attempt + 1)))} tabs`);
	}
	if (!ok) {
		say(`FAILED chunk ${n + 1} after 3 tries. Read the error above; finished chunks are kept, so after the fix re-run the same command.`);
		process.exit(1);
	}
	say(`chunk ${n + 1} done in ${Math.round((Date.now() - started) / 1000)} s`);
}
fs.writeFileSync(path.join(dir, 'bounds.json'), JSON.stringify({chunk, total}));
const ff = ffbin();
const list = path.join(dir, 'list.txt');
// names relative to the list file: safe with spaces and non-latin folder names
fs.writeFileSync(list, files.map((f) => `file '${path.basename(f)}'`).join('\n'));
const silent = path.join(dir, 'video.mp4');
let r = spawnSync(ff, ['-hide_banner', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent], {stdio: 'inherit'});
if (r.status !== 0) process.exit(1);
// sound: bed + voices straight from the timeline, then -16 LUFS
const mix = path.join(dir, 'mix.wav');
r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'mix-audio.mjs'), tlFile, path.join('public', c.bed ?? 'sfx/bed.wav'), String(c.bedVolume ?? 1), mix], {stdio: 'inherit', cwd: ROOT});
if (r.status !== 0) process.exit(1);
r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'loudness.mjs'), mix, silent, out, '-16'], {stdio: 'inherit', cwd: ROOT});
if (r.status !== 0) process.exit(1);
if (short) {
	const phone = out.replace(/\.mp4$/, '_phone.mp4');
	spawnSync(ff, ['-hide_banner', '-v', 'error', '-y', '-i', out, '-c:v', 'libx264', '-crf', '26', '-preset', 'medium', '-c:a', 'copy', '-movflags', '+faststart', phone], {stdio: 'inherit'});
	say(`phone copy: ${path.relative(ROOT, phone)}`);
}
say(`DONE ${path.relative(ROOT, out)}`);
