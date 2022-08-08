import { promiseError } from '@kwsites/promise-result';
import {
   assertExecutedCommands,
   assertGitError,
   assertNoExecutedTasks,
   closeWithSuccess,
   newSimpleGit,
   wait,
} from './__fixtures__';
import { SimpleGit } from '../../typings';

describe('raw', () => {
   let git: SimpleGit;
   let callback: jest.Mock;
   const response = 'passed through raw response';

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   it('does not trim by default', async () => {
      const actual = newSimpleGit().raw('abc');
      await closeWithSuccess(`${response}\n`);

      expect(await actual).toBe(`${response}\n`);
   });

   it('can disable trimming responses', async () => {
      const actual = newSimpleGit({ trimmed: false }).raw('abc');
      await closeWithSuccess(`${response}\n`);

      expect(await actual).toBe(`${response}\n`);
   });

   it('can trim responses', async () => {
      const actual = newSimpleGit({ trimmed: true }).raw('abc');
      await closeWithSuccess(`${response}\n`);

      expect(await actual).toBe(response);
   });

   it('accepts an array of arguments plus callback', async () => {
      const task = git.raw(['abc', 'def'], callback);
      closeWithSuccess(response);

      expect(await task).toBe(response);
      expect(callback).toBeCalledWith(null, response);
   });

   it('treats empty options as an error - empty array present', async () => {
      const task = git.raw([], callback);
      const error = await promiseError(task);

      expect(callback).toHaveBeenCalledWith(error, undefined);
      assertGitError(error, 'Raw: must supply one or more command to execute');
      assertNoExecutedTasks();
   });

   it('treats empty options as an error - none present with callback', async () => {
      const task = git.raw(callback as any);
      const error = await promiseError(task);

      expect(callback).toHaveBeenCalledWith(error, undefined);
      assertGitError(error, 'must supply one or more command');
      assertNoExecutedTasks();
   });

   it('treats empty options as an error - none present', async () => {
      const task = git.raw();
      const error = await promiseError(task);

      assertGitError(error, 'must supply one or more command');
      assertNoExecutedTasks();
   });

   it('accepts an options object', async () => {
      git.raw({ abc: 'def' }, callback);
      await closeWithSuccess();

      assertExecutedCommands('abc=def');
   });

   it('does not require a callback in success - var args commands', async () => {
      const task = git.raw('a', 'b');
      await closeWithSuccess(response);

      assertExecutedCommands('a', 'b');
      expect(await task).toBe(response);
   });

   it('does not require a callback in success - array commands', async () => {
      const task = git.raw(['a', 'b']);
      await closeWithSuccess(response);

      assertExecutedCommands('a', 'b');
      expect(await task).toBe(response);
   });

   it('accepts rest-args: no callback', async () => {
      git.raw('a', 'b');
      await closeWithSuccess(response);
      assertExecutedCommands('a', 'b');
   });

   it('accepts (some) rest-args: options object', async () => {
      git.raw('some', 'thing', { '--opt': 'value' });
      await closeWithSuccess();
      assertExecutedCommands('some', 'thing', '--opt=value');
   });

   it('accepts rest-args: callback', async () => {
      git.raw('some', 'thing', callback);
      await wait();
      assertExecutedCommands('some', 'thing');
   });

   it('accepts array arg: callback', async () => {
      let called = false;
      const queue = git.raw(['some', 'thing'], (err, data) => {
         expect(err).toBe(null);
         expect(data).toBe('result');
         called = true;
      });

      await closeWithSuccess('result');
      await queue;
      expect(called).toBe(true);
   });
});
