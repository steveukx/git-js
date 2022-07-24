const { writeFile } = require('fs');
const { resolve } = require('path');
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');
const { logger } = require('./log');

const log = logger('ESM');
const outDir = resolve(__dirname, '..', 'dist');

Promise.resolve()
   .then(() => log('generating esm source'))
   .then(() => esm())
   .then(() => log('generating cjs source'))
   .then(() => cjs())
   .then(() => log('done'));

async function esm() {
   const outfile = resolve(outDir, 'esm', 'index.js');

   await esbuild.build({
      entryPoints: ['src/esm.mjs'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      sourcemap: true,
      outfile,
      plugins: [nodeExternalsPlugin()],
   });

   await new Promise((done, fail) =>
      writeFile(
         resolve(outfile, '..', 'package.json'),
         JSON.stringify({ type: 'module' }, null, 2),
         { encoding: 'utf8' },
         (err) => (err ? fail(err) : done())
      )
   );
}

async function cjs() {
   const outfile = resolve(outDir, 'cjs', 'index.js');

   await esbuild.build({
      entryPoints: ['src/index.js'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      sourcemap: true,
      outfile,
      plugins: [nodeExternalsPlugin()],
   });
}
