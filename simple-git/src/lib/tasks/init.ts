import { InitResult } from '../../../typings';
import { parseInit } from '../responses/InitSummary';
import { StringTask } from '../types';

const bareCommand = '--bare';

function hasBareCommand(command: string[]) {
   return command.includes(bareCommand);
}

export function initTask(bare = false, path: string, customArgs: string[]): StringTask<InitResult> {
   const commands = ['init', ...customArgs];
   if (bare && !hasBareCommand(commands)) {
      commands.splice(1, 0, bareCommand);
   }

   return {
      commands,
      format: 'utf-8',
      parser(text: string): InitResult {
         return parseInit(commands.includes('--bare'), path, text);
      },
   };
}
