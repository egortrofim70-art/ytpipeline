// Shared helpers for the project tools. Every tool runs from the project folder:
//   node tools/<tool>.mjs ...
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync, execFileSync} from 'node:child_process';

export const ROOT = process.cwd();
export const FPS = 30;

/* ffmpeg/ffprobe ship inside Remotion's compositor package — no separate install */
export const ffbin = (name = 'ffmpeg') => {
	const base = path.join(ROOT, 'node_modules', '@remotion');
	if (!fs.existsSync(base)) throw new Error('Remotion is not installed here. Run setup first.');
	for (const d of fs.readdirSync(base)) {
		if (!d.startsWith('compositor-')) continue;
		for (const f of [name + '.exe', name]) {
			const p = path.join(base, d, f);
			if (fs.existsSync(p)) return p;
		}
	}
	throw new Error(name + ' not found in node_modules/@remotion/compositor-*');
};

export const isWin = process.platform === 'win32';
/* run a command, inherit output; resolves with exit code. Remotion and npm are started
   through node itself (no shell): no quoting problems with spaces in paths and no
   deprecation warnings on Windows. */
const remotionCli = () => path.join(ROOT, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
export const npmCli = () => {
	const p = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
	return fs.existsSync(p) ? p : null;
};
export const run = (cmd, args, opts = {}) =>
	new Promise((res) => {
		let c = cmd;
		let a = args;
		let shell = false;
		if (cmd === 'npx' && args[0] === 'remotion' && fs.existsSync(remotionCli())) {
			c = process.execPath;
			a = [remotionCli(), ...args.slice(1)];
		} else if (cmd === 'npm' && npmCli()) {
			c = process.execPath;
			a = [npmCli(), ...args];
		} else if (isWin && (cmd === 'npx' || cmd === 'npm')) {
			shell = true;
			a = args.map((x) => (/[\s&()]/.test(x) ? `"${x}"` : x));
		}
		const p = spawn(c, a, {stdio: opts.quiet ? 'pipe' : 'inherit', shell, cwd: opts.cwd ?? ROOT, env: {...process.env, ...(opts.env ?? {})}});
		let err = '';
		p.stderr?.on('data', (d) => (err += d));
		p.on('close', (code) => res(opts.quiet ? {code: code ?? 1, err} : code ?? 1));
	});
export const npx = (args, opts) => run('npx', args, opts);

/* decode any audio to mono/stereo 16-bit PCM via ffmpeg (wav to stdout) */
export const decodePcm = (file, {rate = 16000, channels = 1} = {}) => {
	const buf = execFileSync(ffbin(), ['-v', 'error', '-i', file, '-ac', String(channels), '-ar', String(rate), '-f', 'wav', '-'], {maxBuffer: 1 << 30});
	const d = buf.indexOf('data') + 8;
	const n = Math.floor((buf.length - d) / 2);
	const out = new Int16Array(n);
	for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(d + i * 2);
	return out;
};

/* tiny grayscale frames of a video, streamed through ffmpeg (for cut/flash/black checks) */
export const grayFrames = (file, w = 32, h = 18) => {
	const r = spawnSync(ffbin(), ['-v', 'error', '-i', file, '-an', '-vf', `scale=${w}:${h}`, '-pix_fmt', 'gray', '-c:v', 'rawvideo', '-f', 'image2pipe', '-'], {maxBuffer: 2 ** 32});
	const b = r.stdout;
	const S = w * h;
	const n = Math.floor(b.length / S);
	return {n, S, at: (f, i) => b[f * S + i], buf: b};
};

export const probe = (file) => {
	const r = spawnSync(ffbin('ffprobe'), ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height', '-of', 'json', file], {encoding: 'utf8'});
	return JSON.parse(r.stdout || '{}');
};

export const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
export const writeJson = (p, v) => fs.writeFileSync(path.join(ROOT, p), JSON.stringify(v, null, 1));
export const say = (...a) => console.log(...a);
