'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'listitem-parent-valid';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no li is present`, () => {
  const html = `<!doctype html><html><body><div>no items</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when li is inside ul`, () => {
  const html = `<!doctype html><html><body><ul><li>a</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when li is inside ol`, () => {
  const html = `<!doctype html><html><body><ol><li>a</li></ol></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when li is inside role="list"`, () => {
  const html = `<!doctype html><html><body><div role="list"><li>a</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// Under a composite widget role the stray <li> breaks the widget: it fails
// where it is drawn as a list item, and is asked about where it is not, as
// any misplaced <li> is (round 8, NW-3).
test(`${RULE_ID}: fails an li drawn as a list item whose <ul> has an explicit role="menu" (the explicit role overrides the tag's native "list" role)`, () => {
  const html = `<!doctype html><html><body><ul role="menu"><li id="a">orphan</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  const o = rule.occurrences[0];
  const details = o.data.details;
  assert.equal(details.reasonCode, 'LIST_ROLE_OVERRIDDEN');
  assert.equal(details.parentRole, 'menu');
  assert.equal(details.parentElement, 'ul');
  assert.equal(o.i18n.summaryKey, 'listitemParentValid_summary_fail_listRoleOverridden');
  assert.equal(o.i18n.hintKey, 'listitemParentValid_hint_fail_listRoleOverridden');
});

test(`${RULE_ID}: an li under a composite widget role fails where drawn as a list item (round 8, NW-3)`, () => {
  for (const role of [
    'tablist',
    'menu',
    'menubar',
    'listbox',
    'tree',
    'treegrid',
    'grid',
    'radiogroup',
    'toolbar'
  ]) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><ul role="${role}" aria-label="n"><li><a href="/a">A</a></li><li><a href="/b">B</a></li></ul></main></body></html>`;
    const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'fail', {
      minOccurrences: 2,
      maxOccurrences: 2
    });
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'LIST_ROLE_OVERRIDDEN', role);
  }
  // Not drawn as a list item: asked about, as a misplaced <li> is.
  const plain = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><ul role="tablist" style="list-style:none"><li style="display:inline">A</li></ul></main></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(plain, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  const o = rule.occurrences[0];
  assert.equal(o.data.details.reasonCode, 'LIST_ROLE_OVERRIDDEN');
  assert.equal(o.i18n.summaryKey, 'listitemParentValid_summary_cantTell_listRoleOverridden');
  assert.match(o.uncertainty.needed, /shows this element as an item of a list/);
});

