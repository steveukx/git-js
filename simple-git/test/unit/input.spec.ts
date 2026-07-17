import { promiseError } from '@kwsites/promise-result';
import {
   closeWithSuccess,
   isInvalidDirectory,
   newSimpleGit,
   theChildProcessMatching,
   wait,
} from './__fixtures__';
import { SimpleGit } from '../../typings';
import { mockChildProcessModule as childProcess } from './__mocks__/mock-child-process';

describe('input', () => {
   let git: SimpleGit;

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('does not write stdin when unset', async () => {
      const task = git.raw(['status']);
      await closeWithSuccess();
      await task;
      expect(childProcess.$mostRecent().stdin.end).not.toHaveBeenCalled();
   });

   it('writes string or Buffer to the next command only', async () => {
      const buf = Buffer.from('bin');
      const withString = git.input('hello').raw(['a']);
      await closeWithSuccess();
      await withString;
      expect(childProcess.$matchingChildProcess(['a'])!.stdin.end).toHaveBeenCalledWith('hello');

      const withBuf = git.input(buf).raw(['b']);
      await closeWithSuccess();
      await withBuf;
      expect(childProcess.$matchingChildProcess(['b'])!.stdin.end).toHaveBeenCalledWith(buf);

      const third = git.raw(['c']);
      await closeWithSuccess();
      await third;
      expect(childProcess.$matchingChildProcess(['c'])!.stdin.end).not.toHaveBeenCalled();
   });

   it('skips empty tasks and supports mid-chain input', async () => {
      const task = git
         .input('first')
         .exec(() => {})
         .raw(['a'])
         .input('second')
         .raw(['b']);

      await wait();
      await theChildProcessMatching(['a']).closeWithSuccess();
      await wait();
      await theChildProcessMatching(['b']).closeWithSuccess();
      await task;

      expect(childProcess.$matchingChildProcess(['a'])!.stdin.end).toHaveBeenCalledWith('first');
      expect(childProcess.$matchingChildProcess(['b'])!.stdin.end).toHaveBeenCalledWith('second');
   });

   it('rejects invalid types and clears with zero args', async () => {
      expect(() => git.input(1 as any)).toThrow(TypeError);

      const cleared = git.input('secret').input().raw(['status']);
      await closeWithSuccess();
      await cleared;
      expect(childProcess.$mostRecent().stdin.end).not.toHaveBeenCalled();

      const empty = git.input('').raw(['status']);
      await closeWithSuccess();
      await empty;
      expect(childProcess.$mostRecent().stdin.end).toHaveBeenCalledWith('');
   });

   it('keeps concurrent fluent inputs isolated', async () => {
      const pA = git.input('alpha').raw(['cmdA']);
      const pB = git.input('beta').raw(['cmdB']);
      await wait();
      await theChildProcessMatching(['cmdA']).closeWithSuccess();
      await theChildProcessMatching(['cmdB']).closeWithSuccess();
      await Promise.all([pA, pB]);

      expect(childProcess.$matchingChildProcess(['cmdA'])!.stdin.end).toHaveBeenCalledWith('alpha');
      expect(childProcess.$matchingChildProcess(['cmdB'])!.stdin.end).toHaveBeenCalledWith('beta');
   });

   it('does not leak after a failed empty task', async () => {
      isInvalidDirectory();
      await expect(promiseError(git.input('secret').cwd('/nope'))).resolves.toBeInstanceOf(Error);

      require('@kwsites/file-exists').exists.mockReturnValue(true);
      const next = git.raw(['status']);
      await closeWithSuccess();
      await next;
      expect(childProcess.$mostRecent().stdin.end).not.toHaveBeenCalled();
   });

   it('ignores stdin stream errors', async () => {
      const task = git.input('data').raw(['status']);
      await wait();
      childProcess.$mostRecent().stdin.$emit('error', { code: 'EPIPE' });
      await closeWithSuccess('ok');
      await expect(task).resolves.toBe('ok');
   });
});
