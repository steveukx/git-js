import { SimpleGitTask } from '../tasks/task';
import { GitExecutorEnv, outputHandler, SimpleGitExecutor } from '../types';
import { GitExecutorChain } from './git-executor-chain';
import { Scheduler } from './scheduler';

export class GitExecutor implements SimpleGitExecutor {

   private _chain = new GitExecutorChain(this, this._scheduler);

   public env: GitExecutorEnv;
   public outputHandler?: outputHandler;

   constructor(
      public binary: string = 'git',
      public cwd: string,
      private _scheduler: Scheduler,
   ) {
   }

   chain(): SimpleGitExecutor {
      return new GitExecutorChain(this, this._scheduler);
   }

   push<R>(task: SimpleGitTask<R>): Promise<void | R> {
      return this._chain.push(task);
   }

}


