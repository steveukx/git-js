import { mergeConfig } from 'vite';

import { baseConfig } from '../../devtools/vite-config';

export default mergeConfig(baseConfig('core'), {
   test: {
      coverage: {
         provider: 'v8',
         include: ['src/**', 'index.ts'],
         thresholds: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
         },
      },
      // two projects with deliberately disjoint includes - `extends` is
      // avoided because inherited include patterns concatenate rather than
      // override, which would run every spec in both projects
      projects: [
         {
            test: {
               name: 'unit',
               globals: true,
               environment: 'node',
               include: ['test/*.spec.ts', 'test/unit/**/*.spec.ts'],
               // replaces node:child_process with the recording mock singleton
               setupFiles: ['./test/setup.ts'],
            },
         },
         {
            test: {
               name: 'integration',
               globals: true,
               environment: 'node',
               include: ['test/integration/**/*.spec.ts'],
               // Windows-only specs run via the `test:win` script
               exclude: ['test/integration/**/*.win32.spec.ts'],
               testTimeout: 60000,
            },
         },
      ],
   },
});
