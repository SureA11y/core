'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'presentational-elements-absent';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };

function page(body, doctype = '<!doctype html>') {
  return `${doctype}<html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const flagged = (rule) => rule.occurrences.map((o) => o.data.details.element);

test(`${RULE_ID}: a page without them passes`, () => {
  const html = page('<p><strong>Bold</strong> and <em>stressed</em></p>');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: every element RGAA lists fails, one occurrence each`, () => {
  const tags = ['basefont', 'big', 'blink', 'center', 'font', 'marquee', 's', 'strike', 'tt'];
  const html = page(tags.map((t) => `<${t}>x</${t}>`).join(''));
  const rule = assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'fail', {
    minOccurrences: tags.length,
    maxOccurrences: tags.length
  });
  assert.deepEqual(flagged(rule).sort(), tags.slice().sort());
  const occ = rule.occurrences.find((o) => o.data.details.element === 'font');
  assert.equal(occ.data.details.reasonCode, 'presentationalElement');
  assert.equal(occ.i18n.summaryKey, 'presentationalElementsAbsent_summary_fail');
  assert.deepEqual(occ.i18n.params, { element: 'font' });
  assert.equal(occ.summary, 'The presentational element <font> is used.');
});

test(`${RULE_ID}: <u> is flagged only without the HTML5 doctype`, () => {
  assertRule(runa11yCoreOnHtml(page('<u>x</u>'), RUN), RULE_ID, 'pass');
  for (const doctype of [
    '',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(page('<u>x</u>', doctype), RUN), RULE_ID, 'fail', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    assert.deepEqual(flagged(rule), ['u']);
  }
});

test(`${RULE_ID}: excludeSelectors apply as for any rule`, () => {
  const html = page('<div id="skip"><font>x</font></div>');
  assertRule(runa11yCoreOnHtml(html, { ...RUN, excludeSelectors: ['#skip'] }), RULE_ID, 'pass');
});

test(`${RULE_ID}: hidden content is part of the generated source and is checked`, () => {
  const html = page(
    '<div hidden><center id="h1">y</center></div>' +
      '<div style="display:none"><big id="h2">z</big></div>' +
      '<details><summary>More</summary><tt id="h3">t</tt></details>'
  );
  for (const opts of [
    RUN,
    { ...RUN, engineOptions: { includeHiddenElements: false } },
    { ...RUN, engineOptions: { includeHiddenElements: true } }
  ]) {
    const rule = assertRule(runa11yCoreOnHtml(html, opts), RULE_ID, 'fail', {
      minOccurrences: 3,
      maxOccurrences: 3
    });
    assert.deepEqual(flagged(rule), ['center', 'big', 'tt']);
  }
  const rgaa = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  assertRule(rgaa, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
});

test(`${RULE_ID}: <template> content is not in the DOM tree and is not checked`, () => {
  const html = page('<template><font>x</font></template>');
  assertRule(runa11yCoreOnHtml(html, RUN), RULE_ID, 'pass');
});

test(`${RULE_ID}: <basefont> is caught although it never renders, within scope and excludes`, () => {
  const html = page('<basefont id="b1"><div id="skip"><basefont id="b2"></div>');
  const rule = assertRule(
    runa11yCoreOnHtml(html, { ...RUN, excludeSelectors: ['#skip'] }),
    RULE_ID,
    'fail',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.match(rule.occurrences[0].html, /id="b1"/);
  const scoped = runa11yCoreOnHtml(html, { ...RUN, contextSelector: '#skip' });
  assert.match(
    assertRule(scoped, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 }).occurrences[0]
      .html,
    /id="b2"/
  );
});

test(`${RULE_ID}: opt-in, so a default run does not include it`, () => {
  const result = runa11yCoreOnHtml(page('<font>x</font>'));
  assert.ok(!result.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/presentational-elements-absent-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'presentational-elements-absent-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]);
  assert.deepEqual(ids, [
    'pel_case_01',
    'pel_case_02',
    'pel_case_03',
    'pel_case_04',
    'pel_case_05',
    'pel_case_08',
    'pel_case_09'
  ]);
});
