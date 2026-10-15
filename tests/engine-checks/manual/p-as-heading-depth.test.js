'use strict';

// p-as-heading asked, for every <p> and <div>, whether a <div> held block or
// embedded content with a 45-selector querySelector over its descendants,
// and whether an ancestor had a role of its own with closest(). Under jsdom
// each of those walks the subtree or the ancestor chain through the
// selector engine, so a page of nested <div>s took 0.85 s at 100 levels and
// 131 s at 800. Both now walk the tree and stop at the first answer, with
// the same results. Counted rather than timed, so the test doesn't flake.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom, runa11yCoreOnHtml } = require('../../../src/testing.js');

const nested = (n, inner) =>
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<div>'.repeat(n) +
  inner +
  '</div>'.repeat(n) +
  '</main></body></html>';

test('p-as-heading runs no selector query per element on a deeply nested page', () => {
  const dom = new JSDOM(nested(200, 'x'));
  const proto = dom.window.Element.prototype;
  let ruleQueries = 0;
  for (const method of ['querySelector', 'closest']) {
    const original = proto[method];
    proto[method] = function (selector, ...rest) {
      // The rule's own selector lists: block content, and tags with a role of their own.
      if (/\baddress\b|\bh1\b/.test(String(selector))) ruleQueries++;
      return original.call(this, selector, ...rest);
    };
  }
  runa11yCoreOnDom(dom, { runOnly: ['p-as-heading'], entryPointParity: false });
  assert.equal(ruleQueries, 0);
});

test('p-as-heading still finds bold text set apart, and leaves out what it left out', () => {
  const bold = '<div style="font-weight:700;font-size:24px">Shipping</div>';
  const run = (html) =>
    runa11yCoreOnHtml(html, { runOnly: ['p-as-heading'], entryPointParity: false })
      .checksResults[0];
  const found = run(nested(3, bold));
  assert.equal(found.outcome, 'cantTell');
  assert.equal(found.occurrences.length, 1);
  // A <div> holding block content is a container, not a line of text.
  assert.equal(
    run(nested(3, '<div style="font-weight:700;font-size:24px">A<ul><li>b</li></ul></div>'))
      .occurrences.length,
    0
  );
  // Inside an element with a heading or button role of its own.
  assert.equal(
    run(nested(3, `<div role="heading" aria-level="2">${bold}</div>`)).occurrences.length,
    0
  );
  assert.equal(run(nested(3, `<h2>${bold}</h2>`)).occurrences.length, 0);
});
