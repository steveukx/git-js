const { writeFile, existsSync } = require('fs');
const { resolve, basename } = require('path');
const { logger } = require('./log');

const input = process.argv[2];

if (!input || !input.startsWith('.')) {
   console.error(`❌ Supply a relative path to a package.json in this repo`);
   process.exit(1);
}

const src = resolve(__dirname, '../..', input);
if (!existsSync(src) || basename(src) !== 'package.json') {
   console.error(`❌ Supply a valid path to a package.json in this repo`);
   process.exit(1);
}

const log = logger('package.json');

(async function () {
   log('Generating content');
   const pkg = createPackageJson();
   log('Writing content', pkg);
   await save(pkg);
   log('Done');
})();

function save(content) {
   return new Promise((done, fail) =>
      writeFile(src, JSON.stringify(content, null, 2), 'utf8', (err) => {
         err ? fail(err) : done();
      })
   );
}

function createPackageJson() {
   const { publish, scripts, ...pkg } = require(src);

   return {
      ...pkg,
      ...publish,
   };
}
