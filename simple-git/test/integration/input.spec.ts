import { createTestContext, newSimpleGit, SimpleGitTestContext } from '@simple-git/test-utils';

describe('input', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => {
      context = await createTestContext();
      await newSimpleGit(context.root).init();
   });

   it('feeds stdin to interpret-trailers --parse', async () => {
      const message = ['Fix bug', '', 'Signed-off-by: Test User <test@example.com>'].join('\n');
      const out = await newSimpleGit(context.root)
         .input(message)
         .raw(['interpret-trailers', '--parse']);
      expect(out).toContain('Signed-off-by: Test User <test@example.com>');
   });

   it('feeds stdin to hash-object --stdin', async () => {
      const hash = await newSimpleGit(context.root).input('hello\n').raw(['hash-object', '--stdin']);
      expect(hash.trim()).toBe('ce013625030ba8dba906f756967f9e9ca394464a');
   });

   it('succeeds when git ignores supplied stdin', async () => {
      const inside = await newSimpleGit(context.root)
         .input('ignored')
         .raw(['rev-parse', '--is-inside-work-tree']);
      expect(inside.trim()).toBe('true');
   });
});
