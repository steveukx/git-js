import { SimpleGit } from 'typings';
import {
   assertExecutedCommands,
   assertGitError,
   assertNoExecutedTasks,
   closeWithSuccess,
   newSimpleGit,
   wait,
} from './__fixtures__';

import { TaskConfigurationError } from '../..';
import { CleanResponse, cleanSummaryParser } from '../../src/lib/responses/CleanSummary';
import {
   CleanOptions,
   CONFIG_ERROR_INTERACTIVE_MODE,
   CONFIG_ERROR_MODE_REQUIRED,
   CONFIG_ERROR_UNKNOWN_OPTION,
} from '../../src/lib/tasks/clean';

describe('clean', () => {
   let git: SimpleGit;

   describe('parser', () => {
      function parserTest(dryRun: boolean, prefix: string) {
         const summary = cleanSummaryParser(
            dryRun,
            `
            ${prefix} a
            ${prefix} b/
            ${prefix} c
         `
         );

         expect(summary).toBeInstanceOf(CleanResponse);
         expect(summary).toEqual(
            expect.objectContaining({
               dryRun,
               paths: ['a', 'b/', 'c'],
               files: ['a', 'c'],
               folders: ['b/'],
            })
         );
      }

      it('recognises items in dry run', () => {
         parserTest(true, 'Would remove');
      });

      it('recognises items in force', () => {
         parserTest(false, 'Removing');
      });
   });

   describe('async', () => {
      beforeEach(() => (git = newSimpleGit()));

      it('cleans', async () => {
         const cleanedP = git.clean(CleanOptions.FORCE);
         await closeWithSuccess(`
            Removing a
            Removing b/
         `);

         const cleaned = await cleanedP;
         expect(cleaned).toBeInstanceOf(CleanResponse);
         expect(cleaned).toEqual(
            expect.objectContaining({
               paths: ['a', 'b/'],
               files: ['a'],
               folders: ['b/'],
            })
         );
      });

      it('options combined as a string', async () => {
         closeWithSuccess();
         await git.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE);
         assertExecutedCommands('clean', '-f', '-d');
      });

      it('cleans multiple paths', async () => {
         closeWithSuccess();
         await git.clean(CleanOptions.FORCE, ['./path-1', './path-2']);
         assertExecutedCommands('clean', '-f', './path-1', './path-2');
      });

      it('cleans with options and multiple paths', async () => {
         closeWithSuccess();
         await git.clean(CleanOptions.IGNORED_ONLY + CleanOptions.FORCE, {
            './path-1': null,
            './path-2': null,
         });
         assertExecutedCommands('clean', '-f', '-X', './path-1', './path-2');
      });

      it('handles configuration errors', async () => {
         const err = await git.clean('X').catch((e) => e);

         assertGitError(err, CONFIG_ERROR_MODE_REQUIRED, TaskConfigurationError);
      });
   });

   describe('callbacks', () => {
      beforeEach(() => (git = newSimpleGit()));

      it(
         'cleans with dfx',
         test((done) => {
            git.clean('dfx', function (err: null | Error) {
               expect(err).toBeNull();
               assertExecutedCommands('clean', '-f', '-d', '-x');
               done();
            });
            closeWithSuccess();
         })
      );

      it(
         'missing required n or f in mode',
         test((done) => {
            git.clean('x', function (err: null | Error) {
               assertGitError(err, CONFIG_ERROR_MODE_REQUIRED, TaskConfigurationError);
               assertNoExecutedTasks();
               done();
            });
         })
      );

      it(
         'unknown options',
         test((done) => {
            git.clean('fa', function (err: null | Error) {
               assertGitError(err, CONFIG_ERROR_UNKNOWN_OPTION, TaskConfigurationError);
               assertNoExecutedTasks();
               done();
            });
         })
      );

      it(
         'no args',
         test((done) => {
            git.clean(function (err: null | Error) {
               assertGitError(err, CONFIG_ERROR_MODE_REQUIRED, TaskConfigurationError);
               assertNoExecutedTasks();
               done();
            });
         })
      );

      it(
         'just show no directories',
         test((done) => {
            git.clean('n', function (err: null | Error) {
               expect(err).toBeNull();
               assertExecutedCommands('clean', '-n');
               done();
            });
            closeWithSuccess();
         })
      );

      it(
         'just show',
         test((done) => {
            git.clean('n', ['-d'], function (err: null | Error) {
               expect(err).toBeNull();
               assertExecutedCommands('clean', '-n', '-d');
               done();
            });
            closeWithSuccess('Would remove install.js');
         })
      );

      it(
         'force clean space',
         test((done) => {
            git.clean('f', ['-d'], function (err: null | Error) {
               expect(err).toBeNull();
               assertExecutedCommands('clean', '-f', '-d');
               done();
            });
            closeWithSuccess();
         })
      );

      it(
         'clean ignored files',
         test((done) => {
            git.clean('f', ['-x', '-d'], function (err: null | Error) {
               expect(err).toBeNull();
               assertExecutedCommands('clean', '-f', '-x', '-d');
               done();
            });
            closeWithSuccess();
         })
      );

      it(
         'prevents interactive mode - shorthand option',
         test((done) => {
            git.clean('f', ['-i'], function (err: null | Error) {
               assertGitError(err, CONFIG_ERROR_INTERACTIVE_MODE, TaskConfigurationError);
               assertNoExecutedTasks();

               done();
            });
         })
      );

      it(
         'prevents interactive mode - shorthand mode',
         test((done) => {
            git.clean('fi', function (err: null | Error) {
               assertGitError(err, CONFIG_ERROR_INTERACTIVE_MODE, TaskConfigurationError);
               assertNoExecutedTasks();

               done();
            });
         })
      );

      it(
         'prevents interactive mode - longhand option',
         test((done) => {
            git.clean('f', ['--interactive'], function (err: null | Error) {
               assertGitError(err, CONFIG_ERROR_INTERACTIVE_MODE, TaskConfigurationError);
               assertNoExecutedTasks();

               done();
            });
         })
      );
   });

   function test(t: (done: Function) => void) {
      return async () => {
         await new Promise((done) => t(done));
         await wait();
      };
   }
});
