import { promiseError } from '@kwsites/promise-result';
import {
   assertGitError,
   createTestContext,
   newSimpleGit,
   type SimpleGitTestContext,
   setUpInit,
} from '@simple-git/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

/**
 * Runs the "Environment-based configuration" examples from docs/PLUGIN-UNSAFE-ACTIONS.md
 */
describe('environment-based configuration (GIT_CONFIG_COUNT)', () => {
   const allowEnvironment = ['GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0', 'GIT_CONFIG_VALUE_0'];
   const configEnv = (key: string, value: string) => ({
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: key,
      GIT_CONFIG_VALUE_0: value,
   });

   let context: SimpleGitTestContext;

   beforeEach(async () => {
      context = await createTestContext();
      await setUpInit(context);
   });

   it('blocks the variables when they are not named in allowEnvironment', async () => {
      const err = await promiseError(
         newSimpleGit(context.root)
            .env(configEnv('user.email', 'ci-bot@example.com'))
            .commit('CI build commit', { '--allow-empty': null })
      );

      assertGitError(err, 'allowEnvironment');
      expect(await promiseError(context.git.raw('rev-parse', 'HEAD'))).toBeDefined();
   });

   it('applies a safe key when the variables are named in allowEnvironment', async () => {
      await newSimpleGit(context.root, { allowEnvironment })
         .env(configEnv('user.email', 'ci-bot@example.com'))
         .commit('CI build commit', { '--allow-empty': null });

      expect(await context.git.raw('log', '-1', '--format=%ae')).toBe('ci-bot@example.com\n');
   });

   it('blocks an unsafe key that is not named in allowConfig', async () => {
      const err = await promiseError(
         newSimpleGit(context.root, { allowEnvironment })
            .env(configEnv('core.hooksPath', './.githooks'))
            .commit('message', { '--allow-empty': null })
      );

      assertGitError(err, 'allowConfig');
   });

   it('applies an unsafe key when it is also named in allowConfig', async () => {
      const value = await newSimpleGit(context.root, {
         allowEnvironment,
         allowConfig: ['core.hooksPath'],
      })
         .env(configEnv('core.hooksPath', './.githooks'))
         .raw('config', '--get', 'core.hooksPath');

      expect(value).toBe('./.githooks\n');
   });
});
