module.exports = {
   roots: [
      "<rootDir>/src/",
      "<rootDir>/test/",
   ],
   coverageThreshold: {
      global: {
         branches: 80,
         functions: 80,
         lines: 80,
         statements: 80
      }
   },
   coverageReporters: ['json', 'lcov', 'text', 'clover'],
   testMatch: [
      "**/test/**/test-*.js",
      "**/test/**/*.spec.*"
   ]
};
