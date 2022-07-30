module.exports = {
   roots: ['<rootDir>/src/', '<rootDir>/test/', '<rootDir>/typings/'],
   coverageThreshold: {
      global: {
         branches: 80,
         functions: 80,
         lines: 80,
         statements: 80,
      },
   },
   coveragePathIgnorePatterns: ['<rootDir>/test/'],
   coverageReporters: ['json', 'lcov', 'text', 'clover'],
   testMatch: ['**/test/**/test-*.js', '**/test/**/*.spec.*'],
};
