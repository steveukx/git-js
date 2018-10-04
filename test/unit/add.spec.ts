import { setup, test, TestHelper } from './include/util';
import { SimpleGit } from '../../src';

describe('Add', () => {

   let helper: TestHelper;
   let git: SimpleGit;

   beforeEach(() => {
      helper = setup();
      git = helper.git;
   });

   it('accepts single file name', (done) => {
      git.add('some-file', () => {
         expect(helper.theCommandRun()).toEqual(['add', 'some-file']);
         done();
      });

      helper.close();
   });

   it('accepts multiple file names', function (done) {
      git.add(['some-file', 'another-file'], () => {
         expect(helper.theCommandRun()).toEqual(['add', 'some-file', 'another-file']);
         done();
      });

      helper.close();
   });

});
