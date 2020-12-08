import {
   assertExecutedCommands,
   assertExecutedTasksCount,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
   wait
} from './__fixtures__';
import { SimpleGit } from '../../typings';
import { promiseError } from '@kwsites/promise-result';

describe('raw', () => {
   let git: SimpleGit;
   let callback: jest.Mock;
   const response = 'passed through raw response';

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
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

      expect(callback).toHaveBeenCalledWith(error);
      assertGitError(error, 'Raw: must supply one or more command to execute');
      assertExecutedTasksCount(0);
   });

   it('treats empty options as an error - none present with callback', async () => {
      const task = git.raw(callback as any);
      const error = await promiseError(task);

      expect(callback).toHaveBeenCalledWith(error);
      assertGitError(error, 'must supply one or more command');
      assertExecutedTasksCount(0);
   });

   it('treats empty options as an error - none present', async () => {
      const task = git.raw();
      const error = await promiseError(task);

      assertGitError(error, 'must supply one or more command');
      assertExecutedTasksCount(0);
   });

   it('accepts an options object', async () => {
      git.raw({'abc': 'def'}, callback);
      await closeWithSuccess();

      assertExecutedCommands('abc=def')
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
      git.raw('some', 'thing', {'--opt': 'value'});
      await closeWithSuccess();
      assertExecutedCommands('some', 'thing', '--opt=value');
   });

   it('accepts rest-args: callback', async () => {
      git.raw('some', 'thing', callback);
      await wait();
      assertExecutedCommands('some', 'thing');
   });

})
