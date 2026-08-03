'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createAriaHelpers } = require('../../src/core/aria-helpers.js');

// createAriaHelpers(opts, shared) -- opts.document/opts.root are used for
// idref existence checks and hasLandmarkScopingAncestor's scope bound;
// shared.trim mirrors dom-helpers.js's own trim (see other tests/core/*
// files for the same minimal-shared-object convention).
function helpersFor(html, { root } = {}) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  const shared = { trim: (v) => (v == null ? '' : String(v)).trim() };
  const helpers = createAriaHelpers({ window, document, root: root || document }, shared);
  return { helpers, document, window };
}

// ===== getExplicitRole / getAllRoleTokens =====

test('getExplicitRole: returns the lowercased first token of role=, empty string when absent', () => {
  const { helpers, document } = helpersFor(
    '<div id="a" role="Button extra"></div><div id="b"></div><div id="c" role="   "></div>'
  );
  assert.equal(helpers.getExplicitRole(document.getElementById('a')), 'button');
  assert.equal(helpers.getExplicitRole(document.getElementById('b')), '');
  assert.equal(helpers.getExplicitRole(document.getElementById('c')), '');
  assert.equal(helpers.getExplicitRole(null), '');
});

test('getAllRoleTokens: returns every lowercased space-separated token', () => {
  const { helpers, document } = helpersFor(
    '<div id="a" role="Tab Panel  extra"></div><div id="b"></div>'
  );
  assert.deepEqual(helpers.getAllRoleTokens(document.getElementById('a')), [
    'tab',
    'panel',
    'extra'
  ]);
  assert.deepEqual(helpers.getAllRoleTokens(document.getElementById('b')), []);
  assert.deepEqual(helpers.getAllRoleTokens(null), []);
});

// ===== role classification =====

test('isAbstractRole / isDeprecatedRole / isKnownRole / isValidConcreteRole', () => {
  const { helpers } = helpersFor('<div></div>');

  assert.equal(helpers.isAbstractRole('widget'), true);
  assert.equal(helpers.isAbstractRole('WIDGET'), true);
  assert.equal(helpers.isAbstractRole('button'), false);

  assert.equal(helpers.isDeprecatedRole('directory'), true);
  assert.equal(helpers.isDeprecatedRole('generic'), true);
  assert.equal(helpers.isDeprecatedRole('button'), false);

  assert.equal(helpers.isKnownRole('button'), true); // concrete
  assert.equal(helpers.isKnownRole('widget'), true); // abstract
  assert.equal(helpers.isKnownRole('not-a-role'), false);

  assert.equal(helpers.isValidConcreteRole('button'), true);
  assert.equal(helpers.isValidConcreteRole('widget'), false); // abstract, not concrete
  assert.equal(helpers.isValidConcreteRole('not-a-role'), false);
});

test('getDeprecatedRoleGuidance: role-specific message, generic fallback otherwise', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.match(helpers.getDeprecatedRoleGuidance('directory'), /role="list"/);
  assert.match(helpers.getDeprecatedRoleGuidance('GENERIC'), /user-agent-internal/);
  assert.equal(
    helpers.getDeprecatedRoleGuidance('not-deprecated'),
    'Replace the deprecated role with its recommended replacement.'
  );
});

// ===== ARIA attribute name/value-type lookups =====

test('isValidAriaAttrName / getAttrValueType', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.isValidAriaAttrName('aria-label'), true);
  assert.equal(helpers.isValidAriaAttrName('ARIA-LABEL'), true);
  assert.equal(helpers.isValidAriaAttrName('aria-not-real'), false);
  assert.equal(helpers.isValidAriaAttrName('role'), false);
  assert.equal(helpers.isValidAriaAttrName(''), false);

  assert.equal(helpers.getAttrValueType('aria-checked'), 'tristate');
  assert.equal(helpers.getAttrValueType('aria-not-real'), null);
});

// ===== validateAttrValue: one representative case per value type =====

test('validateAttrValue: unknown attribute is skipped (always valid)', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.deepEqual(helpers.validateAttrValue('aria-not-real', 'anything'), {
    valid: true,
    reason: 'unknown-attr-skip'
  });
});

