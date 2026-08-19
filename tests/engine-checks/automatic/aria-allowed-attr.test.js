'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-allowed-attr';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no role attributes present`, () => {
  const html = `<!doctype html><html><body><div id="a" aria-label="Hello"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the attribute is unsupported by a role the ARIA tables cover`, () => {
  const html = `<!doctype html><html><body><div id="a" role="button" aria-valuenow="1"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when the role is not a valid concrete ARIA role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="not-a-role" aria-valuenow="1"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: ARIA 1.3 globals aria-query does not know are still allowed anywhere`, () => {
  for (const attr of ['aria-description', 'aria-braillelabel', 'aria-brailleroledescription']) {
    const html = `<!doctype html><html><body><div role="button" ${attr}="x">b</div></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: pass when only global aria-* attributes are present`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-label="Agree" aria-hidden="false"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-* attribute is supported by the role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-checked="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-* attribute is not permitted for the role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-valuenow="1"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-valuenow');
  assert.equal(rule.occurrences[0].data.details.role, 'checkbox');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_NOT_ALLOWED');
});

test(`${RULE_ID}: notApplicable when invalid aria-* is inside display:none subtree (default hidden filtering)`, () => {
  const html = `<!doctype html><html><body style="display:none"><div id="a" role="checkbox" aria-valuenow="1"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when invalid aria-* is inside [hidden] subtree (default hidden filtering)`, () => {
  const html = `<!doctype html><html><body><section hidden><div id="a" role="checkbox" aria-valuenow="1"></div></section></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when invalid aria-* is inside closed details content (default hidden filtering)`, () => {
  const html = `<!doctype html><html><body><details><summary>More</summary><div id="a" role="checkbox" aria-valuenow="1"></div></details></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: hidden filtering can be disabled with engineOptions.includeHiddenElements=true`, () => {
  const html = `<!doctype html><html><body style="display:none"><div id="a" role="checkbox" aria-valuenow="1"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { includeHiddenElements: true }
  });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when role has an unknown/invalid role token`, () => {
  const html = `<!doctype html><html><body><div id="a" role="buton" aria-label="Hello"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: reports one occurrence per disallowed attribute on the same element`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-valuenow="1" aria-valuemin="0"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const attrs = rule.occurrences.map((o) => o.data.details.attr).sort();
  assert.deepStrictEqual(attrs, ['aria-valuemin', 'aria-valuenow']);
});

test(`${RULE_ID}: pass when aria-modal is present on role="dialog"`, () => {
  const html = `<!doctype html><html><body><div id="a" role="dialog" aria-modal="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-modal is present on role="alertdialog"`, () => {
  const html = `<!doctype html><html><body><div id="a" role="alertdialog" aria-modal="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="searchbox" has textbox-family attrs (searchbox is textbox's ARIA subclass)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="searchbox" aria-multiline="false" aria-autocomplete="list"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="meter" has aria-valuetext (pairs with the aria-required-attr valuenow requirement)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="meter" aria-valuenow="42" aria-valuetext="42 percent"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="columnheader"/"rowheader" have aria-sort`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="columnheader" aria-sort="ascending"></div>
    <div id="b" role="rowheader" aria-sort="descending"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="listitem" has level/posinset/setsize`, () => {
  const html = `<!doctype html><html><body><div id="a" role="listitem" aria-level="2" aria-posinset="1" aria-setsize="5"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="menu"/"menubar"/"toolbar" have activedescendant/orientation`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="menu" aria-activedescendant="x" aria-orientation="vertical"></div>
    <div id="b" role="menubar" aria-orientation="horizontal"></div>
    <div id="c" role="toolbar" aria-activedescendant="y"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-expanded is present on roles listed by aria-query/ARIA 1.2`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="checkbox" aria-checked="true" aria-expanded="false"></div>
    <div id="b" role="columnheader" aria-sort="ascending" aria-expanded="true"></div>
    <div id="c" role="rowheader" aria-sort="ascending" aria-expanded="true"></div>
    <div id="d" role="gridcell" aria-expanded="true"></div>
    <div id="e" role="listbox" aria-expanded="true"></div>
    <div id="f" role="menuitemcheckbox" aria-checked="true" aria-expanded="true"></div>
    <div id="g" role="menuitemradio" aria-checked="true" aria-expanded="true"></div>
    <div id="h" role="row" aria-expanded="true"></div>
    <div id="i" role="switch" aria-checked="true" aria-expanded="true"></div>
    <div id="j" role="tab" aria-expanded="true"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-expanded is present on roles the spec does NOT list it for (listitem, dialog, alertdialog, heading)`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="listitem" aria-expanded="true"></div>
    <div id="b" role="dialog" aria-modal="true" aria-expanded="true"></div>
    <div id="c" role="alertdialog" aria-modal="true" aria-expanded="true"></div>
    <div id="d" role="heading" aria-level="2" aria-expanded="true"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 4, maxOccurrences: 4 });
  for (const id of ['a', 'b', 'c', 'd']) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: pass when aria-activedescendant is present on composite-widget roles (inherited from the abstract "composite" role)`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="combobox" aria-expanded="true" aria-activedescendant="x"></div>
    <div id="b" role="grid" aria-activedescendant="x"></div>
    <div id="c" role="listbox" aria-activedescendant="x"></div>
    <div id="d" role="radiogroup" aria-activedescendant="x"></div>
    <div id="e" role="row" aria-activedescendant="x"></div>
    <div id="f" role="spinbutton" aria-valuenow="1" aria-activedescendant="x"></div>
    <div id="g" role="tablist" aria-activedescendant="x"></div>
    <div id="h" role="treegrid" aria-activedescendant="x"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for posinset/setsize/readonly/required/level`, () => {
  const html = `<!doctype html><html><body>
    <div id="a" role="radio" aria-checked="true" aria-posinset="1" aria-setsize="3"></div>
    <div id="b" role="tab" aria-posinset="1" aria-setsize="3"></div>
    <div id="c" role="switch" aria-checked="true" aria-readonly="true" aria-required="true"></div>
    <div id="d" role="menuitemcheckbox" aria-checked="true" aria-readonly="true" aria-required="true" aria-posinset="1" aria-setsize="2"></div>
    <div id="e" role="tablist" aria-level="1"></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-readonly is present on role="tree" (not in aria-query's resolved props for tree)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="tree" aria-readonly="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-readonly');
  assert.equal(rule.occurrences[0].data.details.role, 'tree');
});

