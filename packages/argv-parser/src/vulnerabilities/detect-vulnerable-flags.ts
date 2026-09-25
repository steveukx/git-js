import type { Flag } from '../flags/flags.helpers';
import type { Vulnerability, VulnerabilityCategory } from './vulnerability.types';

export function* detectVulnerableFlags(
   task: null | string,
   flags: Flag[]
): Generator<Vulnerability> {
   for (const flag of flags) {
      for (const helper of preventUnsafeFlags) {
         const vulnerability = helper(task, flag);
         if (vulnerability) {
            yield vulnerability;
         }
      }
   }
}

interface PreventFlagOptions {
   /** Label to use in the error message in place of the matcher itself */
   name?: string;

   /** Only match when the switch appears before the git sub-command */
   globalOnly?: boolean;

   /**
    * Only match when the switch was supplied with a value - without one switches
    * such as `--git-dir` and `--exec-path` are getters rather than setters.
    */
   withValue?: boolean;
}

function preventFlagBuilder(
   task: string | null,
   flag: string | RegExp,
   category: VulnerabilityCategory,
   { name = String(flag), globalOnly = false, withValue = false }: PreventFlagOptions = {}
) {
   const regex = typeof flag === 'string' ? new RegExp(`\\s*${flag.toLowerCase()}`) : flag;
   const message = `Use of ${task ? `${task} with option ` : ''}${name} is not permitted without enabling ${category}`;

   return function preventFlag(currentTask: string | null, flag: Flag): Vulnerability | void {
      if (task && currentTask !== task) {
         return;
      }

      if (globalOnly && !flag.isGlobal) {
         return;
      }

      if (withValue && flag.value === undefined) {
         return;
      }

      if (regex.test(flag.name)) {
         return {
            category,
            message,
         };
      }
   };
}

const pathTakingGlobal: PreventFlagOptions = { globalOnly: true, withValue: true };

const preventUnsafeFlags = [
   preventFlagBuilder(null, /--(upload|receive)-pack/, 'allowUnsafePack', {
      name: '--upload-pack or --receive-pack',
   }),
   preventFlagBuilder('clone', /^-\w*u/, 'allowUnsafePack'),
   preventFlagBuilder('clone', '--u', 'allowUnsafePack'),
   preventFlagBuilder('push', /^--exec$/, 'allowUnsafePack', { name: '--exec' }),
   // `git` accepts unambiguous abbreviations of long options, so `--ex` and `--exe` are `--exec`
   preventFlagBuilder('rebase', /^(-x|--ex(ec?)?)$/, 'allowUnsafeExec', { name: '-x or --exec' }),
   preventFlagBuilder(null, '--template', 'allowUnsafeTemplateDir'),
   preventFlagBuilder(null, '--exec-path', 'allowUnsafeExec', pathTakingGlobal),
   // `git` reads the configuration of whichever repository these name, so the
   // directory alone is enough to deliver config the argv guards never see
   preventFlagBuilder(null, '--git-dir', 'allowUnsafeConfigPaths', pathTakingGlobal),
   preventFlagBuilder(null, '--work-tree', 'allowUnsafeConfigPaths', pathTakingGlobal),
   preventFlagBuilder(null, /^-C$/, 'allowUnsafeConfigPaths', { ...pathTakingGlobal, name: '-C' }),
];
