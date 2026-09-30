'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-role-conformance';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

function page(body) {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><main>${body}</main></body></html>`;
}

const run = (body) => runa11yCoreOnHtml(page(body), RUN);
const reasons = (rule) => rule.occurrences.map((o) => o.data.details.reasonCode);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);

// Each case was run through the W3C validator 26.9.27, the reference named by
// RGAA 8.2.1 step 1: every "fail" case is an error there, every "pass" case
// is not.
const VALIDATOR_CASES = [
  ['<button role="bogus">a</button>', 'fail', 'Bad value “bogus” for attribute “role”'],
  [
    '<div role="bogus button" tabindex="0">a</div>',
    'fail',
    'Discarding unrecognized token “bogus”'
  ],
  [
    '<div role="button bogus" tabindex="0">a</div>',
    'fail',
    'Discarding unrecognized token “bogus”'
  ],
  ['<div role="BUTTON" tabindex="0">a</div>', 'fail', 'Bad value “BUTTON”'],
  ['<div role="widget">a</div>', 'fail', 'Bad value “widget”'],
  ['<div role="generic">a</div>', 'fail', 'Bad value “generic”'],
  ['<div role="">a</div>', 'fail', 'Bad value “”'],
  ['<div role="  ">a</div>', 'fail', 'Bad value “”'],
  ['<nav role="tab">a</nav>', 'fail', 'Bad value “tab” for attribute “role” on element “nav”'],
  [
    '<article role="navigation">a</article>',
    'fail',
    'Bad value “navigation” … on element “article”'
  ],
  ['<h2 role="button">a</h2>', 'fail', 'Bad value “button” … on element “h2”'],
  [
    '<textarea role="combobox" aria-expanded="false"></textarea>',
    'fail',
    'Bad value “combobox” … “textarea”'
  ],
  [
    '<table><tr><td role="button">x</td></tr></table>',
    'fail',
    'The “role” attribute must not be used on a “td” element…'
  ],
  [
    '<ul><li role="button">x</li></ul>',
    'fail',
    'An “li” element … must not have any “role” value other than “listitem”'
  ],
  [
    '<details><summary role="button">a</summary>b</details>',
    'fail',
    'The “role” attribute must not be used on any “summary” element…'
  ],
  [
    '<table><caption role="heading" aria-level="2">c</caption><tr><td>1</td></tr></table>',
    'fail',
    'Attribute “role” not allowed on element “caption”'
  ],
  ['<input type="hidden" role="none">', 'fail', 'Bad value “hidden” for attribute “type”'],
  [
    '<select role="listbox"><option>a</option></select>',
    'fail',
    'The “listbox” role is not allowed for element “select” without …'
  ],
  [
    '<img src="a.png" alt="" role="button">',
    'fail',
    'An “img” element with a “role” attribute must not have an “alt” attribute whose value is the empty string'
  ],
  [
    '<img src="a.png" role="button">',
    'fail',
    'An “img” element with a “role” attribute must also have an accessible name'
  ],
  [
    '<img src="a.png" role="button" title="Play">',
    'fail',
    'An “img” element with a “role” attribute must also have an accessible name'
  ],
  ['<svg><g role="bogus"></g></svg>', 'fail', 'Bad value “bogus” … on element “g”'],
  ['<div role="button" tabindex="0">a</div>', 'pass', ''],
  ['<div role=" button ">a</div>', 'pass', ''],
  ['<div role="none presentation">a</div>', 'pass', ''],
  ['<div role="directory">a</div>', 'pass', 'warning only'],
  ['<div role="tablist"><h2 role="tab" aria-selected="false">a</h2></div>', 'pass', ''],
  ['<ul role="tablist"><li role="tab" aria-selected="false">a</li></ul>', 'pass', ''],
  ['<table role="presentation"><tr><td role="button">x</td></tr></table>', 'pass', ''],
  ['<select size="4" role="listbox"><option>a</option></select>', 'pass', ''],
  ['<img src="a.png" alt="Play" role="button">', 'pass', ''],
  ['<img src="a.png" alt=" " role="button">', 'pass', ''],
  ['<img src="a.png" role="button" aria-label="Play">', 'pass', ''],
  ['<a href="/" role="button">a</a>', 'pass', '']
];

test(`${RULE_ID}: agrees with the W3C validator 26.9.27`, () => {
  for (const [body, expected] of VALIDATOR_CASES) {
    const rule = check(run(body), RULE_ID);
    assert.equal(rule.outcome, expected, body);
  }
});

test(`${RULE_ID}: an unknown token fails, alone or in a list`, () => {
  const rule = assertRule(
    run('<div id="t" role="bogus button" tabindex="0">a</div>'),
    RULE_ID,
    'fail',
    {
      minOccurrences: 1,
      maxOccurrences: 1
    }
  );
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.reasonCode, 'unknownRoleToken');
  assert.deepEqual(occ.i18n.params, { element: 'div', value: 'bogus button', token: 'bogus' });
  assert.equal(occ.i18n.summaryKey, 'ariaRoleConformance_summary_fail_unknownRoleToken');
  assert.equal(
    occ.summary,
    'role="bogus button" on this <div> contains "bogus", which is not a role the W3C validator accepts.'
  );
});

test(`${RULE_ID}: an empty role attribute fails`, () => {
  assert.deepEqual(reasons(assertRule(run('<div role="">a</div>'), RULE_ID, 'fail')), [
    'emptyRole'
  ]);
});

test(`${RULE_ID}: a role the element does not allow fails, judged on the first recognised token`, () => {
  const rule = assertRule(run('<h2 role="button tab">a</h2>'), RULE_ID, 'fail', {
    maxOccurrences: 1
  });
  assert.deepEqual(rule.occurrences[0].i18n.params, { element: 'h2', role: 'button' });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'roleNotAllowed');
  // The first recognised token is allowed; the second is only a fallback.
  assertRule(
    run('<div role="tablist"><h2 role="tab button" aria-selected="false">a</h2></div>'),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: an img with a role needs a non-empty alt or an ARIA name`, () => {
  assert.deepEqual(
    reasons(assertRule(run('<img src="a.png" alt="" role="img">'), RULE_ID, 'fail')),
    ['imgRoleEmptyAlt']
  );
  assert.deepEqual(reasons(assertRule(run('<img src="a.png" role="none">'), RULE_ID, 'fail')), [
    'imgRoleNoName'
  ]);
});