test(`${RULE_ID}: fail when aria-modal is present on a role that doesn't support it (role="checkbox")`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-checked="true" aria-modal="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-modal');
});

test(`${RULE_ID}: cantTell when an ARIA-1.2-deprecated ex-global is used on a role that doesn't support it`, () => {
  // role="heading" supports none of the four ex-globals, so each is deprecated there.
  for (const attr of ['aria-invalid', 'aria-haspopup', 'aria-errormessage', 'aria-disabled']) {
    const html = `<!doctype html><html><body><div id="a" role="heading" aria-level="2" ${attr}="true"></div></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(rule.occurrences[0].occurrenceOutcome, 'cantTell');
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_DEPRECATED');
    assert.equal(rule.occurrences[0].data.details.attr, attr);
  }
});

test(`${RULE_ID}: pass when a deprecated ex-global IS supported by the role (e.g. checkbox + aria-invalid)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-checked="true" aria-invalid="true"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a genuinely-unsupported attr fails and a deprecated one cantTells on the same element`, () => {
  const html = `<!doctype html><html><body><div id="a" role="radio" aria-checked="true" aria-valuenow="1" aria-invalid="false"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const byAttr = Object.fromEntries(
    rule.occurrences.map((o) => [o.data.details.attr, o.occurrenceOutcome])
  );
  assert.strictEqual(byAttr['aria-valuenow'], 'fail');
  assert.strictEqual(byAttr['aria-invalid'], 'cantTell');
});

test(`${RULE_ID}: implicit-role radio input with aria-invalid is cantTell (Angular Material default)`, () => {
  const html = `<!doctype html><html><body><input id="a" type="radio" aria-invalid="false" aria-label="Option"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_DEPRECATED');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="checkbox" aria-valuenow="1"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'aria-* attributes must be permitted for the element’s role');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-allowed-attr-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-allowed-attr-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  // 7 fail occurrences (case_04 carries two) + 1 cantTell (case_14, a
  // deprecated-but-allowed attr) => resolves to fail overall, 8 occurrences.
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 8, maxOccurrences: 8 });

  const outcomeForId = (id) =>
    (rule.occurrences || []).find(
      (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
    )?.occurrenceOutcome;

  const expectedFailIds = [
    'aaa_case_03',
    'aaa_case_04',
    'aaa_case_05',
    'aaa_case_13',
    'aaa_case_15',
    'aaa_case_17'
  ];
  assert.ok(hasOccurrenceForId(rule, 'aaa_case_14'), 'Expected occurrence for aaa_case_14');
  assert.strictEqual(outcomeForId('aaa_case_14'), 'cantTell');
  const expectedNoOccIds = [
    'aaa_case_01',
    'aaa_case_02',
    'aaa_case_06',
    'aaa_case_07a',
    'aaa_case_07b',
    'aaa_case_08',
    'aaa_case_09',
    'aaa_case_10a',
    'aaa_case_10b',
    'aaa_case_11',
    'aaa_case_12a',
    'aaa_case_12b',
    'aaa_case_12c',
    'aaa_case_16',
    'aaa_case_18'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: role="none" on a focusable element does not decide which attributes are allowed`, () => {
  const html = `<!doctype html><html><body><button role="none" aria-pressed="false">ACT rules are cool!</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role="presentation" is skipped for the same reason`, () => {
  const html = `<!doctype html><html><body><div role="presentation" aria-pressed="false">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an element with no role attribute is judged by its implicit role`, () => {
  const html = `<!doctype html><html><body><button id="b" aria-sort="ascending">Sort</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: an attribute the implicit role supports passes`, () => {
  for (const markup of [
    `<button aria-pressed="false">B</button>`,
    `<input type="password" aria-required="true">`,
    `<input type="range" aria-valuenow="3">`,
    `<textarea aria-multiline="true"></textarea>`
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${markup}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: elements whose implicit role depends on context stay out of scope`, () => {
  for (const markup of [
    `<a href="#" aria-sort="ascending">x</a>`,
    `<table><tr><td aria-selected="true">x</td></tr></table>`,
    `<section aria-checked="true">x</section>`,
    `<select aria-sort="ascending"><option>a</option></select>`,
    `<ul><li aria-checked="true">x</li></ul>`,
    `<img src="x.png" alt="" aria-checked="true">`
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${markup}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: an element whose role is context-dependent is skipped`, () => {
  // <a>'s role depends on href, <td>'s on whether the table is a layout
  // table, so neither is in the context-free table and neither is guessed at.
  for (const body of [
    '<a href="/x" aria-checked="true">x</a>',
    '<table><tr><td aria-checked="true">x</td></tr></table>'
  ]) {
    const html = `<!doctype html><html><body>${body}</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a generic element does not support a role-specific attribute`, () => {
  // <div>/<span> resolve to the generic role, whose supported set is empty.
  for (const body of ['<div aria-checked="true">x</div>', '<span aria-expanded="true">x</span>']) {
    const html = `<!doctype html><html><body>${body}</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_NOT_ALLOWED');
    assert.strictEqual(rule.occurrences[0].data.details.role, 'generic');
  }
});

test(`${RULE_ID}: a global attribute is fine on a generic element`, () => {
  const html = `<!doctype html><html><body><div aria-label="Panel">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// ---------------------------------------------------------------------------
// Elements HTML-AAM maps to no role at all: nothing supports a role-specific
// attribute on them. ACT 5c01ea's failed example 2 is exactly this shape.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: an element with no ARIA role supports no role-specific attribute`, () => {
  const html = `<!doctype html><html><body><audio src="/a.mp3" controls aria-orientation="horizontal"></audio></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  const details = rule.occurrences[0].data.details;
  assert.strictEqual(details.reasonCode, 'ARIA_ATTR_NOT_ALLOWED_ROLELESS');
  assert.strictEqual(details.attr, 'aria-orientation');
  assert.strictEqual(details.element, 'audio');
});

test(`${RULE_ID}: a global attribute is fine on an element with no role`, () => {
  const html = `<!doctype html><html><body><video aria-label="Intro"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an explicit role on a roleless element is judged against that role`, () => {
  // role="tab" supports aria-selected, so the same element passes once a role
  // that supports the attribute is declared.
  const html = `<!doctype html><html><body><video role="tab" aria-selected="true"></video></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
