'use strict';

const Git = require('../../');
const {restore, Instance, childProcessEmits} = require('./include/setup');
const sinon = require('sinon');

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
   },

   'caters for close event with no exit' (test) {
      git = Instance();
      git.init((err) => {
         test.done();
      });

      childProcessEmits('close', 'some data', 0);
   },

   'caters for exit with no close' (test) {
      git = Instance();
      git.init((err) => {
         test.done();
      });

      childProcessEmits('exit', 'some data', 0);
   },

   'caters for close and exit' (test) {
      let handler = sandbox.spy();

      git = Instance();
      git.init(handler);

      childProcessEmits('close', 'some data', 0)
         .then(() => childProcessEmits('exit', 'some data', 0))
         .then(() => {
            test.ok(handler.calledOnce);
            test.done();
         })
      ;
   }
};
