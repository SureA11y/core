'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'list-children-valid';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no ul/ol is present`, () => {
  const html = `<!doctype html><html><body><div>no lists</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the list has no element children`, () => {
  const html = `<!doctype html><html><body><ul></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when ul only contains li`, () => {
  const html = `<!doctype html><html><body><ul><li>a</li><li>b</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when ol contains li plus script/template`, () => {
  const html = `<!doctype html><html><body><ol><li>a</li><script></script><template></template></ol></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when ul has a non-li direct child`, () => {
  const html = `<!doctype html><html><body><ul id="a"><li>a</li><div>wrapper</div></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.deepStrictEqual(rule.occurrences[0].data.details.invalidChildren, ['div']);
});

test(`${RULE_ID}: pass when the only invalid-looking direct child is display:none (not exposed to AT)`, () => {
  const html = `<!doctype html><html><body>
    <ul id="a"><li>Grape</li><span style="display:none">hydration marker</span></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the only invalid-looking direct child is <input type="hidden"> (UA-stylesheet display:none)`, () => {
  const html = `<!doctype html><html><body>
    <ul id="a"><li>Honeydew</li><input type="hidden" value="x"></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a direct <li> child has an explicit role="none" (an explicit role always wins over the tag)`, () => {
  const html = `<!doctype html><html><body>
    <ul id="a"><li role="none">Section label</li><li>Item</li></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.deepStrictEqual(rule.occurrences[0].data.details.invalidChildren, ['li']);
});

test(`${RULE_ID}: fail when a direct <li> child has an explicit role="menuitem"`, () => {
  const html = `<!doctype html><html><body>
    <ul id="a"><li role="menuitem">Item</li></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when a non-<li> direct child has an explicit role="listitem" (the explicit role wins the other direction too)`, () => {
  const html = `<!doctype html><html><body>
    <ul id="a"><div role="listitem">Item</div></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail still reported when an invalid child IS visible, even alongside a hidden invalid child`, () => {
  const html = `<!doctype html><html><body>
    <ul id="a"><li>a</li><div>visible wrapper</div><span style="display:none">hidden</span></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.deepStrictEqual(rule.occurrences[0].data.details.invalidChildren, ['div']);
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><ul id="a"><div>wrapper</div></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Lists must only directly contain list items');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/list-children-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'list-children-valid-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedFailIds = [
    'lcv_case_04',
    'lcv_case_05',
    'lcv_case_06',
    'lcv_case_12',
    'lcv_case_13'
  ];
  const expectedNoOccIds = [
    'lcv_case_01',
    'lcv_case_02',
    'lcv_case_03',
    'lcv_case_07',
    'lcv_case_08',
    'lcv_case_09',
    'lcv_case_10',
    'lcv_case_11',
    'lcv_case_14'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
