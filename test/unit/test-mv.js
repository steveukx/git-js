'use strict';

var _require = require('./include/setup'),
    restore = _require.restore,
    Instance = _require.Instance,
    theCommandRun = _require.theCommandRun,
    closeWith = _require.closeWith;

var sinon = require('sinon');
var MoveSummary = require('../../src/responses/MoveSummary');

var git = void 0,
    sandbox = void 0;

var renaming = function renaming(from, to) {
   return 'Renaming ' + from + ' to ' + to;
};

exports.setUp = function (done) {
   restore();
   sandbox = sinon.sandbox.create();
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.mv = {
   setUp: function setUp(done) {
      git = Instance();
      done();
   },

   'parses a single file moving': function parsesASingleFileMoving(test) {
      var moveSummary = MoveSummary.parse('\n' + renaming('s/abc', 'd/abc') + '\n');

      test.same(moveSummary.moves.length, 1);
      test.same(moveSummary.moves[0], { from: 's/abc', to: 'd/abc' });

      test.done();
   },

   'parses multiple files moving': function parsesMultipleFilesMoving(test) {
      var moveSummary = MoveSummary.parse('\n' + renaming('s/abc', 'd/abc') + '\n' + renaming('name with spaces.foo', 'less-spaces') + '\n');

      test.same(moveSummary.moves.length, 2);
      test.same(moveSummary.moves[0], { from: 's/abc', to: 'd/abc' });
      test.same(moveSummary.moves[1], { from: 'name with spaces.foo', to: 'less-spaces' });

      test.done();
   },

   'moves a single file': function movesASingleFile(test) {
      git.mv('a', 'b', function (err, result) {
         test.same(['mv', '-v', 'a', 'b'], theCommandRun());

         test.done();
      });

      closeWith('\nRenaming a to b\n');
   },

   'moves multiple files to a single directory': function movesMultipleFilesToASingleDirectory(test) {
      git.mv(['a', 'b', 'c'], 'd', function (err, result) {
         test.same(['mv', '-v', 'a', 'b', 'c', 'd'], theCommandRun());

         test.done();
      });

      closeWith('\nRenaming a to d/a\nRenaming b to d/b\nRenaming c to d/c\n');
   }

};