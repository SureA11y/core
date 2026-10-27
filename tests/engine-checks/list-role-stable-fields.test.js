'use strict';

// The fields that say which kind of list or widget a finding is about are a
// stable contract (docs/API_STABILITY.md): a standard that tests unordered
// lists, ordered lists and each kind of widget apart files findings by them,
// so their names and values are pinned here, for every reason code.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const details = (ruleId, body) => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`,
    { runOnly: [ruleId] }
  );
  const rule = result.checksResults.find((r) => r.ruleId === ruleId);
  assert.equal(rule.outcome, 'fail', body);
  return rule.occurrences.map((o) => o.data.details);
};

test('list-children-valid: every finding names its list in element', () => {
  const cases = [
    ['<ul><li>a</li><p>b</p></ul>', 'LIST_INVALID_CHILD', 'ul'],
    ['<ol><li>a</li><p>b</p></ol>', 'LIST_INVALID_CHILD', 'ol'],
    ['<ul><li role="presentation">a</li></ul>', 'LIST_ITEM_ROLE_OVERRIDDEN', 'ul'],
    ['<ol><li role="none">a</li></ol>', 'LIST_ITEM_ROLE_OVERRIDDEN', 'ol']
  ];
  for (const [body, code, element] of cases) {
    const [d] = details('list-children-valid', body);
    assert.deepEqual([d.reasonCode, d.element], [code, element], body);
  }
});

test("listitem-parent-valid: every finding names the <li>'s parent in parentElement", () => {
  const cases = [
    ['<div><li>a</li></div>', 'LISTITEM_INVALID_PARENT', 'div'],
    ['<ul role="tablist"><li>a</li></ul>', 'LIST_ROLE_OVERRIDDEN', 'ul'],
    ['<ol role="group"><li>a</li></ol>', 'LIST_ROLE_OVERRIDDEN', 'ol']
  ];
  for (const [body, code, parent] of cases) {
    const [d] = details('listitem-parent-valid', body);
    assert.deepEqual([d.reasonCode, d.parentElement], [code, parent], body);
  }
});

test('aria-role-name-present: every finding names the role that needs a name', () => {
  const cases = [
    ['grid', '<div role="grid"><div role="row"><div role="gridcell">a</div></div></div>'],
    ['meter', '<div role="meter" aria-valuenow="5" aria-valuemin="0" aria-valuemax="10"></div>'],
    ['progressbar', '<div role="progressbar" aria-valuenow="5"></div>'],
    ['radiogroup', '<div role="radiogroup"><input type="radio" aria-label="a"></div>'],
    ['tree', '<ul role="tree"><li role="treeitem">a</li></ul>']
  ];
  for (const [role, body] of cases) {
    const [d] = details('aria-role-name-present', body);
    assert.equal(d.role, role, body);
  }
});
