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

const RULE_ID = 'form-control-label-quality';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

function page(body) {
  return `<!doctype html><html lang="en"><body>${body}</body></html>`;
}

test(`${RULE_ID}: notApplicable when the page has no form field`, () => {
  const result = runa11yCoreOnHtml(page('<p>No fields here.</p>'), { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for a label naming its field`, () => {
  for (const body of [
    '<label>First name: <input type="text"></label>',
    '<label for="f">First name:</label><input id="f" type="text">',
    '<p id="l">First name:</p><input aria-labelledby="l" type="text">'
  ]) {
    const result = runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a field named only by aria-label has no visible label to judge`, () => {
  const result = runa11yCoreOnHtml(page('<input type="text" aria-label="Postcode">'), {
    runOnly: [RULE_ID]
  });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// ---------------------------------------------------------------------------
// Placeholder label text.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: cantTell for a placeholder label`, () => {
  const result = runa11yCoreOnHtml(page('<label>Label <input id="a" type="text"></label>'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'PLACEHOLDER_LABEL_TEXT');
});

test(`${RULE_ID}: a placeholder word inside a longer label is not flagged`, () => {
  const result = runa11yCoreOnHtml(
    page('<label>Text message number <input id="a" type="text"></label>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// ---------------------------------------------------------------------------
// Repeated labels, judged against the visible context.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: cantTell when two fields share a label with no visible context`, () => {
  const result = runa11yCoreOnHtml(
    page(
      '<label>Search <input id="a" type="text"></label><label>Search <input id="b" type="text"></label>'
    ),
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'DUPLICATE_LABEL_TEXT');
  assert.strictEqual(rule.occurrences[0].data.details.sharedWith, 1);
});

test(`${RULE_ID}: visible headings between repeated labels clear them`, () => {
  const result = runa11yCoreOnHtml(
    page(
      '<h2>Shipping</h2><label>Name <input id="a"></label><h2>Billing</h2><label>Name <input id="b"></label>'
    ),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: visible fieldset legends between repeated labels clear them`, () => {
  const result = runa11yCoreOnHtml(
    page(
      '<fieldset><legend>Home</legend><label>Street <input id="a"></label></fieldset>' +
        '<fieldset><legend>Work</legend><label>Street <input id="b"></label></fieldset>'
    ),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an off-screen heading is not visible context, so the duplicate stands`, () => {
  // ACT cc0f0a failed example 4: the headings that would tell the fields apart
  // are positioned off screen, so a sighted user sees two identical labels.
  const off = 'style="position:absolute;top:-9999px;left:-9999px"';
  const result = runa11yCoreOnHtml(
    page(
      `<fieldset><h2 ${off}>Shipping</h2><label>Name: <input id="a"></label></fieldset>` +
        `<fieldset><h2 ${off}>Billing</h2><label>Name: <input id="b"></label></fieldset>`
    ),
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: a table row's own text differentiates a field repeated per row`, () => {
  const result = runa11yCoreOnHtml(
    page(
      '<table>' +
        '<tr><td>Widget</td><td><label>Quantity <input id="a"></label></td></tr>' +
        '<tr><td>Gadget</td><td><label>Quantity <input id="b"></label></td></tr>' +
        '</table>'
    ),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// ---------------------------------------------------------------------------
// A label split between visible and hidden parts.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: cantTell when part of the label is hidden from sight`, () => {
  // ACT cc0f0a failed example 5: a screen reader announces "Go Search", a
  // sighted user reads "Go".
  const result = runa11yCoreOnHtml(
    page(
      '<span id="s" style="display:none">Search</span>' +
        '<input id="a" type="text" aria-labelledby="b s">' +
        '<button id="b" type="button">Go</button>'
    ),
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'PARTIALLY_HIDDEN_LABEL');
  assert.strictEqual(rule.occurrences[0].data.details.hiddenLabelParts, 1);
});

test(`${RULE_ID}: an entirely hidden label leaves nothing visible to judge`, () => {
  const result = runa11yCoreOnHtml(
    page('<span id="s" style="display:none">Search</span><input id="a" aria-labelledby="s">'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a hidden field is skipped`, () => {
  const result = runa11yCoreOnHtml(
    page('<label style="display:none">Label <input id="a" type="text"></label>'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: ARIA widget roles are in scope alongside native controls`, () => {
  const result = runa11yCoreOnHtml(
    page('<p id="l">Label</p><div id="a" role="textbox" aria-labelledby="l"></div>'),
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: manual rule never reports fail`, () => {
  const result = runa11yCoreOnHtml(page('<label>Label <input id="a"></label>'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.notStrictEqual(rule.outcome, 'fail');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const result = runa11yCoreOnHtml(page('<label>Label <input id="a"></label>'), {
    runOnly: [RULE_ID]
  });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Form field labels should be descriptive and distinguishable');
});

// ---------------------------------------------------------------------------
// Nearest-preceding-visible-heading context: a two-pointer document-order
// sweep replaces a per-field backward scan (perf fix). These pin the two
// ways that sweep can go wrong if it isn't kept document-order-correct.
// ---------------------------------------------------------------------------

test(`${RULE_ID}: dense headings still resolve each field's own nearest preceding heading`, () => {
  // Regression for the two-pointer sweep: with several headings and fields
  // interleaved, each field must resolve to the heading immediately above
  // it, not whichever heading happened to be "current" when some other
  // field was processed.
  const result = runa11yCoreOnHtml(
    page(
      '<h2>Alpha</h2><label>Name <input id="a1"></label>' +
        '<h2>Beta</h2><label>Name <input id="a2"></label>' +
        '<h2>Gamma</h2><label>Name <input id="a3"></label>'
    ),
    { runOnly: [RULE_ID] }
  );
  // Every "Name" field sits under a distinct visible heading, so none of
  // them share a context key -- no duplicates.
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a field inside a shadow root gets no light-DOM heading context`, () => {
  // Regression for the two-pointer sweep's shadow-root guard: without it, a
  // shadow-root field could inherit whatever heading text was "current"
  // after the light-DOM fields ahead of it in queryAllSmart's result order,
  // even though it has no real document-order relationship to any of them.
  // Here that would wrongly make it look like a duplicate of the light-DOM
  // "Search" field under "Group B".
  const dom = createDom(
    page('<h2>Group B</h2><label>Search <input id="light1"></label><div id="host"></div>')
  );
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = '<label>Search <input id="shadow1"></label>';

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a reversed multi-region contextSelector still resolves each field's true heading`, () => {
  // Regression for the two-pointer sweep needing its own sorted view:
  // queryAllSmart concatenates region matches in the CALLER's contextSelector
  // order, not document order, so listing the later region first must not
  // make an earlier field inherit a later heading's text.
  const html = page(
    '<h2>H1</h2><div id="regionA"><label>Search <input id="fA"></label></div>' +
      '<h2>H2</h2><div id="regionB"><label>Search <input id="fB"></label></div>'
  );
  const result = runa11yCoreOnHtml(html, {
    contextSelector: ['#regionB', '#regionA'],
    runOnly: [RULE_ID]
  });
  // fA is under H1, fB is under H2 -- correctly distinct contexts, so the
  // shared "Search" label is not a duplicate.
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/form-control-label-quality-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'form-control-label-quality-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 7, maxOccurrences: 7 });

  const expectedIds = [
    'fclq_case_07',
    'fclq_case_08',
    'fclq_case_09',
    'fclq_case_09b',
    'fclq_case_10',
    'fclq_case_10b',
    'fclq_case_11'
  ];
  const expectedNoOccIds = [
    'fclq_case_01',
    'fclq_case_02',
    'fclq_case_03',
    'fclq_case_04',
    'fclq_case_05',
    'fclq_case_06'
  ];

  for (const id of expectedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