// Under a landmark or structure role the list is gone for certain; whether
// that loses information depends on the content, so it is asked about,
// leaning fail where the item is drawn as one of a list.
test(`${RULE_ID}: asks about an li whose <ul> has an explicit role="region", leaning fail where drawn as a list item`, () => {
  const html = `<!doctype html><html><body><ul role="region" aria-label="r"><li id="a">orphan</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  const o = rule.occurrences[0];
  assert.equal(o.data.details.reasonCode, 'LIST_ROLE_OVERRIDDEN');
  assert.equal(o.data.details.parentRole, 'region');
  assert.equal(o.i18n.summaryKey, 'listitemParentValid_summary_cantTell_listRoleOverridden');
  assert.equal(o.lean.toward, 'fail');
  assert.equal(o.lean.i18n.whyKey, 'listitemParentValid_lean_why_listRoleOverridden');
  assert.match(o.uncertainty.needed, /loses information without the list/);
});

test(`${RULE_ID}: an li in a <ul role="navigation"> or <ul role="group"> is asked about (R5 list lead)`, () => {
  for (const role of ['navigation', 'group']) {
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><ul role="${role}"><li><a href="/a">A</a></li><li><a href="/b">B</a></li></ul></main></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  }
  // Not drawn as a list: asked about, with no lean.
  const plain = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><ul role="navigation" style="list-style:none"><li style="display:inline">A</li></ul></main></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(plain, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].lean, undefined);
});

// The two need different fixes, so they get different reason codes.
test(`${RULE_ID}: a list whose role replaces list and an <li> outside any list get different reason codes`, () => {
  const html = `<!doctype html><html><body>
    <ul role="tablist"><li id="tabs">Tab</li></ul>
    <ol role="group"><li id="group">Slide</li></ol>
    <div><li id="div">Stray</li></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  const byId = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`)).data.details;
  assert.deepEqual(byId('tabs'), {
    reasonCode: 'LIST_ROLE_OVERRIDDEN',
    parentElement: 'ul',
    parentRole: 'tablist'
  });
  assert.match(
    rule.occurrences.find((o) => o.html.includes('id="tabs"')).summary,
    /has role="tablist", which replaces list/
  );
  assert.equal(byId('group').parentRole, 'group');
  assert.deepEqual(byId('div'), { reasonCode: 'LISTITEM_INVALID_PARENT', parentElement: 'div' });
});

test(`${RULE_ID}: pass when li's parent is a <ul> with an explicit role="presentation" (list semantics suppressed on purpose)`, () => {
  const html = `<!doctype html><html><body><ul role="presentation"><li id="a">item</li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when li's parent is an <ol> with an explicit role="none"`, () => {
  const html = `<!doctype html><html><body><ol role="none"><li id="a">item</li></ol></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when li's parent is a plain div`, () => {
  const html = `<!doctype html><html><body><div><li id="a">orphan</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.parentElement, 'div');
});

test(`${RULE_ID}: reports one occurrence per orphaned li`, () => {
  const html = `<!doctype html><html><body><div><li id="a">a</li><li id="b">b</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: notApplicable when li has its own explicit role="tab" with an invalid parent: the explicit role overrides the li's native "listitem" role entirely, so there's no listitem semantics to validate a parent for (real pattern: tablist widgets built on <li>, e.g. Docusaurus tabs)`, () => {
  const html = `<!doctype html><html><body><div role="tablist"><li id="a" role="tab">Tab</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when li has its own explicit role="menuitem" with an invalid parent (real pattern: menu widgets built on <li>)`, () => {
  const html = `<!doctype html><html><body><div role="menu"><li id="a" role="menuitem">Item</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when li has its own explicit role="presentation"/"none" with an invalid parent (real pattern: HubSpot-generated nav menus, decorative <li> wrappers)`, () => {
  const html1 = `<!doctype html><html><body><div><li id="a" role="presentation">x</li></div></body></html>`;
  assertRule(runa11yCoreOnHtml(html1, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
  const html2 = `<!doctype html><html><body><div><li id="a" role="none">x</li></div></body></html>`;
  assertRule(runa11yCoreOnHtml(html2, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: still fails when li has an explicit role="listitem" (a no-op restatement, not an override) with an invalid parent`, () => {
  const html = `<!doctype html><html><body><div><li id="a" role="listitem">orphan</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

// <menu> is a list container with the implicit role list (HTML-AAM).
test(`${RULE_ID}: pass when li is inside a <menu>`, () => {
  const html = `<!doctype html><html><body><menu><li>a</li><li>b</li></menu></body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a <menu> given another role is not a list container`, () => {
  const html = `<!doctype html><html><body><menu role="toolbar"><li id="a">a</li></menu></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div><li id="a">orphan</li></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'List items must be inside a list container');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/listitem-parent-valid-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'listitem-parent-valid-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedFailIds = [
    'lpv_case_04',
    'lpv_case_05',
    'lpv_case_06',
    'lpv_case_09',
    'lpv_case_13'
  ];
  const expectedNoOccIds = [
    'lpv_case_01',
    'lpv_case_02',
    'lpv_case_03',
    'lpv_case_07',
    'lpv_case_08',
    'lpv_case_10',
    'lpv_case_11',
    'lpv_case_12',
    'lpv_case_14'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: the parent's role is a fallback list read in any case (#91)`, () => {
  // role="foo list" and role="LIST" are lists; role="foo" is no role, so the
  // <ul> stays a list; role="foo menu" on a <ul> makes it a menu.
  const html = `<!doctype html><html><body>
    <div role="foo list"><li id="fallback">a</li></div>
    <div role="LIST"><li id="upper">b</li></div>
    <ul role="foo"><li id="unknown">c</li></ul>
    <ul role="foo menu"><li id="menu">d</li></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'menu'));
});

// WAI-ARIA 1.2 lists directory as a required parent of listitem: deprecated,
// but valid, and Chromium exposes it as a list (#149).
test(`${RULE_ID}: a parent with role="directory" is a list`, () => {
  for (const parent of ['ol role="directory"', 'ul role="directory"', 'div role="directory"']) {
    const tag = parent.split(' ')[0];
    const html = `<!doctype html><html lang="en"><head><title>t</title></head><body><main><${parent}><li>a</li></${tag}></main></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

// An <li> outside a list fails where it is still drawn as a list item (a
// marker the reader sees, in no list the markup states); one drawn as a
// plain layout box, with no marker, shows no list and is asked about.
test(`${RULE_ID}: fails where the stray item is drawn as a list item, and asks about one drawn with no marker`, () => {
  const run = (body) =>
    runa11yCoreOnHtml(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`,
      { runOnly: [RULE_ID] }
    ).checksResults.find((r) => r.ruleId === RULE_ID);
  assert.strictEqual(run('<div><li>Apple</li></div>').outcome, 'fail');
  const plain = run('<div><li style="display:block">Apple</li></div>');
  assert.strictEqual(plain.outcome, 'cantTell');
  assert.strictEqual(plain.occurrences[0].uncertainty.code, 'spec-only');
  assert.strictEqual(
    run('<div><li style="list-style-type:none">Apple</li></div>').outcome,
    'cantTell'
  );
});

// An <li> a wrapper separates from its list: the hint must not suggest
// role="list" on the wrapper, which would nest a second list.
test(`${RULE_ID}: an <li> a wrapper separates from its <ul> names both`, () => {
  const html = `<!doctype html><html><body>
    <ul><div class="item-wrap"><li id="w">a</li></div></ul>
    <ul><a href="/x"><li id="l">Home</li></a></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const wrapped = rule.occurrences.find((o) => o.html.includes('id="w"'));
  assert.strictEqual(wrapped.data.details.reasonCode, 'LISTITEM_INVALID_PARENT');
  assert.strictEqual(wrapped.i18n.summaryKey, 'listitemParentValid_summary_fail_wrapped');
  assert.strictEqual(
    wrapped.summary,
    'This <li> is inside a <ul>, but the <div class="item-wrap"> between them breaks the list: a list\'s items must be its children.'
  );
  assert.doesNotMatch(wrapped.hint, /role="list"/);
  const link = rule.occurrences.find((o) => o.html.includes('id="l"'));
  assert.strictEqual(
    link.hint,
    'Move the <a> inside the <li>, or remove it, so the <li> is a child of the <ul>.'
  );
  assert.strictEqual(link.data.details.listElement, 'ul');
});

// Wrappers two or three levels deep: the list is still named, with every
// wrapper between, from the list down.
test(`${RULE_ID}: an <li> two or three wrappers below its list names the list and them`, () => {
  const html = `<!doctype html><html><body>
    <ul><div class="row"><span><li id="two">a</li></span></div></ul>
    <ol><div><span><b><li id="three">b</li></b></span></div></ol>
    <ul><div><span><b><i><li id="four">c</li></i></b></span></div></ul>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
  const byId = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`));

  const two = byId('two');
  assert.strictEqual(two.i18n.summaryKey, 'listitemParentValid_summary_fail_wrappedMany');
  assert.strictEqual(two.i18n.hintKey, 'listitemParentValid_hint_fail_wrappedMany');
  assert.strictEqual(
    two.summary,
    'This <li> is inside a <ul>, but the <div class="row">, <span> between them break the list: a list\'s items must be its children.'
  );
  assert.strictEqual(
    two.hint,
    'Remove the elements between them, or move them inside the <li>, so the <li> is a child of the <ul>.'
  );
  assert.deepStrictEqual(two.data.details.wrappedBy, ['<span>', '<div class="row">']);
  assert.strictEqual(two.data.details.listElement, 'ul');

  assert.match(byId('three').summary, /inside a <ol>, but the <div>, <span>, <b> between them/);
  // Four levels down is past the walk: the plain message.
  assert.strictEqual(byId('four').i18n.summaryKey, 'listitemParentValid_summary_fail');
});

// role none or presentation passes from a <ul>, <ol> or <menu> to its <li>
// children; on any other element it only removes that element's own role,
// so an <li> under <div role="none"> is still in no list.
test(`${RULE_ID}: role none or presentation is a valid parent only on a list element (round 9, N9-5)`, () => {
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
  for (const body of [
    '<div role="none"><li id="a">Item one</li><li>Item two</li></div>',
    '<nav role="presentation"><li id="a">Item one</li></nav>',
    '<span role="NONE"><li id="a">Item one</li></span>'
  ]) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }),
      RULE_ID,
      'fail',
      {
        minOccurrences: 1
      }
    );
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'LISTITEM_INVALID_PARENT', body);
  }
  for (const body of [
    '<ul role="none"><li>Item</li></ul>',
    '<ol role="presentation"><li>Item</li></ol>',
    '<menu role="none"><li>Item</li></menu>',
    // A role none wrapper inside a list stays as it was, pending a decision
    // (N9-5 b): list-children-valid reports the wrapper.
    '<ul><div role="none"><li>Item</li></div></ul>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      minOccurrences: 0,
      maxOccurrences: 0
    });
  }
});
