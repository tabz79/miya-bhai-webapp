// jest.config.cjs
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\.tsx?
: 'ts-jest',
  },
  moduleNameMapper: {
    '\.(css|less|scss|sass)$\': 'identity-obj-proxy',
    '^@/(.*)
: '<rootDir>/client/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js|jsx|cjs)'],
  testTimeout: 15000
};
