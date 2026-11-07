import { pathspec } from '@simple-git/args-pathspec';
import { describe, expect, it } from 'vitest';
import {
   isTemplateStringsArray,
   refName,
   remoteUrl,
   GitTemplateError,
   templateArgv,
} from '../index';

function argv(strings: TemplateStringsArray, ...values: unknown[]) {
   return templateArgv(strings, values);
}

function rejects(fn: () => unknown, message: string) {
   expect(fn).toThrow(GitTemplateError);
   expect(fn).toThrow(message);
}

describe('templateArgv', () => {
   describe('building arguments', () => {
      it('splits literal text on whitespace', () => {
         expect(argv`log   --oneline\n -n 5`).toEqual(['log', '--oneline', '-n', '5']);
      });

      it('keeps each value as exactly one argument', () => {
         const message = 'fix: the thing; rm -rf / && echo "pwned"';
         expect(argv`commit -m ${message}`).toEqual(['commit', '-m', message]);
         expect(argv`commit --message=${message}`).toEqual(['commit', `--message=${message}`]);
      });

      it('joins values to adjacent literal text', () => {
         expect(argv`push ${'origin'} HEAD:refs/heads/${'feature/x'}`).toEqual([
            'push',
            'origin',
            'HEAD:refs/heads/feature/x',
         ]);
         expect(argv`log ${'a'}..${'b'}`).toEqual(['log', 'a..b']);
      });

      it('expands arrays and stringifies numbers', () => {
         expect(argv`add -- ${['a', '-b']}`).toEqual(['add', '--', 'a', '-b']);
         expect(argv`log -n ${5}`).toEqual(['log', '-n', '5']);
      });

      it('passes pathspecs through unchanged', () => {
         const path = pathspec('-file');
         expect(argv`log ${path}`).toEqual(['log', path]);
      });

      it('permits values in global config options when the key is literal', () => {
         expect(argv`-c user.name=${'Some One'} commit`).toEqual([
            '-c',
            'user.name=Some One',
            'commit',
         ]);
      });

      it('recognises global options that take a separate value', () => {
         expect(argv`--git-dir /repo/.git -C /repo status`).toEqual([
            '--git-dir',
            '/repo/.git',
            '-C',
            '/repo',
            'status',
         ]);
      });
   });

   describe('untrusted values', () => {
      it('rejects option injection read from JSON', () => {
         const { branch } = JSON.parse(`{ "branch": "-c core.sshCommand='touch /tmp/pwned'" }`);
         rejects(() => argv`checkout ${branch}`, 'would be read as an option');
      });

      it.each([['--upload-pack=touch /tmp/pwned'], ['-u'], ['-vu']])(
         'rejects %s as a standalone value',
         (value) => {
            rejects(() => argv`clone ${value} /tmp/dir`, 'would be read as an option');
         }
      );

      it('rejects values in an option name', () => {
         rejects(() => argv`log --${'output'}=x`, 'must follow "="');
         rejects(() => argv`log -n${5}`, 'must follow "="');
      });

      it('permits values starting with - after a literal --', () => {
         expect(argv`checkout -- ${'-file'}`).toEqual(['checkout', '--', '-file']);
      });

      it('rejects values selecting the sub-command', () => {
         rejects(() => argv`${'daemon'} --export-all`, 'must be written literally');
         rejects(() => argv`-C ${'/tmp'} status`, 'must be written literally');
      });

      it('rejects configuration keys from values', () => {
         rejects(() => argv`-c ${'core.sshCommand'}=evil status`, 'configuration keys');
         rejects(() => argv`--config=${'core.pager=evil'} status`, 'configuration keys');
      });

      it.each([['ext::sh -c touch% /tmp/pwned'], ['fd::0'], ['EXT::x']])(
         'rejects remote helper transport %s',
         (url) => {
            rejects(() => argv`clone -- ${url} /tmp/dir`, 'remote helper transport');
         }
      );

      it('rejects control characters and non-string values', () => {
         rejects(() => argv`log ${'a\nb'}`, 'control characters');
         rejects(() => argv`log ${undefined}`, 'must be strings');
         rejects(() => argv`log ${{}}`, 'must be strings');
      });

      it('rejects a missing sub-command', () => {
         rejects(() => argv`--version`, 'no git sub-command');
      });

      it('requires a real tagged template', () => {
         const strings = JSON.parse('["clone ", " x"]');
         expect(isTemplateStringsArray(strings)).toBe(false);
         rejects(() => templateArgv(strings, ['--upload-pack=x']), 'tagged template literal');
      });
   });

   describe('remoteUrl', () => {
      it.each([
         ['https://github.com/steveukx/git-js.git'],
         ['ssh://git@github.com/steveukx/git-js.git'],
         ['git@github.com:steveukx/git-js.git'],
         ['file:///srv/repo.git'],
         ['/srv/repo.git'],
      ])('accepts %s', (url) => {
         expect(argv`clone ${remoteUrl(url)}`).toEqual(['clone', url]);
      });

      it.each([
         ['ssh://-oProxyCommand=touch%20pwned/repo', 'must not start with "-"'],
         ['git@-oProxyCommand=touch:repo', 'must not start with "-"'],
         ['ftp://example.com/repo', 'protocol "ftp" is not permitted'],
      ])('rejects %s', (url, message) => {
         rejects(() => argv`clone ${remoteUrl(url)}`, message);
      });

      it('restricts protocols when configured', () => {
         const https = (url: string) => remoteUrl(url, { protocols: ['https'] });
         expect(argv`ls-remote ${https('https://example.com/r')}`).toEqual([
            'ls-remote',
            'https://example.com/r',
         ]);
         rejects(() => argv`ls-remote ${https('git@example.com:r')}`, 'scp-like urls');
         rejects(() => argv`ls-remote ${https('/srv/r')}`, 'local paths');
      });
   });

   describe('refName', () => {
      it('accepts valid names', () => {
         expect(argv`checkout -b ${refName('feature/thing')}`).toEqual([
            'checkout',
            '-b',
            'feature/thing',
         ]);
      });

      it.each([['a..b'], ['a b'], ['a~1'], ['a@{1}'], ['.hidden'], ['a.lock'], ['@'], ['']])(
         'rejects %j',
         (ref) => {
            rejects(() => argv`checkout -b ${refName(ref)}`, 'not a valid ref name');
         }
      );
   });
});
