export { pathspec } from '@simple-git/args-pathspec';

export type * from './typings';
export * from './lib/api';

import { simpleGit } from './lib/git-factory';
export { simpleGit };

export default simpleGit;
