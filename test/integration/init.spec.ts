import expect from 'expect.js';

import { IntegrationTestContext } from './include/integration-test-context';
import { simpleGit } from '../../src/index';


describe('init', () => {

   let testContext: IntegrationTestContext;

   beforeEach(() => {
      testContext = new IntegrationTestContext();
   });

   it('initialises a standard repo', async () => {

      const git = simpleGit(testContext.root);
      const initResponse = await git.init();

      expect(testContext.thePath('.git'))
         .to.have.property('directory', true);

   });

   it('initialises a bare repo', async () => {

      const git = simpleGit(testContext.root);
      const initResponse = await git.init(true);

      expect(testContext.thePath('.git'))
         .to.have.property('directory', false);

      expect(testContext.thePath('config'))
         .to.have.property('file', true);

   });

});
