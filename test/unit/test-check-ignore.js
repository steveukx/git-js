import { newSimpleGit } from "./__fixtures__";

const jestify = require('../jestify');
const {theCommandRun, closeWithSuccess, restore} = require('./include/setup');

let git;

exports.setUp = function (done) {
   restore();
   done();
};

exports.tearDown = function (done) {
   restore();
   done();
};

exports.checkIgnore = {
   setUp: function (done) {
      git = newSimpleGit();
      done();
   },

   'with single excluded file specified': function (test) {
      git.checkIgnore('foo.log', function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(['check-ignore', 'foo.log'], theCommandRun());
         test.same(['foo.log'], result);

         test.done();
      });

      closeWithSuccess('foo.log');
   },

   'with two excluded files specified': function (test) {
      git.checkIgnore(['foo.log', 'bar.log'], function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(['check-ignore', 'foo.log', 'bar.log'], theCommandRun());
         test.same(['foo.log', 'bar.log'], result);

         test.done();
      });

      closeWithSuccess(`foo.log
        bar.log
        `);
   },

   'with no excluded files': function (test) {
      git.checkIgnore(['foo.log', 'bar.log'], function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(['check-ignore', 'foo.log', 'bar.log'], theCommandRun());
         test.same([], result);

         test.done();
      });

      closeWithSuccess();
   },

   'with spaces in file names': function (test) {
      git.checkIgnore('foo space .log', function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(['check-ignore', 'foo space .log'], theCommandRun());
         test.same(['foo space .log'], result);

         test.done();
      });

      closeWithSuccess(`
            foo space .log
     `);
   }
};

jestify(exports);
