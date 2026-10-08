import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
// Give each document one editable home and copy it when the app starts or builds.
// Keep the published URLs: people may already have saved these links.
const destination = new URL('generated-output/public-assets/', root);
await mkdir(destination, { recursive: true });
const downloads = [
  ['application/public-assets/favicon.svg', 'favicon.svg'],
  ['documentation/arch-engineering-drawing.svg', 'engineering-drawing.svg'],
  ['documentation/arch-production-architecture.svg', 'production-architecture.svg'],
  ['documentation/arch-production-architecture.svg', 'arch-production-architecture.svg'],
  ['documentation/arch-production-architecture.png', 'arch-production-architecture.png'],
];
for (const [source, publishedName] of downloads) {
  await copyFile(new URL(source, root), new URL(publishedName, destination));
}

// A downloaded document has no repository folders beside it. Point its code and
// evidence links at GitHub; keep the diagrams beside the hosted Markdown file.
const architecture = await readFile(new URL('documentation/arch-production-architecture.md', root), 'utf8');
const repository = 'https://github.com/rishimunikesarwani-hub/architect-2/blob/main/';
const publishedArchitecture = architecture.replace(/(\]\()((?:\.\.\/)[^)]+|arch-engineering-drawing\.md)(\))/g,
  (_, opening, target, closing) => {
    const path = target.startsWith('../') ? target.slice(3) : `documentation/${target}`;
    return `${opening}${repository}${path}${closing}`;
  });
await writeFile(new URL('arch-production-architecture.md', destination), publishedArchitecture);
