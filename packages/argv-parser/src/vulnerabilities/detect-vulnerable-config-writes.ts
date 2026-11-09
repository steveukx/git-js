import type { ParsedConfigActivity } from '../args/parse-argv.types';
import type { Vulnerability, VulnerabilityCategory } from './vulnerability.types';

export function* detectVulnerableConfigWrites({
   write,
}: ParsedConfigActivity): Generator<Vulnerability> {
   for (const config of write) {
      // the values in a renamed section were written before this command, so can't be checked here
      if (config.rename) {
         yield {
            category: 'allowUnsafeConfigRename',
            message: `Renaming config section ${config.key} is not permitted without enabling allowUnsafeConfigRename`,
         };
         continue;
      }

      for (const helper of preventUnsafeConfig) {
         const vulnerability = helper(config.key);
         if (vulnerability) {
            yield vulnerability;
            break;
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
            configKey: key,
         };
      }
   };
}

function preventExpandedConfigBuilder(config: string, category: VulnerabilityCategory) {
   const regex = new RegExp(`\\s*${config.toLowerCase().replace(/\./g, '(..+)?.')}`);
   return preventConfigBuilder(regex, category, config);
}

/**
 * Keys read by `git send-email`, each also available per-identity as `sendemail.<identity>.<key>`:
 * - `sendmailCmd`, `toCmd`, `ccCmd` and `headerCmd` are run as shell commands
 * - `smtpServer` is run as a sendmail-like program when its value is an absolute path, with
 *   `smtpServerOption` passed to it as arguments
 * - `smtpSSLCertPath` disables certificate verification when empty
 * - `smtpSSLClientCert`, `smtpSSLClientKey`, `aliasesFile` and `mailmap.file` name files to read
 */
const SEND_EMAIL_KEYS =
   /^sendemail\.(.+\.)?(sendmailcmd|tocmd|cccmd|headercmd|smtpserver|smtpserveroption|smtpsslcertpath|smtpsslclientcert|smtpsslclientkey|aliasesfile|mailmap\.file)$/;

/**
 * Keys read by `git imap-send`, which `git send-email` can also hand patches to:
 * - `tunnel` is run as a shell command in place of connecting to `imap.host`
 * - `host` is the server patches (and any `imap.user` / `imap.pass`) are sent to
 * - `sslVerify` turns off certificate verification when false
 */
const IMAP_SEND_KEYS = /^imap\.(tunnel|host|sslverify)$/;

/**
 * Keys read by `git instaweb`:
 * - `httpd` is the command line of the web server to start
 * - `modulePath` is the directory apache loads its modules from
 * - `gitwebDir` is the directory the `gitweb.cgi` script is run from
 */
const WEB_SERVER_KEYS = /^instaweb\.(httpd|modulepath|gitwebdir)$/;

/**
 * Keys read by `git web--browse` (used by `git help --web` and `git instaweb`) and `git help --man`:
 * - `browser.<tool>.path` and `man.<tool>.path` replace the program run for a known tool name
 * - `browser.<tool>.cmd` and `man.<tool>.cmd` are the shell command run for a custom tool name
 */
const BROWSER_KEYS = /^(browser|man)\..+\.(path|cmd)$/;

/**
 * Keys that decide which signatures `git` trusts (`verify-commit`, `verify-tag`, `log --show-signature`,
 * `merge --verify-signatures` etc):
 * - `gpg.ssh.allowedSignersFile` names the file of keys trusted to sign
 * - `gpg.ssh.revocationFile` names the file of revoked keys, an empty file revokes nothing
 * - `gpg.minTrustLevel` lowers the trust level an OpenPGP key needs for its signature to be accepted
 */
const SIGNATURE_TRUST_KEYS = /^gpg\.(ssh\.(allowedsignersfile|revocationfile)|mintrustlevel)$/;

/**
 * Only the first match for each key is reported, so more specific rules must come before the
 * catch-all rules at the end of the list. Rules for whole namespaces are anchored and placed first,
 * as the un-anchored rules below can otherwise match part of their keys (eg: `alias` would match
 * `sendemail.aliasesfile`).
 */
const preventUnsafeConfig = [
   preventConfigBuilder(SEND_EMAIL_KEYS, 'allowUnsafeSendEmailConfig', 'sendemail.*'),
   preventConfigBuilder(IMAP_SEND_KEYS, 'allowUnsafeSendEmailConfig', 'imap.*'),
   preventConfigBuilder(WEB_SERVER_KEYS, 'allowUnsafeWebServerConfig', 'instaweb.*'),
   preventConfigBuilder(BROWSER_KEYS, 'allowUnsafeBrowser', 'browser.* / man.*'),
   preventConfigBuilder(SIGNATURE_TRUST_KEYS, 'allowUnsafeSignatureTrust', 'gpg.* signature trust'),

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
   preventExpandedConfigBuilder('difftool.cmd', 'allowUnsafeDiffExternal'),
   preventExpandedConfigBuilder('diff.textconv', 'allowUnsafeDiffTextConv'),
   preventExpandedConfigBuilder('filter.clean', 'allowUnsafeFilter'),
   preventExpandedConfigBuilder('filter.process', 'allowUnsafeFilter'),
   preventExpandedConfigBuilder('filter.smudge', 'allowUnsafeFilter'),
   preventExpandedConfigBuilder('gpg.program', 'allowUnsafeGpgProgram'),
   preventExpandedConfigBuilder('gpg.defaultKeyCommand', 'allowUnsafeGpgProgram'),
   preventConfigBuilder('include.path', 'allowUnsafeInclude'),
   preventExpandedConfigBuilder('includeIf', 'allowUnsafeInclude'),
   preventConfigBuilder('init.templateDir', 'allowUnsafeTemplateDir'),
   preventConfigBuilder('interactive.diffFilter', 'allowUnsafePager'),
   preventExpandedConfigBuilder('pager.', 'allowUnsafePager'),
   preventExpandedConfigBuilder('merge.driver', 'allowUnsafeMergeDriver'),
   preventExpandedConfigBuilder('mergetool.path', 'allowUnsafeMergeDriver'),
   preventExpandedConfigBuilder('mergetool.cmd', 'allowUnsafeMergeDriver'),
   preventExpandedConfigBuilder('protocol.allow', 'allowUnsafeProtocolOverride'),
   preventExpandedConfigBuilder('remote.receivepack', 'allowUnsafePack'),
   preventExpandedConfigBuilder('remote.uploadpack', 'allowUnsafePack'),
   preventConfigBuilder('uploadpack.packObjectsHook', 'allowUnsafePack'),
   preventConfigBuilder('sequence.editor', 'allowUnsafeEditor'),
   preventExpandedConfigBuilder('submodule.update', 'allowUnsafeSubmodule'),
   preventExpandedConfigBuilder('tar.command', 'allowUnsafeCommandBinaries'),
   preventExpandedConfigBuilder('trailer.cmd', 'allowUnsafeCommandBinaries'),
   preventExpandedConfigBuilder('trailer.command', 'allowUnsafeCommandBinaries'),
   preventExpandedConfigBuilder('url.insteadOf', 'allowUnsafeUrlRewrite'),

   // catch-all configuration using the "foo.command" or "bar.cmd" naming convention
   preventConfigBuilder(/command$/, 'allowUnsafeCommandBinaries'),
   preventConfigBuilder(/\.cmd$/, 'allowUnsafeCommandBinaries'),
];
