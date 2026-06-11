/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",

  testMatch: ["**/?(*.)+(spec|test).ts"],

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  moduleFileExtensions: ["ts", "js", "json"],

  clearMocks: true,
  restoreMocks: true,
};
