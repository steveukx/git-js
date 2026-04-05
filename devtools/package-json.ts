import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, basename } from 'path';
import { logger } from './log';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const input = process.argv[2];

if (!input?.startsWith('.')) {
   console.error(`❌ Supply a relative path to a package.json in this repo`);
   process.exit(1);
}

const src = resolve(__dirname, '..', input);
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
   const { publish, scripts: _scripts, devDependencies: _devDependencies, ...pkg } = await read();

   return {
      ...pkg,
      ...publish,
   };
}

main().then(() => {});
