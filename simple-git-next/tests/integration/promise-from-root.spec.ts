import { createTestContext, newSimpleGit, SimpleGitTestContext } from '@simple-git/test-utils';

describe('promises-from-root', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));

   it('chains through the default export', async () => {
      const onInit = jest.fn();
      const onShowTopLevel = jest.fn();
      const onError = jest.fn();

      const git = newSimpleGit(context.root);
      const queue = git
         .init()
         .then(onInit)
         .then(() => git.revparse(['--show-toplevel']))
         .then(onShowTopLevel)
         .catch((err) => onError(err));

      await queue;
      expect(onInit).toHaveBeenCalled();
      expect(onShowTopLevel).toHaveBeenCalledWith(context.rootResolvedPath);
      expect(onError).not.toHaveBeenCalled();
   });

   it('calls provided callbacks when chained through root export', async () => {
      const onInit = jest.fn();
      const onShowTopLevel = jest.fn();

      const queue = newSimpleGit(context.root)
         .init(onInit)
         .revparse(['--show-toplevel'], onShowTopLevel);

      expect(await queue).toBe(context.rootResolvedPath);
      expect(onInit).toHaveBeenCalled();
      expect(onShowTopLevel).toHaveBeenCalledWith(null, context.rootResolvedPath);
   });
});
