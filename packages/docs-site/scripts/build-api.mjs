import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const watchMode = process.argv.includes('--watch');
const normalizeOnly = process.argv.includes('--normalize-only');

const workspaceRoot = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(workspaceRoot, '../..');
const apiOutDir = path.join(workspaceRoot, 'src/content/docs/api');
const typedocBin = path.join(repoRoot, 'node_modules/.bin/typedoc');

const typedocArgs = [
  '--tsconfig',
  path.join(repoRoot, 'simple-git/tsconfig.release.json'),
  '--entryPoints',
  path.join(repoRoot, 'simple-git/typings/index.d.ts'),
  '--plugin',
  'typedoc-plugin-markdown',
  '--out',
  apiOutDir,
  '--readme',
  'none',
  '--excludePrivate',
  '--excludeProtected',
  '--excludeInternal',
  '--hidePageTitle',
  '--githubPages',
  'false',
  '--entryFileName',
  'index.md',
  '--flattenOutputFiles'
];

if (watchMode) {
  typedocArgs.push('--watch');
}

const toTitle = (filePath) => {
  const base = path.basename(filePath, '.md');
  if (base === 'index') {
    return 'API Reference';
  }

  const withoutPrefixes = base.replace(
    /^(Class|Interface|Type-alias|Variable|Enumeration|Enum|Function)\./,
    ''
  );

  return withoutPrefixes.replace(/[._-]+/g, ' ');
};

const withFrontmatter = (title, body) => `---\ntitle: ${JSON.stringify(title)}\n---\n\n${body}`;

const listMarkdownFiles = async (rootDir) => {
  const output = [];
  const stack = [rootDir];

  while (stack.length) {
    const currentDir = stack.pop();
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        output.push(fullPath);
      }
    }
  }

  return output;
};

const normalizeFrontmatter = async () => {
  const files = await listMarkdownFiles(apiOutDir);
  let updated = 0;

  for (const filePath of files) {
    const body = await fs.readFile(filePath, 'utf8');
    if (body.startsWith('---\n')) {
      continue;
    }

    const title = toTitle(filePath);
    await fs.writeFile(filePath, withFrontmatter(title, body), 'utf8');
    updated += 1;
  }

  process.stdout.write(`[docs:api] normalized frontmatter in ${updated} files\n`);
};

const run = async () => {
  if (normalizeOnly) {
    await normalizeFrontmatter();
    return;
  }

  try {
    await fs.access(typedocBin);
  } catch {
    throw new Error(
      `typedoc binary not found at ${typedocBin}. Run 'yarn install' at the repo root to install docs-site dependencies.`
    );
  }

  await fs.rm(apiOutDir, { recursive: true, force: true });
  await fs.mkdir(apiOutDir, { recursive: true });

  await new Promise((resolve, reject) => {
    const child = spawn(typedocBin, typedocArgs, {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env: process.env
    });

    child.on('error', reject);

    child.on('exit', (code) => {
      if (watchMode) {
        resolve();
      } else if (code === 0) {
        resolve();
      } else {
        reject(new Error(`typedoc exited with code ${code}`));
      }
    });
  });

  if (!watchMode) {
    await normalizeFrontmatter();
  }
};

run().catch((error) => {
  process.stderr.write(`[docs:api] ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
