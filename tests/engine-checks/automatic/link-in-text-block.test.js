'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'link-in-text-block';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when there are no links at all`, () => {
  const html = `<!doctype html><html><body><p>No links here.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the only link is standalone (not surrounded by text)`, () => {
  const html = `<!doctype html><html><body><ul><li><a href="#">standalone</a></li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the in-text link is underlined`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    a { text-decoration: underline; }
  </style></head><body><p>Read <a href="#">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a color-only link has an insufficient contrast difference from surrounding text`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .nodeco { text-decoration: none; }
    .weak { color: #2a2a2a; }
  </style></head><body><p>Read <a href="#" id="weakLink" class="nodeco weak">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'COLOR_ONLY_DIFFERENTIATION');
  assert.ok(rule.occurrences[0].data.details.metrics.ratio < 3);
});

test(`${RULE_ID}: pass when color-only but contrast vs surrounding text is >= 3:1`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .nodeco { text-decoration: none; }
    .strong { color: #969696; }
  </style></head><body><p>Read <a href="#" class="nodeco strong">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: not flagged when contrast is not confidently computable (background-image blocker)`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .nodeco { text-decoration: none; color: #2a2a2a; }
    .bgimg { background-image: linear-gradient(90deg, #fff, #000); }
  </style></head><body><p>Read <a href="#" class="nodeco bgimg">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><head><style>
    body { background: #ffffff; }
    p { color: #222222; }
    .nodeco { text-decoration: none; }
    .weak { color: #2a2a2a; }
  </style></head><body><p>Read <a href="#" class="nodeco weak">this link</a> for more.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Links in text blocks must be distinguishable from surrounding text without relying on color alone'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/link-in-text-block-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'link-in-text-block-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const expectedFailIds = ['litb_case_05'];
  const expectedNoOccIds = [
    'litb_case_01',
    'litb_case_02',
    'litb_case_03',
    'litb_case_04',
    'litb_case_06',
    'litb_case_07'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
