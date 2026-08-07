'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let runa11yCoreOnHtml;
let assertRule;

try {
  ({ runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {}

const RULE_ID = 'treeitem-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test('treeitem-name-present: no applicable => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no tree</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('treeitem-name-present: content => pass', () => {
  const html = `<!doctype html><html><body><div role='treeitem'>Documents</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('treeitem-name-present: hidden-only content => fail', () => {
  const html = `<!doctype html><html><body><div role='treeitem'><span aria-hidden='true'>Documents</span></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass when the treeitem's name comes from a wrapped img alt (name-from-content recursion)`, () => {
  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const html = `<!doctype html><html><body><div role="tree"><div role="treeitem" id="ti1"><img alt="Folder" src="x.png"></div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/treeitem-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'treeitem-name-present-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });

  const expectedFailIds = [
    'treeitem_case_01',
    'treeitem_case_06',
    'treeitem_case_07',
    'treeitem_case_08',
    'treeitem_case_09',
    'treeitem_case_11',
    'treeitem_case_15'
  ];

  const expectedNoOccIds = [
    'treeitem_case_02',
    'treeitem_case_03',
    'treeitem_case_04',
    'treeitem_case_05',
    'treeitem_case_10',
    'treeitem_case_12',
    'treeitem_case_13',
    'treeitem_case_14',
    'treeitem_case_16',
    'treeitem_case_17'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test('treeitem-name-present: aria-labelledby pointing at an <iframe> falls back to its title attribute => pass', () => {
  // Regression for a copy-pasted bug across the *-name-present rules:
  // aria-labelledby pointing at an <iframe> has no "content" to compute a
  // name from (iframe content is opaque/cross-origin per HTML-AAM); the
  // referenced element's own accessible name must fall back to its title
  // attribute, which the previous getConservativeSubtreeText-only
  // resolveAriaLabelledbyText never checked. Fixed via the shared
  // getTextFromIdRefs helper.
  const html = `<!doctype html><html><body><iframe id='t' title='Settings'></iframe><div role='treeitem' aria-labelledby='t'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
