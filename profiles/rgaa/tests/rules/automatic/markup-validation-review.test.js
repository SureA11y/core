'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'markup-validation-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: every page gets one question at the root`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page('<p>Text</p>'), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'pageReview');
  assert.equal(occ.i18n.summaryKey, 'markupValidationReview_summary_cantTell_page');
  assert.match(occ.html, /^<html/);
});

// Markup the parser repairs cannot be seen in the DOM, so the question stands
// whatever the page looks like once parsed.
test(`${RULE_ID}: asks on a page whose source had errors the parser repaired`, () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body>' +
    '<p class="a" class="b">Repeated attribute<p><b><i>Misnested</b></i><ul><li>Unclosed</ul></body></html>';
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', { maxOccurrences: 1 });
});

test(`${RULE_ID}: a scan narrowed by contextSelector still asks once`, () => {
  const result = runa11yCoreOnHtml(page('<div id="zone"><p>a</p></div>'), {
    ...RUN,
    contextSelector: '#zone'
  });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<p>a</p>'), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.match(
    rule.occurrences[0].summary,
    /^Passez le code source généré de cette page au validateur du W3C/
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page('<p>a</p>'), { engineOptions });
    assert.ok(!check(result, RULE_ID), JSON.stringify(engineOptions));
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 8.2 rollup id run it`, () => {
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-8.2' } } }
  ]) {
    const rule = check(runa11yCoreOnHtml(page('<p>a</p>'), opts), RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'cantTell');
  }
});

test(`${RULE_ID}: without a validator report, 8.2 never rolls up to pass, and a sure failure still fails it`, () => {
  const clean = runa11yCoreOnHtml(page('<p id="a">a</p><p id="b">b</p>'), RGAA);
  assert.equal(check(clean, 'duplicate-id').outcome, 'pass');
  assert.equal(rollup(clean, 'rgaa-4.1.2-8.2').outcome, 'cantTell');
  const dup = runa11yCoreOnHtml(page('<p id="a">a</p><p id="a">b</p>'), RGAA);
  assert.equal(rollup(dup, 'rgaa-4.1.2-8.2').outcome, 'fail');
});

