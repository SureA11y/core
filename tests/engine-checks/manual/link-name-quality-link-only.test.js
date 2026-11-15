'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
const { getChecksCatalog } = require('../../../src/index.js');

// link-name-quality run with whenContextFound: 'ask' (a variant), for WCAG
// 2.4.9: only the generic links whose context explains them, which 2.4.4
// accepts and 2.4.9 doesn't (F84).
const RULE_ID = 'link-name-quality-link-only';
const BASE_ID = 'link-name-quality';

const page = (body) => `<!doctype html><html lang="en"><body>${body}</body></html>`;

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: a variant of link-name-quality for WCAG 2.4.9, AAA`, () => {
  const rule = getChecksCatalog().find((c) => c.ruleId === RULE_ID);
  assert.ok(rule);
  assert.deepStrictEqual(rule.wcagSc, ['2.4.9']);
  assert.ok(rule.tags.includes('wcag2aaa'));
  assert.ok(!rule.tags.includes('wcag2a'));
  assert.deepStrictEqual(
    rule.normativeMappings.map((m) => m.conformanceLevel),
    ['AAA']
  );
});

test(`${RULE_ID}: a generic name that only its sentence explains is asked about`, () => {
  const html = page('<p>For the pricing sheet, <a id="x" href="/prices">click here</a>.</p>');
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID, BASE_ID] });
  const own = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const occ = own.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'GENERIC_LINK_TEXT_IN_CONTEXT');
  assert.strictEqual(occ.data.details.normalizedName, 'click here');
  assert.strictEqual(occ.i18n.summaryKey, 'linkNameQualityLinkOnly_summary_cantTell_inContext');
  assert.ok(!occ.lean, 'no lean: the 2.4.4 leans weigh context this finding has');
  // 2.4.4 counts the context: the base rule doesn't report it.
  assertRule(result, BASE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: no link is reported by both rules`, () => {
  const html = page(
    '<div><a id="a" href="/more">Read more</a></div><p>Our plans changed. <a id="b" href="/plans">Read more</a> about them.</p>'
  );
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID, BASE_ID] });
  const own = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const base = assertRule(result, BASE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(own, 'b') && !hasOccurrenceForId(own, 'a'));
  assert.ok(hasOccurrenceForId(base, 'a') && !hasOccurrenceForId(base, 'b'));
});

test(`${RULE_ID}: descriptive names and bare format names are not its concern`, () => {
  for (const body of [
    '<p>Prices changed. <a href="/p">Download the 2026 pricing guide</a>.</p>',
    '<p>Annual report: <a href="/r.pdf">PDF</a></p>'
  ]) {
    const result = runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: runs under a AAA profile, not under AA`, () => {
  const html = page('<p>For the pricing sheet, <a href="/prices">click here</a>.</p>');
  const aa = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  assert.ok(!aa.checksResults.some((c) => c.ruleId === RULE_ID));
  const aaa = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aaa' } });
  assertRule(aaa, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const rollup = aaa.rulesResults.find((r) => r.ruleId === 'wcag-2.4.9-link-purpose-link-only');
  assert.ok(rollup, '2.4.9 rollup');
  assert.notStrictEqual(rollup.outcome, 'pass');
  // 2.4.4 counts the context: the variant takes no part in its rollup, and
  // the base rule finds nothing to ask there.
  const r244 = aaa.rulesResults.find((r) => r.ruleId === 'wcag-2.4.4-link-purpose-in-context');
  const contributors = r244.data.details.contributors;
  assert.ok(!contributors.some((c) => c.testId === RULE_ID));
  assert.strictEqual(contributors.find((c) => c.testId === BASE_ID).outcome, 'notApplicable');
  const r249 = rollup.data.details.contributors;
  assert.strictEqual(r249.find((c) => c.testId === RULE_ID).outcome, 'cantTell');
});

test(`${RULE_ID}: in another language, its phrases count`, () => {
  const html = `<!doctype html><html lang="es"><body><p>Para ver los precios de 2026, <a href="/p">haz clic aquí</a>.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const own = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(own.occurrences[0].data.details.normalizedName, 'haz clic aquí');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/link-name-quality-link-only-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'link-name-quality-link-only-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  for (const id of ['llo_case_01', 'llo_case_02', 'llo_case_06']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of ['llo_case_03', 'llo_case_04', 'llo_case_05']) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
