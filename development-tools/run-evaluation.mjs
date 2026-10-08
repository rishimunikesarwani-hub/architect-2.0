import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Both variants use local files and the same installed dependencies. This runner
// never invokes npm install, a Convex client, a deployment command or a browser.
const repository = fileURLToPath(new URL('../', import.meta.url));
const baseline = join(repository, 'generated-output/refactor-backups/2026-10-07-before-folder-cleanup');
const evaluationRoot = join(repository, 'generated-output/evaluations');
const sharedCasePath = join(repository, 'development-tools/evaluation-cases/backend-scenarios.test.ts');
const require = createRequire(import.meta.url);
const expectedBaselineFiles = 99;
const expectedExistingTests = 88;
const expectedSharedTests = 5;
const sourceRoots = new Set([
  'application', 'automated-tests', 'development-tools', 'documentation',
  'verification-records', 'sample-projects',
]);
const omittedDirectories = new Set([
  'node_modules', '.git', '.vercel', '.codex', 'generated-output', 'runs',
  'coverage', 'secrets', '.secrets', 'credentials', '.credentials',
]);

const slash = value => value.split(sep).join('/');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const local = value => slash(relative(repository, value));

function requireInside(parent, target) {
  const difference = relative(parent, target);
  if (!difference || difference.startsWith(`..${sep}`) || difference === '..' || isAbsolute(difference)) {
    throw new Error(`Expected a child path inside ${parent}: ${target}`);
  }
  return target;
}

function exclusion(path) {
  const segments = slash(path).split('/');
  if (segments.some(segment => segment.toLowerCase().startsWith('.env'))) return 'environment file';
  if (segments.some(segment => omittedDirectories.has(segment.toLowerCase()))) return 'private/generated/dependency directory';
  if (/\.(pem|key|p12|pfx|jks|keystore)$/i.test(path)) return 'credential material';
  if (/^(credentials?|secrets?)(?:[._-]|$)/i.test(basename(path))) return 'credential material';
  return null;
}

async function readJson(path) {
  return JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
}

async function sourceManifest(root, paths) {
  const files = [];
  for (const path of [...paths].sort()) {
    const content = await readFile(requireInside(root, resolve(root, path)));
    files.push({ path: slash(path), bytes: content.length, sha256: sha256(content) });
  }
  return { files, aggregateSha256: sha256(json(files)) };
}

async function verifyBaseline() {
  const manifest = await readJson(join(baseline, 'backup-manifest.json'));
  if (manifest.files?.length !== expectedBaselineFiles) {
    throw new Error(`Expected ${expectedBaselineFiles} recorded baseline files, found ${manifest.files?.length}.`);
  }
  const actual = await sourceManifest(baseline, manifest.files.map(file => file.path));
  for (const file of actual.files) {
    const recorded = manifest.files.find(item => item.path === file.path);
    if (file.sha256 !== recorded.sha256.toLowerCase()) throw new Error(`Baseline integrity mismatch: ${file.path}`);
  }
  return { ...actual, originalManifestSha256: sha256(await readFile(join(baseline, 'backup-manifest.json'))) };
}

async function currentSourcePaths() {
  const paths = [];
  const excluded = [];
  async function walk(directory, prefix = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      const reason = exclusion(path);
      if (reason) { excluded.push({ path, reason }); continue; }
      if (entry.isSymbolicLink()) { excluded.push({ path, reason: 'symlink not followed' }); continue; }
      if (entry.isDirectory()) {
        if (!prefix && !sourceRoots.has(entry.name)) {
          excluded.push({ path, reason: 'outside authored source roots' });
          continue;
        }
        await walk(join(directory, entry.name), path);
      } else if (entry.isFile()) paths.push(path);
    }
  }
  await walk(repository);
  return { paths, excluded };
}

async function copySnapshot(source, destination, paths) {
  await mkdir(destination);
  const startedAt = new Date().toISOString();
  const files = [];
  for (const path of [...paths].sort()) {
    if (exclusion(path)) throw new Error(`Excluded path reached copy operation: ${path}`);
    const from = requireInside(source, resolve(source, path));
    const to = requireInside(destination, resolve(destination, path));
    const content = await readFile(from);
    await mkdir(dirname(to), { recursive: true });
    await writeFile(to, content, { flag: 'wx' });
    files.push({ path: slash(path), bytes: content.length, sha256: sha256(content) });
  }
  return { startedAt, finishedAt: new Date().toISOString(), files, aggregateSha256: sha256(json(files)) };
}

