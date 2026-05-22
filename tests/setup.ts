/**
 * Jest Test Setup
 * Global test configuration and setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.GITHUB_TOKEN = 'test_token';
process.env.ICA_API_KEY = 'test_api_key';
process.env.ICA_BASE_URL = 'https://test.example.com';
process.env.ICA_MODEL = 'test-model';

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup global test timeout
jest.setTimeout(10000);

// Made with Bob
