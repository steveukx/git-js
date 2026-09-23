import { assertGitError, createTestContext } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';
import { promiseError } from '@kwsites/promise-result';
import { TaskConfigurationError } from '../../src/lib/errors/task-configuration-error';

describe('interpretTrailers', () => {
   const commitMessage = `Feature description goes here

Signed-off-by: Steve King <steve@example.com>
Co-authored-by: Jane Doe <jane@example.com>
Issue: #123
`;

   it('detects trailers in commit message', async () => {
      const context = await createTestContext();
      const response = await context.git.interpretTrailers(commitMessage);

      expect(response).toEqual({
         'signedOffBy': 'Steve King <steve@example.com>',
         'coAuthoredBy': 'Jane Doe <jane@example.com>',
         'issue': '#123',
      });
   });

   it('returns empty object when none found', async () => {
      const context = await createTestContext();
      const response = await context.git.interpretTrailers('commitMessage');

      expect(response).toEqual({});
   });

   it('returns empty object when none supplied', async () => {
      const context = await createTestContext();
      const response = await context.git.interpretTrailers(Buffer.from(''));

      expect(response).toEqual({});
   });

   it('throws when commit message not supplied', async () => {
      const context = await createTestContext();
      // @ts-expect-error
      const error = promiseError(context.git.interpretTrailers());

      assertGitError(
         await error,
         'interpretTrailers called without input content',
         TaskConfigurationError
      );
   });
});
