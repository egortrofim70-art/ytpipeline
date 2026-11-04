// Free voice-over without any account: Microsoft Edge neural voices (msedge-tts).
// node tools/voice-free.mjs [lines=src/story/lines.json] [--force] [--only 003,007]
// Reads voices from src/story/voices.json: {"N": {"voice": "ru-RU-DmitryNeural", "rate": "+6%", "pitch": "+0Hz"}, ...}
// Writes public/vo/<id>.mp3. A clip is re-made only if its text or voice changed (public/vo/.made.json),
// so re-running after edits redoes just the edited lines; --force redoes all.
// The free service sometimes drops a connection ("Stream closed…"): every line gets a fresh
// connection and up to 6 tries; a line that still fails is skipped and listed at the end —
// just run the command again, finished lines are kept.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, readJson, say} from './lib.mjs';

const args = process.argv.slice(2);
const linesFile = args.find((a) => a.endsWith('.json')) ?? 'src/story/lines.json';
const force = args.includes('--force');
const only = args.includes('--only') ? (args[args.indexOf('--only') + 1] ?? '').split(',').filter(Boolean) : [];
const lines = readJson(linesFile);
const voices = readJson('src/story/voices.json');
const {MsEdgeTTS, OUTPUT_FORMAT} = await import('msedge-tts');

const outDir = path.join(ROOT, 'public', 'vo');
fs.mkdirSync(outDir, {recursive: true});
const madeFile = path.join(outDir, '.made.json');
const made0 = fs.existsSync(madeFile) ? JSON.parse(fs.readFileSync(madeFile, 'utf8')) : {};

// clips of lines that are no longer in the script (e.g. the template demo) would confuse
// the "one clip per line" check: remove free-voice clips whose id is gone
if (!only.length && linesFile.endsWith('lines.json') && !linesFile.includes('short-')) {
	const ids = new Set(lines.map((l) => l.id));
	for (const f of fs.readdirSync(outDir)) {
		const m = f.match(/^(.+)\.mp3$/);
		if (m && !m[1].endsWith('_a') && !m[1].endsWith('_b') && !ids.has(m[1]) && /^\d{3}_/.test(m[1])) {
			fs.unlinkSync(path.join(outDir, f));
			delete made0[m[1]];
			say(`removed old clip ${f} (not in the script)`);
		}
	}
}

const synth = async (voice, text, opts, target) => {
	const tts = new MsEdgeTTS(); // fresh connection every try: a dropped stream poisons the old one
	await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
	const tmp = fs.mkdtempSync(path.join(outDir, '.tmp-'));
	try {
		const {audioFilePath} = await tts.toFile(tmp, text, opts);
		if (fs.statSync(audioFilePath).size < 2000) throw new Error('empty audio');
		fs.renameSync(audioFilePath, target);
	} finally {
		fs.rmSync(tmp, {recursive: true, force: true});
		try {
			tts.close();
		} catch {}
	}
};

let made = 0;
const failed = [];
for (const l of lines) {
	if (l.reuse) continue;
	if (only.length && !only.some((o) => l.id.startsWith(o))) continue;
	const target = path.join(outDir, `${l.id}.mp3`);
	const v = voices[l.sp] ?? voices.N;
	if (!v) throw new Error(`no voice for speaker ${l.sp} in src/story/voices.json`);
	const sig = JSON.stringify([l.t, v.voice, v.rate ?? '', v.pitch ?? '']);
	if (fs.existsSync(target) && !force && made0[l.id] === sig) continue;
	// speech text only: [tags] are ElevenLabs directions, strip them here
	const text = l.t.replace(/\[[^\]]*\]\s*/g, '');
	let ok = false;
	for (let attempt = 1; attempt <= 6 && !ok; attempt++) {
		try {
			await synth(v.voice, text, {rate: v.rate ?? '+0%', pitch: v.pitch ?? '+0Hz'}, target);
			ok = true;
		} catch (e) {
			if (attempt < 6) await new Promise((r) => setTimeout(r, 1500 * attempt));
			else say(`could not voice ${l.id}: ${String(e.message ?? e).slice(0, 120)}`);
		}
	}
	if (!ok) {
		failed.push(l.id);
		continue;
	}
	made0[l.id] = sig;
	fs.writeFileSync(madeFile, JSON.stringify(made0, null, 1));
	made++;
	say(`voice ${l.id} (${v.voice})`);
}
say(`done: ${made} new clip(s) in public/vo`);
if (failed.length) {
	say(`FAILED: ${failed.join(', ')} — the free service dropped the connection. Run the same command again: finished lines are kept.`);
	process.exit(2);
}
