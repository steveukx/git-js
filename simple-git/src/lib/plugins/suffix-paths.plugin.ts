import { SimpleGitPlugin } from './simple-git-plugin';
import { isPathSpec, toPaths } from '../args/pathspec';

export function suffixPathsPlugin(): SimpleGitPlugin<'spawn.args'> {
   return {
      type: 'spawn.args',
      action(data) {
         const prefix: string[] = [];
         const suffix: string[] = [];

         for (let i = 0; i < data.length; i++) {
            const param = data[i];

            if (isPathSpec(param)) {
               suffix.push(...toPaths(param));
               continue;
            }

            if (param === '--') {
               suffix.push(
                  ...data
                     .slice(i + 1)
                     .flatMap((item) => (isPathSpec(item) && toPaths(item)) || item)
               );
               break;
            }

            prefix.push(param);
         }

         return !suffix.length ? prefix : [...prefix, '--', ...suffix.map(String)];
      },
   };
}
