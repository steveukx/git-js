import { promiseError } from '@kwsites/promise-result';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   like,
   newSimpleGit,
} from './__fixtures__';
import { SimpleGit } from '../../typings';
import { parseFetchResult } from '../../src/lib/parsers/parse-fetch';

describe('fetch', () => {
   let git: SimpleGit;
   let callback: jest.Mock;

   beforeEach(() => {
      git = newSimpleGit();
      callback = jest.fn();
   });

   it('runs escaped fetch', async () => {
      const branchPrefix = 'some-name';
      const ref = `'refs/heads/${branchPrefix}*:refs/remotes/origin/${branchPrefix}*'`;
      git.fetch(`origin`, ref, { '--depth': '2' }, callback);
      await closeWithSuccess();
      assertExecutedCommands('fetch', '--depth=2', 'origin', ref);
   });

   it('git generates a fetch summary', async () => {
      const queue = git.fetch('foo', 'bar', ['--depth=2']);
      await closeWithSuccess(`
         From https://github.com/steveukx/git-js
          * [new branch]       master     -> origin/master
          * [new tag]          0.11.0     -> 0.11.0
      `);

      assertExecutedCommands('fetch', '--depth=2', 'foo', 'bar');
      expect(await queue).toEqual(
         like({
            branches: [{ name: 'master', tracking: 'origin/master' }],
            remote: 'https://github.com/steveukx/git-js',
            tags: [{ name: '0.11.0', tracking: '0.11.0' }],
         })
      );
   });

   it('git fetch with remote and branch', async () => {
      git.fetch('r', 'b', callback);
      await closeWithSuccess();
      assertExecutedCommands('fetch', 'r', 'b');
   });

   it('git fetch with no options', async () => {
      git.fetch(callback);
      await closeWithSuccess();
      assertExecutedCommands('fetch');
   });

   it('git fetch with options', async () => {
      git.fetch({ '--all': null }, callback);
      await closeWithSuccess();
      assertExecutedCommands('fetch', '--all');
   });

   it('git fetch with array of options', async () => {
      git.fetch(['--all', '-v'], callback);
      await closeWithSuccess();
      assertExecutedCommands('fetch', '--all', '-v');
   });

   describe('failures', () => {
      it('disallows upload-pack as remote/branch', async () => {
         const error = await promiseError(git.fetch('origin', '--upload-pack=touch ./foo'));

         assertGitError(error, 'potential exploit argument blocked');
      });

      it('disallows upload-pack as varargs', async () => {
         const error = await promiseError(
            git.fetch('origin', 'main', {
               '--upload-pack': 'touch ./foo',
            })
         );

         assertGitError(error, 'potential exploit argument blocked');
      });

      it('disallows upload-pack as varargs', async () => {
         const error = await promiseError(
            git.fetch('origin', 'main', ['--upload-pack', 'touch ./foo'])
         );

         assertGitError(error, 'potential exploit argument blocked');
      });
   });

   describe('parser', () => {
      const REMOTE = '/tmp/x-remote';

      it('parses updates', () => {
         const result = parseFetchResult(
            `
From ${REMOTE}
   7d11f0c..3de1250  main       -> origin/main
 * [new branch]      c          -> origin/c
`,
            ''
         );

         expect(result).toEqual(
            like({
               remote: REMOTE,
               branches: [{ name: 'c', tracking: 'origin/c' }],
               tags: [],
               updated: [{ name: 'main', tracking: 'origin/main', from: '7d11f0c', to: '3de1250' }],
               deleted: [],
            })
         );
      });

      it('parses deletes', () => {
         const result = parseFetchResult(
            `
From ${REMOTE}
 - [deleted]         (none)     -> origin/c
`,
            ''
         );

         expect(result).toEqual(
            like({
               remote: REMOTE,
               branches: [],
               tags: [],
               updated: [],
               deleted: [{ tracking: 'origin/c' }],
            })
         );
      });
   });
});
