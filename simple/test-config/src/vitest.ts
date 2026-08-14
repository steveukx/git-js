import { defineConfig } from 'vitest/config';

export interface TestConfig {
   setupFiles?: string[];
   include?: string[];
}

export function simpleGitTesting({ setupFiles = [], include = ['**/*.spec.ts'] }: TestConfig = {}) {
   return defineConfig({
      test: {
         globals: true,
         environment: 'node',
         setupFiles: ['@simple-git/test-config/setup', ...setupFiles],
         include: [...include],
      },
   });
}

export default simpleGitTesting();
