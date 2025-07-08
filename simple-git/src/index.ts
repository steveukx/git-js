import { gitInstanceFactory as simpleGit } from './lib/git-factory';

export type * from './typings';

export * from './lib/api';
export { simpleGit, simpleGit as gitP };

export default simpleGit;
