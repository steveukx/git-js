'use strict';

const {theCommandRun, closeWith, Instance, restore} = require('./include/setup');
const sinon = require('sinon');
const ListLogSummary = require('../../src/responses/ListLogSummary');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.stashList = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'with no stash' (test) {
      git.stashList(function (err, result) {
         test.equals(null, err, 'not an error');
         test.equals(0, result.total);
         test.same([], result.all);
         test.done();
      });

      closeWith('');
   },

   'commands - default' (test) {
      git.stashList(() => {
         test.same(theCommandRun(),
            ['stash', 'list', `--pretty=format:%H;;;;%ai;;;;%s%d;;;;%aN;;;;%ae${ ListLogSummary.COMMIT_BOUNDARY }`]);
         test.done();
      });

      closeWith('');

   },

   'commands - custom splitter' (test) {
      const splitter = ';;';

      git.stashList({splitter}, () => {
         test.same(theCommandRun(),
            ['stash', 'list', `--pretty=format:%H${ splitter }%ai${ splitter }%s%d${ splitter }%aN${ splitter }%ae${ ListLogSummary.COMMIT_BOUNDARY }`]);
         test.done();
      });

      closeWith('');

   },

   'three item stash' (test) {

      const splitter = ';;;;;';
      const summary = ListLogSummary.parse(`

c507ed33dfe17ec0c1d3757c7310de39eee4a6a1;;;;;2018-09-13 06:52:30 +0100;;;;;WIP on master: 2942035 blah (refs/stash);;;;;Steve King;;;;;steve@mydev.co${ ListLogSummary.COMMIT_BOUNDARY }
e6e4370b081406f72e7853db8cb847ed0b5b7e75;;;;;2018-09-13 06:52:10 +0100;;;;;WIP on master: 2942035 blah;;;;;Steve King;;;;;steve@mydev.co${ ListLogSummary.COMMIT_BOUNDARY }
7ef28f506ccd193403f9402eaf89d88d991d84e7;;;;;2018-09-13 06:48:22 +0100;;;;;WIP on master: 2942035 blah;;;;;Steve King;;;;;steve@mydev.co${ ListLogSummary.COMMIT_BOUNDARY }

      `, splitter);

      test.equal(3, summary.total, 'Counts all items in the stash list');
      test.equal('c507ed33dfe17ec0c1d3757c7310de39eee4a6a1', summary.latest.hash, 'Finds the latest item');
      test.equal('c507ed33dfe17ec0c1d3757c7310de39eee4a6a1 e6e4370b081406f72e7853db8cb847ed0b5b7e75 7ef28f506ccd193403f9402eaf89d88d991d84e7',
         summary.all.map(line => line.hash).join(' '), 'Finds all items');

      test.done();

   }
};
