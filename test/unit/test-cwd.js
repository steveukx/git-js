'use strict';

const {theCommandRun, restore, Instance, closeWith, errorWith} = require('./include/setup');
const sinon = require('sinon');

let git, sandbox;

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

exports.cwd = {
   setUp: function (done) {
      git = Instance().silent(true);
      done();
   },

   'to a known directory': function (test) {
      git.cwd('./', function (err, result) {
         test.equals(null, err, 'not an error');
         test.equals('./', result);

         test.done();
      });

      closeWith('');
   },

   'to an invalid directory': function (test) {
      git.cwd('./invalid_path', function (err, result) {
         test.ok(err instanceof Error, 'Should be an error');
         test.ok(/invalid_path/.test(err), 'Error should include deatil of the invalid path');

         test.done();
      });

      closeWith('');
   }
};
