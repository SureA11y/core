'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-empty-heading';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no heading is present`, () => {
  const html = `<!doctype html><html><body><p>text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the heading has text content`, () => {
  const html = `<!doctype html><html><body><h1>Title</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the heading has aria-label`, () => {
  const html = `<!doctype html><html><body><h2 aria-label="Title"></h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the heading is empty`, () => {
  const html = `<!doctype html><html><body><h2 id="a"></h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'HEADING_EMPTY');
});

test(`${RULE_ID}: notApplicable when the empty heading has a title attribute`, () => {
  const html = `<!doctype html><html><body><h2 title="Section title"></h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the empty heading is aria-hidden`, () => {
  const html = `<!doctype html><html><body><h2 aria-hidden="true"></h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the empty heading is display:none`, () => {
  const html = `<!doctype html><html><body><h2 style="display:none"></h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when a named descendant (icon-only link with aria-label) provides the heading's accessible name (found on a real site — Navy Federal's logo-link header)`, () => {
  const html = `<!doctype html><html><body>
    <h1 id="a"><a href="/" aria-label="Site homepage"><svg width="10" height="10"></svg></a></h1>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the heading's only descendant link also has no accessible name`, () => {
  const html = `<!doctype html><html><body>
    <h1 id="a"><a href="/"><svg width="10" height="10"></svg></a></h1>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: cantTell when the heading's only text is inside a CSS display:none descendant (found on a real site, Instacart's footer "Top departments" toggle)`, () => {
  const html = `<!doctype html><html><body>
    <h2 id="a"><button style="display:none"><span>Top departments</span></button></h2>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when a named descendant image (alt text, nested through an extra wrapper) provides the heading's accessible name (found on a real site — Party City's logo header, <h1><a><div><img alt="..."></div></a></h1>)`, () => {
  const html = `<!doctype html><html><body>
    <h1 id="a"><a href="/"><div><img src="logo.png" alt="Colorful 'Party City' logo"></div></a></h1>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><h2 id="a"></h2></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Headings must not be empty');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/empty-heading-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'empty-heading-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  assert.ok(hasOccurrenceForId(rule, 'eh_case_02'));
  assert.ok(hasOccurrenceForId(rule, 'eh_case_08'));
  assert.ok(hasOccurrenceForId(rule, 'eh_case_09'));
  for (const id of ['eh_case_01', 'eh_case_03', 'eh_case_04', 'eh_case_05', 'eh_case_06', 'eh_case_07', 'eh_case_10']) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
