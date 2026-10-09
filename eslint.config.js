'use strict';

const js = require('@eslint/js');
const globals = require('globals');
const prettierConfig = require('eslint-config-prettier');
// The rules that keep a rule safe on any page (#90, #91, #92), published for
// packs as @surea11y/core/eslint-plugin. scripts/codemods/use-safe-dom.js
// rewrites a direct read of a DOM property; use-safe-dom keeps new code from
// adding one.
const safeDomPlugin = require('./src/eslint-plugin');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        // The engine runs either under Node+jsdom (README's `global.window = dom.window`
        // pattern) or serialized into a real browser page (`runa11yCoreInPage`) -- both
        // treat `window`/`document`/etc. as ambient globals, so both sets are needed here.
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      // This codebase's rule files swallow errors from optional/defensive helper
      // calls with an empty `catch {}` on purpose (see CONTRIBUTING.md/RULE_AUTHORING.md),
      // not an oversight to flag.
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-useless-assignment': 'error'
    }
  },
  {
    // The ES module entries of /browser and /eslint-plugin.
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module' }
  },
  {
    // Everything that runs in the page: the engine and the rules.
    files: [
      'src/core/**/*.js',
      'src/checks/**/*.js',
      'profiles/*/rules/**/*.js',
      'templates/pack/*/rules/**/*.js'
    ],
    ignores: ['src/core/safe-dom.js'],
    plugins: { 'safe-dom': safeDomPlugin },
    rules: { 'safe-dom/use-safe-dom': 'error' }
  },
  {
    // Rules only: the shared helpers define the role and ID resolution.
    files: ['src/checks/**/*.js', 'profiles/*/rules/**/*.js', 'templates/pack/*/rules/**/*.js'],
    plugins: { 'safe-dom': safeDomPlugin },
    rules: { 'safe-dom/no-raw-role': 'error', 'safe-dom/tree-scoped-ids': 'error' }
  },
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'cross-engine-report/**',
      // Dot-directories hold local editor and tooling config, not project
      // source. Linting them fails on whatever conventions their own tools
      // use, and none of it ships.
      '**/.*/**',
      // Generated bundles -- see .prettierignore for why these aren't hand-edited.
      'src/core.js',
      'surea11y.browser.js'
    ]
  },
  prettierConfig
];
