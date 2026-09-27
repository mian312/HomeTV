/** @type {import('jest').Config} */
const config = {
  // jest-expo preset — handles transforms, module resolution, and RN environment
  preset: 'jest-expo',

  // Resolve the @/* alias from tsconfig.json; also stub out CSS files
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    // CSS imports are side-effect-only — stub them in Jest
    '.*\.css$': '<rootDir>/src/__tests__/setup/style-mock.js',
  },

  // Extend the preset's transformIgnorePatterns to also transform ESM-only packages
  transformIgnorePatterns: [
    '/node_modules/(?!(' +
      'react-native|' +
      '@react-native|' +
      '@react-native-community|' +
      'expo|' +
      '@expo|' +
      'expo-router|' +
      'react-navigation|' +
      '@react-navigation|' +
      'zustand|' +
      '@tanstack|' +
      '@iptv-org' +
    '))',
  ],

  // Global setup (mocks that must be present before any module is imported)
  setupFiles: ['<rootDir>/src/__tests__/setup/jest.setup.ts'],

  // After-framework setup: RNTL 13+ extends Jest matchers automatically;
  // no setupFilesAfterFramework needed.

  // Test file locations
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],

  // Coverage
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,tsx}',
    '!<rootDir>/src/**/__tests__/**',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/app/**',
  ],
};

module.exports = config;
