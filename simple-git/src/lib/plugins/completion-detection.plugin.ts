import { deferred, DeferredPromise } from '@kwsites/promise-deferred';
import { SimpleGitPluginConfig } from '../types';
import { delay } from '../utils';
import { SimpleGitPlugin } from './simple-git-plugin';

const never = deferred().promise;

export function completionDetectionPlugin({
   onClose = true,
}: SimpleGitPluginConfig['completion'] = {}): SimpleGitPlugin<'spawn.after'> {
   function createEvents() {
      let exitCode = -1;
      const events = {
         close: deferred(),
         closeTimeout: deferred(),
      };

      const result = onClose === false ? never : events.closeTimeout.promise;

      configureTimeout(onClose, events.close, events.closeTimeout);

      return {
         close(code: number) {
            exitCode = code;
            events.close.done();
         },
         get exitCode() {
            return exitCode;
         },
         result,
      };
   }

   function configureTimeout(
      flag: boolean | number,
      event: DeferredPromise<void>,
      timeout: DeferredPromise<void>
   ) {
      if (flag === false) {
         return;
      }

      (flag === true ? event.promise : event.promise.then(() => delay(flag))).then(timeout.done);
   }

   return {
      type: 'spawn.after',
      async action(_data, { spawned, close }) {
         const events = createEvents();

         let deferClose = true;
         let quickClose = () => void (deferClose = false);

         spawned.stdout?.on('data', quickClose);
         spawned.stderr?.on('data', quickClose);
         spawned.on('error', quickClose);

         spawned.on('close', (code: number) => events.close(code));

         try {
            await events.result;
            if (deferClose) {
               await delay(50);
            }
            close(events.exitCode);
         } catch (err) {
            close(events.exitCode, err as Error);
         }
      },
   };
}
