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

exports.push = {
   setUp: function (done) {
      git = setup.Instance();
      done();
   },

   'git push can set multiple options': function (test) {
      git.push(['foo', 'bar'], function (err, result) {
         test.same(['push', 'foo', 'bar'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git push can set branch and remote': function (test) {
      git.push('rrr', 'bbb', function (err, result) {
         test.same(['push', 'rrr', 'bbb'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git push can run with no arguments': function (test) {
      git.push(function (err, result) {
         test.same(['push'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git push with options': function (test) {
      git.push({'--follow-tags': null}, function (err, result) {
         test.same(['push', '--follow-tags'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'git push with remote/branch and options': function (test) {
      git.push('rrr', 'bbb', {'--follow-tags': null}, function (err, result) {
         test.same(['push', 'rrr', 'bbb', '--follow-tags'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   }
};