test('validateAttrValue: boolean', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.validateAttrValue('aria-busy', 'true').valid, true);
  assert.equal(helpers.validateAttrValue('aria-busy', 'false').valid, true);
  const bad = helpers.validateAttrValue('aria-busy', 'yes');
  assert.equal(bad.valid, false);
  assert.equal(bad.reason, 'expected-true-false');
});

test('validateAttrValue: boolean-undefined', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.validateAttrValue('aria-expanded', 'true').valid, true);
  assert.equal(helpers.validateAttrValue('aria-expanded', 'undefined').valid, true);
  assert.equal(helpers.validateAttrValue('aria-expanded', '').valid, true);
  assert.equal(helpers.validateAttrValue('aria-expanded', 'nope').valid, false);
});

test('validateAttrValue: tristate', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.validateAttrValue('aria-checked', 'mixed').valid, true);
  assert.equal(helpers.validateAttrValue('aria-checked', 'maybe').valid, false);
});

test('validateAttrValue: integer', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.validateAttrValue('aria-level', '3').valid, true);
  assert.equal(helpers.validateAttrValue('aria-level', '-3').valid, true);
  assert.equal(helpers.validateAttrValue('aria-level', '3.5').valid, false);
  assert.equal(helpers.validateAttrValue('aria-level', 'three').valid, false);
});

test('validateAttrValue: number', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.validateAttrValue('aria-valuenow', '3.5').valid, true);
  assert.equal(helpers.validateAttrValue('aria-valuenow', '-2').valid, true);
  assert.equal(helpers.validateAttrValue('aria-valuenow', '').valid, false);
  assert.equal(helpers.validateAttrValue('aria-valuenow', 'nan-ish').valid, false);
});

test('validateAttrValue: token', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.validateAttrValue('aria-live', 'polite').valid, true);
  const bad = helpers.validateAttrValue('aria-live', 'loud');
  assert.equal(bad.valid, false);
  assert.equal(bad.reason, 'invalid-token');
});

test('validateAttrValue: token-list', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.equal(helpers.validateAttrValue('aria-relevant', 'additions text').valid, true);
  assert.equal(helpers.validateAttrValue('aria-relevant', '').valid, false);
  assert.equal(helpers.validateAttrValue('aria-relevant', 'additions bogus').valid, false);
});

test('validateAttrValue: idref requires format and existence', () => {
  const { helpers } = helpersFor('<div id="target"></div>');
  assert.deepEqual(helpers.validateAttrValue('aria-activedescendant', 'target'), {
    valid: true,
    reason: ''
  });
  assert.equal(helpers.validateAttrValue('aria-activedescendant', 'target extra').valid, false);
  assert.equal(
    helpers.validateAttrValue('aria-activedescendant', 'target extra').reason,
    'expected-single-idref'
  );
  assert.equal(helpers.validateAttrValue('aria-activedescendant', 'missing').valid, false);
  assert.equal(
    helpers.validateAttrValue('aria-activedescendant', 'missing').reason,
    'idref-not-found'
  );
});

test('validateAttrValue: an explicitly-empty idref value is valid (allowEmpty), not "expected-single-idref"', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.deepEqual(helpers.validateAttrValue('aria-activedescendant', ''), {
    valid: true,
    reason: ''
  });
});

test('validateAttrValue: idref-list is valid when at least one id resolves', () => {
  const { helpers } = helpersFor('<div id="a"></div>');
  assert.equal(helpers.validateAttrValue('aria-describedby', 'a missing').valid, true);
  assert.equal(helpers.validateAttrValue('aria-describedby', 'missing1 missing2').valid, false);
});

test('validateAttrValue: an explicitly-empty idref-list value is valid (allowEmpty), not "empty-idref-list"', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.deepEqual(helpers.validateAttrValue('aria-describedby', ''), {
    valid: true,
    reason: ''
  });
});

