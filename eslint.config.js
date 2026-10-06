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
    // The role attribute is a fallback list read in any case (#91): rules
    // resolve it with helpers.aria.getExplicitRole and select with
    // [role~="x" i], never by the raw value or an exact-match selector. A
    // raw read that is right (the literal text for a message) says why in an
    // eslint-disable comment.
    'no-raw-role': {
      meta: {
        type: 'problem',
        messages: {
          read: 'Resolve the role with helpers.aria.getExplicitRole(el): the attribute is a fallback list, read in any case.',
          select:
            'Select by role with [role~="x" i] and keep the elements whose helpers.aria.getExplicitRole is x: [role="x"] misses a fallback list and another case.'
        }
      },
      create(context) {
        const isRoleLiteral = (n) => n && n.type === 'Literal' && n.value === 'role';
        const checkText = (node, text) => {
          if (/\[\s*role\s*=/i.test(text)) context.report({ node, messageId: 'select' });
        };
        return {
          CallExpression(node) {
            const c = node.callee;
            const name =
              c.type === 'MemberExpression' && !c.computed
                ? c.property.name
                : c.type === 'Identifier'
                  ? c.name
                  : '';
            if (!/^(getAttribute|getAttr)$/.test(name)) return;
            const args = node.arguments;
            const viaDom =
              c.type === 'MemberExpression' &&
              c.object.type === 'Identifier' &&
              c.object.name === 'dom';
            if (
              viaDom || c.type === 'Identifier' ? isRoleLiteral(args[1]) : isRoleLiteral(args[0])
            ) {
              context.report({ node, messageId: 'read' });
            }
          },
          Literal(node) {
            if (typeof node.value !== 'string') return;
            // A rule's title or description is text for people, not a selector.
            const p = node.parent;
            if (
              p &&
              p.type === 'Property' &&
              p.value === node &&
              p.key &&
              /^(title|description|summary|hint)$/.test(p.key.name || p.key.value)
            ) {
              return;
            }
            checkText(node, node.value);
          },
          TemplateElement(node) {
            checkText(node, node.value.raw);
          }
        };
      }
    },
    // An ID reference resolves in the referring element's own tree, its
    // shadow root or its document (#92): rules look one up with
    // helpers.getElementByIdInTree(el, id) and pass the referring element to
    // the shared IDREF helpers. A fragment link is the exception, looked up
    // in the document, and says so in an eslint-disable comment.
    'tree-scoped-ids': {
      meta: {
        type: 'problem',
        messages: {
          lookup:
            "Look the ID up in the referring element's own tree with helpers.getElementByIdInTree(el, id): a document lookup misses a shadow root's elements and finds the page's from inside one.",
          from: 'Pass the element carrying the reference as the fourth argument, so the IDs resolve in its own tree.'
        }
      },
      create(context) {
        const IDREF_HELPERS = /^(resolveIdRefs|getTextFromIdRefs|getTextFromIdRefsIdrefEligible)$/;
        return {
          CallExpression(node) {
            const c = node.callee;
            const name =
              c.type === 'MemberExpression' && !c.computed
                ? c.property.name
                : c.type === 'Identifier'
                  ? c.name
                  : '';
            const args = node.arguments;
            if (
              name === 'getElementById' &&
              c.type === 'MemberExpression' &&
              c.object.type === 'Identifier' &&
              c.object.name === 'dom' &&
              args[0] &&
              args[0].type === 'Identifier' &&
              args[0].name === 'document'
            ) {
              context.report({ node, messageId: 'lookup' });
            } else if (IDREF_HELPERS.test(name) && args.length < 4) {
              context.report({ node, messageId: 'from' });
            }
          }
        };
      }
    },
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
    // Rules only: the shared helpers define the role and ID resolution.
    files: ['src/checks/**/*.js', 'profiles/*/rules/**/*.js'],
    plugins: { 'safe-dom': safeDomPlugin },
    rules: { 'safe-dom/no-raw-role': 'error', 'safe-dom/tree-scoped-ids': 'error' }
  },
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'cross-engine-report/**',
      // Audit probe scripts: throwaway code kept as evidence, never shipped or run in CI.
      'audits/**',
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
