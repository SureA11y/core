'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'p-as-heading';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when there are no <p> elements`, () => {
  const html = `<!doctype html><html><body><div>No paragraphs.</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the paragraph is normal weight`, () => {
  const html = `<!doctype html><html><body><p>Just normal text.</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the paragraph is bold, heading-sized, and short`, () => {
  const html = `<!doctype html><html><head><style>p{font-weight:bold;font-size:22px;}</style></head><body><p>Section Title</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'BOLD_LARGE_PARAGRAPH');
});

test(`${RULE_ID}: notApplicable when the bold+large paragraph is too long`, () => {
  const longText =
    'This is a very long sentence that goes well beyond one hundred and twenty characters in total length to avoid being heading-like at all costs here.';
  const html = `<!doctype html><html><head><style>p{font-weight:bold;font-size:22px;}</style></head><body><p>${longText}</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><head><style>p{font-weight:bold;font-size:22px;}</style></head><body><p>Section Title</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Text styled to look like a heading should probably be a real heading'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/p-as-heading-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'p-as-heading-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });

  const expectedFlaggedIds = ['pah_case_01', 'pah_case_05', 'pah_case_06'];
  const expectedNoOccIds = [
    'pah_case_02',
    'pah_case_03',
    'pah_case_04',
    'pah_case_07',
    'pah_case_08',
    'pah_case_09',
    'pah_case_10'
  ];

  for (const id of expectedFlaggedIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: bold can come from any inner element, as long as all the text is bold`, () => {
  const page = (body) => `<!doctype html><html><body>${body}</body></html>`;
  for (const body of [
    '<p id="a" style="font-size:22px"><span style="font-weight:bold">Our team</span></p>',
    '<p id="a" style="font-size:22px"><b>Our</b> <strong>team</strong></p>',
    '<p id="a" style="font-size:22px;font-weight:700">Our <em>team</em></p>'
  ]) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }),
      RULE_ID,
      'cantTell',
      {
        minOccurrences: 1,
        maxOccurrences: 1
      }
    );
    assert.ok(hasOccurrenceForId(rule, 'a'), body);
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'BOLD_LARGE_PARAGRAPH');
  }
  for (const body of [
    '<p style="font-size:22px;font-weight:bold">Our <span style="font-weight:normal">team</span></p>',
    '<p style="font-size:22px"><span style="font-weight:bold">Our</span> team</p>',
    '<p style="font-weight:bold">Our <span style="font-size:22px">team</span></p>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: a <div> holding only text and inline markup is asked about`, () => {
  const page = (body) =>
    `<!doctype html><html><head><style>.h{font-weight:bold;font-size:22px}</style></head><body>${body}</body></html>`;
  for (const body of [
    '<div id="a" class="h">Opening hours</div>',
    '<div class="h"><div id="a">Opening hours</div></div>',
    '<div id="a" style="font-size:22px"><strong>Opening</strong> <b>hours</b></div>'
  ]) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }),
      RULE_ID,
      'cantTell',
      {
        minOccurrences: 1,
        maxOccurrences: 1
      }
    );
    assert.ok(hasOccurrenceForId(rule, 'a'), body);
    assert.equal(rule.occurrences[0].data.details.reasonCode, 'BOLD_LARGE_DIV');
    assert.equal(
      rule.occurrences[0].summary,
      'This block of text is entirely bold and rendered at a heading-like size.'
    );
  }
});

test(`${RULE_ID}: a paragraph inside a bold <div> is asked about once, as a paragraph`, () => {
  const html = `<!doctype html><html><body><div style="font-weight:bold;font-size:22px"><p id="a">Opening hours</p></div></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'BOLD_LARGE_PARAGRAPH');
});

test(`${RULE_ID}: text that already has a role of its own, or a <div> that holds more than text, is left out`, () => {
  const page = (body) =>
    `<!doctype html><html><head><style>.h{font-weight:bold;font-size:22px}</style></head><body>${body}</body></html>`;
  for (const body of [
    '<div class="h" role="button" tabindex="0">Menu</div>',
    '<div class="h" role="heading" aria-level="2">Menu</div>',
    '<button><div class="h">Send</div></button>',
    '<h2><div class="h">Title</div></h2>',
    '<label><div class="h">Name</div><input></label>',
    '<table><tr><th><div class="h">Price</div></th></tr></table>',
    '<details><summary><div class="h">More</div></summary></details>',
    '<div class="h"><img src="a.png" alt="">Logo</div>',
    '<div class="h"><ul><li>One</li></ul></div>',
    '<div class="h"><input aria-label="q"> Search</div>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: roles are resolved from the fallback list, in any case`, () => {
  const page = (body) =>
    `<!doctype html><html><head><style>.h{font-weight:bold;font-size:22px}</style></head><body>${body}</body></html>`;
  // A real role, first in the list or in upper case, gives the text a role.
  for (const body of [
    '<div class="h" role="foo heading" aria-level="2">Menu</div>',
    '<div class="h" role="BUTTON" tabindex="0">Menu</div>',
    '<span role="foo heading" aria-level="2"><p class="h">Menu</p></span>',
    '<span role="ROWHEADER"><p class="h">Menu</p></span>'
  ]) {
    assertRule(runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
      maxOccurrences: 0
    });
  }
  // A role attribute naming no real role, or a heading token after a real
  // role, leaves the text without a role of its own.
  for (const body of [
    '<div class="h" role="foo" id="a">Menu</div>',
    '<span role="note heading"><p class="h" id="a">Menu</p></span>'
  ]) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.ok(hasOccurrenceForId(rule, 'a'), body);
  }
});
