'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-prohibited-children';

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

test(`${RULE_ID}: pass when listitems are wrapped in role="group" under role="list" (group is transparent for ANY container role, not only ones whose own required-owned set names "group" — ACT bc4a75)`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="list">
      <span role="listitem">Item 1</span>
      <div role="group">
        <span role="listitem">Item 2</span>
        <span role="listitem">Item 3</span>
      </div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a role="group" under role="list" owns a disallowed role="tab" (group is transparent, so its children are judged against list's own required-owned set)`, () => {
  const html = `<!doctype html><html><body>
    <div role="list">
      <div role="group">
        <span id="a" role="tab">Item 1</span>
        <span role="tab">Item 2</span>
      </div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
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

test(`${RULE_ID}: fail when a role="none" wrapper hides a disallowed role="region" descendant`, () => {
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

test(`${RULE_ID}: fail when a roleless-but-focusable (tabindex) child is owned by a container`, () => {
  const html = `<!doctype html><html><body>
    <div role="menubar">
      <div role="menuitem">File</div>
      <div id="a" tabindex="0">Roleless but focusable</div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_PROHIBITED_CHILD_ROLELESS');
  assert.equal(rule.occurrences[0].data.details.attr, 'tabindex');
});

test(`${RULE_ID}: fail when a roleless-but-natively-focusable (e.g. <a href>, no tabindex attribute) child is owned by a container — must not be misreported as "carries tabindex"`, () => {
  const html = `<!doctype html><html><body>
    <ul role="list">
      <li role="listitem">Item</li>
      <li role="none"><a id="a" href="#">Roleless but natively focusable</a></li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_PROHIBITED_CHILD_ROLELESS');
  assert.equal(rule.occurrences[0].data.details.attr, 'nativeFocusable');
  assert.ok(!/carries tabindex/.test(rule.occurrences[0].summary));
  assert.ok(/natively focusable/.test(rule.occurrences[0].summary));
});

test(`${RULE_ID}: pass when a natively-focusable descendant sits several DOM levels inside a bare <li> (no role="" attribute) under role="list" — the <li>'s implicit listitem role is the real owned child and stops the walk there, matching aria-required-children's own native-tag fallback`, () => {
  const html = `<!doctype html><html><body>
    <ul role="list">
      <li>
        <avq-card>
          <div class="avq-card-body">
            <avq-card-actions>
              <a id="a" routerlink="/x" href="#/x">Explore</a>
            </avq-card-actions>
          </div>
        </avq-card>
      </li>
    </ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// The <li> fix above uses ariaHelpers.getContainmentRole, which resolves any
// tag in NATIVE_CONTAINMENT_ROLE_BY_ELEMENT (src/core/aria-helpers.js), not
// just <li>. These cover every other entry in that table that's also a
// REQUIRED_OWNED_ROLES value (i.e. where a bare native tag with no role=""
// attribute is a real fix target for this rule, not just for
// aria-required-children): option/listbox, row(tr)+rowgroup(tbody)/table,
// cell(td) and columnheader(th)/row, radio(input[type=radio])/radiogroup.
// ul/ol/table/select map to roles that are never themselves a required-
// owned value, so a bare instance of those tags isn't part of this bug
// class — omitted deliberately, not an oversight.

test(`${RULE_ID}: pass when a focusable descendant sits inside a role="option" child of role="listbox" — the option is the real owned child`, () => {
  const html = `<!doctype html><html><body>
    <div role="listbox">
      <div role="option"><span id="a" tabindex="0">Nested focusable, should not be reported</span></div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a bare <option> outside a select carries no implicit role, so it is transparent`, () => {
  // HTML-AAM gives <option> its role only inside select/datalist/optgroup —
  // the same conditional ACT bc4a75 applies to a bare <li> outside a list.
  // With no role of its own the option is a transparent wrapper, so the
  // focusable span inside it is the listbox's own roleless owned entry.
  const html = `<!doctype html><html><body>
    <div role="listbox">
      <option><span id="a" tabindex="0">Focusable</span></option>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'ARIA_PROHIBITED_CHILD_ROLELESS');
});

test(`${RULE_ID}: pass when a bare <tbody> (no role="" attribute, tabindex for keyboard-scrollable table body — a real, common pattern) sits under role="table" — the <tbody>'s implicit rowgroup role is itself one of table's allowed owned roles, so it's a transparent group, not a roleless-focusable violation (uses a real <table> so the HTML parser doesn't silently drop <tbody>/<tr>/<td>, which are parse-error-ignored outside real table context)`, () => {
  const html = `<!doctype html><html><body>
    <table role="table">
      <tbody tabindex="0">
        <tr role="row"><td role="cell">x</td></tr>
      </tbody>
    </table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a focusable descendant sits inside a bare <td> (no role="" attribute) under role="row" — the <td>'s implicit cell role is the real owned child (real <table> markup, see note above)`, () => {
  const html = `<!doctype html><html><body>
    <table>
      <tr role="row"><td><a id="a" href="#">Nested link, should not be reported</a></td></tr>
    </table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a focusable descendant sits inside a bare <th> (no role="" attribute) under role="row" — the <th>'s implicit columnheader role is the real owned child (real <table> markup, see note above)`, () => {
  const html = `<!doctype html><html><body>
    <table>
      <tr role="row"><th><a id="a" href="#">Nested link, should not be reported</a></th></tr>
    </table>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for a plain <input type="radio"> (no role="" attribute) under role="radiogroup" — an extremely common real-world pattern that was misreported as roleless-nativeFocusable before this fix, since native inputs are focusable with no tabindex attribute at all`, () => {
  const html = `<!doctype html><html><body>
    <div role="radiogroup">
      <input id="a" type="radio" />
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a container role is directly owned by another container role not in its allowed set (grid nested directly in radiogroup) — regression guard that stopping at a native-fallback boundary doesn't also suppress genuinely disallowed roles`, () => {
  const html = `<!doctype html><html><body>
    <div role="radiogroup">
      <input type="radio" />
      <div id="a" role="grid"><div role="row"><div role="cell">x</div></div></div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: fail when a roleless-but-globally-aria-attributed (aria-label) child is owned by a container`, () => {
  const html = `<!doctype html><html><body>
    <div role="menubar">
      <div role="menuitem">File</div>
      <div id="a" aria-label="Named">Something</div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-label');
});

test(`${RULE_ID}: pass when a roleless, non-focusable, non-aria-attributed child is a transparent wrapper (unchanged existing behavior)`, () => {
  const html = `<!doctype html><html><body>
    <div role="menubar">
      <div role="menuitem">File</div>
      <div><span id="a" role="menuitem">Edit</span></div>
    </div>
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

// --- Roleless wrappers hold ITEMS, and an item's own content is not the
// container's child. A component library routinely buries the real item
// several roleless levels down, so the walk descends to find it; these guard
// that the descent doesn't also drag the item's sibling content up into the
// container's owned set.

test(`${RULE_ID}: pass for the Angular Material card-radio shape — a roleless card wrapper holds the radio, and a role="separator" in the same card body is the card's content, not an owned child of the radiogroup`, () => {
  const html = `<!doctype html><html><body>
    <mat-radio-group role="radiogroup" aria-label="Select broker exposure card">
      <div class="mdc-layout-grid"><div class="mdc-layout-grid__inner">
        <avq-card class="avq-card">
          <div class="avq-card-body">
            <avq-card-header>
              <mat-radio-button id="mat-radio-0">
                <div class="mdc-form-field"><div class="mdc-radio">
                  <input type="radio" id="mat-radio-0-input" name="g" value="1" tabindex="0">
                </div></div>
              </mat-radio-button>
            </avq-card-header>
            <avq-card-content>
              <div class="avq-display-flex">
                <div class="col">Exposure warning delta</div>
                <mat-divider id="a" role="separator" aria-orientation="vertical"></mat-divider>
                <div class="col">Trade stop delta</div>
              </div>
            </avq-card-content>
          </div>
        </avq-card>
      </div></div>
    </mat-radio-group>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a roleless wrapper holds tabs alongside a role="button" — the button is the wrapper's content, not an owned child of the tablist`, () => {
  const html = `<!doctype html><html><body>
    <div role="tablist" aria-label="Sections">
      <div class="tab-strip">
        <div role="tab">A</div>
        <div id="a" role="button" tabindex="0">scroll right</div>
      </div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a roleless row wrapper holds an option alongside a role="img" icon`, () => {
  const html = `<!doctype html><html><body>
    <div role="listbox" aria-label="Country">
      <div class="row">
        <span id="a" role="img" aria-label="flag"></span>
        <div role="option">Spain</div>
      </div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a roleless wrapper holds NO allowed item — it is interposed content, not an item wrapper, so what it does hold is still reported`, () => {
  const html = `<!doctype html><html><body>
    <div role="list">
      <span role="listitem">Item</span>
      <div class="toolbar"><div id="a" role="button" tabindex="0">Add</div></div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: fail when a role="presentation" wrapper holds an item alongside a disallowed role — presentational elements really are removed from the accessibility tree and their children promoted, so the disallowed role IS an owned child (unlike a roleless wrapper, which stays in the tree as a generic node)`, () => {
  const html = `<!doctype html><html><body>
    <div role="list">
      <div role="presentation">
        <span role="listitem">Item</span>
        <div id="a" role="button" tabindex="0">Add</div>
      </div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: an item wrapper suppresses only its OWN subtree — a genuinely stray direct child of the same container is still reported`, () => {
  const html = `<!doctype html><html><body>
    <div role="radiogroup" aria-label="Plan">
      <div class="card">
        <input type="radio" name="p" value="1">
        <div role="separator"></div>
      </div>
      <div id="a" role="button" tabindex="0">Compare plans</div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><ul role="menubar"><li id="a" role="region"></li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Container roles must not own a child with a disallowed role');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-prohibited-children-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-prohibited-children-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 7, maxOccurrences: 7 });

  for (const id of [
    'apc_case_06_child',
    'apc_case_07_child',
    'apc_case_08_child',
    'apc_case_10_child',
    'apc_case_11_child',
    'apc_case_12_child',
    'apc_case_18_child'
  ]) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of [
    'apc_case_01',
    'apc_case_02',
    'apc_case_03',
    'apc_case_04',
    'apc_case_05',
    'apc_case_09',
    'apc_case_13',
    'apc_case_15',
    'apc_case_16',
    'apc_case_16_child',
    'apc_case_17',
    'apc_case_17_child'
  ]) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
