import { createTestContext, setUpIgnored, setUpInit, SimpleGitTestContext } from '@simple-git/test-utils';
import { join } from 'node:path';

describe('checkIgnore', () => {

   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await setUpIgnored(context, ['ignored', 'partially/untracked']);
   });

   it('detects ignored files - relative paths', async () => {
      const actual = await context.git.checkIgnore([
         'ignored/anything',
         'tracked/anything',
         'partially/tracked',
         'partially/untracked/file',
      ]);

      expect(actual).toEqual([
         'ignored/anything',
         'partially/untracked/file',
      ]);
   });

   it('detects ignored files - absolute paths', async () => {
      const paths = [
         join(context.root, 'ignored', 'anything'),
         join(context.root, 'tracked', 'anything'),
         join(context.root, 'partially', 'tracked'),
         join(context.root, 'partially', 'untracked', 'file'),
      ];
      const actual = await context.git.checkIgnore(paths);

      expect(actual).toEqual([
         paths[0],
         paths[3],
      ]);
   });
});
