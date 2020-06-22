const {theCommandRun, closeWithSuccess, newSimpleGit, restore, wait} = require('./include/setup');

const {InitSummary} = require("../../src/lib/responses/InitSummary");

describe('init', () => {

   let git;

   const successMessage = (alreadyExisting = false, path = '/some/path/repo.git') =>
      alreadyExisting
         ? `Reinitialized existing Git repository in ${ path }\n`
         : `Initialized empty Git repository in ${ path }\n`;
   const existingRepoSuccess = successMessage.bind(null, true);
   const newRepoSuccess = successMessage.bind(null, false);

   beforeEach(() => {
      git = newSimpleGit()
   });

   afterEach(() => restore());

   it('await with no arguments', async () => {
      const init = git.init();

      await closeWithSuccess(existingRepoSuccess());
      assertSuccess(await init, {bare: false, existing: true}, ['init']);
   });

   it.each([true, false])(`await bare=%s with no options`, async (bare) => {
      const init = git.init(bare);
      const expected = bare ? ['init', '--bare'] : ['init'];

      await closeWithSuccess(existingRepoSuccess());
      assertSuccess(await init, {bare, existing: true}, expected);
   });

   it.each([true, false])(`await bare=%s with options array`, async (bare) => {
      const init = git.init(bare, ['--quiet']);
      const expected = bare ? ['init', '--bare'] : ['init'];

      await closeWithSuccess(existingRepoSuccess());
      assertSuccess(await init, {bare, existing: true}, [...expected, '--quiet']);
   });

   it.each([true, false])(`await bare=%s with options object`, async (bare) => {
      const init = git.init(bare, {'--shared': 'true'});
      const expected = bare ? ['init', '--bare'] : ['init'];

      await closeWithSuccess(newRepoSuccess());
      assertSuccess(await init, {bare, existing: false}, [...expected, '--shared=true']);
   });

   it('await with options object', async () => {
      const init = git.init({'--shared': 'true'});

      await closeWithSuccess(newRepoSuccess());
      assertSuccess(await init, {bare: false, existing: false}, ['init', '--shared=true']);
   });

   it('await with options array', async () => {
      const init = git.init(['--quiet', '--bare']);

      await closeWithSuccess(newRepoSuccess());
      assertSuccess(await init, {bare: true, existing: false}, ['init', '--quiet', '--bare']);
   });

   it('ignores bad data types for the bare parameter', async () => {
      const init = git.init('hello', ['--quiet']);

      await closeWithSuccess(newRepoSuccess());
      assertSuccess(await init, {bare: false, existing: false}, ['init', '--quiet']);
   });

   describe('callbacks', () => {
      let callback;
      beforeEach(() => callback = jest.fn());

      it('no arguments', async () => {
         git.init(mockSuccessCallback({bare: false, existing: false}, ['init']));
         await closeWithSuccess(newRepoSuccess());
         await wait();

         expect(callback).toHaveBeenCalled();
      });

      it('with bare', async () => {
         git.init(true, mockSuccessCallback({bare: true, existing: false}, ['init', '--bare']));
         await closeWithSuccess(newRepoSuccess());
         await wait();

         expect(callback).toHaveBeenCalled();
      });

      it('with bare and options object', async () => {
         git.init(true, {'--a': 'b'}, mockSuccessCallback({bare: true, existing: false}, ['init', '--bare', '--a=b']));
         await closeWithSuccess(newRepoSuccess());
         await wait();

         expect(callback).toHaveBeenCalled();
      });

      it('with bare and options array', async () => {
         git.init(false, ['--foo'], mockSuccessCallback({bare: false, existing: true}, ['init', '--foo']));
         await closeWithSuccess(existingRepoSuccess());
         await wait();

         expect(callback).toHaveBeenCalled();
      });

      it('with options array', async () => {
         git.init(['--foo'], mockSuccessCallback({bare: false, existing: true}, ['init', '--foo']));
         await closeWithSuccess(existingRepoSuccess());
         await wait();

         expect(callback).toHaveBeenCalled();
      });

      it('with options object', async () => {
         git.init({'--a': 'b'}, mockSuccessCallback({bare: false, existing: false}, ['init', '--a=b']));
         await closeWithSuccess(newRepoSuccess());
         await wait();

         expect(callback).toHaveBeenCalled();
      });

      function mockSuccessCallback (expected, commands) {
         return callback = jest.fn((err, init) => {
            assertSuccess(init, expected, commands);
         });
      }
   })


   function assertSuccess (init, expected, commands) {
      expect(init).toBeInstanceOf(InitSummary);
      expect(init).toEqual(expect.objectContaining(expected));
      expect(theCommandRun()).toEqual(commands);
   }
})
