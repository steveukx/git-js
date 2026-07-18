import { SimpleGitCore, simpleGitCore } from '../index';

describe('@simple-git/core package entry point', () => {
   it('exposes the factory and class', () => {
      expect(simpleGitCore()).toBeInstanceOf(SimpleGitCore);
   });
});
