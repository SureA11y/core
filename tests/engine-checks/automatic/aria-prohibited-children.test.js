'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-prohibited-children';

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

test(`${RULE_ID}: pass when every owned child has an allowed role`, () => {
  const html = `<!doctype html><html><body><ul id="a" role="menubar"><li role="menuitem">File</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when menuitems are wrapped in role="group" (group is itself an allowed owned role, so it's transparent)`, () => {
  const html = `<!doctype html><html><body>
    <ul id="a" role="menubar"><li role="group"><span role="menuitem">File</span></li></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a role="none" wrapper hides an allowed menuitem (presentational wrappers are transparent)`, () => {
  const html = `<!doctype html><html><body>
    <ul id="a" role="menubar"><li role="none"><button role="menuitem">File</button></li></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the only disallowed-role descendant is aria-hidden (pruned from the accessible tree)`, () => {
  const html = `<!doctype html><html><body>
    <ul id="a" role="menubar">
      <li role="menuitem">File</li>
      <li aria-hidden="true"><nav role="region">Hidden</nav></li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a role="none" wrapper hides a disallowed role="region" descendant (found on a real site — Red Cross's utility-nav dropdown menu)`, () => {
  const html = `<!doctype html><html><body>
    <ul role="menubar">
      <li role="menuitem">File</li>
      <li role="none"><nav id="a" role="region">Dropdown panel</nav></li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_PROHIBITED_CHILD');
  assert.equal(rule.occurrences[0].data.details.childRole, 'region');
  assert.equal(rule.occurrences[0].data.details.containerRole, 'menubar');
});

test(`${RULE_ID}: fail when a container role is directly owned by another container role not in its allowed set`, () => {
  const html = `<!doctype html><html><body>
    <ul role="menubar">
      <li role="menuitem">File</li>
      <li><div id="a" role="listbox"><div role="option">x</div></div></li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: fail when table directly owns a disallowed role="button"`, () => {
  const html = `<!doctype html><html><body>
    <div role="table">
      <div role="row"><div role="cell">x</div></div>
      <div id="a" role="button">Not valid</div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: fail when a roleless-but-focusable (tabindex) child is owned by a container (widened 2026-07-21 — matches a reference engine's own getOwnedRoles exactly)`, () => {
  const html = `<!doctype html><html><body>
    <ul role="menubar">
      <li role="menuitem">File</li>
      <li id="a" tabindex="0">Roleless but focusable</li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_PROHIBITED_CHILD_ROLELESS');
  assert.equal(rule.occurrences[0].data.details.attr, 'tabindex');
});

test(`${RULE_ID}: fail when a roleless-but-globally-aria-attributed (aria-label) child is owned by a container`, () => {
  const html = `<!doctype html><html><body>
    <ul role="menubar">
      <li role="menuitem">File</li>
      <li id="a" aria-label="Named">Something</li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-label');
});

test(`${RULE_ID}: pass when a roleless, non-focusable, non-aria-attributed child is a transparent wrapper (unchanged existing behavior)`, () => {
  const html = `<!doctype html><html><body>
    <ul role="menubar">
      <li role="menuitem">File</li>
      <li><span id="a" role="menuitem">Edit</span></li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable (not pass) when the container has the hidden attribute — a would-be-disallowed child is not currently exposed to the accessibility tree`, () => {
  const html = `<!doctype html><html><body>
    <ul id="a" role="menubar" hidden>
      <li role="menuitem">File</li>
      <li role="region">Disallowed, but hidden</li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><ul role="menubar"><li id="a" role="region"></li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Container roles must not own a child with a disallowed role');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-prohibited-children-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'aria-prohibited-children-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });

  for (const id of ['apc_case_06_child', 'apc_case_07_child', 'apc_case_08_child', 'apc_case_10_child', 'apc_case_11_child']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of ['apc_case_01', 'apc_case_02', 'apc_case_03', 'apc_case_04', 'apc_case_05', 'apc_case_09', 'apc_case_13']) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
