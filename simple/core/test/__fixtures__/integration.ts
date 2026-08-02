// Barrel for the ported v3 integration suite - the runner-agnostic pieces of
// what v3 imported from `@simple-git/test-utils`, retargeted at @simple-git/core.
import { type SimpleGitCore, simpleGitCore } from '../../src/git';
import type { SimpleGitCoreOptions } from '../../src/types';
import { ALLOW_TEST_CONFIG } from './create-test-context';

export * from './create-abort-controller';
export * from './create-test-context';
export { assertGitError, assertGitResponseError } from './expectations';
export * from './like';
export * from './setup/setup-conflicted';
export * from './setup/setup-files';
export * from './setup/setup-ignored';
export * from './setup/setup-init';
export * from './wait';

/**
 * Integration specs spin up many ad-hoc repositories that need the test-harness
 * config writes (`-c init.defaultbranch` and the committer identity). This
 * variant of `newSimpleGit` opts those keys in by default so the real-git setup
 * works; specs testing the deny-by-default guard use other keys, which stay
 * blocked. Callers can still override `allowConfigWrite` via options.
 */
export function newSimpleGit(
   baseDir?: string | Partial<SimpleGitCoreOptions>,
   options?: Partial<SimpleGitCoreOptions>
): SimpleGitCore {
   const resolved: Partial<SimpleGitCoreOptions> = {
      ...(typeof baseDir === 'object' ? baseDir : undefined),
      ...options,
   };
   return simpleGitCore(typeof baseDir === 'string' ? baseDir : undefined, {
      allowConfigWrite: [...ALLOW_TEST_CONFIG],
      ...resolved,
   });
}
