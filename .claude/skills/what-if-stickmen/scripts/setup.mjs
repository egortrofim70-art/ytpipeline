// Creates (or updates the tools of) a video project and checks that everything works.
//   node <skill>/scripts/setup.mjs <projectDir>
// - copies template/ into the project (only if the folder has no project yet),
// - copies the tools (this folder) into <project>/tools (always: keeps them current),
// - npm install, downloads the headless browser Remotion renders with,
// - makes sure the story timeline matches the voice clips,
// - renders one test frame of the reference scene with the GPU (ANGLE) to prove it works.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = path.dirname(here);
const project = path.resolve(process.argv[2] ?? process.cwd());
const log = (s) => console.log(s);
// node-run helpers: no shell, so spaces/non-latin letters in paths are safe and no warnings
const npmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
const node = (args, quiet) => spawnSync(process.execPath, args, {cwd: project, stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8'});
const remotion = (args, quiet) => node([path.join(project, 'node_modules', '@remotion', 'cli', 'remotion-cli.js'), ...args], quiet);

const [maj] = process.versions.node.split('.').map(Number);
if (maj < 18) {
	log(`Node ${process.versions.node} is too old (need 18+). Run scripts/setup.ps1 (Windows) or scripts/setup.sh (macOS) to get a fresh one.`);
	process.exit(1);
}
fs.mkdirSync(project, {recursive: true});
const fresh = !fs.existsSync(path.join(project, 'package.json'));
if (fresh) {
	fs.cpSync(path.join(skill, 'template'), project, {recursive: true, filter: (s) => !s.includes('node_modules')});
	log('project created from the template');
}
fs.mkdirSync(path.join(project, 'tools'), {recursive: true});
for (const f of fs.readdirSync(here)) if (f.endsWith('.mjs') && f !== 'setup.mjs') fs.copyFileSync(path.join(here, f), path.join(project, 'tools', f));

if (!fs.existsSync(path.join(project, 'node_modules', 'remotion'))) {
	log('installing packages (1–3 min)…');
	const args = ['install', '--no-audit', '--no-fund', '--loglevel=error'];
	const r = fs.existsSync(npmCli) ? node([npmCli, ...args]) : spawnSync('npm', args, {cwd: project, stdio: 'inherit', shell: process.platform === 'win32'});
	if (r.status !== 0) process.exit(r.status ?? 1);
}
remotion(['browser', 'ensure'], true);

// the story timeline must exist and match the clips, otherwise nothing bundles
const tl = path.join(project, 'src', 'story', 'timeline.json');
let lines = 0;
try {
	lines = JSON.parse(fs.readFileSync(tl, 'utf8')).lines.length;
} catch {}
if (!lines) {
	const r = node([path.join(project, 'tools', 'prep-timeline.mjs')], true);
	if (r.status !== 0) log('note: timeline not built yet (no voice clips) — run tools/prep-timeline.mjs after the voice step');
}

// prove it: one frame of the reference scene, GPU on
fs.mkdirSync(path.join(project, 'out'), {recursive: true});
const test = remotion(['still', 'Reference', 'out/setup-check.jpg', '--frame=150', '--gl=angle', '--log=error'], true);
if (test.status !== 0) {
	log('test frame with GPU failed, trying without GPU…');
	const t2 = remotion(['still', 'Reference', 'out/setup-check.jpg', '--frame=150', '--log=error'], true);
	if (t2.status !== 0) {
		log((test.stderr || '') + (t2.stderr || ''));
		process.exit(1);
	}
	log('WARNING: GPU rendering (ANGLE) is unavailable here — rendering will be much slower.');
}
log(`READY: ${project} — Node ${process.versions.node}, Remotion, fonts Rubik/Caveat (OFL), free voices, tools/ (test frame: out/setup-check.jpg)`);
