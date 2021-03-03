module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        //project: './tsconfig.json',
        ecmaFeatures: {
            jsx: true
        },
        ecmaVersion: 2020,
        sourceType: "module"
    },
    extends: [
        "plugin:react/recommended",
        //"plugin:@typescript-eslint/recommended",
        //"prettier/@typescript-eslint",
        "plugin:prettier/recommended"
    ],
    "rules": {
        //"prettier/prettier": ["error"]
        "no-console": 1,
    },
    settings: {
        react: {
            version: "detect" // Tells eslint-plugin-react to automatically detect the version of React to use
        }
    },
};
