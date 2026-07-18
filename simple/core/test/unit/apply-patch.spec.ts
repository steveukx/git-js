import { promiseError } from '@kwsites/promise-result';

import type { SimpleGitCore, TaskOptions } from '../../index';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
} from '../__fixtures__';

describe('applyPatch', () => {
   describe('commands', () => {
      let git: SimpleGitCore;

      const applyPatchTests: [
         keyof SimpleGitCore,
         string,
         Array<string | TaskOptions>,
         string[],
      ][] = [
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
      const tests: Array<
         [string, RegExp | null, 'Y' | 'N', (git: SimpleGitCore) => Promise<string>]
      > = [
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
         ['patch   - no-opt     - with-callback', null, 'Y', (git) => git.applyPatch('foo')],
         [
            'patch   - array-opt  - with-callback',
            null,
            'Y',
            (git) => git.applyPatch('foo', ['--opt']),
         ],
         [
            'patch   - object-opt - with-callback',
            null,
            'Y',
            (git) => git.applyPatch('foo', { '--opt': null }),
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
            (git) => git.applyPatch(['foo', 'bar']),
         ],
         [
            'patches - array-opt  - with-callback',
            null,
            'Y',
            (git) => git.applyPatch(['foo', 'bar'], ['--opt']),
         ],
         [
            'patches - object-opt - with-callback',
            null,
            'Y',
            (git) => git.applyPatch(['foo', 'bar'], { '--opt': null }),
         ],

         [
            'error: no patches',
            /string patches/,
            'N',
            (git) => git.applyPatch({ '--opt': null } as any),
         ],
      ];

      it.each(tests)(`git.applyPatch %s`, async (name, error, withCallback, task) => {
         const result = task(newSimpleGit());

         if (error) {
            return assertGitError(await promiseError(result), error);
         }

         await closeWithSuccess(name);
         expect(await result).toBe(name);

         if (withCallback === 'Y') {
         }
      });
   });
});
