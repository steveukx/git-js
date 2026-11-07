import { describe, expect, it } from 'vitest';
import { configKeyMatcher, isSafeConfigKey, parseArgv, parseEnv, SAFE_CONFIG_KEYS } from '../index';

describe('config allow list', () => {
   describe('configKeyMatcher', () => {
      it('matches exact keys case-insensitively', () => {
         const matches = configKeyMatcher(['core.sshCommand']);

         expect(matches('core.sshcommand')).toBe(true);
         expect(matches('CORE.SSHCOMMAND')).toBe(true);
         expect(matches('core.sshcommandx')).toBe(false);
         expect(matches('xcore.sshcommand')).toBe(false);
      });

      it('wildcards match any characters including subsection separators', () => {
         const matches = configKeyMatcher(['filter.*', 'url.*.insteadOf']);

         expect(matches('filter.lfs.smudge')).toBe(true);
         expect(matches('filter.lfs.process')).toBe(true);
         expect(matches('url.https://example.com/a.b/.insteadof')).toBe(true);
         expect(matches('url.insteadof')).toBe(false);
         expect(matches('filters.lfs.smudge')).toBe(false);
      });

      it('treats regex characters in patterns literally', () => {
         const matches = configKeyMatcher(['a.b+c']);

         expect(matches('a.b+c')).toBe(true);
         expect(matches('a.bbc')).toBe(false);
         expect(matches('axb+c')).toBe(false);
      });

      it('ignores empty patterns', () => {
         const matches = configKeyMatcher(['', '  ']);

         expect(matches('')).toBe(false);
         expect(matches('user.name')).toBe(false);
      });
   });

   describe('SAFE_CONFIG_KEYS', () => {
      it.each(SAFE_CONFIG_KEYS.map((key) => [key.replace(/\*/g, 'example')]))(
         'safe key %s is never flagged as a vulnerability',
         (key) => {
            expect(isSafeConfigKey(key)).toBe(true);
            expect(parseArgv('-c', `${key}=value`, 'status').vulnerabilities).toEqual([]);
         }
      );

      it.each([
         'alias.st',
         'core.editor',
         'core.fsmonitor',
         'core.hookspath',
         'core.pager',
         'core.sshcommand',
         'credential.helper',
         'diff.external',
         'diff.foo.textconv',
         'filter.foo.smudge',
         'gpg.program',
         'http.proxy',
         'http.sslverify',
         'include.path',
         'includeif.gitdir:/.path',
         'protocol.ext.allow',
         'safe.directory',
         'submodule.foo.update',
         'trailer.foo.cmd',
         'url.http://evil/.insteadof',
      ])('does not include %s', (key) => {
         expect(isSafeConfigKey(key)).toBe(false);
      });
   });

   describe('vulnerability source keys', () => {
      it('identifies the config key behind a vulnerability', () => {
         expect(parseArgv('-c', 'Core.SshCommand=evil', 'fetch').vulnerabilities).toEqual([
            expect.objectContaining({
               category: 'allowUnsafeSshCommand',
               configKey: 'core.sshcommand',
            }),
         ]);
      });

      it('identifies the environment variable behind a vulnerability', () => {
         expect(parseEnv({ GIT_SSH_COMMAND: 'evil' }).vulnerabilities).toEqual([
            expect.objectContaining({
               category: 'allowUnsafeSshCommand',
               envKey: 'git_ssh_command',
            }),
         ]);
      });

      it('identifies the config key set through GIT_CONFIG_KEY_<n>', () => {
         expect(
            parseEnv({
               GIT_CONFIG_COUNT: '1',
               GIT_CONFIG_KEY_0: 'core.pager',
               GIT_CONFIG_VALUE_0: 'x',
            }).vulnerabilities
         ).toEqual([
            expect.objectContaining({
               category: 'allowUnsafeConfigEnvCount',
               envKey: 'git_config_count',
            }),
            expect.objectContaining({ category: 'allowUnsafePager', configKey: 'core.pager' }),
         ]);
      });
   });
});
