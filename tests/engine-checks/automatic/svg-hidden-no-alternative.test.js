'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

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
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['shn_case_01', 'shn_case_02', 'shn_case_03', 'shn_case_04']);
});
