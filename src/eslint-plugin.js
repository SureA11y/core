/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @surea11y/core/eslint-plugin: the lint rules core's own rules are held to,
 * for a pack's rules (or any rule's). The engine runs a rule on pages it
 * doesn't control, so:
 *
 * - use-safe-dom: DOM properties are read through ctx.helpers.dom, since a
 *   named form control or image overrides a form's or the document's own
 *   ([LegacyOverrideBuiltIns]).
 * - no-raw-role: the role attribute is resolved with
 *   helpers.aria.getExplicitRole and selected with [role~="x" i], since it is
 *   a fallback list read in any case.
 * - tree-scoped-ids: an ID reference is looked up in the referring element's
 *   own tree, its shadow root or its document.
 * - self-contained: runInPage and applicability read nothing defined outside
 *   them, since a page gets each of them alone, as its source.
 *
 * ```js
 * // eslint.config.js
 * const safeDom = require('@surea11y/core/eslint-plugin');
 * module.exports = [{ files: ['rules/**'], ...safeDom.configs.recommended }];
 * ```
 *
 * A read the rules flag that is right says why in an eslint-disable comment
 * (`// eslint-disable-next-line safe-dom/no-raw-role -- text for a message`).
 */

const { version } = require('../package.json');
const { SAFE_DOM_GETTERS, SAFE_DOM_METHODS } = require('./core/safe-dom');

// Which member expressions must go through the safe DOM accessors
// (src/core/safe-dom.js): a DOM-only name (SAFE_DOM_GETTERS or
// SAFE_DOM_METHODS) read by dot notation. Reading one of those names off
// `dom` itself is the accessor, and a few engine objects that happen to share
// a name are left alone for readability (the accessors would read them the
// ordinary way anyway). scripts/codemods/use-safe-dom.js rewrites by the same
// test, so the two always agree.
const NAMES = new Set([...SAFE_DOM_GETTERS, ...SAFE_DOM_METHODS]);

// Identifiers that never hold a DOM node: the accessor object, the rule
// context and engine-owned records whose fields share a DOM name.
const NOT_DOM = new Set(['dom', 'ctx', 'helpers', 'Object', 'Reflect', 'env', 'pending']);

function rootIdentifier(node) {
  let n = node;
  while (n && n.type === 'MemberExpression') n = n.object;
  return n && n.type === 'Identifier' ? n.name : null;
}

// The safe accessors, by any name a rule reaches them: dom, helpers.dom,
// ctx.helpers.dom.
const isDomAccessor = (n) =>
  !!n &&
  ((n.type === 'Identifier' && n.name === 'dom') ||
    (n.type === 'MemberExpression' && !n.computed && n.property && n.property.name === 'dom'));

// A document as a rule names it: document, or ctx.document.
const isDocument = (n) =>
  !!n &&
  ((n.type === 'Identifier' && n.name === 'document') ||
    (n.type === 'MemberExpression' && !n.computed && n.property && n.property.name === 'document'));

function isUnsafeDomMember(node) {
  if (!node || node.type !== 'MemberExpression' || node.computed) return false;
  if (!node.property || node.property.type !== 'Identifier') return false;
  if (!NAMES.has(node.property.name)) return false;
  const obj = node.object;
  if (obj.type === 'Identifier' && NOT_DOM.has(obj.name)) return false;
  if (obj.type === 'MemberExpression' && NOT_DOM.has(rootIdentifier(obj))) {
    // ctx.helpers.x, but not ctx.document.body: the document is a node.
    if (!(obj.type === 'MemberExpression' && !obj.computed && obj.property.name === 'document'))
      return false;
  }
  return true;
}

