import { promiseError } from '@kwsites/promise-result';
import { SimpleGit, TaskOptions } from 'typings';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
} from './__fixtures__';
import { pathspec } from '@simple-git/args-pathspec';

describe('clone', () => {
   let git: SimpleGit;

   const cloneTests: [keyof SimpleGit, string, Array<string | TaskOptions>, string[]][] = [
      ['clone', 'with repo and local', ['repo', 'lcl'], ['clone', '--', 'repo', 'lcl']],
      [
         'clone',
         'with just repo',
         ['proto://remote.com/repo.git'],
         ['clone', '--', 'proto://remote.com/repo.git'],
      ],
      [
         'clone',
         'with options array',
         ['repo', 'lcl', ['foo', 'bar']],
         ['clone', 'foo', 'bar', '--', 'repo', 'lcl'],
      ],
      [
         'clone',
         'with options object',
         ['url', '.', { '--config': 'http.extraheader=AUTHORIZATION bearer xxxx' }],
         ['clone', '--config=http.extraheader=AUTHORIZATION bearer xxxx', '--', 'url', '.'],
      ],
      [
         'clone',
         'with array of options without local',
         ['repo', ['--config=http.extraheader=AUTHORIZATION bearer xxxx']],
         ['clone', '--config=http.extraheader=AUTHORIZATION bearer xxxx', '--', 'repo'],
      ],
      ['mirror', 'explicitly set', ['r', 'l'], ['clone', '--mirror', '--', 'r', 'l']],
      ['clone', 'kitchen sink', ['https://abcdefghijklmnopqrstuvwxyz01234567890.repo', 'dir',
         ['--template=<template-directory>', '-l', '-s', '--no-hardlinks', '-q', '-n', '--bare', '--mirror',
         '-o', 'alternative-origin', '-b', 'specific-branch', '--separate-git-dir', 'other-path',
         '--depth', '1', '--no-single-branch', '--no-tags', '--recurse-submodules=foo',
         '--no-shallow-submodules', '--no-remote-submodules', '--jobs', '2', '--sparse',
         '--no-reject-shallow', '--filter=sub-path', '--also-filter-submodules']],

         ['clone', '--template=<template-directory>', '-l', '-s', '--no-hardlinks', '-q', '-n', '--bare', '--mirror',
         '-o', 'alternative-origin', '-b', 'specific-branch', '--separate-git-dir', 'other-path',
         '--depth', '1', '--no-single-branch', '--no-tags', '--recurse-submodules=foo',
         '--no-shallow-submodules', '--no-remote-submodules', '--jobs', '2', '--sparse',
         '--no-reject-shallow', '--filter=sub-path', '--also-filter-submodules', '--', 'https://abcdefghijklmnopqrstuvwxyz01234567890.repo', 'dir']],

      ['clone', 'when there is a pathspec in the config',
         ['repo', ['--config=blah', '--', 'explicit-path']],
         ['clone', '--config=blah', '--', 'explicit-path', 'repo']
      ],
      ['clone', 'when using single pathspec',
         [pathspec('repo'), ['--config=blah', '--', 'explicit-path']],
         ['clone', '--config=blah', '--', 'explicit-path', 'repo']
      ],
      ['clone', 'when using one pathspec (repo)',
         [pathspec('repo'), 'local', ['--config=blah']],
         ['clone', '--config=blah', '--', 'repo', 'local']
      ],
      ['clone', 'when using one pathspec (local)',
         ['repo', pathspec('local'), ['--config=blah']],
         ['clone', '--config=blah', '--', 'repo', 'local']
      ],

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
      it('disallows upload-pack as varargs', async () => {
         const error = await promiseError(
            git.clone('origin', 'main', {
               '--upload-pack': 'touch ./foo',
            })
         );

         assertGitError(error, 'allowUnsafePack');
      });

      it('disallows upload-pack as varargs', async () => {
         const error = await promiseError(
            git.clone('origin', 'main', ['--upload-pack', 'touch ./foo'])
         );

         assertGitError(error, 'allowUnsafePack');
      });
   });
});
