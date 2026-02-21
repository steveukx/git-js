import { promises as fs, watch as watchFs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const docsRoot = path.resolve(repoRoot, 'packages/docs-site/src/content/docs/generated');
const sourceReadme = path.resolve(repoRoot, 'simple-git/readme.md');
const sourceDocsDir = path.resolve(repoRoot, 'docs');

const watchMode = process.argv.includes('--watch');

const titleFromFilename = (filename) =>
  filename
    .replace(/\.md$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const titleFromMarkdown = (markdown, fallback) => {
  const heading = markdown.match(/^#{1,6}\s+(.+)$/m);
  return heading?.[1]?.trim() || fallback;
};

const slugify = (filename) =>
  filename
    .replace(/\.md$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const withFrontmatter = (title, body) => {
  const safeBody = body.startsWith('---\n') ? body.replace(/^---[\s\S]*?---\n?/, '') : body;
  return `---\ntitle: ${JSON.stringify(title)}\n---\n\n${safeBody}`;
};

const rebuild = async () => {
  await fs.rm(docsRoot, { recursive: true, force: true });
  await fs.mkdir(path.join(docsRoot, 'guides'), { recursive: true });

  const readmeBody = await fs.readFile(sourceReadme, 'utf8');
  const readmeTitle = titleFromMarkdown(readmeBody, 'README');
  await fs.writeFile(
    path.join(docsRoot, 'readme.md'),
    withFrontmatter(readmeTitle, readmeBody),
    'utf8'
  );

  const docEntries = (await fs.readdir(sourceDocsDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of docEntries) {
    const sourceFile = path.join(sourceDocsDir, entry.name);
    const targetFile = path.join(docsRoot, 'guides', `${slugify(entry.name)}.md`);
    const sourceBody = await fs.readFile(sourceFile, 'utf8');
    const title = titleFromMarkdown(sourceBody, titleFromFilename(entry.name));

    await fs.writeFile(targetFile, withFrontmatter(title, sourceBody), 'utf8');
  }

  const generatedCount = docEntries.length + 1;
  process.stdout.write(`[docs:sync] wrote ${generatedCount} markdown files\n`);
};

const main = async () => {
  await rebuild();

  if (!watchMode) {
    return;
  }

  let timer;
  const onChange = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        await rebuild();
      } catch (error) {
        process.stderr.write(`[docs:sync] ${error instanceof Error ? error.stack : String(error)}\n`);
      }
    }, 100);
  };

  watchFs(sourceReadme, onChange);
  watchFs(sourceDocsDir, onChange);

  process.stdout.write('[docs:sync] watching markdown sources\n');

  process.stdin.resume();
};

main().catch((error) => {
  process.stderr.write(`[docs:sync] ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
