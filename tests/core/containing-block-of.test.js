'use strict';

/**
 * helpers.containingBlockOf: the box an element's position is resolved
 * against, and whose overflow can clip it (CSS Position 3, CSS Overflow 3).
 * text-spacing-content-loss and target-size-minimum walk this chain to find
 * what clips an element (#110).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { createDomHelpers } = require('../../src/core/dom-helpers.js');

function setup(body) {
  const { window } = new JSDOM(`<!doctype html><html><body>${body}</body></html>`);
  const document = window.document;
  const helpers = createDomHelpers({ window, document, root: document });
  return { document, cb: (id) => helpers.containingBlockOf(document.getElementById(id)) };
}

test('an element in flow is held by its parent box', () => {
  const { document, cb } = setup('<div id="outer"><p id="p"><span id="s">x</span></p></div>');
  assert.equal(cb('s'), document.getElementById('p'));
  assert.equal(cb('p'), document.getElementById('outer'));
});

test('a box with display: contents is passed over', () => {
  const { document, cb } = setup(
    '<div id="outer"><div style="display:contents"><span id="s">x</span></div></div>'
  );
  assert.equal(cb('s'), document.getElementById('outer'));
});

test('an absolutely positioned box is held by its nearest positioned ancestor', () => {
  const { document, cb } = setup(
    '<div id="rel" style="position:relative"><div id="clip" style="overflow:hidden"><div id="pop" style="position:absolute">x</div></div></div>'
  );
  assert.equal(cb('pop'), document.getElementById('rel'));
});

test('a transformed or contained ancestor holds absolutely positioned and fixed boxes', () => {
  for (const style of [
    'transform:translateX(0)',
    'contain:paint',
    'filter:blur(0)',
    'will-change:transform'
  ]) {
    const { document, cb } = setup(
      `<div id="holder" style="${style}"><div id="abs" style="position:absolute">x</div><div id="fix" style="position:fixed">y</div></div>`
    );
    assert.equal(cb('abs'), document.getElementById('holder'), style);
    assert.equal(cb('fix'), document.getElementById('holder'), style);
  }
});

test('a fixed box with no such ancestor is held by the viewport', () => {
  const { cb } = setup(
    '<div style="position:relative;overflow:hidden"><div id="fix" style="position:fixed">x</div></div>'
  );
  assert.equal(cb('fix'), null);
});
