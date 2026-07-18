import { GitError, GitResponseError } from '../../src/errors';
import { mockChildProcessModule } from './mock-child-process';

export function assertTheBuffer(actual: Buffer | unknown, content?: string) {
   expect(Buffer.isBuffer(actual)).toBe(true);
   if (typeof content === 'string') {
      expect((actual as Buffer).toString('utf8')).toBe(content);
   }
}

export function assertExecutedTasksCount(count: number) {
   expect(mockChildProcessModule.$allCommands()).toHaveLength(count);
}

export function assertNoExecutedTasks() {
   return assertExecutedTasksCount(0);
}

export function assertAllExecutedCommands(...commands: string[][]) {
   expect(mockChildProcessModule.$allCommands()).toEqual(commands);
}

export function assertExecutedCommands(...commands: string[]) {
   expect(mockChildProcessModule.$mostRecent().$args).toEqual(commands);
}

export function assertExecutedCommandsContains(command: string) {
   expect(mockChildProcessModule.$mostRecent().$args.indexOf(command)).not.toBe(-1);
}

export function assertExecutedCommandsContainsOnce(command: string) {
   expect(mockChildProcessModule.$mostRecent().$args.filter((c) => c === command)).toHaveLength(1);
}

export function assertChildProcessEnvironmentVariables(env: any) {
   expect(mockChildProcessModule.$mostRecent()).toHaveProperty('$env', env);
}

export function assertChildProcessSpawnOptions(options: any) {
   expect(mockChildProcessModule.$mostRecent().$options).toMatchObject(options);
}

/**
 * Convenience for asserting the type and message of a `GitError`
 *
 * ```javascript
 const promise = doSomethingAsyncThatRejects();
 const {threw, error} = await promiseError(git.init());

 expect(threw).toBe(true);
 assertGitError(error, 'some message');
 ```
 */
export function assertGitError(
   errorInstance: Error | unknown,
   message: string | RegExp,
   errorConstructor: any = GitError
) {
   expect(errorInstance).toBeInstanceOf(errorConstructor);
   expect(errorInstance).toHaveProperty(
      'message',
      typeof message === 'string'
         ? expect.stringContaining(message)
         : expect.stringMatching(message)
   );
}

export function assertGitResponseError(errorInstance: Error | unknown, git: any, equality?: any) {
   expect(errorInstance).toBeInstanceOf(GitResponseError);
   git && expect((errorInstance as any).git).toBeInstanceOf(git);
   equality && expect((errorInstance as any).git).toEqual(equality);
}
