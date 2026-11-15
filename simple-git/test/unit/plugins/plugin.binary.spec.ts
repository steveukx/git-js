import { promiseError } from '@kwsites/promise-result';
import { describe, expect, it } from 'vitest';

import {
   $logMatching,
   $logReset,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
} from '../__fixtures__';
import { mockChildProcessModule } from '../__mocks__/mock-child-process';

describe('binaryPlugin', () => {
   it.each<[string, undefined | string | [string] | [string, string], string[]]>([
      ['undefined', undefined, ['git']],
      ['string', 'simple', ['simple']],
      ['string array', ['array'], ['array']],
      ['strings array', ['array', 'tuple'], ['array', 'tuple']],
   ])('allows binary set to %s', async (_, binary, command) => {
      newSimpleGit({ binary }).raw('hello');

      expect(await expected()).toEqual([...command, 'hello']);
   });

   each(
      'valid',
      './bin/git',
      'c:\\path\\to\\git.exe',
      'c:\\long-path~1\\to\\git.exe',
      'custom-git',
      'GIT'
   )('allows valid syntax "%s"', async (binary) => {
      newSimpleGit({ binary }).raw('hello');
      expect(await expected()).toEqual([binary, 'hello']);
   });

   each(
      'long:\\path\\git.exe',
      'space fail',
      '"dquote fail"',
      "'squote fail'",
      '$',
      '!'
   )('rejects invalid syntax "%s"', async (binary) => {
      assertGitError(
         await promiseError((async () => newSimpleGit({ binary }).raw('hello'))()),
         'Invalid value supplied for custom binary'
      );
   });

   each(
      'C:\\Program Files\\Git\\bin\\git.exe',
      'c:/Program Files/Git/bin/git.exe',
      '/opt/my tools/bin/git',
      './my tools/git',
      '/opt/tools/my git'
   )('allows spaces in a binary path "%s"', async (binary) => {
      newSimpleGit({ binary }).raw('hello');
      expect(await expected()).toEqual([binary, 'hello']);
   });

   each(
      'git status',
      'git /path',
      '/opt/tools /git',
      '/opt/ tools/git',
      '/opt/tools/git ',
      ' /opt/tools/git',
      '/opt/tools\t/git',
      '/opt/my tools/git;',
      'C:\\Program Files (x86)\\Git\\bin\\git.exe'
   )('rejects spaces in a binary that does not look like a path "%s"', async (binary) => {
      assertGitError(
         await promiseError((async () => newSimpleGit({ binary }).raw('hello'))()),
         'Invalid value supplied for custom binary'
      );
   });

   it('allows spaces in the binary path when used with a prefix', async () => {
      newSimpleGit({ binary: ['C:\\Program Files\\wsl.exe', 'git'] }).raw('hello');
      expect(await expected()).toEqual(['C:\\Program Files\\wsl.exe', 'git', 'hello']);
   });

   each(
      'my prefix',
      '/opt/my tools/git',
      '--exec-path=/tmp/evil',
      '--config-env=core.pager=EDITOR',
      '-c core.pager=evil'
   )('rejects restricted characters in the prefix "%s"', async (prefix) => {
      assertGitError(
         await promiseError((async () => newSimpleGit({ binary: ['wsl', prefix] }).raw('hello'))()),
         'Invalid value supplied for custom binary'
      );
   });

   it('works with config plugin', async () => {
      newSimpleGit({ binary: ['alpha', 'beta'], config: ['gamma'] }).raw('hello');
      expect(await expected()).toEqual(['alpha', 'beta', '-c', 'gamma', 'hello']);
   });

   it('allows reconfiguring binary', async () => {
      await $logReset();

      const git = newSimpleGit().raw('a');
      expect(await expected()).toEqual(['git', 'a']);

      git.customBinary('next').raw('b');
      expect(await expected()).toEqual(['next', 'b']);

      git.customBinary(['abc', 'def']).raw('g');
      expect(await expected()).toEqual(['abc', 'def', 'g']);

      expect(await $logMatching('plugin:binary')).toEqual([
         ['simple-git:plugin:binary', 'reconfiguring %o', { binary: 'next' }],
         ['simple-git:plugin:binary', 'reconfiguring %o', { binary: 'abc', prefix: 'def' }],
      ]);
   });

   it('rejects reconfiguring to an invalid binary', async () => {
      const git = newSimpleGit().raw('a');
      expect(await expected()).toEqual(['git', 'a']);

      assertGitError(
         await promiseError((async () => git.customBinary('not valid'))()),
         'Invalid value supplied for custom binary'
      );
   });

   it('allows configuring to bad values when overridden', async () => {
      const git = newSimpleGit({ unsafe: { allowUnsafeCustomBinary: true }, binary: '$' }).raw('a');
      expect(await expected()).toEqual(['$', 'a']);

      git.customBinary('!').raw('b');
      expect(await expected()).toEqual(['!', 'b']);
   });

   it('logs permitted unsafe operations', async () => {
      await $logReset();
      newSimpleGit({ unsafe: { allowUnsafeCustomBinary: true }, binary: '$' }).raw('a');
      expect(await expected()).toEqual(['$', 'a']);

      expect(await $logMatching('plugin:binary')).toEqual([
         ['simple-git:plugin:binary', 'permitted unsafe binary %o', ['$']],
      ]);
   });
});

function each(...things: string[]) {
   return it.each(things.map((thing) => [thing]));
}

async function expected() {
   await closeWithSuccess();
   const recent = mockChildProcessModule.$mostRecent();
   return [recent.$command, ...recent.$args];
}