// RGAA 1.2.1 names role="presentation" on an <img> for decorative images; the
// validator reports an error, so the rule asks.
test(`${RULE_ID}: an img with role="presentation" and an empty or missing alt is asked about`, () => {
  for (const body of [
    '<img src="a.png" alt="" role="presentation">',
    '<img src="a.png" role="presentation">'
  ]) {
    const rule = assertRule(run(body), RULE_ID, 'cantTell', {
      minOccurrences: 1,
      maxOccurrences: 1
    });
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'imgPresentationRole');
    assert.equal(occ.uncertainty.code, 'judgement-required');
  }
});

test(`${RULE_ID}: a fail and a question on one page make the rule fail and keep the question`, () => {
  const rule = assertRule(
    run('<img src="a.png" alt="" role="presentation"><nav role="tab">a</nav>'),
    RULE_ID,
    'fail'
  );
  assert.deepEqual(reasons(rule).sort(), ['imgPresentationRole', 'roleNotAllowed']);
});

// RGAA 8.2.1 judges the generated source, hidden markup included.
test(`${RULE_ID}: hidden content is checked, while aria-roles-valid skips it`, () => {
  for (const body of [
    '<div hidden><div role="bogus">a</div></div>',
    '<div style="display:none"><div role="bogus">a</div></div>'
  ]) {
    const result = runa11yCoreOnHtml(page(body), {
      runOnly: { includeRuleIds: [RULE_ID, 'aria-roles-valid'] }
    });
    assert.equal(check(result, RULE_ID).outcome, 'fail', body);
    assert.equal(check(result, 'aria-roles-valid').outcome, 'notApplicable', body);
  }
});

