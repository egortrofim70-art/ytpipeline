// Mixes the soundtrack straight from a voice timeline + music bed, exactly as the
// composition places them (clip from trimStart, dur+4 frames, at `from`), without
// running Remotion over every frame.
// usage: node tools/mix-audio.mjs <timeline.json> <bed.wav> <musicVol> <out.wav>
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [tlFile, bedFile, vol, outFile] = process.argv.slice(2);
const TL = JSON.parse(fs.readFileSync(tlFile, 'utf8'));
const FPS = TL.fps;
const SR = 48000;
import {ffbin} from './lib.mjs';
const ffmpeg = ffbin();

const decode = (file) => {
	const buf = execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-ac', '2', '-ar', String(SR), '-f', 'wav', '-'], {maxBuffer: 1 << 30});
	const d = buf.indexOf('data') + 8;
	const n = Math.floor((buf.length - d) / 4);
	const L = new Float32Array(n), R = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		L[i] = buf.readInt16LE(d + i * 4) / 32768;
		R[i] = buf.readInt16LE(d + i * 4 + 2) / 32768;
	}
	return {L, R, n};
};

const N = Math.ceil((TL.total / FPS) * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const add = (src, at, from, len, g) => {
	for (let i = 0; i < len; i++) {
		const j = at + i, k = from + i;
		if (j >= N || k >= src.n) break;
		L[j] += src.L[k] * g;
		R[j] += src.R[k] * g;
	}
};
const bed = decode(bedFile);
add(bed, 0, 0, N, Number(vol));
for (const l of TL.lines) {
	const clip = decode(path.join('public', l.file));
	add(clip, Math.round((l.from / FPS) * SR), Math.round((l.trimStart / FPS) * SR), Math.round(((l.dur + 4) / FPS) * SR), 1);
}
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
const c = (x) => Math.round(Math.max(-1, Math.min(1, x)) * 32767);
for (let i = 0; i < N; i++) { buf.writeInt16LE(c(L[i]), 44 + i * 4); buf.writeInt16LE(c(R[i]), 46 + i * 4); }
fs.writeFileSync(outFile, buf);
console.log('mixed', TL.lines.length, 'lines,', (N / SR).toFixed(1), 's ->', outFile);
