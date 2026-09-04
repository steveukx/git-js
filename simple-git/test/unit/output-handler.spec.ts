import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { SimpleGit } from '../../src/typings';
import { closeWithSuccess, newSimpleGit } from './__fixtures__';

describe('outputHandler', () => {
   let git: SimpleGit;
   let callback: Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = vi.fn();
   });

   it('passes name of command to callback', async () => {
      const queue = git.outputHandler(callback).init();

      closeWithSuccess();
      await queue;

      expect(callback).toHaveBeenCalledWith('git', expect.any(Object), expect.any(Object), [
         'init',
      ]);
   });

   it('passes name of command to callback - custom binary', async () => {
      const queue = git.outputHandler(callback).customBinary('something').init();

      closeWithSuccess();
      await queue;

      expect(callback).toHaveBeenCalledWith('something', expect.any(Object), expect.any(Object), [
         'init',
      ]);
   });
});
