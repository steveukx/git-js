import type { Flag } from '../flags/flags.helpers';
import type { Vulnerability } from './vulnerability.types';

export function* detectUploadPack(task: null | string, flags: Flag[]): Generator<Vulnerability> {
   for (const flag of flags) {
      if (/^--(upload|receive)-pack/.test(flag.name)) {
         yield {
            category: 'allowUnsafePack',
            message:
               'Use of --upload-pack or --receive-pack is not permitted without enabling allowUnsafePack',
         };
      }
      if (task === 'clone' && (/^-\w*u/.test(flag.name) || flag.name === '--u')) {
         yield {
            category: 'allowUnsafePack',
            message:
               'Use of clone with option -u is not permitted without enabling allowUnsafePack',
         };
      }
      if (task === 'push' && /^--exec/.test(flag.name)) {
         yield {
            category: 'allowUnsafePack',
            message:
               'Use of push with option --exec is not permitted without enabling allowUnsafePack',
         };
      }
   }
}
