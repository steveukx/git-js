import { afterEach, vi } from 'vitest';

/**
 * Replaces `node:child_process` with the recording singleton mock for every
 * unit test file. The dynamic-import factory guarantees the specs and the
 * mocked module share the same instance through the module registry.
 *
 * Integration specs run real `git` - they live in a separate vitest project
 * that does not apply this setup file.
 */
vi.mock('node:child_process', async () => {
   const { mockChildProcessModule } = await import('./__fixtures__/mock-child-process');
   return mockChildProcessModule;
});

/**
 * The folder-existence check used by the `SimpleGitCore` constructor is stubbed
 * to succeed by default; specs asserting the construct-error path flip it via
 * `isInvalidDirectory()` (see `__fixtures__/file-exists`).
 */
vi.mock('@kwsites/file-exists', () => ({
   exists: vi.fn().mockReturnValue(true),
   FOLDER: 2,
}));

/**
 * Captures `debug` output into an in-memory log store instead of writing to the
 * console, so the logging specs can assert on it (see `__fixtures__/debug`).
 */
vi.mock('debug', () => {
   const logs: Record<string, string[]> = {};

   function logger(name: string) {
      logs[name] = logs[name] || [];

      return Object.assign(
         (_: string, ...messages: Array<string | unknown>) => {
            logs[name].push(
               messages.filter((m) => typeof m === 'string' || Buffer.isBuffer(m)).join(' ')
            );
         },
         {
            extend(suffix: string) {
               return debug(`${name}:${suffix}`);
            },
            get logs() {
               return logs;
            },
         }
      );
   }

   const debug: any = Object.assign(
      vi.fn((name: string) => logger(name)),
      {
         formatters: {
            H: 'hello-world',
         },
      }
   );

   return { default: debug };
});

afterEach(async () => {
   const { mockChildProcessModule } = await import('./__fixtures__/mock-child-process');
   mockChildProcessModule.$reset();
});
