const {theCommandRun, closeWithError, closeWithSuccess, newSimpleGit, restore, wait} = require('./include/setup');
const {assertGitError, catchAsync} = require('../helpers');

const {CheckRepoActions} = require('../..');

describe('checkIsRepo', () => {

   const EXIT_UNCLEAN = 128;
   const EXIT_ERROR = 1;

   let git, callback, error, result;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn((_error, _result) => {
         error = _error;
         result = _result;
      });
   });

   afterEach(() => {
      restore();
      error = result = undefined;
   });

   describe('bare repos', () => {
      it('asserts that the repo is bare', async () => {
         const actual = git.checkIsRepo('bare');
         await closeWithSuccess(` true `);

         expect(await actual).toBe(true);
         expect(theCommandRun()).toEqual(['rev-parse', '--is-bare-repository']);
      });

      it('recognises that the repo is not bare', async () => {
         const actual = git.checkIsRepo(CheckRepoActions.BARE);
         await closeWithSuccess(` false `);

         expect(await actual).toBe(false);
         expect(theCommandRun()).toEqual(['rev-parse', '--is-bare-repository']);
      });
   })

   describe('in tree', () => {

      const errorString = 'Some other non-clean shutdown message';

      it('when is a part of a git repo', async () => {
         const actual = git.checkIsRepo();
         await closeWithSuccess(` true `);

         expect(await actual).toBe(true);
         expect(theCommandRun()).toEqual(['rev-parse', '--is-inside-work-tree']);
      });

      it('explicitly setting the action (defaults to tree)', async () => {
         const actual = git.checkIsRepo(CheckRepoActions.IN_TREE);
         await closeWithSuccess(` true `);

         expect(await actual).toBe(true);
         expect(theCommandRun()).toEqual(['rev-parse', '--is-inside-work-tree']);
      });

      it('when is not part of a git repo', async () => {
         const actual = git.checkIsRepo();
         await closeWithError(` Not a git repository `, EXIT_UNCLEAN);

         expect(await actual).toBe(false);
         expect(theCommandRun()).toEqual(['rev-parse', '--is-inside-work-tree']);
      });

      it('when is not part of a German locale git repo', async () => {
         const actual = git.checkIsRepo();
         await closeWithError(` Kein Git-Repository `, EXIT_UNCLEAN);

         expect(await actual).toBe(false);
         expect(theCommandRun()).toEqual(['rev-parse', '--is-inside-work-tree']);
      });

      it('when there is some other non-clean shutdown - callback', async () => {
         git.checkIsRepo(CheckRepoActions.IN_TREE, callback);

         await closeWithError(errorString, EXIT_UNCLEAN);
         await wait();

         assertGitError(error, errorString);
      });

      it('when there is some other non-clean shutdown - async', async () => {
         const checkIsRepo = git.checkIsRepo(CheckRepoActions.IN_TREE);

         await closeWithError(errorString, EXIT_UNCLEAN);
         const {error, threw} = await catchAsync(checkIsRepo);

         expect(threw).toBe(true);
         assertGitError(error, errorString);
      });

      it('when there is some other error - callback', async () => {
         git.checkIsRepo(callback);
         await closeWithError(errorString, EXIT_ERROR);
         await wait();

         assertGitError(error, errorString);
      });

      it('when there is some other error - async', async () => {
         const checkIsRepo = git.checkIsRepo(callback);
         await closeWithError(errorString, EXIT_ERROR);
         const {error, threw} = await catchAsync(checkIsRepo);

         expect(threw).toBe(true);
         assertGitError(error, errorString);
      });

   });

   describe('repo root', () => {

      it('checks the working directory for a regular repo', async () => {
         await assertCheckIsRepoRoot('.git\n', true);
      });

      it('checks a sub-directory for a regular repo', async () => {
         await assertCheckIsRepoRoot('/var/opt/blah/repo/.git\n', false);
      });

      it('checks the working directory for a bare repo', async () => {
         await assertCheckIsRepoRoot('.\n', true);
      });

      async function assertCheckIsRepoRoot (response, expected) {
         const actual = git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
         await closeWithSuccess(response);
         expect(await actual).toBe(expected);
         expect(theCommandRun()).toEqual(['rev-parse', '--git-dir']);
      }

   });

});
