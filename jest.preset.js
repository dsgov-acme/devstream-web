const nxPreset = require('@nrwl/jest/preset').default;

module.exports = {
  ...nxPreset,
  coverageReporters: ['text', 'lcov', 'clover', 'json', 'text-summary'],
  collectCoverage: true,
  testResultsProcessor: 'jest-sonar-reporter',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  /**
   * increasing timeout to handle an issue with axe accessibility tests timing out in the cloud when tests are run in parallel
   * see open issue: https://github.com/dequelabs/axe-core/issues/3426
   */
  testTimeout: 20000,
};
