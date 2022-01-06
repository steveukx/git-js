const { writeFile } = require('fs/promises');
const { resolve } = require('path');
const { logger } = require('./log');

const log = logger('package.json');
const src = resolve(__dirname, '..', 'package.json');
const out = resolve(__dirname, '..', 'dist', 'package.json');

(async function () {
   log('Generating content');
   const pkg = createPackageJson();
   log('Writing content');
   await save(pkg);
   log('Done');
})();

function save (content) {
   return writeFile(out, JSON.stringify(content, null, 2), 'utf8');
}

function createPackageJson() {
   const { publish, scripts, files, ...pkg } = require(src);

   return {
      ...pkg,
      ...publish,
   };
}
