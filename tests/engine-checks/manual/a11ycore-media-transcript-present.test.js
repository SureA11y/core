'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = "a11ycore-media-alternative-transcript-evidence";

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no matching elements`, () => {
  const html = `<!doctype html><html><body><p>None</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when at least one applicable element triggers manual review`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', "a11ycore-media-transcript-present-manual-all-scenarios.html");
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });

  // mt_01: no transcript evidence at all -> cantTell occurrence (transcriptNotDetected)
  // mt_02: external/cross-document transcript link -> cantTell occurrence (transcriptEvidenceUnverified)
  // mt_03: strong evidence via aria-describedby with transcript token -> no occurrence (silently considered resolved)
  // mt_04: aria-hidden ancestor -> excluded (not eligible)
  // mt_05: hidden attribute ancestor -> excluded (not eligible)
  // mt_06: display:none ancestor -> excluded (not eligible)
  // mt_07: visibility:hidden ancestor, but element itself is visibility:visible (invertible) -> eligible, no evidence -> cantTell occurrence
  // mt_08: inert ancestor -> excluded (not eligible)
  const expected = [
  "mt_01",
  "mt_02",
  "mt_07"
];
  const notExpected = [
  "mt_03",
  "mt_04",
  "mt_05",
  "mt_06",
  "mt_08"
];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
