import { SimpleGit } from '../../typings';
import {
   assertExecutedCommands,
   assertExecutedCommandsContainsOnce,
   closeWithSuccess,
   newSimpleGit,
   writeToStdErr
} from './__fixtures__';

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

      it('emits progress events when counting objects', async () => {
         newSimpleGit({progress: fn}).raw('something', '--progress');

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
         newSimpleGit({progress: fn}).push();

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
         newSimpleGit({progress: fn}).raw('something', '--progress');

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
         newSimpleGit({progress: fn}).raw('other');

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
         ['pull', (git) => git.pull()],
         ['push', (git) => git.push()],
         ['clone', (git) => git.clone('some-remote.git')],
         ['checkout - progress set', (git) => git.checkout('main', ['--progress', 'blah'])],
         ['pull - progress set', (git) => git.pull(['--progress', 'blah'])],
         ['push - progress set', (git) => git.push(['--progress', 'blah'])],
         ['clone - progress set', (git) => git.clone('some-remote.git', ['--progress', 'blah'])],
         ['raw - progress set', (git) => git.raw('foo','--progress', 'blah')],
      ])(`auto-adds to %s`, async (_name, use) => {
         use(newSimpleGit({progress: fn}));

         await closeWithSuccess();
         assertExecutedCommandsContainsOnce('--progress');
      });
   });

});
