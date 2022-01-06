import { SimpleGit, SimpleGitOptions } from '../../typings';

export function newSimpleGit (...args: [] | [string] | [Partial<SimpleGitOptions>]): SimpleGit {
   const simpleGit = require('../../src/index');
   return simpleGit(...args);
}

export function newSimpleGitP (baseDir: unknown | string = '/tmp/example-repo') {
   if (typeof baseDir !== 'string') {
      throw new Error('Bad arguments to newSimpleGitP');
   }
   return require('../../promise')(baseDir);
}
