'use strict';

/*
   The broken promise chains test assures the behaviour of Promise wrapped versions of the simple-git library.

   Failures (exit code other than zero and some content in the stderr output) cause the current
   queue to be truncated and no additional steps to be taken.

   In the case of a promise chain, the `catch` handler should be called on the first error
   and no other steps in the chain be executed.
 */
const Test = require('./include/runner');

const setUp = (context) => {
   return Promise.resolve();
};

const testP = (context, assert) => {
   let git = context.gitP(context.root).silent(true);
   let result = context.deferred();
   let successes = [];

   git.status()
      .then(res => {
         successes.push(res);
      })
      .then(() => git.status())
      .then((res) => {
         successes.push(res);
      })
      .then(() => {
         result.resolve(new Error('Should not have been a success, first stage must throw when not a valid repo'));
      })
      .catch(err => {
         assert.equal(successes.length, 0, 'Should not have processed any step as a success');
         result.resolve();
      });

   return result.promise;
};

const testPromiseNotChained = (context, assert) => {
   let git = context.gitP(context.root).silent(true);
   let result = context.deferred();
   let failures = [];

   const status = (step) => {
      return git.status()
         .then(() => {
            result.resolve(new Error('Should not have been a success: ' + step));
         }, () => {
            failures.push(step)
         });
   };

   Promise.all([
         status('a'),
         status('b'),
         status('c')
      ])
      .then(function () {
         assert.deepEqual(['a', 'b', 'c'], failures.sort(), 'All steps should be an error');
         result.resolve();
      });

   setTimeout(function () {
      result.resolve(new Error('Test timed out - currently seen ' + failures));
   }, 1000);

   return result.promise;
};

module.exports = {
   'written as a chain': new Test(setUp, testP),
   'written without chains': new Test(setUp, testPromiseNotChained)
};
