'use strict';

const js = require('@eslint/js');
const globals = require('globals');
const prettierConfig = require('eslint-config-prettier');

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
