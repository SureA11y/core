'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-required-children';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
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

test(`${RULE_ID}: fail when no owned child of an acceptable role exists`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listbox"><div>just text</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.role, 'listbox');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_REQUIRED_CHILD_MISSING');
  assert.deepStrictEqual(rule.occurrences[0].data.details.requiredOwnedRoles, ['option', 'group']);
});

test(`${RULE_ID}: pass when the required owned role only exists across a shadow-DOM slot boundary (composed-tree descendant, not light-DOM querySelectorAll)`, () => {
  // Regression found while root-causing the aria-required-parent Spectrum
  // Web Components false positive (2026-07-22) — the identical bug in the
  // opposite (descendant) direction. A shadow root's role="list" div wraps
  // an empty <slot>; the real role="listitem" element is a light-DOM child
  // distributed into that slot. Plain querySelectorAll(CANDIDATE_SELECTOR)
  // only sees the slot's own (empty) fallback content, never what's
  // actually projected into it.
  const dom = createDom(`<!doctype html><html><body>
    <div id="host"><div id="a" role="listitem" slot="x">Item</div></div>
  </body></html>`);
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = `<div role="list"><slot name="x"></slot></div>`;

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], engineOptions: { includeShadowDom: true } });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a shadow-DOM container has a <slot> but nothing assigned to it satisfies the required owned role`, () => {
  // Same slotted shape as above, but the projected content has no
  // acceptable owned role — confirms the composed-tree fallback doesn't
  // just make every slot-containing container pass unconditionally.
  const dom = createDom(`<!doctype html><html><body>
    <div id="host"><span id="a" slot="x">Not a listitem</span></div>
  </body></html>`);
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = `<div id="list" role="list"><slot name="x"></slot></div>`;

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], engineOptions: { includeShadowDom: true } });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
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
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listbox"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Container roles must own at least one required child role');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-required-children-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'aria-required-children-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  assert.ok(hasOccurrenceForId(rule, 'arc_case_04'));
  for (const id of ['arc_case_01', 'arc_case_02', 'arc_case_03', 'arc_case_05', 'arc_case_06', 'arc_case_07', 'arc_case_08']) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});