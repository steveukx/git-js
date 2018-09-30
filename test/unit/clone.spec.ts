import { setup, test, TestHelper } from './include/util';
import { SimpleGit } from '../../src';

describe('Clone', () => {


   let helper: TestHelper;
   let git: SimpleGit;

   beforeEach(() => {
      helper = setup();
      git = helper.git;
   });

   it('clone with repo and local', (done) => {
      git.clone('repo', 'lcl', function (err: Error, data: string) {
         test.same(['clone', 'repo', 'lcl'], helper.theCommandRun());
         test.same('anything', data);
         test.equals(null, err, 'not an error');

         done();
      });

      helper.closeWith('anything');
   });

   it('clone with just repo', (done) => {
      git.clone('proto://remote.com/repo.git', function (err: Error, data: string) {
         test.same(['clone', 'proto://remote.com/repo.git'], helper.theCommandRun());
         test.equals(null, err, 'not an error');

         done();
      });

      helper.closeWith('anything');
   });

   it('clone with options', (done) => {
      git.clone('repo', 'lcl', ['foo', 'bar'], function (err: Error, data: string) {
         test.same(['clone', 'foo', 'bar', 'repo', 'lcl'], helper.theCommandRun());
         done();
      });

      helper.closeWith('anything');
   });

   it('clone with array of options without local', (done) => {
      git.clone('repo', ['foo', 'bar'], function (err: Error, data: string) {
         test.same(['clone', 'foo', 'bar', 'repo'], helper.theCommandRun());
         done();
      });

      helper.closeWith('anything');
   });

   it('explicit mirror', (done) => {
      git.mirror('r', 'l', function () {
         test.same(['clone', '--mirror', 'r', 'l'], helper.theCommandRun());
         done();
      });

      helper.closeWith('');
   });

});
