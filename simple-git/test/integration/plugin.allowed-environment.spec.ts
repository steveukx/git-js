import { beforeEach, describe, it } from 'vitest';
import {
   assertGitError,
   createTestContext,
   type SimpleGitTestContext,
} from '@simple-git/test-utils';
import { promiseError } from '@kwsites/promise-result';
import { simpleGit } from '../../src/lib/git-factory';
import { GitConfigurationError } from '../../src/lib/errors/git-configuration-error';

const DISALLOWED_ABBREVIATED = 'disallowed abbreviated or ambiguous option';

describe('allowed-environment', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => {
      context = await createTestContext();

      await simpleGit(await context.dir('first')).init();
   });

   it('blocks clone with inline config', async () => {
      const err = await promiseError(
         simpleGit(context.root).raw('clone', '--conf=user.name=pwn', '--', './first', 'second')
      );

      assertGitError(err, DISALLOWED_ABBREVIATED, GitConfigurationError);
   });
});
