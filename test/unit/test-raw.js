'use strict';

var _require = require('./include/setup'),
   theCommandRun = _require.theCommandRun,
   restore = _require.restore,
   Instance = _require.Instance,
   closeWith = _require.closeWith;

var sinon = require('sinon');

var git = void 0,
   sandbox = void 0;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.sandbox.create();
   sandbox.stub(console, 'warn');
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.raw = {
   setUp: function setUp(done) {
      git = Instance();
      done();
   },

   'accepts an array of arguments': function acceptsAnArrayOfArguments(test) {
      git.raw(['abc', 'def'], function (err, result) {
         test.equal(err, null);
         test.equal(result, 'passed through raw response');
         test.deepEqual(theCommandRun(), ['abc', 'def']);

         test.done();
      });
      closeWith('passed through raw response');
   },

   'accepts an options object': function acceptsAnOptionsObject(test) {
      git.raw({ 'abc': 'def' }, function (err, result) {
         test.equal(err, null);
         test.equal(result, 'another raw response');
         test.deepEqual(theCommandRun(), ['abc=def']);

         test.done();
      });
      closeWith('another raw response');
   },

   'treats empty options as an error': function treatsEmptyOptionsAsAnError(test) {
      git.raw([], function (err, result) {
         test.ok(err instanceof Error);
         test.equal(result, null);

         test.done();
      });

      closeWith('');
   },

   'does not require a callback in success': function doesNotRequireACallbackInSuccess(test) {
      git.raw(['something']);
      test.doesNotThrow(function () {
         closeWith('');
         test.deepEqual(['something'], theCommandRun());
      });
      test.ok(console.warn.notCalled, 'Should not have generated any warnings');
      test.done();
   },

   'does not require a callback': function doesNotRequireACallback(test) {
      git.raw([]);
      test.doesNotThrow(function () {
         closeWith('');
      });
      test.done();
   }
};
