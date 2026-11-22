'use strict';

// Under jsdom, an element whose computed style holds a presentational hint
// (every element under <body text>) reads it through computedStyle's
// overrides. A rule reads its ancestors' styles over and over, so each
// value is read from jsdom once per element and run, and the elements
// between a hint and the element are resolved once, not once per element
// below them: 5 x 400 nested spans under <body text> took 15-20% longer
// than without the hint (round 11). Counted rather than timed, so the test
// doesn't flake.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom } = require('../../src/testing.js');

function reads(bodyAttrs) {
  let inner = 'x';
  for (let i = 0; i < 150; i++) inner = `<span>${inner} t${i}</span>`;
  const dom = new JSDOM(
    `<!doctype html><html lang="en"><head><title>t</title></head><body${bodyAttrs}><main>` +
      `<div>${inner}</div><div>${inner}</div></main></body></html>`
  );
  const { window } = dom;
  let count = 0;
  const style = window.getComputedStyle(window.document.body);
  let p = Object.getPrototypeOf(style);
  while (p && !Object.getOwnPropertyDescriptor(p, 'opacity')) p = Object.getPrototypeOf(p);
  const d = Object.getOwnPropertyDescriptor(p, 'opacity');
  Object.defineProperty(p, 'opacity', {
    ...d,
    get() {
      count++;
      return d.get.call(this);
    }
  });
  runa11yCoreOnDom(dom, { runOnly: ['contrast-minimum'], entryPointParity: false });
  return count;
}

test('a presentational hint costs no extra reads of the computed style under jsdom', () => {
  const plain = reads('');
  const hinted = reads(' text="#333"');
  // Each value is read from jsdom once per element with a hint: fewer reads
  // than without one, where every read goes to jsdom.
  assert.ok(hinted < plain, `${hinted} reads with the hint, ${plain} without`);
});
