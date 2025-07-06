import { promiseError, promiseResult } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   SimpleGitTestContext,
   wait,
} from '@simple-git/test-utils';
import { SimpleGit } from '../../typings';

describe('change-directory', () => {
   let context: SimpleGitTestContext;
   let goodDir: string;
   let badDir: string;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      goodDir = await context.dir('good');
      badDir = await context.path('good', 'bad');
   });

   it('cwd with path config starts new chain by default', async () => {
      await context.dir('foo', 'bar');
      await newSimpleGit(context.root).init();

      // root chain with a configured working directory
      const root = newSimpleGit(await context.path('good'));

      // other chains with their own working directories
      const foo = root.cwd({ path: await context.path('foo') });
      const bar = root.cwd({ path: await context.path('foo', 'bar') });

      const offsets = await Promise.all([showPrefix(foo), showPrefix(bar), showPrefix(root)]);

      expect(offsets).toEqual(['foo/', 'foo/bar/', 'good/']);
   });

   it('cwd with path config can act on root instance', async () => {
      await context.dir('foo', 'bar');
      await newSimpleGit(context.root).init();

      // root chain with a configured working directory
      const root = newSimpleGit(await context.path('good'));

      // other chains with their own working directories
      const foo = root.cwd({ path: await context.path('foo'), root: true });

      const offsets = await Promise.all([showPrefix(foo), showPrefix(root)]);

      expect(offsets).toEqual(['foo/', 'foo/']);
   });

   it('switches into new directory - happy path promise', async () => {
      const result = await promiseResult(newSimpleGit(context.root).cwd(goodDir));
      expect(result).toEqual(
         expect.objectContaining({
            success: true,
            threw: false,
            result: goodDir,
         })
      );
   });

   it('switches into new directory - sad path promise', async () => {
      const result = await promiseError(newSimpleGit(context.root).cwd(badDir));
      assertGitError(result, badDir);
   });

   it('switches into new directory - chained with callbacks', async () => {
      const spies = [jest.fn(), jest.fn(), jest.fn()];

      newSimpleGit(context.root)
         .cwd(goodDir, spies[0])
         .cwd(badDir, spies[1])
         .cwd(goodDir, spies[2]);

      await wait(250);

      expect(spies[0]).toHaveBeenCalledWith(null, goodDir);
      expect(spies[1]).toHaveBeenCalledWith(expect.any(Error), undefined);
      expect(spies[2]).not.toHaveBeenCalled();
   });

   function showPrefix(git: SimpleGit) {
      return git.raw('rev-parse', '--show-prefix').then((s) => String(s).trim());
   }
});
