import { GitExecutorEnv, outputHandler, SimpleGitExecutor, SimpleGitTask } from '../types';
import { GitExecutorChain } from './git-executor-chain';
import { Scheduler } from './scheduler';
import { PluginStore } from '../plugins/plugin-store';

export class GitExecutor implements SimpleGitExecutor {

   private _chain = new GitExecutorChain(this, this._scheduler, this._plugins);

   public env: GitExecutorEnv;
   public outputHandler?: outputHandler;

   constructor(
      public binary: string = 'git',
      public cwd: string,
      private _scheduler: Scheduler,
      private _plugins: PluginStore,
   ) {
   }

   chain(): SimpleGitExecutor {
      return new GitExecutorChain(this, this._scheduler, this._plugins);
   }

   push<R>(task: SimpleGitTask<R>): Promise<void | R> {
      return this._chain.push(task);
   }

}


