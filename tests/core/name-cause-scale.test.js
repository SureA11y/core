'use strict';

// helpers.nameCause, which says why a name rule's element has no name, read
// every <label for> in the document again for each element the rule failed,
// and compared each one's for with the element's id: a page with 4,000
// unnamed fields beside 4,000 labels that miss them took 3.6 s in Chromium
// in form-control-programmatic-label-present, and 6,000 icon buttons 1 s in
// button-name-present. The labels are now read once per run, and looked up
// by for value, parent and target. Counted rather than timed, so the test
// doesn't flake.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom } = require('../../src/testing.js');

// Fields whose label points at an id one letter off, placed away from the
// field, so only the id comparison can find it; and icon-only buttons.
const page = (n) =>
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  Array.from(
    { length: n },
    (_, i) =>
      `<section><label for="field-${i}x">Field ${i}</label></section>` +
      `<div><p>…</p><input id="field-${i}" type="text"></div>` +
      '<button><svg aria-hidden="true"></svg></button>'
  ).join('') +
  '</main></body></html>';

function count(n, ruleId) {
  const dom = new JSDOM(page(n));
  const { Document, Element } = dom.window;
  let labelQueries = 0;
  let forReads = 0;
  for (const proto of [Document.prototype, Element.prototype]) {
    const qsa = proto.querySelectorAll;
    proto.querySelectorAll = function (selector) {
      if (/label\[for\]/.test(String(selector))) labelQueries++;
      return qsa.apply(this, arguments);
    };
  }
  const getAttribute = Element.prototype.getAttribute;
  Element.prototype.getAttribute = function (name) {
    if (name === 'for') forReads++;
    return getAttribute.apply(this, arguments);
  };
  const rule = runa11yCoreOnDom(dom, { runOnly: [ruleId], entryPointParity: false })
    .checksResults[0];
  return { labelQueries, forReads, rule };
}

for (const ruleId of ['form-control-programmatic-label-present', 'button-name-present']) {
  test(`${ruleId}: nameCause reads the labels once, however many elements fail`, () => {
    const small = count(50, ruleId);
    const large = count(200, ruleId);
    assert.equal(small.rule.outcome, 'fail');
    assert.equal(large.rule.outcome, 'fail');
    assert.equal(large.rule.occurrences.length, small.rule.occurrences.length * 4);
    // The same few queries for 200 as for 50.
    assert.ok(
      large.labelQueries <= small.labelQueries + 2,
      `${small.labelQueries} then ${large.labelQueries}`
    );
    // Four times the fields, about four times the for reads: linear, not quadratic.
    assert.ok(
      large.forReads <= small.forReads * 4 + 50,
      `${small.forReads} then ${large.forReads}`
    );
  });
}

test('form-control-programmatic-label-present still names a far label whose for is one letter off', () => {
  const { rule } = count(1, 'form-control-programmatic-label-present');
  const occ = rule.occurrences.find((o) => o.html.includes('id="field-0"'));
  assert.ok(occ, 'field-0 fails');
  assert.equal(occ.data.details.nameCause.cause, 'labelForMissing');
  assert.equal(occ.data.details.nameCause.for, 'field-0x');
});
