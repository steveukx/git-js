import {
   createTestContext,
   newSimpleGit,
   setUpInit,
   SimpleGitTestContext,
} from '@simple-git/test-utils';

import { InitSummary } from '../../src/lib/responses/InitSummary';
import { StatusSummary } from '../../src/lib/responses/StatusSummary';

describe('promise', () => {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await context.files('file.one', 'file.two');
   });

   it('rejects failures whether using async or promises', async () => {
      const git = newSimpleGit(context.root);

      function runUsingThen(cmd: string) {
         return git.raw(cmd).then(
            () => true,
            () => false
         );
      }

      async function runUsingAwait(cmd: string) {
         try {
            await git.raw(cmd);
            return true;
         } catch {
            return false;
         }
      }

      expect(await Promise.all([runUsingThen('blah'), runUsingThen('version')])).toEqual([
         false,
         true,
      ]);
      expect(await Promise.all([runUsingThen('version'), runUsingThen('blah')])).toEqual([
         true,
         false,
      ]);

      expect(await Promise.all([runUsingAwait('blah'), runUsingAwait('version')])).toEqual([
         false,
         true,
      ]);
      expect(await Promise.all([runUsingAwait('version'), runUsingAwait('blah')])).toEqual([
         true,
         false,
      ]);
   });

   it('awaits the returned task', async () => {
      let init,
         status,
         callbacks = {
            init: jest.fn(),
            initNested: jest.fn(),
            status: jest.fn(),
         };
      const git = newSimpleGit(context.root);

      expect(git).not.toHaveProperty('then');
      expect(git).not.toHaveProperty('catch');

      init = git.init();
      status = init.status();

      assertArePromises(init, status);

      init.then(callbacks.init.mockReturnValue('HELLO')).then(callbacks.initNested);

      status.then(callbacks.status);

      const actual = [await init, await status];
      expect(actual).toEqual([expect.any(InitSummary), expect.any(StatusSummary)]);

      expect(callbacks.init).toBeCalledWith(actual[0]);
      expect(callbacks.initNested).toBeCalledWith('HELLO');
      expect(callbacks.status).toBeCalledWith(actual[1]);
   });

   function assertArePromises(...promises: Array<Promise<unknown> | unknown>) {
      expect(promises.length).toBeGreaterThan(0);
      promises.forEach((promise) => {
         expect(promise).toHaveProperty('catch', expect.any(Function));
         expect(promise).toHaveProperty('then', expect.any(Function));
      });
   }
});
