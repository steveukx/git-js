'use strict';

/*
   The broken chains test assures the behaviour of both standard and Promise wrapped versions
   of the simple-git library.

   Failures (exit code other than zero and some content in the stderr output) cause the current
   queue to be truncated and no additional steps to be taken.

   In the case of a promise chain, the `catch` handler should be called on the first error
   and no other steps in the chain be executed.
 */
const Test = require('./include/runner');

const setUp = (context) => {
   return Promise.resolve();
};

const test = (context, assert) => {
   let git = context.git(context.root).silent(true);

   let result = context.deferred();

   git
      .status((err, res) => {
         assert.notEqual(err, null, 'Should be an error');
         setTimeout(result.resolve, 1000);
      })
      .status((err, res) => {
         result.resolve(new Error('Should not have processed extra steps in a chain after throwing.'));
      });

   return result.promise;
};

const multiStepTest = (context, assert) => {
   let git = context.git(context.root).silent(true);

   let result = context.deferred();

   git
      .status((err, res) => {
         assert.notEqual(err, null, 'First step in chain should generate an error');
         setTimeout(() => {


            git.status((err) => {
               assert.notEqual(err, null, 'Creating a new chain should start running that chain.');
               result.resolve();
            })

         }, 1000);
      })
      .status((err, res) => {
         result.resolve(new Error('Second step in chain should not have been called.'));
      });

   return result.promise;
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

module.exports = {
   'standard': new Test(setUp, test),
   'multi-step standard': new Test(setUp, multiStepTest),
   'promise': new Test(setUp, testP)
};
