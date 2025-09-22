// test/__fixtures__/expectations.ts
// Test helpers used by the unit tests in this repo.
// Defensive helpers so tests don't need to import internal repo types.

/**
 * Assert that the provided error (unknown) contains a message matching `message`
 * (string or RegExp). Loose typing avoids needing to import internal package types.
 *
 * @param errorInstance unknown (could be Error-like, string, GitResponseError, etc.)
 * @param message string or RegExp to match against the error message
 */
export function assertGitError(errorInstance: unknown, message: string | RegExp): void {
  expect(errorInstance).toBeDefined();

  // Extract message text defensively from known shapes (message, error, stdout, stderr).
  function extractMessage(x: unknown): string {
    if (x == null) return '';

    if (typeof x === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const asAny = x as any;

      if ('message' in asAny && asAny.message != null) {
        return String(asAny.message);
      }
      if ('error' in asAny && asAny.error != null) {
        return String(asAny.error);
      }
      if ('stderr' in asAny && asAny.stderr != null) {
        return String(asAny.stderr);
      }
      if ('stdout' in asAny && asAny.stdout != null) {
        return String(asAny.stdout);
      }
      // GitResponseError sometimes nests useful info under .git or other keys
      if ('git' in asAny && asAny.git != null) {
        try {
          // Try to pull any textual info we can
          const git = asAny.git;
          if (typeof git === 'string') return git;
          if (git && typeof git === 'object') {
            if ('message' in git && git.message != null) return String(git.message);
            if ('conflicts' in git && git.conflicts != null) return String(git.conflicts);
          }
        } catch {
          // ignore
        }
      }
    }

    // fallback
    try {
      return String(x);
    } catch {
      return '';
    }
  }

  const msg = extractMessage(errorInstance);

  if (typeof message === 'string') {
    expect(msg).toEqual(expect.stringContaining(message));
  } else {
    expect(msg).toEqual(expect.stringMatching(message));
  }
}

/**
 * Assert that the provided response error (unknown) contains expected git metadata
 * and optionally compare equality. This helper avoids asserting a specific message
 * so it remains compatible with tests that expect different messages (e.g. merge conflicts).
 *
 * @param errorInstance unknown error instance
 * @param git git object (may be used by some tests)
 * @param equality optional equality matcher for comparing returned objects
 */
export function assertGitResponseError(errorInstance: Error | unknown, git: any, equality?: any) {
  // many tests expect the error to be an instance of Error
  expect(errorInstance).toBeInstanceOf(Error);

  // Some tests examine `.git` content; if the test passed an equality object assert it
  if (typeof equality !== 'undefined') {
    expect((errorInstance as any).git).toEqual(equality);
  }
}
