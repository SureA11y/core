'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'orientation-content-parity';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(css, body, headExtra = '') {
  return `<!doctype html><html lang="en"><head><title>t</title><style>${css}</style>${headExtra}</head><body><main>${body}</main></body></html>`;
}

const TABLE = '<table class="tableau"><tr><th>Year</th><td>2025</td></tr></table>';
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: an element hidden in portrait is asked about`, () => {
  const html = page('@media (orientation: portrait) { .tableau { display: none } }', TABLE);
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, {
    reasonCode: 'hiddenInOrientation',
    mediaText: '(orientation: portrait)',
    selectorText: '.tableau'
  });
  assert.equal(occ.i18n.summaryKey, 'orientationContentParity_summary_cantTell');
  assert.deepEqual(occ.i18n.params, {
    mediaText: '(orientation: portrait)',
    selectorText: '.tableau',
    element: 'table'
  });
  assert.equal(
    occ.summary,
    'A "(orientation: portrait)" media query hides this <table> (".tableau").'
  );
});

test(`${RULE_ID}: visibility hidden or collapse, and landscape, count too`, () => {
  for (const css of [
    '@media (orientation: landscape) { .tableau { visibility: hidden } }',
    '@media screen and (orientation: landscape) { .tableau { visibility: collapse } }'
  ]) {
    assertRule(runa11yCoreOnHtml(page(css, TABLE), RUN), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
  }
});

test(`${RULE_ID}: nested rules and orientation media on the style element are read`, () => {
  const nested = page(
    '@supports (display: grid) { @media (orientation: portrait) { .tableau { display: none } } }',
    TABLE
  );
  assertRule(runa11yCoreOnHtml(nested, RUN), RULE_ID, 'cantTell', { minOccurrences: 1 });
  const onSheet = page(
    '',
    TABLE,
    '<style media="(orientation: portrait)">.tableau { display: none }</style>'
  );
  assertRule(runa11yCoreOnHtml(onSheet, RUN), RULE_ID, 'cantTell', { minOccurrences: 1 });
});

test(`${RULE_ID}: an element matched by two hiding rules is asked about once`, () => {
  const css =
    '@media (orientation: portrait) { .tableau { display: none } table { display: none } }';
  assertRule(runa11yCoreOnHtml(page(css, TABLE), RUN), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test(`${RULE_ID}: an element already hidden by the author is still found`, () => {
  const css = '@media (orientation: portrait) { .tableau { display: none } }';
  const body = `<div style="display:none">${TABLE}</div>`;
  assertRule(runa11yCoreOnHtml(page(css, body), RUN), RULE_ID, 'cantTell', { minOccurrences: 1 });
});

test(`${RULE_ID}: nothing hidden by an orientation query is notApplicable`, () => {
  for (const css of [
    '',
    '@media (max-width: 400px) { .tableau { display: none } }',
    '@media (orientation: portrait) { .tableau { width: 100% } }',
    '@media (orientation: portrait) { .tableau { display: block } }',
    '@media (orientation: portrait) { .absent { display: none } }',
    '@media (orientation: portrait) { :unknown-pseudo { display: none } }'
  ]) {
    assertRule(runa11yCoreOnHtml(page(css, TABLE), RUN), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const html = page('@media (orientation: portrait) { .tableau { display: none } }', TABLE);
  const rule = assertRule(
    runa11yCoreOnHtml(html, { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Une media query « (orientation: portrait) » masque cet élément <table> (« .tableau »).'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('@media (orientation: portrait) { .tableau { display: none } }', TABLE);
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 13.9 rollup id run it`, () => {
  const html = page('@media (orientation: portrait) { .tableau { display: none } }', TABLE);
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-13.9' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'cantTell');
  }
});

// A table hidden in portrait does not restrict the view to one orientation,
// so WCAG 1.3.4 passes; RGAA 13.9.1 asks whether the content stays the same.
test(`${RULE_ID}: WCAG 1.3.4 passes a table hidden in portrait while RGAA 13.9 asks`, () => {
  const html = page('@media (orientation: portrait) { .tableau { display: none } }', TABLE);
  const result = runa11yCoreOnHtml(html, RGAA);
  assert.equal(rollup(result, 'wcag-1.3.4-orientation').outcome, 'pass');
  const rgaa = rollup(result, 'rgaa-4.1.2-13.9');
  assert.equal(rgaa.outcome, 'cantTell');
  assert.ok(rgaa.data.details.checksIds.includes(RULE_ID));
});

test(`${RULE_ID}: WCAG 1.3.4 and RGAA 13.9 agree on a page with no orientation query`, () => {
  const result = runa11yCoreOnHtml(page('p { color: #000 }', TABLE), RGAA);
  assert.equal(rollup(result, 'wcag-1.3.4-orientation').outcome, 'pass');
  assert.equal(rollup(result, 'rgaa-4.1.2-13.9').outcome, 'pass');
  assert.equal(result.checksResults.find((r) => r.ruleId === RULE_ID).outcome, 'notApplicable');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'ocp_case_01',
    'ocp_case_02',
    'ocp_case_03',
    'ocp_case_07',
    'ocp_case_07_alt'
  ]);
});
