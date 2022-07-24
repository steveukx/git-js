import { prefixedArray } from '../utils';
import { SimpleGitPlugin } from './simple-git-plugin';

export function commandConfigPrefixingPlugin(
   configuration: string[]
): SimpleGitPlugin<'spawn.args'> {
   const prefix = prefixedArray(configuration, '-c');

   return {
      type: 'spawn.args',
      action(data) {
         return [...prefix, ...data];
      },
   };
}
