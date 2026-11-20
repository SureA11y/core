'use strict';

// Presentational roles conflict resolution: role="presentation" or "none"
// on an element with a global ARIA attribute (aria-describedby) is ignored,
// so the element keeps its role and needs a text alternative (WCAG 1.1.1).
// The four attributes WAI-ARIA 1.2 deprecates as globals don't count.

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const CASES = [
  [
    'svg-image-text-alternative-present',
    (a) => `<svg role="img"><image ${a} href="x.png" width="10" height="10"></image></svg>`
  ],
  [
    'svg-text-alternative-present',
    (a) => `<svg ${a} width="10" height="10"><title>Logo</title><circle r="4"></circle></svg>`
  ],
  [
    'object-text-alternative-present',
    (a) => `<object ${a} data="x.png" type="image/png"></object>`
  ],
  ['embed-text-alternative-present', (a) => `<embed ${a} src="x.png" type="image/png">`],
  ['video-poster-text-alternative-present', (a) => `<video ${a} poster="x.png"></video>`],
  ['canvas-text-alternative-present', (a) => `<canvas ${a} width="10" height="10"></canvas>`]
];

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><main><p id="d">Sales chart</p>${body}</main></body></html>`;
const outcome = (rule, body) => {
  const result = runa11yCoreOnHtml(page(body), { runOnly: [rule] });
  return result.checksResults.find((c) => c.ruleId === rule).outcome;
};

for (const [rule, markup] of CASES) {
  test(`${rule}: role="presentation" with a global ARIA attribute keeps the element's role`, () => {
    const plain = outcome(rule, markup('role="presentation"'));
    const kept = outcome(rule, markup('role="presentation" aria-describedby="d"'));
    const deprecated = outcome(rule, markup('role="presentation" aria-disabled="true"'));
    assert.notStrictEqual(kept, plain, `${rule}: ${plain} either way`);
    assert.strictEqual(deprecated, plain, `${rule}: a deprecated global keeps it presentational`);
  });
}
