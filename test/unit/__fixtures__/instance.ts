import { SimpleGitFactory } from 'simple-git';

export const newSimpleGit: SimpleGitFactory = function () {
   const simpleGit = require('../../..');
   return simpleGit(...(Array.from(arguments)));
}

export function newSimpleGitP (baseDir: unknown | string = '/tmp/example-repo') {
   if (typeof baseDir !== 'string') {
      throw new Error('Bad arguments to newSimpleGitP');
   }
   return require('../../../promise')(baseDir);
}
