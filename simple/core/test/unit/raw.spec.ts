import { promiseError } from '@kwsites/promise-result';

import type { SimpleGitCore } from '../../index';
import {
   assertExecutedCommands,
   assertGitError,
   assertNoExecutedTasks,
   closeWithSuccess,
   newSimpleGit,
} from '../__fixtures__';

describe('raw', () => {
   let git: SimpleGitCore;
   const response = 'passed through raw response';

   beforeEach(() => {
      git = newSimpleGit();
   });

   it('does not trim by default', async () => {
      const actual = newSimpleGit().raw('abc');
      await closeWithSuccess(`${response}\n`);

      expect(await actual).toBe(`${response}\n`);
   });

   it('can disable trimming responses', async () => {
      const actual = newSimpleGit({ trimmed: false }).raw('abc');
      await closeWithSuccess(`${response}\n`);

      expect(await actual).toBe(`${response}\n`);
   });

   it('can trim responses', async () => {
      const actual = newSimpleGit({ trimmed: true }).raw('abc');
      await closeWithSuccess(`${response}\n`);

      expect(await actual).toBe(response);
   });

   it('treats empty options as an error - empty array present', async () => {
      const task = git.raw([]);
      const error = await promiseError(task);

      assertGitError(error, 'Raw: must supply one or more command to execute');
      assertNoExecutedTasks();
   });

   it('treats empty options as an error - none present', async () => {
      const task = git.raw();
      const error = await promiseError(task);

      assertGitError(error, 'must supply one or more command');
      assertNoExecutedTasks();
   });

   it('accepts an options object', async () => {
      git.raw({ abc: 'def' });
      await closeWithSuccess();

      assertExecutedCommands('abc=def');
   });

   it('accepts (some) rest-args: options object', async () => {
      git.raw('some', 'thing', { '--opt': 'value' });
      await closeWithSuccess();
      assertExecutedCommands('some', 'thing', '--opt=value');
   });
});
