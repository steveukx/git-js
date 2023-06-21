import { SimpleGitPlugin } from './simple-git-plugin';
import { isPathSpec, toPaths } from '../args/pathspec';

export function suffixPathsPlugin(): SimpleGitPlugin<'spawn.args'> {
   return {
      type: 'spawn.args',
      action(data) {
         const prefix: string[] = [];
         const suffix: string[] = [];
         let suffixFound: boolean = false;

         for (let i = 0; i < data.length; i++) {
            const param = data[i];

            if (isPathSpec(param)) {
               suffixFound = true;
               suffix.push(...toPaths(param));
               continue;
            }

            if (param === '--') {
               suffixFound = true;
               suffix.push(
                  ...data
                     .slice(i + 1)
                     .flatMap((item) => (isPathSpec(item) && toPaths(item)) || item)
               );
               break;
            }

            prefix.push(param);
         }

         return suffixFound ? [...prefix, '--', ...suffix.map(String)] : prefix;
      },
   };
}
