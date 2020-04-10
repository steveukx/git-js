
const jestify = require('../jestify');
const {theCommandRun, restore, Instance, closeWith, errorWith} = require('./include/setup');
const sinon = require('sinon');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   sandbox.stub(console, 'warn');
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.raw = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'accepts an array of arguments': function (test) {
      git.raw(['abc', 'def'], function (err, result) {
         test.equal(err, null);
         test.equal(result, 'passed through raw response');
         test.deepEqual(theCommandRun(), ['abc', 'def']);

         test.done();
      });
      closeWith('passed through raw response');
   },

   'accepts an options object': function (test) {
      git.raw({'abc': 'def'}, function (err, result) {
         test.equal(err, null);
         test.equal(result, 'another raw response');
         test.deepEqual(theCommandRun(), ['abc=def']);

         test.done();
      });
      closeWith('another raw response');
   },

   'treats empty options as an error': function (test) {
      git.raw([], function (err, result) {
         test.ok(err instanceof Error);
         test.equal(result, null);

         test.done();
      });

      closeWith('');
   },

   'does not require a callback in success': function (test) {
      git.raw(['something']);
      test.doesNotThrow(function () {
         closeWith('');
         test.deepEqual(['something'], theCommandRun());
      });
      test.ok(console.warn.notCalled, 'Should not have generated any warnings');
      test.done();
   },

   'does not require a callback': function (test) {
      git.raw([]);
      test.doesNotThrow(function () {
         closeWith('');
      });
      test.done();
   }
};

jestify(exports);
