'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'page-has-heading-one';

test(`${RULE_ID}: notApplicable when the page has an h1`, () => {
  const html = `<!doctype html><html><body><h1>Title</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the page has role="heading" aria-level="1"`, () => {
  const html = `<!doctype html><html><body><div role="heading" aria-level="1">Title</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the page has headings but no level-one heading`, () => {
  const html = `<!doctype html><html><body><h2>Section</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'HEADING_ONE_MISSING');
});

test(`${RULE_ID}: cantTell when the page has no heading at all`, () => {
  const html = `<!doctype html><html><body><p>text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: cantTell when the only h1 sits inside a display:none ancestor (CDC's flu page, real-world finding)`, () => {
  const html = `<!doctype html><html><body><div style="display:none"><h1>Influenza (Flu)</h1></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'HEADING_ONE_MISSING');
});

test(`${RULE_ID}: cantTell when the only h1 has aria-hidden="true"`, () => {
  const html = `<!doctype html><html><body><h1 aria-hidden="true">Title</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: cantTell when the only h1 has visibility:hidden`, () => {
  const html = `<!doctype html><html><body><h1 style="visibility:hidden">Title</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when the h1 is only visually clipped off-screen but remains in the accessibility tree (eBay's homepage pattern — must NOT regress)`, () => {
  const html = `<!doctype html><html><body><h1 style="position:absolute;clip-path:inset(50%);visibility:visible">Site title</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><h2>Section</h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page should have a level-one heading');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/page-has-heading-one-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'page-has-heading-one-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'HEADING_ONE_MISSING');
});
