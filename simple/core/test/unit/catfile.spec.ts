import { promiseError } from '@kwsites/promise-result';

import type { SimpleGitCore } from '../../index';
import {
   assertExecutedCommands,
   assertGitError,
   assertNoExecutedTasks,
   assertTheBuffer,
   closeWithSuccess,
   newSimpleGit,
} from '../__fixtures__';

describe('catFile', () => {
   let git: SimpleGitCore;
   const stdOut = `
         100644 blob bb8fa279535700c922d3f1ffce064cb5d40f793d    .gitignore
         100644 blob 38e7c92830db7dc85d7911d53f7478d9311f4c81    .npmignore
         100644 blob a7eb4e85cdb50cc270ddf4511e72304c264b0baf    package.json
         100644 blob e9028d5b1f9bd80c7f1b6bacba47cb79b637164a    readme.md
         040000 tree b0a0e1d44895fa659bd62e7d94187adbdf5ba541    src
   `;

   beforeEach(() => (git = newSimpleGit()));

   it('refuses to process a string argument', async () => {
      const error = await promiseError(git.catFile('foo' as any));

      assertGitError(error, 'Git.catFile: options must be supplied as an array of strings');
      assertNoExecutedTasks();
   });

   it('displays tree for initial commit hash', async () => {
      const queue = git.catFile(['-p', '366e4409']);
      await closeWithSuccess(stdOut);

      assertExecutedCommands('cat-file', '-p', '366e4409');
      expect(await queue).toEqual(stdOut);
   });

   it('displays valid usage when no arguments passed', async () => {
      const message = 'Please pass in a valid (tree/commit/object) hash';
      const queue = git.catFile();

      await closeWithSuccess(message);
      expect(await queue).toBe(message);
      assertExecutedCommands('cat-file');
   });

   it('optionally returns a buffer of raw data', async () => {
      const queue = git.binaryCatFile(['-p', 'HEAD:some-image.gif']);
      await closeWithSuccess('foo');

      assertTheBuffer(await queue, 'foo');
      assertExecutedCommands('cat-file', '-p', 'HEAD:some-image.gif');
   });
});
