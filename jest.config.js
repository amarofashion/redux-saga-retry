module.exports = {
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleFileExtensions: ['js', 'ts', 'json'],
  moduleDirectories: ['node_modules', 'src', './'],
  preset: 'ts-jest',
  testRegex: 'test/.*?\\.(test|spec)\\.ts$',
  // setupFilesAfterEnv: ['./test/setup.ts'],
  // globals: {
  //   'ts-jest': {
  //     tsConfig: './tsconfig.spec.json',
  //   },
  // },
};
