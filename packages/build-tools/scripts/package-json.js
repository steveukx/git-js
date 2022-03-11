const { writeFile, readFile } = require('fs/promises');
const { resolve } = require('path');
const log = require('./log').logger('package.json');

module.exports = async function () {
   const src = resolve(process.cwd(), 'package.json');
   log(`Consuming "${src}"`);

   log('Generating content');
   const pkg = await createPackageJson(src);
   log('Writing content');
   await save(src, pkg);
   log('Done');
}

function save (src, content) {
   return writeFile(src, JSON.stringify(content, null, 2), 'utf8');
}

async function createPackageJson (src) {
   const {publish, scripts, ...pkg} = JSON.parse(await readFile(src, 'utf8'));

   if (!publish) {
      throw new Error(`No "publish" section found in package.json file at "${src}" `);
   }

   return {
      ...pkg,
      ...publish,
   };
}
