module.exports = {
  rootDir: '.', testRegex: 'test/.*\\.integration\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' }, testEnvironment: 'node',
  testTimeout: 60000,
};
