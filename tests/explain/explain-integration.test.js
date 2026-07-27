'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');
const { explain, buildExplainGroups } = require('../../src/explain');

// Proves the module works against real, built engine output (not just the
// hand-shaped fixtures in fake-result.js) -- two structurally-identical real
// failures should dedupe into one real group, and explain() should attach a
// real explanation object onto both real occurrences.
test('explain: dedupes and explains real engine output end to end', async () => {
  const html = `<!doctype html><html><body>
    <img src="a.png">
    <img src="b.png">
  </body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: { includeRuleIds: ['img-alt-present'] } });
  const check = result.checksResults.find((c) => c.ruleId === 'img-alt-present');
  assert.strictEqual(check.outcome, 'fail');
  assert.strictEqual(check.occurrences.length, 2);

  const groups = buildExplainGroups(result);
  assert.strictEqual(groups.length, 1, 'two identical missing-alt images dedupe into one real group');

  const provider = async (groups) => groups.map((g) => ({ groupKey: g.groupKey, text: `Explanation for ${g.ruleId}` }));
  const augmented = await explain(result, { provider });

  const explainedCheck = augmented.checksResults.find((c) => c.ruleId === 'img-alt-present');
  for (const occ of explainedCheck.occurrences) {
    assert.strictEqual(occ.explanation.text, 'Explanation for img-alt-present');
    assert.strictEqual(occ.explanation.advisory, true);
  }

  // Original, unexplained result is untouched.
  assert.strictEqual(check.occurrences[0].explanation, undefined);
});
