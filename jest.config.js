module.exports = {
  displayName: `isomorphic-vibrant`,
  coverageDirectory: `./.coverage/`,
  collectCoverage: true,
  collectCoverageFrom: [
    // include
    `./src/**/*.ts`,
    // exclude
    `!**/__MOCKS__/**/*`,
    `!**/__TEST__/**/*`,
    `!**/node_modules/**`,
    `!**/vendor/**`
  ],
  transform: {
    "^.+\\.ts$": `babel-jest`
  },
  verbose: true
}
