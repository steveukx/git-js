import {
   $logMessagesFor,
   $logNames,
   closeWithError,
   closeWithSuccess,
   newSimpleGit,
} from './__fixtures__';
import { TasksPendingQueue } from '../../src/lib/runners/tasks-pending-queue';

import debug from 'debug';

describe('logging', () => {
   afterEach(() => ((TasksPendingQueue as any).counter = 0));

   it('creates a new debug logger for each simpleGit instance', async () => {
      (debug as any).mockClear();
      newSimpleGit();
      const logsCreated = (debug as any).mock.calls.length;
      expect(logsCreated).toBeGreaterThanOrEqual(1);

      (debug as any).mockClear();
      newSimpleGit();
      expect(debug).toHaveBeenCalledTimes(logsCreated);
   });

   it('logs task errors to main log as well as the detailed log', async () => {
      newSimpleGit().init();
      await closeWithError('Something bad');

      expect($logNames(/^simple-git$/, /^simple-git:task:*/)).toEqual([
         'simple-git',
         'simple-git:task:init:1',
      ]);
   });

   it('logs task detail by wild-card', async () => {
      newSimpleGit().init().clean('f');
      await closeWithSuccess();
      await closeWithSuccess('Removing foo/');

      expect($logNames(/simple-git:task:/)).toEqual([
         'simple-git:task:init:1',
         'simple-git:task:clean:2',
      ]);
   });

   it('logs task detail by type', async () => {
      newSimpleGit().init().clean('f');
      await closeWithSuccess();
      await closeWithSuccess('Removing foo/');

      expect($logNames(/task:clean/)).toEqual(['simple-git:task:clean:2']);
   });

   it('logs task response by wild-card', async () => {
      newSimpleGit().init().clean('f');
      await closeWithSuccess('Initialised');
      await closeWithSuccess('Removing foo/');

      expect($logNames(/output/)).toHaveLength(2);
      expect($logMessagesFor('simple-git:output:init:1')).toMatch('Initialised');
      expect($logMessagesFor('simple-git:output:clean:2')).toMatch('Removing foo/');
   });

   it('logs task response by type', async () => {
      newSimpleGit().init().clean('f');
      await closeWithSuccess();
      await closeWithSuccess('Removing foo/');

      expect($logNames(/output:clean/)).toHaveLength(1);
      expect($logMessagesFor('simple-git:output:clean:2')).toMatch('Removing foo/');
   });
});
