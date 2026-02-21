import { join } from 'node:path';
import { exists } from '@kwsites/file-exists';
import { promiseError, PromiseResult, promiseResult } from '@kwsites/promise-result';
import { assertGitError, createTestContext, newSimpleGit, SimpleGitTestContext } from '@simple-git/test-utils';

import { GitPluginError } from '../..';

describe('plugin.unsafe', () => {
   let context: SimpleGitTestContext;

   process.env.DEBUG = 'simple-git,simple-git:*';

   beforeEach(async () => (context = await createTestContext()));

   describe('CVE-2022-25860: command execution using clone -u', () => {
      function pwnedPath() {
         return join(context.root, 'pwn', 'touched');
      }

      function isPwned() {
         return exists(pwnedPath());
      }

      function expectError(result: PromiseResult<unknown, Error>) {
         if (result.success) {
            expect(String(result.value).trim().startsWith('usage:')).toBe(true);
         } else {
            expect(result.error).toBeDefined();
         }

         expect(isPwned()).toBe(false);
      }

      beforeEach(async () => {
         await context.dir('pwn');

         const first = newSimpleGit(await context.dir('first'));
         await first.init();
      });

      it('allows local cloning', async () => {
         const result = await promiseResult(
            newSimpleGit({ baseDir: context.root })
               .clone('./first', './second'),
         );

         expect(result.success).toBe(true);
      });

      it('command injection report', async () => {
         for (const i of [45, 54, 52, 45, 118, 115, 113, 110, 108]) {
            expectError(
               await promiseResult(
                  newSimpleGit({ baseDir: context.root })
                     .clone('./first', './a', [String.fromCharCode(i) + '-u', `sh -c \"touch ${pwnedPath()}\"`]),
               ),
            );

            expectError(
               await promiseResult(
                  newSimpleGit({ baseDir: context.root })
                     .clone('./first', './b', ['-' + String.fromCharCode(i) + 'u', `sh -c \"touch ${pwnedPath()}\"`]),
               ),
            );

            expectError(
               await promiseResult(
                  newSimpleGit({ baseDir: context.root })
                     .clone('./first', './c', ['-u' + String.fromCharCode(i), `sh -c \"touch ${pwnedPath()}\"`]),
               ),
            );
         }
      }, 20000);

      it('allows clone command injection: `-u...` pattern', async () => {
         await promiseResult(
            newSimpleGit({ baseDir: context.root, unsafe: { allowUnsafePack: true } })
               .clone('./first', './c', ['-u', `sh -c \"touch ${pwnedPath()}\"`]),
         );

         expect(isPwned()).toBe(true);
      });
   });

   it('ignores non string arguments', async () => {
      const { threw } = await promiseResult(newSimpleGit(context.root).raw([['init']] as any));

      expect(threw).toBe(false);
   });

   it('allows overriding protocol when opting in to unsafe practices', async () => {
      const { threw } = await promiseResult(
         newSimpleGit(context.root, { unsafe: { allowUnsafeProtocolOverride: true } }).raw(
            '-c',
            'protocol.ext.allow=always',
            'init',
         ),
      );

      expect(threw).toBe(false);
   });

   it('prevents overriding protocol.ext.allow before the method of a command', async () => {
      assertGitError(
         await promiseError(context.git.raw('-c', 'protocol.ext.allow=always', 'init')),
         'Configuring protocol.allow is not permitted',
         GitPluginError,
      );
   });

   it('prevents overriding protocol.ext.allow after the method of a command', async () => {
      assertGitError(
         await promiseError(context.git.raw('init', '-c', 'protocol.ext.allow=always')),
         'Configuring protocol.allow is not permitted',
         GitPluginError,
      );
   });

   it('prevents adding a remote with vulnerable ext transport', async () => {
      assertGitError(
         await promiseError(
            context.git.clone(`ext::sh -c touch% /tmp/pwn% >&2`, '/tmp/example-new-repo', [
               '-c',
               'protocol.ext.allow=always',
            ]),
         ),
         'Configuring protocol.allow is not permitted',
         GitPluginError,
      );
   });
});
