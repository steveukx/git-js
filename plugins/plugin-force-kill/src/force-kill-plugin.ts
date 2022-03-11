import { GitPluginError, SimpleGitPlugin } from 'simple-git';

export type ForceKillPluginOptions = {
   abort(commands: string[]): AbortSignal
}

export function forceKillPlugin({abort}: ForceKillPluginOptions): SimpleGitPlugin<'spawn.after'> {
   return {
      type: 'spawn.after',
      async action(_data, {kill, commands}) {
         const signal = abort(commands);

         signal.addEventListener('abort', () => {
            kill(
               new GitPluginError(undefined, 'force-kill', 'abort message received')
            );
         })
      }
   }
}
