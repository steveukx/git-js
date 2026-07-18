import type { InitResult, SimpleGitCore } from '../../index';
import { InitSummary } from '../../src/responses';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('init', () => {
   let git: SimpleGitCore;
   const path = '/some/path/repo';

   const successMessage = (alreadyExisting = false, gitDir = `${path}/.git/`) =>
      alreadyExisting
         ? `Reinitialized existing Git repository in ${gitDir}\n`
         : `Initialized empty Git repository in ${gitDir}\n`;
   const existingRepoSuccess = successMessage.bind(null, true);
   const newRepoSuccess = successMessage.bind(null, false);

   beforeEach(() => (git = newSimpleGit(path)));

   describe('path vs gitDir', () => {
      it('non-bare', async () => {
         const gitDir = `${path}/.git/`;
         const init = git.init();

         await closeWithSuccess(newRepoSuccess(gitDir));
         assertSuccess(await init, { path, gitDir }, ['init']);
      });
      it('bare', async () => {
         const gitDir = `${path}/`;
         const init = git.init(true);

         await closeWithSuccess(newRepoSuccess(gitDir));
         assertSuccess(await init, { path, gitDir }, ['init', '--bare']);
      });
   });

   it('await with no arguments', async () => {
      const init = git.init();

      await closeWithSuccess(existingRepoSuccess());
      assertSuccess(await init, { bare: false, existing: true }, ['init']);
   });

   it.each([true, false])(`await bare=%s with no options`, async (bare) => {
      const init = git.init(bare);
      const expected = bare ? ['init', '--bare'] : ['init'];

      await closeWithSuccess(existingRepoSuccess());
      assertSuccess(await init, { bare, existing: true }, expected);
   });

   it.each([true, false])(`await bare=%s with options array`, async (bare) => {
      const init = git.init(bare, ['--quiet']);
      const expected = bare ? ['init', '--bare'] : ['init'];

      await closeWithSuccess(existingRepoSuccess());
      assertSuccess(await init, { bare, existing: true }, [...expected, '--quiet']);
   });

   it.each([true, false])(`await bare=%s with options object`, async (bare) => {
      const init = git.init(bare, { '--shared': 'true' });
      const expected = bare ? ['init', '--bare'] : ['init'];

      await closeWithSuccess(newRepoSuccess());
      assertSuccess(await init, { bare, existing: false }, [...expected, '--shared=true']);
   });

   it('await with options object', async () => {
      const init = git.init({ '--shared': 'true' });

      await closeWithSuccess(newRepoSuccess());
      assertSuccess(await init, { bare: false, existing: false }, ['init', '--shared=true']);
   });

   it('await with options array', async () => {
      const init = git.init(['--quiet', '--bare']);

      await closeWithSuccess(newRepoSuccess());
      assertSuccess(await init, { bare: true, existing: false }, ['init', '--quiet', '--bare']);
   });

   it('ignores bad data types for the bare parameter', async () => {
      const init = git.init('hello' as any, ['--quiet']);

      await closeWithSuccess(newRepoSuccess());
      assertSuccess(await init, { bare: false, existing: false }, ['init', '--quiet']);
   });

   it('removes duplicate --bare flags', async () => {
      const init = git.init(true, ['--quiet', '--bare']);
      await closeWithSuccess(existingRepoSuccess());
      assertSuccess(await init, { bare: true, existing: true }, ['init', '--quiet', '--bare']);
   });

   function assertSuccess(init: InitResult, expected: Partial<InitResult>, commands: string[]) {
      expect(init).toBeInstanceOf(InitSummary);
      expect(init).toEqual(expect.objectContaining(expected));
      assertExecutedCommands(...commands);
   }
});
