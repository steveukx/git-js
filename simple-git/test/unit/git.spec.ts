import { SimpleGit } from 'typings';
import {
   autoMergeConflict,
   autoMergeResponse,
   closeWithSuccess,
   isInvalidDirectory,
   isValidDirectory,
   newSimpleGit,
   wait,
} from './__fixtures__';

import { GitResponseError } from '../..';
import { createInstanceConfig } from '../../src/lib/utils';

describe('git', () => {
   let git: SimpleGit;

   afterEach(() => jest.clearAllMocks());

   describe('deprecations', () => {
      it('direct access to properties of custom error on GitResponseError', async () => {
         let callbackErr: GitResponseError | undefined;
         let promiseErr: GitResponseError | undefined;

         git = newSimpleGit();
         git.merge(
            ['a', 'b'],
            (err: null | Error) => (callbackErr = err as GitResponseError)
         ).catch((err) => (promiseErr = err));

         await closeWithSuccess(autoMergeResponse(autoMergeConflict));
         await wait();

         expect(promiseErr).toBeInstanceOf(GitResponseError);
         expect(callbackErr).toBeInstanceOf(GitResponseError);
         expect(callbackErr).not.toBe(promiseErr);

         const warning = jest.spyOn(console, 'warn');

         // accessing properties on the callback error shows a warning
         const conflicts = (callbackErr as any).conflicts;
         expect(warning).toHaveBeenCalledTimes(1);

         // but gives a pointer to the real value
         expect(conflicts).toBe(promiseErr?.git.conflicts);

         // subsequent access of properties
         expect((callbackErr as any).merges).toBe(promiseErr?.git.merges);

         // do not show additional warnings in the console
         expect(warning).toHaveBeenCalledTimes(1);

         // the promise error has not been modified with the properties of the response
         expect(promiseErr).not.toHaveProperty('conflicts');
      });
   });

   describe('instance config', () => {
      it('provides default values', () => {
         expect(createInstanceConfig()).toEqual(
            expect.objectContaining({
               baseDir: expect.any(String),
               binary: 'git',
               maxConcurrentProcesses: expect.any(Number),
            })
         );
      });

      it('merges option objects', () => {
         expect(createInstanceConfig({ baseDir: 'a' }, { maxConcurrentProcesses: 5 })).toEqual(
            expect.objectContaining({ baseDir: 'a', maxConcurrentProcesses: 5 })
         );
      });

      it('prioritises to the right', () => {
         expect(
            createInstanceConfig(
               { maxConcurrentProcesses: 3 },
               { maxConcurrentProcesses: 5 },
               { maxConcurrentProcesses: 1 }
            )
         ).toEqual(expect.objectContaining({ maxConcurrentProcesses: 1 }));
      });

      it('ignores empty values', () => {
         const params: any = [undefined, { maxConcurrentProcesses: 3 }, undefined];
         expect(createInstanceConfig(...params)).toEqual(
            expect.objectContaining({ maxConcurrentProcesses: 3 })
         );
      });
   });

   describe('simpleGit', () => {
      const simpleGit = require('../..');

      it('can be created using the default export', () => {
         expect(simpleGit.__esModule).toBe(true);
         expect(simpleGit.default).toEqual(simpleGit);

         expect(() => simpleGit.default()).not.toThrow();
      });

      it('throws when created with a non-existent directory', () => {
         isInvalidDirectory();
         expect(() => simpleGit('/tmp/foo-bar-baz')).toThrow();
      });

      it('works with valid directories', () => {
         isValidDirectory();
         expect(() => simpleGit(__dirname)).not.toThrow();
      });
   });
});
