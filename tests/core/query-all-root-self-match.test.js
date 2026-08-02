'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

// Regression test for a bug where queryAll/queryAllSmart could never match
// the root element itself, only its descendants — since querySelectorAll
// never returns its own context node. In the standard (unscoped) engine
// pipeline, `root` is `document.documentElement` (the <html> element), so
// any rule scanning by attribute selector (`[role]`, `[lang]`, etc.) was
// structurally blind to an issue asserted directly on <html> itself, no
// matter how correct that rule's own logic was. Found via a real page —
// news24.com's South Africa homepage, `<html role="document">`, which
// a widely-used reference engine correctly flags but aria-allowed-role
// couldn't reach at all before this fix.
test('queryAllSmart: matches the root element itself when it satisfies the selector', () => {
  const dom = new JSDOM(
    `<!doctype html><html lang="en" role="document"><body><div id="d"></div></body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;
  const root = document.documentElement;

  const helpers = createDomHelpers({ window, document, root });

  const roleMatches = helpers.queryAllSmart('[role]');
  assert.ok(
    roleMatches.includes(root),
    'root element itself should be included when it has [role]'
  );

  const langMatches = helpers.queryAllSmart('[lang]');
  assert.ok(
    langMatches.includes(root),
    'root element itself should be included when it has [lang]'
  );
});

test('queryAllSmart: still returns ordinary descendants when root itself does not match', () => {
  const dom = new JSDOM(
    `<!doctype html><html lang="en"><body><div id="d" role="button"></div></body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;
  const root = document.documentElement;

  const helpers = createDomHelpers({ window, document, root });

  const roleMatches = helpers.queryAllSmart('[role]');
  assert.equal(roleMatches.length, 1);
  assert.equal(roleMatches[0], document.getElementById('d'));
  assert.ok(
    !roleMatches.includes(root),
    'root itself has no role attribute here, so it should not appear'
  );
});

test('queryAllSmart: does not duplicate the root element in results', () => {
  const dom = new JSDOM(`<!doctype html><html role="document"><body></body></html>`, {
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;
  const root = document.documentElement;

  const helpers = createDomHelpers({ window, document, root });

  const roleMatches = helpers.queryAllSmart('[role]');
  assert.equal(roleMatches.length, 1, 'root should appear exactly once, not duplicated');
});

test('queryAllSmart: root-self-match honors includeShadowDom too (queryAllDeep path)', () => {
  const dom = new JSDOM(
    `<!doctype html><html role="document"><body><div id="host"></div></body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;
  const root = document.documentElement;
  const host = document.getElementById('host');
  const shadow = host.attachShadow({ mode: 'open' });
  const innerButton = document.createElement('button');
  innerButton.setAttribute('role', 'tab');
  shadow.appendChild(innerButton);

  const helpers = createDomHelpers({ window, document, root, includeShadowDom: true });

  const roleMatches = helpers.queryAllSmart('[role]');
  assert.ok(
    roleMatches.includes(root),
    'root element itself should still be included in the shadow-DOM-aware path'
  );
  assert.ok(roleMatches.includes(innerButton), 'shadow-DOM descendant should still be found');
});
