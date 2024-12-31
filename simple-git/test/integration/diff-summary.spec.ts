import { like, newSimpleGit } from '@simple-git/test-utils';

describe('diffSummary', () => {
   it('empty tree to first commit', async () => {
      const git = newSimpleGit();
      const emptyCommit = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
      const firstCommit = await git.firstCommit();

      const task = git.diffSummary([emptyCommit, firstCommit]);
      const result = await task;

      expect(result.changed).toBeGreaterThan(0);
      expect(result.changed).toBe(result.files.length);
      expect(result.insertions).toBeGreaterThan(0);
      expect(result.deletions).toBe(0);
      result.files.forEach((file) => {
         if (file.binary) {
            throw new Error(`Test assumes no binary files in first commit`);
         }

         expect(file.insertions).toBe(file.changes);
         expect(file).toEqual(
            like({
               changes: file.insertions,
               deletions: 0,
            })
         );
      });
   });
});
