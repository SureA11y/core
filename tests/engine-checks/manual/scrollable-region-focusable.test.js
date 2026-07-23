'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-scrollable-region-focusable';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when there is no scrollable-overflow candidate`, () => {
  const html = `<!doctype html><html><body><div>plain content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a scrollable region has no focusable content and is not itself focusable`, () => {
  const html = `<!doctype html><html><head><style>.s{overflow-y:auto;height:100px;}</style></head><body><div class="s">long content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'SCROLLABLE_OVERFLOW_NOT_FOCUSABLE');
});

test(`${RULE_ID}: notApplicable when the scrollable region itself has tabindex="0"`, () => {
  const html = `<!doctype html><html><head><style>.s{overflow-y:auto;height:100px;}</style></head><body><div class="s" tabindex="0">long content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the scrollable region contains a focusable descendant`, () => {
  const html = `<!doctype html><html><head><style>.s{overflow-y:auto;height:100px;}</style></head><body><div class="s">text <a href="#">link</a></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><head><style>.s{overflow-y:auto;height:100px;}</style></head><body><div class="s">long content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Scrollable regions with no focusable content should be keyboard-focusable');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/scrollable-region-focusable-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'scrollable-region-focusable-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  const expectedFlaggedIds = ['srf_case_01', 'srf_case_02'];
  const expectedNoOccIds = ['srf_case_03', 'srf_case_04', 'srf_case_05'];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
