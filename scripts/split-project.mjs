import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptMatch = html.match(/<script type="module">\s*([\s\S]*?)\s*<\/script>/);
if (!scriptMatch) throw new Error('no module script');
let js = scriptMatch[1];
js = js.replace(/^import[^\n]+\n/gm, '');

const b64Match = js.match(/const GLB_B64='([^']+)'/);
if (!b64Match) throw new Error('no GLB_B64');
const publicDir = path.join(root, 'public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'duck.glb'), Buffer.from(b64Match[1], 'base64'));
console.log('duck.glb', Buffer.from(b64Match[1], 'base64').length, 'bytes');

js = js.replace(/const GLB_B64='[^']+';\s*/, '');
fs.writeFileSync(path.join(root, '_extracted.js'), js);
console.log('extracted', js.length, 'chars', js.split('\n').length, 'lines');
