#!/usr/bin/env node

const log = require('../scripts/log').logger('sg-build');

(async (command) => {
   log('Running command: ' + command);

   switch (command) {
      case 'pkg':
         await require('../scripts/package-json')();
         break;

      case 'build':
         await require('../scripts/build')();
         break;

      default:
         console.error(`UNKNOWN COMMAND`, process.argv, process.cwd());
   }

})(process.argv[2]);
