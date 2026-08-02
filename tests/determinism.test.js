'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');

test('engine output is deterministic for rule ordering and occurrence ordering', () => {
  const html = `
    <!doctype html>
    <html><body>
      <img src="1.png">
      <img src="2.png">
      <a target="_blank" href="https://x.test/">X</a>
      <input type="text" id="a">
    </body></html>
  `;

  const a = runa11yCoreOnHtml(html, {
    engineOptions: { includeShadowDom: false, excludeSelectors: [] }
  });
  const b = runa11yCoreOnHtml(html, {
    engineOptions: { includeShadowDom: false, excludeSelectors: [] }
  });

  // Compare shape deterministically:
  // - checks order
  // - occurrences order per rule
  const aRuleIds = a.checksResults.map((r) => r.ruleId);
  const bRuleIds = b.checksResults.map((r) => r.ruleId);

  assert.deepEqual(aRuleIds, bRuleIds);

  for (let i = 0; i < a.checksResults.length; i++) {
    const ra = a.checksResults[i];
    const rb = b.checksResults[i];
    assert.equal(ra.ruleId, rb.ruleId);

    const occA = (ra.occurrences || []).map(
      (o) => `${o.selector}::${(o.summary || '').slice(0, 40)}`
    );
    const occB = (rb.occurrences || []).map(
      (o) => `${o.selector}::${(o.summary || '').slice(0, 40)}`
    );
    assert.deepEqual(occA, occB);
  }
});
