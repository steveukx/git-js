const { resolve } = require('path');
const { existsSync } = require('fs');

function resolver() {
   const root = resolve(__dirname, '../..', 'simple-git');
   const dist = resolve(root, 'dist', 'cjs');

   const pkg = existsSync(dist) ? dist : root;

   return [
      'module-resolver',
      {
         root: [pkg],
         alias: {
            'simple-git/promise': resolve(root, 'promise'),
            'simple-git': pkg,
         },
      },
   ];
}

module.exports = function (resolve = false) {
   return {
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
      plugins: resolve ? [resolver()] : [],
   };
};
