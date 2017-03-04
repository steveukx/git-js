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

exports.cwd = {
   setUp: function (done) {
      git = setup.Instance();
      done();
   },

   'to a known directory': function (test) {
      git.cwd('./', function (err, result) {
         test.equals(null, err, 'not an error');
         test.equals('./', result);

         test.done();
      });

      setup.closeWith('');
   },

   'to an invalid directory': function (test) {
      git.cwd('./invalid_path', function (err, result) {
         test.ok(err instanceof Error, 'Should be an error');
         test.ok(/invalid_path/.test(err), 'Error should include deatil of the invalid path');

         test.done();
      });

      setup.closeWith('');
   }
};
