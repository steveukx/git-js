import { setup, test, TestHelper } from './include/util';
import { SimpleGit } from '../../src';

describe('Stash', () => {

   let helper: TestHelper;
   let git: SimpleGit;

   beforeEach(() => {
      helper = setup();
      git = helper.git;
   });

   it('stash working directory', (done) => {
      git.stash(function (err: Error, result: string) {
         test.equal(err, null, 'Should not be an error');
         test.equals(["stash"], helper.theCommandRun());

         done();
      });

      helper.closeWith('');
   });

   it('stash pop', (done) => {
      git.stash(["pop"], function (err: Error, result: string) {
         test.equals(["stash", "pop"], helper.theCommandRun());

         done();
      });

      helper.closeWith('');
   });

   it('stash with options no handler', (done) => {
      git.stash(["branch", "some-branch"], (err: Error, result: string) => {
         test.same(["stash", "branch", "some-branch"], helper.theCommandRun());
         done();
      });

      helper.closeWith('');
   });

});
