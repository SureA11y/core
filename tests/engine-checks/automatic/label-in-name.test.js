'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml');
const { assertRule } = require('../../helpers/assertRule');

function findRuleResultDeep(root, ruleId) {
  const seen = new Set();

  function visit(node) {
    if (!node || (typeof node !== 'object' && typeof node !== 'function')) return null;
    if (seen.has(node)) return null;
    seen.add(node);

    // Match common shapes
    if (node.ruleId === ruleId || node.id === ruleId) return node;

    // Arrays: visit each item
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = visit(item);
        if (found) return found;
      }
      return null;
    }

    // Objects: visit properties
    for (const key of Object.keys(node)) {
      const found = visit(node[key]);
      if (found) return found;
    }
    return null;
  }

  return visit(root);
}

function getOccurrences(ruleRes) {
  if (!ruleRes) return [];
  if (Array.isArray(ruleRes.occurrences)) return ruleRes.occurrences;
  if (Array.isArray(ruleRes.nodes)) return ruleRes.nodes;

  // Sometimes occurrences are nested
  if (ruleRes.data && Array.isArray(ruleRes.data.occurrences)) return ruleRes.data.occurrences;
  return [];
}

function getRuleResult(result, ruleId) {
  const buckets = [
    'violations',
    'passes',
    'incomplete',
    'inapplicable'
  ];

  for (const bucket of buckets) {
    if (Array.isArray(result[bucket])) {
      const found = result[bucket].find(r => r.ruleId === ruleId || r.id === ruleId);
      if (found) return found;
    }
  }

  return null;
}

test('a11ycore-label-in-name: no applicable elements => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <button>Save</button>
  <a href="/x">Link</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11ycore-label-in-name', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('a11ycore-label-in-name: visible label contained in accessible name => pass', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Save changes">Save</button>
  <a href="/x" aria-labelledby="l1"><span id="l1">Download</span></a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11ycore-label-in-name', 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('a11ycore-label-in-name: visible label not contained in accessible name => fail', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Submit form">Save</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11ycore-label-in-name', 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const ruleRes = findRuleResultDeep(result, 'a11ycore-label-in-name');
  assert.ok(ruleRes, 'Expected rule result for a11ycore-label-in-name');

  const occArr = getOccurrences(ruleRes);
  assert.ok(occArr.length > 0, 'Expected at least one occurrence');

  const occ = occArr[0];
  assert.ok(occ.data && occ.data.details);
  assert.strictEqual(occ.data.details.reasonCode, 'VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME');
  assert.strictEqual(occ.data.details.labelSource, 'self');
});

test('a11ycore-label-in-name: control not visually rendered => notApplicable (element skipped)', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Submit form" style="display:none">Save</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'a11ycore-label-in-name', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
