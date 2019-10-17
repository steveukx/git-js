import expect = require('expect');
import { createSandbox, SinonSandbox, SinonStub } from 'sinon';

import dependencies from '../../src/util/dependencies';
import { simpleGitBuilder } from '../../src';

describe('simple-git', () => {

   let isValidDirectory: SinonStub;
   let sandbox: SinonSandbox;

   beforeEach(() => {
      sandbox = createSandbox();
      isValidDirectory = sandbox.stub(dependencies, 'isValidDirectory');
   });

   afterEach(() => sandbox.restore());

   it('throws when supplied base directory does not exist', () => {
      isValidDirectory.returns(false);
      expect(() => simpleGitBuilder('custom path')).toThrow();
   });

   it('creates a git instance bound to the supplied path', () => {
      isValidDirectory.returns(true);
      expect(() => simpleGitBuilder('custom path')).not.toThrow();
   });

});
