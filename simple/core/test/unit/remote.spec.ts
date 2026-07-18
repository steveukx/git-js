import type { SimpleGitCore } from '../../index';
import { getRemotesTask } from '../../src/tasks/remote';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';

describe('remotes', () => {
   let git: SimpleGitCore;

   beforeEach(() => {
      git = newSimpleGit();
   });

   async function assertResolved<T>(expected: T, task: Promise<T>) {
      const actual = await task;
      expect(actual).toEqual(expected);
   }

   describe('parsing getRemotes', () => {
      it('parses verbose response with separate fetch and push', () => {
         const actual = getRemotesTask(true).parser(
            `
            origin    s://anonymous.com/repo.git (fetch)
            origin    s://u@d.com/u/repo.git (push)
        `,
            ''
         );

         expect(actual).toEqual([
            {
               name: 'origin',
               refs: { fetch: 's://anonymous.com/repo.git', push: 's://u@d.com/u/repo.git' },
            },
         ]);
      });

      it('parses empty non-verbose', () => {
         const task = getRemotesTask(false);
         expect(
            task.parser(
               `
         `,
               ''
            )
         ).toEqual([]);
      });

      it('parses non-verbose', () => {
         const task = getRemotesTask(false);
         expect(
            task.parser(
               `
           origin
           upstream
         `,
               ''
            )
         ).toEqual([{ name: 'origin' }, { name: 'upstream' }]);
      });

      it('parses empty verbose', () => {
         const task = getRemotesTask(true);
         expect(
            task.parser(
               `
         `,
               ''
            )
         ).toEqual([]);
      });

      it('parses verbose', () => {
         const task = getRemotesTask(true);
         expect(
            task.parser(
               `
            origin    s://u@d.com/u/repo.git (fetch)
            origin    s://u@d.com/u/repo.git (push)
            upstream  s://u@d.com/another/repo.git (fetch)
            upstream  s://u@d.com/another/repo.git (push)
         `,
               ''
            )
         ).toEqual([
            {
               name: 'origin',
               refs: { fetch: 's://u@d.com/u/repo.git', push: 's://u@d.com/u/repo.git' },
            },
            {
               name: 'upstream',
               refs: {
                  fetch: 's://u@d.com/another/repo.git',
                  push: 's://u@d.com/another/repo.git',
               },
            },
         ]);
      });
   });

   describe('getRemotes', () => {
      it('list remotes no options', async () => {
         git.getRemotes();
         await closeWithSuccess();

         assertExecutedCommands('remote');
      });

      it('verbose list remotes no options', async () => {
         git.getRemotes(true);
         await closeWithSuccess();

         assertExecutedCommands('remote', '-v');
      });

      it('non-verbose list remotes no options', async () => {
         git.getRemotes(false);
         await closeWithSuccess();
         assertExecutedCommands('remote');
      });

      it('non-verbose list remotes no options', async () => {
         git.getRemotes(false);
         await closeWithSuccess();
         assertExecutedCommands('remote');
      });
   });

   describe('addRemote', () => {
      it('adds by name and repo', async () => {
         const task = git.addRemote('repo-name', 'remote-repo');
         await closeWithSuccess('done');

         assertExecutedCommands('remote', 'add', 'repo-name', 'remote-repo');
         await assertResolved('done', task);
      });

      it('adds by name and repo with options object', async () => {
         git.addRemote('repo-name', 'remote-repo', { '-f': null });
         await closeWithSuccess();
         assertExecutedCommands('remote', 'add', '-f', 'repo-name', 'remote-repo');
      });

      it('adds by name and repo with options array', async () => {
         git.addRemote('repo-name', 'remote-repo', ['-f']);
         await closeWithSuccess();
         assertExecutedCommands('remote', 'add', '-f', 'repo-name', 'remote-repo');
      });
   });
});
