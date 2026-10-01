'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'definition-list-children-valid';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no dl is present`, () => {
  const html = `<!doctype html><html><body><div>no lists</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the dl has no element children`, () => {
  const html = `<!doctype html><html><body><dl></dl></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when dl directly contains dt/dd`, () => {
  const html = `<!doctype html><html><body><dl><dt>Term</dt><dd>Definition</dd></dl></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when dt/dd is wrapped in a single div`, () => {
  const html = `<!doctype html><html><body><dl><div><dt>Term</dt><dd>Definition</dd></div></dl></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when dl has a non-dt/dd direct child`, () => {
  const html = `<!doctype html><html><body><dl id="a"><dt>Term</dt><dd>Definition</dd><p>oops</p></dl></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.deepStrictEqual(rule.occurrences[0].data.details.invalidChildren, ['p']);
});

test(`${RULE_ID}: fail when dt is present with no matching dd (unbalanced pairing)`, () => {
  const html = `<!doctype html><html><body><dl id="b"><dt>Term</dt></dl></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'DL_NO_DT_DD');
});

test(`${RULE_ID}: fail when dd is present with no matching dt (unbalanced pairing)`, () => {
  const html = `<!doctype html><html><body><dl id="b"><dd>Definition</dd></dl></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'DL_NO_DT_DD');
});

test(`${RULE_ID}: pass when dl has no dt/dd and nothing else after flattening (empty wrapping div)`, () => {
  const html = `<!doctype html><html><body><dl id="b"><div></div></dl></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when dl's only children are passthrough (script/template)`, () => {
  const html = `<!doctype html><html><body><dl id="a"><script></script></dl><dl id="b"><template></template></dl></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><dl id="a"><p>oops</p></dl></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Description lists must be structured correctly');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/definition-list-children-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'definition-list-children-valid-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });

  const expectedFailIds = [
    'dlv_case_03',
    'dlv_case_05',
    'dlv_case_09',
    'dlv_case_10',
    'dlv_case_11',
    'dlv_case_12',
    'dlv_case_13'
  ];
  const expectedNoOccIds = [
    'dlv_case_01',
    'dlv_case_02',
    'dlv_case_04',
    'dlv_case_06',
    'dlv_case_07',
    'dlv_case_08',
    'dlv_case_14'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: fail when the dt/dd groups are out of order`, () => {
  for (const markup of [
    '<dl id="a"><dd>b</dd><dt>a</dt></dl>',
    '<dl id="a"><dt>a</dt><dd>b</dd><dt>c</dt></dl>',
    '<dl id="a"><div><dd>b</dd></div><div><dt>a</dt></div></dl>'
  ]) {
    for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
      const html = `<!doctype html><html><body>${markup}</body></html>`;
      const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
      const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
      assert.ok(hasOccurrenceForId(rule, 'a'), markup);
      assert.equal(rule.occurrences[0].data.details.reasonCode, 'DL_DT_DD_ORDER', markup);
    }
  }
});

test(`${RULE_ID}: pass for several dt then several dd, repeated`, () => {
  const html = `<!doctype html><html><body><dl><dt>a</dt><dt>b</dt><dd>1</dd><dd>2</dd><dt>c</dt><dd>3</dd></dl></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: fail for non-whitespace text directly inside the dl or a wrapping div`, () => {
  for (const markup of [
    '<dl id="a">hello</dl>',
    '<dl id="a"><dt>a</dt>stray<dd>b</dd></dl>',
    '<dl id="a"><div>stray<dt>a</dt><dd>b</dd></div></dl>'
  ]) {
    for (const engineOptions of [{}]) {
      const html = `<!doctype html><html><body>${markup}</body></html>`;
      const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
      const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
      assert.equal(rule.occurrences[0].data.details.reasonCode, 'DL_INVALID_CHILD', markup);
      assert.deepStrictEqual(rule.occurrences[0].data.details.invalidChildren, ['#text']);
    }
  }
});

test(`${RULE_ID}: whitespace between groups is not a text child`, () => {
  const html = `<!doctype html><html><body><dl>\n  <dt>a</dt>\n  <dd>b</dd>\n</dl></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
    maxOccurrences: 0
  });
});
