import type { SimpleGitCore } from '../../index';
import { newSimpleGit, wait } from '../__fixtures__';
import { mockChildProcessModule } from '../__fixtures__/mock-child-process';

async function withStdOut() {
   await wait();
   mockChildProcessModule.$mostRecent().stdout.$emit('data', Buffer.from('some data'));
}

async function withStdErr() {
   await wait();
   mockChildProcessModule.$mostRecent().stdout.$emit('data', Buffer.from('some data'));
}

async function childProcessEmits(
   event: 'close' | 'exit',
   code: number,
   before?: () => Promise<void>
) {
   await (before || wait)();
   mockChildProcessModule.$mostRecent().$emit(event, code);
   await wait();
}

const aWhile = () => wait(50);

describe('git-executor', () => {
   let git: SimpleGitCore;
   let task: Promise<any>;
   // @simple-git/core has no trailing callbacks - task completion is observed
   // through the returned promise settling instead
   let completed: number;

   beforeEach(() => {
      git = newSimpleGit();
      completed = 0;
   });

   async function thenTheTaskHasCompleted() {
      await task.catch(() => undefined);
      expect(completed).toBe(1);
   }

   async function thenTheTaskHasNotCompleted() {
      await wait();
      expect(completed).toBe(0);
   }

   function givenTheTaskIsAdded() {
      completed = 0;
      task = git.init();
      task.then(
         () => (completed += 1),
         () => (completed += 1)
      );
   }

   it('with no stdErr and just a close event, terminates after a delay', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('close', 0);
      await thenTheTaskHasNotCompleted();

      await aWhile();
      await thenTheTaskHasCompleted();
   });

   it('with no stdErr and just an exit event, terminates after a delay', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('exit', 0);
      await thenTheTaskHasNotCompleted();

      await aWhile();
      await thenTheTaskHasCompleted();
   });

   it('with stdErr and just a close event, terminates immediately', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('close', 0, withStdErr);
      await thenTheTaskHasCompleted();
   });

   it('with stdErr and just an exit event, terminates immediately', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('exit', 0, withStdErr);
      await thenTheTaskHasCompleted();
   });

   it('with stdOut and just a close event, terminates immediately', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('close', 0, withStdOut);
      await thenTheTaskHasCompleted();
   });

   it('with stdOut and just an exit event, terminates immediately', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('exit', 0, withStdOut);
      await thenTheTaskHasCompleted();
   });

   it('with both cancel and exit events, only terminates once', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('close', 0);
      await childProcessEmits('exit', 0);
      await thenTheTaskHasCompleted();
   });

   it('with both exit and cancel events, only terminates once', async () => {
      givenTheTaskIsAdded();

      await childProcessEmits('exit', 0);
      await childProcessEmits('close', 0);
      await thenTheTaskHasCompleted();
   });
});
