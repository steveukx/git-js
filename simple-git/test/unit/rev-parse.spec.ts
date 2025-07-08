import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import type { SimpleGit } from '../..';

describe('revParse', () => {
   let git: SimpleGit;
   let callback: Mock;

   beforeEach(() => {
      callback = vi.fn();
   });

   describe('simple-git', () => {
      beforeEach(() => (git = newSimpleGit()));

      it('called with a string', async () => {
         git.revparse('some string');
         await closeWithSuccess();
         assertExecutedCommands('rev-parse', 'some string');
      });

      it('called with an array of strings', async () => {
         git.revparse(['another', 'string']);
         await closeWithSuccess();
         assertExecutedCommands('rev-parse', 'another', 'string');
      });

      it('called with all arguments', async () => {
         const queue = git.revparse('foo', { bar: null }, callback);
         await closeWithSuccess(' some data ');
         expect(await queue).toBe('some data');
         expect(callback).toHaveBeenCalledWith(null, 'some data');
         assertExecutedCommands('rev-parse', 'foo', 'bar');
      });
   });
});
