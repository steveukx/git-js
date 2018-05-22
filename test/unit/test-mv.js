'use strict';

const {restore, Instance, theCommandRun, closeWith} = require('./include/setup');
const sinon = require('sinon');
const MoveSummary = require('../../src/responses/MoveSummary');

let git, sandbox;

const renaming = (from, to) => `Renaming ${from} to ${to}`;

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
   setUp: function (done) {
      git = Instance();
      done();
   },

   'parses a single file moving': function (test) {
      const moveSummary = MoveSummary.parse(`
${renaming('s/abc', 'd/abc')}
`);

      test.same(moveSummary.moves.length, 1);
      test.same(moveSummary.moves[0], {from: 's/abc', to: 'd/abc'});

      test.done();
   },

   'parses multiple files moving': function (test) {
      const moveSummary = MoveSummary.parse(`
${renaming('s/abc', 'd/abc')}
${renaming('name with spaces.foo', 'less-spaces')}
`);

      test.same(moveSummary.moves.length, 2);
      test.same(moveSummary.moves[0], {from: 's/abc', to: 'd/abc'});
      test.same(moveSummary.moves[1], {from: 'name with spaces.foo', to: 'less-spaces'});

      test.done();
   },

   'moves a single file': function (test) {
      git.mv('a', 'b', function (err, result) {
         test.same(['mv', '-v', 'a', 'b'], theCommandRun());

         test.done();
      });

      closeWith(`
Renaming a to b
`);

   },

   'moves multiple files to a single directory': function (test) {
      git.mv(['a', 'b', 'c'], 'd', function (err, result) {
         test.same(['mv', '-v', 'a', 'b', 'c', 'd'], theCommandRun());

         test.done();
      });

      closeWith(`
Renaming a to d/a
Renaming b to d/b
Renaming c to d/c
`);

   }

};
