import { SimpleGit } from '../../typings';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit, writeToStdErr } from './__fixtures__';

describe('plugins', () => {

   let git: SimpleGit;
   let fn: jest.Mock;

   beforeEach(() => fn = jest.fn());

   it('allows configuration prefixing', async () => {
      git = newSimpleGit({config: ['a', 'bcd']});
      git.raw('foo');

      await closeWithSuccess();
      assertExecutedCommands('-c', 'a', '-c', 'bcd', 'foo');
   });

   describe('progress', () => {
      it('clone - auto added command', async () => {
         git = newSimpleGit({progress: fn});
         git.clone('foo', ['abc']);

         await writeToStdErr(`Receiving objects: 1% (2/200)`);

         expect(fn).toBeCalledWith({
            method: 'clone',
            progress: 1,
            received: 2,
            total: 200,
         });
         assertExecutedCommands('clone', 'abc', 'foo', '--progress');
      });

      it('clone - already added command', async () => {
         git = newSimpleGit({progress: fn});
         git.clone('foo', ['--progress', 'abc']);

         await writeToStdErr(`Receiving objects: 5% (5/100)`);

         expect(fn).toBeCalledWith({
            method: 'clone',
            progress: 5,
            received: 5,
            total: 100,
         });
         assertExecutedCommands('clone', '--progress', 'abc', 'foo');
      });

      it('clone - emits progress multiple times to the same handler', async () => {
         git = newSimpleGit({progress: fn});
         git.clone('foo', ['--progress', 'abc']);

         await writeToStdErr(`Receiving objects: 5% (1/20)`);
         await writeToStdErr(`Receiving objects: 90% (18/20)`);
         await writeToStdErr(`Receiving objects: 100% (20/20)`);

         expect(fn.mock.calls.map(([data]) => data)).toEqual([
            {method: 'clone', progress: 5, received: 1, total: 20},
            {method: 'clone', progress: 90, received: 18, total: 20},
            {method: 'clone', progress: 100, received: 20, total: 20},
         ]);
      });

      it('raw - emits progress events whenever the --progress flag is used', async () => {
         git = newSimpleGit({progress: fn});
         git.raw('something', '--progress', 'foo');

         await writeToStdErr(`Receiving objects: 5% (1/20)`);
         await closeWithSuccess();

         expect(fn).toHaveBeenCalledWith({
            method: 'something',
            progress: 5,
            received: 1,
            total: 20,
         });
      });

      it('raw - no progress events emitted if --progress flag is not used', async () => {
         git = newSimpleGit({progress: fn});
         git.raw('something', 'foo');

         await writeToStdErr(`Receiving objects: 5% (1/20)`);
         await closeWithSuccess();

         expect(fn).not.toHaveBeenCalled();
      });

      it('handles progress with custom config', async () => {
         git = newSimpleGit({
            progress: fn,
            config: ['foo', '--progress', 'bar'],
         });
         git.raw('baz');

         await writeToStdErr(`Receiving objects: 10% (100/1000)`);
         await closeWithSuccess();

         expect(fn).toHaveBeenCalledWith({
            method: 'baz',
            progress: 10,
            received: 100,
            total: 1000,
         });
      });
   });

});
