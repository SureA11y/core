'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'css-focus-indicator-suppressed';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

function page(css, body) {
  return `<!doctype html><html><head><style>${css}</style></head><body>${body}</body></html>`;
}

test(`${RULE_ID}: notApplicable when the page has no focus rule at all`, () => {
  const result = runa11yCoreOnHtml(page('a { color: red }', '<a href="/x" id="a">x</a>'), {
    runOnly: [RULE_ID]
  });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell for a global outline reset with no replacement`, () => {
  const result = runa11yCoreOnHtml(page('*:focus{outline:none}', '<a href="/x" id="a">x</a>'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'FOCUS_INDICATOR_SUPPRESSED');
  assert.deepStrictEqual(rule.occurrences[0].data.details.suppressingSelectors, ['*:focus']);
});

test(`${RULE_ID}: outline suppression is recognized in each of its written forms`, () => {
  for (const decl of [
    'outline:none',
    'outline:0',
    'outline:0px',
    'outline-style:none',
    'outline-width:0',
    'outline-color:transparent'
  ]) {
    const result = runa11yCoreOnHtml(page(`a:focus{${decl}}`, '<a href="/x" id="a">x</a>'), {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: :focus-visible counts as a focus rule`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus-visible{outline:none}', '<a href="/x" id="a">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: suppression nested in a grouping rule is found`, () => {
  const result = runa11yCoreOnHtml(
    page('@media screen{a:focus{outline:none}}', '<a href="/x" id="a">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

// ---------------------------------------------------------------------------
// A replacement indicator clears the element, wherever it is drawn.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: a replacement in the same rule clears the element`, () => {
  for (const decl of [
    'box-shadow:0 0 0 3px navy',
    'border:2px solid navy',
    'background-color:navy',
    'text-decoration:underline'
  ]) {
    const result = runa11yCoreOnHtml(page(`a:focus{outline:none;${decl}}`, '<a href="/x">x</a>'), {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a later rule restoring a positive outline clears the element`, () => {
  const result = runa11yCoreOnHtml(
    page('*:focus{outline:none} a:focus{outline:2px solid navy}', '<a href="/x">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a replacement drawn on a pseudo-element clears the element`, () => {
  const result = runa11yCoreOnHtml(
    page(
      'a:focus{outline:none} a:focus::before{content:"x";background:navy}',
      '<a href="/x">x</a>'
    ),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a replacement painted on a sibling clears the element`, () => {
  const result = runa11yCoreOnHtml(
    page(
      'a:focus{outline:none} a:focus + .ind{background:navy}',
      '<a href="/x">x</a><span class="ind"></span>'
    ),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: outline-offset alone is not a replacement`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus{outline:none;outline-offset:4px}', '<a href="/x" id="a">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: compensation is resolved per element, not per page`, () => {
  // The reset hits everything; only the button gets an indicator back.
  const result = runa11yCoreOnHtml(
    page(
      '*:focus{outline:none} .btn:focus{box-shadow:0 0 0 3px navy}',
      '<a href="/x" id="link">x</a><button class="btn" id="btn">b</button>'
    ),
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'link'));
  assert.ok(!hasOccurrenceForId(rule, 'btn'));
});

// ---------------------------------------------------------------------------
// Scope boundaries.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: a rule scoped to one selector does not reach other elements`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus{outline:none}', '<a href="/x" id="link">x</a><button id="btn">b</button>'),
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'link'));
  assert.ok(!hasOccurrenceForId(rule, 'btn'));
});

test(`${RULE_ID}: a rule firing on an ancestor's focus is not the element's own suppression`, () => {
  const result = runa11yCoreOnHtml(
    page(
      '.card:focus .link{outline:none}',
      '<div class="card" tabindex="0"><a class="link" id="a" href="/x">x</a></div>'
    ),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: :focus-within is not treated as a focus rule for the element itself`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus-within{outline:none}', '<a href="/x" id="a">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an element outside sequential focus navigation is skipped`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus{outline:none}', '<a href="/x" id="a" tabindex="-1">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a non-rendered element is skipped`, () => {
  const result = runa11yCoreOnHtml(
    page('a:focus{outline:none}', '<a href="/x" id="a" style="display:none">x</a>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: catches ACT oj04fd's failed example once its stylesheet is available`, () => {
  // ACT ships that example's CSS in a linked stylesheet, which the offline
  // example runner does not fetch; inlined here, the rule reports it.
  const css = '.no-focus-default:focus { outline: none; }';
  const body =
    '<a class="no-focus-default" id="a" href="https://act-rules.github.io/">ACT rules</a>';
  const result = runa11yCoreOnHtml(page(css, body), { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: manual rule never reports fail`, () => {
  const result = runa11yCoreOnHtml(page('*:focus{outline:none}', '<a href="/x" id="a">x</a>'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.notStrictEqual(rule.outcome, 'fail');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const result = runa11yCoreOnHtml(page('*:focus{outline:none}', '<a href="/x" id="a">x</a>'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Focus indicator must not be removed without a replacement');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/css-focus-indicator-suppressed-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'css-focus-indicator-suppressed-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 5, maxOccurrences: 5 });

  const expectedIds = [
    'cfis_case_01',
    'cfis_case_02',
    'cfis_case_03',
    'cfis_case_04',
    'cfis_case_05'
  ];
  const expectedNoOccIds = [
    'cfis_case_06',
    'cfis_case_07',
    'cfis_case_08',
    'cfis_case_09',
    'cfis_case_10',
    'cfis_case_11',
    'cfis_case_12'
  ];

  for (const id of expectedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
