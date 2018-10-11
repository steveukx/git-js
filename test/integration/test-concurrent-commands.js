'use strict';

const Test = require('./include/runner');

function delay () {
   return new Promise(ok => setTimeout(ok, 50));
}

const setUp = (context) => {

   return Promise.all([
      configure('first'),
      configure('second'),
   ]);

   function configure (thing) {
      const git = context.gitP(context.dir(thing));
      context.file(thing, thing, '');

      return git.init()
         .then(() => git.add(thing))
         .then(() => git.commit(thing))
         .then(() => git.raw(['checkout', '-b', thing]))
         .then(() => delay())
         ;
   }
};


const test = (context, assert) => {

   function assertion (dir) {
      return context.gitP(context.dir(dir)).branchLocal()
         .then((result) => ({
            dir,
            result,
         }));
   }

   const result = Promise.all([
      assertion('first'),
      assertion('second'),
      assertion('first'),
      assertion('second'),
      assertion('first'),
      assertion('second'),
      assertion('first'),
      assertion('second'),
   ]);

   return result.then(function (tests) {

      assert.equal(8, tests.length, 'Ran all tests');
      tests.forEach((test, index) => {
         assert.equal(
            test.dir, test.result.current, `Recognised the correct branch name for ${ index }`);
      });

   });
};

module.exports = new Test(setUp, test);
