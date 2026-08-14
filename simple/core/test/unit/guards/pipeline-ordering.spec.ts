import { promiseError } from '@kwsites/promise-result';

import { GitPluginError } from '../../../src/errors';
import { createTaskPipeline } from '../../../src/factory';
import { matchesConfigKey } from '../../../src/guards/match-config-key';
import { createInstanceConfig } from '../../../src/options';
import { assertGitError, newSimpleGit } from '../../__fixtures__';

describe('pipeline ordering', () => {
   it('runs the config-write guard after command-config prefixing', () => {
      const names = createTaskPipeline(
         createInstanceConfig({
            config: ['a=b'],
            abort: new AbortController().signal,
            progress() {},
            timeout: { block: 1 },
            spawnOptions: { uid: 1 },
            errors: (error) => error,
         })
      ).stepNames();

      expect(names.indexOf('commandConfigPrefixing')).toBeGreaterThanOrEqual(0);
      expect(names.indexOf('commandConfigPrefixing')).toBeLessThan(
         names.indexOf('configWriteGuard')
      );
      expect(names.indexOf('configWriteGuard')).toBe(names.length - 1);

      expect(names).toEqual([
         'commandConfigPrefixing',
         'blockUnsafeOperations',
         'completionDetection',
         'abort',
         'progressMonitor',
         'timeout',
         'spawnOptions',
         'envFilter',
         'suffixPaths',
         'errorDetection',
         'errorDetectionUser',
         'configWriteGuard',
      ]);
   });

   it('guards are always registered even with default options', () => {
      const names = createTaskPipeline(createInstanceConfig()).stepNames();

      expect(names).toContain('envFilter');
      expect(names).toContain('configWriteGuard');
   });

   it('a construction-time config write is caught by the guard seeing the final argv', async () => {
      assertGitError(
         await promiseError(newSimpleGit({ config: ['user.name=evil'] }).raw('status')),
         'user.name',
         GitPluginError
      );
   });
});

describe('matchesConfigKey', () => {
   it.each<[string, string, boolean]>([
      ['user.name', 'user.name', true],
      ['user.name', 'USER.name', true],
      ['user.name', 'user.email', false],
      ['remote.*.url', 'remote.origin.url', true],
      ['remote.*.url', 'remote.up-stream.url', true],
      ['remote.*.url', 'remote.url', false],
      ['remote.*.url', 'remote.a.b.url', false],
      ['*', 'user', true],
      ['*', 'user.name', false],
      ['*.*', 'user.name', true],
   ])('pattern %s against %s -> %s', (pattern, key, expected) => {
      expect(matchesConfigKey(pattern, key)).toBe(expected);
   });
});
