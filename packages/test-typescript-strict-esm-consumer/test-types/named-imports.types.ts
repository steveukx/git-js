import { CleanOptions, type SimpleGit, simpleGit, TaskConfigurationError } from 'simple-git';

export async function testSingleReturn() {
   expect(await simpleGit().checkIsRepo()).toBe(true);
}

export async function testErrorConstructor() {
   expect(new TaskConfigurationError('foo')).toBeInstanceOf(TaskConfigurationError);
}

export async function testEnumExport() {
   expect(CleanOptions.DRY_RUN === 'n').toBe(true);
}
export async function testInterfaceExport() {
   const git: SimpleGit = simpleGit();
   expect(git).toBeDefined();
}

function expect<T>(expected: T) {
   return {
      toBe(actual: T) {
         if (actual !== expected) {
            throw new Error(`Expected ${expected} to be ${actual}`);
         }
      },
      toBeInstanceOf(actual: new (...args: never[]) => T) {
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

(async function (...tests: Array<() => Promise<void>>) {
   await tests.reduce((chain, test) => {
      return chain.then(() => {
         console.log(`Running ${test.name}`);
         test();
      });
   }, Promise.resolve());
   console.log(`Tests complete`);
})(testSingleReturn, testErrorConstructor, testEnumExport, testInterfaceExport);
