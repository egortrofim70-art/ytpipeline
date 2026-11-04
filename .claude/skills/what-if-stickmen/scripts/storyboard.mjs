// One picture with many frames of the video (storyboard / contact sheet), via the Sheet
// composition — works the same on Windows and macOS.
//   node tools/storyboard.mjs Long                 one frame from the middle of every shot
//   node tools/storyboard.mjs Short --every 2.5    a frame every 2.5 s
//   node tools/storyboard.mjs Long --frames 40,300,910
// Output: out/storyboard_<Id>.jpg (open it and LOOK at it).
import path from 'node:path';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {ROOT, say} from './lib.mjs';

const require = createRequire(path.join(ROOT, 'package.json'));
const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill} = require('@remotion/renderer');
const args = process.argv.slice(2);
const comp = args[0] === 'Short' ? 'Short' : 'Long';
const every = Number(args[args.indexOf('--every') + 1]) || 0;
const list = args.includes('--frames') ? args[args.indexOf('--frames') + 1].split(',').map(Number) : null;

const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'index.ts')});
const target = await selectComposition({serveUrl, id: comp, chromiumOptions: {gl: 'angle'}});
let frames = list;
if (!frames && every) frames = Array.from({length: Math.floor(target.durationInFrames / (every * 30))}, (_, i) => Math.round((i + 0.5) * every * 30));
if (!frames) {
	// middle of every shot: read the plan report written by check-plans
	const rep = path.join(ROOT, 'out', '.plan-report.cjs');
	if (fs.existsSync(rep)) {
		const r = require(rep).report();
		const shots = new Map();
		for (const p of r.plans) if (!shots.has(p.shot)) shots.set(p.shot, p);
		frames = [...shots.values()].map((p) => p.start + 20);
		if (comp === 'Short' && r.mode === 'recut') frames = r.short.map((s) => s.start + Math.round(s.len / 2));
	} else frames = Array.from({length: 12}, (_, i) => Math.round(((i + 0.5) * target.durationInFrames) / 12));
}
frames = frames.filter((f) => f < target.durationInFrames);
const cols = comp === 'Long' ? (frames.length > 12 ? 5 : 4) : frames.length > 14 ? 8 : 6;
const props = {comp, frames, cols, title: `${comp} · ${frames.length} кадров`};
const sheet = await selectComposition({serveUrl, id: 'Sheet', inputProps: props, chromiumOptions: {gl: 'angle'}});
fs.mkdirSync(path.join(ROOT, 'out'), {recursive: true});
const output = path.join(ROOT, 'out', `storyboard_${comp}.jpg`);
await renderStill({composition: sheet, serveUrl, output, inputProps: props, imageFormat: 'jpeg', jpegQuality: 80, chromiumOptions: {gl: 'angle'}, timeoutInMilliseconds: 240000});
say(`storyboard: ${path.relative(ROOT, output)} (${frames.length} frames)`);
