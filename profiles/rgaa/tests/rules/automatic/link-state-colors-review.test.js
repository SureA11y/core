'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'link-state-colors-review';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(css, body) {
  return `<!doctype html><html lang="fr"><head><title>t</title><style>p{color:#000;background:#fff} ${css}</style></head><body><main>${body}</main></body></html>`;
}

const TEXT_LINK = '<p>Lire <a href="/x">la suite</a> ici.</p>';

function run(css, body = TEXT_LINK) {
  return runa11yCoreOnHtml(page(css, body), RUN);
}

test(`${RULE_ID}: a link shown only by color whose state rules change that color is asked about`, () => {
  for (const [css, states] of [
    ['p a{color:#d00;text-decoration:none} a:visited{color:#333}', ['visited']],
    ['p a{color:#d00;text-decoration:none} a:hover,a:focus{color:#900}', ['hover', 'focus']],
    ['p a{color:#d00;text-decoration:none} p a:active{color:#600}', ['active']],
    ['p a{color:#d00;text-decoration:none} a:focus-visible{color:#600}', ['focus-visible']]
  ]) {
    const rule = assertRule(run(css), RULE_ID, 'cantTell', { maxOccurrences: 1 });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'STATE_COLOR_CHANGE', css);
    assert.deepEqual(occ.data.details.states, states, css);
    assert.equal(occ.i18n.summaryKey, 'linkStateColorsReview_summary_cantTell_stateColor');
    assert.equal(occ.i18n.hintKey, 'linkStateColorsReview_hint_cantTell');
    assert.equal(occ.i18n.params.states, states.join(', '));
    assert.equal(occ.uncertainty.code, 'runtime-dependent');
  }
  const rule = assertRule(
    run('p a{color:#d00;text-decoration:none} a:visited{color:#333}'),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'This link in a run of text is shown only by its color, and a style rule changes that color in these states: visited.'
  );
});

test(`${RULE_ID}: a link with no author color is asked about, since the browser's visited color differs`, () => {
  const rule = assertRule(run('p a{text-decoration:none}'), RULE_ID, 'cantTell');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'BROWSER_STATE_COLORS');
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'linkStateColorsReview_summary_cantTell_browserColors'
  );
  // A color set only for :link leaves the visited state to the browser too.
  const linkOnly = assertRule(
    run('p a{text-decoration:none} a:link{color:#d00}'),
    RULE_ID,
    'cantTell'
  );
  assert.equal(linkOnly.occurrences[0].data.details.reasonCode, 'BROWSER_STATE_COLORS');
});

test(`${RULE_ID}: links marked by more than color, or whose states keep one color, are not applicable`, () => {
  for (const [css, body] of [
    ['', TEXT_LINK],
    ['p a{color:#d00;text-decoration:none}', TEXT_LINK],
    ['p a{color:#d00} a:hover{color:#900}', TEXT_LINK],
    ['p a{color:#d00;text-decoration:none;font-weight:bold} a:hover{color:#900}', TEXT_LINK],
    ['p a{color:#d00;text-decoration:none;border-bottom:1px solid} a:hover{color:#900}', TEXT_LINK],
    [
      'p a{color:#d00;text-decoration:none} a:hover{color:#900;text-decoration:underline}',
      TEXT_LINK
    ],
    [
      'a{color:#d00;text-decoration:none} a:hover{color:#900}',
      '<nav><a href="/x">Accueil</a></nav>'
    ],
    [
      'p a{color:#d00;text-decoration:none} a:hover{color:#900}',
      '<p>Lire <a href="/x"><img src="i.png" alt="">la suite</a> ici.</p>'
    ]
  ]) {
    assertRule(run(css, body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

// --- opt-in gate -------------------------------------------------------------

const PAGE = page('p a{color:#d00;text-decoration:none} a:visited{color:#333}', TEXT_LINK);

test(`${RULE_ID}: opt-in, so a default run, a WCAG profile and an EN 301 549 profile do not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(PAGE, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the rgaa-4.1.2 profile, the rgaa tag and the 10.6 rollup run it`, () => {
  for (const options of [
    { engineOptions: { profile: 'rgaa-4.1.2' } },
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-10.6' } } }
  ]) {
    const result = runa11yCoreOnHtml(PAGE, options);
    assert.ok(
      result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(options)
    );
  }
});

test(`${RULE_ID}: the map links it to 10.6.1, and link-in-text-block keeps it`, () => {
  const map = RGAA_RULE_TESTS['4.1.2'];
  assert.deepEqual(map[RULE_ID].tests, ['10.6.1']);
  assert.deepEqual(map['link-in-text-block'].tests, ['10.6.1']);
});

// --- RGAA and WCAG rollups in one run --------------------------------------------

function rollups(css, body = TEXT_LINK) {
  const result = runa11yCoreOnHtml(page(css, body), {
    engineOptions: { profile: 'rgaa-4.1.2' }
  });
  const outcome = (ruleId) => {
    const r = result.rulesResults.find((x) => x.ruleId === ruleId);
    return r ? r.outcome : 'missing';
  };
  return { rgaa: outcome('rgaa-4.1.2-10.6'), wcag: outcome('wcag-1.4.1-use-of-color') };
}

// A highlight is a mark other than color, for link-in-text-block and here.
test(`${RULE_ID}: a highlighted link whose hover changes only its color passes under WCAG and RGAA`, () => {
  const css = 'p a{color:#000;background:#ff0;text-decoration:none} a:hover{color:#900}';
  assert.equal(run(css).checksResults.find((r) => r.ruleId === RULE_ID).outcome, 'notApplicable');
  const r = rollups(css);
  assert.equal(r.wcag, 'pass');
  assert.equal(r.rgaa, 'pass');
});

test(`${RULE_ID}: WCAG and RGAA agree on an underlined link and on one shown by color below 3:1`, () => {
  const good = rollups('p a{color:#000;text-decoration:underline} a:hover{color:#900}');
  assert.equal(good.wcag, 'pass');
  assert.equal(good.rgaa, 'pass');
  const bad = rollups('p a{color:#111;text-decoration:none} a:hover{color:#222}');
  assert.equal(bad.wcag, 'fail');
  assert.equal(bad.rgaa, 'fail');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/link-state-colors-review-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'link-state-colors-review-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'cantTell');
  const got = rule.occurrences.map((o) => [
    (o.html.match(/id="([^"]+)"/) || [])[1],
    o.data.details.reasonCode
  ]);
  got.sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(got, [
    ['lscr_case_01', 'STATE_COLOR_CHANGE'],
    ['lscr_case_02', 'STATE_COLOR_CHANGE'],
    ['lscr_case_03', 'BROWSER_STATE_COLORS']
  ]);
});
