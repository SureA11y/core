'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'dir-attribute-valid';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body, htmlAttrs = '') {
  return `<!doctype html><html lang="en" ${htmlAttrs}><head><title>t</title></head><body>${body}</body></html>`;
}

test(`${RULE_ID}: ltr and rtl pass, whatever the case or surrounding spaces`, () => {
  const html = page('<p dir="rtl">a</p><p dir="LTR">b</p><p dir=" rtl ">c</p>', 'dir="ltr"');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: a page without dir is not applicable`, () => {
  assertRule(runa11yCoreOnHtml(page('<p>a</p>'), RUN), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: dir="auto" fails with its own reason`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page('<p dir="auto">a</p>'), RUN), RULE_ID, 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'autoDir');
  assert.equal(occ.i18n.summaryKey, 'dirAttributeValid_summary_fail_auto');
  assert.equal(occ.summary, 'This element uses dir="auto"; RGAA accepts only ltr or rtl.');
});

test(`${RULE_ID}: any other value fails and is quoted as written`, () => {
  for (const value of ['rlt', '', 'right']) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(`<p dir="${value}">a</p>`), RUN),
      RULE_ID,
      'fail',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'invalidDir', value);
    assert.equal(occ.data.details.value, value);
    assert.equal(occ.i18n.summaryKey, 'dirAttributeValid_summary_fail_invalid');
    assert.deepEqual(occ.i18n.params, { value });
  }
});

test(`${RULE_ID}: the root element is checked too`, () => {
  const rule = assertRule(runa11yCoreOnHtml(page('<p>a</p>', 'dir="rtl-x"'), RUN), RULE_ID, 'fail');
  assert.equal(rule.occurrences[0].data.details.value, 'rtl-x');
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page('<p dir="auto">a</p>'));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/dir-attribute-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'dir-attribute-valid-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, ['dav_case_01', 'dav_case_02', 'dav_case_03']);
});
