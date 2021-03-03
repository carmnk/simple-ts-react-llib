module.exports = {
  preset: "ts-jest/presets/js-with-ts",
  testEnvironment: "jsdom",
  roots: ["<rootDir>"],
  testPathIgnorePatterns: [".*.d.ts", ".*.map"],
  moduleDirectories: ["node_modules", "<module-directory>"],
  // transform: {
  //   "^.+\\.tsx?$": "ts-jest",
  // },
  //setupFilesAfterEnv: ["@testing-library/react/cleanup-after-each", "@testing-library/jest-dom/extend-expect"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  globals: {
    "ts-jest": {
      tsconfig: "jest.tsconfig.json",
    },
  },
};
