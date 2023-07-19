import { SimpleGit } from '../../../typings';
import { SimpleGitApi } from '../simple-git-api';
import { getTrailingOptions, trailingFunctionArgument } from '../utils';
import { straightThroughBufferTask, straightThroughStringTask } from './task';

export default function (): Pick<SimpleGit, 'showBuffer' | 'show'> {
   return {
      showBuffer(this: SimpleGitApi) {
         const commands = ['show', ...getTrailingOptions(arguments, 1)];
         if (!commands.includes('--binary')) {
            commands.splice(1, 0, '--binary');
         }

         return this._runTask(
            straightThroughBufferTask(commands),
            trailingFunctionArgument(arguments)
         );
      },

      show(this: SimpleGitApi) {
         const commands = ['show', ...getTrailingOptions(arguments, 1)];
         return this._runTask(
            straightThroughStringTask(commands),
            trailingFunctionArgument(arguments)
         );
      },
   };
}
