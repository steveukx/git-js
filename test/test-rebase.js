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

exports.rebase = {
   setUp: function (done) {
      git = setup.Instance();
      done();
   },

   'rebases': function (test) {
      git.rebase(function (err, data) {
         test.equals(err, null);
         test.same(['rebase'], setup.theCommandRun());

         test.done();
      });

      setup.closeWith('some data');
   },

   'rebases with array of options': function (test) {
      git.rebase(['master', 'topic'], function (err, data) {
         test.equals(err, null);
         test.same(['rebase', 'master', 'topic'], setup.theCommandRun());

         test.done();
      });

      setup.closeWith('some data');
   },

   'rebases with object of options': function (test) {
      git.rebase({'--abort': null}, function (err, data) {
         test.equals(err, null);
         test.same(['rebase', '--abort'], setup.theCommandRun());

         test.done();
      });

      setup.closeWith('some data');
   }
};
