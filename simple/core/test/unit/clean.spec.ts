import { TaskConfigurationError } from '../..';
import type { SimpleGitCore } from '../../index';
import { CleanResponse, cleanSummaryParser } from '../../src/responses/CleanSummary';
import { CleanOptions, CONFIG_ERROR_MODE_REQUIRED } from '../../src/tasks/clean';
import {
   assertExecutedCommands,
   assertGitError,
   closeWithSuccess,
   newSimpleGit,
} from '../__fixtures__';

describe('clean', () => {
   let git: SimpleGitCore;

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
});
