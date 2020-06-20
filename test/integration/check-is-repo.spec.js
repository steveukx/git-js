import { GitError } from "../../src/lib/api";

const {createTestContext} = require('../helpers');
const {CheckRepoActions} = require('../../');

describe('check-is-repo', () => {

   let context;

   beforeEach(() => context = createTestContext());
   beforeEach(async () => {
      context.realRoot = context.dir('real-root');
      context.realSubRoot = context.dir('real-root', 'foo');
      context.fakeRoot = context.dir('fake-root');
      context.bareRoot = context.dir('bare-root');

      await context.git(context.realRoot).init();
      await context.git(context.bareRoot).init(true);
   });

   it('throws errors other than in-repo detection errors', async () => {
      const git = context.gitP(context.realRoot).customBinary('nonsense');
      const catcher = jest.fn(err => {
         expect(err).toBeInstanceOf(GitError);
         expect(err.message).toMatch('nonsense');
      });

      await git.checkIsRepo().catch(catcher);
      expect(catcher).toHaveBeenCalled();
   });

   it('in-tree detection passes for a real root', async () => {
      expect(await context.git(context.realRoot).checkIsRepo()).toBe(true);
      expect(await context.git(context.realRoot).checkIsRepo(CheckRepoActions.IN_TREE)).toBe(true);
   });

   it('in-tree detection passes for a child directory of a real root', async () => {
      expect(await context.git(context.realSubRoot).checkIsRepo()).toBe(true);
      expect(await context.git(context.realSubRoot).checkIsRepo(CheckRepoActions.IN_TREE)).toBe(true);
   });

   it('detects the root of a repo', async () => {
      expect(await context.git(context.realRoot).checkIsRepo(CheckRepoActions.IS_REPO_ROOT)).toBe(true);
      expect(await context.git(context.bareRoot).checkIsRepo(CheckRepoActions.IS_REPO_ROOT)).toBe(true);
      expect(await context.git(context.realSubRoot).checkIsRepo(CheckRepoActions.IS_REPO_ROOT)).toBe(false);
   });

   it('detects the bare status of a repo', async () => {
      expect(await context.git(context.fakeRoot).checkIsRepo(CheckRepoActions.BARE)).toBe(false);
      expect(await context.git(context.realRoot).checkIsRepo(CheckRepoActions.BARE)).toBe(false);
      expect(await context.git(context.bareRoot).checkIsRepo(CheckRepoActions.BARE)).toBe(true);
   });

   it('detects being outside of a working directory', async () => {
      expect(await context.git(context.fakeRoot).checkIsRepo()).toBe(false);
      expect(await context.git(context.fakeRoot).checkIsRepo(CheckRepoActions.BARE)).toBe(false);
      expect(await context.git(context.fakeRoot).checkIsRepo(CheckRepoActions.IS_REPO_ROOT)).toBe(false);
      expect(await context.git(context.fakeRoot).checkIsRepo(CheckRepoActions.IN_TREE)).toBe(false);
   });

});
