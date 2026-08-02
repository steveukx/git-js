import { createBufferQueue } from '../../src/utils/create-buffer-queue';

const A = Buffer.from('a');
const B = Buffer.from('b');
const C = Buffer.from('c');

describe('createBufferQueue', () => {
   describe('push before pull (producer outruns consumer)', () => {
      it('buffers a value and delivers it on the next pull', async () => {
         const queue = createBufferQueue();
         queue.push(A);

         expect(await queue.iterable.next()).toEqual({ value: A, done: false });
      });

      it('delivers buffered values in FIFO order', async () => {
         const queue = createBufferQueue();
         queue.push(A);
         queue.push(B);
         queue.push(C);

         expect((await queue.iterable.next()).value).toBe(A);
         expect((await queue.iterable.next()).value).toBe(B);
         expect((await queue.iterable.next()).value).toBe(C);
      });

      it('parks once the buffer has drained', async () => {
         const queue = createBufferQueue();
         queue.push(A);

         expect((await queue.iterable.next()).value).toBe(A);

         let settled = false;
         const pending = queue.iterable.next().then((r) => {
            settled = true;
            return r;
         });
         await Promise.resolve();
         expect(settled).toBe(false);

         queue.push(B);
         expect((await pending).value).toBe(B);
      });
   });

   describe('pull before push (consumer outruns producer)', () => {
      it('parks a pull and resolves it when a value is pushed', async () => {
         const queue = createBufferQueue();

         const pending = queue.iterable.next();
         queue.push(A);

         expect(await pending).toEqual({ value: A, done: false });
      });

      it('resolves parked pulls in FIFO order', async () => {
         const queue = createBufferQueue();

         const first = queue.iterable.next();
         const second = queue.iterable.next();

         queue.push(A);
         queue.push(B);

         expect((await first).value).toBe(A);
         expect((await second).value).toBe(B);
      });
   });

   describe('end', () => {
      it('completes a subsequent pull', async () => {
         const queue = createBufferQueue();
         queue.end();

         expect(await queue.iterable.next()).toEqual({ value: undefined, done: true });
      });

      it('completes all parked pulls', async () => {
         const queue = createBufferQueue();

         const first = queue.iterable.next();
         const second = queue.iterable.next();
         queue.end();

         expect(await first).toEqual({ value: undefined, done: true });
         expect(await second).toEqual({ value: undefined, done: true });
      });

      it('drains buffered values before completing', async () => {
         const queue = createBufferQueue();
         queue.push(A);
         queue.push(B);
         queue.end();

         expect((await queue.iterable.next()).value).toBe(A);
         expect((await queue.iterable.next()).value).toBe(B);
         expect(await queue.iterable.next()).toEqual({ value: undefined, done: true });
      });

      it('ignores values pushed after ending', async () => {
         const queue = createBufferQueue();
         queue.end();
         queue.push(A);

         expect(await queue.iterable.next()).toEqual({ value: undefined, done: true });
      });

      it('stays completed for repeated pulls', async () => {
         const queue = createBufferQueue();
         queue.end();

         expect((await queue.iterable.next()).done).toBe(true);
         expect((await queue.iterable.next()).done).toBe(true);
      });
   });

   describe('fail', () => {
      it('rejects a subsequent pull with the error', async () => {
         const queue = createBufferQueue();
         const error = new Error('boom');
         queue.fail(error);

         await expect(queue.iterable.next()).rejects.toBe(error);
      });

      it('rejects all parked pulls with the error', async () => {
         const queue = createBufferQueue();
         const error = new Error('boom');

         const first = queue.iterable.next();
         const second = queue.iterable.next();
         queue.fail(error);

         await expect(first).rejects.toBe(error);
         await expect(second).rejects.toBe(error);
      });

      it('drains buffered values before surfacing the error', async () => {
         const queue = createBufferQueue();
         const error = new Error('boom');
         queue.push(A);
         queue.fail(error);

         expect((await queue.iterable.next()).value).toBe(A);
         await expect(queue.iterable.next()).rejects.toBe(error);
      });

      it('ends the queue, ignoring values pushed after failing', async () => {
         const queue = createBufferQueue();
         const error = new Error('boom');
         queue.fail(error);
         queue.push(A);

         await expect(queue.iterable.next()).rejects.toBe(error);
      });

      it('surfaces the same error on repeated pulls', async () => {
         const queue = createBufferQueue();
         const error = new Error('boom');
         queue.fail(error);

         await expect(queue.iterable.next()).rejects.toBe(error);
         await expect(queue.iterable.next()).rejects.toBe(error);
      });
   });

   describe('settling once (first call wins)', () => {
      it('ignores fail() after end()', async () => {
         const queue = createBufferQueue();
         queue.end();
         queue.fail(new Error('boom'));

         expect(await queue.iterable.next()).toEqual({ value: undefined, done: true });
      });

      it('ignores end() after fail()', async () => {
         const queue = createBufferQueue();
         const error = new Error('boom');
         queue.fail(error);
         queue.end();

         await expect(queue.iterable.next()).rejects.toBe(error);
      });

      it('ignores a repeated end()', async () => {
         const queue = createBufferQueue();
         queue.end();
         queue.end();

         expect(await queue.iterable.next()).toEqual({ value: undefined, done: true });
      });

      it('keeps the first error when fail() is called twice', async () => {
         const queue = createBufferQueue();
         const first = new Error('first');
         queue.fail(first);
         queue.fail(new Error('second'));

         await expect(queue.iterable.next()).rejects.toBe(first);
      });

      it('does not re-settle pulls parked after settling', async () => {
         const queue = createBufferQueue();
         queue.end();

         // a pull taken after end() resolves immediately as done and is never
         // parked, so a subsequent fail() cannot turn it into a rejection
         const pull = queue.iterable.next();
         queue.fail(new Error('boom'));

         expect(await pull).toEqual({ value: undefined, done: true });
      });
   });

   describe('async iteration', () => {
      it('is its own async iterator', () => {
         const queue = createBufferQueue();
         expect(queue.iterable[Symbol.asyncIterator]()).toBe(queue.iterable);
      });

      it('yields buffered values through for-await then completes on end', async () => {
         const queue = createBufferQueue();
         queue.push(A);
         queue.push(B);
         queue.end();

         const seen: Buffer[] = [];
         for await (const chunk of queue.iterable) {
            seen.push(chunk);
         }

         expect(seen).toEqual([A, B]);
      });

      it('yields values fed asynchronously while a consumer awaits', async () => {
         const queue = createBufferQueue();
         const seen: Buffer[] = [];

         const consumed = (async () => {
            for await (const chunk of queue.iterable) {
               seen.push(chunk);
            }
         })();

         // let the loop park on its first pull, then feed it
         await Promise.resolve();
         queue.push(A);
         await Promise.resolve();
         queue.push(B);
         queue.end();

         await consumed;
         expect(seen).toEqual([A, B]);
      });

      it('throws out of for-await when the queue fails', async () => {
         const queue = createBufferQueue();
         const error = new Error('boom');
         queue.push(A);
         queue.fail(error);

         const seen: Buffer[] = [];
         await expect(
            (async () => {
               for await (const chunk of queue.iterable) {
                  seen.push(chunk);
               }
            })()
         ).rejects.toBe(error);

         expect(seen).toEqual([A]);
      });
   });
});
