'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-landmark-no-duplicate-main';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no main is present`, () => {
  const html = `<!doctype html><html><body><div>none</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when there is exactly one main`, () => {
  const html = `<!doctype html><html><body><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell with one occurrence per main when more than one exists`, () => {
  const html = `<!doctype html><html><body><main id="a">First</main><main id="b">Second</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_DUPLICATE_MAIN');
});

test(`${RULE_ID}: notApplicable when the only "duplicate" main is display:none (a responsive desktop/mobile pattern) — matches the reference engine's own visibility gate (found on a real site, Zoom's homepage)`, () => {
  const html = `<!doctype html><html><body>
    <main id="a">Visible</main>
    <main id="b" style="display:none">Hidden duplicate</main>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><main id="a">First</main><main id="b">Second</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page must not have more than one main landmark');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/landmark-no-duplicate-main-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'landmark-no-duplicate-main-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'ndm_case_01a'));
  assert.ok(hasOccurrenceForId(rule, 'ndm_case_01b'));
});
