import { createTestContext, setUpInit, SimpleGitTestContext, wait } from '@simple-git/test-utils';

describe('outputHandler', function () {
   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));
   beforeEach(async () => {
      await setUpInit(context);
      await context.files('aaa.txt', 'bbb.txt', 'ccc.other');
   });

   it('using the outputHandler to count currently running processes', async () => {
      let processes = new Set();
      const currentlyRunning = () => processes.size;
      const git = context.git.outputHandler((_x, stdout, stderr) => {
         const start = new Date();
         const onClose = () => processes.delete(start);

         stdout.on('close', onClose);
         stderr.on('close', onClose);

         processes.add(start);
      });

      expect(currentlyRunning()).toBe(0);
      const queue = [git.init(), git.add('*.txt')];

      await wait(0);
      expect(currentlyRunning()).toBe(2);

      await Promise.all(queue);
      expect(currentlyRunning()).toBe(0);
   });
});
