module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@webhook/(.*)$': '<rootDir>/src/webhook/$1',
    '^@analyzers/(.*)$': '<rootDir>/src/analyzers/$1',
    '^@ai/(.*)$': '<rootDir>/src/ai/$1',
    '^@reporters/(.*)$': '<rootDir>/src/reporters/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@config/(.*)$': '<rootDir>/config/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  verbose: true,
  testTimeout: 10000
};

// Made with Bob
