import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const projectFolders = new Set([
  'application', 'documentation', 'automated-tests', 'verification-records',
  'development-tools', 'sample-projects', 'generated-output',
]);
const toolingFolders = new Set(['.git', '.convex', '.vercel', 'node_modules']);
const rootFiles = new Set([
  'README.md', 'AGENTS.md', 'LOG.md', 'package.json', 'package-lock.json',
  '.gitignore', '.vercelignore', 'convex.json', 'vercel.json',
]);
const problems = [];

// Inspect names only. This check never reads credentials or deletes files.
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isDirectory()) {
    if (!projectFolders.has(entry.name) && !toolingFolders.has(entry.name)) {
      problems.push(`Unexpected root folder: ${entry.name}/. Put it in a project folder or document a tooling exception.`);
    }
  } else if (!rootFiles.has(entry.name) && !/^\.env(?:\..+)?$/.test(entry.name)) {
    problems.push(`Unexpected root file: ${entry.name}. Use verification-records/ for results, generated-output/ for output, or development-tools/ for scripts.`);
  }
}

function sameDirectory(left, right) {
  const normalize = path => {
    const absolute = realpathSync(path);
    return process.platform === 'win32' ? absolute.toLowerCase() : absolute;
  };
  return normalize(left) === normalize(right);
}

function authoredFiles(directory, prefix = '') {
  const paths = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    // A source archive has no tracking metadata. Leave local dependencies,
    // credentials, generated output and external symlink targets alone.
    if (entry.isSymbolicLink() || toolingFolders.has(entry.name) || entry.name === 'generated-output' ||
        /^\.env(?:\.|$)/.test(entry.name)) continue;
    if (entry.isDirectory()) {
      if (!prefix && !projectFolders.has(entry.name)) continue;
      paths.push(...authoredFiles(join(directory, entry.name), path));
    } else if (entry.isFile()) paths.push(path);
  }
  return paths;
}

// A source ZIP may have no Git metadata, or may live inside a different repo.
// Only inspect Git's index when its actual top level is this project root.
const gitOptions = { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] };
let usesGitIndex = false;
let paths;
try {
  const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], gitOptions).trim();
  if (sameDirectory(root, gitRoot)) {
    paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], gitOptions)
      .split('\0').filter(Boolean);
    usesGitIndex = true;
  }
} catch {
  // Missing Git or repository metadata does not prevent a source ZIP check.
}
if (!usesGitIndex) {
  paths = authoredFiles(root);
  console.log('No matching Git repository: checking authored files; tracked-file scan unavailable.');
}

for (const path of new Set(paths)) {
  const parts = path.split('/');
  const name = parts.at(-1);
  if ((/^\.env(?:\.|$)/.test(name) && name !== '.env.example') ||
      parts.some(part => ['node_modules', 'generated-output', 'runs', 'coverage', '__pycache__'].includes(part)) ||
      /\.(?:log|tsbuildinfo|pyc)$/.test(name)) {
    problems.push(usesGitIndex
      ? `Local environment or generated output must not be tracked: ${path}`
      : `Generated output found in authored source: ${path}`);
  }

  // A moved file can remain in Git's index until the rename is staged.
  if (!existsSync(join(root, path))) continue;
  if (name.endsWith('.md')) {
    const markdown = readFileSync(join(root, path), 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1].replace(/^<|>$/g, '').split('#')[0];
      if (!target || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target)) continue;
      const resolved = resolve(dirname(join(root, path)), decodeURIComponent(target));
      if (!existsSync(resolved)) problems.push(`Broken local link in ${path}: ${target}`);
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(usesGitIndex
    ? 'Folder hygiene passed: clear root folders, working local Markdown links, and no tracked environment files or generated output.'
    : 'Folder hygiene passed: clear root folders and working local Markdown links. Tracked-file scan unavailable without a matching Git repository.');
}
