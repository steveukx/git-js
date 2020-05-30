const joinPaths = require('path').join;

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
         root: '.',
         alias: {
            'simple-git': __dirname,
            // 'simple-git/promise': joinPaths(__dirname, 'promise'),
         },
      }],
   ],
};
