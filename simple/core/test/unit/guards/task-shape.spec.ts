import { promiseError } from '@kwsites/promise-result';

import { TaskConfigurationError } from '../../../src/errors';
import { validateTaskShape } from '../../../src/guards/assert-task-shape';
import { isTrustedTask, trustedTask } from '../../../src/guards/trusted-task';
import { RUN_TASK, TRUSTED_TASK } from '../../../src/symbols';
import { adhocExecTask, straightThroughStringTask } from '../../../src/tasks';
import {
   assertGitError,
   assertNoExecutedTasks,
   closeWithSuccess,
   newSimpleGit,
   wait,
} from '../../__fixtures__';

function validTask() {
   return {
      commands: ['status'],
      format: 'utf-8' as const,
      parser: (stdOut: string) => stdOut,
   };
}

describe('task shape validation', () => {
   describe('validateTaskShape', () => {
      it('accepts a well formed task', () => {
         expect(validateTaskShape(validTask())).toBeUndefined();
         expect(validateTaskShape({ ...validTask(), onError: () => {} })).toBeUndefined();
         expect(validateTaskShape({ ...validTask(), format: 'buffer' })).toBeUndefined();
      });

      it('rejects anything that is not a task object', () => {
         for (const input of [undefined, null, 'status', 42, [], () => {}]) {
            expect(validateTaskShape(input)).toMatch(/task configuration object/);
         }
      });

      it('rejects an onStream handler', () => {
         expect(validateTaskShape({ ...validTask(), onStream: () => {} })).toMatch(
            /must not supply an onStream handler/
         );
      });

      it('rejects an onStream handler even when it is undefined', () => {
         expect(validateTaskShape({ ...validTask(), onStream: undefined })).toMatch(
            /must not supply an onStream handler/
         );
      });

      it('rejects unknown properties', () => {
         expect(validateTaskShape({ ...validTask(), somethingElse: true })).toMatch(
            /unsupported property "somethingElse"/
         );
      });

      it('rejects unknown symbol properties', () => {
         expect(validateTaskShape({ ...validTask(), [Symbol('nope')]: true })).toMatch(
            /unsupported property/
         );
      });

      it('rejects a forged trust mark', () => {
         // an enumerable look-alike cannot be the real symbol, and the real
         // symbol is not reachable from outside the package
         const forged = { ...validTask(), 'simple-git.trustedTask': true };
         expect(validateTaskShape(forged)).toMatch(/unsupported property/);
      });

      it('rejects a non-function parser', () => {
         expect(validateTaskShape({ ...validTask(), parser: 'nope' })).toMatch(
            /must supply a parser function/
         );
      });

      it('rejects a format outside utf-8 / buffer', () => {
         for (const format of ['empty', 'json', '', undefined]) {
            expect(validateTaskShape({ ...validTask(), format })).toMatch(/task format must be/);
         }
      });

      it('rejects empty or missing commands', () => {
         expect(validateTaskShape({ ...validTask(), commands: [] })).toMatch(
            /non-empty commands array/
         );
         expect(validateTaskShape({ ...validTask(), commands: 'status' })).toMatch(
            /non-empty commands array/
         );
         expect(validateTaskShape({ ...validTask(), commands: [{not: 'valid'}] })).toMatch(
            /task must supply only string or number arguments/
         );
      });

      it('reports the empty format rather than the empty command list it implies', () => {
         expect(validateTaskShape({ commands: [], format: 'empty', parser: () => {} })).toMatch(
            /task format must be/
         );
      });

      it('rejects a non-function onError', () => {
         expect(validateTaskShape({ ...validTask(), onError: 'nope' })).toMatch(
            /onError must be supplied as a function/
         );
      });

      it('allows pathspec wrappers and other non-primitives in commands', () => {
         // argv content is the pipeline's business - `parseArgv` coerces every
         // entry before the config-write and unsafe guards inspect it
         expect(
            validateTaskShape({ ...validTask(), commands: [new String('status')] })
         ).toBeUndefined();
      });
   });

   describe('trust marking', () => {
      it('exempts a trusted task from every check', () => {
         const task = trustedTask({ format: 'empty', anything: true } as object);
         expect(validateTaskShape(task)).toBeUndefined();
      });

      it('marks internally built empty tasks as trusted', () => {
         expect(isTrustedTask(adhocExecTask(() => {}))).toBe(true);
      });

      it('does not mark ordinary task descriptors as trusted', () => {
         expect(isTrustedTask(straightThroughStringTask(['status']))).toBe(false);
         expect(isTrustedTask(validTask())).toBe(false);
      });

      it('does not inherit trust through the prototype chain', () => {
         const inheriting = Object.create(adhocExecTask(() => {}));
         expect(isTrustedTask(inheriting)).toBe(false);
         expect(validateTaskShape(inheriting)).toMatch(/must be supplied as a plain object/);
      });

      it('rejects a descriptor hiding properties on a prototype', () => {
         // the own-property sweep cannot see inherited keys, so anything other
         // than a plain object is refused outright
         class TaskLike {
            commands = ['status'];
            format = 'utf-8';
            parser = (stdOut: string) => stdOut;
         }

         expect(validateTaskShape(new TaskLike())).toMatch(/must be supplied as a plain object/);
         expect(validateTaskShape(Object.create({ evil: true }))).toMatch(
            /must be supplied as a plain object/
         );
      });

      it('accepts a null-prototype descriptor', () => {
         expect(validateTaskShape(Object.assign(Object.create(null), validTask()))).toBeUndefined();
      });

      it('does not carry trust through a spread', () => {
         expect(isTrustedTask({ ...adhocExecTask(() => {}) })).toBe(false);
      });

      it('cannot be overwritten once applied', () => {
         const task = adhocExecTask(() => {});
         expect(() => Object.defineProperty(task, TRUSTED_TASK, { value: false })).toThrow();
      });
   });

   describe('through the instance', () => {
      it('rejects an invalid task through run()', async () => {
         const git = newSimpleGit();
         const error = await promiseError(git.run({ ...validTask(), onStream: () => {} } as never));

         assertGitError(error, 'must not supply an onStream handler', TaskConfigurationError);
         assertNoExecutedTasks();
      });

      it('vets every task in run() before queueing any of them', async () => {
         const git = newSimpleGit();
         const error = await promiseError(
            git.run(validTask(), { ...validTask(), parser: 'nope' } as never)
         );

         assertGitError(error, 'must supply a parser function', TaskConfigurationError);
         assertNoExecutedTasks();
      });

      it('rejects an invalid task through raw()', async () => {
         const git = newSimpleGit();
         const error = await promiseError(git.raw({ ...validTask(), format: 'empty' } as never));

         assertGitError(error, 'task format must be', TaskConfigurationError);
         assertNoExecutedTasks();
      });

      it('rejects an invalid task through stream()', async () => {
         const git = newSimpleGit();
         const error = await promiseError(git.stream({ ...validTask(), evil: true } as never));

         assertGitError(error, 'unsupported property "evil"', TaskConfigurationError);
         assertNoExecutedTasks();
      });

      it('rejects a task claiming the empty format through stream()', async () => {
         const git = newSimpleGit();
         const error = await promiseError(
            git.stream({ commands: [], format: 'empty', parser: () => {} } as never)
         );

         assertGitError(error, 'task format must be', TaskConfigurationError);
         assertNoExecutedTasks();
      });

      it('still runs a valid caller-supplied task', async () => {
         const git = newSimpleGit();
         const queue = git.run(validTask());

         await wait();
         await closeWithSuccess('on branch main');

         expect(await queue).toBe('on branch main');
      });

      it('has no string-keyed _runTask to bypass validation with', () => {
         const git = newSimpleGit() as unknown as Record<string, unknown>;

         expect(git._runTask).toBeUndefined();
         expect(typeof git[RUN_TASK as unknown as string]).toBe('function');
      });

      it('does not expose the trust mark through the public barrel', async () => {
         // `src/tasks` is exported wholesale, so a regression here would hand
         // consumers the ability to brand any object and skip validation
         const publicApi = await import('../../../index');

         for (const name of ['trustedTask', 'isTrustedTask', 'TRUSTED_TASK', 'RUN_TASK']) {
            expect(publicApi).not.toHaveProperty(name);
         }
      });
   });
});
