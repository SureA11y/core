'use strict';

// On a deep page, each element's checks that look at its ancestors (the
// <math> or <option> it is in, the opacity, background and blockers between
// it and the root, its chain of ancestors) read each ancestor once per run,
// not once per element below it: 4,000 spans nested in one another cost
// contrast-computable 4.5 s in Chromium, most of it in these walks. Counted
// rather than timed, so the test doesn't flake.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom } = require('../../src/testing.js');

function counted(depth) {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<span>t '.repeat(depth) +
    '<a href="/x">link</a>' +
    '</span>'.repeat(depth) +
    '</main></body></html>';
  const dom = new JSDOM(html);
  const { window } = dom;
  const counts = { closest: 0, opacity: 0, backgroundColor: 0, assignedSlot: 0 };
  const proto = window.Element.prototype;
  const closest = proto.closest;
  proto.closest = function (selector) {
    counts.closest++;
    return closest.call(this, selector);
  };
  // Every read of a computed style's opacity or background color, and every
  // step up the flat tree (composedParent reads assignedSlot first).
  const style = window.getComputedStyle(window.document.body);
  for (const name of ['opacity', 'backgroundColor']) {
    let p = Object.getPrototypeOf(style);
    while (p && !Object.getOwnPropertyDescriptor(p, name)) p = Object.getPrototypeOf(p);
    const d = Object.getOwnPropertyDescriptor(p, name);
    Object.defineProperty(p, name, {
      ...d,
      get() {
        counts[name]++;
        return d.get.call(this);
      }
    });
  }
  for (const P of [window.Element.prototype, window.Text.prototype]) {
    const d = Object.getOwnPropertyDescriptor(P, 'assignedSlot');
    Object.defineProperty(P, 'assignedSlot', {
      ...d,
      get() {
        counts.assignedSlot++;
        return d.get.call(this);
      }
    });
  }
  const result = runa11yCoreOnDom(dom, {
    runOnly: ['contrast-computable', 'contrast-minimum'],
    entryPointParity: false
  });
  return { counts, result };
}

test('the walks up a deep page read each ancestor once per run', () => {
  const depth = 300;
  const { counts, result } = counted(depth);
  // Before: each of the 300 elements read up to 200 ancestors in each walk
  // (about 250,000 opacity reads, 80,000 background reads, 200,000 steps up,
  // and a closest() per element and walk).
  assert.equal(counts.closest, 0, 'closest() is worked out from the parent');
  assert.ok(counts.opacity < depth * 10, `${counts.opacity} opacity reads`);
  assert.ok(counts.backgroundColor < depth * 3, `${counts.backgroundColor} background reads`);
  assert.ok(counts.assignedSlot < depth * 5, `${counts.assignedSlot} steps up`);
  const computable = result.checksResults.find((r) => r.ruleId === 'contrast-computable');
  assert.equal(computable.outcome, 'pass');
});
