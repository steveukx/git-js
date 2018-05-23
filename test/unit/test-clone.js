'use strict';

var _require = require('./include/setup'),
   restore = _require.restore,
   Instance = _require.Instance,
   theCommandRun = _require.theCommandRun,
   closeWith = _require.closeWith;

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

exports.clone = {
   setUp: function setUp(done) {
      git = Instance();
      done();
   },

   'clone with repo and local': function cloneWithRepoAndLocal(test) {
      git.clone('repo', 'lcl', function (err, data) {
         test.same(['clone', 'repo', 'lcl'], theCommandRun());
         test.same('anything', data);
         test.equals(null, err, 'not an error');

         test.done();
      });

      closeWith('anything');
   },

   'clone with just repo': function cloneWithJustRepo(test) {
      git.clone('proto://remote.com/repo.git', function (err, data) {
         test.same(['clone', 'proto://remote.com/repo.git'], theCommandRun());
         test.equals(null, err, 'not an error');

         test.done();
      });

      closeWith('anything');
   },

   'clone with options': function cloneWithOptions(test) {
      git.clone('repo', 'lcl', ['foo', 'bar'], function (err, data) {
         test.same(['clone', 'foo', 'bar', 'repo', 'lcl'], theCommandRun());
         test.done();
      });

      closeWith('anything');
   },

   'clone with array of options without local': function cloneWithArrayOfOptionsWithoutLocal(test) {
      git.clone('repo', ['foo', 'bar'], function (err, data) {
         test.same(['clone', 'foo', 'bar', 'repo'], theCommandRun());
         test.done();
      });

      closeWith('anything');
   },

   'explicit mirror': function explicitMirror(test) {
      git.mirror('r', 'l', function () {
         test.same(['clone', '--mirror', 'r', 'l'], theCommandRun());
         test.done();
      });

      closeWith();
   }
};