'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'tabindex';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no tabindex is present`, () => {
  const html = `<!doctype html><html><body><div>x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when tabindex is 0`, () => {
  const html = `<!doctype html><html><body><div tabindex="0">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when tabindex is negative`, () => {
  const html = `<!doctype html><html><body><div tabindex="-1">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: leans fail when the positive tabindex moves focus out of document order, pass when it does not`, () => {
  const leanOf = (body, id) => {
    const rule = assertRule(
      runa11yCoreOnHtml(`<!doctype html><html><body>${body}</body></html>`, { runOnly: [RULE_ID] }),
      RULE_ID,
      'cantTell'
    );
    const occ = rule.occurrences.find((o) => o.html.includes(`id="${id}"`));
    assert.equal(occ.data.details.reasonCode, 'TABINDEX_POSITIVE');
    return occ.lean;
  };
  const jumps = leanOf('<a href="/a">A</a><button id="p" tabindex="1">B</button>', 'p');
  assert.equal(jumps.toward, 'fail');
  assert.equal(jumps.i18n.whyKey, 'tabindex_lean_why_reordered');
  const inOrder = leanOf(
    '<button id="p" tabindex="1">B</button><button tabindex="2">C</button><a href="/a">A</a>',
    'p'
  );
  assert.equal(inOrder.toward, 'pass');
  assert.equal(inOrder.i18n.whyKey, 'tabindex_lean_why_inOrder');
  // First in both orders, while another positive tabindex jumps: no lean.
  assert.equal(
    leanOf(
      '<button id="p" tabindex="1">B</button><a href="/a">A</a><button tabindex="2">C</button>',
      'p'
    ),
    undefined
  );
});

test(`${RULE_ID}: cantTell when tabindex is positive`, () => {
  const html = `<!doctype html><html><body><div id="a" tabindex="3">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'TABINDEX_POSITIVE');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" tabindex="3">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'tabindex should not be greater than 0');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/tabindex-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'tabindex-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'ti_case_03'));
  assert.ok(!hasOccurrenceForId(rule, 'ti_case_01'));
  assert.ok(!hasOccurrenceForId(rule, 'ti_case_02'));
});

test(`tabindex: respects contextSelector scoping (regression -- used to bypass helpers.queryAllSmart and always scan the whole document)`, () => {
  const html = `<!doctype html><html><body><div id="target"><p>Just some unrelated text.</p></div><div id="a" tabindex="3">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['tabindex'], contextSelector: '#target' });
  assertRule(result, 'tabindex', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: gives the value and the tab stops it jumps ahead of`, () => {
  const html = `<!doctype html><html><body>
    <a id="a" href="/a">Home</a> <button id="b" tabindex="3">Buy</button>
  </body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell');
  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'This element has tabindex="3", so Tab reaches it before earlier tab stops in the page (1, starting with <a id="a"> "Home").'
  );
  assert.strictEqual(occ.i18n.summaryKey, 'tabindex_summary_cantTell_jumpsAhead');
  assert.strictEqual(occ.data.details.skippedCount, 1);
  assert.strictEqual(occ.data.details.firstSkipped, '<a id="a"> "Home"');

  const first = assertRule(
    runa11yCoreOnHtml(
      '<!doctype html><html><body><button tabindex="2">One</button><a href="/b">B</a></body></html>',
      { runOnly: [RULE_ID] }
    ),
    RULE_ID,
    'cantTell'
  ).occurrences[0];
  assert.strictEqual(
    first.summary,
    'This element has tabindex="2", overriding the natural tab order.'
  );
  assert.strictEqual(first.i18n.summaryKey, 'tabindex_summary_cantTell_value');
});

test(`${RULE_ID}: reads tabindex with HTML's rules for parsing integers (round 11, B11-5)`, () => {
  const read = (value) => {
    const r = runa11yCoreOnHtml(
      `<!doctype html><html><body><a href="/a">A</a><button tabindex="${value}">B</button></body></html>`,
      { runOnly: [RULE_ID] }
    ).checksResults.find((c) => c.ruleId === RULE_ID);
    return [r.outcome, r.occurrences.map((o) => o.data.details.value)];
  };
  // What el.tabIndex gives in a browser: 1, 2, 0, 1, and none for junk.
  assert.deepStrictEqual(read('1.5'), ['cantTell', [1]]);
  assert.deepStrictEqual(read(' +2abc'), ['cantTell', [2]]);
  assert.deepStrictEqual(read('0x1'), ['pass', []]);
  assert.deepStrictEqual(read('1e3'), ['cantTell', [1]]);
  assert.deepStrictEqual(read('abc'), ['notApplicable', []]);
  assert.deepStrictEqual(read(' 1'), ['notApplicable', []]);
});

test(`${RULE_ID}: a tabindex outside the 32-bit range is ignored (round 11, R11F-9)`, () => {
  const read = (tag, value) =>
    runa11yCoreOnHtml(
      `<!doctype html><html><body><a href="/a">A</a><${tag} tabindex="${value}">B</${tag}></body></html>`,
      { runOnly: [RULE_ID] }
    ).checksResults.find((c) => c.ruleId === RULE_ID).outcome;
  // As el.tabIndex gives it in Chromium: a div is not focusable, a button
  // keeps its default.
  assert.strictEqual(read('div', '2147483648'), 'notApplicable');
  assert.strictEqual(read('button', '99999999999'), 'notApplicable');
  assert.strictEqual(read('div', '2147483647'), 'cantTell');
});
