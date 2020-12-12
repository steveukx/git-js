import { SimpleGit, TaskOptions } from 'typings';
import { assertExecutedCommands, closeWithSuccess, newSimpleGit } from './__fixtures__';

describe('applyPatch', () => {
   let git: SimpleGit;

   const applyPatchTests: [keyof SimpleGit, string, Array<string | TaskOptions>, string[]][] = [
      ['applyPatch', 'with one file', ['./diff'], ['apply', './diff']],
      ['applyPatch', 'with multiple files', [['./diff1', './diff2']], ['apply', './diff1', './diff2']],
      ['applyPatch', 'with options array', ['./diff', ['--stat']], ['apply', '--stat', './diff']],
      ['applyPatch', 'with options object', ['./diff', {'-p': 2}], ['apply', '-p=2', './diff']],
   ];

   beforeEach(() => git = newSimpleGit());

   it.each(applyPatchTests)('callbacks - %s %s', async (api, name, applyPatchArgs, executedCommands)=> {
      const callback = jest.fn();
      const queue = (git[api] as any)(...applyPatchArgs, callback);
      await closeWithSuccess(name);

      expect(await queue).toBe(name);
      expect(callback).toHaveBeenCalledWith(null, name);
      assertExecutedCommands(...executedCommands);
   });

   it.each(applyPatchTests)(`promises - %s %s`, async (api, name, applyPatchArgs, executedCommands) => {
      const queue = (git[api] as any)(...applyPatchArgs);
      await closeWithSuccess(name);

      expect(await queue).toBe(name);
      assertExecutedCommands(...executedCommands);
   });
});
