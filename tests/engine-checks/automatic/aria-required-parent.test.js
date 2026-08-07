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

const RULE_ID = 'aria-required-parent';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no role attributes present`, () => {
  const html = `<!doctype html><html><body><div id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role has no required-context entry`, () => {
  const html = `<!doctype html><html><body><div id="a" role="button"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role has an explicitly unconstrained context entry (tabpanel)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="tabpanel"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a matching explicit ancestor role is present`, () => {
  const html = `<!doctype html><html><body><div role="tablist"><div id="a" role="tab">t1</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a plain native ancestor satisfies the context role (<option> inside <select>)`, () => {
  const html = `<!doctype html><html><body><select><option id="a" role="option">x</option></select></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the context role is only reachable via aria-owns`, () => {
  const html = `<!doctype html><html><body>
    <div role="tablist" aria-owns="a"></div>
    <div id="a" role="tab">t1</div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the required-context role exists further up the tree but an intervening ancestor role blocks it (<ul role="tablist"><li><button role="tab">)`, () => {
  const html = `<!doctype html><html><body>
    <ul role="tablist"><li><button id="a" role="tab">t1</button></li></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when role="group" is the immediate parent context for menuitem (menu > presentation > group > menuitem)`, () => {
  // A menuitem whose DIRECT parent is a role="group" <ul> (wrapped in a
  // role="presentation" <li> for the section heading), itself owned by the
  // outer role="menu", satisfies menuitem's requiredContext
  // (['menu','menubar','group']).
  const html = `<!doctype html><html><body>
    <ul role="menu"><li role="presentation"><ul role="group"><li id="a" role="menuitem" tabindex="-1">Item</li></ul></li></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="group" is the immediate parent context for option (listbox > group > option)`, () => {
  const html = `<!doctype html><html><body>
    <ul role="listbox"><li role="presentation"><ul role="group"><li id="a" role="option">Opt</li></ul></li></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the only intervening ancestor is transparent (role="presentation")`, () => {
  const html = `<!doctype html><html><body>
    <div role="tablist"><div role="presentation"><div id="a" role="tab">t1</div></div></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for a multi-level nested treeitem (treeitem > group > treeitem > group > tree) — a normal, arbitrarily-deep ARIA tree`, () => {
  // A sub-tree's <li role="treeitem"> items nested directly inside their
  // parent directory treeitem's own <ul role="group"> children container (a
  // standard ARIA TreeView pattern: tree > treeitem > group > treeitem >
  // group > treeitem...). hasAcceptableAncestorContext previously treated
  // the immediate role="group" ancestor as transparent (per
  // GROUP_TRANSPARENT_FOR_ROLES) and kept walking, but stopped at the next
  // real ancestor role — a second treeitem — and failed since "treeitem"
  // wasn't itself in the original acceptable-roles set. The fix pushes the
  // tested element's own role into the acceptable set at the same point it
  // drops "group", so a further treeitem ancestor also satisfies the
  // requirement.
  const html = `<!doctype html><html><body>
    <ul role="tree">
      <li role="treeitem" aria-expanded="true">Outer dir
        <ul role="group">
          <li id="a" role="treeitem">Inner file</li>
        </ul>
      </li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when an intervening ancestor has an invalid/unrecognized role token (not a real ARIA role) — transparent to the search, same as no role at all`, () => {
  // A role="columnheader" cell whose immediate role-bearing ancestor is
  // role="columngroup" (not a real ARIA role), itself inside a real
  // role="row" ancestor. Explicit-role resolution validates role="" tokens
  // against the known role list and falls back past invalid ones, finding
  // "row"; this rule previously stopped the search at the bogus
  // "columngroup" token instead.
  const html = `<!doctype html><html><body>
    <div role="grid"><div role="row"><div role="columngroup"><div id="a" role="columnheader">Progress</div></div></div></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when no acceptable ancestor/owner context role exists`, () => {
  const html = `<!doctype html><html><body><nav id="a" role="tab"></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.role, 'tab');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_REQUIRED_PARENT_MISSING');
  assert.deepStrictEqual(rule.occurrences[0].data.details.requiredContextRoles, ['tablist']);
});

test(`${RULE_ID}: pass when the required-context role only exists across a shadow-DOM slot boundary (composed-tree ancestor, not light-DOM parentElement)`, () => {
  // A role="listitem" element is a light-DOM child of a host, distributed
  // via slot="descendant" into a shadow root that wraps that slot in
  // <div role="list">. The listitem's real rendered ancestor (the
  // role="list" div) is only reachable via .assignedSlot, invisible to
  // .parentElement.
  const dom = createDom(`<!doctype html><html><body>
    <div id="host"><div id="a" role="listitem" slot="descendant">Item</div></div>
  </body></html>`);
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML =
    `<div role="list"><slot name="descendant"></slot></div>`;

  const result = runa11yCoreOnDom(dom, {
    runOnly: [RULE_ID],
    engineOptions: { includeShadowDom: true }
  });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a slotted element's shadow-DOM ancestor still has no acceptable context role`, () => {
  // Same slotted shape as above, but the wrapping shadow-DOM container has
  // no role at all — confirms the composed-tree walk doesn't just make
  // every slotted element pass unconditionally.
  const dom = createDom(`<!doctype html><html><body>
    <div id="host"><div id="a" role="listitem" slot="descendant">Item</div></div>
  </body></html>`);
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = `<div><slot name="descendant"></slot></div>`;

  const result = runa11yCoreOnDom(dom, {
    runOnly: [RULE_ID],
    engineOptions: { includeShadowDom: true }
  });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when the element has the hidden attribute (not currently exposed to the accessibility tree)`, () => {
  const html = `<!doctype html><html><body><nav id="a" role="tab" hidden></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="tab"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Roles requiring a specific context role must be in that context');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-required-parent-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-required-parent-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });

  assert.ok(hasOccurrenceForId(rule, 'arp_case_04'));
  assert.ok(hasOccurrenceForId(rule, 'arp_case_07'));
  for (const id of [
    'arp_case_01',
    'arp_case_02',
    'arp_case_03',
    'arp_case_05',
    'arp_case_06',
    'arp_case_08',
    'arp_case_09',
    'arp_case_10',
    'arp_case_11'
  ]) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
