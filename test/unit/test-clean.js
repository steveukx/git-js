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

exports.branch = {
   setUp: function setUp(done) {
      git = Instance();
      done();
   },

   'cleans with dfx': function cleansWithDfx(test) {
      git.clean('dfx', function (err, data) {
         test.equals(null, err, 'not an error');
         test.same(['clean', '-dfx'], theCommandRun());
         test.done();
      });
      closeWith('');
   },
   'missing required n or f in mode': function missingRequiredNOrFInMode(test) {
      git.clean('x', function (err, data) {
         test.equals('TypeError: Git clean mode parameter ("n" or "f") is required', err);
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   },
   'unknown options': function unknownOptions(test) {
      git.clean('fa', function (err, data) {
         test.equals('TypeError: Git clean unknown option found in "fa"', err);
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   },
   'no args': function noArgs(test) {
      git.clean(function (err, data) {
         test.equals('TypeError: Git clean mode parameter ("n" or "f") is required', err);
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   },
   'just show no directories': function justShowNoDirectories(test) {
      git.clean('n', function (err, data) {
         test.equals(null, err, 'not an error');
         test.same(['clean', '-n'], theCommandRun());
         test.done();
      });
      closeWith('');
   },
   'just show': function justShow(test) {
      git.clean('n', ['-d'], function (err, data) {
         test.same(['clean', '-n', '-d'], theCommandRun());
         test.done();
      });
      closeWith('Would remove install.js');
   },
   'force clean space': function forceCleanSpace(test) {
      git.clean('f', ['-d'], function (err, data) {
         test.same(['clean', '-f', '-d'], theCommandRun());
         test.done();
      });
      closeWith('');
   },
   'clean ignored files': function cleanIgnoredFiles(test) {
      git.clean('f', ['-x', '-d'], function (err, data) {
         test.same(['clean', '-f', '-x', '-d'], theCommandRun());
         test.done();
      });
      closeWith('');
   },
   'prevents interactive mode - shorthand option': function preventsInteractiveModeShorthandOption(test) {
      git.clean('f', ['-i'], function (err, data) {
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   },
   'prevents interactive mode - shorthand mode': function preventsInteractiveModeShorthandMode(test) {
      git.clean('fi', function (err, data) {
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   },
   'prevents interactive mode - longhand option': function preventsInteractiveModeLonghandOption(test) {
      git.clean('f', ['--interactive'], function (err, data) {
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   }
};