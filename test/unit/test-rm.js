const jestify = require('../jestify');
const {theCommandRun, closeWith, Instance, restore} = require('./include/setup');

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
      git = Instance();
      done();
   },

   'remove single file': function (test) {
      git.rm('string', function (err, data) {
         test.same(['rm', '-f', 'string'], theCommandRun());
         test.done();
      });

      closeWith('anything');
   },

   'remove multiple files': function (test) {
      git.rm(['another', 'string'], function (err, data) {
         test.same(['rm', '-f', 'another', 'string'], theCommandRun());
         test.done();
      });

      closeWith('anything');
   }
};

jestify(exports);
