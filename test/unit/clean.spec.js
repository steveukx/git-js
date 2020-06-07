const {theCommandRun, theCommandsRun, restore, Instance, closeWithSuccess, instanceP, wait} = require('./include/setup');
const {createSandbox} = require('sinon');

const {TaskConfigurationError} = require('../../src/lib/errors/task-configuration-error');
const {CleanResponse, cleanSummaryParser} = require("../../src/lib/responses/CleanSummary");
const {CleanOptions, CONFIG_ERROR_INTERACTIVE_MODE, CONFIG_ERROR_MODE_REQUIRED, CONFIG_ERROR_UNKNOWN_OPTION} = require('../../src/lib/tasks/clean');

describe('clean', () => {

   let git, sandbox;

   beforeEach(() => sandbox = createSandbox());

   afterEach(() => restore(sandbox));

   describe('parser', () => {

      function parserTest (dryRun, prefix) {
         const summary = cleanSummaryParser(dryRun, `
            ${prefix} a
            ${prefix} b/
            ${prefix} c
         `);

         expect(summary).toBeInstanceOf(CleanResponse);
         expect(summary).toEqual(expect.objectContaining({
            dryRun,
            paths: ['a', 'b/', 'c'],
            files: ['a', 'c'],
            folders: ['b/'],
         }));
      }

      it('recognises items in dry run', () => {
         parserTest(true, 'Would remove');
      });

      it('recognises items in force', () => {
         parserTest(false, 'Removing');
      });

   });

   describe('promises', () => {
      beforeEach(() => git = instanceP(sandbox));

      it('cleans', async () => {
         const cleanedP = git.clean(CleanOptions.FORCE);
         await closeWithSuccess(`
            Removing a
            Removing b/
         `);

         const cleaned = await cleanedP;
         expect(cleaned).toBeInstanceOf(CleanResponse);
         expect(cleaned).toEqual(expect.objectContaining({
            paths: ['a', 'b/'],
            files: ['a'],
            folders: ['b/'],
         }));
      });

      it('options combined as a string', async () => {
         closeWithSuccess();
         await git.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE);
         expect(theCommandRun()).toEqual(['clean', '-f', '-d']);
      });

      it('cleans multiple paths', async () => {
         closeWithSuccess();
         await git.clean(CleanOptions.FORCE, ['./path-1', './path-2']);
         expect(theCommandRun()).toEqual(['clean', '-f', './path-1', './path-2']);
      });

      it('cleans with options and multiple paths', async () => {
         closeWithSuccess();
         await git.clean(CleanOptions.IGNORED_ONLY + CleanOptions.FORCE, {'./path-1': null, './path-2': null});
         expect(theCommandRun()).toEqual(['clean', '-f', '-X', './path-1', './path-2']);
      });

      it('handles configuration errors', async () => {
         const err = await (git.clean('X').catch(e => e));

         expectTheError(err).toBe(CONFIG_ERROR_MODE_REQUIRED);
      });

   });

   describe('callbacks', () => {

      beforeEach(() => git = Instance());

      it('cleans with dfx', test((done) => {
         git.clean('dfx', function (err) {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['clean', '-f', '-d', '-x']);
            done();
         });
         closeWithSuccess();
      }));

      it('missing required n or f in mode', test((done) => {
         git.clean('x', function (err) {
            expectTheError(err).toBe(CONFIG_ERROR_MODE_REQUIRED);
            expectNoTasksToHaveBeenRun();
            done();
         });
      }));

      it('unknown options', test((done) => {
         git.clean('fa', function (err) {
            expectTheError(err).toBe(CONFIG_ERROR_UNKNOWN_OPTION);
            expectNoTasksToHaveBeenRun();
            done();
         });
      }));

      it('no args', test((done) => {
         git.clean(function (err) {
            expectTheError(err).toBe(CONFIG_ERROR_MODE_REQUIRED);
            expectNoTasksToHaveBeenRun();
            done();
         });
      }));

      it('just show no directories', test((done) => {
         git.clean('n', function (err) {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['clean', '-n']);
            done();
         });
         closeWithSuccess();
      }));

      it('just show', test((done) => {
         git.clean('n', ['-d'], function (err) {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['clean', '-n', '-d']);
            done();
         });
         closeWithSuccess('Would remove install.js');
      }));

      it('force clean space', test((done) => {
         git.clean('f', ['-d'], function (err) {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['clean', '-f', '-d']);
            done();
         });
         closeWithSuccess();
      }));

      it('clean ignored files', test((done) => {
         git.clean('f', ['-x', '-d'], function (err) {
            expect(err).toBeNull();
            expect(theCommandRun()).toEqual(['clean', '-f', '-x', '-d']);
            done();
         });
         closeWithSuccess();
      }));

      it('prevents interactive mode - shorthand option', test((done) => {
         git.clean('f', ['-i'], function (err) {
            expectTheError(err).toBe(CONFIG_ERROR_INTERACTIVE_MODE);
            expectNoTasksToHaveBeenRun();

            done();
         });
      }));

      it('prevents interactive mode - shorthand mode', test((done) => {
         git.clean('fi', function (err) {
            expectTheError(err).toBe(CONFIG_ERROR_INTERACTIVE_MODE);
            expectNoTasksToHaveBeenRun();

            done();
         });
      }));

      it('prevents interactive mode - longhand option', test((done) => {
         git.clean('f', ['--interactive'], function (err) {
            expectTheError(err).toBe(CONFIG_ERROR_INTERACTIVE_MODE);
            expectNoTasksToHaveBeenRun();

            done();
         });
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

   function test (t) {
      return async () => {
         const result = await (new Promise(done => t(done)));
         await wait();
      };
   }

});
