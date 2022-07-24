import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';
import { SimpleGit } from '../../typings';
import { getRemotesTask } from '../../src/lib/tasks/remote';

describe('remotes', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   async function assertResolved<T>(expected: T, task: Promise<T>, cb?: jest.Mock) {
      const actual = await task;
      expect(actual).toEqual(expected);
      if (cb) {
         expect(cb).toHaveBeenCalledWith(null, actual);
      }
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
         const task = git.getRemotes(callback);
         closeWithSuccess();

         expect(callback).toHaveBeenCalledWith(null, await task);
         assertExecutedCommands('remote');
      });

      it('verbose list remotes no options', async () => {
         const task = git.getRemotes(true, callback);
         closeWithSuccess();

         expect(callback).toHaveBeenCalledWith(null, await task);
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

      it('no options no callback', async () => {
         const result = git.getRemotes();
         await closeWithSuccess();
         expect(await result).toEqual([]);
         assertExecutedCommands('remote');
      });
   });

   describe('addRemote', () => {
      it('adds by name and repo', async () => {
         const task = git.addRemote('repo-name', 'remote-repo', callback);
         await closeWithSuccess('done');

         assertExecutedCommands('remote', 'add', 'repo-name', 'remote-repo');
         await assertResolved('done', task, callback);
      });

      it('adds by name and repo with options object', async () => {
         git.addRemote('repo-name', 'remote-repo', { '-f': null }, callback);
         await closeWithSuccess();
         assertExecutedCommands('remote', 'add', '-f', 'repo-name', 'remote-repo');
      });

      it('adds by name and repo with options array', async () => {
         git.addRemote('repo-name', 'remote-repo', ['-f'], callback);
         await closeWithSuccess();
         assertExecutedCommands('remote', 'add', '-f', 'repo-name', 'remote-repo');
      });
   });
});
