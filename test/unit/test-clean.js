const {theCommandRun, theCommandsRun, restore, MockChildProcess, Instance, closeWithP, errorWith} = require('./include/setup');
const sinon = require('sinon');

let git, sandbox;

describe('clean', () => {

   const test = {
      deepEqual: function (actual, expected) {
         expect(actual).toEqual(expected);
      },
      equal: function (actual, expected) {
         expect(actual).toEqual(expected);
      },
      equals: function (actual, expected) {
         expect(actual).toBe(expected);
      },
      notEqual: function (actual, expected) {
         expect(actual).not.toEqual(expected);
      },
      ok: function (actual) {
         expect(actual).toBeTruthy();
      },
      same: function (actual, expected) {
         expect(actual).toEqual(expected);
      },
      doesNotThrow: function (thrower) {
         expect(thrower).not.toThrow();
      },
      throws: function (thrower) {
         expect(thrower).toThrow();
      },
   };

   beforeEach(() => {
      restore();
      sandbox = sinon.createSandbox();
      git = Instance();
   });

   afterEach(() => {
      restore(sandbox);
   });

   it('cleans with dfx', () => new Promise((done) => {
      git.clean('dfx', function (err, data) {
         test.equals(null, err, 'not an error');
         test.same(['clean', '-dfx'], theCommandRun());
         done();
      });
      closeWithP('');
   }));

   it('missing required n or f in mode', () => new Promise((done) => {
      git.clean('x', function (err, data) {
         test.equals('TypeError: Git clean mode parameter ("n" or "f") is required', String(err));
         test.same([], theCommandsRun());
         done();
      });
      closeWithP('');
   }));

   it('unknown options', () => new Promise((done) => {
      git.clean('fa', function (err, data) {
         test.equals('TypeError: Git clean unknown option found in "fa"', String(err));
         test.same([], theCommandsRun());
         done();
      });
      closeWithP('');
   }));

   it('no args', () => new Promise((done) => {
      git.clean(function (err, data) {
         test.equals('TypeError: Git clean mode parameter ("n" or "f") is required', String(err));
         test.same([], theCommandsRun());
         done();
      });
      closeWithP('');
   }));

   it('just show no directories', () => new Promise((done) => {
      git.clean('n', function (err, data) {
         test.equals(null, err, 'not an error');
         test.same(['clean', '-n'], theCommandRun());
         done();
      });
      closeWithP('');
   }));

   it('just show', () => new Promise((done) => {
      git.clean('n', ['-d'], function (err, data) {
         test.same(['clean', '-n', '-d'], theCommandRun());
         done();
      });
      closeWithP('Would remove install.js');
   }));

   it('force clean space', () => new Promise((done) => {
      git.clean('f', ['-d'], function (err, data) {
         test.same(['clean', '-f', '-d'], theCommandRun());
         done();
      });
      closeWithP('');
   }));

   it('clean ignored files', () => new Promise((done) => {
      git.clean('f', ['-x', '-d'], function (err, data) {
         test.same(['clean', '-f', '-x', '-d'], theCommandRun());
         done();
      });
      closeWithP('');
   }));

   it('prevents interactive mode - shorthand option', () => new Promise((done) => {
      git.clean('f', ['-i'], function (err, data) {
         test.ok(!!err);
         test.same([], theCommandsRun());

         done();
      });
      closeWithP('');
   }));

   it('prevents interactive mode - shorthand mode', () => new Promise((done) => {
      git.clean('fi', function (err, data) {
         test.ok(!!err);
         test.same([], theCommandsRun());

         done();
      });
      closeWithP('');
   }));

   it('prevents interactive mode - longhand option', () => new Promise((done) => {
      git.clean('f', ['--interactive'], function (err, data) {
         test.ok(!!err);
         test.same([], theCommandsRun());

         done();
      });
      closeWithP('');
   }));

});
