'use strict';

// The contrast rules ask, for each text element, whether it is part of a
// disabled control, by testing each of its ancestors (up to 100) against
// :disabled, which jsdom answers by walking the ancestors again: 2,000 text
// elements under 2,000 nested <div>s took 11 s in contrast-computable. Each
// element is now tested once per run. Counted rather than timed, so the
// test doesn't flake.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnDom } = require('../../src/testing.js');

function disabledTests(depth, texts) {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<div>'.repeat(depth) +
    Array.from({ length: texts }, (_, i) => `<span>text ${i}</span>`).join('') +
    '<button disabled><span id="off">Off</span></button>' +
    '</div>'.repeat(depth) +
    '</main></body></html>';
  const dom = new JSDOM(html);
  const proto = dom.window.Element.prototype;
  const matches = proto.matches;
  let count = 0;
  proto.matches = function (selector) {
    if (selector === ':disabled') count++;
    return matches.call(this, selector);
  };
  const result = runa11yCoreOnDom(dom, {
    runOnly: ['contrast-computable', 'contrast-minimum'],
    entryPointParity: false
  });
  return { count, result, depth, texts };
}

test('each element is tested against :disabled once per run', () => {
  const run = disabledTests(150, 200);
  // Without the cache: about texts x 100 ancestors.
  assert.ok(run.count < (run.depth + run.texts) * 3, `${run.count} tests`);
  // The text of the disabled button is still left out of the contrast checks.
  const minimum = run.result.checksResults.find((r) => r.ruleId === 'contrast-minimum');
  assert.ok(!minimum.occurrences.some((o) => /id="off"/.test(o.html || '')));
});