test('validateAttrValue: string type is always valid', () => {
  const { helpers } = helpersFor('<div></div>');
  assert.deepEqual(helpers.validateAttrValue('aria-label', 'anything at all'), {
    valid: true,
    reason: ''
  });
});

// ===== required attrs/owned-roles/context-roles lookups =====

test('getRequiredAttrsForRole / getRequiredOwnedRoles / getRequiredContextRoles', () => {
  const { helpers } = helpersFor('<div></div>');

  assert.deepEqual(helpers.getRequiredAttrsForRole('checkbox'), ['aria-checked']);
  assert.deepEqual(helpers.getRequiredAttrsForRole('button'), []);

  assert.deepEqual(helpers.getRequiredOwnedRoles('list'), ['listitem']);
  assert.equal(helpers.getRequiredOwnedRoles('button'), null);

  assert.deepEqual(helpers.getRequiredContextRoles('listitem'), ['list']);
  assert.deepEqual(helpers.getRequiredContextRoles('tabpanel'), []); // explicitly unconstrained, not absent
  assert.equal(helpers.getRequiredContextRoles('button'), null); // no entry at all
});

test('getRequiredOwnedRoles/getRequiredAttrsForRole return fresh copies, not live references', () => {
  const { helpers } = helpersFor('<div></div>');
  const first = helpers.getRequiredOwnedRoles('list');
  first.push('mutated');
  assert.deepEqual(helpers.getRequiredOwnedRoles('list'), ['listitem']);
});

// ===== getElementRoleKey's per-tag conditioning (internal-only -- exercised
// through isRoleAllowedOnElement/getNativeRoleForElement, its two exported
// callers) / getNativeRoleForElement / isRoleAllowedOnElement =====

test('element-role-key conditioning: a/area href', () => {
  const { helpers, document } = helpersFor(
    '<a id="a1" href="/x"></a><a id="a2"></a><area id="ar1" href="/x"></area><area id="ar2"></area>'
  );
  // a[href]: allowed-roles list applies (button is listed, group is not)
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('a1'), 'button').allowed,
    true
  );
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('a1'), 'group').allowed,
    false
  );
  // hrefless <a> has no key at all -- unconstrained
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('a2'), 'group').constrained,
    false
  );
  // area[href]: empty allowed-roles list, only the native 'link' role is ok
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('ar1'), 'link').allowed,
    true
  );
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('ar1'), 'button').allowed,
    false
  );
  // hrefless <area>: its own 'area' key permits button/link
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('ar2'), 'button').allowed,
    true
  );
});

test('element-role-key conditioning: section named vs unnamed', () => {
  const { helpers, document } = helpersFor(
    '<section id="named" aria-label="x"></section><section id="unnamed"></section>'
  );
  // 'region' restates the native role only once the section has a name
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('named'), 'region').allowed,
    true
  );
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('unnamed'), 'region').allowed,
    false
  );
});

test('element-role-key conditioning: header top-level vs nested in sectioning content', () => {
  const { helpers, document } = helpersFor(
    '<header id="top"></header><article><header id="nested"></header></article>'
  );
  assert.equal(helpers.getNativeRoleForElement(document.getElementById('top')), 'banner');
  assert.equal(helpers.getNativeRoleForElement(document.getElementById('nested')), '');
});

test('element-role-key conditioning: header nested in a role-overridden non-scoping ancestor is still top-level', () => {
  // Regression for the tag-only ancestor-walk bug described in
  // hasLandmarkScopingAncestor's own header comment: an <aside role="dialog">
  // no longer counts as scoping once it has an explicit, non-scoping role.
  const { helpers, document } = helpersFor('<aside role="dialog"><header id="h"></header></aside>');
  assert.equal(helpers.getNativeRoleForElement(document.getElementById('h')), 'banner');
});

test('element-role-key conditioning: label associated vs unassociated', () => {
  const { helpers, document } = helpersFor(
    '<label id="assoc" for="inp">x</label><input id="inp"><label id="free">y</label>'
  );
  // label[associated] has an empty allowed-roles list and no native role
  assert.deepEqual(helpers.isRoleAllowedOnElement(document.getElementById('assoc'), 'button'), {
    constrained: true,
    allowed: false
  });
  // an unassociated <label> has no key at all -- unconstrained
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('free'), 'button').constrained,
    false
  );
});

