import type { ParsedConfigActivity } from '../args/parse-argv.types';
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
   const regex = typeof config === 'string' ? new RegExp(`\\s*${config.toLowerCase()}`) : config;

   return function preventCommand(key: string): Vulnerability | void {
      if (regex.test(key)) {
         return {
            category,
            message: `Configuring ${message} is not permitted without enabling ${category}`,
         };
      }
   };
}

function preventExpandedConfigBuilder(config: string, category: VulnerabilityCategory) {
   const regex = new RegExp(`\\s*${config.toLowerCase().replace(/\./g, '(\..+)?.')}`);
   return preventConfigBuilder(regex, category, config);
}

const preventUnsafeConfig = [
   preventConfigBuilder('alias', 'allowUnsafeAlias'),
   preventConfigBuilder('core.askPass', 'allowUnsafeAskPass'),
   preventExpandedConfigBuilder('credential.helper', 'allowUnsafeCredentialHelper'),
   preventConfigBuilder('core.editor', 'allowUnsafeEditor'),
   preventConfigBuilder('core.fsmonitor', 'allowUnsafeFsMonitor'),
   preventConfigBuilder('core.gitProxy', 'allowUnsafeGitProxy'),
   preventConfigBuilder('core.hooksPath', 'allowUnsafeHooksPath'),
   preventConfigBuilder('core.sshCommand', 'allowUnsafeSshCommand'),
   preventConfigBuilder('diff.external', 'allowUnsafeDiffExternal'),
   preventExpandedConfigBuilder('diff.textconv', 'allowUnsafeDiffTextConv'),
   preventExpandedConfigBuilder('filter.clean', 'allowUnsafeFilter'),
   preventExpandedConfigBuilder('filter.smudge', 'allowUnsafeFilter'),
   preventConfigBuilder('init.templateDir', 'allowUnsafeTemplateDir'),
   preventExpandedConfigBuilder('merge.driver', 'allowUnsafeMergeDriver'),
   preventExpandedConfigBuilder('mergetool.path', 'allowUnsafeMergeDriver'),
   preventExpandedConfigBuilder('mergetool.cmd', 'allowUnsafeMergeDriver'),
   preventExpandedConfigBuilder('protocol.allow', 'allowUnsafeProtocolOverride'),
];
