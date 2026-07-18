import type { Mock } from 'vitest';
import { closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('outputHandler', () => {
   let handler: Mock;

   beforeEach(() => {
      handler = vi.fn();
   });

   it('passes name of command to the output handler', async () => {
      const queue = newSimpleGit({
         outputHandler: handler,
      }).init();

      await closeWithSuccess();
      await queue;

      expect(handler).toHaveBeenCalledWith('git', expect.any(Object), expect.any(Object), ['init']);
   });

   it('passes name of command to the output handler - custom binary', async () => {
      const queue = newSimpleGit({
         outputHandler: handler,
      })
         .customBinary('something')
         .init();

      await closeWithSuccess();
      await queue;

      expect(handler).toHaveBeenCalledWith('something', expect.any(Object), expect.any(Object), [
         'init',
      ]);
   });
});
