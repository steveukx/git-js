import type { ParsedConfigActivity } from '../args/parse-argv.types';
import type { Vulnerability, VulnerabilityCategory } from './vulnerability.types';

export function* detectVulnerableConfigWrites({
   write,
}: ParsedConfigActivity): Generator<Vulnerability> {
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
   preventConfigBuilder('core.editor', 'allowUnsafeEditor'),
   preventConfigBuilder('core.fsmonitor', 'allowUnsafeFsMonitor'),
   preventConfigBuilder('core.gitProxy', 'allowUnsafeGitProxy'),
   preventConfigBuilder('core.hooksPath', 'allowUnsafeHooksPath'),
   preventConfigBuilder('core.pager', 'allowUnsafePager'),
   preventConfigBuilder('core.sshCommand', 'allowUnsafeSshCommand'),
   preventExpandedConfigBuilder('credential.helper', 'allowUnsafeCredentialHelper'),
   preventExpandedConfigBuilder('diff.command', 'allowUnsafeDiffExternal'),
   preventConfigBuilder('diff.external', 'allowUnsafeDiffExternal'),
   preventExpandedConfigBuilder('diff.textconv', 'allowUnsafeDiffTextConv'),
   preventExpandedConfigBuilder('filter.clean', 'allowUnsafeFilter'),
   preventExpandedConfigBuilder('filter.smudge', 'allowUnsafeFilter'),
   preventExpandedConfigBuilder('gpg.program', 'allowUnsafeGpgProgram'),
   preventConfigBuilder('init.templateDir', 'allowUnsafeTemplateDir'),
   preventExpandedConfigBuilder('merge.driver', 'allowUnsafeMergeDriver'),
   preventExpandedConfigBuilder('mergetool.path', 'allowUnsafeMergeDriver'),
   preventExpandedConfigBuilder('mergetool.cmd', 'allowUnsafeMergeDriver'),
   preventExpandedConfigBuilder('protocol.allow', 'allowUnsafeProtocolOverride'),
   preventExpandedConfigBuilder('remote.receivepack', 'allowUnsafePack'),
   preventExpandedConfigBuilder('remote.uploadpack', 'allowUnsafePack'),
   preventConfigBuilder('sequence.editor', 'allowUnsafeEditor'),
];
