import { chmod } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { exists, FILE } from '@kwsites/file-exists';
import { promiseResult } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   setUpFilesAdded,
   setUpInit,
   type SimpleGitTestContext,
} from '@simple-git/test-utils';
import { GitConfigurationError } from '../../../src/lib/errors/git-configuration-error';

async function plantPayload(context: SimpleGitTestContext, pwnd: string) {
   const payload = await context.file('payload.sh', `#!/bin/sh\ntouch ${pwnd}\nexit 1\n`);
   await chmod(payload, 0o755);

   return payload;
}

async function createRepo(context: SimpleGitTestContext, contextDir: string) {
   const dir = await context.dir(contextDir);
   const git = newSimpleGit(dir);

   await setUpInit({ git });
   await setUpFilesAdded({ git, files: context.files }, [
      [contextDir, 'aaa'],
      [contextDir, 'bbb'],
   ]);

   return dir;
}

describe('abbreviations are disallowed', () => {
   it('blocks: abbreviated upload-pack in fetch', async () => {
      const context = await createTestContext();
      const remote = await createRepo(context, 'poc-remote');
      const cloned = context.path('poc-clone');

      await newSimpleGit(context.root).clone(remote, cloned);

      const pwnd = context.path('poc-pwned');
      const evil = await plantPayload(context, pwnd);

      const out = await promiseResult(
         newSimpleGit(cloned).raw('fetch', `--upload-p=${evil}`, remote)
      );

      expect(out.threw).toBe(true);
      expect(exists(pwnd, FILE)).toBe(false);
      assertGitError(out.error, 'disallowed abbreviated', GitConfigurationError);
   });

   it('blocks: abbreviated config in clone', async () => {
      const context = await createTestContext();
      const remote = await createRepo(context, 'poc-remote');
      const cloned = context.path('poc-clone');

      await newSimpleGit(context.root).clone(remote, cloned);

      const pwnd = context.path('poc-pwned');
      const evil = await plantPayload(context, pwnd);

      const out = await promiseResult(
         newSimpleGit(context.root).clone(remote, cloned, [`--conf=core.sshCommand=${evil}`])
      );

      expect(out.threw).toBe(true);
      expect(exists(pwnd, FILE)).toBe(false);
      assertGitError(out.error, 'disallowed abbreviated', GitConfigurationError);
   });
});
