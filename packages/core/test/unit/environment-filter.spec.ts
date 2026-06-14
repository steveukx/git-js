import { environmentFilterPlugin, GitPluginError } from '@simple-git/core';
import { describe, expect, it } from 'vitest';

const base = { cwd: '/repo', windowsHide: true } as const;

function filter(allow: readonly string[]) {
   return environmentFilterPlugin(allow);
}

describe('environmentFilterPlugin', () => {
   it('strips guarded ambient vars but keeps allow-listed and unguarded ones', () => {
      const result = filter(['GIT_SSH_COMMAND']).action(
         { ...base, env: { PATH: '/usr/bin', GIT_EDITOR: 'vi', GIT_SSH_COMMAND: 'ssh' } },
         { method: '', commands: [] }
      );
      expect(result.env).toEqual({ PATH: '/usr/bin', GIT_SSH_COMMAND: 'ssh' });
   });

   it('rejects a guarded var supplied via .env() that is not allow-listed', () => {
      expect(() =>
         filter([]).action(
            { ...base, env: {} },
            { method: '', commands: [], env: { EDITOR: 'vi' } }
         )
      ).toThrow(GitPluginError);
   });

   it('permits a guarded var supplied via .env() once allow-listed', () => {
      expect(() =>
         filter(['GIT_SSH_COMMAND']).action(
            { ...base, env: {} },
            { method: '', commands: [], env: { GIT_SSH_COMMAND: 'ssh' } }
         )
      ).not.toThrow();
   });

   it('does not guard ordinary supplied vars such as PATH', () => {
      expect(() =>
         filter([]).action(
            { ...base, env: {} },
            { method: '', commands: [], env: { PATH: '/usr/bin' } }
         )
      ).not.toThrow();
   });
});
