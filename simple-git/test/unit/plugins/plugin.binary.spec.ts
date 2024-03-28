import { promiseError } from '@kwsites/promise-result';
import { assertGitError, closeWithSuccess, newSimpleGit, wait } from '../__fixtures__';
import { mockChildProcessModule } from '../__mocks__/mock-child-process';

describe('binaryPlugin', () => {
   it.each<[string, undefined | string | [string] | [string, string], string[]]>([
      ['undefined', undefined, ['git']],
      ['string', 'simple', ['simple']],
      ['string array', ['array'], ['array']],
      ['strings array', ['array', 'tuple'], ['array', 'tuple']],
   ])('allows binary set to %s', async (_, binary, command) => {
      newSimpleGit({ binary }).raw('hello');
      await closeWithSuccess('');

      expect(await expected()).toEqual([...command, 'hello']);
   });

   each(
      'valid',
      './bin/git',
      'c:\\path\\to\\git.exe',
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
      "'squote fail'"
   )('rejects invalid syntax "%s"', async (binary) => {
      assertGitError(
         await promiseError((async () => newSimpleGit({ binary }).raw('hello'))()),
         'Invalid value supplied for custom binary'
      );
   });

   it('works with config plugin', async () => {
      newSimpleGit({ binary: ['alpha', 'beta'], config: ['gamma'] }).raw('hello');
      expect(await expected()).toEqual(['alpha', 'beta', '-c', 'gamma', 'hello']);
   });
});

function each(...things: string[]) {
   return it.each(things.map((thing) => [thing]));
}

async function expected() {
   await wait();
   const recent = mockChildProcessModule.$mostRecent();
   return [recent.$command, ...recent.$args];
}
