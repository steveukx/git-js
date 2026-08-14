import { createDeferred, type DeferredPromise } from '@kwsites/promise-deferred';

import { append, once } from './util';

type Deferred = DeferredPromise<IteratorResult<Buffer>>;

export function createBufferQueue() {
   const values: Buffer[] = [];
   const pulls: Array<Deferred> = [];
   let ended: boolean | Error = false;
   let failure: Error | undefined;

   const drain = once((error?: Error) => {
      failure = error;
      ended = true;

      while (pulls.length) {
         const pull = pulls.shift();
         failure ? pull?.fail(failure) : pull?.done({ value: undefined, done: true });
      }
   });

   return {
      push(buffer: Buffer): void {
         if (ended || failure) {
            return;
         }

         const pull = pulls.shift();
         if (pull) {
            pull.done({ value: buffer, done: false });
         } else {
            values.push(buffer);
         }
      },
      end(): void {
         drain();
      },
      fail(err: Error): void {
         drain(err);
      },
      iterable: {
         next(): Promise<IteratorResult<Buffer>> {
            const deferred = createDeferred<IteratorResult<Buffer>>();

            if (values.length) {
               deferred.done({ value: values.shift()!, done: false });
            } else if (failure) {
               deferred.fail(failure);
            } else if (ended) {
               deferred.done({ value: undefined, done: true });
            } else {
               append(pulls, deferred);
            }

            return deferred.promise;
         },
         [Symbol.asyncIterator]() {
            return this;
         },
      } as AsyncIterableIterator<Buffer>,
   };
}
