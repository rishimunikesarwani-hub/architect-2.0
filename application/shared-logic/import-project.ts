import { unzipSync, strFromU8 } from 'fflate';
import type { ProjectFile } from '../types';

export const IMPORT_LIMIT = 300_000;

export function allowedImportPath(path: string): boolean {
  const excluded = path.split(/[\\/]/).some((segment) => {
    const name = segment.toLowerCase();
    return name === '..' || name === 'node_modules' || name === '.git'
      || name.startsWith('.env') || /^(credentials|secrets)(\.|$)/.test(name);
  });
  return !excluded && !/^(?:[a-z]:|[\\/])/i.test(path)
    && /\.(html|css|js|jsx|ts|tsx|json|md|txt|py|toml|yaml|yml|svg)$/i.test(path);
}

function normalizedImportPath(path: string): string {
  return path.replaceAll('\\', '/').split('/').filter((part) => part && part !== '.').join('/');
}

function duplicatePath(path: string): Error {
  return new Error(`Duplicate source path: ${path}. Choose one copy of each file.`);
}

/** Check entry headers before decompression can allocate oversized source or overwrite duplicates. */
async function unpackSourceArchive(file: File, paths: ReadonlySet<string>) {
  let expanded = 0;
  let oversized = false;
  const archivePaths = new Set<string>();
  const unpacked = unzipSync(new Uint8Array(await file.arrayBuffer()), {
    filter: (entry) => {
      if (!allowedImportPath(entry.name)) return false;
      // unzipSync stores entries by name. Reject collisions before it can replace
      // an earlier entry, including aliases that normalize to the same path.
      const path = normalizedImportPath(entry.name);
      const key = path.toLowerCase();
      if (paths.has(key) || archivePaths.has(key)) throw duplicatePath(path);
      archivePaths.add(key);
      expanded += entry.originalSize;
      if (expanded > IMPORT_LIMIT) {
        oversized = true;
        return false;
      }
      return true;
    },
  });
  if (oversized) {
    throw new Error('The ZIP contains more than 300 KB of source. Remove dependencies and large generated files.');
  }
  return unpacked;
}

export async function importProjectFiles(files: File[]): Promise<ProjectFile[]> {
  const result: ProjectFile[] = [];
  const paths = new Set<string>();
  const encoder = new TextEncoder();
  let size = 0;

  const add = (path: string, content: string): void => {
    if (!allowedImportPath(path)) return;
    path = normalizedImportPath(path);
    const key = path.toLowerCase();
    if (paths.has(key)) throw duplicatePath(path);
    paths.add(key);
    size += encoder.encode(content).length;
    if (size > IMPORT_LIMIT) {
      throw new Error('This prototype accepts up to 300 KB of source files. Remove assets and dependencies, then try again.');
    }
    result.push({ path, content });
    if (result.length > 100) throw new Error('Choose up to 100 source files.');
  };

  for (const file of files) {
    if (file.size > 5_000_000) {
      throw new Error('Choose a ZIP smaller than 5 MB, or select individual source files.');
    }
    if (file.name.toLowerCase().endsWith('.zip')) {
      const unpacked = await unpackSourceArchive(file, paths);
      for (const [path, bytes] of Object.entries(unpacked)) add(path, strFromU8(bytes));
    } else if (allowedImportPath(file.name)) {
      if (file.size > IMPORT_LIMIT) throw new Error('A source file is larger than 300 KB.');
      add(file.webkitRelativePath || file.name, await file.text());
    }
  }
  if (!result.length) {
    throw new Error('No supported source files found. Choose HTML, JavaScript, TypeScript, Python, Markdown, or a source ZIP.');
  }
  return result;
}
