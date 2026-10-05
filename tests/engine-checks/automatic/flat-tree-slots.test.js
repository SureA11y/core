'use strict';

// List and nesting rules read the flat tree, as the page renders it: an
// element slotted into a shadow tree sits where its slot is, which is what
// Chromium's accessibility tree shows.

const test = require('node:test');
const assert = require('node:assert');

const { createDom, runa11yCoreOnDom } = require('../../helpers/runa11yCoreOnHtml');

function run(ruleId, bodyHtml, build) {
  const dom = createDom(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${bodyHtml}</body></html>`
  );
  build(dom.window.document);
  const rule = runa11yCoreOnDom(dom, { runOnly: [ruleId] }).checksResults.find(
    (r) => r.ruleId === ruleId
  );
  return { outcome: rule.outcome, selectors: (rule.occurrences || []).map((o) => o.selector) };
}

const shadow = (doc, id, html) => {
  doc.getElementById(id).attachShadow({ mode: 'open' }).innerHTML = html;
};

test('listitem-parent-valid: an <li> slotted into a shadow <ul> is in that list', () => {
  const r = run('listitem-parent-valid', '<div id="h"><li>One</li><li>Two</li></div>', (doc) =>
    shadow(doc, 'h', '<ul><slot></slot></ul>')
  );
  assert.strictEqual(r.outcome, 'pass');
});

test('listitem-parent-valid: an <li> slotted into a shadow <div> still fails', () => {
  const r = run('listitem-parent-valid', '<div id="h"><li id="stray">Stray</li></div>', (doc) =>
    shadow(doc, 'h', '<div><slot></slot></div>')
  );
  assert.strictEqual(r.outcome, 'fail');
  assert.strictEqual(r.selectors.length, 1);
});

test('listitem-parent-valid: an <li> no slot takes is not rendered and is left out', () => {
  const r = run('listitem-parent-valid', '<div id="h"><li>Unslotted</li></div>', (doc) =>
    shadow(doc, 'h', '<p>No slot</p>')
  );
  assert.strictEqual(r.outcome, 'notApplicable');
});

test('list-children-valid: a shadow <ul> whose slot takes <li> elements passes', () => {
  const r = run('list-children-valid', '<div id="h"><li>One</li><li>Two</li></div>', (doc) =>
    shadow(doc, 'h', '<ul><slot></slot></ul>')
  );
  assert.strictEqual(r.outcome, 'pass');
});

test('list-children-valid: a shadow <ul> whose slot takes a <div> fails', () => {
  const r = run('list-children-valid', '<div id="h"><div>Not an item</div></div>', (doc) =>
    shadow(doc, 'h', '<ul><slot></slot></ul>')
  );
  assert.strictEqual(r.outcome, 'fail');
});

test('list-children-valid: an empty slot stands for its fallback content', () => {
  const r = run('list-children-valid', '<div id="h"></div>', (doc) =>
    shadow(doc, 'h', '<ul><slot><li>Fallback</li></slot></ul>')
  );
  assert.strictEqual(r.outcome, 'pass');
});

test('nested-interactive-controls-absent: a link slotted into a shadow <button> is nested in it', () => {
  const r = run(
    'nested-interactive-controls-absent',
    '<div id="h"><a href="/n">Nested link</a></div>',
    (doc) => shadow(doc, 'h', '<button><slot></slot></button>')
  );
  assert.strictEqual(r.outcome, 'fail');
});

test('nested-interactive-controls-absent: a button whose shadow tree slots nothing interactive passes', () => {
  const r = run(
    'nested-interactive-controls-absent',
    '<div id="h"><span>Text</span></div>',
    (doc) => shadow(doc, 'h', '<button><slot></slot></button>')
  );
  assert.strictEqual(r.outcome, 'pass');
});
