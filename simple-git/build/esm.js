const { writeFile } = require('fs/promises');
const { resolve } = require('path');
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

const outDir = resolve(__dirname, '..', 'dist/esm');

Promise.resolve()
   .then(() => log('generating source'))
   .then(() => src())
   .then(() => log('writing metadata'))
   .then(() => meta())
   .then(() => log('done'))
;

function log (...args) {
   console.log(`ESM: `, ...args);
}

function src () {
   return esbuild.build({
      entryPoints: ['src/esm.mjs'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: resolve(outDir, 'index.js'),
      plugins: [nodeExternalsPlugin()],
   });
}

function meta () {
   return writeFile(
      resolve(outDir, 'package.json'),
      JSON.stringify({ type: 'module' }, null, 2),
      {
         encoding: 'utf8',
      },
   );
}

