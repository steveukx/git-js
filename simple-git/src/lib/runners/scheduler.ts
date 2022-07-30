import { append, remove } from '../utils';
import { createDeferred, DeferredPromise } from '@kwsites/promise-deferred';
import { createLogger } from '../git-logger';

type ScheduleCompleteCallback = () => void;
type ScheduledTask = Pick<DeferredPromise<ScheduleCompleteCallback>, 'promise' | 'done'> & {
   id: number;
};

const createScheduledTask: () => ScheduledTask = (() => {
   let id = 0;
   return () => {
      id++;
      const { promise, done } = createDeferred<ScheduleCompleteCallback>();

      return {
         promise,
         done,
         id,
      };
   };
})();

export class Scheduler {
   private logger = createLogger('', 'scheduler');
   private pending: ScheduledTask[] = [];
   private running: ScheduledTask[] = [];

   constructor(private concurrency = 2) {
      this.logger(`Constructed, concurrency=%s`, concurrency);
   }

   private schedule() {
      if (!this.pending.length || this.running.length >= this.concurrency) {
         this.logger(
            `Schedule attempt ignored, pending=%s running=%s concurrency=%s`,
            this.pending.length,
            this.running.length,
            this.concurrency
         );
         return;
      }

      const task = append(this.running, this.pending.shift()!);
      this.logger(`Attempting id=%s`, task.id);
      task.done(() => {
         this.logger(`Completing id=`, task.id);
         remove(this.running, task);
         this.schedule();
      });
   }

   next(): Promise<ScheduleCompleteCallback> {
      const { promise, id } = append(this.pending, createScheduledTask());
      this.logger(`Scheduling id=%s`, id);

      this.schedule();

      return promise;
   }
}
