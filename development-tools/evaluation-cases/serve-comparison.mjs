import http from 'node:http';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, sep, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Serve only the two disconnected builds from a recorded evaluation run.
// The third port receives the harmless preview-isolation probe, if it escapes.
const repository = fileURLToPath(new URL('../../', import.meta.url));
const evaluationRoot = resolve(repository, 'generated-output/evaluations');
const runDirectory = resolve(process.argv[2] || '');
if (!runDirectory.startsWith(evaluationRoot + sep)) {
  throw new Error('Pass a run directory inside generated-output/evaluations/.');
}

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json' };
const probe = { startedAt: new Date().toISOString(), requests: [] };
const saveProbe = () => writeFileSync(join(runDirectory, 'network-probe.json'), JSON.stringify(probe, null, 2));
saveProbe();

for (const [folder, port] of [['before-site', 5184], ['after-site', 5185]]) {
  const site = resolve(runDirectory, folder);
  if (!existsSync(join(site, 'index.html'))) throw new Error(`Build missing: ${folder}`);
  const server = http.createServer((request, response) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400).end(); return; }
    let file = resolve(site, '.' + pathname);
    if (file !== site && !file.startsWith(site + sep)) { response.writeHead(403).end(); return; }
    if (file === site || (!existsSync(file) && !extname(pathname))) file = join(site, 'index.html');
    if (!existsSync(file) || !statSync(file).isFile()) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(readFileSync(file));
  });
  server.on('error', error => { console.error(error.message); process.exit(1); });
  server.listen(port, '127.0.0.1', () => console.log(`${folder}: http://127.0.0.1:${port}/`));
}

const receiver = http.createServer((request, response) => {
  if (request.url === '/evaluation-probe') {
    probe.requests.push({ at: new Date().toISOString(), method: request.method });
    saveProbe();
  }
  response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  response.end(JSON.stringify({ received: probe.requests.length }));
});
receiver.on('error', error => { console.error(error.message); process.exit(1); });
receiver.listen(5186, '127.0.0.1', () => console.log('Isolation probe receiver: http://127.0.0.1:5186/health'));
