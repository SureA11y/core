'use strict';

// The size and ratio fields of a contrast failure are a stable contract
// (docs/API_STABILITY.md): a report or a pack tells which kind of text failed
// by them, so their names and types are pinned here.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

for (const ruleId of ['contrast-minimum', 'contrast-enhanced']) {
  test(`${ruleId}: a failure carries the stable size and ratio fields`, () => {
    const html = `<!doctype html><html lang="en"><body style="background:#fff">
      <p id="small" style="color:#999;font-size:16px">Small grey text</p>
      <p id="large" style="color:#aaa;font-size:20px;font-weight:700">Large bold grey text</p>
    </body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [ruleId] });
    const rule = result.checksResults.find((r) => r.ruleId === ruleId);
    const byId = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`)).data.details;
    for (const id of ['small', 'large']) {
      const d = byId(id);
      assert.equal(typeof d.metrics.ratio, 'number');
      assert.equal(typeof d.metrics.threshold, 'number');
      assert.equal(typeof d.typography.fontSizePx, 'number');
      assert.equal(typeof d.typography.fontSizePt, 'number');
      assert.equal(typeof d.typography.fontWeight, 'number');
      assert.equal(typeof d.typography.isBold, 'boolean');
      assert.equal(typeof d.typography.isLargeText, 'boolean');
    }
    assert.equal(byId('small').typography.isLargeText, false);
    assert.equal(byId('large').typography.isLargeText, true);
    assert.equal(byId('large').typography.isBold, true);
  });
}
