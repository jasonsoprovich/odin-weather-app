module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['airbnb-base', 'prettier'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-env'],
    },
  },
  rules: {
    'no-console': 'warn',
    'no-param-reassign': ['error', { props: false }],
    'no-underscore-dangle': [
      'error',
      {
        allow: ['_projectManager'],
        allowAfterThis: true,
      },
    ],
  },
  ignorePatterns: ['config/', 'dist/', 'node_modules/'],
  overrides: [
    {
      files: ['src/logger.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
