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

exports.branch = {
   setUp: function (done) {
      git = setup.Instance();
      done();
   },

   'bad mode': function (test) {
      git.clean('j', function (err, data) {
         test.equals('TypeError: Git clean mode parameter ("n" or "f") is required', err);
         test.same([], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'no args': function (test) {
      git.clean(function (err, data) {
         test.equals('TypeError: Git clean mode parameter ("n" or "f") is required', err);
         test.same([], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'just show no directories': function (test) {
      git.clean('n', function (err, data) {
         test.equals(null, err, 'not an error');
         test.same(['clean', '-n'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'just show': function (test) {
      git.clean('n', ['-d'], function (err, data) {
         test.same(['clean', '-n', '-d'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('Would remove install.js');
   },

   'force clean space': function (test) {
      git.clean('f', ['-d'], function (err, data) {
         test.same(['clean', '-f', '-d'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'clean ignored files': function (test) {
      git.clean('f', ['-x', '-d'], function (err, data) {
         test.same(['clean', '-f', '-x', '-d'], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   },

   'prevents interactive mode': function (test) {
      git.clean('f', ['-i'], function (err, data) {
         test.same([], setup.theCommandRun());
         test.done();
      });
      setup.closeWith('');
   }
};
