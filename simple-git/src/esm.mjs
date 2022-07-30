import { gitInstanceFactory } from './lib/git-factory';

export { gitP } from './lib/runners/promise-wrapped';
export * from './lib/api';

export const simpleGit = gitInstanceFactory;

export default gitInstanceFactory;