test('element-role-key conditioning: img alt', () => {
  const { helpers, document } = helpersFor(
    '<img id="withAlt" alt="desc"><img id="emptyAlt" alt=""><img id="noAlt">'
  );
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('withAlt'), 'button').allowed,
    true
  );
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('emptyAlt'), 'button').allowed,
    false
  );
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('noAlt'), 'button').allowed,
    false
  );
});

test('element-role-key conditioning: input type / checkbox[aria-pressed]', () => {
  const { helpers, document } = helpersFor(
    '<input id="cb" type="checkbox"><input id="cbPressed" type="checkbox" aria-pressed="false">' +
      '<input id="txt" type="text"><input id="untyped">'
  );
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('cb'), 'button').allowed,
    false
  );
  assert.equal(
    helpers.isRoleAllowedOnElement(document.getElementById('cbPressed'), 'button').allowed,
    true
  );
  assert.equal(helpers.getNativeRoleForElement(document.getElementById('txt')), 'textbox');
  // no type attribute defaults to type=text
  assert.equal(helpers.getNativeRoleForElement(document.getElementById('untyped')), 'textbox');
});

test('element-role-key conditioning: select multiple/size', () => {
  const { helpers, document } = helpersFor(
    '<select id="plain"></select><select id="multi" multiple></select><select id="sized" size="4"></select>' +
      '<select id="size1" size="1"></select>'
  );
  assert.equal(helpers.getNativeRoleForElement(document.getElementById('plain')), 'combobox');
  assert.equal(helpers.getNativeRoleForElement(document.getElementById('multi')), 'listbox');
  assert.equal(helpers.getNativeRoleForElement(document.getElementById('sized')), 'listbox');
  assert.equal(helpers.getNativeRoleForElement(document.getElementById('size1')), 'combobox');
});

test('getNativeRoleForElement: unconstrained/keyless elements and non-elements return empty', () => {
  const { helpers, document } = helpersFor('<p id="p"></p>');
  assert.equal(helpers.getNativeRoleForElement(document.getElementById('p')), '');
  assert.equal(helpers.getNativeRoleForElement(null), '');
});

test('isRoleAllowedOnElement: unconstrained element/role', () => {
  const { helpers, document } = helpersFor('<p id="p"></p>');
  assert.deepEqual(helpers.isRoleAllowedOnElement(document.getElementById('p'), 'button'), {
    constrained: false,
    allowed: true
  });
});

test('isRoleAllowedOnElement: null allowed-list means any role is permitted', () => {
  const { helpers, document } = helpersFor('<table id="t"></table>');
  assert.deepEqual(helpers.isRoleAllowedOnElement(document.getElementById('t'), 'navigation'), {
    constrained: true,
    allowed: true
  });
});

test('isRoleAllowedOnElement: restating the native role is always allowed', () => {
  const { helpers, document } = helpersFor('<a id="a" href="/x"></a>');
  assert.deepEqual(helpers.isRoleAllowedOnElement(document.getElementById('a'), 'link'), {
    constrained: true,
    allowed: true
  });
});

test('isRoleAllowedOnElement: role present in the allowed-roles array', () => {
  const { helpers, document } = helpersFor('<a id="a" href="/x"></a>');
  assert.deepEqual(helpers.isRoleAllowedOnElement(document.getElementById('a'), 'button'), {
    constrained: true,
    allowed: true
  });
});

test('isRoleAllowedOnElement: role not in the allowed-roles array is rejected', () => {
  // Regression for the "a[href] with role=group" bug documented in
  // ALLOWED_ROLES_BY_ELEMENT's own header comment.
  const { helpers, document } = helpersFor('<a id="a" href="/x"></a>');
  assert.deepEqual(helpers.isRoleAllowedOnElement(document.getElementById('a'), 'group'), {
    constrained: true,
    allowed: false
  });
});

