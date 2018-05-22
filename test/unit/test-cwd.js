'use strict';

var _require = require('./include/setup'),
    theCommandRun = _require.theCommandRun,
    restore = _require.restore,
    Instance = _require.Instance,
    closeWith = _require.closeWith,
    errorWith = _require.errorWith;

var sinon = require('sinon');

var git = void 0,
    sandbox = void 0;

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

exports.cwd = {
   setUp: function setUp(done) {
      git = Instance().silent(true);
      done();
   },

   'to a known directory': function toAKnownDirectory(test) {
      git.cwd('./', function (err, result) {
         test.equals(null, err, 'not an error');
         test.equals('./', result);

         test.done();
      });

      closeWith('');
   },

   'to an invalid directory': function toAnInvalidDirectory(test) {
      git.cwd('./invalid_path', function (err, result) {
         test.ok(err instanceof Error, 'Should be an error');
         test.ok(/invalid_path/.test(err), 'Error should include deatil of the invalid path');

         test.done();
      });

      closeWith('');
   }
};