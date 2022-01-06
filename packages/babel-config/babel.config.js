const {resolve} = require('path');
const {existsSync} = require('fs');

const root = resolve(__dirname, '../..', 'simple-git');
const dist = resolve(root, 'dist');

const pkg = existsSync(dist) ? dist : root;

module.exports = {
   presets: [
      [
         '@babel/preset-env',
         {
            targets: {
               node: 'current',
            },
         },
      ],
      '@babel/preset-typescript',
   ],
   plugins: [
      ['module-resolver', {
         root: [pkg],
         alias: {
            'simple-git': pkg,
         },
      }],
   ],
};
