'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'contrast-minimum-rgaa';
const WCAG_RULE = 'contrast-minimum';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };
const FIXTURES = path.join(__dirname, '../..', 'fixtures');

function page(style, text = 'Opening hours') {
  return `<!doctype html><html lang="en"><head><title>t</title><style>html,body{background:#fff;color:#000}</style></head><body><main><p id="t" style="${style}">${text}</p></main></body></html>`;
}

// #888 on white is 3.54:1; #aaa on white is 2.32:1.
const GREY = 'color:#888888;background:#ffffff';
const LIGHT = 'color:#aaaaaa;background:#ffffff';

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: bold text of 18.5px is large, so 3.54:1 passes (3.2.4)`, () => {
  const html = page(`font-size:18.5px;font-weight:700;${GREY}`);
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ALL_ABOVE_THRESHOLD');
  assert.equal(rule.occurrences[0].i18n.summaryKey, 'contrastMinimumRgaa_pass_allAboveThreshold');
});

test(`${RULE_ID}: bold text just under 18.5px needs 4.5:1 (3.2.2)`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(`font-size:18.4px;font-weight:700;${GREY}`), RUN),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'BELOW_THRESHOLD');
  assert.equal(occ.data.details.metrics.threshold, 4.5);
  assert.equal(occ.data.details.typography.isLargeText, false);
  assert.equal(occ.i18n.summaryKey, 'contrastMinimumRgaa_fail_belowThreshold');
  assert.equal(occ.i18n.hintKey, 'contrastMinimumRgaa_hint_fail');
});

test(`${RULE_ID}: regular text keeps the 24px boundary (3.2.1, 3.2.3)`, () => {
  assertRule(runa11yCoreOnHtml(page(`font-size:18.5px;${GREY}`), RUN), RULE_ID, 'fail');
  assertRule(runa11yCoreOnHtml(page(`font-size:23.9px;${GREY}`), RUN), RULE_ID, 'fail');
  assertRule(runa11yCoreOnHtml(page(`font-size:24px;${GREY}`), RUN), RULE_ID, 'pass');
  assertRule(
    runa11yCoreOnHtml(page('font-size:16px;color:#000;background:#fff'), RUN),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: large text below 3:1 fails`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(`font-size:18.5px;font-weight:700;${LIGHT}`), RUN),
    RULE_ID,
    'fail'
  );
  assert.equal(rule.occurrences[0].data.details.metrics.threshold, 3);
  assert.equal(rule.occurrences[0].data.details.typography.isLargeText, true);
});

test(`${RULE_ID}: no text, or no computable text, is notApplicable`, () => {
  assertRule(runa11yCoreOnHtml(page(GREY, ''), RUN), RULE_ID, 'notApplicable');
  const gradient = page(
    'font-size:16px;color:#888;background-image:linear-gradient(#fff,#000)',
    'Opening hours'
  );
  const rule = assertRule(runa11yCoreOnHtml(gradient, RUN), RULE_ID, 'notApplicable');
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'contrastMinimumRgaa_notApplicable_noComputableText'
  );
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page(`font-size:16px;${GREY}`), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.match(
    rule.occurrences[0].summary,
    /texte de moins de 24px, ou texte en gras de moins de 18,5px/
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page(`font-size:16px;${GREY}`);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!check(result, RULE_ID), JSON.stringify(engineOptions));
    assert.ok(check(result, WCAG_RULE), JSON.stringify(engineOptions));
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 3.2 rollup id run it`, () => {
  const html = page(`font-size:16px;${GREY}`);
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-3.2' } } }
  ]) {
    const rule = check(runa11yCoreOnHtml(html, opts), RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// The divergence: bold text from 18.5px to 14pt (about 18.67px) with a ratio
// between 3:1 and 4.5:1.
test(`${RULE_ID}: WCAG 1.4.3 fails 18.5px bold text at 3.54:1 while RGAA 3.2 passes it`, () => {
  const result = runa11yCoreOnHtml(page(`font-size:18.5px;font-weight:700;${GREY}`), RGAA);
  assert.equal(check(result, WCAG_RULE).outcome, 'fail');
  assert.equal(check(result, RULE_ID).outcome, 'pass');
  assert.equal(rollup(result, 'wcag-1.4.3-contrast-minimum').outcome, 'fail');
  const rgaa = rollup(result, 'rgaa-4.1.2-3.2');
  assert.equal(rgaa.outcome, 'pass');
  assert.ok(!rgaa.data.details.checksIds.includes(WCAG_RULE));
  assert.ok(rgaa.data.details.checksIds.includes(RULE_ID));
});

test(`${RULE_ID}: WCAG 1.4.3 and RGAA 3.2 agree outside the 18.5px band`, () => {
  for (const [style, outcome] of [
    [`font-size:18.67px;font-weight:700;${GREY}`, 'pass'],
    [`font-size:16px;${GREY}`, 'fail'],
    [`font-size:18.5px;font-weight:700;${LIGHT}`, 'fail']
  ]) {
    const result = runa11yCoreOnHtml(page(style), RGAA);
    assert.equal(rollup(result, 'wcag-1.4.3-contrast-minimum').outcome, outcome, style);
    assert.equal(rollup(result, 'rgaa-4.1.2-3.2').outcome, outcome, style);
  }
});

// contrast-minimum is unchanged: running the RGAA rule beside it, in either
// order and under any profile, leaves its result as it was. The two share the
// colour caches but not the font or result caches. Core's variant test checks
// the same over contrast-minimum's own scenario page.
test(`${WCAG_RULE} gives the same result whether or not ${RULE_ID} runs in the same scan`, () => {
  const strip = (r) =>
    JSON.stringify({
      outcome: r.outcome,
      occurrences: (r.occurrences || []).map((o) => ({
        selector: o.selector,
        html: o.html,
        summary: o.summary,
        details: o.data && o.data.details
      }))
    });
  const htmls = [
    fs.readFileSync(path.join(FIXTURES, `${RULE_ID}-all-scenarios.html`), 'utf8'),
    page(`font-size:18.5px;font-weight:700;${GREY}`)
  ];
  for (const html of htmls) {
    const alone = strip(
      check(runa11yCoreOnHtml(html, { runOnly: { includeRuleIds: [WCAG_RULE] } }), WCAG_RULE)
    );
    for (const opts of [
      { runOnly: { includeRuleIds: [WCAG_RULE, RULE_ID] } },
      { runOnly: { includeRuleIds: [RULE_ID, WCAG_RULE] } },
      RGAA,
      {}
    ]) {
      const got = check(runa11yCoreOnHtml(html, opts), WCAG_RULE);
      assert.equal(strip(got), alone, JSON.stringify(opts));
    }
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const html = fs.readFileSync(path.join(FIXTURES, `${RULE_ID}-all-scenarios.html`), 'utf8');
  const result = runa11yCoreOnHtml(html, {
    runOnly: { includeRuleIds: [RULE_ID, WCAG_RULE] }
  });
  const ids = (id) =>
    check(result, id)
      .occurrences.map((o) => (String(o.html || '').match(/id="([^"]+)"/) || [])[1])
      .filter(Boolean);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  assert.deepEqual(ids(RULE_ID), ['cmr_case_01', 'cmr_case_02', 'cmr_case_03']);
  // The same page under WCAG: case 04 (18.5px bold at 3.54:1) fails too.
  assert.deepEqual(ids(WCAG_RULE), ['cmr_case_01', 'cmr_case_02', 'cmr_case_03', 'cmr_case_04']);
});
