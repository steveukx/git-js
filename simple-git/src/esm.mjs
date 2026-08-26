import { gitInstanceFactory } from './lib/git-factory';

export * from './lib/api';

export const simpleGit = gitInstanceFactory;

export default gitInstanceFactory;
