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
         root: [__dirname],
         alias: {
            'simple-git': __dirname,
         },
      }],
   ],
};