function canonicalPath(path) {
  return slash(path)
    .replace(/^src\/components\//, 'application/interface-components/')
    .replace(/^src\/lib\//, 'application/shared-logic/')
    .replace(/^src\/convex\//, 'application/backend/')
    .replace(/^src\//, 'application/')
    .replace(/^tests\//, 'automated-tests/');
}

function normalizeImports(source) {
  // Only module specifiers change here. UI copy, other string literals and
  // formatting remain visible as differences, rather than being normalized away.
  const migrate = value => value
    .replace(/(^|\/)src(?=\/)/g, '$1application')
    .replace(/(^|\/)components(?=\/)/g, '$1interface-components')
    .replace(/(^|\/)lib(?=\/)/g, '$1shared-logic')
    .replace(/(^|\/)convex(?=\/)/g, '$1backend');
  return source.replaceAll('\r\n', '\n').replace(
    /((?:\bfrom\s*|\bimport\s*|\bimport\s*\(\s*|import\.meta\.glob\s*\(\s*)['"])([^'"]+)(['"])/g,
    (_, opening, specifier, closing) => `${opening}${specifier.startsWith('.') ? migrate(specifier) : specifier}${closing}`,
  );
}

async function compareSources(variants) {
  const relevant = path => /^(src|application|tests|automated-tests)\//.test(path)
    && /\.(tsx?|jsx?|css|html)$/.test(path) && !/\/(public|public-assets)\//.test(path);
  const before = new Map(variants.before.source.files.filter(file => relevant(file.path)).map(file => [canonicalPath(file.path), file]));
  const after = new Map(variants.after.source.files.filter(file => relevant(file.path)).map(file => [canonicalPath(file.path), file]));
  const result = { method: 'Canonical folder mapping; CRLF normalized; module-import specifiers only normalized. No whitespace, UI text or logic normalization.', identicalBytes: [], importPathOnly: [], changedBeyondImportPaths: [], added: [], removed: [] };
  for (const [path, previous] of before) {
    const current = after.get(path);
    if (!current) { result.removed.push(path); continue; }
    if (previous.sha256 === current.sha256) { result.identicalBytes.push(path); continue; }
    const [a, b] = await Promise.all([
      readFile(join(variants.before.directory, previous.path), 'utf8'),
      readFile(join(variants.after.directory, current.path), 'utf8'),
    ]);
    if (normalizeImports(a) === normalizeImports(b)) result.importPathOnly.push(path);
    else result.changedBeyondImportPaths.push({ path, beforeSha256: previous.sha256, afterSha256: current.sha256 });
  }
  for (const path of after.keys()) if (!before.has(path)) result.added.push(path);
  return result;
}

async function dependencyBaseline() {
  const [beforeLock, afterLock, installedLockBytes] = await Promise.all([
    readFile(join(baseline, 'package-lock.json')), readFile(join(repository, 'package-lock.json')),
    readFile(join(repository, 'node_modules/.package-lock.json')),
  ]);
  if (sha256(beforeLock) !== sha256(afterLock)) throw new Error('Before/after package-lock.json hashes differ. Use matching installed dependencies before comparing.');
  const lock = JSON.parse(afterLock);
  const installedLock = JSON.parse(installedLockBytes);
  for (const [path, installed] of Object.entries(installedLock.packages)) {
    const expected = lock.packages[path];
    if (!expected || installed.version !== expected.version || (installed.integrity && installed.integrity !== expected.integrity)) {
      throw new Error(`Installed lock entry does not match the shared source lock: ${path}`);
    }
  }
  const manifest = await readJson(join(repository, 'package.json'));
  const direct = [];
  for (const name of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).sort()) {
    const installed = await readJson(join(repository, 'node_modules', name, 'package.json'));
    if (installed.version !== lock.packages[`node_modules/${name}`]?.version) throw new Error(`Installed direct dependency mismatch: ${name}`);
    direct.push({ name, version: installed.version });
  }
  return {
    sharedLockSha256: sha256(afterLock), installedLockSha256: sha256(installedLockBytes),
    installedPackagesChecked: Object.keys(installedLock.packages).length, direct,
    location: 'Existing repository node_modules, resolved through ancestor directories; no copies, installation or dependency mutation requested.',
  };
}

function childEnvironment() {
  // Use an allowlist rather than guessing every possible provider-secret name.
  const keep = /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|OS|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i;
  return {
    ...Object.fromEntries(Object.entries(process.env).filter(([name]) => keep.test(name))),
    CI: 'true', FORCE_COLOR: '0', NO_COLOR: '1', NODE_ENV: 'test',
  };
}

async function executable(packageName, name) {
  const packagePath = require.resolve(`${packageName}/package.json`);
  const manifest = await readJson(packagePath);
  const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[name];
  if (!bin) throw new Error(`Missing installed executable: ${packageName}/${name}`);
  return resolve(dirname(packagePath), bin);
}

async function runStep(variant, name, arguments_, env, guardPath) {
  const logPath = join(variant.directory, '..', `${variant.name}-${name}.log`);
  const startedAt = new Date().toISOString();
  const started = performance.now();
  console.log(`[${variant.name}] ${name}`);
  const output = createWriteStream(logPath, { flags: 'wx' });
  const args = ['--import', pathToFileURL(guardPath).href, ...arguments_];
  const child = spawn(process.execPath, args, {
    cwd: variant.directory, env: { ...env, ARCHITECT_EVALUATION_VARIANT: variant.name },
    shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => output.write(chunk));
  child.stderr.on('data', chunk => output.write(chunk));
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; child.kill(); }, 300_000);
  const result = await new Promise(resolveResult => {
    child.once('error', error => resolveResult({ exitCode: null, error: error.message }));
    child.once('close', (exitCode, signal) => resolveResult({ exitCode, signal }));
  });
  clearTimeout(timeout);
  await new Promise(resolveOutput => output.end(resolveOutput));
  const step = {
    name, startedAt, finishedAt: new Date().toISOString(), durationMs: Math.round(performance.now() - started),
    ...result, timedOut, passed: result.exitCode === 0 && !timedOut,
    command: [process.execPath, ...args], cwd: local(variant.directory), log: local(logPath),
  };
  variant.steps.push(step);
  console.log(`[${variant.name}] ${name}: ${step.passed ? 'PASS' : 'FAIL'} (${step.durationMs} ms; diagnostic timing only)`);
  return step;
}

async function testSummary(variant) {
  try {
    const result = await readJson(variant.testReport);
    const cases = result.testResults.flatMap(file => file.assertionResults.map(test => ({
      file: canonicalPath(slash(relative(variant.directory, file.name))),
      name: test.fullName || [...test.ancestorTitles, test.title].join(' '),
      status: test.status, failureMessages: test.failureMessages,
    }))).sort((a, b) => `${a.file}:${a.name}`.localeCompare(`${b.file}:${b.name}`));
    const shared = cases.filter(test => test.file.endsWith('/evaluation-backend-scenarios.test.ts'));
    const uniqueCount = new Set(cases.map(test => `${test.file} :: ${test.name}`)).size;
    const existingCount = cases.length - shared.length;
    return {
      success: result.success, allCasesPassed: cases.length > 0 && cases.every(test => test.status === 'passed'),
      total: result.numTotalTests, passed: result.numPassedTests,
      failed: result.numFailedTests, pending: result.numPendingTests,
      existingCount, sharedCount: shared.length, uniqueCount,
      expectedExistingCount: variant.name === 'before' ? expectedExistingTests : null,
      minimumExistingCount: expectedExistingTests, expectedSharedCount: expectedSharedTests,
      countMatches: uniqueCount === cases.length && cases.length === result.numTotalTests
        && (variant.name === 'before' ? existingCount === expectedExistingTests : existingCount >= expectedExistingTests)
        && shared.length === expectedSharedTests,
      report: local(variant.testReport), cases,
    };
  } catch (error) { return { success: false, error: error.message, cases: [] }; }
}

export function compareTests(before, after, { allowAdditionalAfterCases = false } = {}) {
  const key = test => `${test.file} :: ${test.name}`;
  const a = new Map(before.cases.map(test => [key(test), test.status]));
  const b = new Map(after.cases.map(test => [key(test), test.status]));
  const added = [...b.keys()].filter(name => !a.has(name)).sort().map(name => ({ name, status: b.get(name) }));
  const removed = [...a.keys()].filter(name => !b.has(name)).sort().map(name => ({ name, status: a.get(name) }));
  const statusChanges = [...a.keys()].filter(name => b.has(name) && a.get(name) !== b.get(name)).sort()
    .map(name => ({ name, before: a.get(name), after: b.get(name) }));
  const uniqueNames = a.size === before.cases.length && b.size === after.cases.length;
  const allCasesPassed = [...a.values(), ...b.values()].every(status => status === 'passed');
  const baselineCasesPreserved = a.size > 0 && uniqueNames && removed.length === 0 && statusChanges.length === 0;
  return {
    policy: allowAdditionalAfterCases ? 'Every baseline test must remain and pass; additional after tests must also pass.' : 'Exact same unique test names and passing statuses required.',
    sameNamesAndStatuses: baselineCasesPreserved && added.length === 0,
    baselineCasesPreserved, allCasesPassed, uniqueNames,
    comparisonPassed: baselineCasesPreserved && allCasesPassed && (allowAdditionalAfterCases || added.length === 0),
    beforeCount: a.size, afterCount: b.size, added, removed, statusChanges,
  };
}

async function builtArtifacts(directory) {
  const paths = [];
  async function walk(current, prefix = '') {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(join(current, entry.name), path);
      else if (entry.isFile()) paths.push(path);
    }
  }
  await walk(directory);
  const manifest = await sourceManifest(directory, paths);
  const connectedUrls = [];
  for (const file of manifest.files.filter(file => /\.(js|html)$/.test(file.path))) {
    const content = await readFile(join(directory, file.path), 'utf8');
    if (/https:\/\/[a-z0-9-]+\.convex\.(cloud|site)\b/i.test(content)) connectedUrls.push(file.path);
  }
  return { ...manifest, connectedConvexUrlFiles: connectedUrls };
}

async function writeDrivers(runRoot) {
  const guardPath = join(runRoot, 'network-guard.mjs');
  await writeFile(guardPath, `import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { appendFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
const denied = () => { throw new Error('External network is disabled for the isolated refactor evaluation.'); };
net.Socket.prototype.connect = denied;
http.request = denied; http.get = denied;
https.request = denied; https.get = denied;
globalThis.fetch = denied;
globalThis.WebSocket = class { constructor() { denied(); } };
syncBuiltinESMExports();
appendFileSync(new URL('./network-guard-events.jsonl', import.meta.url), JSON.stringify({
  at: new Date().toISOString(), pid: process.pid,
  variant: process.env.ARCHITECT_EVALUATION_VARIANT,
  entry: process.argv[1], socketGuard: net.Socket.prototype.connect === denied,
}) + '\\n');
`, { flag: 'wx' });
  const buildPath = join(runRoot, 'build-variant.mjs');
  await writeFile(buildPath, `import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const options = JSON.parse(await readFile(process.argv[2], 'utf8'));
for (const name of Object.keys(process.env)) {
  if (name.startsWith('VITE_') || /^(CONVEX|SITE_URL|BETTER_AUTH|GOOGLE)/.test(name)) delete process.env[name];
}
const { build } = await import(pathToFileURL(options.viteEntry).href);
await build({
  configFile: options.configFile,
  root: options.root,
  envDir: options.emptyEnv,
  publicDir: options.publicDir,
  define: {
    'import.meta.env.VITE_CONVEX_URL': JSON.stringify(''),
    'import.meta.env.VITE_CONVEX_SITE_URL': JSON.stringify(''),
    'import.meta.env.VITE_SITE_URL': JSON.stringify(''),
  },
  build: { outDir: options.outDir, emptyOutDir: false },
});
`, { flag: 'wx' });
  return { guardPath, buildPath };
}

async function main() {
  if (process.argv.length > 2) throw new Error('This runner accepts no arguments; its baseline and output boundaries are fixed.');
  await mkdir(evaluationRoot, { recursive: true });
  const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
  const runRoot = requireInside(evaluationRoot, join(evaluationRoot, `${timestamp}-${process.pid}`));
  await mkdir(runRoot);
  const reportPath = join(runRoot, 'report.json');
  const report = {
    schemaVersion: 1, startedAt: new Date().toISOString(), status: 'preparing', runRoot: local(runRoot),
    scope: 'Before/after local evaluation: source integrity, typechecks, all 88 baseline tests plus 5 shared scenarios, any additional after-version tests, and disconnected guest builds. Every baseline case must remain and pass; all added cases must pass. No live authentication, deployment, browser acceptance, production performance or latency improvement claim.',
    runtime: { node: process.version, platform: process.platform, architecture: process.arch, executable: process.execPath },
    environment: { copiedEnvFiles: false, inheritedCredentials: false, envPolicy: 'OS execution allowlist only; no VITE/Convex/provider variables inherited.', networkPolicy: 'Node socket and HTTP(S) guards are explicitly loaded in command processes and Vitest workers. Entry globals also block fetch/WebSocket; VM globals may differ but use the guarded socket layer. This is not an OS-level network sandbox.' },
    variants: {},
  };
  console.log(`Evaluation directory: ${runRoot}`);
  const persist = () => writeFile(reportPath, json(report));
  try {
    report.baselineIntegrityBefore = await verifyBaseline();
    report.dependencies = await dependencyBaseline();
    const cases = await readFile(sharedCasePath, 'utf8');
    report.sharedCases = { source: local(sharedCasePath), sha256: sha256(cases), expectedTests: expectedSharedTests };
    const current = await currentSourcePaths();
    const beforePaths = report.baselineIntegrityBefore.files.map(file => file.path);
    const excludedBefore = beforePaths.filter(path => exclusion(path)).map(path => ({ path, reason: exclusion(path) }));
    const variantDefinitions = [
      { name: 'before', sourceRoot: baseline, paths: beforePaths.filter(path => !exclusion(path)), excluded: excludedBefore, tools: 'ops', sourceFolder: 'src', backend: 'src/convex', tests: 'tests', public: 'src/public' },
      { name: 'after', sourceRoot: repository, paths: current.paths, excluded: current.excluded, tools: 'development-tools', sourceFolder: 'application', backend: 'application/backend', tests: 'automated-tests', public: 'generated-output/public-assets' },
    ];
    for (const definition of variantDefinitions) {
      const directory = join(runRoot, definition.name);
      const source = await copySnapshot(definition.sourceRoot, directory, definition.paths);
      const sharedContent = definition.name === 'before' ? cases
        .replaceAll('../application/backend/', '../src/convex/')
        .replaceAll('../application/shared-logic/', '../src/lib/')
        .replaceAll('../application/', '../src/') : cases;
      const sharedDestination = join(definition.tests, 'evaluation-backend-scenarios.test.ts');
      await writeFile(join(directory, sharedDestination), sharedContent, { flag: 'wx' });
      const variant = {
        name: definition.name, directory, sourceOrigin: local(definition.sourceRoot), source,
        excluded: definition.excluded, tools: definition.tools, sourceFolder: definition.sourceFolder,
        backend: definition.backend, testsFolder: definition.tests, publicFolder: definition.public,
        injectedSharedSuite: { path: slash(sharedDestination), sha256: sha256(sharedContent), adaptation: definition.name === 'before' ? 'Historical module paths only: application/backend -> src/convex; application/shared-logic -> src/lib; application -> src.' : 'None.' },
        steps: [], testReport: join(runRoot, `${definition.name}-vitest.json`), site: join(runRoot, `${definition.name}-site`),
      };
      report.variants[definition.name] = variant;
      await writeFile(join(runRoot, `${definition.name}-source-manifest.json`), json(source));
    }
    report.sourceComparison = await compareSources(report.variants);
    const emptyEnv = join(runRoot, 'empty-env');
    await mkdir(emptyEnv);
    const { guardPath, buildPath } = await writeDrivers(runRoot);
    const [tsc, vitest] = await Promise.all([executable('typescript', 'tsc'), executable('vitest', 'vitest')]);
    const env = childEnvironment();
    report.status = 'running';
    await persist();
    // Deliberately sequential. Variant B never competes with variant A for CPU.
    // Durations are troubleshooting metadata, not a controlled benchmark.
    for (const variant of Object.values(report.variants)) {
      await runStep(variant, 'typecheck-frontend', [tsc, '--project', join(variant.tools, 'tsconfig.json'), '--noEmit'], env, guardPath);
      await runStep(variant, 'typecheck-backend', [tsc, '--project', join(variant.backend, 'tsconfig.json'), '--noEmit'], env, guardPath);
      await runStep(variant, 'tests', [
        vitest, 'run', '--config', join(variant.tools, 'vitest.config.ts'),
        '--execArgv=--import', `--execArgv=${pathToFileURL(guardPath).href}`,
        '--reporter=json', `--outputFile=${variant.testReport}`,
      ], env, guardPath);
      variant.testResults = await testSummary(variant);
      const sync = await runStep(variant, 'sync-public-assets', [join(variant.directory, variant.tools, 'sync-diagram.mjs')], env, guardPath);
      if (sync.passed) {
        const buildOptions = {
          viteEntry: require.resolve('vite'), configFile: join(variant.directory, variant.tools, 'vite.config.ts'),
          root: join(variant.directory, variant.sourceFolder), emptyEnv,
          publicDir: join(variant.directory, variant.publicFolder), outDir: variant.site,
        };
        const optionsPath = join(runRoot, `${variant.name}-build-options.json`);
        await writeFile(optionsPath, json(buildOptions));
        const build = await runStep(variant, 'build', [buildPath, optionsPath], { ...env, NODE_ENV: 'production' }, guardPath);
        if (build.passed) variant.artifacts = await builtArtifacts(variant.site);
      }
      await persist();
    }
    report.testComparison = compareTests(report.variants.before.testResults, report.variants.after.testResults, { allowAdditionalAfterCases: true });
    const guardEvents = (await readFile(join(runRoot, 'network-guard-events.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    report.environment.workerGuardEvidence = Object.fromEntries(['before', 'after'].map(name => [name,
      guardEvents.filter(event => event.variant === name && event.socketGuard && /vitest[\\/]dist[\\/]workers[\\/]/.test(event.entry ?? '')),
    ]));
    report.environment.networkAudit = local(join(runRoot, 'network-guard-events.jsonl'));
    const assetHashes = (variant, extension) => (variant.artifacts?.files ?? []).filter(file => file.path.endsWith(extension)).map(file => file.sha256).sort();
    report.bundleComparison = {
      cssHashesIdentical: JSON.stringify(assetHashes(report.variants.before, '.css')) === JSON.stringify(assetHashes(report.variants.after, '.css')),
      javascriptHashesIdentical: JSON.stringify(assetHashes(report.variants.before, '.js')) === JSON.stringify(assetHashes(report.variants.after, '.js')),
      meaning: 'Exact emitted-byte comparison only. Differing asset hashes do not establish a behavioral regression; matching hashes do not replace browser acceptance.',
    };
    report.baselineIntegrityAfter = await verifyBaseline();
    if (report.baselineIntegrityBefore.aggregateSha256 !== report.baselineIntegrityAfter.aggregateSha256) throw new Error('The immutable baseline changed during evaluation.');
    const dependenciesAfter = await dependencyBaseline();
    if (dependenciesAfter.installedLockSha256 !== report.dependencies.installedLockSha256) throw new Error('Installed dependency metadata changed during evaluation.');
    report.passed = Object.values(report.variants).every(variant =>
      variant.steps.length === 5 && variant.steps.every(step => step.passed)
      && variant.testResults.success && variant.testResults.countMatches && variant.testResults.allCasesPassed
      && variant.testResults.pending === 0 && variant.testResults.failed === 0
      && variant.testResults.passed === variant.testResults.total
      && report.environment.workerGuardEvidence[variant.name].length > 0
      && variant.artifacts?.connectedConvexUrlFiles.length === 0)
      && report.testComparison.comparisonPassed;
    report.status = report.passed ? 'passed' : 'failed';
  } catch (error) {
    report.status = 'failed'; report.passed = false;
    report.error = { message: error.message, stack: error.stack };
  } finally {
    report.finishedAt = new Date().toISOString();
    await persist();
    console.log(`Evaluation ${report.status.toUpperCase()}: ${runRoot}`);
    console.log(`Machine report: ${reportPath}`);
    for (const variant of Object.values(report.variants)) {
      console.log(`${variant.name}: ${variant.testResults?.passed ?? 0}/${variant.testResults?.total ?? 0} tests; site: ${variant.site}`);
    }
    if (!report.passed) process.exitCode = 1;
  }
}

// Recheck an existing comparison after a runner-only guard correction. Keeping
// this separate preserves the exact browser builds currently under evaluation.
export async function recheckTestWorkers(runDirectory) {
  const runRoot = requireInside(evaluationRoot, resolve(runDirectory));
  const reportPath = join(runRoot, 'report.json');
  const report = await readJson(reportPath);
  if (resolve(repository, report.runRoot) !== runRoot) throw new Error('Recorded evaluation directory does not match the requested run.');
  const reviewRoot = join(runRoot, `worker-guard-review-${Date.now()}`);
  await mkdir(reviewRoot);
  const review = {
    reason: 'Vitest does not inherit the parent --import flag. Explicit worker execArgv now loads the socket guard. Only tests are rerun; snapshots and browser builds are preserved.',
    startedAt: new Date().toISOString(), runnerSha256: sha256(await readFile(fileURLToPath(import.meta.url))),
    directory: local(reviewRoot), variants: {},
  };
  report.testWorkerGuardReview = review;
  try {
    const { guardPath } = await writeDrivers(reviewRoot);
    const vitest = await executable('vitest', 'vitest');
    for (const previous of Object.values(report.variants)) {
      const variant = { ...previous, steps: [], testReport: join(reviewRoot, `${previous.name}-vitest.json`) };
      const step = await runStep(variant, `tests-worker-guard-${basename(reviewRoot)}`, [
        vitest, 'run', '--config', join(variant.tools, 'vitest.config.ts'),
        '--execArgv=--import', `--execArgv=${pathToFileURL(guardPath).href}`,
        '--reporter=json', `--outputFile=${variant.testReport}`,
      ], childEnvironment(), guardPath);
      const tests = await testSummary(variant);
      const artifacts = await builtArtifacts(previous.site);
      review.variants[variant.name] = {
        step, tests, sameTestNamesAndStatuses: compareTests(previous.testResults, tests).sameNamesAndStatuses,
        browserArtifactsUnchanged: artifacts.aggregateSha256 === previous.artifacts.aggregateSha256,
      };
    }
    const events = (await readFile(join(reviewRoot, 'network-guard-events.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
    review.workerEvidence = Object.fromEntries(['before', 'after'].map(name => [name,
      events.filter(event => event.variant === name && event.socketGuard && /vitest[\\/]dist[\\/]workers[\\/]/.test(event.entry ?? '')),
    ]));
    review.networkAudit = local(join(reviewRoot, 'network-guard-events.jsonl'));
    review.baselineStillUnchanged = (await verifyBaseline()).aggregateSha256 === report.baselineIntegrityBefore.aggregateSha256;
    review.dependenciesStillUnchanged = (await dependencyBaseline()).installedLockSha256 === report.dependencies.installedLockSha256;
    review.passed = Object.entries(review.variants).every(([name, result]) =>
      result.step.passed && result.tests.success && result.tests.countMatches && result.tests.allCasesPassed
      && result.tests.pending === 0 && result.tests.failed === 0 && result.tests.passed === result.tests.total
      && result.sameTestNamesAndStatuses && result.browserArtifactsUnchanged && review.workerEvidence[name].length > 0)
      && review.baselineStillUnchanged && review.dependenciesStillUnchanged;
    report.environment.networkPolicy = 'The original command guard did not propagate into Vitest workers. This review reran both complete suites with explicit worker execArgv and recorded worker socket-guard boot evidence. Entry globals block fetch/WebSocket; VM globals may differ but use the guarded Node socket layer. This is not an OS-level network sandbox.';
  } catch (error) {
    review.passed = false;
    review.error = { message: error.message, stack: error.stack };
  } finally {
    review.finishedAt = new Date().toISOString();
    report.passed = report.passed && review.passed;
    report.status = report.passed ? 'passed' : 'failed';
    await writeFile(reportPath, json(report));
    console.log(`Worker guard review ${review.passed ? 'PASSED' : 'FAILED'}: ${reportPath}`);
    if (!review.passed) process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
