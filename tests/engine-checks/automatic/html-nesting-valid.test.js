'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'html-nesting-valid';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

const HTML401 =
  '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">';

function page(body, doctype = '<!doctype html>') {
  return `${doctype}<html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
}

const run = (html, opts = RUN) => runa11yCoreOnHtml(html, opts);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);
const reasons = (rule) => rule.occurrences.map((o) => o.data.details.reasonCode);

// Every case below was checked against the W3C validator (Nu checker
// 26.9.27): each failing case is a validator error there, and each passing
// case has no error.
function expectFail(body, reasonCode, count = 1) {
  const rule = assertRule(run(page(body)), RULE_ID, 'fail', {
    minOccurrences: count,
    maxOccurrences: count
  });
  assert.deepEqual(reasons(rule), Array(count).fill(reasonCode), body);
  return rule;
}

// The validator reads hidden content too, so each case fails the same way
// visible, under hidden and under display:none.
function expectFailEverywhere(body, reasonCode) {
  for (const wrapped of [
    body,
    `<div hidden>${body}</div>`,
    `<div style="display:none">${body}</div>`
  ]) {
    expectFail(wrapped, reasonCode);
  }
}

test(`${RULE_ID}: a ul, ol or menu child other than li, script or template fails`, () => {
  expectFailEverywhere('<ul><li>a</li><div role="listitem">b</div></ul>', 'listChild');
  expectFailEverywhere('<ul><li>a</li><input type="hidden" name="x" value="y"></ul>', 'listChild');
  expectFail('<ol><li>a</li><p>b</p></ol>', 'listChild');
  expectFail('<menu><li>a</li><div>b</div></menu>', 'listChild');
  const rule = expectFail('<ul><li>a</li><my-item>b</my-item></ul>', 'listChild');
  assert.deepEqual(rule.occurrences[0].i18n.params, { element: 'my-item', parent: 'ul' });
  assert.equal(rule.occurrences[0].i18n.summaryKey, 'htmlNestingValid_summary_fail_listChild');
  assert.equal(rule.occurrences[0].i18n.hintKey, 'htmlNestingValid_hint_fail_listChild');
});

test(`${RULE_ID}: text directly inside a list fails`, () => {
  expectFailEverywhere('<ul>Fruit<li>a</li></ul>', 'listText');
});

test(`${RULE_ID}: an li outside ul, ol or menu fails, whatever role its parent has`, () => {
  expectFailEverywhere('<div role="list"><li>a</li></div>', 'listItemParent');
  expectFail('<div><li role="listitem">a</li></div>', 'listItemParent');
  expectFail('<my-list><li>a</li></my-list>', 'listItemParent');
});

test(`${RULE_ID}: the description list content model is enforced`, () => {
  expectFailEverywhere('<dl><dd>b</dd><dt>a</dt></dl>', 'dlGroupOrder');
  expectFail('<dl><dt>a</dt></dl>', 'dlGroupOrder');
  expectFail('<dl><dt>a</dt><dd>b</dd><dt>c</dt></dl>', 'dlGroupOrder');
  expectFail('<dl><div><dt>a</dt></div></dl>', 'dlGroupOrder');
  expectFail('<dl><div><dt>a</dt><dd>b</dd><dt>c</dt><dd>d</dd></div></dl>', 'dlGroupOrder');
  expectFailEverywhere('<dl><style></style><dt>a</dt><dd>b</dd></dl>', 'dlChild');
  expectFail('<dl><p>x</p></dl>', 'dlChild');
  expectFail('<dl><div><p>x</p><dt>a</dt><dd>b</dd></div></dl>', 'dlChild');
  expectFailEverywhere('<dl>hello<dt>a</dt><dd>b</dd></dl>', 'dlText');
  expectFail('<dl><div> t <dt>a</dt><dd>b</dd></div></dl>', 'dlText');
  expectFailEverywhere(
    '<dl><div><dt>a</dt><dd>b</dd></div><dt>c</dt><dd>d</dd></dl>',
    'dlMixedGroups'
  );
});

test(`${RULE_ID}: a dt or dd outside a dl fails`, () => {
  expectFailEverywhere('<div><dt>a</dt></div>', 'dlItemParent');
  const rule = expectFail('<section><dd>b</dd></section>', 'dlItemParent');
  assert.deepEqual(rule.occurrences[0].i18n.params, { element: 'dd', parent: 'section' });
});

test(`${RULE_ID}: interactive content inside a or button fails, disabled or hidden included`, () => {
  expectFailEverywhere('<a href="/x">L <button disabled>b</button></a>', 'interactiveDescendant');
  expectFail('<a href="/x">L <button hidden>b</button></a>', 'interactiveDescendant');
  expectFail('<a>L <button>b</button></a>', 'interactiveDescendant');
  expectFail('<button>B <a href="/y">y</a></button>', 'interactiveDescendant');
  expectFail('<button>B <input type="text" aria-label="t"></button>', 'interactiveDescendant');
  expectFail('<a href="/x"><label>L</label></a>', 'interactiveDescendant');
  expectFail('<a href="/x"><audio src="a.mp3" controls></audio></a>', 'interactiveDescendant');
  expectFail(
    '<a href="/x"><img src="a.png" alt="x" usemap="#m"></a><map name="m"></map>',
    'interactiveDescendant'
  );
  const rule = expectFail(
    '<a href="/x"><iframe title="f" src="a.html"></iframe></a>',
    'interactiveDescendant'
  );
  assert.deepEqual(rule.occurrences[0].i18n.params, { element: 'iframe', ancestor: 'a' });
});

test(`${RULE_ID}: an element with tabindex inside a or button fails`, () => {
  expectFailEverywhere('<a href="/x">L <span tabindex="0">s</span></a>', 'tabindexDescendant');
  expectFail('<a href="/x">L <span tabindex="-1">s</span></a>', 'tabindexDescendant');
  expectFail('<button>B <span tabindex="-1">s</span></button>', 'tabindexDescendant');
});

test(`${RULE_ID}: content that is not interactive in a link or button passes`, () => {
  for (const body of [
    '<a href="/x"><img src="a.png" alt="x"></a>',
    '<a href="/x"><audio src="a.mp3"></audio></a>',
    '<a href="/x"><input type="hidden" name="a" value="b"></a>',
    '<button>B <input type="hidden" name="a" value="b"></button>',
    '<a href="/x"><svg><a href="/y"><text>t</text></a></svg></a>',
    '<a href="/x"><span contenteditable="true">e</span></a>'
  ]) {
    assertRule(run(page(body)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: an img with ismap needs an a[href] ancestor`, () => {
  expectFailEverywhere('<img src="a.png" alt="x" ismap>', 'ismapOutsideLink');
  expectFail('<a><img src="a.png" alt="x" ismap></a>', 'ismapOutsideLink');
  assertRule(
    run(page('<a href="/x"><span><img src="a.png" alt="x" ismap></span></a>')),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: only one main may lack the hidden attribute`, () => {
  for (const second of [
    '<main style="display:none">b</main>',
    '<main aria-hidden="true">b</main>',
    '<div hidden><main>b</main></div>'
  ]) {
    const rule = expectFail('<main id="m1">a</main>' + second, 'extraMain');
    assert.doesNotMatch(rule.occurrences[0].html, /id="m1"/);
  }
  for (const body of [
    '<main>a</main><main hidden>b</main>',
    '<main hidden>a</main><main hidden>b</main>',
    '<main>a</main><main hidden="until-found">b</main>'
  ]) {
    assertRule(run(page(body)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: valid lists and description lists pass`, () => {
  for (const body of [
    '<ul><li>a</li></ul>',
    '<ul> <li>a</li> <!-- c --> </ul>',
    '<ul><li>a</li><script></script><template><p>x</p></template></ul>',
    '<ul role="listbox" aria-label="x"><li role="option" aria-selected="false">a</li></ul>',
    '<dl></dl>',
    '<dl><dt>a</dt><dt>a2</dt><dd>b</dd><dd>b2</dd></dl>',
    '<dl><script></script><template></template><dt>a</dt><dd>b</dd></dl>',
    '<dl><div><dt>a</dt><dd>b</dd></div><div><dt>c</dt><dd>d</dd></div></dl>',
    '<dl><div role="presentation"><script></script><dt>a</dt><dd>b</dd></div></dl>'
  ]) {
    assertRule(run(page(body)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
});

// Nesting that uses only ARIA roles is a validator warning, not an error.
test(`${RULE_ID}: a link inside role=button passes`, () => {
  assertRule(
    run(page('<div role="button" tabindex="0"><a href="/y">y</a></div>')),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: a page with none of the checked elements is not applicable`, () => {
  assertRule(run(page('<p>Text</p><div role="list"></div>')), RULE_ID, 'notApplicable', {
    maxOccurrences: 0
  });
});

// 8.2.1 judges the source "selon le type de document spécifié".
test(`${RULE_ID}: a page declaring another doctype is asked about once`, () => {
  const rule = assertRule(
    run(page('<a href="/x"><button>b</button></a><ul><li>a</li></ul>', HTML401)),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.deepEqual(reasons(rule), ['otherDoctype']);
  assert.equal(rule.occurrences[0].uncertainty.code, 'out-of-scope');
  assert.equal(
    rule.occurrences[0].i18n.summaryKey,
    'htmlNestingValid_summary_cantTell_otherDoctype'
  );
  // No doctype: checked as HTML5, as the validator does.
  assertRule(run(page('<a href="/x"><button>b</button></a>', '')), RULE_ID, 'fail');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    run(page('<div role="list"><li>a</li></div>'), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'Cette balise <li> se trouve dans une balise <div>, et non dans une balise <ul>, <ol> ou <menu>.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(page('<div role="list"><li>a</li></div>'), { engineOptions });
    assert.ok(!check(result, RULE_ID), JSON.stringify(engineOptions));
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 8.2 rollup id run it`, () => {
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-8.2' } } }
  ]) {
    const rule = check(runa11yCoreOnHtml(page('<div role="list"><li>a</li></div>'), opts), RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// Under the RGAA profile, 8.2 takes this rule's verdict, while the WCAG
// rollups in the same run keep the WCAG rules' verdicts. Another rule may
// still ask about 8.2, so a page this rule passes is checked for "not
// failed" rather than "passed".
test(`${RULE_ID}: RGAA 8.2 fails a role=listitem child of ul that WCAG 1.3.1 accepts`, () => {
  const result = runa11yCoreOnHtml(page('<ul><li>a</li><div role="listitem">b</div></ul>'), RGAA);
  assert.equal(check(result, 'list-children-valid').outcome, 'pass');
  assert.equal(rollup(result, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
  assert.equal(rollup(result, 'rgaa-4.1.2-8.2').outcome, 'fail');
  assert.ok(rollup(result, 'rgaa-4.1.2-8.2').data.details.checksIds.includes(RULE_ID));
  assert.ok(
    !rollup(result, 'rgaa-4.1.2-8.2').data.details.checksIds.includes('list-children-valid')
  );
});

test(`${RULE_ID}: RGAA 8.2 fails a disabled button in a link that WCAG 4.1.2 accepts`, () => {
  const result = runa11yCoreOnHtml(page('<a href="/x">L <button disabled>b</button></a>'), RGAA);
  assert.equal(check(result, 'nested-interactive-controls-absent').outcome, 'pass');
  assert.equal(rollup(result, 'rgaa-4.1.2-8.2').outcome, 'fail');
});

test(`${RULE_ID}: WCAG 4.1.2 fails ARIA-only nesting that RGAA 8.2 does not fail`, () => {
  const result = runa11yCoreOnHtml(
    page('<div role="button" tabindex="0"><a href="/y">y</a></div>'),
    RGAA
  );
  assert.equal(check(result, 'nested-interactive-controls-absent').outcome, 'fail');
  assert.equal(rollup(result, 'wcag-4.1.2-aria-validity').outcome, 'fail');
  assert.equal(check(result, RULE_ID).outcome, 'pass');
  assert.notEqual(rollup(result, 'rgaa-4.1.2-8.2').outcome, 'fail');
});

test(`${RULE_ID}: RGAA 8.2 and WCAG 1.3.1 agree on a misordered dl and on a valid list`, () => {
  const bad = runa11yCoreOnHtml(page('<dl><dd>b</dd><dt>a</dt></dl>'), RGAA);
  assert.equal(check(bad, 'definition-list-children-valid').outcome, 'fail');
  assert.equal(rollup(bad, 'wcag-1.3.1-info-and-relationships').outcome, 'fail');
  assert.equal(rollup(bad, 'rgaa-4.1.2-8.2').outcome, 'fail');

  const good = runa11yCoreOnHtml(page('<ul><li>a</li></ul>'), RGAA);
  assert.equal(check(good, 'list-children-valid').outcome, 'pass');
  assert.equal(rollup(good, 'wcag-1.3.1-info-and-relationships').outcome, 'pass');
  assert.equal(check(good, RULE_ID).outcome, 'pass');
  assert.notEqual(rollup(good, 'rgaa-4.1.2-8.2').outcome, 'fail');
});

test(`${RULE_ID}: the WCAG list and nesting rules no longer carry 8.2.1`, () => {
  const result = runa11yCoreOnHtml(
    page(
      '<ul><li>a</li><p>b</p></ul><div><li>c</li></div><dl><dd>b</dd></dl><div><dt>x</dt></div>' +
        '<div role="button" tabindex="0"><a href="/y">y</a></div>'
    ),
    RGAA
  );
  const ids = rollup(result, 'rgaa-4.1.2-8.2').data.details.checksIds;
  for (const id of [
    'list-children-valid',
    'listitem-parent-valid',
    'definition-list-children-valid',
    'dlitem-parent-valid',
    'nested-interactive-controls-absent'
  ]) {
    assert.ok(!ids.includes(id), id);
  }
  assert.ok(ids.includes(RULE_ID));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = run(fs.readFileSync(fixturePath, 'utf8'));
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 12, maxOccurrences: 12 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]).sort();
  assert.deepEqual(
    ids,
    Array.from({ length: 12 }, (_, i) => `hnv_case_${String(i + 1).padStart(2, '0')}`)
  );
});
