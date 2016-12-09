'use strict';

const setup = require('./include/setup');
const sinon = require('sinon');

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

exports.raw = {
   setUp: function (done) {
      git = setup.Instance();
      done();
   },

   'accepts an array of arguments': function (test) {
      git.raw(['abc', 'def'], function (err, result) {
         test.equal(err, null);
         test.equal(result, 'passed through raw response');
         test.deepEqual(setup.theCommandRun(), ['abc', 'def']);

         test.done();
      });
      setup.closeWith('passed through raw response');
   },

   'accepts an options object': function (test) {
      git.raw({'abc': 'def'}, function (err, result) {
         test.equal(err, null);
         test.equal(result, 'another raw response');
         test.deepEqual(setup.theCommandRun(), ['abc=def']);

         test.done();
      });
      setup.closeWith('another raw response');
   },

   'treats empty options as an error': function (test) {
      git.raw([], function (err, result) {
         test.ok(err instanceof Error);
         test.equal(result, null);

         test.done();
      });

      setup.closeWith('');
   },

   'does not require a callback in success': function (test) {
      git.raw(['something']);
      test.doesNotThrow(function () {
         setup.closeWith('');
         test.deepEqual(['something'], setup.theCommandRun());
      });
      test.done();
   },

   'does not require a callback': function (test) {
      git.raw([]);
      test.doesNotThrow(function () {
         setup.closeWith('');
      });
      test.done();
   }
};
