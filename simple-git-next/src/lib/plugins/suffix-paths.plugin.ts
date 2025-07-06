import { SimpleGitPlugin } from './simple-git-plugin';
import { isPathSpec, toPaths } from '../args/pathspec';

export function suffixPathsPlugin(): SimpleGitPlugin<'spawn.args'> {
   return {
      type: 'spawn.args',
      action(data) {
         const prefix: string[] = [];
         let suffix: undefined | string[];
         function append(args: string[]) {
            (suffix = suffix || []).push(...args);
         }

         for (let i = 0; i < data.length; i++) {
            const param = data[i];

            if (isPathSpec(param)) {
               append(toPaths(param));
               continue;
            }

            if (param === '--') {
               append(
                  data.slice(i + 1).flatMap((item) => (isPathSpec(item) && toPaths(item)) || item)
               );
               break;
            }

            prefix.push(param);
         }

         return !suffix ? prefix : [...prefix, '--', ...suffix.map(String)];
      },
   };
}
