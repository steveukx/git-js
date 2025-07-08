const { resolve } = require('path');
const { existsSync } = require('fs');

function resolver(resolveToDist) {
   const root = resolve(__dirname, '../..', 'simple-git');
   const dist = resolveToDist ? resolve(root, 'dist', 'cjs') : root;

   const pkg = existsSync(dist) ? dist : root;

   return [
      require.resolve('babel-plugin-module-resolver'),
      {
         root: [pkg],
         alias: {
            'simple-git/promise': resolve(root, 'promise'),
            'simple-git': pkg,
         },
      },
   ];
}

module.exports = function (resolveToDist = false) {
   return {
      presets: [
         [
            require.resolve('@babel/preset-env'),
            {
               targets: {
                  node: 'current',
               },
            },
         ],
         require.resolve('@babel/preset-typescript'),
      ],
      plugins: [resolver(resolveToDist)],
   };
};
