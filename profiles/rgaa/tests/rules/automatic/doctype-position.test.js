'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { RGAA_RULE_TESTS } = require('../../../rule-map.js');
const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'doctype-position';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const URL = 'https://example.test/page';

const BODY = '<head><title>t</title></head><body><p>x</p></body></html>';
const LATE = '<html lang="fr">\n<!DOCTYPE html>\n' + BODY;
const EARLY = '<!DOCTYPE html>\n<html lang="fr">' + BODY;
const NONE = '<html lang="fr">' + BODY;

function run(html, source, extra = {}) {
  const probes = source === undefined ? undefined : { 'page.source': source };
  return runa11yCoreOnHtml(html, {
    ...RUN,
    url: URL,
    engineOptions: { ...(probes ? { probes } : {}), ...extra }
  });
}
const reasonOf = (rule) => rule.occurrences[0].data.details.reasonCode;

test(`${RULE_ID}: a doctype in the DOM passes, with or without the source`, () => {
  assertRule(run(EARLY), RULE_ID, 'pass');
  assertRule(run(EARLY, { url: URL, start: EARLY }), RULE_ID, 'pass');
});

test(`${RULE_ID}: a doctype after <html> in the source fails`, () => {
  for (const start of [
    LATE,
    '<!-- <!DOCTYPE html> in a comment does not count -->\n' + LATE,
    '\uFEFF<html>\n<!doctype html>'
  ]) {
    const rule = assertRule(run(LATE, { url: URL, start }), RULE_ID, 'fail', { maxOccurrences: 1 });
    assert.equal(reasonOf(rule), 'DOCTYPE_AFTER_HTML', start);
    assert.equal(rule.occurrences[0].selector, 'html');
  }
});

test(`${RULE_ID}: a doctype before <html>, after a comment, passes`, () => {
  assertRule(run(LATE, { url: URL, start: '<!-- build 42 -->\n' + EARLY }), RULE_ID, 'pass');
});

test(`${RULE_ID}: a source with no doctype is notApplicable here`, () => {
  assertRule(run(NONE, { url: URL, start: NONE }), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
});

test(`${RULE_ID}: with no doctype in the DOM it asks when the source is missing, another page's, or too short`, () => {
  for (const [source, reason] of [
    [undefined, 'SOURCE_MISSING'],
    [{ url: 'https://example.test/other', start: LATE }, 'SOURCE_MISSING'],
    [{ url: URL }, 'SOURCE_MISSING'],
    [{ url: URL, start: '<!-- ' + 'x'.repeat(100) }, 'SOURCE_TOO_SHORT']
  ]) {
    const rule = assertRule(run(LATE, source), RULE_ID, 'cantTell');
    assert.equal(reasonOf(rule), reason, JSON.stringify(source));
    assert.equal(rule.occurrences[0].uncertainty.code, 'out-of-scope');
  }
  // A probe with no url is taken as this page's.
  assertRule(run(LATE, { start: LATE }), RULE_ID, 'fail');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(run(LATE, { url: URL, start: LATE }, { locale: 'ja' }), RULE_ID, 'fail');
  assert.match(rule.occurrences[0].summary, /<html> タグの後で doctype を宣言/);
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(LATE, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

// One defect, one failure: with the source, 8.1.1 sees the doctype and 8.1.3 fails its place.
test(`${RULE_ID}: under the RGAA profile, the late doctype fails 8.1.3 and not 8.1.1`, () => {
  const result = runa11yCoreOnHtml(LATE, {
    url: URL,
    engineOptions: { profile: 'rgaa-4.1.2', probes: { 'page.source': { url: URL, start: LATE } } }
  });
  const check = (id) => result.checksResults.find((r) => r.ruleId === id).outcome;
  assert.equal(check(RULE_ID), 'fail');
  assert.equal(check('doctype-present'), 'pass');
  assert.equal(result.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-8.1').outcome, 'fail');
  assert.deepEqual(RGAA_RULE_TESTS['4.1.2'][RULE_ID].tests, ['8.1.3']);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const asked = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'cantTell');
  assert.equal(reasonOf(asked), 'SOURCE_MISSING');
  const failed = assertRule(
    runa11yCoreOnHtml(html, {
      ...RUN,
      engineOptions: { probes: { 'page.source': { start: html.slice(0, 2000) } } }
    }),
    RULE_ID,
    'fail'
  );
  assert.equal(reasonOf(failed), 'DOCTYPE_AFTER_HTML');
});
