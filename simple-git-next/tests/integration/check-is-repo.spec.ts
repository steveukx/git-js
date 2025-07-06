import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

import { CheckRepoActions } from '../../src/lib/tasks/check-is-repo';

describe('check-is-repo', () => {
   let context: SimpleGitTestContext;
   let roots: { [key: string]: string };

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      roots = {
         realRoot: await context.dir('real-root'),
         realSubRoot: await context.dir('real-root', 'foo'),
         fakeRoot: await context.dir('fake-root'),
         bareRoot: await context.dir('bare-root'),
      };

      await newSimpleGit(roots.realRoot).init();
      await newSimpleGit(roots.bareRoot).init(true);
   });

   it('throws errors other than in-repo detection errors', async () => {
      const git = newSimpleGit(roots.realRoot).customBinary('nonsense');
      const catcher = jest.fn((err) => {
         assertGitError(err, 'nonsense');
      });

      await git.checkIsRepo().catch(catcher);
      expect(catcher).toHaveBeenCalled();
   });

   it('in-tree detection passes for a real root', async () => {
      expect(await newSimpleGit(roots.realRoot).checkIsRepo()).toBe(true);
      expect(await newSimpleGit(roots.realRoot).checkIsRepo(CheckRepoActions.IN_TREE)).toBe(true);
   });

   it('in-tree detection passes for a child directory of a real root', async () => {
      expect(await newSimpleGit(roots.realSubRoot).checkIsRepo()).toBe(true);
      expect(await newSimpleGit(roots.realSubRoot).checkIsRepo(CheckRepoActions.IN_TREE)).toBe(
         true
      );
   });

   it('detects the root of a repo', async () => {
      expect(await newSimpleGit(roots.realRoot).checkIsRepo(CheckRepoActions.IS_REPO_ROOT)).toBe(
         true
      );
      expect(await newSimpleGit(roots.bareRoot).checkIsRepo(CheckRepoActions.IS_REPO_ROOT)).toBe(
         true
      );
      expect(await newSimpleGit(roots.realSubRoot).checkIsRepo(CheckRepoActions.IS_REPO_ROOT)).toBe(
         false
      );
   });

   it('detects the bare status of a repo', async () => {
      expect(await newSimpleGit(roots.fakeRoot).checkIsRepo(CheckRepoActions.BARE)).toBe(false);
      expect(await newSimpleGit(roots.realRoot).checkIsRepo(CheckRepoActions.BARE)).toBe(false);
      expect(await newSimpleGit(roots.bareRoot).checkIsRepo(CheckRepoActions.BARE)).toBe(true);
   });

   it('detects being outside of a working directory', async () => {
      expect(await newSimpleGit(roots.fakeRoot).checkIsRepo()).toBe(false);
      expect(await newSimpleGit(roots.fakeRoot).checkIsRepo(CheckRepoActions.BARE)).toBe(false);
      expect(await newSimpleGit(roots.fakeRoot).checkIsRepo(CheckRepoActions.IS_REPO_ROOT)).toBe(
         false
      );
      expect(await newSimpleGit(roots.fakeRoot).checkIsRepo(CheckRepoActions.IN_TREE)).toBe(false);
   });
});
