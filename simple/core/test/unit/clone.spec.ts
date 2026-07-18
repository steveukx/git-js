import { promiseError } from '@kwsites/promise-result';
import { pathspec } from '@simple-git/args-pathspec';

import type { SimpleGitCore, TaskOptions } from '../../index';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
} from '../__fixtures__';

describe('clone', () => {
   let git: SimpleGitCore;

   const cloneTests: [keyof SimpleGitCore, string, Array<string | TaskOptions>, string[]][] = [
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
      [
         'clone',
         'kitchen sink',
         [
            'https://abcdefghijklmnopqrstuvwxyz01234567890.repo',
            'dir',
            [
               '-l',
               '-s',
               '--no-hardlinks',
               '-q',
               '-n',
               '--bare',
               '--mirror',
               '-o',
               'alternative-origin',
               '-b',
               'specific-branch',
               '--separate-git-dir',
               'other-path',
               '--depth',
               '1',
               '--no-single-branch',
               '--no-tags',
               '--recurse-submodules=foo',
               '--no-shallow-submodules',
               '--no-remote-submodules',
               '--jobs',
               '2',
               '--sparse',
               '--no-reject-shallow',
               '--filter=sub-path',
               '--also-filter-submodules',
            ],
         ],

         [
            'clone',
            '-l',
            '-s',
            '--no-hardlinks',
            '-q',
            '-n',
            '--bare',
            '--mirror',
            '-o',
            'alternative-origin',
            '-b',
            'specific-branch',
            '--separate-git-dir',
            'other-path',
            '--depth',
            '1',
            '--no-single-branch',
            '--no-tags',
            '--recurse-submodules=foo',
            '--no-shallow-submodules',
            '--no-remote-submodules',
            '--jobs',
            '2',
            '--sparse',
            '--no-reject-shallow',
            '--filter=sub-path',
            '--also-filter-submodules',
            '--',
            'https://abcdefghijklmnopqrstuvwxyz01234567890.repo',
            'dir',
         ],
      ],

      [
         'clone',
         'when there is a pathspec in the config',
         ['repo', ['--config=blah', '--', 'explicit-path']],
         ['clone', '--config=blah', '--', 'explicit-path', 'repo'],
      ],
      [
         'clone',
         'when using single pathspec',
         [pathspec('repo'), ['--config=blah', '--', 'explicit-path']],
         ['clone', '--config=blah', '--', 'explicit-path', 'repo'],
      ],
      [
         'clone',
         'when using one pathspec (repo)',
         [pathspec('repo'), 'local', ['--config=blah']],
         ['clone', '--config=blah', '--', 'repo', 'local'],
      ],
      [
         'clone',
         'when using one pathspec (local)',
         ['repo', pathspec('local'), ['--config=blah']],
         ['clone', '--config=blah', '--', 'repo', 'local'],
      ],
   ];

   // `git clone --config k=v` is a config write, deny-by-default in
   // @simple-git/core - opt in to the key these fixtures exercise (§2.7)
   beforeEach(() => (git = newSimpleGit({ allowConfigWrite: ['http.extraheader'] })));

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
