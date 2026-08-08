import { afterEach } from 'vitest';

import { GitConstructError, TaskConfigurationError } from '../../src/errors';
import { SimpleGitCore } from '../../src/git';
import { getExecutor } from '../../src/runners/executor-cache';
import { adhocExecTask } from '../../src/tasks';
import { isInvalidDirectory, isValidDirectory } from '../__fixtures__';

describe('SimpleGitCore', () => {
   afterEach(() => isValidDirectory());

   it('throws GitConstructError when baseDir does not exist', () => {
      isInvalidDirectory();
      expect(() => new SimpleGitCore({ baseDir: `${__dirname}/does-not-exist` })).toThrow(
         GitConstructError
      );
   });

   it('defaults baseDir to the current working directory', () => {
      expect(() => new SimpleGitCore()).not.toThrow();
   });

   describe('empty tasks (no child process)', () => {
      it('run resolves with the last task result, earlier tasks run for side effects', async () => {
         const git = new SimpleGitCore();
         const calls: string[] = [];

         const result = await git.run(
            adhocExecTask(() => void calls.push('first')),
            adhocExecTask(() => {
               calls.push('second');
               return 'result' as unknown as void;
            })
         );

         expect(calls).toEqual(['first', 'second']);
         expect(result).toBe('result');
      });

      it('a failing task rejects and prevents later tasks running', async () => {
         const git = new SimpleGitCore();
         const calls: string[] = [];

         const queued = git.run(
            adhocExecTask(() => {
               throw new Error('boom');
            }),
            adhocExecTask(() => void calls.push('after'))
         );

         await expect(queued).rejects.toThrow('boom');
         expect(calls).toEqual([]);
      });

      it('run with no tasks rejects with a configuration error', async () => {
         const git = new SimpleGitCore();
         await expect((git.run as () => Promise<unknown>)()).rejects.toBeInstanceOf(
            TaskConfigurationError
         );
      });

      it('raw with no commands rejects with a configuration error', async () => {
         const git = new SimpleGitCore();
         await expect(git.raw()).rejects.toBeInstanceOf(TaskConfigurationError);
         await expect(git.raw([])).rejects.toThrow(
            'Raw: must supply one or more command to execute'
         );
      });

      it('raw accepts a pre-built task descriptor', async () => {
         const git = new SimpleGitCore();
         await expect(
            git.raw(adhocExecTask(() => 'from descriptor' as unknown as void))
         ).resolves.toBe('from descriptor');
      });
   });

   describe('env', () => {
      it('records intent without touching the ambient environment', () => {
         const git = new SimpleGitCore();

         expect(git.env('first', 'a')).toBe(git);
         git.env({ replaced: 'b' });
         git.env('appended', 'c');

         expect(getExecutor(git).env).toEqual({ replaced: 'b', appended: 'c' });
      });
   });
});
