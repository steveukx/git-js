import { describe, expect, it } from 'vitest';

import { parseArgv } from '../src/parse-argv';
import { aWriteConfig } from './__fixtures__/mocks';

describe('security edge cases', () => {
   it('detects core.sshCommand injection via -c on any sub-command', () => {
      const parsed = parseArgv(
         '-c',
         'core.sshCommand=ssh -o ProxyCommand="id > /tmp/pwn"',
         'fetch',
         'origin'
      );
      expect(parsed.config.write).toEqual([
         aWriteConfig('core.sshcommand', 'inline', 'ssh -o ProxyCommand="id > /tmp/pwn"'),
      ]);
   });

   it('detects core.fsmonitor injection', () => {
      const parsed = parseArgv('-c', 'core.fsmonitor=touch /tmp/pwn', 'status');
      expect(parsed.config.write).toEqual([
         aWriteConfig('core.fsmonitor', 'inline', `touch /tmp/pwn`),
      ]);
   });

   it('detects uploadpack.packObjectsHook injection', () => {
      const parsed = parseArgv(
         '-c',
         'uploadpack.packObjectsHook=sh -c "id > /tmp/pwn"',
         'clone',
         'git@github.com:x/y.git'
      );
      expect(parsed.config.write).toEqual([
         aWriteConfig('uploadpack.packobjectshook', 'inline', `sh -c "id > /tmp/pwn"`),
      ]);
   });

   it('collects all -c keys from a multi-override invocation', () => {
      const parsed = parseArgv(
         '-c',
         'protocol.allow=never',
         '-c',
         'protocol.ext.allow=always',
         '-c',
         'core.gitProxy=sh -c "id > /tmp/pwn"',
         'ls-remote',
         'ext::sh -c "id > /tmp/pwn"'
      );

      expect(parsed.config.write).toEqual([
         aWriteConfig('protocol.allow', 'inline', `never`),
         aWriteConfig('protocol.ext.allow', 'inline', `always`),
         aWriteConfig('core.gitproxy', 'inline', `sh -c "id > /tmp/pwn"`),
      ]);
   });

   it('--config-env is flagged as an env-scope write', () => {
      const parsed = parseArgv('--config-env=core.sshCommand=MY_SSH_CMD', 'fetch');

      expect(parsed.config.write).toEqual([aWriteConfig('core.sshcommand', 'env', 'MY_SSH_CMD')]);
   });

   it('an opaque unknown cluster does not produce false config writes', () => {
      const { config, paths } = parseArgv('clone', '-xu', 'git@github.com:x/y.git');
      expect(paths).toEqual([]);
      expect(config.write).toEqual([]);
   });

   it('tokens after -- are not mistaken for flags', () => {
      const { flags, paths } = parseArgv('checkout', '--', '-not-a-flag');
      expect(flags).toEqual([]);
      expect(paths).toContain('-not-a-flag');
   });
});
