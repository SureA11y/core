'use strict';

// Rules read shadow DOM as the page renders it. List and nesting rules
// follow the flat tree: an element slotted into a shadow tree sits where its
// slot is, which is what Chromium's accessibility tree shows.

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

test('list-children-valid: white-space text in the host keeps the fallback from rendering', () => {
  // Any assigned node, text included, hides a slot's fallback content, as
  // in browsers: the fallback <div> is not rendered here.
  const r = run('list-children-valid', '<div id="h"> </div>', (doc) =>
    shadow(doc, 'h', '<ul><li>Own</li><slot><div>Fallback</div></slot></ul>')
  );
  assert.strictEqual(r.outcome, 'pass');
});

// The definition list rules read the flat tree too (#119).

test('definition-list-children-valid: a shadow <dl> whose slot takes <dt>/<dd> passes', () => {
  for (const shadowHtml of ['<dl><slot></slot></dl>', '<dl><div><slot></slot></div></dl>']) {
    const r = run(
      'definition-list-children-valid',
      '<div id="h"><dt>Term</dt><dd>Definition</dd></div>',
      (doc) => shadow(doc, 'h', shadowHtml)
    );
    assert.strictEqual(r.outcome, 'pass', shadowHtml);
  }
});

test('definition-list-children-valid: a named slot is read as well', () => {
  const r = run(
    'definition-list-children-valid',
    '<div id="h"><dt slot="i">Term</dt><dd slot="i">Definition</dd></div>',
    (doc) => shadow(doc, 'h', '<dl><slot name="i"></slot></dl>')
  );
  assert.strictEqual(r.outcome, 'pass');
});

test('definition-list-children-valid: a <p> slotted into a shadow <dl> fails', () => {
  const r = run(
    'definition-list-children-valid',
    '<div id="h"><dt>Term</dt><dd>Definition</dd><p>Note</p></div>',
    (doc) => shadow(doc, 'h', '<dl><slot></slot></dl>')
  );
  assert.strictEqual(r.outcome, 'fail');
});

test('definition-list-children-valid: text slotted into a shadow <dl> fails', () => {
  const r = run(
    'definition-list-children-valid',
    '<div id="h"><dt>Term</dt><dd>Definition</dd>Loose text</div>',
    (doc) => shadow(doc, 'h', '<dl><slot></slot></dl>')
  );
  assert.strictEqual(r.outcome, 'fail');
});

test('definition-list-children-valid: an empty slot stands for its fallback content', () => {
  const r = run('definition-list-children-valid', '<div id="h"></div>', (doc) =>
    shadow(doc, 'h', '<dl><slot><dt>Term</dt><dd>Definition</dd></slot></dl>')
  );
  assert.strictEqual(r.outcome, 'pass');
});

test('definition-list-children-valid: a custom element between the <dl> and its items is a child', () => {
  const r = run(
    'definition-list-children-valid',
    '<dl><x-group id="h"><dt>Term</dt><dd>Definition</dd></x-group></dl>',
    (doc) => shadow(doc, 'h', '<slot></slot>')
  );
  assert.strictEqual(r.outcome, 'fail');
});

test('dlitem-parent-valid: a <dt>/<dd> slotted into a shadow <dl> is in that list', () => {
  for (const shadowHtml of ['<dl><slot></slot></dl>', '<dl><div><slot></slot></div></dl>']) {
    const r = run(
      'dlitem-parent-valid',
      '<div id="h"><dt>Term</dt><dd>Definition</dd></div>',
      (doc) => shadow(doc, 'h', shadowHtml)
    );
    assert.strictEqual(r.outcome, 'pass', shadowHtml);
  }
});

test('dlitem-parent-valid: a <dt>/<dd> slotted into a shadow <div> still fails', () => {
  const r = run(
    'dlitem-parent-valid',
    '<div id="h"><dt>Term</dt><dd>Definition</dd></div>',
    (doc) => shadow(doc, 'h', '<div><slot></slot></div>')
  );
  assert.strictEqual(r.outcome, 'fail');
  assert.strictEqual(r.selectors.length, 2);
});

test('dlitem-parent-valid: a <dt>/<dd> no slot takes is not rendered and is left out', () => {
  const r = run(
    'dlitem-parent-valid',
    '<div id="h"><dt>Term</dt><dd>Definition</dd></div>',
    (doc) => shadow(doc, 'h', '<dl><dt>Own</dt><dd>Own definition</dd></dl>')
  );
  assert.strictEqual(r.outcome, 'pass');
  assert.deepStrictEqual(r.selectors, []);
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

// ID references resolve in the referring element's own tree (its shadow root
// or the document), as Chromium resolves them.

test('aria-valid-attr-value: an IDREF to an id in the same shadow root resolves', () => {
  const r = run('aria-valid-attr-value', '<div id="h"></div>', (doc) =>
    shadow(doc, 'h', '<span id="in">In shadow</span><button aria-labelledby="in">x</button>')
  );
  assert.strictEqual(r.outcome, 'pass');
});

test('aria-valid-attr-value: an IDREF from a shadow root to a light-DOM id resolves to nothing', () => {
  const r = run('aria-valid-attr-value', '<span id="light">Light</span><div id="h"></div>', (doc) =>
    shadow(
      doc,
      'h',
      '<div role="combobox" tabindex="0" aria-expanded="true" aria-activedescendant="light">c</div>'
    )
  );
  assert.strictEqual(r.outcome, 'fail');
});
