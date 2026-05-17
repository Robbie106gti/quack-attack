import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.js') || f === 'state.js') continue;
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(/import \* as S from '\.\/state\.js';/g, "import { state } from './state.js';");
  s = s.replace(/\bS\./g, 'state.');
  fs.writeFileSync(p, s);
}
console.log('done');
