import { promiseResult } from '@kwsites/promise-result';
import { createTestContext, newSimpleGit } from '@simple-git/test-utils';
import { describe, expect, it } from 'vitest';

describe('plugin.input', () => {
   const trailers = `
Signed-off-by: Steve King <steve@example.com>
Co-authored-by: Jane Doe <jane@example.com>
Issue: #123`.trim();

   it('allows supply of input content', async () => {
      const context = await createTestContext();
      const git = newSimpleGit({
         baseDir: context.root,
         trimmed: true,
         input() {
            return `
Makes some fixes.

Another part of the description of the fixes.

${trailers}
            `;
         },
      });
      const task = git.raw('interpret-trailers', '--parse');
      const response = await promiseResult(task);

      expect(response.value).toBe(trailers);
   });
});
