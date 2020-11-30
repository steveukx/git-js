
export function newSimpleGit (...args: [] | [string]) {
   const simpleGit = require('../../..');
   return simpleGit(...args);
}

export function newSimpleGitP (baseDir: unknown | string = '/tmp/example-repo') {
   if (typeof baseDir !== 'string') {
      throw new Error('Bad arguments to newSimpleGitP');
   }
   return require('../../../promise')(baseDir);
}
