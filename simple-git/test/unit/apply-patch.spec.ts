import { SimpleGit, TaskOptions } from 'typings';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
} from './__fixtures__';
import { promiseError } from '@kwsites/promise-result';

describe('applyPatch', () => {
   describe('commands', () => {
      let git: SimpleGit;

      const applyPatchTests: [keyof SimpleGit, string, Array<string | TaskOptions>, string[]][] = [
         ['applyPatch', 'with one file', ['./diff'], ['apply', './diff']],
         [
            'applyPatch',
            'with multiple files',
            [['./diff1', './diff2']],
            ['apply', './diff1', './diff2'],
         ],
         [
            'applyPatch',
            'with options array',
            ['./diff', ['--stat']],
            ['apply', '--stat', './diff'],
         ],
         [
            'applyPatch',
            'with options object',
            ['./diff', { '-p': 2 }],
            ['apply', '-p=2', './diff'],
         ],
      ];

      beforeEach(() => (git = newSimpleGit()));

      it.each(applyPatchTests)(
         'callbacks - %s %s',
         async (api, name, applyPatchArgs, executedCommands) => {
            const callback = jest.fn();
            const queue = (git[api] as any)(...applyPatchArgs, callback);
            await closeWithSuccess(name);

            expect(await queue).toBe(name);
            expect(callback).toHaveBeenCalledWith(null, name);
            assertExecutedCommands(...executedCommands);
         }
      );

      it.each(applyPatchTests)(
         `promises - %s %s`,
         async (api, name, applyPatchArgs, executedCommands) => {
            const queue = (git[api] as any)(...applyPatchArgs);
            await closeWithSuccess(name);

            expect(await queue).toBe(name);
            assertExecutedCommands(...executedCommands);
         }
      );
   });

   describe('usage', () => {
      let callback: jest.Mock;

      const tests: Array<[string, RegExp | null, 'Y' | 'N', (git: SimpleGit) => Promise<string>]> =
         [
            ['patch   - no-opt     - no-callback  ', null, 'N', (git) => git.applyPatch('foo')],
            [
               'patch   - array-opt  - no-callback  ',
               null,
               'N',
               (git) => git.applyPatch('foo', ['--opt']),
            ],
            [
               'patch   - object-opt - no-callback  ',
               null,
               'N',
               (git) => git.applyPatch('foo', { '--opt': null }),
            ],
            [
               'patch   - no-opt     - with-callback',
               null,
               'Y',
               (git) => git.applyPatch('foo', callback),
            ],
            [
               'patch   - array-opt  - with-callback',
               null,
               'Y',
               (git) => git.applyPatch('foo', ['--opt'], callback),
            ],
            [
               'patch   - object-opt - with-callback',
               null,
               'Y',
               (git) => git.applyPatch('foo', { '--opt': null }, callback),
            ],
            [
               'patches - no-opt     - no-callback  ',
               null,
               'N',
               (git) => git.applyPatch(['foo', 'bar']),
            ],
            [
               'patches - array-opt  - no-callback  ',
               null,
               'N',
               (git) => git.applyPatch(['foo', 'bar'], ['--opt']),
            ],
            [
               'patches - object-opt - no-callback  ',
               null,
               'N',
               (git) => git.applyPatch(['foo', 'bar'], { '--opt': null }),
            ],
            [
               'patches - no-opt     - with-callback',
               null,
               'Y',
               (git) => git.applyPatch(['foo', 'bar'], callback),
            ],
            [
               'patches - array-opt  - with-callback',
               null,
               'Y',
               (git) => git.applyPatch(['foo', 'bar'], ['--opt'], callback),
            ],
            [
               'patches - object-opt - with-callback',
               null,
               'Y',
               (git) => git.applyPatch(['foo', 'bar'], { '--opt': null }, callback),
            ],

            [
               'error: no patches',
               /string patches/,
               'N',
               (git) => git.applyPatch({ '--opt': null } as any),
            ],
         ];

      beforeEach(() => (callback = jest.fn()));

      it.each(tests)(`git.applyPatch %s`, async (name, error, withCallback, task) => {
         const result = task(newSimpleGit());

         if (error) {
            return assertGitError(await promiseError(result), error);
         }

         await closeWithSuccess(name);
         expect(await result).toBe(name);

         if (withCallback === 'Y') {
            expect(callback).toHaveBeenCalledWith(null, name);
         }
      });
   });
});
