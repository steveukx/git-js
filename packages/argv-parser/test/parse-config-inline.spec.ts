import { parseArgv } from '@simple-git/argv-parser';
import { describe, expect, it } from 'vitest';

import { aWriteConfig } from './__fixtures__/mocks';

describe('inline config overrides', () => {
   it('detects global config in the config task', () => {
      const parsed = parseArgv('config', '-c', 'protocol.allow=always', '--list');
      expect(parsed.config).toEqual({
         read: [],
         write: [aWriteConfig('protocol.allow', 'inline', 'always')],
      });
   });

   it('-c key=value → scope "inline"', () => {
      expect(parseArgv('-c', 'core.sshCommand=CMD', 'fetch').config.write).toEqual([
         aWriteConfig('core.sshcommand', 'inline', 'CMD'),
      ]);
   });

   it('lower-cases the key', () => {
      expect(parseArgv('-c', 'Http.proxy=http://proxy:3128', 'push').config.write[0].key).toBe(
         'http.proxy'
      );
   });

   it('accumulates multiple -c flags', () => {
      const {
         config: { write: configWrites },
      } = parseArgv(
         '-c',
         'core.sshCommand=CMD1',
         '-c',
         'core.fsmonitor=false',
         'commit',
         '-m',
         'msg'
      );
      expect(configWrites).toEqual([
         aWriteConfig('core.sshcommand', 'inline', 'CMD1'),
         aWriteConfig('core.fsmonitor', 'inline', 'false'),
      ]);
   });

   it('command-level --config also produces scope "inline"', () => {
      const {
         config: { write: configWrites },
      } = parseArgv('clone', '--config', 'core.sshCommand=CMD', 'git@github.com:x/y.git');
      expect(configWrites).toContainEqual(aWriteConfig('core.sshcommand', 'inline', 'CMD'));
   });

   it('--config-env → scope "env", value is the env-var name', () => {
      const {
         config: { write: configWrites },
      } = parseArgv('--config-env=core.sshCommand=GIT_SSH_COMMAND', 'fetch');
      expect(configWrites).toEqual([aWriteConfig('core.sshcommand', 'env', 'GIT_SSH_COMMAND')]);
   });

   it('-uc cluster correctly identifies the -c value as an inline write', () => {
      const {
         config: { write: configWrites },
      } = parseArgv(
         'clone',
         '-uc',
         'git-upload-pack',
         'core.sshCommand=CMD',
         'git@github.com:x/y.git'
      );
      expect(configWrites).toContainEqual(aWriteConfig('core.sshcommand', 'inline', 'CMD'));
   });

   it('produces no writes for a plain command', () => {
      expect(parseArgv('push', '--force').config.read).toEqual([]);
   });
});
