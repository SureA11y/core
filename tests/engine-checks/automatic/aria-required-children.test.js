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

const RULE_ID = 'aria-required-children';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no role attributes present`, () => {
  const html = `<!doctype html><html><body><ul id="a"><li>x</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role has no required-owned entry`, () => {
  const html = `<!doctype html><html><body><div id="a" role="button"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a descendant has a matching explicit owned role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listbox"><div role="option">x</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a plain native descendant satisfies the owned role (role="list" on <ul> with plain <li>)`, () => {
  const html = `<!doctype html><html><body><ul id="a" role="list"><li>plain item</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the owned role is only reachable via aria-owns`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="listbox" aria-owns="opt1"></div>
    <div id="opt1" role="option">x</div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when it holds text but no owned child of an acceptable role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listbox"><div>just text</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.role, 'listbox');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_REQUIRED_CHILD_TEXT_ONLY');
  assert.deepStrictEqual(rule.occurrences[0].data.details.requiredOwnedRoles, ['option', 'group']);
});

test(`${RULE_ID}: cantTell when an empty container owns no child of an acceptable role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_REQUIRED_CHILD_MISSING');
});

test(`${RULE_ID}: text inside an element with a role of its own is not the container's text`, () => {
  const html = `<!doctype html><html><body><div id="a" role="list"><div role="button">Add</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass when the required owned role only exists across a shadow-DOM slot boundary (composed-tree descendant, not light-DOM querySelectorAll)`, () => {
  // Regression: the same bug as aria-required-parent's shadow-DOM case, in
  // the opposite (descendant) direction. A shadow root's role="list" div
  // wraps an empty <slot>; the real role="listitem" element is a light-DOM
  // child distributed into that slot. Plain querySelectorAll(CANDIDATE_SELECTOR)
  // only sees the slot's own (empty) fallback content, never what's
  // actually projected into it.
  const dom = createDom(`<!doctype html><html><body>
    <div id="host"><div id="a" role="listitem" slot="x">Item</div></div>
  </body></html>`);
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = `<div role="list"><slot name="x"></slot></div>`;

  const result = runa11yCoreOnDom(dom, {
    runOnly: [RULE_ID],
    engineOptions: { includeShadowDom: true }
  });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a shadow-DOM container has a <slot> but nothing assigned to it satisfies the required owned role`, () => {
  // Same slotted shape as above, but the projected content has no
  // acceptable owned role, confirming the composed-tree fallback doesn't
  // just make every slot-containing container pass unconditionally.
  const dom = createDom(`<!doctype html><html><body>
    <div id="host"><span id="a" slot="x">Not a listitem</span></div>
  </body></html>`);
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML =
    `<div id="list" role="list"><slot name="x"></slot></div>`;

  const result = runa11yCoreOnDom(dom, {
    runOnly: [RULE_ID],
    engineOptions: { includeShadowDom: true }
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'list'));
});

test(`${RULE_ID}: notApplicable when the container has the hidden attribute (not currently exposed to the accessibility tree)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="menu" hidden></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the container is inside a closed <dialog> (display:none via the UA stylesheet)`, () => {
  const html = `<!doctype html><html><body><dialog><ul id="a" role="list"></ul></dialog></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the container has aria-busy="true" (WAI-ARIA's own required-owned-elements escape hatch)`, () => {
  const html = `<!doctype html><html><body><ul id="a" role="list" aria-busy="true"></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-busy="false" does NOT exempt an empty container (only the exact string "true" counts)`, () => {
  const html = `<!doctype html><html><body><ul id="a" role="list" aria-busy="false"></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Container roles must own at least one required child role');
});

test(`${RULE_ID}: an empty container is reported for review, never failed, it conveys nothing false`, () => {
  const html = `<!doctype html><html><body><div id="a" role="list"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].occurrenceOutcome, 'cantTell');
});

test(`${RULE_ID}: a container of items that never got their role fails (ACT bc4a75, Failed Example 1)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="list"><div>One</div><div>Two</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].occurrenceOutcome, 'fail');
});

// A container owning something disallowed is asked about here and failed
// by the rule whose decision that is. Change one of these two and this test should be the
// thing that objects.
test(`${RULE_ID}: a container owning a disallowed role still fails, via aria-prohibited-children`, () => {
  const html = `<!doctype html><html><body><div id="a" role="list"><div role="button">Add</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID, 'aria-prohibited-children']
  });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assertRule(result, 'aria-prohibited-children', 'fail', { minOccurrences: 1 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-required-children-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-required-children-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });

  for (const [id, outcome] of [
    ['arc_case_04', 'fail'],
    ['arc_case_09', 'fail'],
    ['arc_case_10', 'cantTell']
  ]) {
    const occ = rule.occurrences.find((o) => o.html && o.html.includes(`id="${id}"`));
    assert.ok(occ, `Expected occurrence for id="${id}"`);
    assert.equal(occ.occurrenceOutcome, outcome, `Expected ${outcome} for id="${id}"`);
  }
  for (const id of [
    'arc_case_01',
    'arc_case_02',
    'arc_case_03',
    'arc_case_05',
    'arc_case_06',
    'arc_case_07',
    'arc_case_08'
  ]) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

// Leans: which way each undecided finding points.
function leanOn(html, id, ruleId = RULE_ID) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${html}</body></html>`,
    { runOnly: [ruleId] }
  );
  const rule = assertRule(result, ruleId, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences.find(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
  assert.ok(occ, `expected an occurrence on #${id}`);
  assert.strictEqual(occ.occurrenceOutcome || 'cantTell', 'cantTell');
  return occ.lean;
}

test(`${RULE_ID}: leans pass for a container that holds no element`, () => {
  const lean = leanOn('<div id="a" role="list"></div>', 'a');
  assert.strictEqual(lean.toward, 'pass');
  assert.strictEqual(lean.i18n.whyKey, 'ariaRequiredChildren_lean_why_empty');
});

test(`${RULE_ID}: leans fail for a container holding named content without the required role`, () => {
  const lean = leanOn(
    '<div id="a" role="list"><span><img src="star.png" alt="Starred"></span></div>',
    'a'
  );
  assert.strictEqual(lean.toward, 'fail');
  assert.strictEqual(lean.i18n.whyKey, 'ariaRequiredChildren_lean_why_namedContent');
});

test(`${RULE_ID}: no lean for a container holding only unnamed elements`, () => {
  assert.strictEqual(leanOn('<div id="a" role="list"><span></span></div>', 'a'), undefined);
});
