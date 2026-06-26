/* eslint-env node */
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/**', 'ios/**'],
  },
  {
    rules: {
      'react/display-name': 'off',
      'max-params': ['error', 2],
      semi: ['error', 'never'],
    },
  },
])
