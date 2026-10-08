import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { strToU8, zipSync } from 'fflate';

// Both versions receive these exact files. The only network target is the
// local probe receiver; this fixture contains no credentials or user data.
const directory = new URL('../../generated-output/evaluation-browser-fixtures/', import.meta.url);
await mkdir(directory, { recursive: true });
const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><title>Import evaluation</title>
<style>body{font:18px system-ui;margin:24px;color:#243d30}button{padding:12px}output{display:block;white-space:pre-wrap;margin-top:18px}</style></head>
<body><h1>Evaluation imported source</h1><p>नमस्ते 😀 é</p>
<button id="run">Run isolation check</button><output id="result" role="status">Ready</output>
<script>
let count=0;
document.getElementById('run').onclick=async()=>{
  let host='unexpectedly accessible';
  try { void parent.document.body; } catch { host='blocked'; }
  let network='unexpectedly allowed';
  try { await fetch('http://127.0.0.1:5186/evaluation-probe'); } catch { network='blocked'; }
  document.getElementById('result').textContent='Counter: '+(++count)+'; host: '+host+'; network: '+network;
};
</script></body></html>`;
const readme = '# Evaluation fixture\r\n\r\nKeep these bytes: नमस्ते 😀 é, "quotes", <literal> & CRLF.\r\n';
const entries = { 'index.html': html, 'README.md': readme };
const archive = values => zipSync(Object.fromEntries(Object.entries(values).map(([name, value]) => [name, strToU8(value)])), { level: 6 });
const files = {
  'source-with-fake-secrets.zip': archive({ ...entries, '.env.local': 'FAKE_EVALUATION_SENTINEL=exclude-me', 'credentials.txt': 'FAKE_EVALUATION_SENTINEL=exclude-me' }),
  'duplicate-paths.zip': archive({ 'index.html': '<h1>First</h1>', './index.html': '<h1>Second</h1>' }),
  'broken.zip': Buffer.from('This deliberately broken archive contains no real data.'),
  'python-source.zip': archive({ 'main.py': 'print("Not executed by this prototype")\n', 'README.md': '# Python evaluation\nSource is retained; runtime execution is not expected.\n' }),
};
const hashes = {};
for (const [name, bytes] of Object.entries(files)) {
  await writeFile(new URL(name, directory), bytes);
  hashes[name] = createHash('sha256').update(bytes).digest('hex');
}
await writeFile(new URL('expected-source.json', directory), JSON.stringify({ files: entries, fixtureHashes: hashes }, null, 2));
console.log(`Evaluation fixtures ready: ${fileURLToPath(directory)}`);
