/*
   This test covers creating a promise API wrapped instance of the library on a directory that does not exist
 */
const Test = require('./include/runner');
const Path = require('path');

const setUp = (context) => {
   return Promise.resolve();
};

module.exports = {
   'promise': new Test(setUp, (context, assert) => {
      let result = context.deferred();

      let git = context.gitP(Path.join(context.root, 'foo')).silent(true);

      git.status()
         .then(() => result.resolve(new Error('Should have been an error when constructing')))
         .catch((e) => {
            assert.ok(!!e, 'Was an error when constructing');
            result.resolve();
         });

      return result.promise;
   })
};
