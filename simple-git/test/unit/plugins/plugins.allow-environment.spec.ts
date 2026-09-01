import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promiseError } from '@kwsites/promise-result';

import {
   assertGitError,
   assertNoExecutedTasks,
   closeWithSuccess,
   newSimpleGit,
} from '../__fixtures__';
import { mockChildProcessModule } from '../__mocks__/mock-child-process';
import { GitPluginError } from '../../../src/lib/api';

describe('envFilter', () => {
   const ambientKeys = ['GIT_EDITOR', 'GIT_SSH_COMMAND', 'EDITOR'] as const;
   const ambient: Partial<Record<string, string | undefined>> = {};

   beforeEach(() => {
      for (const key of ambientKeys) {
         ambient[key] = process.env[key];
         process.env[key] = `ambient-${key}`;
      }
   });

   afterEach(() => {
      for (const key of ambientKeys) {
         if (ambient[key] === undefined) {
            delete process.env[key];
         } else {
            process.env[key] = ambient[key];
         }
      }
   });

   async function spawnedEnv(git = newSimpleGit()) {
      const queue = git.raw('status');
      await closeWithSuccess();
      await queue;
      return mockChildProcessModule.$mostRecent().$env;
   }

   it('strips ambient guarded keys but keeps the rest of the environment', async () => {
      const env = await spawnedEnv();

      expect(env).not.toHaveProperty('GIT_EDITOR');
      expect(env).not.toHaveProperty('GIT_SSH_COMMAND');
      expect(env).not.toHaveProperty('EDITOR');
      expect(env.PATH).toBe(process.env.PATH);
   });

   it('keeps ambient guarded keys that are allow-listed', async () => {
      const env = await spawnedEnv(newSimpleGit({ allowEnvironment: ['GIT_EDITOR'] }));

      expect(env.GIT_EDITOR).toBe('ambient-GIT_EDITOR');
      expect(env).not.toHaveProperty('GIT_SSH_COMMAND');
   });

   it('rejects the task when .env() supplies a guarded key that is not allow-listed', async () => {
      // GIT_TERMINAL_PROMPT is guarded by the GIT_ prefix rule alone (it is
      // not an argv-parser vulnerability), so the env filter is what rejects
      const git = newSimpleGit();
      const queue = git.env({ GIT_TERMINAL_PROMPT: '0' }).raw('status');

      const error = await promiseError(queue);
      assertGitError(error, 'GIT_TERMINAL_PROMPT', GitPluginError);
      assertGitError(error, 'allowEnvironment');
      assertNoExecutedTasks();
   });

   it('rejects .env() keys that are argv-parser vulnerabilities through the inner defence', async () => {
      // the layered gates compose - GIT_SSH_COMMAND is caught by the
      // block-unsafe-operations step (the inner defence) before the env
      // filter is consulted
      const queue = newSimpleGit().env({ GIT_SSH_COMMAND: 'ssh -i key' }).raw('status');

      assertGitError(await promiseError(queue), 'allowUnsafeSshCommand', GitPluginError);
      assertNoExecutedTasks();
   });

   it('rejects for non-GIT_-prefixed guarded keys supplied via .env()', async () => {
      const queue = newSimpleGit().env('EDITOR', '').raw('status');

      assertGitError(await promiseError(queue), 'EDITOR', GitPluginError);
      assertNoExecutedTasks();
   });

   it('allows .env() guarded keys when allow-listed', async () => {
      // GIT_EDITOR is also an argv-parser vulnerability, so using it needs
      // both the env-filter allow-list and the matching unsafe flag
      const env = await spawnedEnv(
         newSimpleGit({
            allowEnvironment: ['GIT_EDITOR'],
            unsafe: { allowUnsafeEditor: true },
         }).env({ GIT_EDITOR: 'vim' })
      );

      expect(env.GIT_EDITOR).toBe('vim');
   });

   it('allows .env() keys that are not guarded', async () => {
      const env = await spawnedEnv(newSimpleGit().env({ NOT_GUARDED: 'ok' }));

      expect(env.NOT_GUARDED).toBe('ok');
   });

   it('filters per task at spawn time - a blocked key fails the task, not the .env() call', async () => {
      const git = newSimpleGit();

      expect(() => git.env({ GIT_TERMINAL_PROMPT: '0' })).not.toThrow();

      assertGitError(await promiseError(git.raw('a')), 'GIT_TERMINAL_PROMPT', GitPluginError);

      const recovered = git.env({}).raw('b');
      await closeWithSuccess('ok');
      expect(await recovered).toBe('ok');
   });
});
