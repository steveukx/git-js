const jestify = require('../jestify');
const {theCommandRun, theEnvironmentVariables, closeWith, errorWith, Instance, restore} = require('./include/setup');
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

exports.childProcess = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'handles child process errors': function (test) {
      git.init(function (err) {
         test.equals('SOME ERROR', err.message);
         test.done();
      });

      errorWith('SOME ERROR');
      closeWith(-2);
   },

   'passes empty set of environment variables by default': function (test) {
      git.init(() => {
         test.same(undefined, theEnvironmentVariables());
         test.done();
      });

      closeWith('');
   },

   'supports passing individual environment variables to the underlying child process': function (test) {
      git.env('foo', 'bar')
         .init(() => {
            test.same({foo: 'bar'}, theEnvironmentVariables());
            test.done();
         });

      closeWith('');
   },

   'supports passing environment variables to the underlying child process': function (test) {
      git.env({baz: 'bat'})
         .init(() => {
            test.same({baz: 'bat'}, theEnvironmentVariables());
            test.done();
         });

      closeWith('');
   }
};

jestify(exports);
