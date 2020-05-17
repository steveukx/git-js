import { straightThroughStringTask, StringTask } from './task';

export function listRemotesTask (customArgs: string[] = []): StringTask<string>{
   const commands = [...customArgs];
   if (commands[0] !== 'ls-remote') {
      commands.unshift('ls-remote');
   }

   return straightThroughStringTask(commands);
}
