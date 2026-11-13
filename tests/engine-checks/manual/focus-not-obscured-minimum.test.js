'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
const { getChecksCatalog } = require('../../../src/index.js');

const RULE_ID = 'focus-not-obscured-minimum';
const ENHANCED = 'focus-not-obscured-enhanced';

// What the rules ask is where a box the page keeps in place sits in the
// window, which only a browser lays out: without a layout they report
// nothing. Their verdicts are tested in Chromium
// (focus-not-obscured-chromium.test.js).
test(`${RULE_ID}: notApplicable without a layout, saying so`, () => {
  const html = `<!doctype html><html><body>
      <p style="height:2000px"></p><a href="#x">Link</a>
      <div style="position:fixed;bottom:0;left:0;right:0;height:80px;background:#fff">Footer</div>
    </body></html>`;
  for (const id of [RULE_ID, ENHANCED]) {
    const result = runa11yCoreOnHtml(html, { runOnly: [id] });
    assertRule(result, id, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
    const own = result.checksResults.find((c) => c.ruleId === id);
    assert.deepStrictEqual(own.data, { reason: 'noLayout' }, id);
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/focus-not-obscured-all-scenarios.html)`, () => {
  // In jsdom every case is notApplicable (no layout): the data-outcome
  // markers say so. The browser test checks the verdicts in the titles.
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', 'focus-not-obscured-all-scenarios.html'),
    'utf8'
  );
  for (const id of [RULE_ID, ENHANCED]) {
    assertRule(runa11yCoreOnHtml(html, { runOnly: [id] }), id, 'notApplicable', {
      minOccurrences: 0,
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: the enhanced rule is this rule run with obscured: 'partly', for WCAG 2.4.12`, () => {
  const catalog = getChecksCatalog();
  const minimum = catalog.find((c) => c.ruleId === RULE_ID);
  const enhanced = catalog.find((c) => c.ruleId === ENHANCED);
  assert.ok(minimum && enhanced);
  assert.deepStrictEqual(minimum.wcagSc, ['2.4.11']);
  assert.deepStrictEqual(enhanced.wcagSc, ['2.4.12']);
  assert.strictEqual(minimum.type, 'manual');
  assert.strictEqual(enhanced.type, 'manual');
  const setting = minimum.variantSettings.find((s) => s.name === 'obscured');
  assert.strictEqual(setting.default, 'entirely');
  assert.deepStrictEqual(setting.values, ['entirely', 'partly']);
});
