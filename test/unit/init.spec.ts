import { setup, test, TestHelper } from './include/util';
import { SimpleGit } from '../../src';

describe('Init', () => {

   let helper: TestHelper;
   let git: SimpleGit;

   beforeEach(() => {
      helper = setup();
      git = helper.git;
   });

   it('with just a handler', function (done) {
      git.init(function (err: Error) {
         test.equals(null, err, 'not an error');
         test.same(['init'], helper.theCommandRun());
         done();
      });

      helper.closeWith('');
   });

   it('as a bare repo', function (done) {
      git.init(true, function (err: Error) {
         test.equals(null, err, 'not an error');
         test.same(['init', '--bare'], helper.theCommandRun());
         done();
      });

      helper.closeWith('');
   });

   it('as a regular repo', function (done) {
      git.init('truthy value', function (err: Error) {
         test.equals(null, err, 'not an error');
         test.same(['init'], helper.theCommandRun());
         done();
      });

      helper.closeWith('');
   });

   it('no handler', function (done) {
      git.init();
      helper.closeWith('');

      setTimeout(function () {
         test.same(['init'], helper.theCommandRun());
         done();
      }, 10);
   });

});
