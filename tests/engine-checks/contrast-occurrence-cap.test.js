'use strict';

// The contrast rules list at most 50 elements. Past that they are counted, not
// listed, and the rule's own data.details says how many there were: a page
// with 120 grey paragraphs reported 50 and gave no sign of the other 70.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

function page(count) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    rows.push(`<p style="color:#bbb">Grey text ${i}</p>`);
    rows.push(
      `<p style="color:#000;background-image:linear-gradient(red,blue)">Text on a gradient ${i}</p>`
    );
  }
  return `<!doctype html><html lang="en"><body style="background:#fff"><main>${rows.join('')}</main></body></html>`;
}

const RULES = ['contrast-minimum', 'contrast-enhanced', 'contrast-computable'];

for (const ruleId of RULES) {
  test(`${ruleId}: past 50 elements, the rest are counted and the result says so`, () => {
    const result = runa11yCoreOnHtml(page(120), { runOnly: [ruleId] });
    const rule = result.checksResults.find((r) => r.ruleId === ruleId);
    assert.equal(rule.occurrences.length, 50);
    assert.deepEqual(rule.data.details, {
      reportedCount: 50,
      elementCount: 120,
      maxOccurrences: 50,
      truncated: true
    });
  });

  test(`${ruleId}: under the cap, every element is listed and nothing is truncated`, () => {
    const result = runa11yCoreOnHtml(page(3), { runOnly: [ruleId] });
    const rule = result.checksResults.find((r) => r.ruleId === ruleId);
    assert.equal(rule.occurrences.length, 3);
    assert.deepEqual(rule.data.details, {
      reportedCount: 3,
      elementCount: 3,
      maxOccurrences: 50,
      truncated: false
    });
  });
}
