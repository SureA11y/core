'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'meta-refresh-no-url-timing';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(content, extraHead = '') {
  const meta = content == null ? '' : `<meta http-equiv="refresh" content="${content}">`;
  return `<!doctype html><html lang="en"><head><title>t</title>${meta}${extraHead}</head><body><main><p>x</p></main></body></html>`;
}

const run = (html, opts = RUN) => runa11yCoreOnHtml(html, opts);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test(`${RULE_ID}: a refresh under 20 hours fails, 0 included`, () => {
  for (const [content, delay] of [
    ['30', 30],
    ['1', 1],
    ['71999', 71999],
    ['0', 0],
    ['5; url=', 5],
    ["3; URL='https://example.test/'", 3]
  ]) {
    const rule = assertRule(run(page(content)), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'refreshUnder20Hours', content);
    assert.equal(occ.data.details.delay, delay);
    assert.equal(occ.i18n.summaryKey, 'metaRefreshNoUrlTiming_summary_fail');
    assert.deepEqual(occ.i18n.params, { delay: String(delay) });
  }
});

// 13.1.1: « La limite de temps entre deux rafraîchissements est de vingt
// heures, au moins ».
test(`${RULE_ID}: a refresh of 20 hours or more passes`, () => {
  for (const content of ['72000', '100000']) {
    assertRule(run(page(content)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a redirect to another address is not applicable`, () => {
  for (const content of [
    '5; url=/new',
    "0;URL='https://other.example/'",
    '5; https://example.test/#top'
  ]) {
    assertRule(run(page(content)), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: only the first valid meta refresh counts`, () => {
  const html = page(
    'abc',
    '<meta http-equiv="refresh" content="5; url=/new"><meta http-equiv="refresh" content="30">'
  );
  assertRule(run(html), RULE_ID, 'notApplicable');
  const later = page('30', '<meta http-equiv="refresh" content="5; url=/new">');
  assertRule(run(later), RULE_ID, 'fail');
});

test(`${RULE_ID}: no meta refresh, one in noscript, or an invalid value is not applicable`, () => {
  for (const html of [
    page(null),
    page(null, '<noscript><meta http-equiv="refresh" content="30"></noscript>'),
    page('soon'),
    page('5:1')
  ]) {
    assertRule(run(html), RULE_ID, 'notApplicable');
  }
  assertRule(
    run(page('30'), { ...RUN, engineOptions: { fragment: true } }),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    run(page('30'), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cette page se rafraîchit toutes les 30 secondes, moins de 20 heures.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page('30'), { engineOptions });
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
    const rule = runa11yCoreOnHtml(page('30'), opts).checksResults.find(
      (r) => r.ruleId === RULE_ID
    );
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// WCAG 2.2.1's exception is for limits "longer than 20 hours"; RGAA 13.1.1
// accepts twenty hours "au moins".
test(`${RULE_ID}: a refresh of exactly 20 hours passes RGAA 13.1 and fails WCAG 2.2.1`, () => {
  const result = runa11yCoreOnHtml(page('72000'), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-13.1').outcome, 'pass');
  assert.equal(rollup(result, 'wcag-2.2.1-timing-adjustable').outcome, 'fail');
});

// meta-refresh-timing-absent treats a zero delay as an immediate redirect;
// without a URL it reloads the page over and over.
test(`${RULE_ID}: a zero-delay reload fails RGAA 13.1 and passes WCAG 2.2.1`, () => {
  const result = runa11yCoreOnHtml(page('0'), RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-13.1').outcome, 'fail');
  assert.equal(rollup(result, 'wcag-2.2.1-timing-adjustable').outcome, 'pass');
});

test(`${RULE_ID}: RGAA 13.1 and WCAG 2.2.1 agree on a 30-second refresh and a 24-hour one`, () => {
  const short = runa11yCoreOnHtml(page('30'), RGAA);
  assert.equal(rollup(short, 'rgaa-4.1.2-13.1').outcome, 'fail');
  assert.equal(rollup(short, 'wcag-2.2.1-timing-adjustable').outcome, 'fail');
  const long = runa11yCoreOnHtml(page('86400'), RGAA);
  assert.equal(rollup(long, 'rgaa-4.1.2-13.1').outcome, 'pass');
  assert.equal(rollup(long, 'wcag-2.2.1-timing-adjustable').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const rule = assertRule(run(fs.readFileSync(fixturePath, 'utf8')), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.delay, 30);
});
