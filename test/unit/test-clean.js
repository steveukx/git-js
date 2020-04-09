
const jestify = require('../jestify');
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

exports.clean = {
   setUp: function (done) {
      git = Instance();
      done();
   },

   'cleans with dfx' (test) {
      git.clean('dfx', function (err, data) {
         test.equals(null, err, 'not an error');
         test.same(['clean', '-dfx'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'missing required n or f in mode' (test){
      git.clean('x', function (err, data) {
         test.equals('TypeError: Git clean mode parameter ("n" or "f") is required', String(err));
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'unknown options' (test){
      git.clean('fa', function (err, data) {
         test.equals('TypeError: Git clean unknown option found in "fa"', String(err));
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'no args' (test){
      git.clean(function (err, data) {
         test.equals('TypeError: Git clean mode parameter ("n" or "f") is required', String(err));
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'just show no directories' (test){
      git.clean('n', function (err, data) {
         test.equals(null, err, 'not an error');
         test.same(['clean', '-n'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'just show' (test){
      git.clean('n', ['-d'], function (err, data) {
         test.same(['clean', '-n', '-d'], theCommandRun());
         test.done();
      });
      closeWith('Would remove install.js');
   },

   'force clean space' (test){
      git.clean('f', ['-d'], function (err, data) {
         test.same(['clean', '-f', '-d'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'clean ignored files' (test){
      git.clean('f', ['-x', '-d'], function (err, data) {
         test.same(['clean', '-f', '-x', '-d'], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'prevents interactive mode - shorthand option' (test){
      git.clean('f', ['-i'], function (err, data) {
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'prevents interactive mode - shorthand mode' (test){
      git.clean('fi', function (err, data) {
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   },

   'prevents interactive mode - longhand option' (test){
      git.clean('f', ['--interactive'], function (err, data) {
         test.same([], theCommandRun());
         test.done();
      });
      closeWith('');
   }
};

jestify(exports);
