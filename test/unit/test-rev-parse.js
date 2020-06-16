const jestify = require('../jestify');
const {theCommandRun, closeWith, newSimpleGit, newSimpleGitP, restore, wait} = require('./include/setup');

let git;

exports.setUp = function (done) {
   restore();
   done();
};

exports.tearDown = function (done) {
   restore();
   done();
};

exports.revParseP = {

   setUp (done) {
      git = newSimpleGitP();
      done();
   },

   'returns rev-parse data to a promise' (test) {

      git.revparse(['--show-toplevel'])
         .then(topLevel => {
            test.same(topLevel, '/var/tmp/some-root');
            test.done();
         });

      setTimeout(() => closeWith('   /var/tmp/some-root   '), 10);
   },

};

exports.revParse = {

   setUp (done) {
      git = newSimpleGit();
      done();
   },

   async 'called with a string' (test) {
      git.revparse('some string');
      await wait();

      test.same(["rev-parse", "some string"], theCommandRun());
      test.done();
   },

   async 'called with an array of strings' (test) {
      git.revparse(['another', 'string']);
      await wait();

      test.same(["rev-parse", "another", "string"], theCommandRun());
      test.done();

   },

};

jestify(exports);
