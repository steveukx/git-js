import { newSimpleGit } from './__fixtures__';
import { MockChildProcess, theChildProcessMatching, wait } from '@simple-git/test-utils';

describe('completionDetectionPlugin', () => {

   function process(proc: MockChildProcess, data: string, close = false, exit = false) {
      proc.stdout.$emit('data', Buffer.from(data));
      close && proc.$emit('close', 1);
      exit && proc.$emit('exit', 1);
   }

   it('can respond to just close events', async () => {
      const git = newSimpleGit({
         completion: {
            onClose: true,
            onExit: false,
         },
      });

      const output = Promise.race([
         git.raw('foo'),
         git.raw('bar'),
      ]);

      await wait();

      process(theChildProcessMatching(['foo']), 'foo', false, true);
      process(theChildProcessMatching(['bar']), 'bar', true, false);

      expect(await output).toBe('bar')
   });

   it('can respond to just exit events', async () => {
      const git = newSimpleGit({
         completion: {
            onClose: false,
            onExit: true,
         },
      });

      const output = Promise.race([
         git.raw('foo'),
         git.raw('bar'),
      ]);

      await wait();

      process(theChildProcessMatching(['foo']), 'foo', false, true);
      process(theChildProcessMatching(['bar']), 'bar', true, false);

      expect(await output).toBe('foo')
   });

});
