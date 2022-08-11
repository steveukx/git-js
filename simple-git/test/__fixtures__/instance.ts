import { SimpleGit, SimpleGitOptions } from '../../typings';

export function newSimpleGit(...args: [] | [string] | [Partial<SimpleGitOptions>]): SimpleGit {
   const simpleGit = require('../..');
   return simpleGit(...args);
}
