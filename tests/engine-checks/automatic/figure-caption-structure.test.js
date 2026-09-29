'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'figure-caption-structure';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const figure = (attrs, image = '<img src="a.png" alt="Chart">', caption = 'Sales in 2025') =>
  `<figure ${attrs}>${image}<figcaption>${caption}</figcaption></figure>`;

test(`${RULE_ID}: role="figure" or "group" with an aria-label matching the caption passes`, () => {
  for (const role of ['figure', 'group', 'FIGURE']) {
    const html = page(figure(`role="${role}" aria-label="Sales in 2025"`));
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: whitespace in the label or caption does not count as a difference`, () => {
  const html = page(
    figure('role="figure" aria-label=" Sales  in 2025"', undefined, '\n Sales in\n 2025 ')
  );
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass');
});

test(`${RULE_ID}: a figure without a captioned image is not applicable`, () => {
  const cases = [
    '<figure><img src="a.png" alt="Chart"></figure>',
    '<figure><pre>code</pre><figcaption>Code</figcaption></figure>',
    '<figure><img src="a.png" alt="Chart"><figcaption> </figcaption></figure>',
    // The image belongs to the inner figure, which has no caption.
    '<figure><figure><img src="a.png" alt="Chart"></figure><figcaption>Outer</figcaption></figure>'
  ];
  for (const body of cases)
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: each missing piece has its own reason and summary`, () => {
  const cases = [
    [
      '',
      'missingRole',
      ['missingRole', 'missingAriaLabel'],
      'figureCaptionStructure_summary_fail_role'
    ],
    [
      'role="figure"',
      'missingAriaLabel',
      ['missingAriaLabel'],
      'figureCaptionStructure_summary_fail_label'
    ],
    [
      'role="figure" aria-label="Chart"',
      'ariaLabelMismatch',
      ['ariaLabelMismatch'],
      'figureCaptionStructure_summary_fail_mismatch'
    ],
    [
      'role="region" aria-label="Sales in 2025"',
      'missingRole',
      ['missingRole'],
      'figureCaptionStructure_summary_fail_role'
    ]
  ];
  for (const [attrs, reasonCode, reasons, summaryKey] of cases) {
    const rule = assertRule(runa11yCoreOnHtml(page(figure(attrs)), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, reasonCode, attrs);
    assert.deepEqual(occ.data.details.reasons, reasons, attrs);
    assert.equal(occ.data.details.caption, 'Sales in 2025');
    assert.equal(occ.i18n.summaryKey, summaryKey, attrs);
    assert.equal(occ.i18n.hintKey, 'figureCaptionStructure_hint_fail');
  }
});

test(`${RULE_ID}: image buttons and role="img" count as images`, () => {
  for (const image of [
    '<input type="image" src="a.png" alt="Go">',
    '<span role="img" aria-label="Star">*</span>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(figure('', image)), RUN), RULE_ID, 'fail');
  }
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(figure('')));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/figure-caption-structure-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'figure-caption-structure-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['fcs_case_01', 'fcs_case_02', 'fcs_case_03', 'fcs_case_04']);
});
