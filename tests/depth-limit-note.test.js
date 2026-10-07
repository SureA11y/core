'use strict';

// A fail resting only on elements deeper than the 200-step ancestor walk is
// downgraded to cantTell with a note in error. The rule completed: it keeps
// its occurrences and is not a rule that did not complete (OUTPUT_SCHEMA.md,
// `error`).

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { ruleErrorOf } = require('../src/scan-result.js');

test('a depth-limit downgrade is a note, not a rule error', () => {
  const deep = '<div>'.repeat(250) + '<img src="a.png">' + '</div>'.repeat(250);
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${deep}</main></body></html>`,
    { runOnly: ['img-alt-present'] }
  );
  const check = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.strictEqual(check.outcome, 'cantTell');
  assert.strictEqual(check.occurrences.length, 1);
  assert.match(check.error, /Ancestor walk hit its depth limit/);
  assert.strictEqual(ruleErrorOf(check), null);
});
