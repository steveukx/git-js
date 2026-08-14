import { SimpleGitCore, simpleGit } from '../index';

describe('@simple-git/core package entry point', () => {
   it('exposes the factory and class', () => {
      expect(simpleGit()).toBeInstanceOf(SimpleGitCore);
   });
});
