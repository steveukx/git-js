import { createLogger } from '../git-logger';
import type { SimpleGitOptions } from '../types';
import type { SimpleGitPlugin } from './simple-git-plugin';

const logger = createLogger('', 'plugin:input');

export function inputPlugin(
   input: SimpleGitOptions['input']
): SimpleGitPlugin<'spawn.after'> | void {
   if (!input) {
      return;
   }

   return {
      type: 'spawn.after',
      action(_data, { commands, spawned: { stdin } }) {
         if (!stdin) {
            return;
         }

         const content = input([...commands]);
         if (!content) {
            return logger(`generated zero length content, not writing to stdin`);
         }

         logger(
            `writing %s bytes to stdin`,
            Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content)
         );

         stdin.on('error', (err: NodeJS.ErrnoException) => {
            // EPIPE is expected when git exits before consuming all input
            if (err.code !== 'EPIPE') {
               logger('[ERROR] stdin error %o', err);
            }
         });

         stdin.end(content);
      },
   };
}
