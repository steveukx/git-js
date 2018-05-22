'use strict';

const setup = require('./include/setup');
const sinon = require('sinon');
const FetchSummary = require('../../src/responses/FetchSummary');

var git, sandbox;

exports.setUp = function (done) {
   setup.restore();
   sandbox = sinon.sandbox.create();
   done();
};

exports.tearDown = function (done) {
   setup.restore();
   sandbox.restore();
   done();
};

exports.push = {
   setUp: function (done) {
      git = setup.Instance();
      done();
   },

   'displays tree for initial commit hash': function(test) {

      git.catFile(["-p", "366e4409"], function(err, result) {

         test.equals(null, err, 'not an error');
         test.same(["cat-file", "-p", "366e4409"], setup.theCommandRun());
         test.same(([
            '100644 blob bb8fa279535700c922d3f1ffce064cb5d40f793d    .gitignore',
            '100644 blob 38e7c92830db7dc85d7911d53f7478d9311f4c81    .npmignore',
            '100644 blob a7eb4e85cdb50cc270ddf4511e72304c264b0baf    package.json',
            '100644 blob e9028d5b1f9bd80c7f1b6bacba47cb79b637164a    readme.md',
            '040000 tree b0a0e1d44895fa659bd62e7d94187adbdf5ba541    src'
         ].join('\n')), result);

         test.done();
      });

      setup.closeWith([
         '100644 blob bb8fa279535700c922d3f1ffce064cb5d40f793d    .gitignore',
         '100644 blob 38e7c92830db7dc85d7911d53f7478d9311f4c81    .npmignore',
         '100644 blob a7eb4e85cdb50cc270ddf4511e72304c264b0baf    package.json',
         '100644 blob e9028d5b1f9bd80c7f1b6bacba47cb79b637164a    readme.md',
         '040000 tree b0a0e1d44895fa659bd62e7d94187adbdf5ba541    src'
      ].join('\n'))
   },

   'displays valid usage when no arguments passed': function(test) {

      git.catFile(function(err, result) {

         // TODO: Add catch for empty response and prompt for valid hash and update test
         var errMsg = 'Please pass in a valid (tree/commit/object) hash';
         test.equals(null, err, 'not an error');
         test.same(["cat-file"], setup.theCommandRun());
         test.same(result, errMsg);

         test.done();
      });

      setup.closeWith('Please pass in a valid (tree/commit/object) hash')
   },

   'optionally returns a buffer of raw data': function (test) {
      git.binaryCatFile(['-p', 'HEAD:some-image.gif'], function (err, result) {
         test.same(['cat-file', '-p', 'HEAD:some-image.gif'], setup.theCommandRun(), 'Runs the right command');
         test.equals(true, result.isBuffer, 'should have returned a buffer');
         test.equals(true, result.toString.notCalled, 'Should not have used the stringified version');


         test.equals('foo', result.toString(), 'concatenates ');

         test.done();
      });

      setup.closeWith('foo');
   }
};