test('isRoleAllowedOnElement: empty allowed-roles array (e.g. <picture>) rejects every override role', () => {
  const { helpers, document } = helpersFor('<picture id="pic"></picture>');
  assert.deepEqual(helpers.isRoleAllowedOnElement(document.getElementById('pic'), 'presentation'), {
    constrained: true,
    allowed: false
  });
});

// ===== getContainmentRole =====

test('getContainmentRole: explicit valid concrete role wins', () => {
  const { helpers, document } = helpersFor('<div id="d" role="row"></div>');
  assert.equal(helpers.getContainmentRole(document.getElementById('d')), 'row');
});

test('getContainmentRole: an invalid/unrecognized explicit role is transparent, falls through to native mapping', () => {
  // Regression for the tabulator.info role="columngroup" false-positive
  // described in this function's own header comment.
  const { helpers, document } = helpersFor(
    '<table><tbody><tr id="tr" role="columngroup"></tr></tbody></table>'
  );
  assert.equal(helpers.getContainmentRole(document.getElementById('tr')), 'row');
});

test('getContainmentRole: input[type] uses its own containment mapping', () => {
  const { helpers, document } = helpersFor('<input id="r" type="radio"><input id="t" type="text">');
  assert.equal(helpers.getContainmentRole(document.getElementById('r')), 'radio');
  assert.equal(helpers.getContainmentRole(document.getElementById('t')), '');
});

test('getContainmentRole: plain tag lookup and default empty string', () => {
  const { helpers, document } = helpersFor('<ul id="ul"></ul><span id="s"></span>');
  assert.equal(helpers.getContainmentRole(document.getElementById('ul')), 'list');
  assert.equal(helpers.getContainmentRole(document.getElementById('s')), '');
  assert.equal(helpers.getContainmentRole(null), '');
});

// ===== hasLandmarkScopingAncestor =====

test('hasLandmarkScopingAncestor: true for a plain sectioning-content ancestor tag', () => {
  const { helpers, document } = helpersFor('<article><div id="d"></div></article>');
  assert.equal(helpers.hasLandmarkScopingAncestor(document.getElementById('d')), true);
});

test('hasLandmarkScopingAncestor: false once the ancestor has a non-scoping explicit role', () => {
  const { helpers, document } = helpersFor('<aside role="dialog"><div id="d"></div></aside>');
  assert.equal(helpers.hasLandmarkScopingAncestor(document.getElementById('d')), false);
});

test('hasLandmarkScopingAncestor: role-based scoping applies even off a non-sectioning tag', () => {
  const { helpers, document } = helpersFor('<div role="region"><div id="d"></div></div>');
  assert.equal(helpers.hasLandmarkScopingAncestor(document.getElementById('d')), true);
});

test('hasLandmarkScopingAncestor: main only counts when includeMain is passed', () => {
  const { helpers, document } = helpersFor('<main><div id="d"></div></main>');
  const d = document.getElementById('d');
  assert.equal(helpers.hasLandmarkScopingAncestor(d), false);
  assert.equal(helpers.hasLandmarkScopingAncestor(d, { includeMain: true }), true);
});

test('hasLandmarkScopingAncestor: does not climb past the scanned root', () => {
  const dom = new JSDOM('<article><div id="scope"><div id="d"></div></div></article>', {
    pretendToBeVisual: true
  });
  const { document } = dom.window;
  const shared = { trim: (v) => (v == null ? '' : String(v)).trim() };
  const scope = document.getElementById('scope');
  const helpers = createAriaHelpers({ window: dom.window, document, root: scope }, shared);
  // <article> is outside the bounded root, so it must not count.
  assert.equal(helpers.hasLandmarkScopingAncestor(document.getElementById('d')), false);
});

test('hasLandmarkScopingAncestor: false for a non-element and for no scoping ancestor at all', () => {
  const { helpers, document } = helpersFor('<div id="d"></div>');
  assert.equal(helpers.hasLandmarkScopingAncestor(null), false);
  assert.equal(helpers.hasLandmarkScopingAncestor(document.getElementById('d')), false);
});
