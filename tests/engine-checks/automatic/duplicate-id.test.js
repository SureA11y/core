'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const {
  runa11yCoreOnHtml,
  createDom,
  runa11yCoreOnDom
} = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'duplicate-id';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

function page(body) {
  return `<!doctype html><html><body>${body}</body></html>`;
}

test(`${RULE_ID}: notApplicable when no element carries an id`, () => {
  const result = runa11yCoreOnHtml(page('<div>no ids here</div>'), { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when every id is used once`, () => {
  const result = runa11yCoreOnHtml(page('<div id="a">1</div><div id="b">2</div>'), {
    runOnly: [RULE_ID]
  });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: reports every element sharing the id`, () => {
  const result = runa11yCoreOnHtml(page('<div id="a">1</div><div id="a">2</div>'), {
    runOnly: [RULE_ID]
  });
  // cantTell, not fail: the default target is WCAG 2.2, which no longer
  // contains SC 4.1.1. See the version-scoping block at the bottom.
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'DUPLICATE_ID');
  assert.strictEqual(rule.occurrences[0].data.details.id, 'a');
  assert.strictEqual(rule.occurrences[0].data.details.count, 2);
});

test(`${RULE_ID}: the reported count grows with the number of copies`, () => {
  const result = runa11yCoreOnHtml(
    page('<div id="a">1</div><div id="a">2</div><div id="a">3</div>'),
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  assert.strictEqual(rule.occurrences[0].data.details.count, 3);
});

test(`${RULE_ID}: an empty id value is out of scope`, () => {
  const result = runa11yCoreOnHtml(page('<div id="">a</div><div id="">b</div>'), {
    runOnly: [RULE_ID]
  });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a non-rendered element still counts as a duplicate`, () => {
  // ACT 3ea0c8 evaluates elements that are neither visible nor in the
  // accessibility tree: a duplicate id breaks lookups either way.
  const result = runa11yCoreOnHtml(
    page('<span id="a" style="display:none">Hidden</span><span id="a">Visible</span>'),
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.count, 2);
});

// ---------------------------------------------------------------------------
// Ids resolve within their own tree, so shadow roots are compared separately.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: the same id in two separate shadow roots is not a duplicate`, () => {
  const dom = createDom(page('<div id="host1"></div><div id="host2"></div>'));
  const doc = dom.window.document;
  doc.getElementById('host1').attachShadow({ mode: 'open' }).innerHTML = '<p id="title">A</p>';
  doc.getElementById('host2').attachShadow({ mode: 'open' }).innerHTML = '<p id="title">B</p>';

  const result = runa11yCoreOnDom(dom, {
    runOnly: [RULE_ID],
    engineOptions: { includeShadowDom: true }
  });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an id repeated inside one shadow root is a duplicate`, () => {
  const dom = createDom(page('<div id="host1"></div>'));
  dom.window.document.getElementById('host1').attachShadow({ mode: 'open' }).innerHTML =
    '<p id="title">A</p><p id="title">B</p>';

  const result = runa11yCoreOnDom(dom, {
    runOnly: [RULE_ID],
    engineOptions: { includeShadowDom: true }
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.strictEqual(rule.occurrences[0].data.details.id, 'title');
});

test(`${RULE_ID}: a shadow-tree id does not collide with the same id in light DOM`, () => {
  const dom = createDom(page('<div id="host1"></div><p id="title">light</p>'));
  dom.window.document.getElementById('host1').attachShadow({ mode: 'open' }).innerHTML =
    '<p id="title">shadow</p>';

  const result = runa11yCoreOnDom(dom, {
    runOnly: [RULE_ID],
    engineOptions: { includeShadowDom: true }
  });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// ---------------------------------------------------------------------------
// WCAG version scoping: SC 4.1.1 was removed in WCAG 2.2.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: carries the wcag22-removed tag alongside its 2.0-origin tag`, () => {
  const { CHECK_DEFS } = require('../../../src/core.js');
  const def = CHECK_DEFS.find((d) => d.ruleId === RULE_ID);
  assert.ok(def, 'rule missing from the catalog');
  assert.deepStrictEqual(def.wcagSc, ['4.1.1']);
  assert.ok(def.tags.includes('wcag2a'));
  assert.ok(def.tags.includes('wcag22-removed'));
});

test(`${RULE_ID}: excludeTags: ['wcag22-removed'] takes it out of a WCAG 2.2 run`, () => {
  const html = page('<div id="a">1</div><div id="a">2</div>');

  const included = runa11yCoreOnHtml(html, {
    runOnly: { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'] }
  });
  assert.ok(included.checksResults.some((r) => r.ruleId === RULE_ID));

  const excluded = runa11yCoreOnHtml(html, {
    runOnly: {
      tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'],
      excludeTags: ['wcag22-removed']
    }
  });
  assert.ok(!excluded.checksResults.some((r) => r.ruleId === RULE_ID));
});

test(`${RULE_ID}: a default run targets WCAG 2.2, so a duplicate id is cantTell, not fail`, () => {
  const result = runa11yCoreOnHtml(page('<div id="a">1</div><div id="a">2</div>'), {
    runOnly: [RULE_ID]
  });
  assert.strictEqual(result.engine.wcagVersion, '2.2');

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2 });
  assert.deepStrictEqual(rule.wcagVersionScope, {
    target: '2.2',
    removedSc: ['4.1.1'],
    coercedFrom: 'fail'
  });
  // Nothing went wrong -- the coercion must not masquerade as a thrown rule.
  assert.ok(!rule.error);
});

test(`${RULE_ID}: engineOptions.wcagVersion 2.1 keeps the real 4.1.1 failure`, () => {
  const result = runa11yCoreOnHtml(page('<div id="a">1</div><div id="a">2</div>'), {
    runOnly: [RULE_ID],
    engineOptions: { wcagVersion: '2.1' }
  });
  assert.strictEqual(result.engine.wcagVersion, '2.1');

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2 });
  assert.strictEqual(rule.wcagVersionScope, undefined);
});

test(`${RULE_ID}: a 2.0/2.1 tag set implies the version, no extra option needed`, () => {
  const html = page('<div id="a">1</div><div id="a">2</div>');

  const v20 = runa11yCoreOnHtml(html, { runOnly: { tags: ['wcag2a', 'wcag2aa'] } });
  assert.strictEqual(v20.engine.wcagVersion, '2.0');
  assertRule(v20, RULE_ID, 'fail', { minOccurrences: 2 });

  const v21 = runa11yCoreOnHtml(html, {
    runOnly: { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
  });
  assert.strictEqual(v21.engine.wcagVersion, '2.1');
  assertRule(v21, RULE_ID, 'fail', { minOccurrences: 2 });

  const v22 = runa11yCoreOnHtml(html, {
    runOnly: { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'] }
  });
  assert.strictEqual(v22.engine.wcagVersion, '2.2');
  assertRule(v22, RULE_ID, 'cantTell', { minOccurrences: 2 });
});

test(`${RULE_ID}: an explicit wcagVersion beats whatever the tag set implies`, () => {
  const result = runa11yCoreOnHtml(page('<div id="a">1</div><div id="a">2</div>'), {
    runOnly: { tags: ['wcag2a', 'wcag2aa'] },
    engineOptions: { wcagVersion: '2.2' }
  });
  assert.strictEqual(result.engine.wcagVersion, '2.2');
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2 });
});

test(`${RULE_ID}: the 4.1.1 composite follows the atomic rule down to cantTell`, () => {
  const html = page('<div id="a">1</div><div id="a">2</div>');

  const under22 = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const composite22 = under22.rulesResults.find((r) => r.ruleId === 'wcag-4.1.1-parsing');
  assert.ok(composite22, 'expected the 4.1.1 composite to be present');
  assert.strictEqual(composite22.outcome, 'cantTell');

  const under21 = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { wcagVersion: '2.1' }
  });
  const composite21 = under21.rulesResults.find((r) => r.ruleId === 'wcag-4.1.1-parsing');
  assert.ok(composite21, 'expected the 4.1.1 composite to be present');
  assert.strictEqual(composite21.outcome, 'fail');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const result = runa11yCoreOnHtml(page('<div id="a">1</div><div id="a">2</div>'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'IDs must be unique');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/duplicate-id-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'duplicate-id-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  // case_02 twice, case_03 three times, case_04 once (its hidden copy is
  // counted but sits outside the reported scope).
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 6, maxOccurrences: 6 });

  for (const id of ['dupid_case_02', 'dupid_case_03', 'dupid_case_04']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  assert.ok(!hasOccurrenceForId(rule, 'dupid_case_01'));

  const counts = {};
  for (const o of rule.occurrences) counts[o.data.details.id] = o.data.details.count;
  assert.deepStrictEqual(counts, {
    dupid_case_02: 2,
    dupid_case_03: 3,
    dupid_case_04: 2
  });
});
