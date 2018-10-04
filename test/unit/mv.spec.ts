import { setup, test, TestHelper } from './include/util';
import { SimpleGit } from '../../src';
import { MoveSummary } from '../../src/responses/move-summary';

describe('Mv', () => {

   let helper: TestHelper;
   let git: SimpleGit;

   function renaming (from: string, to: string): string {
      return `Renaming ${from} to ${to}`;
   }

   beforeEach(() => {
      helper = setup();
      git = helper.git;
   });

   it('parses a single file moving', function (done) {
      const moveSummary = MoveSummary.parse(`
${renaming('s/abc', 'd/abc')}
`);

      test.same(moveSummary.moves.length, 1);
      test.same(moveSummary.moves[0], {from: 's/abc', to: 'd/abc'});

      done();
   });

   it('parses multiple files moving', function (done) {
      const moveSummary = MoveSummary.parse(`
${renaming('s/abc', 'd/abc')}
${renaming('name with spaces.foo', 'less-spaces')}
`);

      test.same(moveSummary.moves.length, 2);
      test.same(moveSummary.moves[0], {from: 's/abc', to: 'd/abc'});
      test.same(moveSummary.moves[1], {from: 'name with spaces.foo', to: 'less-spaces'});

      done();
   });

   it('moves a single file', function (done) {
      git.mv('a', 'b', function (err: Error, result: MoveSummary) {
         test.same(['mv', '-v', 'a', 'b'], helper.theCommandRun());

         done();
      });

      helper.closeWith(`
Renaming a to b
`);

   });

   it('moves multiple files to a single directory', function (done) {
      git.mv(['a', 'b', 'c'], 'd', function (err: Error, result: MoveSummary) {
         test.same(['mv', '-v', 'a', 'b', 'c', 'd'], helper.theCommandRun());

         done();
      });

      helper.closeWith(`
Renaming a to d/a
Renaming b to d/b
Renaming c to d/c
`);

   });

});
