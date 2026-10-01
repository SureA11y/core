'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'meta-redirect-immediate';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(content, extraHead = '') {
  const meta = content == null ? '' : `<meta http-equiv="refresh" content="${content}">`;
  return `<!doctype html><html lang="en"><head><title>t</title>${meta}${extraHead}</head><body><main><p>x</p></main></body></html>`;
}

const run = (html, opts = RUN) => runa11yCoreOnHtml(html, opts);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: an immediate redirect passes`, () => {
  for (const content of [
    '0; url=/new',
    "0;URL='https://other.example/'",
    '0, https://other.example/'
  ]) {
    assertRule(run(page(content)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// 13.1.2 has no 20-hour exception, but a redirect from an obsolete address is
// essential, and then 13.1 is not applicable. So the rule asks.
test(`${RULE_ID}: a delayed redirect is asked about, however long the delay`, () => {
  for (const [content, delay, url] of [
    ['5; url=/new', 5, '/new'],
    ['100000; url=/new', 100000, '/new'],
    ["3; URL='https://other.example/page'", 3, 'https://other.example/page'],
    ['2 https://other.example/', 2, 'https://other.example/']
  ]) {
    const rule = assertRule(run(page(content)), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'delayedRedirect');
    assert.equal(occ.data.details.delay, delay);
    assert.equal(occ.data.details.url, url);
    assert.equal(occ.i18n.summaryKey, 'metaRedirectImmediate_summary_cantTell');
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: a refresh of the page itself is not applicable`, () => {
  for (const content of ['30', '0', '5; url=', "5; url='https://example.test/'"]) {
    assertRule(run(page(content)), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: no meta refresh, one in noscript, or a scoped run is not applicable`, () => {
  assertRule(run(page(null)), RULE_ID, 'notApplicable');
  assertRule(
    run(page(null, '<noscript><meta http-equiv="refresh" content="5; url=/x"></noscript>')),
    RULE_ID,
    'notApplicable'
  );
  assertRule(run(page('5; url=/x'), { ...RUN, contextSelector: 'main' }), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    run(page('5; url=/new'), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'cantTell'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cette page redirige l’utilisateur vers une autre adresse après 5 secondes.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page('5; url=/new'), { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 13.1 rollup id run it`, () => {
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-13.1' } } }
  ]) {
    const rule = runa11yCoreOnHtml(page('5; url=/new'), opts).checksResults.find(
      (r) => r.ruleId === RULE_ID
    );
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'cantTell');
  }
});

// meta-refresh-timing-absent fails a 5-second redirect and passes one of more
// than 20 hours; RGAA asks about both.
test(`${RULE_ID}: RGAA 13.1 asks where WCAG 2.2.1 fails or passes a delayed redirect`, () => {
  const short = runa11yCoreOnHtml(page('5; url=/new'), RGAA);
  assert.equal(rollup(short, 'rgaa-4.1.2-13.1').outcome, 'cantTell');
  assert.equal(rollup(short, 'wcag-2.2.1-timing-adjustable').outcome, 'fail');
  const long = runa11yCoreOnHtml(page('100000; url=/new'), RGAA);
  assert.equal(rollup(long, 'rgaa-4.1.2-13.1').outcome, 'cantTell');
  assert.equal(rollup(long, 'wcag-2.2.1-timing-adjustable').outcome, 'pass');
});

test(`${RULE_ID}: RGAA 13.1 and WCAG 2.2.1 agree on an immediate redirect`, () => {
  const result = runa11yCoreOnHtml(page('0; url=/new'), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-13.1').outcome, 'pass');
  assert.equal(rollup(result, 'wcag-2.2.1-timing-adjustable').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const rule = assertRule(run(fs.readFileSync(fixturePath, 'utf8')), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.url, '/new-address');
});
