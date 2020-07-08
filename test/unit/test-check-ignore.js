const jestify = require('../jestify');
const {theCommandRun, closeWith, Instance, restore} = require('./include/setup');
const sinon = require('sinon');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   done();
};

exports.tearDown = function (done) {
   restore(sandbox);
   done();
};

exports.checkIgnore = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'with single excluded file specified': function (test) {
      git.checkIgnore('foo.log', function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(['check-ignore', 'foo.log'], theCommandRun());
         test.same(['foo.log'], result);

         test.done();
      });

      closeWith('foo.log');
   },

   'with two excluded files specified': function (test) {
      git.checkIgnore(['foo.log', 'bar.log'], function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(['check-ignore', 'foo.log', 'bar.log'], theCommandRun());
         test.same(['foo.log', 'bar.log'], result);

         test.done();
      });

      closeWith('foo.log\n\
        bar.log\
        ');
   },

   'with no excluded files': function (test) {
      git.checkIgnore(['foo.log', 'bar.log'], function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(['check-ignore', 'foo.log', 'bar.log'], theCommandRun());
         test.same([], result);

         test.done();
      });

      closeWith('');
   },

   'with spaces in file names': function (test) {
      git.checkIgnore('foo space .log', function (err, result) {
         test.equals(null, err, 'not an error');
         test.same(['check-ignore', 'foo space .log'], theCommandRun());
         test.same(['foo space .log'], result);

         test.done();
      });

      closeWith('\
            foo space .log\
        ');
   }
};

jestify(exports);
