import { status } from './commands/status';
import {
   arrType,
   trailingArrayArgument,
   trailingFunctionArgument,
   trailingOptionsArgument,
   varType
} from './util/arguments';
import { AsyncHandlerTask, PromiseHandlerTask, Task } from './interfaces/task';
import { AsyncQueue, ErrorCallback, queue } from 'async';
import { Runner } from './interfaces/command-runner';
import { writeLog } from './util/output';
import { stashList } from './commands/stash-list';

export class SimpleGit {

   private queues: Array<AsyncQueue<Task>> = [];
   private chain: any = Promise.resolve();
   private pending: Task[] = [];

   constructor(
      private runner: Runner,
      private concurrency = 1,
   ) {
   }

   private process(tasks: Task): Promise<any[]> {

      const resolveFirst = varType(tasks) === arrType;
      writeLog(`Processing ${ resolveFirst ? 'single task' : 'task group'}`);

      return new Promise((ok, fail) => {
         const results: any[] = [];
         const process = async (task: Task, callback: ErrorCallback<Error>) => {
            let err = null;
            try {
               const data = await this.runner.run(task.command, task.options);
               writeLog(`Task has ${ task.parser ? '' : 'no '} parser`, 'parsing');

               results.push(task.parser ? task.parser(data as any) : data);
            }
            catch (e) {
               err = e;

               results.push(undefined);
            }

            writeLog(`Task completed as ` + (err ? 'error' : 'success'));
            callback(err);
         };
         const q = queue(process, this.concurrency);

         q.drain = () => {
            this.onQueueComplete(q);
            ok(resolveFirst ? firstResult(results) : results);
         };

         q.error = (err, task) => {
            this.onQueueComplete(q);
            fail(err);
         };

         this.queues.push(q);
         q.push(tasks);
      });


   }

   /**
    * When running tasks that have their own callback, they should each be treated as a step in the anonymous
    * chain which should error with the first step that caused an error and prevent all future steps from running
    * (compatibility with v1 mode).
    *
    * @param {AsyncHandlerTask} task
    * @returns {SimpleGit}
    */
   private processChain(task: AsyncHandlerTask): SimpleGit {
      this.pending.push(task);

      this.chain = this.chain.then(() => {
         const next = this.pending.shift();

         if (!next) {
            return Promise.resolve();
         }

         return this.process(next)
            .then(data => task.handler(null, data[0]))
            .catch(err => task.handler(err));
      });

      return this;
   }

   private onQueueComplete (q: any) {
      const indexOf = this.queues.indexOf(q);
      if (indexOf >= 0) {
         this.queues.splice(indexOf, 1);
      }
   }

   /**
    * Check the status of the local repo
    */
   public status(...args: any[]) {
      const task = status(
         trailingFunctionArgument(arguments),
      );

      if (!isAsyncHandler(task)) {
         return this.process(task);
      }

      return this.processChain(task);
   }

   /**
    * List the stash(s) of the local repo
    */
   public stashList (...args: any[]) {
      const task = stashList(
         trailingArrayArgument(arguments),
         trailingOptionsArgument(arguments),
         trailingFunctionArgument(arguments),
      );

      if (!isAsyncHandler(task)) {
         return this.process(task);
      }

      return this.processChain(task);
   }

   private run (task: Task): Promise<any[]> {
      return this.process(this.chain.splice(0, this.chain.length))
         .catch(e => e);
   }

}

function firstResult(items: any[]) {
   return varType(items) === arrType ? items[0] : undefined;
}

function isAsyncHandler(task: Task): task is AsyncHandlerTask {
   return typeof (<AsyncHandlerTask>task).handler === 'function';
}

function isPromiseHandler(task: Task): task is PromiseHandlerTask {
   return typeof (<AsyncHandlerTask>task).handler === 'undefined';
}
