'use strict';

import { setup, test, TestHelper } from './include/util';
import { SimpleGit } from '../../src';
import { COMMIT_BOUNDARY, ListLogSummary } from '../../src/responses/list-log-summary';
import { ListLogLine } from '../../src/responses/list-log-line';

describe('StashList', () => {

   let helper: TestHelper;
   let git: SimpleGit;

   beforeEach(() => {
      helper = setup();
      git = helper.git;
   });

   it('with no stash', (done) => {
      git.stashList(function (err: Error, result: ListLogSummary) {
         test.equals(null, err, 'not an error');
         test.equals(0, result.total);
         test.same([], result.all);
         done();
      });

      helper.closeWith('');
   });

   it('commands - default', (done) => {
      git.stashList(() => {
         test.same(helper.theCommandRun(),
            ['stash', 'list', `--pretty=format:%H;;;;%ai;;;;%s%d;;;;%aN;;;;%ae${ COMMIT_BOUNDARY }`]);
         done();
      });

      helper.closeWith('');

   });

   it('commands - custom splitter', (done) => {
      const splitter = ';;';

      git.stashList({splitter}, () => {
         test.same(helper.theCommandRun(),
            ['stash', 'list', `--pretty=format:%H${ splitter }%ai${ splitter }%s%d${ splitter }%aN${ splitter }%ae${ COMMIT_BOUNDARY }`]);
         done();
      });

      helper.closeWith('');

   });

   it('three item stash', (done) => {

      const splitter = ';;;;;';
      const parse = ListLogSummary.parser(splitter);
      const summary = parse(`

c507ed33dfe17ec0c1d3757c7310de39eee4a6a1;;;;;2018-09-13 06:52:30 +0100;;;;;WIP on master: 2942035 blah (refs/stash);;;;;Steve King;;;;;steve@mydev.co${ COMMIT_BOUNDARY }
e6e4370b081406f72e7853db8cb847ed0b5b7e75;;;;;2018-09-13 06:52:10 +0100;;;;;WIP on master: 2942035 blah;;;;;Steve King;;;;;steve@mydev.co${ COMMIT_BOUNDARY }
7ef28f506ccd193403f9402eaf89d88d991d84e7;;;;;2018-09-13 06:48:22 +0100;;;;;WIP on master: 2942035 blah;;;;;Steve King;;;;;steve@mydev.co${ COMMIT_BOUNDARY }

      `);

      test.equal(3, summary.total, 'Counts all items in the stash list');
      test.equal('c507ed33dfe17ec0c1d3757c7310de39eee4a6a1', (<ListLogLine>summary.latest).hash, 'Finds the latest item');
      test.equal('c507ed33dfe17ec0c1d3757c7310de39eee4a6a1 e6e4370b081406f72e7853db8cb847ed0b5b7e75 7ef28f506ccd193403f9402eaf89d88d991d84e7',
         summary.all.map(line => line.hash).join(' '), 'Finds all items');

      done();

   });

});