test(`${RULE_ID}: custom elements and pages without a role attribute are not applicable`, () => {
  for (const body of ['<my-widget role="bogus">a</my-widget>', '<p>No role</p>']) {
    assertRule(run(body), RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    runa11yCoreOnHtml(page('<nav role="tab">a</nav>'), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'role="tab" n’est pas autorisé sur cette balise <nav>.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<div role="bogus button" tabindex="0">a</div>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(!check(result, RULE_ID), JSON.stringify(engineOptions));
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 8.2 rollup id run it`, () => {
  const html = page('<div role="bogus">a</div>');
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-8.2' } } }
  ]) {
    const rule = check(runa11yCoreOnHtml(html, opts), RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// Under the RGAA profile, 8.2 takes this rule's verdict, while WCAG 4.1.2 in
// the same run keeps aria-roles-valid's.
test(`${RULE_ID}: RGAA 8.2 fails a role list with an unknown token that WCAG 4.1.2 passes`, () => {
  const result = runa11yCoreOnHtml(page('<div role="bogus button" tabindex="0">Open</div>'), RGAA);
  assert.equal(check(result, 'aria-roles-valid').outcome, 'pass');
  assert.equal(rollup(result, 'rgaa-4.1.2-8.2').outcome, 'fail');
  assert.equal(rollup(result, 'wcag-4.1.2-aria-validity').outcome, 'pass');
  assert.ok(!rollup(result, 'rgaa-4.1.2-8.2').data.details.checksIds.includes('aria-roles-valid'));
});

test(`${RULE_ID}: RGAA 8.2 fails an unknown role on a native element that WCAG 4.1.2 only asks about`, () => {
  const result = runa11yCoreOnHtml(page('<button role="bogus">Save</button>'), RGAA);
  assert.equal(check(result, 'aria-roles-valid').outcome, 'cantTell');
  assert.equal(rollup(result, 'rgaa-4.1.2-8.2').outcome, 'fail');
  assert.equal(rollup(result, 'wcag-4.1.2-aria-validity').outcome, 'cantTell');
});

test(`${RULE_ID}: RGAA 8.2 and WCAG 4.1.2 agree on an unknown role and on a valid one`, () => {
  const bad = runa11yCoreOnHtml(page('<div role="bogus">a</div>'), RGAA);
  assert.equal(rollup(bad, 'rgaa-4.1.2-8.2').outcome, 'fail');
  assert.equal(rollup(bad, 'wcag-4.1.2-aria-validity').outcome, 'fail');
  // A valid role passes both rules; 8.2 still asks for the validator report
  // (markup-validation-review), so it is at best cantTell.
  const good = runa11yCoreOnHtml(page('<div role="button" tabindex="0">Open</div>'), RGAA);
  assert.equal(check(good, RULE_ID).outcome, 'pass');
  assert.equal(rollup(good, 'wcag-4.1.2-aria-validity').outcome, 'pass');
  assert.equal(rollup(good, 'rgaa-4.1.2-8.2').outcome, 'cantTell');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), RUN);
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 15, maxOccurrences: 15 });
  const ids = rule.occurrences.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]).sort();
  const expected = [];
  for (let i = 1; i <= 15; i++) expected.push(`arc_case_${String(i).padStart(2, '0')}`);
  assert.deepEqual(ids, expected);
  const asked = rule.occurrences.filter((o) => o.data.details.reasonCode === 'imgPresentationRole');
  assert.deepEqual(
    asked.map((o) => (o.html.match(/id="([^"]+)"/) || [])[1]),
    ['arc_case_13']
  );
});
