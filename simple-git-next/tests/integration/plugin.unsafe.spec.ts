import { promiseError, promiseResult } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

import { GitPluginError } from '../..';

describe('add', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));

   it('ignores non string arguments', async () => {
      const { threw } = await promiseResult(newSimpleGit(context.root).raw([['init']] as any));

      expect(threw).toBe(false);
   });

   it('allows overriding protocol when opting in to unsafe practices', async () => {
      const { threw } = await promiseResult(
         newSimpleGit(context.root, { unsafe: { allowUnsafeProtocolOverride: true } }).raw(
            '-c',
            'protocol.ext.allow=always',
            'init'
         )
      );

      expect(threw).toBe(false);
   });

   it('prevents overriding protocol.ext.allow before the method of a command', async () => {
      assertGitError(
         await promiseError(context.git.raw('-c', 'protocol.ext.allow=always', 'init')),
         'Configuring protocol.allow is not permitted',
         GitPluginError
      );
   });

   it('prevents overriding protocol.ext.allow after the method of a command', async () => {
      assertGitError(
         await promiseError(context.git.raw('init', '-c', 'protocol.ext.allow=always')),
         'Configuring protocol.allow is not permitted',
         GitPluginError
      );
   });

   it('prevents adding a remote with vulnerable ext transport', async () => {
      assertGitError(
         await promiseError(
            context.git.clone(`ext::sh -c touch% /tmp/pwn% >&2`, '/tmp/example-new-repo', [
               '-c',
               'protocol.ext.allow=always',
            ])
         ),
         'Configuring protocol.allow is not permitted',
         GitPluginError
      );
   });
});
