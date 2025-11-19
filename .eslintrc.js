module.exports = {
  root: true,
  extends: '@react-native',
  env: {
    jest: true,
  },
  overrides: [
    {
      files: ['jest.setup.js', '__mocks__/**/*.js'],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        '@react-native/no-deep-imports': 'off',
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'react-native/no-inline-styles': 'warn',
      },
    },
  ],
};
