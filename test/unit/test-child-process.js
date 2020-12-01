import { newSimpleGit } from "./__fixtures__";

const jestify = require('../jestify');
const {theEnvironmentVariables, closeWithSuccess, closeWithError, restore} = require('./include/setup');

let git;

exports.setUp = function (done) {
   restore();
   done();
};

exports.tearDown = function (done) {
   restore();
   done();
};

exports.childProcess = {
   setUp: function (done) {
      git = newSimpleGit();
      done();
   },

   'handles child process errors': function (test) {
      git.init(function (err) {
         test.equals('SOME ERROR', err.message);
         test.done();
      });

      closeWithError('SOME ERROR', -2);
   },

   'passes empty set of environment variables by default': function (test) {
      git.init(() => {
         test.same(undefined, theEnvironmentVariables());
         test.done();
      });

      closeWithSuccess();
   },

   'supports passing individual environment variables to the underlying child process': function (test) {
      git.env('foo', 'bar')
         .init(() => {
            test.same({foo: 'bar'}, theEnvironmentVariables());
            test.done();
         });

      closeWithSuccess();
   },

   'supports passing environment variables to the underlying child process': function (test) {
      git.env({baz: 'bat'})
         .init(() => {
            test.same({baz: 'bat'}, theEnvironmentVariables());
            test.done();
         });

      closeWithSuccess();
   }
};

jestify(exports);
