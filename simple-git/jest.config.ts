import type { Config } from 'jest';

const projectConfig = (type: string): Config => ({
   displayName: type,
   coverageThreshold: {
      global: {
         branches: 80,
         functions: 80,
         lines: 80,
         statements: 80,
      },
   },
   coveragePathIgnorePatterns: ['<rootDir>/test/'],
   // coverageReporters: ['json', 'lcov', 'text', 'clover'],
   roots: ['<rootDir>/src/', '<rootDir>/test/', '<rootDir>/typings/'],
   testMatch: [`**/test/${type}/**/*.spec.*`],
});

const config: Config = {
   projects: [
      {
         ...projectConfig('unit'),
         setupFilesAfterEnv: [
            '<rootDir>/test/unit/__fixtures__/debug.ts',
            '<rootDir>/test/unit/__fixtures__/file-exists.ts',
            '<rootDir>/test/unit/__mocks__/mock-child-process.ts',
         ],
      },
      projectConfig('integration'),
   ],
};

export default config;
