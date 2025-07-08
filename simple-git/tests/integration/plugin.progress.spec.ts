import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { createTestContext, newSimpleGit, SimpleGitTestContext } from '@simple-git/test-utils';
import type { SimpleGitOptions } from '../..';

describe('progress-monitor', () => {
   const upstream = 'https://github.com/steveukx/git-js.git';

   let context: SimpleGitTestContext;

   beforeEach(async () => (context = await createTestContext()));

   it('emits progress events', async () => {
      const progress = vi.fn();
      const opt: Partial<SimpleGitOptions> = {
         baseDir: context.root,
         progress,
      };

      await newSimpleGit(opt).clone(upstream);

      const receivingUpdates = progressEventsAtStage(progress, 'receiving');

      expect(receivingUpdates.length).toBeGreaterThan(0);

      receivingUpdates.reduce((previous, update) => {
         expect(update).toEqual({
            method: 'clone',
            stage: 'receiving',
            progress: expect.any(Number),
            processed: expect.any(Number),
            total: expect.any(Number),
         });

         expect(update.progress).toBeGreaterThanOrEqual(previous);
         return update.progress;
      }, 0);
   });
});

function progressEventsAtStage(mock: Mock, stage: string) {
   return mock.mock.calls.filter((c) => c[0].stage === stage).map((c) => c[0]);
}
