'use strict';

var Git = require('../../');

var _require = require('./include/setup'),
   restore = _require.restore,
   Instance = _require.Instance,
   childProcessEmits = _require.childProcessEmits;

var sinon = require('sinon');

var git, sandbox;

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

exports.git = {
   setUp: function setUp(done) {
      // git = setup.Instance();
      done();
   },

   'throws when created with a non-existant directory': function throwsWhenCreatedWithANonExistantDirectory(test) {
      test.throws(function () {
         git = Git('/tmp/foo-bar-baz');
      });

      test.done();
   },

   'works with valid directories': function worksWithValidDirectories(test) {
      git = Git(__dirname);

      test.done();
   },

   'caters for close event with no exit': function catersForCloseEventWithNoExit(test) {
      git = Instance();
      git.init(function (err) {
         test.done();
      });

      childProcessEmits('close', 'some data', 0);
   },
   'caters for exit with no close': function catersForExitWithNoClose(test) {
      git = Instance();
      git.init(function (err) {
         test.done();
      });

      childProcessEmits('exit', 'some data', 0);
   },
   'caters for close and exit': function catersForCloseAndExit(test) {
      var handler = sandbox.spy();

      git = Instance();
      git.init(handler);

      childProcessEmits('close', 'some data', 0).then(function () {
         return childProcessEmits('exit', 'some data', 0);
      }).then(function () {
         test.ok(handler.calledOnce);
         test.done();
      });
   }
};