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

exports.rm = {
   setUp: function (done) {
      git = newSimpleGit();
      done();
   },

   'remove single file': function (test) {
      git.rm('string', function (err, data) {
         test.same(['rm', '-f', 'string'], theCommandRun());
         test.done();
      });

      closeWithSuccess('anything');
   },

   'remove multiple files': function (test) {
      git.rm(['another', 'string'], function (err, data) {
         test.same(['rm', '-f', 'another', 'string'], theCommandRun());
         test.done();
      });

      closeWithSuccess('anything');
   }
};

jestify(exports);
