// Loudness: two-pass EBU R128 normalisation of the mix to -16 LUFS (YouTube-friendly),
// true peak -1.5 dB, then muxed onto a silent video WITHOUT re-encoding the picture.
//   node tools/loudness.mjs <mix.wav> <video.mp4> <out.mp4> [-16]
//   node tools/loudness.mjs --measure <file>        (just print loudness)
import {spawnSync} from 'node:child_process';
import {ffbin, say} from './lib.mjs';

const ff = ffbin();
const measure = (file, I = -16) => {
	const r = spawnSync(ff, ['-hide_banner', '-i', file, '-map', '0:a', '-af', `loudnorm=I=${I}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-'], {encoding: 'utf8', maxBuffer: 1 << 26});
	const m = (r.stderr || '').match(/\{[\s\S]*?\}/g);
	if (!m) throw new Error('loudness measure failed: ' + (r.stderr || '').slice(-400));
	return JSON.parse(m[m.length - 1]);
};

const args = process.argv.slice(2);
if (args[0] === '--measure') {
	const j = measure(args[1]);
	say(`loudness ${j.input_i} LUFS, true peak ${j.input_tp} dB`);
	process.exit(0);
}
const [mix, video, out, I = '-16'] = args;
const j = measure(mix, I);
const f = `loudnorm=I=${I}:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
const r = spawnSync(ff, ['-hide_banner', '-v', 'error', '-y', '-i', video, '-i', mix, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', f, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], {stdio: 'inherit'});
if (r.status !== 0) process.exit(r.status ?? 1);
const after = measure(out, I);
say(`sound: ${after.input_i} LUFS (target ${I}), peak ${after.input_tp} dB -> ${out}`);
