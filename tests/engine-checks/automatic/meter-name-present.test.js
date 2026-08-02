'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'meter-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no role="meter" is present`, () => {
  const html = `<!doctype html><html><body><div>none</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when meter has aria-label`, () => {
  const html = `<!doctype html><html><body><div role="meter" aria-label="Disk usage" aria-valuenow="80"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when meter has no accessible name`, () => {
  const html = `<!doctype html><html><body><div id="a" role="meter" aria-valuenow="80"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.controlType, 'meter');
});

test(`${RULE_ID}: fail when meter has visible text content but no aria-label/aria-labelledby/title (role="meter" is name-from-author-only per WAI-ARIA — verified against a widely-used reference engine's own aria-meter-name check, which has no content-based naming method at all)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="meter" aria-valuenow="80">80% full</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));

  // Regression: the fix-it hint must not claim visible text is a valid
  // remediation, since this exact case (visible text present, "80% full")
  // still correctly fails -- a hint saying otherwise would send authors
  // down a dead end.
  assert.doesNotMatch(rule.occurrences[0].hint, /provide (visible text|meter text)/i);
  assert.match(rule.occurrences[0].hint, /aria-label/i);
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="meter"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Meters have an accessible name');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/meter-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'meter-name-present-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });

  const expectedFailIds = ['meter_case_05', 'meter_case_06', 'meter_case_08'];
  const expectedNoOccIds = ['meter_case_02', 'meter_case_03', 'meter_case_04', 'meter_case_07'];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: aria-labelledby pointing at an <iframe> falls back to its title attribute => pass`, () => {
  // Regression for a real false positive found via BBC News' cookie-consent
  // dialog (2026-07-22) — a copy-pasted bug across 16 *-name-present rules:
  // aria-labelledby pointing at an <iframe> has no "content" to compute a
  // name from (iframe content is opaque/cross-origin per HTML-AAM); the
  // referenced element's own accessible name must fall back to its title
  // attribute, which the previous getConservativeSubtreeText-only
  // resolveAriaLabelledbyText never checked. Fixed via the shared
  // getTextFromIdRefs helper.
  const html = `<!doctype html><html><body><iframe id="t" title="Settings"></iframe><div role="meter" aria-labelledby="t" aria-valuenow="80"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
