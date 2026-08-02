import { GitError } from '../errors/git-error';
import { createLogger, type OutputLogger } from '../git-logger';
import type { GitTask } from '../tasks/task';

type AnyGitTask = GitTask<any>;

type TaskInProgress = {
   name: string;
   logger: OutputLogger;
   task: AnyGitTask;
};

export class TasksPendingQueue {
   private _queue: Map<AnyGitTask, TaskInProgress> = new Map();

   constructor(private logLabel = 'GitExecutor') {}

   private withProgress(task: AnyGitTask) {
      return this._queue.get(task);
   }

   private createProgress(task: AnyGitTask): TaskInProgress {
      const name = TasksPendingQueue.getName(task.commands[0]);
      const logger = createLogger(this.logLabel, name);

      return {
         task,
         logger,
         name,
      };
   }

   push(task: AnyGitTask): TaskInProgress {
      const progress = this.createProgress(task);
      progress.logger('Adding task to the queue, commands = %o', task.commands);

      this._queue.set(task, progress);

      return progress;
   }

   fatal(err: GitError): void {
      for (const [task, { logger }] of Array.from(this._queue.entries())) {
         if (task === err.task) {
            logger.info(`Failed %o`, err);
            logger(
               `Fatal exception, any as-yet un-started tasks run through this executor will not be attempted`
            );
         } else {
            logger.info(
               `A fatal exception occurred in a previous task, the queue has been purged: %o`,
               err.message
            );
         }

         this.complete(task);
      }

      if (this._queue.size !== 0) {
         throw new Error(`Queue size should be zero after fatal: ${this._queue.size}`);
      }
   }

   complete(task: AnyGitTask): void {
      const progress = this.withProgress(task);
      if (progress) {
         this._queue.delete(task);
      }
   }

   attempt(task: AnyGitTask): TaskInProgress {
      const progress = this.withProgress(task);
      if (!progress) {
         throw new GitError(undefined, 'TasksPendingQueue: attempt called for an unknown task');
      }
      progress.logger('Starting task');

      return progress;
   }

   static getName(name = 'empty') {
      return `task:${name}:${++TasksPendingQueue.counter}`;
   }

   private static counter = 0;
}
