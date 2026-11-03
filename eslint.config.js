// @ts-check
const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  { ignores: ['dist/**', 'coverage/**', '.angular/**', 'node_modules/**', 'public/**', 'src/app/shared/api/**'] },

  // Angular application (TypeScript)
  {
    files: ['src/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Angular templates: recommended rules plus accessibility
  {
    files: ['src/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },

  // Specs: jasmine globals, looser typing
  {
    files: ['src/**/*.spec.ts', 'src/testing/**/*.ts'],
    languageOptions: { globals: { ...globals.jasmine } },
    rules: { '@typescript-eslint/no-explicit-any': 'off', '@typescript-eslint/no-non-null-assertion': 'off' },
  },

  // Backend for frontend (CommonJS on Node)
  {
    files: ['server.js', 'server/**/*.js', 'eslint.config.js', 'karma.conf.js'],
    extends: [js.configs.recommended],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  }
);
