import { createTestContext } from '@simple-git/test-utils';

const EMPTY_SHA = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
const EMPTY_SHA_256 = '6ef19b41225c5369f1c104d45d8d85efa9b057b53b14b4b9b939dd74decc5321';

describe('empty-tree-commit', () => {
   it('gets the empty tree commit', async () => {
      const context = await createTestContext();
      const commit = await context.git.emptyTreeCommit();

      expect(commit === EMPTY_SHA || commit === EMPTY_SHA_256).toBe(true);
   });
});
