import { chmod } from 'node:fs/promises';
import { exists, FILE } from '@kwsites/file-exists';
import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   type SimpleGitTestContext,
   setUpInit,
} from '@simple-git/test-utils';
import type { SimpleGitOptions } from 'simple-git';
import { beforeEach, describe, expect, it } from 'vitest';
import { readDocSection, runDocExample } from './doc-examples';

/**
 * Runs the examples in docs/PLUGIN-UNSAFE-ACTIONS.md, read directly from the markdown.
 *
 * Every code block in a covered section needs a `doc-test` marker, and every marker needs an
 * entry in that section's `expectations` below. When an example is added, changed or removed,
 * update its expectation here too: the coverage tests fail until the two match one to one.
 */

interface Expectation {
   /** The example must reject with an error whose message contains this text */
   rejects?: string;

   /** Checks the repository after the example has run */
   verify: (context: SimpleGitTestContext) => Promise<void>;
}

const sections: Record<string, Record<string, Expectation>> = {
   'Environment-based configuration': {
      'env-config/not-allowed': {
         rejects: 'allowEnvironment',
         async verify({ git }) {
            expect(await promiseError(git.raw('rev-parse', 'HEAD'))).toBeDefined();
         },
      },
      'env-config/safe-key': {
         async verify({ git }) {
            expect(await git.raw('log', '-1', '--format=%ae')).toBe('ci-bot@example.com\n');
         },
      },
      'env-config/unsafe-key': {
         async verify({ git, path }) {
            expect(await git.raw('log', '-1', '--format=%s')).toBe('message\n');
            expect(exists(path('hook-ran'), FILE)).toBe(true);
         },
      },
   },
};

describe.each(Object.entries(sections))(
   'docs/PLUGIN-UNSAFE-ACTIONS.md: %s',
   (heading, expectations) => {
      const { examples, unmarked } = readDocSection('PLUGIN-UNSAFE-ACTIONS.md', heading);

      it('has a doc-test marker on every code block', () => {
         expect(unmarked).toEqual([]);
      });

      it('has an expectation for every example, and an example for every expectation', () => {
         expect(examples.map(({ id }) => id).sort()).toEqual(Object.keys(expectations).sort());
      });

      let context: SimpleGitTestContext;

      beforeEach(async () => {
         context = await createTestContext();
         await setUpInit(context);

         // a file to commit, and a pre-commit hook that shows when core.hooksPath is applied
         await context.file('file.txt');
         await context.git.add('file.txt');
         const hook = await context.file(
            ['.githooks', 'pre-commit'],
            `#!/bin/sh\ntouch "${context.path('hook-ran')}"\n`
         );
         await chmod(hook, 0o755);
      });

      it.each(examples.map((example) => [example.id, example] as const))(
         'example %s',
         async (id, example) => {
            const expectation = expectations[id];
            expect(expectation, `no expectation for doc-test ${id}`).toBeDefined();

            const simpleGit = (options: Partial<SimpleGitOptions> = {}) =>
               newSimpleGit({ ...options, baseDir: context.root });
            const err = await promiseError(runDocExample(example, simpleGit));

            if (expectation.rejects) {
               assertGitError(err, expectation.rejects);
            } else {
               expect(err).toBeUndefined();
            }

            await expectation.verify(context);
         }
      );
   }
);

describe('environment-based configuration beyond the documented examples', () => {
   it('blocks an unsafe key that is not named in allowConfig', async () => {
      const context = await createTestContext();
      await setUpInit(context);

      const err = await promiseError(
         newSimpleGit(context.root, {
            allowEnvironment: ['GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0', 'GIT_CONFIG_VALUE_0'],
         })
            .env({
               GIT_CONFIG_COUNT: '1',
               GIT_CONFIG_KEY_0: 'core.hooksPath',
               GIT_CONFIG_VALUE_0: './.githooks',
            })
            .commit('message', { '--allow-empty': null })
      );

      assertGitError(err, 'allowConfig');
   });
});
