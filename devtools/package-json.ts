import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, resolve } from 'path';
import { logger } from './log';

import { repoRoot } from './repo-root';
import { getWorkspaceVersion } from './package-versions';

const input = process.argv[2];

if (!input?.startsWith('.')) {
   console.error(`❌ Supply a relative path to a package.json in this repo`);
   process.exit(1);
}

const src = resolve(repoRoot, input);
if (!existsSync(src) || basename(src) !== 'package.json') {
   console.error(`❌ Supply a valid path to a package.json in this repo`);
   process.exit(1);
}

const log = logger('package.json');

async function main() {
   log('Generating content');
   const pkg = await createPackageJson();
   log('Writing content', pkg);
   await write(pkg);
   log('✅ Done');
}

async function write(content: unknown) {
   await writeFile(src, JSON.stringify(content, null, 2), 'utf8');
}

async function read() {
   return JSON.parse(await readFile(src, 'utf8'));
}

async function createPackageJson() {
   const {
      publish,
      scripts: _scripts,
      dependencies,
      devDependencies: _devDependencies,
      ...pkg
   } = await read();

   return {
      ...pkg,
      ...publish,
      dependencies: resolveWorkspaceDependencies(dependencies),
   };
}

async function resolveWorkspaceDependencies(deps?: Record<string, string>) {
   if (!deps) {
      return undefined;
   }

   const resolved = { ...deps };
   for (const [name] of getWorkspaceDependencies(resolved)) {
      resolved[name] = await getWorkspaceVersion(name);
   }

   return resolved;
}

function getWorkspaceDependencies(deps: Record<string, string>) {
   return Object.entries(deps).filter(([_name, version]) => version.includes('workspace'));
}

main().then(() => {});
