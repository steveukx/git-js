const {createTestContext} = require('../../helpers');

module.exports = Test;

function Test (setup, test) {

   const context = createTestContext();

   this.setUp = function (done) {
      Promise.resolve(context)
         .then(setup)
         .then(() => {
            done()
         });
   };

   this.tearDown = function (done) {
      done();
   };

   this.test = function (runner) {
      const done = (result) => {
         if (result && result.message) {
            runner.ok(false, result.message);
         }

         runner.done();
      };

      Promise.resolve()
         .then(() => test(context, runner))
         .then(done, done);
   };
}
