import { getTrailingOptions, remove } from '../utils';
import { type StringTask, straightThroughStringTask } from './task';

function checkoutTask(args: string[]): StringTask<string> {
   const commands = ['checkout', ...args];
   if (commands[1] === '-b' && commands.includes('-B')) {
      commands[1] = remove(commands, '-B');
   }

   return straightThroughStringTask(commands);
}

export function checkout(...args: unknown[]): StringTask<string> {
   return checkoutTask(getTrailingOptions(args, 1));
}

export function checkoutBranch(
   branchName: string,
   startPoint: string,
   ...args: unknown[]
): StringTask<string> {
   return checkoutTask([
      '-b',
      branchName,
      startPoint,
      ...getTrailingOptions([branchName, startPoint, ...args]),
   ]);
}

export function checkoutLocalBranch(branchName: string, ...args: unknown[]): StringTask<string> {
   return checkoutTask(['-b', branchName, ...getTrailingOptions([branchName, ...args])]);
}
