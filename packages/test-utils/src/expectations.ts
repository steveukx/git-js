// packages/test-utils/src/expectations.ts
// Utilities used by the test-suite to assert errors and expectations.
//
// This file implements Option A (recommended quick fix):
//  - assertGitError accepts `unknown` so test helpers don't need to import internal repo types.
//  - It safely extracts and tests the error message, supporting both string and RegExp checks.

/**
 * Asserts that the provided error (which may be any shape) contains a message matching
 * the provided `message` (string or RegExp). This helper is purposely loose in typing
 * so tests don't need to import internal package types like `GitError`.
 *
 * @param err unknown value (error object, string, etc.)
 * @param message string or RegExp to match against the error message
 */
export function assertGitError(err: unknown, message: string | RegExp): void {
  // Basic presence check
  expect(err).toBeDefined();

  // Helper: get a string representation of the error message
  function extractMessage(x: unknown): string {
    if (x == null) return '';

    // If it's an object and has a 'message' property, use that
    if (typeof x === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const asAny = x as any;

      if ('message' in asAny && asAny.message != null) {
        return String(asAny.message);
      }

      // Some error shapes put useful info on 'error' or 'stderr' / 'stdout'
      if ('error' in asAny && asAny.error != null) {
        return String(asAny.error);
      }
      if ('stderr' in asAny && asAny.stderr != null) {
        return String(asAny.stderr);
      }
      if ('stdout' in asAny && asAny.stdout != null) {
        return String(asAny.stdout);
      }
    }

    // Fallback to stringifying the value (covers plain strings)
    try {
      return String(x);
    } catch {
      return '';
    }
  }

  const msg = extractMessage(err);

  if (typeof message === 'string') {
    // Use Jest's string containing matcher semantics via expect().toEqual(expect.stringContaining(...))
    expect(msg).toEqual(expect.stringContaining(message));
  } else {
    // message is RegExp
    expect(msg).toEqual(expect.stringMatching(message));
  }
}

