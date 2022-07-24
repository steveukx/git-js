import { promiseError } from '@kwsites/promise-result';
import { SimpleGit, TaskOptions } from 'typings';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
} from './__fixtures__';

describe('clone', () => {
   let git: SimpleGit;

   const cloneTests: [keyof SimpleGit, string, Array<string | TaskOptions>, string[]][] = [
      ['clone', 'with repo and local', ['repo', 'lcl'], ['clone', 'repo', 'lcl']],
      [
         'clone',
         'with just repo',
         ['proto://remote.com/repo.git'],
         ['clone', 'proto://remote.com/repo.git'],
      ],
      [
         'clone',
         'with options array',
         ['repo', 'lcl', ['foo', 'bar']],
         ['clone', 'foo', 'bar', 'repo', 'lcl'],
      ],
      [
         'clone',
         'with options object',
         ['url', '.', { '--config': 'http.extraheader=AUTHORIZATION bearer xxxx' }],
         ['clone', '--config=http.extraheader=AUTHORIZATION bearer xxxx', 'url', '.'],
      ],
      [
         'clone',
         'with array of options without local',
         ['repo', ['--config=http.extraheader=AUTHORIZATION bearer xxxx']],
         ['clone', '--config=http.extraheader=AUTHORIZATION bearer xxxx', 'repo'],
      ],
      ['mirror', 'explicitly set', ['r', 'l'], ['clone', '--mirror', 'r', 'l']],
   ];

   beforeEach(() => (git = newSimpleGit()));

   it.each(cloneTests)('callbacks - %s %s', async (api, name, cloneArgs, executedCommands) => {
      const callback = jest.fn();
      const queue = (git[api] as any)(...cloneArgs, callback);
      await closeWithSuccess(name);

      expect(await queue).toBe(name);
      expect(callback).toHaveBeenCalledWith(null, name);
      assertExecutedCommands(...executedCommands);
   });

   it.each(cloneTests)(`promises - %s %s`, async (api, name, cloneArgs, executedCommands) => {
      const queue = (git[api] as any)(...cloneArgs);
      await closeWithSuccess(name);

      expect(await queue).toBe(name);
      assertExecutedCommands(...executedCommands);
   });

   describe('failures', () => {
      it('disallows upload-pack as remote/branch', async () => {
         const error = await promiseError(git.clone('origin', '--upload-pack=touch ./foo'));

         assertGitError(error, 'potential exploit argument blocked');
      });

      it('disallows upload-pack as varargs', async () => {
         const error = await promiseError(
            git.clone('origin', 'main', {
               '--upload-pack': 'touch ./foo',
            })
         );

         assertGitError(error, 'potential exploit argument blocked');
      });

      it('disallows upload-pack as varargs', async () => {
         const error = await promiseError(
            git.clone('origin', 'main', ['--upload-pack', 'touch ./foo'])
         );

         assertGitError(error, 'potential exploit argument blocked');
      });
   });
});
