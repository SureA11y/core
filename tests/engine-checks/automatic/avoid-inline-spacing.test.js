'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'avoid-inline-spacing';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no inline style is present`, () => {
  const html = `<!doctype html><html><body><p>text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when a spacing property is set without !important`, () => {
  const html = `<!doctype html><html><body><p style="letter-spacing:2px">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the forced value already meets the metric`, () => {
  const html = `<!doctype html><html><body>
    <p style="letter-spacing:2px !important">text</p>
    <p style="line-height:1.8 !important; word-spacing:4px !important">text</p>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when letter-spacing is forced below 0.12em`, () => {
  const html = `<!doctype html><html><body><p id="a" style="letter-spacing:1px !important">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.deepStrictEqual(rule.occurrences[0].data.details.properties, ['letter-spacing']);
});

test(`${RULE_ID}: fail lists all forced properties together`, () => {
  const html = `<!doctype html><html><body><p id="a" style="line-height:1.2 !important; word-spacing:1px !important">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.deepStrictEqual(rule.occurrences[0].data.details.properties, [
    'line-height',
    'word-spacing'
  ]);
});

test(`${RULE_ID}: the later !important declaration is the one judged`, () => {
  const html = `<!doctype html><html><body><p style="line-height:1em !important; line-height:2em !important">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a non-important declaration does not displace an earlier important one`, () => {
  const html = `<!doctype html><html><body><p style="line-height:2em !important; line-height:1em">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the element has no text of its own`, () => {
  const html = `<!doctype html><html><body><div style="line-height:0.1em !important"><span>nested</span></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the forced value is inherit or unset`, () => {
  for (const value of ['inherit', 'unset']) {
    const html = `<!doctype html><html><body><p style="line-height:1.2em"><span style="line-height:${value} !important; display:block">text</span></p></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: initial resolves to a concrete value and stays in scope`, () => {
  const html = `<!doctype html><html><body><p id="a" style="line-height:initial !important">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><p id="a" style="letter-spacing:1px !important">text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Inline style must not force text spacing below the WCAG metric');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/avoid-inline-spacing-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'avoid-inline-spacing-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  for (const id of ['ais_case_04', 'ais_case_05', 'ais_case_06']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of [
    'ais_case_01',
    'ais_case_02',
    'ais_case_03',
    'ais_case_07',
    'ais_case_08',
    'ais_case_09',
    'ais_case_10'
  ]) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
  const both = (rule.occurrences || []).find(
    (o) => typeof o.html === 'string' && o.html.includes('id="ais_case_05"')
  );
  assert.deepStrictEqual(both.data.details.properties, ['letter-spacing', 'word-spacing']);
});

test(`${RULE_ID}: cantTell, not pass, when an !important spacing value cannot be resolved`, () => {
  // `calc()` mixing viewport and font-relative units resolves to no ratio here,
  // and jsdom exposes no used value to fall back on.
  const html = `<!doctype html><html><body><p id="unresolved" style="letter-spacing: calc(1vw - 2ex) !important">Some text.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'INLINE_SPACING_NOT_RESOLVABLE');
  assert.ok(hasOccurrenceForId(rule, 'unresolved'));
});

test(`${RULE_ID}: an unresolvable value does not mask a proven failure elsewhere`, () => {
  const html = `<!doctype html><html><body>
    <p id="unresolved" style="letter-spacing: calc(1vw - 2ex) !important">Some text.</p>
    <p id="tooTight" style="letter-spacing: 0.01em !important">Some text.</p>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'tooTight'));
});
