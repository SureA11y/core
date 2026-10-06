/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Which member expressions must go through the safe DOM accessors
 * (src/core/safe-dom.js). Shared by the rewrite in use-safe-dom.js and the
 * lint rule in eslint.config.js, so the two always agree.
 *
 * A member is unsafe when it reads a DOM-only name (SAFE_DOM_GETTERS or
 * SAFE_DOM_METHODS) by dot notation. Reading one of those names off `dom`
 * itself is the accessor, and a few engine objects that happen to share a
 * name are left alone for readability (the accessors would read them the
 * ordinary way anyway).
 */

const { SAFE_DOM_GETTERS, SAFE_DOM_METHODS } = require('../../src/core/safe-dom');

const NAMES = new Set([...SAFE_DOM_GETTERS, ...SAFE_DOM_METHODS]);

// Identifiers that never hold a DOM node: the accessor object, the rule
// context and engine-owned records whose fields share a DOM name.
const NOT_DOM = new Set(['dom', 'ctx', 'helpers', 'Object', 'Reflect', 'env', 'pending']);

function rootIdentifier(node) {
  let n = node;
  while (n && n.type === 'MemberExpression') n = n.object;
  return n && n.type === 'Identifier' ? n.name : null;
}

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

module.exports = { isUnsafeDomMember, NAMES };
