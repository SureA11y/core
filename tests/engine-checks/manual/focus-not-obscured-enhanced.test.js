'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
const { getChecksCatalog } = require('../../../src/index.js');

// focus-not-obscured-minimum run with obscured: 'partly' (a variant). Its
// verdicts need a layout and are tested in Chromium with the base rule's
// (focus-not-obscured-chromium.test.js); its jsdom fixture coverage is in
// focus-not-obscured-minimum.test.js.
const RULE_ID = 'focus-not-obscured-enhanced';

test(`${RULE_ID}: notApplicable without a layout, saying so`, () => {
  const html = `<!doctype html><html><body>
      <p style="height:2000px"></p><a href="#x">Link</a>
      <div style="position:fixed;bottom:0;left:0;width:40px;height:60px;background:#036">Chat</div>
    </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  const own = result.checksResults.find((c) => c.ruleId === RULE_ID);
  assert.deepStrictEqual(own.data, { reason: 'noLayout' });
});

test(`${RULE_ID}: a variant of focus-not-obscured-minimum for WCAG 2.4.12, AAA`, () => {
  const rule = getChecksCatalog().find((c) => c.ruleId === RULE_ID);
  assert.ok(rule);
  assert.deepStrictEqual(rule.wcagSc, ['2.4.12']);
  assert.ok(rule.tags.includes('wcag22aaa'));
  assert.deepStrictEqual(
    rule.normativeMappings.map((m) => m.conformanceLevel),
    ['AAA']
  );
});