// After this change 8.2.1 is reported by duplicate-id and the RGAA-only
// validity rules; the WCAG ARIA rules no longer carry it.
test(`${RULE_ID}: the WCAG ARIA rules are no longer among the 8.2 rules`, () => {
  const ids = rollup(runa11yCoreOnHtml(page('<p>a</p>'), RGAA), 'rgaa-4.1.2-8.2').data.details
    .checksIds;
  for (const id of [
    'duplicate-id',
    'aria-role-conformance',
    'aria-attribute-conformance',
    RULE_ID
  ]) {
    assert.ok(ids.includes(id), id);
  }
  for (const id of [
    'aria-allowed-attr',
    'aria-allowed-role',
    'aria-checked-state-mismatch',
    'aria-prohibited-attr',
    'aria-required-attr',
    'aria-roles-valid',
    'aria-valid-attr',
    'aria-valid-attr-value',
    'duplicate-id-aria',
    'nested-interactive-controls-absent'
  ]) {
    assert.ok(!ids.includes(id), id);
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal((rule.occurrences[0].html.match(/id="([^"]+)"/) || [])[1], 'mvr_case_01');
});

// ---- With the W3C validator report (validator.report probe) ----

const URL = 'https://example.test/page';
function withReport(report, extra = {}) {
  return runa11yCoreOnHtml(page('<p>Text</p>'), {
    ...RUN,
    url: URL,
    engineOptions: { probes: { 'validator.report': report }, ...extra }
  });
}
const nuError = (line, message, extract = '<p class="a" class="b">') => ({
  type: 'error',
  lastLine: line,
  lastColumn: 4,
  message,
  extract
});

test(`${RULE_ID}: a report on the generated source with errors fails, one finding per error`, () => {
  const rule = assertRule(
    withReport({
      url: URL,
      source: 'generated',
      messages: [
        nuError(12, 'Duplicate attribute “class”.'),
        { type: 'info', subType: 'warning', message: 'Consider adding a “lang” attribute.' },
        nuError(3, 'CSS: “colr”: Property “colr” doesn’t exist.', 'style="colr:red"'),
        nuError(20, 'End tag “b” violates nesting rules.', '</b></i>')
      ]
    }),
    RULE_ID,
    'fail',
    { minOccurrences: 2, maxOccurrences: 2 }
  );
  assert.deepEqual(
    rule.occurrences.map((o) => [o.data.details.reasonCode, o.data.details.line]),
    [
      ['VALIDATOR_ERROR', 12],
      ['VALIDATOR_ERROR', 20]
    ]
  );
  const occ = rule.occurrences[0];
  assert.equal(occ.selector, 'html');
  assert.equal(occ.html, '<p class="a" class="b">');
  assert.equal(occ.i18n.params.message, 'Duplicate attribute “class”.');
  assert.match(occ.summary, /line 12: Duplicate attribute/);
});

test(`${RULE_ID}: a clean report on the generated source passes, warnings and CSS aside`, () => {
  for (const messages of [
    [],
    [{ type: 'info', message: 'The document is valid.' }],
    [nuError(3, 'CSS: “colr”: Property “colr” doesn’t exist.')]
  ]) {
    assertRule(withReport({ url: URL, source: 'generated', messages }), RULE_ID, 'pass');
  }
});

test(`${RULE_ID}: a report the engine cuts at 200 messages, with no error among them, is asked about`, () => {
  const messages = Array.from({ length: 250 }, () => ({ type: 'info', message: 'Warning.' }));
  const rule = assertRule(
    withReport({ url: URL, source: 'generated', messages }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'REPORT_TRUNCATED');
  // An error among them still fails.
  messages[10] = nuError(5, 'Stray end tag “div”.');
  assertRule(withReport({ url: URL, source: 'generated', messages }), RULE_ID, 'fail');
});

test(`${RULE_ID}: a report on the original source is asked about, never passed or failed`, () => {
  for (const [report, key] of [
    [
      { url: URL, source: 'original', messages: [nuError(4, 'Stray end tag “p”.')] },
      'originalErrors'
    ],
    [{ url: URL, messages: [nuError(4, 'Stray end tag “p”.')] }, 'originalErrors'],
    [{ url: URL, source: 'original', messages: [] }, 'originalClean']
  ]) {
    const rule = assertRule(withReport(report), RULE_ID, 'cantTell', { maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'ORIGINAL_SOURCE');
    assert.equal(occ.i18n.summaryKey, `markupValidationReview_summary_cantTell_${key}`);
    assert.equal(occ.uncertainty.code, 'runtime-dependent');
  }
});

test(`${RULE_ID}: a validator that could not check the page is asked about`, () => {
  const rule = assertRule(
    withReport({
      url: URL,
      source: 'generated',
      messages: [
        { type: 'non-document-error', subType: 'io', message: 'HTTP resource not retrievable.' }
      ]
    }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'VALIDATOR_FAILED');
});

test(`${RULE_ID}: a report for another page, or on a narrowed scan, is not used`, () => {
  const report = { url: 'https://example.test/other', source: 'generated', messages: [] };
  const other = assertRule(withReport(report), RULE_ID, 'cantTell');
  assert.equal(other.occurrences[0].data.details.reasonCode, 'pageReview');
  const narrowed = assertRule(
    withReport({ ...report, url: URL }, { fragment: true }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(narrowed.occurrences[0].data.details.reasonCode, 'pageReview');
});

test(`${RULE_ID}: messages follow the scan locale, with the validator's own message kept`, () => {
  const rule = assertRule(
    withReport(
      { url: URL, source: 'generated', messages: [nuError(12, 'Duplicate attribute “class”.')] },
      { locale: 'fr' }
    ),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Le validateur du W3C signale une erreur dans le code source généré, ligne 12 : Duplicate attribute “class”.'
  );
});

test(`${RULE_ID}: with a clean report on the generated source, RGAA 8.2 can pass`, () => {
  const result = runa11yCoreOnHtml(page('<p>Text</p>'), {
    url: URL,
    engineOptions: {
      profile: 'rgaa-4.1.2',
      probes: { 'validator.report': { url: URL, source: 'generated', messages: [] } }
    }
  });
  assert.equal(check(result, RULE_ID).outcome, 'pass');
  assert.equal(rollup(result, 'rgaa-4.1.2-8.2').outcome, 'pass');
});
