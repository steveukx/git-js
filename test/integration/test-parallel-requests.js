'use strict';

const Test = require('./include/runner');

const setUp = (context) => {
   return context.gitP(context.root).init()
};

const test = (context, assert) => {

   let first = context.git(context.root);
   let second = context.git(context.root);

   let results = [];

   let promises = [
      new Promise(done => {
         first.status(err => {
            results.push('first:a');
            assert.equal(err, null, 'Should not be an error');
            done();
         });
      }),
      new Promise(done => {
         second.status(err => {
            results.push('second:a');
            assert.equal(err, null, 'Should not be an error');
            done();
         });
      }),
      new Promise(done => {
         first.status(err => {
            results.push('first:b');
            assert.equal(err, null, 'Should not be an error');
            done();
         });
      }),
      new Promise((done) => {
         setTimeout(() => {
            first.status(err => {
               results.push('first:c');
               assert.equal(err, null, 'Should not be an error');
               done();
            });
         }, 1000);
      })
   ];

   return new Promise(function (done) {

      const assertAllProcessesCompleted = () => {
         assert.equal(
            results.sort().join(' '),
            'first:a first:b first:c second:a',
            'Should have handled each process'
         );
      };

      const timeout = setTimeout(assertAllProcessesCompleted, 2000);

      Promise.all(promises).then(() => {
         clearTimeout(timeout);
         assertAllProcessesCompleted();
         done();
      });

   });
};

module.exports = new Test(setUp, test);
