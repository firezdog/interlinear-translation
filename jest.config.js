const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  projects: [
    {
      displayName: "src",
      preset: "ts-jest",
      testEnvironment: "jsdom",
      transform: {
        ...tsJestTransformCfg,
        "^.+\\.tsx?$": "ts-jest",
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      roots: ["<rootDir>/src"],
      testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/setupTests.ts"],
    },
    {
      displayName: "dev",
      testEnvironment: "node",
      roots: ["<rootDir>/dev"],
      testMatch: ["**/__tests__/**/*.test.js"],
    },
  ],
};
