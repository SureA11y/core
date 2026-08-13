'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml');
const { assertRule } = require('../../helpers/assertRule');

const RULE_ID = 'label-in-name';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

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
  const buckets = ['violations', 'passes', 'incomplete', 'inapplicable'];

  for (const bucket of buckets) {
    if (Array.isArray(result[bucket])) {
      const found = result[bucket].find((r) => r.ruleId === ruleId || r.id === ruleId);
      if (found) return found;
    }
  }

  return null;
}

test('label-in-name: no applicable elements => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <button>Save</button>
  <a href="/x">Link</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('label-in-name: visible label contained in accessible name => pass', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Save changes">Save</button>
  <a href="/x" aria-labelledby="l1"><span id="l1">Download</span></a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('label-in-name: visible label not contained in accessible name => fail', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Submit form">Save</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const ruleRes = findRuleResultDeep(result, 'label-in-name');
  assert.ok(ruleRes, 'Expected rule result for label-in-name');

  const occArr = getOccurrences(ruleRes);
  assert.ok(occArr.length > 0, 'Expected at least one occurrence');

  const occ = occArr[0];
  assert.ok(occ.data && occ.data.details);
  assert.strictEqual(occ.data.details.reasonCode, 'VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME');
  assert.strictEqual(occ.data.details.labelSource, 'self');
});

test('label-in-name: control not visually rendered => notApplicable (element skipped)', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Submit form" style="display:none">Save</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('label-in-name: aria-hidden decorative icon glyph does not count as visible label text => notApplicable', () => {
  // Regression for a Material Icons ligature-font false positive: an
  // aria-hidden icon
  // (<mat-icon aria-hidden="true">format_color_fill</mat-icon>) was being
  // treated as "visible label text" that must be included
  // in the aria-label, purely because the previous implementation collected
  // text via raw container.textContent (which ignores aria-hidden and CSS
  // visibility entirely) instead of the intended TreeWalker-based, filtered
  // collection — itself caused by a free-var bug (a bare `NodeFilter`
  // reference that silently threw and fell back to textContent on every
  // call). Both are fixed together; this only has content inside the
  // aria-hidden icon, so nothing counts as a visible label at all.
  const html = `
<!doctype html><html><body>
  <button aria-label="Select a theme"><span aria-hidden="true">format_color_fill</span></button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('label-in-name: real visible text alongside an aria-hidden icon is still compared correctly => pass', () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Save changes"><span aria-hidden="true">icon</span> Save</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'label-in-name', 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: parenthesised text in the visible label is dropped before comparing`, () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="Search by date">Search by date (YYYY-MM-DD)</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: punctuation and emoji on either side do not affect the comparison`, () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="&#128161; Submit &#128161;">&gt;&gt;&gt; ** Submit ** &lt;&lt;&lt;</button>
  <button aria-label="Next">Next&hellip;</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a label word that merely prefixes a name word does not satisfy the rule`, () => {
  const html = `
<!doctype html><html><body>
  <a id="italy" href="#" aria-label="Discover Italy">Discover It</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'italy'));
});

test(`${RULE_ID}: a single-character label is compared as a whole word`, () => {
  const html = `
<!doctype html><html><body>
  <a id="one" href="#" aria-label="1a">1</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: the label's words must be adjacent in the name, not merely present`, () => {
  const html = `
<!doctype html><html><body>
  <button aria-label="save all files">save files</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: a possible abbreviation is cantTell rather than a failure`, () => {
  const html = `
<!doctype html><html><body>
  <a href="#" aria-label="University Avenue">University Ave.</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].outcome, 'cantTell');
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'POSSIBLE_ABBREVIATION');
});

test(`${RULE_ID}: a hyphenation difference is cantTell rather than a failure`, () => {
  const html = `
<!doctype html><html><body>
  <a href="#" aria-label="non-standard">nonstandard</a>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'HYPHENATION_DIFFERS');
});

test(`${RULE_ID}: a real mismatch alongside an uncertain one still fails the rule`, () => {
  const html = `
<!doctype html><html><body>
  <a href="#" aria-label="University Avenue">University Ave.</a>
  <button aria-label="Submit form">Save</button>
</body></html>
  `;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const codes = rule.occurrences.map((o) => o.data.details.reasonCode).sort();
  assert.deepStrictEqual(codes, ['POSSIBLE_ABBREVIATION', 'VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME']);
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/label-in-name-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'label-in-name-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedFailIds = [
    'lin_case_02',
    'lin_case_04',
    'lin_case_06',
    'lin_case_14',
    'lin_case_15'
  ];

  const expectedNoOccIds = [
    'lin_case_01',
    'lin_case_03',
    'lin_case_05',
    'lin_case_07',
    'lin_case_08',
    'lin_case_09',
    'lin_case_10',
    'lin_case_11',
    'lin_case_12',
    'lin_case_13',
    'lin_case_16',
    'lin_case_17'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
