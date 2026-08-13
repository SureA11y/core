'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'nested-interactive-controls-absent';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no interactive control is present`, () => {
  const html = `<!doctype html><html><body><div>none</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for a plain button`, () => {
  const html = `<!doctype html><html><body><button>Click me</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a button contains a checkbox`, () => {
  const html = `<!doctype html><html><body><button id="a"><input type="checkbox"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.deepStrictEqual(rule.occurrences[0].data.details.nestedElements, ['input']);
});

test(`${RULE_ID}: fail when a link contains a button`, () => {
  const html = `<!doctype html><html><body><a id="b" href="/x">Text <button>nested</button></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

// Regression coverage for a bug found while extending direct coverage of
// this rule: the nested-descendant search used the raw native
// querySelectorAll, not helpers.queryAllSmart, so it wasn't subject to
// ANY hidden-content filtering at all -- not even hard CSS-based hiding,
// let alone aria-hidden. A nested descendant that is never actually
// rendered or exposed to AT creates no real ambiguity for any user, since
// it isn't there to be confused with the outer control.
test(`${RULE_ID}: a display:none nested control is not flagged (it is never rendered at all)`, () => {
  const html = `<!doctype html><html><body><a id="a" href="/x">Text <button style="display:none">nested</button></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an aria-hidden, non-focusable nested control is not flagged (it is not exposed to AT)`, () => {
  const html = `<!doctype html><html><body><a id="a" href="/x">Text <span role="checkbox" aria-hidden="true">nested</span></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// ---------------------------------------------------------------------------
// Focusability gate: a nested widget-role descendant only counts when it is
// operable (exposed to AT and platform-focusable). Composite widgets nest
// managed, non-focusable children (option/tab/treeitem/menuitem/radio driven
// by the container via roving focus or aria-activedescendant), which are not
// reported.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: pass for a listbox whose options are not independently focusable`, () => {
  const html = `<!doctype html><html><body>
    <div role="listbox" id="lb">
      <div role="option" id="opt1">Home</div>
      <div role="option" id="opt2">About</div>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: Angular Material autocomplete listbox/option panel passes`, () => {
  // A role="listbox" panel holding a role="option" custom element with no
  // tabindex; focus stays on the input via aria-activedescendant.
  const html = `<!doctype html><html><body>
    <div role="listbox" class="mat-mdc-autocomplete-panel quick-search-autocomplete" id="mat-autocomplete-0" aria-labelledby="mat-mdc-form-field-label-0">
      <mat-option role="option" class="mat-mdc-option mdc-list-item quick-search-autocomplete-option mat-mdc-option-active" id="mat-option-0" aria-selected="false" aria-disabled="false">
        <span class="mdc-list-item__primary-text"><span> Home </span><br><span class="avq-body-small"> Home </span></span>
        <div aria-hidden="true" mat-ripple="" class="mat-ripple mat-mdc-option-ripple mat-focus-indicator"></div>
      </mat-option>
    </div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for other composite widgets with non-focusable managed children`, () => {
  const composites = [
    `<div role="tablist"><div role="tab">One</div><div role="tab">Two</div></div>`,
    `<ul role="menu"><li role="menuitem">Open</li><li role="menuitemcheckbox">Wrap</li></ul>`,
    `<ul role="tree"><li role="treeitem">Root<ul role="group"><li role="treeitem">Child</li></ul></li></ul>`,
    `<div role="radiogroup"><span role="radio" aria-checked="false">A</span><span role="radio" aria-checked="true">B</span></div>`,
    `<div role="combobox" aria-expanded="true"><div role="listbox"><div role="option">X</div></div></div>`
  ];
  for (const markup of composites) {
    const html = `<!doctype html><html><body>${markup}</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', {
      minOccurrences: 0,
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: pass when a widget-role child is present but not focusable inside a control`, () => {
  // role="option" with no tabindex nested in a button is a widget but not
  // operable, so there is no nested *interactive* control.
  const html = `<!doctype html><html><body><button id="b">Pick <span role="option">Home</span></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a plain focusable div (no widget role) is nested`, () => {
  // A tabindex'd <div> with no widget role is focusable but not a control,
  // so it is not a nested interactive control.
  const html = `<!doctype html><html><body><a id="a" href="/x">Card <div tabindex="0">focus trap</div></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the only nested control is disabled (not focusable)`, () => {
  const html = `<!doctype html><html><body><a id="a" href="/x">Cart <button disabled>Remove</button></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a listbox option is made independently focusable via tabindex`, () => {
  // An option with tabindex="0" is itself a focus target, so it nests an
  // operable control inside the listbox.
  const html = `<!doctype html><html><body><div role="listbox" id="lb"><div role="option" tabindex="0">Home</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'lb'));
});

test(`${RULE_ID}: fail when a focusable role=button is nested in a link`, () => {
  const html = `<!doctype html><html><body><a id="a" href="/x">Card <span role="button" tabindex="0">Delete</span></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: fail when a native control is nested in a role=button container`, () => {
  const html = `<!doctype html><html><body><div id="c" role="button" tabindex="0">Save <a href="/x">details</a></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'c'));
});

test(`${RULE_ID}: nested chain attributes each control to its nearest operable ancestor`, () => {
  // a[href] > button > select: the link is reported for the button, the
  // button for the select; the link is NOT reported for the (deeper) select.
  const html = `<!doctype html><html><body><a id="a" href="/x">x <button id="btn">y <select id="sel"><option>z</option></select></button></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'btn'));
  const linkOcc = rule.occurrences.find((o) => o.html.includes('id="a"'));
  assert.deepStrictEqual(linkOcc.data.details.nestedElements, ['button']);
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><button id="a"><input type="checkbox"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Interactive controls must not be nested');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/nested-interactive-controls-absent-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'nested-interactive-controls-absent-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });

  const expectedFailIds = ['nic_case_03', 'nic_case_04', 'nic_case_05'];
  const expectedNoOccIds = ['nic_case_01', 'nic_case_02'];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
