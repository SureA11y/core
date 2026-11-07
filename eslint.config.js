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
    rules: {
      'safe-dom/use-safe-dom': 'error',
      // Old libraries (Prototype, MooTools) replace Array.from with one that
      // drops Sets, Map iterators and the mapping function. Spread goes
      // through the iterators, which they leave alone; read a list that
      // need not be iterable by index.
      'no-restricted-properties': [
        'error',
        {
          object: 'Array',
          property: 'from',
          message:
            'A page can replace Array.from: use spread ([...x], [...x].map(f)), or read a list that need not be iterable by index.'
        }
      ]
    }
  },
  {
    // The HTML report, which the browser bundle renders in the page.
    files: ['src/report.js'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Array',
          property: 'from',
          message: 'A page can replace Array.from: use spread ([...x], [...x].map(f)).'
        }
      ]
    }
  },
  {
    // Rules only: the shared helpers define the role and ID resolution.
    files: ['src/checks/**/*.js', 'profiles/*/rules/**/*.js', 'templates/pack/*/rules/**/*.js'],
    plugins: { 'safe-dom': safeDomPlugin },
    rules: {
      'safe-dom/no-raw-role': 'error',
      'safe-dom/tree-scoped-ids': 'error',
      'safe-dom/self-contained': 'error'
    }
  },
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      // Dot-directories hold local editor and tooling config, not project
      // source. Linting them fails on whatever conventions their own tools
      // use, and none of it ships.
      '**/.*/**',
      // Generated bundles -- see .prettierignore for why these aren't hand-edited.
      'src/core.js',
      'surea11y.browser.js',
      'surea11y.report.js'
    ]
  },
  prettierConfig
];
