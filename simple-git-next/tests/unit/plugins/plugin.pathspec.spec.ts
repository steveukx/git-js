import { SimpleGit } from '../../../typings';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from '../__fixtures__';
import { pathspec } from '../../../src/lib/args/pathspec';

describe('suffixPathsPlugin', function () {
   let git: SimpleGit;

   beforeEach(() => (git = newSimpleGit()));

   it('moves pathspec to end', async () => {
      git.raw(['a', pathspec('b'), 'c']);
      await closeWithSuccess();

      assertExecutedCommands('a', 'c', '--', 'b');
   });

   it('moves multiple pathspecs to end', async () => {
      git.raw(['a', pathspec('b'), 'c', pathspec('d'), 'e']);
      await closeWithSuccess();

      assertExecutedCommands('a', 'c', 'e', '--', 'b', 'd');
   });

   it('ignores processing after a pathspec split', async () => {
      git.raw('a', pathspec('b'), '--', 'c', pathspec('d'), 'e');
      await closeWithSuccess();

      assertExecutedCommands('a', '--', 'b', 'c', 'd', 'e');
   });

   it('flattens pathspecs after an explicit splitter', async () => {
      git.raw('a', '--', 'b', pathspec('c', 'd'), 'e');
      await closeWithSuccess();

      assertExecutedCommands('a', '--', 'b', 'c', 'd', 'e');
   });

   it('accepts multiple paths in one pathspec argument', async () => {
      git.raw('a', pathspec('b', 'c'), 'd');
      await closeWithSuccess();

      assertExecutedCommands('a', 'd', '--', 'b', 'c');
   });

   it('accepted as value of an option', async () => {
      git.pull({
         foo: null,
         blah1: pathspec('a', 'b'),
         blah2: pathspec('c', 'd'),
         bar: null,
      });

      await closeWithSuccess();
      assertExecutedCommands('pull', 'foo', 'bar', '--', 'a', 'b', 'c', 'd');
   });

   it('keep splitter without path specs', async () => {
      git.raw(['a', '--']);
      await closeWithSuccess();

      assertExecutedCommands('a', '--');
   });
});
