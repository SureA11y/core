'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'svg-hidden-no-alternative';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const svg = (attrs, inner = '') =>
  `<svg aria-hidden="true" width="16" height="16" ${attrs}>${inner}<circle cx="8" cy="8" r="6"/></svg>`;

test(`${RULE_ID}: a hidden SVG with no text alternative passes`, () => {
  for (const html of [
    page(svg('')),
    page(svg('aria-label=" "', '<title></title><desc> </desc>'))
  ]) {
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: an SVG not hidden with aria-hidden="true" is not applicable`, () => {
  for (const body of [
    '<svg role="img" aria-label="Star"></svg>',
    '<svg aria-hidden="false" aria-label="Star"></svg>',
    '<p>No SVG</p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'notApplicable');
  }
});

test(`${RULE_ID}: each kind of text alternative fails and is named`, () => {
  const cases = [
    [svg('aria-label="Star"'), ['aria-label']],
    [svg('aria-labelledby="x"'), ['aria-labelledby']],
    [svg('title="Star"'), ['title']],
    [svg('', '<title>Star</title>'), ['<title>']],
    [svg('', '<g><desc>A star</desc></g>'), ['<desc>']],
    [svg('aria-label="Star"', '<title>Star</title>'), ['aria-label', '<title>']]
  ];
  for (const [body, alternatives] of cases) {
    const rule = assertRule(runa11yCoreOnHtml(page(body), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'hiddenSvgHasAlternative');
    assert.deepEqual(occ.data.details.alternatives, alternatives, body);
    assert.deepEqual(occ.i18n.params, { alternatives: alternatives.join(', ') });
  }
});

test(`${RULE_ID}: a nested hidden SVG is reported through its outer SVG only`, () => {
  const html = page(svg('', `<svg aria-hidden="true"><title>Inner</title></svg>`));
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(
    rule.occurrences[0].summary,
    'This SVG is hidden with aria-hidden="true" but carries a text alternative: <title>.'
  );
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page(svg('aria-label="Star"')));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/svg-hidden-no-alternative-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'svg-hidden-no-alternative-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'shn_case_01',
    'shn_case_02',
    'shn_case_03',
    'shn_case_04',
    'shn_case_09'
  ]);
});

// RGAA criterion 1.2 note: for a decorative <svg> drawn through <use>, 1.2.4
// also applies to the <svg>/<symbol> the <use> points to.
const SPRITE =
  '<svg style="display:none"><symbol id="i"><title>Panier</title><path d="M0 0h1v1z"/></symbol>' +
  '<symbol id="e"><title></title><path d="M0 0h1v1z"/></symbol>' +
  '<symbol id="outer"><use href="#i"/></symbol></svg>';

test(`${RULE_ID}: a <use> pointing at a symbol with a <title> fails`, () => {
  for (const use of ['<use href="#i"/>', '<use xlink:href="#i"/>', '<use href="#outer"/>']) {
    const html = page(`${SPRITE}<svg id="s" aria-hidden="true">${use}</svg>`);
    const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.ok(occ.html.includes('id="s"'), use);
    assert.deepEqual(occ.data.details.alternatives, ['<title>']);
    assert.ok(occ.data.details.usesReferenced.length >= 1, use);
  }
});

test(`${RULE_ID}: a <use> pointing at an empty symbol, a missing id or another file passes`, () => {
  for (const use of ['<use href="#e"/>', '<use href="#missing"/>', '<use href="icons.svg#i"/>']) {
    const html = page(`${SPRITE}<svg aria-hidden="true">${use}</svg>`);
    assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: under the rgaa-4.1.2 profile, the <use> case fails 1.1.5 and 1.2.4`, () => {
  const html = page(`${SPRITE}<svg aria-hidden="true"><use href="#i"/></svg>`);
  const rule = assertRule(
    runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } }),
    RULE_ID,
    'fail'
  );
  const tests = rule.meta.normativeMappings
    .filter((m) => m.standard === 'RGAA')
    .map((m) => m.requirement)
    .sort();
  assert.deepEqual(tests, ['1.1.5', '1.2.4']);
  const wcag = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  assert.ok(!wcag.checksResults.some((r) => r.ruleId === RULE_ID));
});
