import { SimpleGit } from '../../../typings';
import {
   assertChildProcessSpawnOptions,
   assertExecutedCommands,
   assertExecutedCommandsContainsOnce,
   closeWithSuccess,
   newSimpleGit,
   theChildProcess,
   writeToStdErr,
   writeToStdOut,
} from '../__fixtures__';

describe('plugins', () => {
   let git: SimpleGit;
   let fn: jest.Mock;

   beforeEach(() => (fn = jest.fn()));

   it('allows configuration prefixing', async () => {
      git = newSimpleGit({ config: ['a', 'bcd'] });
      git.raw('foo');

      await closeWithSuccess();
      assertExecutedCommands('-c', 'a', '-c', 'bcd', 'foo');
   });

   describe('spawnOptions', () => {
      it('allows setting uid and gid', async () => {
         git = newSimpleGit({ spawnOptions: { uid: 1, gid: 2 } });
         git.init();

         await closeWithSuccess();
         assertChildProcessSpawnOptions({ uid: 1, gid: 2 });
      });

      it('sets process ids along with environment variables', async () => {
         git = newSimpleGit({ spawnOptions: { gid: 2 } });
         git.env({ hello: 'world' });
         git.raw('rev-parse', '--show-toplevel');

         await closeWithSuccess();
         assertChildProcessSpawnOptions({ gid: 2, env: { hello: 'world' } });
      });
   });

   describe('progress', () => {
      it('caters for non ISO-8859-1 characters', async () => {
         newSimpleGit({ progress: fn }).raw('anything', '--progress');

         await writeToStdErr(`Определение изменений: 90% (9/10)`);

         expect(fn).toHaveBeenCalledWith({
            method: 'anything',
            progress: 90,
            processed: 9,
            stage: 'определение',
            total: 10,
         });
      });

      it('emits progress events when counting objects', async () => {
         newSimpleGit({ progress: fn }).raw('something', '--progress');

         await writeToStdErr(`Counting objects: 90% (180/200)`);

         expect(fn).toHaveBeenCalledWith({
            method: 'something',
            progress: 90,
            processed: 180,
            stage: 'counting',
            total: 200,
         });
      });

      it('emits progress events when writing objects', async () => {
         newSimpleGit({ progress: fn }).push();

         await writeToStdErr(`Writing objects: 90% (180/200)`);

         expect(fn).toHaveBeenCalledWith({
            method: 'push',
            progress: 90,
            processed: 180,
            stage: 'writing',
            total: 200,
         });
      });

      it('emits progress events when receiving objects', async () => {
         newSimpleGit({ progress: fn }).raw('something', '--progress');

         await writeToStdErr(`Receiving objects: 5% (1/20)`);

         expect(fn).toHaveBeenCalledWith({
            method: 'something',
            progress: 5,
            processed: 1,
            stage: 'receiving',
            total: 20,
         });
      });

      it('no progress events emitted if --progress flag is not used', async () => {
         newSimpleGit({ progress: fn }).raw('other');

         await writeToStdErr(`Receiving objects: 5% (1/20)`);

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
            processed: 100,
            stage: 'receiving',
            total: 1000,
         });
      });

      it.each<[string, (git: SimpleGit) => unknown]>([
         ['checkout', (git) => git.checkout('main')],
         ['clone', (git) => git.clone('some-remote.git')],
         ['fetch', (git) => git.fetch('some-remote')],
         ['pull', (git) => git.pull()],
         ['push', (git) => git.push()],
         ['checkout - progress set', (git) => git.checkout('main', ['--progress', 'blah'])],
         ['clone - progress set', (git) => git.clone('some-remote.git', ['--progress', 'blah'])],
         [
            'fetch - progress set',
            (git) => git.fetch('some-remote', { '--progress': null, '--foo': 'bar' }),
         ],
         ['pull - progress set', (git) => git.pull(['--progress', 'blah'])],
         ['push - progress set', (git) => git.push(['--progress', 'blah'])],
         ['raw - progress set', (git) => git.raw('foo', '--progress', 'blah')],
      ])(`auto-adds to %s`, async (_name, use) => {
         use(newSimpleGit({ progress: fn }));

         await closeWithSuccess();
         assertExecutedCommandsContainsOnce('--progress');
      });
   });

   describe('timeout', () => {
      beforeEach(() => jest.useFakeTimers());

      it('waits for some time after a block on stdout', async () => {
         git = newSimpleGit({ timeout: { block: 2000 } });
         git.init();

         await Promise.resolve();

         const stdOut = Promise.all([writeToStdOut('first'), writeToStdOut('second')]);
         jest.advanceTimersByTime(1000);

         await stdOut;
         expect(theChildProcess().kill).not.toHaveBeenCalled();

         jest.advanceTimersByTime(2000);
         expect(theChildProcess().kill).toHaveBeenCalled();
      });
   });
});
