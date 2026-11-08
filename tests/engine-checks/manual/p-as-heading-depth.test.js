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

// jsdom runs out of stack reading the computed style of an element a few
// thousand levels deep: the read itself throws, which stopped the rule.
// Stood in for here by a style that throws on every read.
test('p-as-heading passes over a block whose style throws, and still judges the others', () => {
  const bold = (id) => `<p id="${id}" style="font-weight:700;font-size:24px">Shipping</p>`;
  const dom = new JSDOM(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
      `<div class="deep">${bold('deep')}</div>${bold('ok')}` +
      '</main></body></html>'
  );
  const { window } = dom;
  const getComputedStyle = window.getComputedStyle.bind(window);
  const throwing = new Proxy(
    {},
    {
      get() {
        throw new RangeError('Maximum call stack size exceeded');
      }
    }
  );
  window.getComputedStyle = (el, pseudo) =>
    el && el.closest && el.closest('.deep') ? throwing : getComputedStyle(el, pseudo);
  const rule = runa11yCoreOnDom(dom, { runOnly: ['p-as-heading'], entryPointParity: false })
    .checksResults[0];
  assert.equal(rule.error, undefined);
  assert.deepEqual(
    rule.occurrences.map((o) => o.selector),
    ['#ok']
  );
});
