import { parseEnv, type VulnerabilityCategory } from '@simple-git/argv-parser';
import { describe, expect, it } from 'vitest';

import {
   aVulnerability,
   aWriteConfig,
   noVulnerabilities,
   oneVulnerability,
} from './__fixtures__/mocks';

describe('parseEnv', () => {
   describe('permitted settings', () => {
      it('allows empty environment variables', () => {
         expect(parseEnv({})).toHaveProperty('vulnerabilities', noVulnerabilities());
      });

      it('allows innocuous environment variables', () => {
         expect(parseEnv({ 'PATH': '...', LANG: 'C', LC_ALL: 'C' })).toHaveProperty(
            'vulnerabilities',
            noVulnerabilities()
         );
      });
   });

   it.each<[string, string, VulnerabilityCategory | null]>([
      ['EDITOR', 'malicious', 'allowUnsafeEditor'],
      ['GIT_ASKPASS', 'malicious', 'allowUnsafeAskPass'],
      ['GIT_CONFIG_GLOBAL', '/tmp/malicious', 'allowUnsafeConfigPaths'],
      ['GIT_CONFIG_SYSTEM', '/tmp/malicious', 'allowUnsafeConfigPaths'],
      ['GIT_CONFIG_COUNT', '1', 'allowUnsafeConfigEnvCount'],
      ['GIT_CONFIG_PARAMETERS', "'core.pager=cat'", 'allowUnsafeConfigEnvCount'],
      ['GIT_CONFIG', '/tmp/malicious', 'allowUnsafeConfigPaths'],
      ['GIT_EDITOR', '/tmp/malicious', 'allowUnsafeEditor'],
      ['GIT_SEQUENCE_EDITOR', '/tmp/malicious', 'allowUnsafeEditor'],
      ['GIT_EXEC_PATH', '/tmp/malicious', 'allowUnsafeConfigPaths'],
      ['GIT_EXTERNAL_DIFF', '/tmp/malicious', 'allowUnsafeDiffExternal'],
      ['GIT_PAGER', '/tmp/malicious', 'allowUnsafePager'],
      ['GIT_PROXY_COMMAND', '/tmp/malicious', 'allowUnsafeGitProxy'],
      ['GIT_SSH', '/tmp/malicious', 'allowUnsafeSshCommand'],
      ['GIT_SSH_COMMAND', '/tmp/malicious', 'allowUnsafeSshCommand'],
      ['PAGER', 'malicious', 'allowUnsafePager'],
      ['PREFIX', 'malicious', 'allowUnsafeConfigPaths'],
      ['SSH_ASKPASS', 'malicious', 'allowUnsafeAskPass'],
   ])('with environment variable %s = %s', (key, value, category) => {
      const expected = category ? oneVulnerability(category) : noVulnerabilities();
      const parsed = parseEnv({ [key]: value });

      expect(parsed.vulnerabilities).toEqual(expected);
   });

   it('triggers configuration warnings when using environment variables', () => {
      const parsed = parseEnv({
         'git_config_count': '2',
         git_config_key_0: 'CORE.FSMonitor',
         git_config_value_0: 'malicious',
         git_config_key_1: 'user.name',
         git_config_value_1: 'bob',
      });

      expect(parsed).toHaveProperty('config', {
         read: [],
         write: [
            aWriteConfig('core.fsmonitor', 'env', 'malicious'),
            aWriteConfig('user.name', 'env', 'bob'),
         ],
      });
      expect(parsed).toHaveProperty('vulnerabilities', [
         aVulnerability('allowUnsafeConfigEnvCount'),
         aVulnerability('allowUnsafeFsMonitor'),
      ]);
   });
});
