import { GitError, GitResponseError } from 'simple-git';

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
   expect(errorInstance).toHaveProperty('message', expect.stringMatching(message));
}

export function assertGitResponseError(errorInstance: Error | unknown, git: any, equality?: any) {
   expect(errorInstance).toBeInstanceOf(GitResponseError);
   git && expect((errorInstance as any).git).toBeInstanceOf(git);
   equality && expect((errorInstance as any).git).toEqual(equality);
}
