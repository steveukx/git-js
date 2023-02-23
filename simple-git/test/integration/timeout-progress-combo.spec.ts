import {createTestContext, newSimpleGit, SimpleGitTestContext} from "@simple-git/test-utils";

import {GitPluginError} from '../..';

describe('timeout-progress-combo', () => {

   let context: SimpleGitTestContext;
   const url = 'https://github.com/nodejs/node';
   const progress = ({method, stage, progress}) => {
      console.log(`git.${method} ${stage} stage ${progress}% complete`);
   };
   const timeout = {
      block: 5000,
   };

   jest.setTimeout(10 * 1000);

   beforeEach(async () => (context = await createTestContext()));

   it('succeeds', async () => {
      const options = {
         baseDir: context.root,
         timeout,
         progress,
      };

      console.log('starting');

      await newSimpleGit(options).clone(url).catch(err => {
         if (err instanceof GitPluginError && err.plugin === 'timeout') {
            console.error(err);
         }

         const error = typeof err.toString === 'function' ? err.toString() : '';
         console.error(error);
      });

      console.log('finished');

   });

   it('fails', async () => {
      const options = {
         baseDir: context.root,
         timeout,
      };

      console.log('starting');

      await newSimpleGit(options).clone(url).catch(err => {
         if (err instanceof GitPluginError && err.plugin === 'timeout') {
            console.error(err);
         }

         const error = typeof err.toString === 'function' ? err.toString() : '';
         console.error(error);
      });

      console.log('finished');

   });

});
