const jestify = require('../jestify');
const {theCommandRun, closeWith, Instance, restore, MockChildProcess} = require('./include/setup');
const sinon = require('sinon');

let git, sandbox;

exports.setUp = function (done) {
   restore();
   sandbox = sinon.createSandbox();
   done();
};

exports.tearDown = function (done) {
   restore(sandbox);
   done();
};

exports.subModule = {
   setUp: function (done) {
      sandbox.stub(console, 'warn');
      git = Instance();
      done();
   },

   'update with no args': function (test) {
      git.submoduleUpdate(function (err, result) {
         test.equals(null, err, 'not an error');
         test.equals('', result, 'passes through the result');
         test.same(["submodule", "update"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'update with string arg': function (test) {
      git.submoduleUpdate('foo', function (err, result) {
         test.ok(console.warn.called, 'should warn invalid usage');
         test.equals(null, err, 'not an error');
         test.equals('', result, 'passes through the result');
         test.same(["submodule", "update", "foo"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'update with array arg': function (test) {
      git.submoduleUpdate(['foo', 'bar'], function (err, result) {
         test.equals(null, err, 'not an error');
         test.equals('', result, 'passes through the result');
         test.same(["submodule", "update", "foo", "bar"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'init with no args': function (test) {
      git.submoduleInit(function (err, result) {
         test.equals(null, err, 'not an error');
         test.equals('', result, 'passes through the result');
         test.same(["submodule", "init"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'init with string arg': function (test) {
      git.submoduleInit('foo', function (err, result) {
         test.ok(console.warn.called, 'should warn invalid usage');
         test.equals(null, err, 'not an error');
         test.equals('', result, 'passes through the result');
         test.same(["submodule", "init", "foo"], theCommandRun());
         test.done();
      });

      closeWith('');
   },

   'init with array arg': function (test) {
      git.submoduleInit(['foo', 'bar'], function (err, result) {
         test.equals(null, err, 'not an error');
         test.equals('', result, 'passes through the result');
         test.same(["submodule", "init", "foo", "bar"], theCommandRun());
         test.done();
      });

      closeWith('');
   }
};

jestify(exports);
