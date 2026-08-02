/**
 * `git.stream(task)` against the child process mock - the chunk boundaries and
 * exit codes real `git` won't reproduce on demand, in particular a process that
 * fails *after* it has already streamed output to its consumer.
 */
import { promiseError } from '@kwsites/promise-result';

import { GitError } from '../../src/errors';
import { straightThroughBufferTask } from '../../src/tasks';
import {
   closeWithError,
   newSimpleGit,
   theChildProcess,
   wait,
   writeToStdErr,
   writeToStdOut,
} from '../__fixtures__';

const task = () => straightThroughBufferTask(['show', 'HEAD:file.txt']);

/**
 * `closeWithSuccess` emits a final (by default empty) `data` event - exit the
 * process on its own so the chunks a test asserts on are only its own writes
 */
async function exitSuccessfully() {
   await wait();
   theChildProcess().$emit('exit', 0);
   theChildProcess().$emit('close', 0);
   await wait();
}

describe('stream', () => {
   it('resolves as soon as the first chunk arrives, before the process exits', async () => {
      const streaming = newSimpleGit().stream(task());
      await writeToStdOut('first');

      const iterator = await streaming;
      expect((await iterator.next()).value.toString()).toBe('first');

      await exitSuccessfully();
      expect(await iterator.next()).toEqual({ value: undefined, done: true });
   });

   it('yields chunks in order and completes when the process exits cleanly', async () => {
      const streaming = newSimpleGit().stream(task());
      await writeToStdOut('one');
      const iterator = await streaming;

      const consumed: string[] = [];
      const consuming = (async () => {
         for await (const chunk of iterator) {
            consumed.push(chunk.toString());
         }
      })();

      await writeToStdOut('two');
      await writeToStdOut('three');
      await exitSuccessfully();

      await consuming;
      expect(consumed).toEqual(['one', 'two', 'three']);
   });

   it('throws out of the iterator when the process fails after streaming output', async () => {
      const streaming = newSimpleGit().stream(task());
      await writeToStdOut('partial');
      const iterator = await streaming;

      const consumed: string[] = [];
      const consuming = promiseError(
         (async () => {
            for await (const chunk of iterator) {
               consumed.push(chunk.toString());
            }
         })()
      );

      await writeToStdErr('fatal: bad object');
      await closeWithError('fatal: bad object');

      const error = await consuming;
      expect(consumed).toEqual(['partial']);
      expect(error).toBeInstanceOf(GitError);
      expect(String(error?.message)).toContain('fatal: bad object');
   });

   it('reports stderr in the error even though it never reaches the stream', async () => {
      const streaming = newSimpleGit().stream(task());
      await writeToStdOut('data');
      const iterator = await streaming;

      await writeToStdErr('warning: detail from stderr');
      await closeWithError('exit');

      const consumed: Buffer[] = [];
      const error = await promiseError(
         (async () => {
            for await (const chunk of iterator) {
               consumed.push(chunk);
            }
         })()
      );

      expect(Buffer.concat(consumed).toString()).toBe('data');
      expect(String(error?.message)).toContain('warning: detail from stderr');
   });

   it('rejects the promise when the process fails without writing to stdout', async () => {
      const streaming = promiseError(newSimpleGit().stream(task()));
      await writeToStdErr('fatal: no such ref');
      await closeWithError('fatal: no such ref');

      const error = await streaming;
      expect(error).toBeInstanceOf(GitError);
      expect(String(error?.message)).toContain('fatal: no such ref');
   });

   it('does not raise an unhandled rejection when the stream is abandoned', async () => {
      const iterator = await (async () => {
         const streaming = newSimpleGit().stream(task());
         await writeToStdOut('ignored');
         return streaming;
      })();

      await writeToStdErr('fatal: abandoned');
      await closeWithError('fatal: abandoned');
      await wait(10);

      // the failure is held on the queue until pulled - never surfacing as an
      // unhandled rejection for a consumer that stops iterating
      expect(iterator).toBeDefined();
   });
});
