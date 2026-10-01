'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'focus-indicator-contrast';
const WCAG_RULE = 'css-focus-indicator-suppressed';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(
  css,
  body = '<a href="/x">Opening hours</a>',
  rootCss = 'html,body{background:#fff;color:#000}'
) {
  return `<!doctype html><html lang="en"><head><title>t</title><style>${rootCss} ${css}</style></head><body><main>${body}</main></body></html>`;
}

const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);

function only(html, outcome, opts = {}) {
  return assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, outcome, opts);
}

test(`${RULE_ID}: a light box-shadow in place of the outline fails`, () => {
  const rule = only(page('a:focus{outline:none;box-shadow:0 0 0 2px #eee}'), 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.deepEqual(occ.data.details, {
    reasonCode: 'lowContrast',
    property: 'box-shadow',
    color: '#eeeeee',
    ratios: [1.16, 1.16]
  });
  assert.equal(occ.i18n.summaryKey, 'focusIndicatorContrast_summary_fail_lowContrast');
  assert.equal(occ.i18n.hintKey, 'focusIndicatorContrast_hint_fail_lowContrast');
  assert.deepEqual(occ.i18n.params, { property: 'box-shadow', color: '#eeeeee', ratio: '1.16' });
  assert.equal(
    occ.summary,
    'The box-shadow this element shows on focus (#eeeeee) has a contrast ratio of 1.16:1 with the colors next to it, below 3:1.'
  );
});

test(`${RULE_ID}: a light outline, outline longhands or a light border fail`, () => {
  for (const [css, body] of [
    ['a:focus{outline:2px solid #ccc}', undefined],
    [
      'a:focus{outline:none} a:focus{outline-style:solid;outline-width:2px;outline-color:#ddd}',
      undefined
    ],
    [
      'button{border:1px solid #767676;background:#fff} button:focus{outline:none;border-color:#eee}',
      '<button type="button">Go</button>'
    ],
    ['a:focus{outline:2px solid #eee !important} a:focus{outline:2px solid #000}', undefined]
  ]) {
    const html = body === undefined ? page(css) : page(css, body);
    only(html, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  }
  // With no color given, the outline takes the element's text color.
  only(
    page(
      'button{color:#ddd;background:#fff;border:0} button:focus{outline:2px solid}',
      '<button type="button">Go</button>'
    ),
    'fail'
  );
});

test(`${RULE_ID}: an indicator of at least 3:1 against both sides passes`, () => {
  for (const css of [
    'a:focus{outline:2px solid #000}',
    'a:focus:not(:focus-visible){outline:none} a:focus-visible{outline:3px solid #005fcc}',
    'a{outline:none} a:focus-visible{box-shadow:inset 0 0 0 2px #333}',
    '*:focus{outline:none} a:focus{outline:2px solid #767676}'
  ]) {
    only(page(css), 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: one passing indicator is enough`, () => {
  only(page('a:focus{outline:2px solid #eee;box-shadow:0 0 0 4px #000}'), 'pass');
});

test(`${RULE_ID}: a color or background it cannot compute is asked about`, () => {
  for (const [css, rootCss, cause] of [
    [
      'a:focus{outline:2px solid #ccc}',
      'html,body{color:#000} body{background:url(x.png) #fff}',
      'background'
    ],
    ['a:focus{outline:2px solid var(--c)}', undefined, 'color'],
    ['a:focus{outline:2px solid #000}', 'html,body{color:#000}', 'background'],
    ['a:focus{outline:none;box-shadow:0 0 4px #000}', undefined, 'blur'],
    [':is(a,button):focus{outline:none} a:focus{outline:2px solid #eee}', undefined, 'cascade'],
    ['@media print{a:focus{outline:2px solid #eee}}', undefined, 'condition']
  ]) {
    const rule = only(page(css, undefined, rootCss), 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const d = rule.occurrences[0].data.details;
    assert.equal(d.reasonCode, 'notComputable', css);
    assert.equal(d.cause, cause, css);
  }
});

test(`${RULE_ID}: 3:1 against one side only is asked about`, () => {
  const rule = only(
    page('a{background:#000;color:#fff} a:focus{outline:2px solid #fff}'),
    'cantTell'
  );
  const d = rule.occurrences[0].data.details;
  assert.equal(d.reasonCode, 'oneSide');
  assert.deepEqual(d.ratios, [1, 21]);
  assert.equal(rule.occurrences[0].i18n.params.ratio, '1');
});

test(`${RULE_ID}: a focus style made of other changes is asked about`, () => {
  for (const [css, body] of [
    ['a:focus{outline:none;background:#ff0}', undefined],
    ['a:focus{outline:2px solid #eee;text-decoration:underline}', undefined],
    ['a:focus{outline:none} a:focus::after{content:"<"}', undefined],
    ['a:focus{outline:2px solid #eee}', '<a href="/x" onfocus="mark(this)">Opening hours</a>']
  ]) {
    const html = body === undefined ? page(css) : page(css, body);
    const rule = only(html, 'cantTell');
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'notMeasured', css);
  }
});

test(`${RULE_ID}: the browser outline kept, or removed with nothing in its place, is notApplicable`, () => {
  for (const css of [
    '',
    'a:focus{box-shadow:0 0 0 2px #eee}',
    'a:focus{outline:auto}',
    'a:focus{outline-offset:4px}',
    'a:focus{outline:none}',
    'a{outline:none}'
  ]) {
    only(page(css), 'notApplicable', { maxOccurrences: 0 });
  }
  // Not in the tab order, or not rendered.
  only(page('a:focus{outline:2px solid #eee}', '<a>No href</a>'), 'notApplicable');
  only(
    page('a:focus{outline:2px solid #eee}', '<a href="/x" style="display:none">x</a>'),
    'notApplicable'
  );
});

test(`${RULE_ID}: the style attribute takes part in the cascade`, () => {
  only(
    page('a:focus{outline:2px solid #000}', '<a href="/x" style="outline:none">Opening hours</a>'),
    'notApplicable'
  );
});

test(`${RULE_ID}: fails and questions are reported side by side`, () => {
  const html = page(
    '#a:focus{outline:2px solid #eee} #b:focus{outline:2px solid var(--c)}',
    '<a id="a" href="/a">A</a> <a id="b" href="/b">B</a>'
  );
  const rule = only(html, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.deepEqual(
    rule.occurrences.map((o) => o.occurrenceOutcome),
    ['fail', 'cantTell']
  );
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('a:focus{outline:2px solid #ccc}'), {
      ...RUN,
      engineOptions: { locale: 'fr' }
    }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'L’indication de prise de focus de cet élément (outline, #cccccc) a un rapport de contraste de 1.61:1 avec les couleurs qui l’entourent, en dessous de 3:1.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('a:focus{outline:2px solid #ccc}');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!check(result, RULE_ID), JSON.stringify(engineOptions));
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 10.7 rollup id run it`, () => {
  const html = page('a:focus{outline:2px solid #ccc}');
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-10.7' } } }
  ]) {
    const rule = check(runa11yCoreOnHtml(html, opts), RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// WCAG 2.4.7 asks only for a visible indicator; RGAA 10.7.1 also asks for
// 3:1. The WCAG rollup stays at manual-review's page-level question.
test(`${RULE_ID}: WCAG 2.4.7 has no finding on a light box-shadow, RGAA 10.7 fails it`, () => {
  const result = runa11yCoreOnHtml(page('a:focus{outline:none;box-shadow:0 0 0 2px #eee}'), RGAA);
  assert.equal(check(result, WCAG_RULE).outcome, 'notApplicable');
  const wcag = rollup(result, 'wcag-2.4.7-focus-visible');
  assert.notEqual(wcag.outcome, 'fail');
  assert.deepEqual(
    wcag.data.details.contributors.filter((c) => c.outcome === 'cantTell').map((c) => c.testId),
    ['manual-review']
  );
  assert.equal(rollup(result, 'rgaa-4.1.2-10.7').outcome, 'fail');
});

test(`${RULE_ID}: WCAG 2.4.7 and RGAA 10.7 agree on a black outline`, () => {
  const result = runa11yCoreOnHtml(page('a:focus{outline:2px solid #000}'), RGAA);
  assert.equal(check(result, WCAG_RULE).outcome, 'notApplicable');
  assert.equal(check(result, RULE_ID).outcome, 'pass');
  assert.notEqual(rollup(result, 'wcag-2.4.7-focus-visible').outcome, 'fail');
  assert.notEqual(rollup(result, 'rgaa-4.1.2-10.7').outcome, 'fail');
});

test(`${RULE_ID}: an outline removed with no replacement stays css-focus-indicator-suppressed's question`, () => {
  const result = runa11yCoreOnHtml(page('a:focus{outline:none}'), RGAA);
  assert.equal(check(result, WCAG_RULE).outcome, 'cantTell');
  assert.equal(check(result, RULE_ID).outcome, 'notApplicable');
  assert.equal(rollup(result, 'wcag-2.4.7-focus-visible').outcome, 'cantTell');
  assert.equal(rollup(result, 'rgaa-4.1.2-10.7').outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const rule = assertRule(
    runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN),
    RULE_ID,
    'fail',
    { minOccurrences: 7, maxOccurrences: 7 }
  );
  const byOutcome = (tier) =>
    rule.occurrences
      .filter((o) => o.occurrenceOutcome === tier)
      .map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(byOutcome('fail'), ['fic_case_01', 'fic_case_02', 'fic_case_03']);
  assert.deepEqual(byOutcome('cantTell'), [
    'fic_case_06',
    'fic_case_07',
    'fic_case_08',
    'fic_case_09'
  ]);
});
