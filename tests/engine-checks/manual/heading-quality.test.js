'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'heading-quality';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when the page has no heading`, () => {
  const html = `<!doctype html><html><body><p>Opening hours</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for a heading that names its topic`, () => {
  const html = `<!doctype html><html><body><h1 id="a">Opening hours</h1><p>Monday to Friday.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell for a generic placeholder word`, () => {
  const html = `<!doctype html><html><body><h1 id="a">Heading</h1><p>Monday to Friday.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'PLACEHOLDER_HEADING_TEXT');
});

test(`${RULE_ID}: cantTell for a numbered template slot`, () => {
  for (const text of ['Section 2', 'Heading 1', 'Chapter #3', 'Title: 4']) {
    const html = `<!doctype html><html><body><h2 id="a">${text}</h2></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'PLACEHOLDER_HEADING_TEXT');
  }
});

test(`${RULE_ID}: cantTell for a filename`, () => {
  const html = `<!doctype html><html><body><h2 id="a">annual-report-2026.pdf</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'FILENAME_LIKE_HEADING');
});

test(`${RULE_ID}: cantTell for a URL`, () => {
  const html = `<!doctype html><html><body><h2 id="a">https://example.com/pricing</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'URL_LIKE_HEADING');
});

// ---------------------------------------------------------------------------
// Precision: exact match against the curated list, never a substring, and no
// length signal (ACT b49b2e is explicit that a one-character heading can be
// descriptive).
// ---------------------------------------------------------------------------

test(`${RULE_ID}: a placeholder word inside a longer heading is not flagged`, () => {
  for (const text of ['Heading into the storm', 'Section of the aqueduct', 'Title deeds']) {
    const html = `<!doctype html><html><body><h2 id="a">${text}</h2></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a single-character heading is not flagged`, () => {
  const html = `<!doctype html><html><body><h2 id="a">A</h2><dl><dt>airplane</dt><dd>a flying vehicle</dd></dl></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: trailing punctuation and casing do not hide a placeholder`, () => {
  const html = `<!doctype html><html><body><h2 id="a">  UNTITLED.  </h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.name, 'UNTITLED.');
});

// ---------------------------------------------------------------------------
// Applicability, shared with empty-heading.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: role="heading" is evaluated, and its aria-label wins over content`, () => {
  const html = `<!doctype html><html><body><span role="heading" aria-level="2" aria-label="Lorem ipsum" id="a">Pricing</span></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: a heading hidden from the accessibility tree is skipped`, () => {
  const html = `<!doctype html><html><body><h2 id="a" hidden>Heading</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: placeholder text on a non-heading element is out of scope`, () => {
  const html = `<!doctype html><html><body><p id="a">Heading</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a heading with no name at all is left to empty-heading`, () => {
  const html = `<!doctype html><html><body><h2 id="a"></h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: manual rule never reports fail`, () => {
  const html = `<!doctype html><html><body><h1 id="a">Heading</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.notStrictEqual(rule.outcome, 'fail');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><h1 id="a">Heading</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Heading text should be descriptive, not a placeholder');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/heading-quality-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'heading-quality-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 6, maxOccurrences: 6 });

  const expectedIds = [
    'hq_case_05',
    'hq_case_06',
    'hq_case_07',
    'hq_case_08',
    'hq_case_09',
    'hq_case_10'
  ];
  const expectedNoOccIds = [
    'hq_case_01',
    'hq_case_02',
    'hq_case_03',
    'hq_case_04',
    'hq_case_11',
    'hq_case_12'
  ];

  for (const id of expectedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
