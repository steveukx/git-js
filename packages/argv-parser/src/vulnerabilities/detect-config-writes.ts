import type { ParsedConfigActivity } from '../parse-argv.types';
import type { Vulnerability, VulnerabilityCategory } from './vulnerability.types';

export function* detectConfigWrites({ write }: ParsedConfigActivity): Generator<Vulnerability> {
   for (const config of write) {
      for (const helper of preventUnsafeConfig) {
         const vulnerability = helper(config.key);
         if (vulnerability) {
            yield vulnerability;
         }
      }
   }
}

function preventConfigBuilder(
   config: string | RegExp,
   category: VulnerabilityCategory,
   message = String(config)
) {
   const regex = typeof config === 'string' ? new RegExp(`\\s*${config}`, 'i') : config;

   return function preventCommand(key: string): Vulnerability | void {
      if (regex.test(key)) {
         return {
            category,
            message: `Configuring ${message} is not permitted without enabling ${category}`,
         };
      }
   };
}

const preventUnsafeConfig = [
   preventConfigBuilder(
      /^\s*protocol(.[a-z]+)?.allow/i,
      'allowUnsafeProtocolOverride',
      'protocol.allow'
   ),
   preventConfigBuilder('core.sshCommand', 'allowUnsafeSshCommand'),
   preventConfigBuilder('core.fsmonitor', 'allowUnsafeFsMonitor'),
   preventConfigBuilder('core.gitProxy', 'allowUnsafeGitProxy'),
   preventConfigBuilder('core.hooksPath', 'allowUnsafeHooksPath'),
   preventConfigBuilder('diff.external', 'allowUnsafeDiffExternal'),
];
