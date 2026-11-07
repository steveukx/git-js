import { promiseError } from '@kwsites/promise-result';
import { pathspec, refName, remoteUrl, TaskConfigurationError } from '../..';
import { describe, expect, it } from 'vitest';

import {
   assertExecutedCommands,
   assertGitError,
   assertNoExecutedTasks,
   closeWithSuccess,
   newSimpleGit,
} from './__fixtures__';

async function expectArgs(task: Promise<unknown>, ...args: string[]) {
   await closeWithSuccess();
   expect(await promiseError(task)).toBeUndefined();
   assertExecutedCommands(...args);
}

async function expectRejected(task: Promise<unknown>, message: string) {
   assertGitError(await promiseError(task), message, TaskConfigurationError);
   assertNoExecutedTasks();
}

describe('git.cmd', () => {
   describe('argument building', () => {
      it('splits literal text on whitespace', async () => {
         await expectArgs(
            newSimpleGit().cmd`log   --oneline\n -n 5`,
            'log',
            '--oneline',
            '-n',
            '5'
         );
      });

      it('passes each value as exactly one argument', async () => {
         const message = 'fix: the thing; rm -rf / && echo "pwned"';
         await expectArgs(
            newSimpleGit().cmd`commit --message=${message}`,
            'commit',
            `--message=${message}`
         );
         await expectArgs(newSimpleGit().cmd`commit -m ${message}`, 'commit', '-m', message);
      });

      it('joins values to adjacent literal text', async () => {
         const remote = 'origin';
         const branch = 'feature/x';
         await expectArgs(
            newSimpleGit().cmd`push ${remote} HEAD:refs/heads/${branch}`,
            'push',
            'origin',
            'HEAD:refs/heads/feature/x'
         );
         await expectArgs(newSimpleGit().cmd`log ${'a'}..${'b'}`, 'log', 'a..b');
      });

      it('expands arrays to one argument per item', async () => {
         const files = ['a.txt', 'b c.txt', '-dash.txt'];
         await expectArgs(newSimpleGit().cmd`add -- ${files}`, 'add', '--', ...files);
      });

      it('stringifies numbers', async () => {
         await expectArgs(newSimpleGit().cmd`log -n ${5}`, 'log', '-n', '5');
      });

      it('moves pathspecs after --', async () => {
         await expectArgs(
            newSimpleGit().cmd`log ${pathspec('-weird.txt')} --oneline`,
            'log',
            '--oneline',
            '--',
            '-weird.txt'
         );
      });

      it('permits values in global config options when the key is literal', async () => {
         const name = 'Some One';
         await expectArgs(
            newSimpleGit().cmd`-c user.name=${name} commit --allow-empty -m msg`,
            '-c',
            'user.name=Some One',
            'commit',
            '--allow-empty',
            '-m',
            'msg'
         );
      });
   });

   describe('untrusted values', () => {
      it('rejects option injection read from a JSON payload', async () => {
         const { branch } = JSON.parse(`{ "branch": "-c core.sshCommand='touch /tmp/pwned'" }`);

         await expectRejected(newSimpleGit().cmd`checkout ${branch}`, 'would be read as an option');
      });

      it.each([['--upload-pack=touch /tmp/pwned'], ['-u'], ['-vu']])(
         'rejects %s as a standalone value',
         async (value) => {
            await expectRejected(
               newSimpleGit().cmd`clone ${value} /tmp/dir`,
               'would be read as an option'
            );
         }
      );

      it('rejects values that start an argument before literal text', async () => {
         await expectRejected(
            newSimpleGit().cmd`log ${'--output'}=/tmp/x`,
            'would be read as an option'
         );
      });

      it('rejects values in an option name', async () => {
         await expectRejected(newSimpleGit().cmd`log --${'output'}=x`, 'must follow "="');
         await expectRejected(newSimpleGit().cmd`clone -${'u'} x y`, 'must follow "="');
         await expectRejected(newSimpleGit().cmd`log -n${5}`, 'must follow "="');
      });

      it('permits values starting with - after a literal --', async () => {
         await expectArgs(
            newSimpleGit().cmd`checkout -- ${'-file.txt'}`,
            'checkout',
            '--',
            '-file.txt'
         );
      });

      it('rejects values selecting the sub-command', async () => {
         await expectRejected(
            newSimpleGit().cmd`${'daemon'} --export-all`,
            'must be written literally'
         );
         await expectRejected(newSimpleGit().cmd`-C ${'/tmp'} status`, 'must be written literally');
      });

      it.each([
         ['-c', ['-c']],
         ['--config', ['--config']],
      ])('rejects configuration keys from values after %s', async (_name, [flag]) => {
         const setting = 'core.sshCommand=touch /tmp/pwned';
         const strings = Object.freeze(
            Object.assign([`clone ${flag} `, ' x y'], { raw: [`clone ${flag} `, ' x y'] })
         );
         await expectRejected(
            newSimpleGit().cmd(strings as unknown as TemplateStringsArray, setting),
            'configuration keys must be written literally'
         );
         await expectRejected(
            newSimpleGit().cmd`-c ${'core.sshCommand'}=evil status`,
            'configuration keys must be written literally'
         );
         await expectRejected(
            newSimpleGit().cmd`--config=${setting} status`,
            'configuration keys must be written literally'
         );
      });

      it.each([['ext::sh -c touch% /tmp/pwned'], ['fd::0'], ['EXT::x']])(
         'rejects remote helper transport %s anywhere',
         async (url) => {
            await expectRejected(
               newSimpleGit().cmd`clone -- ${url} /tmp/dir`,
               'remote helper transport'
            );
         }
      );

      it('rejects control characters', async () => {
         await expectRejected(newSimpleGit().cmd`log ${'a\nb'}`, 'control characters');
      });

      it.each([[undefined], [null], [{}], [true], [Number.NaN]])(
         'rejects non-string value %s',
         async (value) => {
            await expectRejected(
               newSimpleGit().cmd`log ${value as unknown as string}`,
               'must be strings'
            );
         }
      );

      it('must be called as a tagged template', async () => {
         const args = JSON.parse('["clone", "--upload-pack=touch /tmp/pwned", "x"]');

         await expectRejected(newSimpleGit().cmd(args), 'tagged template literal');
      });

      it('still runs the unsafe-operation checks on literal text', async () => {
         const err = await promiseError(
            newSimpleGit().cmd`-c core.sshCommand=${'ssh -i key'} fetch`
         );

         assertGitError(err, 'allowUnsafeSshCommand');
      });
   });

   describe('remoteUrl', () => {
      it.each([
         ['https://github.com/steveukx/git-js.git'],
         ['ssh://git@github.com/steveukx/git-js.git'],
         ['git@github.com:steveukx/git-js.git'],
         ['git://example.com/repo.git'],
         ['file:///srv/repo.git'],
         ['/srv/repo.git'],
         ['../relative/repo'],
      ])('accepts %s', async (url) => {
         await expectArgs(newSimpleGit().cmd`clone ${remoteUrl(url)}`, 'clone', url);
      });

      it.each([
         ['ext::sh -c touch% /tmp/pwned', 'remote helper transport'],
         ['--upload-pack=touch /tmp/pwned', 'would be read as an option'],
         ['ssh://-oProxyCommand=touch%20pwned/repo', 'must not start with "-"'],
         ['-oProxyCommand=touch:repo', 'must not start with "-"'],
         ['git@-oProxyCommand=touch:repo', 'must not start with "-"'],
         ['javascript://alert(1)', 'protocol "javascript" is not permitted'],
         ['ftp://example.com/repo', 'protocol "ftp" is not permitted'],
      ])('rejects %s', async (url, message) => {
         await expectRejected(newSimpleGit().cmd`clone ${remoteUrl(url)}`, message);
      });

      it('restricts protocols when configured', async () => {
         await expectArgs(
            newSimpleGit()
               .cmd`ls-remote ${remoteUrl('https://example.com/repo', { protocols: ['https'] })}`,
            'ls-remote',
            'https://example.com/repo'
         );
      });

      it.each([
         ['ssh://example.com/repo', 'protocol "ssh" is not permitted'],
         ['git@example.com:repo', 'scp-like urls are not permitted'],
         ['/srv/repo', 'local paths are not permitted'],
      ])('rejects %s when restricted to https', async (url, message) => {
         await expectRejected(
            newSimpleGit().cmd`ls-remote ${remoteUrl(url, { protocols: ['https'] })}`,
            message
         );
      });
   });

   describe('refName', () => {
      it.each([['main'], ['feature/thing'], ['release-1.0'], ['v1.2.3']])(
         'accepts %s',
         async (ref) => {
            await expectArgs(
               newSimpleGit().cmd`checkout -b ${refName(ref)}`,
               'checkout',
               '-b',
               ref
            );
         }
      );

      it.each([
         ['a..b'],
         ['a b'],
         ['a~1'],
         ['a^'],
         ['a:b'],
         ['a@{1}'],
         ['a/'],
         ['a.'],
         ['.hidden'],
         ['a/.hidden'],
         ['a.lock'],
         ['@'],
         [''],
      ])('rejects %j', async (ref) => {
         await expectRejected(
            newSimpleGit().cmd`checkout -b ${refName(ref)}`,
            'not a valid ref name'
         );
      });
   });
});
