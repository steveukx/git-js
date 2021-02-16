import { createTestContext, newSimpleGit, SimpleGitTestContext } from '../__fixtures__';
import { SimpleGitOptions } from '../../src/lib/types';

describe('progress-monitor', () => {

   const upstream = 'https://github.com/steveukx/git-js.git';

   let context: SimpleGitTestContext;

   beforeEach(async () => context = await createTestContext());

   it('emits progress events', async () => {
      const progress = jest.fn();
      const opt: Partial<SimpleGitOptions> = {
         baseDir: context.root,
         progress,
      };

      await newSimpleGit(opt).clone(upstream);

      const count = progress.mock.calls.length;
      const last = progress.mock.calls[count - 1];

      expect(count).toBeGreaterThan(0);
      expect(last[0]).toEqual({
         method: 'clone',
         progress: 100,
         received: last[0].total,
         total: expect.any(Number),
      });

      progress.mock.calls.reduce((previous, [{progress, method}]) => {
         expect(method).toBe('clone');
         expect(progress).toBeGreaterThanOrEqual(previous);
         return progress;
      }, 0);

   });

})
