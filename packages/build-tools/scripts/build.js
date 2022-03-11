const {writeFile} = require('fs');
const {resolve} = require('path');
const esbuild = require('esbuild');
const {nodeExternalsPlugin} = require('esbuild-node-externals');
const log = require('./log').logger('ESM');

module.exports = async function () {
   const outDir = resolve(__dirname, '..', 'dist');
   log('Output will be written to "%s"', outDir);

   log('generating esm source');
   await esm(outDir);

   log('generating cjs source');
   await cjs(outDir);

   log('done');
}

async function esm (outDir) {
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
         JSON.stringify({type: 'module'}, null, 2),
         {encoding: 'utf8'},
         (err) => err ? fail(err) : done()
      ));
}

async function cjs (outDir) {
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
