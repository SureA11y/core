'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'region';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when all top-level content is inside a landmark`, () => {
  const html = `<!doctype html><html><body><header>H</header><main>Content</main><footer>F</footer></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when body has no text-bearing children`, () => {
  const html = `<!doctype html><html><body><script>1;</script></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a direct child of body has text but is not a landmark`, () => {
  const html = `<!doctype html><html><body><main>Content</main><p id="a">Stray</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'CONTENT_OUTSIDE_LANDMARK');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><p id="a">Stray</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page content should be inside a landmark region');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/region-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'region-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'rg_case_01'));
});

test(`region: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><body><main>Content</main><p id="a">Stray</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['region'], contextSelector: 'body' });
  assertRule(result, 'region', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`region: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><body><main>Content</main><p id="a">Stray</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['region'], engineOptions: { fragment: true } });
  assertRule(result, 'region', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
