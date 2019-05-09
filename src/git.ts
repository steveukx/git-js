import { construct } from './api/construct';
import { Context } from './interfaces/context';
import { cwd } from './api/cwd';
import { Scheduler } from './util/scheduler';

export class Git {

   private _queue: Promise<any> = Promise.resolve();

   private _context: Context = {
      baseDir: process.cwd(),
      command: 'git',
      env: null,
      async exec (args: Array<string | number>) {
         debugger;

         return (new Scheduler(this, [args, {}])).run();
      }
   };

   constructor (baseDir: string) {

      this._queue = construct(this._context, baseDir);

   }

   async cwd (workingDirectory: string) {

      return this._queue = this._queue.then(
         () => cwd(this._context, workingDirectory),
         () => this._context.baseDir,
      );

   }

}
