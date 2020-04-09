
const jestify = require('../jestify');
const {restore, Instance, theCommandRun, closeWith} = require('./include/setup');
const sinon = require('sinon');

var git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   done();
};

exports.tearDown = function (done) {
   restore();
   sandbox.restore();
   done();
};

exports.clone = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'clone with repo and local': function (test) {
      git.clone('repo', 'lcl', function (err, data) {
         test.same(['clone', 'repo', 'lcl'], theCommandRun());
         test.same('anything', data);
         test.equals(null, err, 'not an error');

         test.done();
      });

      closeWith('anything');
   },

   'clone with just repo': function (test) {
      git.clone('proto://remote.com/repo.git', function (err, data) {
         test.same(['clone', 'proto://remote.com/repo.git'], theCommandRun());
         test.equals(null, err, 'not an error');

         test.done();
      });

      closeWith('anything');
   },

   'clone with options': function (test) {
      git.clone('repo', 'lcl', ['foo', 'bar'], function (err, data) {
         test.same(['clone', 'foo', 'bar', 'repo', 'lcl'], theCommandRun());
         test.done();
      });

      closeWith('anything');
   },

   'clone with array of options without local': function (test) {
      git.clone('repo', ['foo', 'bar'], function (err, data) {
         test.same(['clone', 'foo', 'bar', 'repo'], theCommandRun());
         test.done();
      });

      closeWith('anything');
   },

   'explicit mirror': function (test) {
      git.mirror('r', 'l', function () {
         test.same(['clone', '--mirror', 'r', 'l'], theCommandRun());
         test.done();
      });

      closeWith();
   }
};

jestify(exports);
