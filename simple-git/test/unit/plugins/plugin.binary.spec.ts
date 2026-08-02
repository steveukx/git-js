import { promiseError } from '@kwsites/promise-result';
import { assertGitError, closeWithSuccess, newSimpleGit } from '../__fixtures__';
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

   // The binary is spawned directly with `shell: false`, so shell metacharacters,
   // spaces, quotes and Windows drive-colon paths are inert - they cannot be used
   // for command injection and are passed through to spawn as-is (a bad path simply
   // fails at spawn). The previous character allowlist wrongly rejected these.
   each(
      'long:\\path\\git.exe',
      'space fail',
      '"dquote fail"',
      "'squote fail'",
      '$',
      '!'
   )('allows previously-rejected syntax "%s"', async (binary) => {
      newSimpleGit({ binary }).raw('hello');
      expect(await expected()).toEqual([binary, 'hello']);
   });

   it('works with config plugin', async () => {
      newSimpleGit({ binary: ['alpha', 'beta'], config: ['gamma'] }).raw('hello');
      expect(await expected()).toEqual(['alpha', 'beta', '-c', 'gamma', 'hello']);
   });

   it('allows reconfiguring binary', async () => {
      const git = newSimpleGit().raw('a');
      expect(await expected()).toEqual(['git', 'a']);

      git.customBinary('next').raw('b');
      expect(await expected()).toEqual(['next', 'b']);

      git.customBinary(['abc', 'def']).raw('g');
      expect(await expected()).toEqual(['abc', 'def', 'g']);
   });

   it('rejects reconfiguring to an empty binary', async () => {
      const git = newSimpleGit().raw('a');
      expect(await expected()).toEqual(['git', 'a']);

      assertGitError(
         await promiseError((async () => git.customBinary(''))()),
         'Invalid value supplied for custom binary'
      );
   });

   // `unsafe.allowUnsafeCustomBinary` is deprecated and a no-op: it used to bypass
   // the character allowlist, which has been removed. The values below are allowed
   // regardless, and passing the flag just emits a deprecation warning.
   it('allows shell metacharacters (allowUnsafeCustomBinary is now a no-op)', async () => {
      const git = newSimpleGit({ unsafe: { allowUnsafeCustomBinary: true }, binary: '$' }).raw('a');
      expect(await expected()).toEqual(['$', 'a']);

      git.customBinary('!').raw('b');
      expect(await expected()).toEqual(['!', 'b']);
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
