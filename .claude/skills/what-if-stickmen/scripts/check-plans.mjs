// Checks the cut BEFORE rendering: no plan longer than 10 s (rule: a new framing every
// 3–10 s, ~5 s on average), shot list sane. Also writes src/story/auto-cues.json
// (whip moments and counter changes) that tools/make-sound.mjs turns into sound.
// node tools/check-plans.mjs
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {ROOT, say} from './lib.mjs';

const require = createRequire(path.join(ROOT, 'package.json'));
const esbuild = require('esbuild'); // ships with @remotion/bundler
const out = path.join(ROOT, 'out', '.plan-report.cjs');
fs.mkdirSync(path.dirname(out), {recursive: true});
await esbuild.build({
	entryPoints: [path.join(ROOT, 'src', 'kit', 'plan-report.ts')],
	bundle: true,
	platform: 'node',
	format: 'cjs',
	outfile: out,
	jsx: 'automatic',
	loader: {'.json': 'json'},
	logLevel: 'error',
});
const {report} = require(out);
const r = report();
fs.writeFileSync(path.join(ROOT, 'src', 'story', 'auto-cues.json'), JSON.stringify({whips: r.whips, counter: r.counter}));

const s = (fr) => (fr / 30).toFixed(1) + ' s';
const long = r.plans.filter((p) => p.len > 300);
const tiny = r.plans.filter((p) => p.len < 45 && !p.own);
const avg = r.plans.reduce((a, p) => a + p.len, 0) / Math.max(1, r.plans.length);
say(`plans: ${r.plans.length}, average ${s(avg)}, longest ${s(Math.max(...r.plans.map((p) => p.len)))}`);
let bad = 0;
for (const p of long) {
	bad++;
	say(`  TOO LONG: shot ${p.shot} (line ${p.at}) at ${s(p.start)} lasts ${s(p.len)}${p.own ? ' — own shot: add cuts inside it and list them in ownCuts' : ''}`);
}
for (const p of tiny) say(`  note: very short plan, shot ${p.shot} at ${s(p.start)} (${s(p.len)}) — fine for a punch, check it is not an accident`);
if (r.mode === 'recut') {
	for (const p of r.short.filter((x) => x.len > 300)) {
		bad++;
		say(`  TOO LONG in Short: segment ${p.line} at ${s(p.start)} lasts ${s(p.len)} — split it with a second segment (at: …)`);
	}
}
say(`whips: ${r.whips.length}, counter changes: ${r.counter.length} (sound cues written to src/story/auto-cues.json)`);
say(bad ? `FAIL: ${bad} plan(s) over 10 s` : 'OK: every plan is 10 s or shorter');
process.exit(bad ? 1 : 0);
