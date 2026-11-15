'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

// jsdom has no layout, so the rule is notApplicable here and says why.
// reflow-horizontal-scroll-chromium.test.js checks the measured verdicts.
const RULE_ID = 'reflow-horizontal-scroll';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;

test(`${RULE_ID}: without a layout, notApplicable and says why`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<div style="width:900px">Wide</div>'), RUN),
    RULE_ID,
    'notApplicable',
    { maxOccurrences: 0 }
  );
  assert.deepEqual(rule.data, { reason: 'noLayout' });
});

test(`${RULE_ID}: a WCAG 2.1 AA rule for 1.4.10, in its rollup, run by default`, () => {
  const result = runa11yCoreOnHtml(page('<p>x</p>'));
  const check = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(check, 'it runs by default, as a WCAG rule');
  assert.ok(check.rollupIds.includes('wcag-1.4.10-reflow'));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  // Every case needs a layout: in jsdom the rule reports nothing, as each
  // case's data-outcome attribute says. The browser test checks the titles.
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
});
