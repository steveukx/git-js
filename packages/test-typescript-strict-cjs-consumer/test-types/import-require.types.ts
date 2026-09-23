import SimpleGit = require('simple-git');

export async function testSingleReturn() {
   expect(await SimpleGit.simpleGit().checkIsRepo()).toBe(true);
}

export async function testErrorConstructor() {
   expect(new SimpleGit.TaskConfigurationError('foo')).toBeInstanceOf(
      SimpleGit.TaskConfigurationError
   );
}

export async function testEnumExport() {
   expect(SimpleGit.CleanOptions.DRY_RUN === 'n').toBe(true);
}

export async function testInterfaceExport() {
   const git: SimpleGit.SimpleGit = SimpleGit.simpleGit();
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

export const tests = [testSingleReturn, testErrorConstructor, testEnumExport, testInterfaceExport];
