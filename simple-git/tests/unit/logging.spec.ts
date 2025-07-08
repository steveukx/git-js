import { afterEach, describe, expect, it } from 'vitest';
import {
   $countLogsCreated,
   $logNames,
   $logReset,
   closeWithError,
   closeWithSuccess,
   newSimpleGit,
} from './__fixtures__';
import { TasksPendingQueue } from '../../src/lib/runners/tasks-pending-queue';

describe('logging', () => {
   afterEach(() => ((TasksPendingQueue as any).counter = 0));

   it('creates a new debug logger for each simpleGit instance', async () => {
      await $logReset();
      newSimpleGit();
      expect(await $countLogsCreated()).toBeGreaterThanOrEqual(1);

      await $logReset();
      newSimpleGit();
      expect(await $countLogsCreated()).toBeGreaterThanOrEqual(1);
   });

   it('logs task errors to main log as well as the detailed log', async () => {
      newSimpleGit().init();
      await closeWithError('$ SOMETHING_BAD $');

      expect(await $logNames(/(SOMETHING_BAD)/)).toEqual(['simple-git', 'simple-git:task:init:1']);
   });

   it('logs task detail by wild-card', async () => {
      newSimpleGit().init().clean('f');
      await closeWithSuccess('INIT_RESPONSE');
      await closeWithSuccess('Removing foo/');

      expect(await $logNames('INIT_RESPONSE')).toEqual([
         'simple-git:task:init:1',
         'simple-git:output:init:1',
      ]);

      expect(await $logNames('Removing foo')).toEqual([
         'simple-git:task:clean:2',
         'simple-git:output:clean:2',
      ]);
   });
});
