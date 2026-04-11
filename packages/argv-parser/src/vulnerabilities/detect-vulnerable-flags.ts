import type { Flag } from '../flags/flags.helpers';
import type { Vulnerability, VulnerabilityCategory } from './vulnerability.types';

export function* detectVulnerableFlags(
   task: null | string,
   flags: Flag[]
): Generator<Vulnerability> {
   for (const flag of flags) {
      for (const helper of preventUnsafeFlags) {
         const vulnerability = helper(task, flag.name);
         if (vulnerability) {
            yield vulnerability;
         }
      }
   }
}

function preventFlagBuilder(
   task: string | null,
   flag: string | RegExp,
   category: VulnerabilityCategory,
   name = String(flag)
) {
   const regex = typeof flag === 'string' ? new RegExp(`\\s*${flag.toLowerCase()}`) : flag;
   const message = `Use of ${task ? `${task} with option ` : ''}${name} is not permitted without enabling ${category}`;

   return function preventFlag(currentTask: string | null, flagName: string): Vulnerability | void {
      if ((!task || currentTask === task) && regex.test(flagName)) {
         return {
            category,
            message,
         };
      }
   };
}

const preventUnsafeFlags = [
   preventFlagBuilder(
      null,
      /--(upload|receive)-pack/,
      'allowUnsafePack',
      '--upload-pack or --receive-pack'
   ),
   preventFlagBuilder('clone', /^-\w*u/, 'allowUnsafePack'),
   preventFlagBuilder('clone', '--u', 'allowUnsafePack'),
   preventFlagBuilder('push', '--exec', 'allowUnsafePack'),
   preventFlagBuilder(null, '--template', 'allowUnsafeTemplateDir'),
];
