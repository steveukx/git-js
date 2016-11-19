'use strict';

const Git = require('../../');
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

exports.git = {
   setUp: function (done) {
      // git = setup.Instance();
      done();
   },

   'throws when created with a non-existant directory': function (test) {
      test.throws(function () {
         git = Git('/tmp/foo-bar-baz');
      });

      test.done();
   },

   'works with valid directories': function (test) {
      git = Git(__dirname);

      test.done();
   }
};
