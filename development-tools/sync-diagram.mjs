import { copyFile, cp, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const output = new URL('generated-output/public-assets/', root);
await mkdir(output, { recursive: true });
await copyFile(new URL('application/public-assets/favicon.svg', root), new URL('favicon.svg', output));
await copyFile(new URL('architecture.md', root), new URL('architecture.md', output));
await cp(new URL('documentation/', root), new URL('documentation/', output), { recursive: true });
