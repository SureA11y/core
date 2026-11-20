'use strict';

/**
 * evidenceState (src/core/evidence-state.js): puts a page in the state a
 * finding was made in, and takes it out again, for a binding's screenshots.
 * Run in jsdom, as a page runs it: its source evaluated in the window. That
 * it applies what text-spacing-content-loss applies, and that the browser
 * paints it, is tested in Chromium, in
 * engine-checks/evidence-state-chromium.test.js.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const core = require('../../src/index.js');
const { evidenceState, EVIDENCE_STATES } = require('../../src/core/evidence-state.js');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml');

const KEY = Symbol.for('surea11y.evidenceStates');

// A page with evidenceState as a driver sends it: its source, evaluated there.
function page(head = '') {
  const dom = new JSDOM(
    `<!doctype html><html lang="en"><head>${head}<title>t</title></head><body><p>Text</p></body></html>`,
    { runScripts: 'outside-only' }
  );
  const fn = dom.window.eval(`(${evidenceState.toString()})`);
  return { window: dom.window, document: dom.window.document, fn };
}

const added = (document) => document.querySelectorAll('style[data-surea11y]');

test('the package exports it, and the states it knows', () => {
  assert.equal(core.evidenceState, evidenceState);
  assert.deepEqual(core.EVIDENCE_STATES, ['text-spacing']);
  assert.ok(Object.isFrozen(EVIDENCE_STATES));
});

test('apply adds the text spacing first in <head>, and release takes it out', () => {
  const { document, fn } = page('<style>p { color: red }</style>');
  const r = fn({ op: 'apply', state: 'text-spacing', token: 't1' });
  assert.deepEqual({ ...r }, { applied: true, via: 'style' });
  const sheets = added(document);
  assert.equal(sheets.length, 1);
  assert.equal(document.head.firstChild, sheets[0]);
  assert.equal(sheets[0].getAttribute('data-surea11y'), 'surea11y-text-spacing');
  assert.match(sheets[0].textContent, /^@layer surea11y-text-spacing \{/);
  assert.match(sheets[0].textContent, /letter-spacing: 0\.12em !important/);

  assert.deepEqual({ ...fn({ op: 'release', token: 't1' }) }, { released: true });
  assert.equal(added(document).length, 0);
  // A token it no longer holds.
  assert.deepEqual({ ...fn({ op: 'release', token: 't1' }) }, { released: false });
});

test('a token applied again is released first, so one sheet is left to take out', () => {
  const { document, fn } = page();
  fn({ op: 'apply', state: 'text-spacing', token: 't' });
  fn({ op: 'apply', state: 'text-spacing', token: 't' });
  assert.equal(added(document).length, 1);
  fn({ op: 'release', token: 't' });
  assert.equal(added(document).length, 0);
});

test('tokens are apart: releasing one leaves the other applied', () => {
  const { document, fn } = page();
  fn({ op: 'apply', state: 'text-spacing', token: 'a' });
  fn({ op: 'apply', state: 'text-spacing', token: 'b' });
  assert.equal(added(document).length, 2);
  fn({ op: 'release', token: 'a' });
  assert.equal(added(document).length, 1);
  fn({ op: 'release', token: 'b' });
  assert.equal(added(document).length, 0);
});

test('an unknown state applies nothing', () => {
  const { document, window, fn } = page();
  assert.deepEqual(
    { ...fn({ op: 'apply', state: 'zoom', token: 't' }) },
    {
      applied: false,
      reason: 'unknown-state'
    }
  );
  // Not even a name the prototype chain has.
  assert.equal(fn({ op: 'apply', state: 'toString', token: 't' }).reason, 'unknown-state');
  assert.equal(added(document).length, 0);
  assert.equal(Object.prototype.hasOwnProperty.call(window, KEY), false);
});

test("the sheet is taken out even when the page's code breaks removing it", () => {
  const { document, window, fn } = page();
  fn({ op: 'apply', state: 'text-spacing', token: 't' });
  window.Node.prototype.removeChild = function () {
    throw new Error('page code');
  };
  assert.equal(fn({ op: 'release', token: 't' }).released, true);
  assert.equal(added(document).length, 0);
});

test('the page shadowing a DOM method by name changes nothing', () => {
  const { document, fn } = page();
  document.createElement = () => {
    throw new Error('page code');
  };
  document.head.insertBefore = () => {
    throw new Error('page code');
  };
  assert.equal(fn({ op: 'apply', state: 'text-spacing', token: 't' }).applied, true);
  assert.equal(added(document).length, 1);
  fn({ op: 'release', token: 't' });
  assert.equal(added(document).length, 0);
});

test('the window keeps what is applied out of sight', () => {
  const { window, fn } = page();
  fn({ op: 'apply', state: 'text-spacing', token: 't' });
  assert.equal(Object.keys(window).includes(KEY.toString()), false);
  const d = Object.getOwnPropertyDescriptor(window, KEY);
  assert.equal(d.enumerable, false);
  fn({ op: 'release', token: 't' });
});

test('a request it cannot read throws a TypeError', () => {
  const { fn } = page();
  for (const bad of [
    null,
    'apply',
    [],
    { op: 'show', token: 't' },
    { op: 'apply', state: 'text-spacing' },
    { op: 'apply', state: 'text-spacing', token: '' },
    { op: 'apply', token: 't' },
    { op: 'release' }
  ]) {
    assert.throws(
      () => fn(bad),
      (e) => e.name === 'TypeError',
      JSON.stringify(bad)
    );
  }
});

test('outside a page there is nothing to apply', () => {
  assert.deepEqual(evidenceState({ op: 'apply', state: 'text-spacing', token: 't' }), {
    applied: false,
    reason: 'no-document'
  });
  assert.deepEqual(evidenceState({ op: 'release', token: 't' }), { released: false });
});

test('a style sheet rule forcing the spacing names no state: the page shows it as it is', () => {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title><style>p { line-height: 1 !important }</style></head>' +
      '<body><main><h1>H</h1><p>Some text that wraps onto more than one line, or could.</p></main></body></html>',
    { runOnly: ['text-spacing-content-loss'] }
  );
  const check = result.checksResults.find((c) => c.ruleId === 'text-spacing-content-loss');
  const occ = check.occurrences.find((o) => o.data.details.reasonCode === 'STYLESHEET_IMPORTANT');
  assert.ok(occ, 'STYLESHEET_IMPORTANT is reported without a layout');
  assert.equal('evidenceState' in occ.data.details, false);
});
