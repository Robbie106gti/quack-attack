import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const headEnd = html.indexOf('<script type="importmap">');
const shell =
  html.slice(0, headEnd) +
  `<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/"}}
</script>
<script type="module" src="src/main.js"></script>
</body>
</html>
`;

fs.renameSync(htmlPath, path.join(root, 'quack_attack_monolith.html'));
fs.writeFileSync(htmlPath, shell);
console.log('index.html shell:', shell.length, 'chars');
