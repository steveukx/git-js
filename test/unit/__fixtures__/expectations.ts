import { mockChildProcessModule } from '../__mocks__/mock-child-process';
import { like } from './like';
import { GitResponseError } from '../../../src/lib/errors/git-response-error';
import { GitError } from '../../../src/lib/errors/git-error';

export function assertTheBuffer (actual: Buffer | unknown, content?: string) {
   expect(Buffer.isBuffer(actual)).toBe(true);
   if (typeof content === 'string') {
      expect((actual as Buffer).toString('utf8')).toBe(content);
   }
}

export function assertExecutedTasksCount (count: number) {
   expect(mockChildProcessModule.$allCommands()).toHaveLength(count);
}

export function assertExecutedCommands (...commands: string[]) {
   expect(mockChildProcessModule.$mostRecent().$args).toEqual(commands);
}

export function assertExecutedCommandsContains (command: string) {
   expect(mockChildProcessModule.$mostRecent().$args.indexOf(command)).not.toBe(-1);
}

export function theCommandRun () {
   return [...mockChildProcessModule.$mostRecent().$args];
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
export function assertGitError (errorInstance: Error | unknown, message: string, errorConstructor?: any) {
   if (!errorConstructor) {
      errorConstructor = GitError;
   }

   expect(errorInstance).toBeInstanceOf(errorConstructor);
   expect(errorInstance).toEqual(like({message}));
}

export function assertGitResponseError (errorInstance: Error | unknown, git: any, equality?: any) {
   expect(errorInstance).toBeInstanceOf(GitResponseError);
   git && expect((errorInstance as any).git).toBeInstanceOf(git);
   equality && expect((errorInstance as any).git).toEqual(equality);
}
