'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const { createDomHelpers } = require('../../src/core/dom-helpers.js');

// Regression test for a bug in the shared composedParent primitive (used by
// contrast-helpers.js's ancestor-background walk and every rule that climbs
// the flat/composed tree, e.g. aria-required-parent.js, aria-hidden-focus.js):
// it checked `n.parentNode` before `n.assignedSlot`. parentNode is
// unaffected by slot distribution and stays truthy for any normally-
// connected slotted element, so the assignedSlot branch was effectively
// dead code: composedParent silently returned the same thing as
// parentElement for the single most common shadow-DOM pattern (a light-DOM
// child distributed into a shadow tree via <slot>), never actually reaching
// the shadow-tree container the element is really rendered inside.
test('composedParent: assignedSlot wins over parentNode for a connected slotted element', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body><div id="host"><span id="slotted">hi</span></div></body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;
  const host = document.getElementById('host');
  const slotted = document.getElementById('slotted');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<div id="wrap"><slot></slot></div>`;

  // Sanity check on the DOM itself: parentNode/parentElement stay the raw
  // light-DOM parent regardless of slot assignment, which is exactly why
  // checking parentNode first was wrong.
  assert.strictEqual(slotted.parentElement, host);
  assert.strictEqual(slotted.assignedSlot.tagName, 'SLOT');

  const helpers = createDomHelpers({ window, document, root: document });
  const parent = helpers.composedParent(slotted);
  assert.strictEqual(
    parent,
    slotted.assignedSlot,
    'composedParent should follow the slot, not parentNode'
  );
  assert.strictEqual(parent.parentElement && parent.parentElement.id, 'wrap');
});

test('composedParent: falls back to parentNode for a non-slotted element (no regression for the ordinary case)', () => {
  const dom = new JSDOM(
    `<!doctype html><html><body><div id="parent"><span id="child">hi</span></div></body></html>`,
    { pretendToBeVisual: true }
  );
  const { window } = dom;
  const { document } = window;
  const child = document.getElementById('child');

  const helpers = createDomHelpers({ window, document, root: document });
  assert.strictEqual(helpers.composedParent(child), document.getElementById('parent'));
});

test("composedParent: falls back to the shadow host when a node has no parentNode/assignedSlot (a shadow root's own direct child)", () => {
  const dom = new JSDOM(`<!doctype html><html><body><div id="host"></div></body></html>`, {
    pretendToBeVisual: true
  });
  const { window } = dom;
  const { document } = window;
  const host = document.getElementById('host');
  const shadow = host.attachShadow({ mode: 'open' });
  const inner = document.createElement('div');
  shadow.appendChild(inner);

  const helpers = createDomHelpers({ window, document, root: document });
  // inner.parentNode is the ShadowRoot itself (nodeType 11), not an Element,
  // callers are expected to skip non-Element nodes and keep climbing; one
  // more composedParent call from there reaches the shadow host.
  const shadowRootNode = helpers.composedParent(inner);
  assert.strictEqual(shadowRootNode, shadow);
  assert.strictEqual(helpers.composedParent(shadowRootNode), host);
});
