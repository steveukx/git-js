import { newSimpleGit } from "./__fixtures__";

const jestify = require('../jestify');
const {closeWithSuccess, restore, theCommandRun} = require('./include/setup');

var git;

exports.setUp = function (done) {
   restore();
   done();
};

exports.tearDown = function (done) {
   restore();
   done();
};

exports.rebase = {
   setUp: function (done) {
      git = newSimpleGit();
      done();
   },

   'rebases': function (test) {
      git.rebase(function (err, data) {
         test.equals(err, null);
         test.same(['rebase'], theCommandRun());

         test.done();
      });

      closeWithSuccess('some data');
   },

   'rebases with array of options': function (test) {
      git.rebase(['master', 'topic'], function (err, data) {
         test.equals(err, null);
         test.same(['rebase', 'master', 'topic'], theCommandRun());

         test.done();
      });

      closeWithSuccess('some data');
   },

   'rebases with object of options': function (test) {
      git.rebase({'--abort': null}, function (err, data) {
         test.equals(err, null);
         test.same(['rebase', '--abort'], theCommandRun());

         test.done();
      });

      closeWithSuccess('some data');
   }
};

jestify(exports);
