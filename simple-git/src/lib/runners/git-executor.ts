import type { PluginStore } from '../plugins';
import type { GitExecutorEnv, outputHandler, SimpleGitExecutor, SimpleGitTask } from '../types';

import { GitExecutorChain } from './git-executor-chain';
import { Scheduler } from './scheduler';

export class GitExecutor implements SimpleGitExecutor {
   private _chain: GitExecutorChain;

   public env: GitExecutorEnv;
   public outputHandler?: outputHandler;

   constructor(
      public cwd: string,
      private _scheduler: Scheduler,
      private _plugins: PluginStore,
      env?: GitExecutorEnv  // <-- NEU: Optionaler env-Parameter
   ) {
      // Initialize env with process.env as base
      this.env = {
         ...process.env,  // <-- Basis: alle Node.js Environment-Variablen
         ...env,          // <-- Überschreibe mit benutzerdefinierten Werten
      };
      
      // Erstelle die Chain
      this._chain = new GitExecutorChain(this, this._scheduler, this._plugins);
   }

   chain(): SimpleGitExecutor {
      return new GitExecutorChain(this, this._scheduler, this._plugins);
   }

   push<R>(task: SimpleGitTask<R>): Promise<R> {
      return this._chain.push(task);
   }
}