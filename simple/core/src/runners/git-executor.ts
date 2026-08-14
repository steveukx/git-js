import type { TaskPipeline } from '../pipeline/pipeline';
import type { GitBinary } from '../pipeline/types';
import type { GitTask } from '../tasks';
import type { GitExecutorEnv, SimpleGitExecutor } from '../types';
import { GitExecutorChain } from './git-executor-chain';
import type { Scheduler } from './scheduler';

export class GitExecutor implements SimpleGitExecutor {
   private _chain = new GitExecutorChain(this, this._scheduler, this._pipeline);

   public env: GitExecutorEnv;
   public binary: GitBinary = { binary: 'git', prefix: [] };

   constructor(
      public cwd: string,
      private _scheduler: Scheduler,
      private _pipeline: TaskPipeline
   ) {}

   chain(): SimpleGitExecutor {
      return new GitExecutorChain(this, this._scheduler, this._pipeline);
   }

   push<R>(task: GitTask<R>): Promise<R> {
      return this._chain.push(task);
   }
}
