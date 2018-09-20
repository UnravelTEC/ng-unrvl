const config = {
  preset: 'jest-preset-angular',
  setupTestFrameworkScriptFile: '<rootDir>/src/jest-setup.ts',
  coverageDirectory: 'reports/coverage/jest',
  testMatch: ['<rootDir>/src/app/**/*.spec.ts'],
  coverageReporters: ['lcov', 'text-summary'],
  collectCoverageFrom: ['src/app/**/*.ts', '!src/app/testing/**/*.ts', '!src/app/**/*.{module,routes}.ts', '!src/app/**/index.ts'],
  transformIgnorePatterns: ['node_modules/(?!@ngrx|lodash-es)'],
  transform: {
    '^.+\\.(ts|html)$': '<rootDir>/node_modules/jest-preset-angular/preprocessor.js',
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^app/(.*)': '<rootDir>/src/app/$1',
  },
  snapshotSerializers: [
    '<rootDir>/node_modules/jest-preset-angular/AngularSnapshotSerializer.js',
    '<rootDir>/node_modules/jest-preset-angular/HTMLCommentSerializer.js',
  ],
};

module.exports = config;
