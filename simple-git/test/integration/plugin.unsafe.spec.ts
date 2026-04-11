import {join} from 'node:path';
import {exists} from '@kwsites/file-exists';
import {promiseError, promiseResult} from '@kwsites/promise-result';
import {assertGitError, createTestContext, newSimpleGit, SimpleGitTestContext} from '@simple-git/test-utils';

import {GitPluginError} from '../..';

describe('plugin.unsafe', () => {
   let context: SimpleGitTestContext;

   function pwnedPath() {
      return join(context.root, 'pwn', 'touched');
   }

   function isPwned() {
      return exists(pwnedPath());
   }

   process.env.DEBUG = 'simple-git,simple-git:*';

   beforeEach(async () => (context = await createTestContext()));

   describe('Command injection through .env', () => {
      beforeEach( () => context.git.init());
      beforeEach(() => context.dir('pwn'));

      it('blocks core.fsmonitor by default', async () => {
         const result = await promiseResult(
            newSimpleGit(context.root).raw(
               '-c', `core.fsmonitor=touch ${pwnedPath()}`, 'status'
            )
         );

         assertGitError(result.error, 'allowUnsafeFsMonitor')
         expect(isPwned()).toBe(false);


         const unsafeResult = await promiseResult(
            newSimpleGit(context.root, { unsafe: { allowUnsafeFsMonitor: true }}).raw(
               '-c', `core.fsmonitor=touch ${pwnedPath()}`, 'status'
            )
         );

         expect(unsafeResult.threw).toBe(false);
         expect(isPwned()).toBe(true);
      });
   });

   describe('CVE-2022-25860: command execution using clone -u', () => {
      function pwnedPath() {
         return join(context.root, 'pwn', 'touched');
      }

      function isPwned() {
         return exists(pwnedPath());
      }

      beforeEach(async () => {
         await context.dir('pwn');

         const first = newSimpleGit(await context.dir('first'));
         await first.init();
      });

      it('allows local cloning without checkout', async () => {
         const result = await promiseResult(
            newSimpleGit({ baseDir: context.root })
               .clone('./first', './second', ['--no-checkout']),
         );

         expect(result.success).toBe(true);
      });

      it('allows local cloning', async () => {
         const result = await promiseResult(
            newSimpleGit({ baseDir: context.root })
               .clone('./first', './second'),
         );

         expect(result.success).toBe(true);
      });

      describe.each([
         ["", true, true, true],
         ["-", true, true, false],
         ["4", false, true, false],
         ["6", false, true, false],
         ["v", false, true, false],
         ["q", false, true, false],
         ["n", false, true, false],
         ["l", false, true, false],
      ])('clone -u alongside "%s"', (str, canPwnPrefix, canPwnMid, canPwnSuffix) => {

         it('can pwn when prefixing the -u', async () => {
            await promiseResult(
               newSimpleGit({ baseDir: context.root, unsafe: { allowUnsafePack: true } })
                  .clone('./first', './c', [`${str}-u`, `sh -c \"touch ${pwnedPath()}\"`]),
            );
            expect(isPwned()).toBe(canPwnPrefix);
         });

         it('can pwn when between the - and u', async () => {
            await promiseResult(
               newSimpleGit({ baseDir: context.root, unsafe: { allowUnsafePack: true } })
                  .clone('./first', './c', [`-${str}u`, `sh -c \"touch ${pwnedPath()}\"`]),
            );
            expect(isPwned()).toBe(canPwnMid);
         });

         it('cannot pwn when suffixing the -u', async () => {
            await promiseResult(
               newSimpleGit({ baseDir: context.root, unsafe: { allowUnsafePack: true } })
                  .clone('./first', './c', [`-u${str}`, `sh -c \"touch ${pwnedPath()}\"`]),
            );
            expect(isPwned()).toBe(canPwnSuffix);
         });

         it('blocks pwn when prefixing the -u', async () => {
            await promiseResult(
               newSimpleGit({ baseDir: context.root })
                  .clone('./first', './c', [`${str}-u`, `sh -c \"touch ${pwnedPath()}\"`]),
            );
            expect(isPwned()).toBe(false);
         });

         it('blocks pwn when between the - and u', async () => {
            await promiseResult(
               newSimpleGit({ baseDir: context.root })
                  .clone('./first', './c', [`-${str}u`, `sh -c \"touch ${pwnedPath()}\"`]),
            );
            expect(isPwned()).toBe(false);
         });

         it('blocks pwn when suffixing the -u', async () => {
            await promiseResult(
               newSimpleGit({ baseDir: context.root })
                  .clone('./first', './c', [`-u${str}`, `sh -c \"touch ${pwnedPath()}\"`]),
            );
            expect(isPwned()).toBe(false);
         });
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
