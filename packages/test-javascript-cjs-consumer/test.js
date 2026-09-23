const { CleanOptions, simpleGit, TaskConfigurationError } = require('simple-git');

async function testSingleReturn() {
   expect(await simpleGit().checkIsRepo()).toBe(true);
}

async function testErrorConstructor() {
   expect(new TaskConfigurationError('foo')).toBeInstanceOf(TaskConfigurationError);
}

async function testEnumExport() {
   expect(CleanOptions.DRY_RUN === 'n').toBe(true);
}

function expect(expected) {
   return {
      toBe(actual) {
         if (actual !== expected) {
            throw new Error(`Expected ${expected} to be ${actual}`);
         }
      },
      toBeInstanceOf(actual) {
         if (!(expected instanceof actual)) {
            throw new Error(`Expected ${expected} to be instanceof ${actual}`);
         }
      },
      toBeDefined() {
         if (expected === undefined) {
            throw new Error(`Expected ${expected} not to be undefined`);
         }
      },
   };
}

(async function (...tests) {
   await tests.reduce((chain, test) => {
      return chain.then(() => {
         console.log(`Running ${test.name}`);
         test();
      });
   }, Promise.resolve());
   console.log(`Tests complete`);
})(testSingleReturn, testErrorConstructor, testEnumExport);
