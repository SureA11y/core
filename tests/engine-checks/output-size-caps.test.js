'use strict';

/**
 * A finding's size doesn't grow with a value on the page. A selector is
 * built from an attribute value only up to 256 characters, and a longer
 * one gives way to the element's path, which still names it; label-in-name
 * cuts the label and the name it reports at 2,000 characters, as an
 * occurrence's html is cut, and its word lists at 200 words.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnHtml } = require('../../src/testing.js');
const { createDomHelpers } = require('../../src/core/dom-helpers.js');

const LONG = 'word '.repeat(400000); // 2 MB

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;

test('a long attribute value gives a short selector that still names the element', () => {
  for (const attr of ['aria-label', 'name', 'data-testid', 'id']) {
    for (const length of [256, 257, 2000000]) {
      const value = 'x'.repeat(length);
      const { window } = new JSDOM(
        page('<div><button>a</button></div><div><button>b</button></div>')
      );
      const { document } = window;
      const el = document.querySelectorAll('button')[1];
      el.setAttribute(attr, value);
      const helpers = createDomHelpers({ window, document, root: document });
      const selector = helpers.buildSelector(el);
      assert.deepEqual([...document.querySelectorAll(selector)], [el], `${attr} ${length}`);
      if (length > 256) assert.ok(selector.length < 200, `${attr} ${length}: ${selector.length}`);
      else assert.ok(selector.includes(value), `${attr} ${length}: anchored on the value`);
    }
  }
});

test('label-in-name reports a long name cut, as html is', () => {
  const html = page(`<a href="/" aria-label="${LONG}">Read more</a>`);
  const result = runa11yCoreOnHtml(html, { runOnly: ['label-in-name'] });
  const check = result.checksResults[0];
  assert.equal(check.outcome, 'fail');
  const [occ] = check.occurrences;
  const d = occ.data.details;
  assert.ok(occ.selector.length < 200, `selector of ${occ.selector.length}`);
  assert.equal(d.accessibleName.length, 2001);
  assert.ok(d.accessibleName.endsWith('…'));
  assert.ok(d.accessibleName.startsWith('word word'));
  assert.ok(d.normalized.accessibleName.length <= 2001);
  assert.ok(d.tokenized.accessibleName.length <= 200);
  assert.equal(d.visibleLabel, 'Read more');
  // The whole finding stays small.
  assert.ok(JSON.stringify(occ).length < 20000, `${JSON.stringify(occ).length} characters`);
});

test('label-in-name cuts the evidence of an undecided finding too', () => {
  // A word hyphenated differently in the label and the name is for a person
  // to judge.
  const html = page(`<a href="/" aria-label="non-standard ${LONG}">nonstandard</a>`);
  const [occ] = runa11yCoreOnHtml(html, { runOnly: ['label-in-name'] }).checksResults[0]
    .occurrences;
  assert.ok(occ.uncertainty, 'the finding is undecided');
  assert.ok(occ.uncertainty.evidence.accessibleName.length <= 2001);
  assert.ok(JSON.stringify(occ).length < 20000, `${JSON.stringify(occ).length} characters`);
});

test('a cut never splits a surrogate pair', () => {
  const name = 'a'.repeat(1999) + '😀'.repeat(10);
  const html = page(`<a href="/" aria-label="${name}">Read more</a>`);
  const [occ] = runa11yCoreOnHtml(html, { runOnly: ['label-in-name'] }).checksResults[0]
    .occurrences;
  assert.equal(occ.data.details.accessibleName, 'a'.repeat(1999) + '…');
});
