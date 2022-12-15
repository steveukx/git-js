import type { SimpleGit } from '../../../typings';
import type { SimpleGitApi } from '../simple-git-api';
import { getTrailingOptions, remove, trailingFunctionArgument } from '../utils';
import { straightThroughStringTask } from './task';

function checkoutTask(args: string[]) {
   const commands = ['checkout', ...args];
   if (commands[1] === '-b' && commands.includes('-B')) {
      commands[1] = remove(commands, '-B');
   }

   return straightThroughStringTask(commands);
}

export default function (): Pick<SimpleGit, 'checkout' | 'checkoutBranch' | 'checkoutLocalBranch'> {
   return {
      checkout(this: SimpleGitApi) {
         return this._runTask(
            checkoutTask(getTrailingOptions(arguments, 1)),
            trailingFunctionArgument(arguments)
         );
      },

      checkoutBranch(this: SimpleGitApi, branchName, startPoint) {
         return this._runTask(
            checkoutTask(['-b', branchName, startPoint, ...getTrailingOptions(arguments)]),
            trailingFunctionArgument(arguments)
         );
      },

      checkoutLocalBranch(this: SimpleGitApi, branchName) {
         return this._runTask(
            checkoutTask(['-b', branchName, ...getTrailingOptions(arguments)]),
            trailingFunctionArgument(arguments)
         );
      },
   };
}