const plugin = {
  meta: { name: '@surea11y/core/eslint-plugin', version },
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
            const viaDom = c.type === 'MemberExpression' && isDomAccessor(c.object);
            if (
              viaDom || c.type === 'Identifier' ? isRoleLiteral(args[1]) : isRoleLiteral(args[0])
            ) {
              context.report({ node, messageId: 'read' });
            }
          },
          Literal(node) {
            if (typeof node.value !== 'string') return;
            // Text under a property is for people (a title, a summary, what a
            // question needs), unless the key names a selector.
            const p = node.parent;
            if (
              p &&
              p.type === 'Property' &&
              p.value === node &&
              p.key &&
              !/selector|query|css/i.test(String(p.key.name || p.key.value || ''))
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
              ((isDomAccessor(c.object) && isDocument(args[0])) || isDocument(c.object))
            ) {
              context.report({ node, messageId: 'lookup' });
            } else if (IDREF_HELPERS.test(name) && args.length < 4) {
              context.report({ node, messageId: 'from' });
            }
          }
        };
      }
    },
    'self-contained': {
      meta: {
        type: 'problem',
        messages: {
          outside:
            '{{fn}} reads "{{name}}", defined outside it: a page gets the rule\'s code alone, where "{{name}}" is not defined. Define it inside {{fn}}.'
        }
      },
      create(context) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const PAGE_CODE = new Set(['runInPage', 'applicability']);
        const isFunction = (n) =>
          !!n && (n.type === 'FunctionExpression' || n.type === 'ArrowFunctionExpression');
        const keyName = (key) =>
          key && (key.type === 'Identifier' ? key.name : key.type === 'Literal' ? key.value : null);
        // What the function reads that resolves to a binding of the file
        // outside it; globals (window, document) have no definition here.
        function check(fn, fnName) {
          const scope = sourceCode.getScope ? sourceCode.getScope(fn) : context.getScope();
          const seen = new Set();
          for (const ref of scope.through) {
            const variable = ref.resolved;
            if (!variable || !variable.defs.length || seen.has(variable.name)) continue;
            if (variable.name === fnName) continue;
            seen.add(variable.name);
            context.report({
              node: ref.identifier,
              messageId: 'outside',
              data: { fn: fnName, name: variable.name }
            });
          }
        }
        return {
          FunctionDeclaration(node) {
            if (node.id && PAGE_CODE.has(node.id.name)) check(node, node.id.name);
          },
          VariableDeclarator(node) {
            if (
              node.id.type === 'Identifier' &&
              PAGE_CODE.has(node.id.name) &&
              isFunction(node.init)
            )
              check(node.init, node.id.name);
          },
          Property(node) {
            const name = keyName(node.key);
            if (PAGE_CODE.has(name) && isFunction(node.value)) check(node.value, name);
          },
          MethodDefinition(node) {
            const name = keyName(node.key);
            if (PAGE_CODE.has(name)) check(node.value, name);
          }
        };
      }
    },
    'use-safe-dom': {
      meta: {
        type: 'problem',
        messages: {
          direct:
            'Read "{{name}}" through the safe DOM accessors (dom.{{name}}(…), dom.get or dom.call): a named form control or image can override it.'
        }
      },
      create(context) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        // A variable made from an object or array literal holds no DOM node:
        // its .children or .tagName are its own.
        const isPlainValue = (node) => {
          let n = node;
          while (n && n.type === 'MemberExpression') n = n.object;
          if (!n || n.type !== 'Identifier') return false;
          let scope = sourceCode.getScope ? sourceCode.getScope(node) : context.getScope();
          for (; scope; scope = scope.upper) {
            const v = scope.set && scope.set.get(n.name);
            if (!v) continue;
            const def = v.defs[0];
            const init = def && def.node && def.node.init;
            return !!init && (init.type === 'ObjectExpression' || init.type === 'ArrayExpression');
          }
          return false;
        };
        const fromNotDom = (n) =>
          !!n &&
          ((n.type === 'Identifier' && NOT_DOM.has(n.name)) ||
            (n.type === 'MemberExpression' && NOT_DOM.has(rootIdentifier(n))));
        return {
          MemberExpression(node) {
            // Writes are left alone, as the rewrite leaves them: the engine
            // only writes to elements it created itself.
            const parent = node.parent;
            if (parent && parent.type === 'AssignmentExpression' && parent.left === node) return;
            if (isUnsafeDomMember(node) && !isPlainValue(node)) {
              context.report({ node, messageId: 'direct', data: { name: node.property.name } });
            }
          },
          // const { parentNode } = el reads el.parentNode as a dot does.
          VariableDeclarator(node) {
            if (!node.id || node.id.type !== 'ObjectPattern' || !node.init) return;
            if (fromNotDom(node.init) || isPlainValue(node.init)) return;
            if (node.init.type === 'ObjectExpression') return;
            for (const prop of node.id.properties) {
              if (prop.type !== 'Property' || prop.computed || !prop.key) continue;
              const name = prop.key.name || prop.key.value;
              if (NAMES.has(name))
                context.report({ node: prop, messageId: 'direct', data: { name } });
            }
          }
        };
      }
    }
  }
};

// The four rules as errors, under the plugin name the eslint-disable
// comments use. Every file it is given is taken to be a rule.
plugin.configs = {
  recommended: {
    plugins: { 'safe-dom': plugin },
    rules: {
      'safe-dom/use-safe-dom': 'error',
      'safe-dom/no-raw-role': 'error',
      'safe-dom/tree-scoped-ids': 'error',
      'safe-dom/self-contained': 'error'
    }
  }
};

module.exports = plugin;
module.exports.isUnsafeDomMember = isUnsafeDomMember;
module.exports.NAMES = NAMES;
