'use strict';

/**
 * Text contrast: what the twelfth stress test found (C12-n), under jsdom.
 * The same cases run in Chromium in contrast-round-12-chromium.test.js,
 * where they apply, and the two agree.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../helpers/runDomRulesOnHtml.js');

const page = (body, head = '') =>
  `<!doctype html><html lang="en"><head><title>t</title>${head}</head><body><main>${body}</main></body></html>`;

function check(html, ruleId) {
  const result = runa11yCoreOnHtml(html, { runOnly: [ruleId] });
  return result.checksResults.find((c) => c.ruleId === ruleId);
}

test('text placed straight into a shadow host takes its slot’s color and background (C12-2)', () => {
  const run = (shadow) => {
    const dom = createDom(page('<x-s id="h">Buy now</x-s>'));
    dom.window.document.getElementById('h').attachShadow({ mode: 'open' }).innerHTML = shadow;
    const result = runa11yCoreOnDom(dom, { runOnly: ['contrast-minimum'] });
    return result.checksResults.find((c) => c.ruleId === 'contrast-minimum');
  };
  const grey = run('<div style="color:#aaa"><slot></slot></div>');
  assert.equal(grey.outcome, 'fail');
  assert.equal(Math.round(grey.occurrences[0].data.details.metrics.ratio * 100) / 100, 2.32);
  assert.equal(run('<slot style="color:#aaa"></slot>').outcome, 'fail');
  // White text on a dark wrapper in the shadow tree is measured there.
  const dark = run('<div style="background:#000;color:#fff"><slot></slot></div>');
  assert.equal(dark.outcome, 'pass');
});
