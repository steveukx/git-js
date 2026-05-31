import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = __dirname;

const sharedResolve = {
   alias: [
      { find: /^simple-git\/promise$/, replacement: resolve(root, 'promise') },
      { find: /^simple-git$/, replacement: resolve(root, 'src/index.ts') },
      { find: /^typings$/, replacement: resolve(root, 'typings') },
   ],
};

export default defineConfig({
   resolve: sharedResolve,
   test: {
      globals: false,
      environment: 'node',
      // @simple-git/test-utils is a workspace dep that imports the package
      // source; inline it so vite transforms it (and the aliased TS source it
      // pulls in) rather than letting Node externalise it.
      server: { deps: { inline: [/@simple-git\/test-utils/] } },
      coverage: {
         provider: 'v8',
         reporter: ['json', 'lcov', 'text', 'clover'],
         include: ['src/**'],
         thresholds: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
         },
      },
      projects: [
         {
            resolve: sharedResolve,
            test: {
               name: 'unit',
               globals: false,
               environment: 'node',
               include: ['test/unit/**/*.spec.ts', 'test/unit/**/test-*.js'],
               // Unit tests run against a mocked child_process; the setup file
               // registers the module mocks globally for this project only.
               setupFiles: ['./test/unit/__fixtures__/setup.ts'],
               server: { deps: { inline: [/@simple-git\/test-utils/] } },
            },
         },
         {
            resolve: sharedResolve,
            test: {
               name: 'integration',
               globals: false,
               environment: 'node',
               include: ['test/integration/**/*.spec.ts'],
               // Integration tests spawn real git, so no child_process mock and
               // a longer timeout for the real processes.
               testTimeout: 30000,
               hookTimeout: 30000,
               server: { deps: { inline: [/@simple-git\/test-utils/] } },
            },
         },
      ],
   },
});
