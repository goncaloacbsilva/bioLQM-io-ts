module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^mddlib-js$": "<rootDir>/node_modules/mddlib-js/src/index.ts"
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(mddlib-js)/)"
  ]
};
