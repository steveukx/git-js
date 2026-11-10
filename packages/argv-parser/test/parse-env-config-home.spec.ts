import { describe, expect, it } from 'vitest';
import { isGitEnvKey, isGuardedEnvKey, parseEnv } from '..';

describe('parseEnv: global config location', () => {
   const inherited = { HOME: '/home/user', XDG_CONFIG_HOME: '/home/user/.config' };

   it.each([['HOME'], ['XDG_CONFIG_HOME'], ['home'], ['Xdg_Config_Home']])(
      'reports %s set to a different value than the inherited one',
      (key) => {
         expect(parseEnv({ [key]: '/attacker/controlled' }, inherited).vulnerabilities).toEqual([
            expect.objectContaining({
               category: 'allowUnsafeConfigPaths',
               envKey: key.toLowerCase(),
            }),
         ]);
      }
   );

   it.each([['HOME'], ['XDG_CONFIG_HOME']])('reports %s when nothing is inherited', (key) => {
      expect(parseEnv({ [key]: '/attacker/controlled' }).vulnerabilities).toEqual([
         expect.objectContaining({ category: 'allowUnsafeConfigPaths' }),
      ]);
   });

   it('permits passing the inherited environment through', () => {
      expect(parseEnv({ ...inherited, PATH: '/usr/bin' }, inherited).vulnerabilities).toEqual([]);
   });

   it('compares keys case-insensitively', () => {
      expect(parseEnv({ home: '/home/user' }, { HOME: '/home/user' }).vulnerabilities).toEqual([]);
   });

   it('is not a guarded key that would be removed from the inherited environment', () => {
      expect(isGitEnvKey('home')).toBe(false);
      expect(isGitEnvKey('xdg_config_home')).toBe(false);
      expect(isGuardedEnvKey('HOME')).toBe(false);
      expect(isGuardedEnvKey('XDG_CONFIG_HOME')).toBe(false);
   });

   it.each([['GIT_SSH_COMMAND'], ['Git_Anything'], ['EDITOR'], [' pager ']])(
      'treats %j as a guarded key',
      (key) => {
         expect(isGuardedEnvKey(key)).toBe(true);
      }
   );

   it.each([['PATH'], ['GITHUB_TOKEN'], ['TERM']])('does not treat %j as a guarded key', (key) => {
      expect(isGuardedEnvKey(key)).toBe(false);
   });
});
