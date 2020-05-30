const {theCommandRun, theCommandsRun, restore, Instance, closeWith, instanceP} = require('./include/setup');
const sinon = require('sinon');

const {TaskConfigurationError} = require('../../src/lib/errors/task-configuration-error');
const {CleanSummary} = require("../../src/lib/responses/CleanSummary");
const {CleanOptions, CONFIG_ERROR_INTERACTIVE_MODE, CONFIG_ERROR_MODE_REQUIRED, CONFIG_ERROR_UNKNOWN_OPTION} = require('../../src/lib/tasks/clean');

describe('clean', () => {

   let git, sandbox;

   beforeEach(() => {
      restore();
      sandbox = sinon.createSandbox();
   });

   afterEach(() => {
      restore(sandbox);
   });

   describe('promises', () => {
      beforeEach(() => git = instanceP(sandbox));

      it('cleans', async () => {
         const cleanedP = git.clean(CleanOptions.FORCE);
         closeWith(`
            Removing a
            Removing b/
         `);

         const cleaned = await cleanedP;
         expect(cleaned).toBeInstanceOf(CleanSummary);
         expect(cleaned).toEqual(expect.objectContaining({
            paths: ['a', 'b/'],
            files: ['a'],
            folders: ['b/'],
         }));
      });

      it('options combined as a string', async () => {
         closeWith('');
         await git.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE);
         expect(theCommandRun()).toEqual(['clean', '-f', '-d']);
      });

      it('cleans multiple paths', async () => {
         closeWith('');
         await git.clean(CleanOptions.FORCE, ['./path-1', './path-2']);
         expect(theCommandRun()).toEqual(['clean', '-f', './path-1', './path-2']);
      });

      it('cleans with options and multiple paths', async () => {
         closeWith('');
         await git.clean(CleanOptions.IGNORED_ONLY + CleanOptions.FORCE, {'./path-1': null, './path-2': null});
         expect(theCommandRun()).toEqual(['clean', '-f', '-X', './path-1', './path-2']);
      });

      it('handles configuration errors', async () => {
         let err;
         try {
            closeWith('');
            await git.clean('X');
         }
         catch (e) {
            err = e;
         }

         expectTheError(err).toBe(CONFIG_ERROR_MODE_REQUIRED);
      });

   });

   describe('callbacks', () => {

      beforeEach(() => git = Instance());

      it('cleans with dfx', () => new Promise((done) => {
         git.clean('dfx', function (err, data) {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['clean', '-f', '-d', '-x']);
            done();
         });
         closeWith('');
      }));

      it('missing required n or f in mode', () => new Promise((done) => {
         git.clean('x', function (err) {
            expectTheError(err).toBe(CONFIG_ERROR_MODE_REQUIRED);
            expectNoTasksToHaveBeenRun();
            done();
         });
         closeWith('');
      }));

      it('unknown options', () => new Promise((done) => {
         git.clean('fa', function (err, data) {
            expectTheError(err).toBe(CONFIG_ERROR_UNKNOWN_OPTION);
            expectNoTasksToHaveBeenRun();
            done();
         });
         closeWith('');
      }));

      it('no args', () => new Promise((done) => {
         git.clean(function (err, data) {
            expectTheError(err).toBe(CONFIG_ERROR_MODE_REQUIRED);
            expectNoTasksToHaveBeenRun();
            done();
         });
         closeWith('');
      }));

      it('just show no directories', () => new Promise((done) => {
         git.clean('n', function (err) {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['clean', '-n']);
            done();
         });
         closeWith('');
      }));

      it('just show', () => new Promise((done) => {
         git.clean('n', ['-d'], function (err) {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['clean', '-n', '-d']);
            done();
         });
         closeWith('Would remove install.js');
      }));

      it('force clean space', () => new Promise((done) => {
         git.clean('f', ['-d'], function (err) {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['clean', '-f', '-d']);
            done();
         });
         closeWith('');
      }));

      it('clean ignored files', () => new Promise((done) => {
         git.clean('f', ['-x', '-d'], function (err) {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['clean', '-f', '-x', '-d']);
            done();
         });
         closeWith('');
      }));

      it('prevents interactive mode - shorthand option', () => new Promise((done) => {
         git.clean('f', ['-i'], function (err) {
            expectTheError(err).toBe(CONFIG_ERROR_INTERACTIVE_MODE);
            expectNoTasksToHaveBeenRun();

            done();
         });
         closeWith('');
      }));

      it('prevents interactive mode - shorthand mode', () => new Promise((done) => {
         git.clean('fi', function (err) {
            expectTheError(err).toBe(CONFIG_ERROR_INTERACTIVE_MODE);
            expectNoTasksToHaveBeenRun();

            done();
         });
         closeWith('');
      }));

      it('prevents interactive mode - longhand option', () => new Promise((done) => {
         git.clean('f', ['--interactive'], function (err) {
            expectTheError(err).toBe(CONFIG_ERROR_INTERACTIVE_MODE);
            expectNoTasksToHaveBeenRun();

            done();
         });
         closeWith('');
      }));
   });

   function expectNoTasksToHaveBeenRun () {
      expect(theCommandsRun()).toHaveLength(0);
   }

   function expectTheError (err) {
      return {
         toBe (message) {
            expect(err).toBeInstanceOf(TaskConfigurationError);
            expect(err.toString()).toMatch(message);
         }
      }
   }

});
