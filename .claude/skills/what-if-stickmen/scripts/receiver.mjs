// Tiny local sink for browser-side downloads: POST raw bytes to
// http://localhost:7777/save?name=<file> and they land in public/vo/.
// node tools/receiver.mjs [folder] [port] — e.g. `node tools/receiver.mjs out 7788` for thumbnails.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] ?? path.join('public', 'vo'));
const PORT = Number(process.argv[3] ?? 7777);
fs.mkdirSync(OUT, {recursive: true});

http
	.createServer((req, res) => {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', '*');
		res.setHeader('Access-Control-Allow-Private-Network', 'true');
		if (req.method === 'OPTIONS') return res.end();
		const url = new URL(req.url, 'http://x');
		const name = path.basename(url.searchParams.get('name') || `clip_${Date.now()}.mp3`);
		const chunks = [];
		req.on('data', (c) => chunks.push(c));
		req.on('end', () => {
			const buf = Buffer.concat(chunks);
			fs.writeFileSync(path.join(OUT, name), buf);
			console.log('saved', name, buf.length);
			res.end(JSON.stringify({ok: true, name, bytes: buf.length}));
		});
	})
	.listen(PORT, () => console.log('receiver on', PORT, '->', OUT));
