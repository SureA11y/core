'use strict';

const js = require('@eslint/js');
const globals = require('globals');
const prettierConfig = require('eslint-config-prettier');
const { isUnsafeDomMember } = require('./scripts/codemods/safe-dom-rule');

// A page's named form controls and images override the form's and the
// document's own properties ([LegacyOverrideBuiltIns]), so the engine reads
// DOM properties through the safe accessors of src/core/safe-dom.js (#90).
// scripts/codemods/use-safe-dom.js rewrites a direct read; this rule keeps
// new code from adding one.
const safeDomPlugin = {
  rules: {
    'use-safe-dom': {
      meta: {
        type: 'problem',
        messages: {
          direct:
            'Read "{{name}}" through the safe DOM accessors (dom.{{name}}(…), dom.get or dom.call): a named form control or image can override it. Run scripts/codemods/use-safe-dom.js.'
        }
      },
      create(context) {
        return {
          MemberExpression(node) {
            // Writes are left alone, as the rewrite leaves them: the engine
            // only writes to elements it created itself.
            const parent = node.parent;
            if (parent && parent.type === 'AssignmentExpression' && parent.left === node) return;
            if (isUnsafeDomMember(node)) {
              context.report({ node, messageId: 'direct', data: { name: node.property.name } });
            }
          }
        };
      }
    }
  }
};

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
    // Everything that runs in the page: the engine and the rules.
    files: ['src/core/**/*.js', 'src/checks/**/*.js', 'profiles/*/rules/**/*.js'],
    ignores: ['src/core/safe-dom.js'],
    plugins: { 'safe-dom': safeDomPlugin },
    rules: { 'safe-dom/use-safe-dom': 'error' }
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
