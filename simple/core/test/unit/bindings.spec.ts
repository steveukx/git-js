import { taskBindings } from '../../src/bindings';
import { TaskConfigurationError } from '../../src/errors';
import { add } from '../../src/tasks/add';
import {
   assertAllExecutedCommands,
   assertExecutedCommands,
   closeWithSuccess,
   newSimpleGit,
   theChildProcessMatching,
   wait,
} from '../__fixtures__';

describe('bindings', () => {
   it('generates a method for every binding table entry', () => {
      const git = newSimpleGit();
      for (const name of Object.keys(taskBindings)) {
         expect(typeof git[name as keyof typeof taskBindings]).toBe('function');
      }
   });

   it('sugar methods run their task descriptor', async () => {
      const queue = newSimpleGit().add(['file.one', 'file.two']);
      await closeWithSuccess('raw response');

      expect(await queue).toBe('raw response');
      assertExecutedCommands('add', 'file.one', 'file.two');
   });

   it('method chaining queues serially on one chain', async () => {
      const git = newSimpleGit();
      const chained = git.raw('a').raw('b');

      await wait();
      // only the first task spawns until it completes
      assertAllExecutedCommands(['a']);

      await theChildProcessMatching(['a']).closeWithSuccess('first');
      await closeWithSuccess('second');

      expect(await chained).toBe('second');
      assertAllExecutedCommands(['a'], ['b']);
   });

   it('standalone factories and sugar methods build the same descriptor', () => {
      const [bound, standalone] = [taskBindings.add('.'), add('.')];
      expect(bound.commands).toEqual(standalone.commands);
      expect(bound.format).toBe(standalone.format);
   });

   describe('trailing callback guard', () => {
      const callback = () => {};

      it('throws for sugar methods', () => {
         expect(() => (newSimpleGit().add as Function)('file', callback)).toThrow(
            TaskConfigurationError
         );
      });

      it('throws for run / raw / stream', () => {
         const git = newSimpleGit();
         expect(() => (git.run as Function)(add('.'), callback)).toThrow(TaskConfigurationError);
         expect(() => (git.raw as Function)('status', callback)).toThrow(TaskConfigurationError);
         expect(() => git.stream(callback as never)).toThrow(TaskConfigurationError);
      });

      it('names the upgrade path in the error', () => {
         expect(() => (newSimpleGit().add as Function)('file', callback)).toThrow(
            'does not support trailing callback arguments. Use the returned promise instead.'
         );
      });

      it('exec and outputHandler still accept function payloads', async () => {
         const git = newSimpleGit();
         expect(() => git.outputHandler(callback)).not.toThrow();

         const handle = vi.fn();
         await git.exec(handle);
         expect(handle).toHaveBeenCalled();
      });
   });
});
