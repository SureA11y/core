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

  // The fixture's own title of case 02 is a bold <div> over a passage of
  // plain text, which BOLD_SHORT_DIV rightly asks about.
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 16, maxOccurrences: 16 });
  assert.ok(
    rule.occurrences.some(
      (o) =>
        o.data.details.reasonCode === 'BOLD_SHORT_DIV' &&
        o.html.includes('02 — NEUTRAL: normal weight, normal size')
    ),
    "case 02's own title"
  );

  const expectedFlaggedIds = [
    'pah_case_01',
    'pah_case_05',
    'pah_case_06',
    'pah_case_11',
    'pah_case_12',
    'pah_case_14',
    'pah_case_15',
    'pah_case_16',
    'pah_case_17',
    'pah_case_19',
    'pah_case_20',
    'pah_case_21',
    'pah_case_22',
    'pah_case_27',
    'pah_case_29'
  ];
  const expectedNoOccIds = [
    'pah_case_02',
    'pah_case_03',
    'pah_case_04',
    'pah_case_07',
    'pah_case_08',
    'pah_case_09',
    'pah_case_10',
    'pah_case_13',
    'pah_case_18',
    'pah_case_23',
    'pah_case_24',
    'pah_case_25',
    'pah_case_26',
    'pah_case_28',
    'pah_case_30'
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

const BOLD = `<style>.h{font-weight:bold;font-size:22px}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}</style>`;

function flags(body) {
  const html = `<!doctype html><html><head>${BOLD}</head><body>${body}</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  return (rule && rule.occurrences ? rule.occurrences : []).length;
}

test(`${RULE_ID}: text that is only a number is asked about`, () => {
  for (const text of ['2025', 'N° 12', '§ 3.2', '42000', 'No. 7', '#3']) {
    assert.equal(flags(`<p class="h">${text}</p>`), 1, text);
  }
});

test(`${RULE_ID}: screen-reader-only text is not what is judged`, () => {
  assert.equal(flags(`<div class="h"><a href="/in"><span class="sr">LinkedIn</span></a></div>`), 0);
  assert.equal(flags(`<p class="h"><span class="sr">Follow us</span></p>`), 0);
  assert.equal(
    flags(`<p class="h"><span style="position:absolute;clip:rect(0 0 0 0)">Hidden</span></p>`),
    0
  );
  assert.equal(
    flags(`<p class="h"><span style="position:absolute;left:-10000px">Hidden</span></p>`),
    0
  );
  assert.equal(flags(`<div class="sr"><p class="h">Hidden</p></div>`), 0);
  assert.equal(
    flags(`<p class="h"><span class="sr" style="font-weight:normal">Date:</span> Our services</p>`),
    1
  );
});

test(`${RULE_ID}: opacity does not hide text, on the candidate or on its pieces`, () => {
  assert.equal(flags(`<p class="h" style="opacity:0">Our story</p>`), 1);
  assert.equal(flags(`<div style="opacity:0"><p class="h">Our story</p></div>`), 1);
  assert.equal(flags(`<p class="h"><span style="opacity:0">Our story</span></p>`), 1);
  assert.equal(
    flags(`<p class="h">Our story<span style="opacity:0;font-weight:normal"> so far</span></p>`),
    0
  );
});

test(`${RULE_ID}: text that is not rendered counts in neither the weight test nor the length limit`, () => {
  const long =
    ' and the long story of how we came to hold them, told in full for anyone who opens it';
  for (const hide of ['display:none', 'visibility:hidden']) {
    assert.equal(
      flags(`<p class="h">Our values<span style="${hide};font-weight:normal">${long}</span></p>`),
      1,
      hide
    );
  }
  assert.equal(
    flags(`<p class="h">Our values<span hidden style="font-weight:normal">${long}</span></p>`),
    1
  );
  assert.equal(flags(`<p class="h"><span style="display:none">Our values</span></p>`), 0);
  assert.equal(flags(`<p class="h">${'Our values '.repeat(12)}</p>`), 0);
});

test(`${RULE_ID}: text that is all inside links is asked about`, () => {
  assert.equal(flags(`<p class="h"><a href="/news">All the news</a></p>`), 1);
  assert.equal(flags(`<div class="h"> <a href="/news"><span>All the news</span></a> </div>`), 1);
  assert.equal(flags(`<p class="h"><span role="link" tabindex="0">All the news</span></p>`), 1);
  assert.equal(flags(`<p class="h">Our <a href="/services">services</a></p>`), 1);
});

test(`${RULE_ID}: text that is all a control's own label is not asked about, text beside a control is`, () => {
  for (const control of [
    '<span role="button" tabindex="0">Zoom in</span>',
    '<a href="#" role="button">Zoom in</a>',
    '<span role="checkbox" aria-checked="false" tabindex="0">Select all</span>',
    '<span contenteditable="true">Edit me</span>',
    '<label><input type="checkbox"> Select all</label>'
  ]) {
    assert.equal(flags(`<p class="h">${control}</p>`), 0, control);
  }
  for (const inner of [
    '<span role="button" tabindex="0">in</span>',
    '<input type="checkbox" aria-label="Select">',
    '<span contenteditable="true">Edit me</span>',
    '<abbr title="Frequently asked questions" tabindex="0">FAQ</abbr>',
    '<span tabindex="0">Focus me</span>'
  ]) {
    assert.equal(flags(`<p class="h">Zoom ${inner}</p>`), 1, inner);
  }
  assert.equal(flags(`<p class="h"><span tabindex="0">Our services</span></p>`), 1);
});

// Text that is only a number, or all one link, is still asked about, with a
// reason code of its own so a report can set the kind aside as a group.
test('p-as-heading: a number-only or single-link heading-like text has its own reason code', () => {
  const big = 'style="font-weight:700;font-size:24px"';
  const html = `<!doctype html><html lang="en"><body>
    <p id="year" ${big}>2024</p>
    <p id="issue" ${big}>No. 12</p>
    <div id="card" ${big}><a href="/news/1">Budget approved</a></div>
    <p id="two" ${big}><a href="/a">One</a> <a href="/b">Two</a></p>
    <p id="plain" ${big}>Our services</p>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['p-as-heading'] });
  const rule = result.checksResults.find((r) => r.ruleId === 'p-as-heading');
  const code = (id) =>
    rule.occurrences.find((o) => o.html.includes(`id="${id}"`)).data.details.reasonCode;
  assert.equal(rule.outcome, 'cantTell');
  assert.equal(code('year'), 'HEADING_LIKE_NUMBER');
  assert.equal(code('issue'), 'BOLD_LARGE_PARAGRAPH');
  assert.equal(code('card'), 'HEADING_LIKE_LINK');
  assert.equal(code('two'), 'BOLD_LARGE_PARAGRAPH');
  assert.equal(code('plain'), 'BOLD_LARGE_PARAGRAPH');
});

test('p-as-heading: the number test is linear on long input', () => {
  const html = `<!doctype html><html lang="en"><body><p style="font-weight:700;font-size:24px">${'1'.repeat(110)}x</p></body></html>`;
  const t0 = Date.now();
  runa11yCoreOnHtml(html, { runOnly: ['p-as-heading'] });
  assert.ok(Date.now() - t0 < 2000);
});

// Leans.
test(`${RULE_ID}: heading-like text leans fail when styled as a real heading or set over body text`, () => {
  const leanOf = (body, head = '') =>
    assertRule(
      runa11yCoreOnHtml(
        `<!doctype html><html lang="en"><head><style>${head}</style></head><body>${body}</body></html>`,
        { runOnly: [RULE_ID] }
      ),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1 }
    ).occurrences.map((o) => [o.data.details.reasonCode, o.lean ? o.lean.i18n.whyKey : null]);

  assert.deepEqual(
    leanOf(
      '<h2>Real</h2><p class="t">Our services</p>',
      'h2, .t { font-size: 24px; font-weight: 700; font-family: Arial }'
    ),
    [['BOLD_LARGE_PARAGRAPH', 'pAsHeading_lean_why_headingStyle']]
  );
  assert.deepEqual(
    leanOf(
      '<p style="font-size:24px;font-weight:700">Our services</p><p style="font-size:16px">We do things for you.</p>'
    ),
    [['BOLD_LARGE_PARAGRAPH', 'pAsHeading_lean_why_bodyFollows']]
  );
  // A sentence, a lone bold line, or a <div> with only one of the signs:
  // no lean.
  for (const body of [
    '<p style="font-size:24px;font-weight:700">Free shipping on all orders.</p><p style="font-size:16px">We do things.</p>',
    '<p style="font-size:24px;font-weight:700">Lonely bold text</p>',
    '<div style="font-size:24px;font-weight:700">Our services</div><p style="font-size:16px">We do things for you.</p>'
  ]) {
    assert.ok(
      leanOf(body).every(([, key]) => key === null),
      body
    );
  }
});

test(`${RULE_ID}: a bold link over a teaser, repeated across sibling cards, leans fail`, () => {
  const card = (href, title) =>
    `<div class="card"><p style="font-size:20px;font-weight:700"><a href="${href}">${title}</a></p><p style="font-size:14px">A teaser for ${title}.</p></div>`;
  const run = (body) =>
    assertRule(
      runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
        runOnly: [RULE_ID]
      }),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1 }
    ).occurrences;
  const cards = run(`<div class="grid">${card('/a', 'Alpha')}${card('/b', 'Beta')}</div>`);
  assert.equal(cards.length, 2);
  for (const o of cards) {
    assert.equal(o.data.details.reasonCode, 'HEADING_LIKE_LINK');
    assert.equal(o.lean.toward, 'fail');
    assert.equal(o.lean.i18n.whyKey, 'pAsHeading_lean_why_cardTitle');
  }
  // A call to action alone in its container, or one card: no lean.
  assert.equal(
    run('<div><p style="font-size:20px;font-weight:700"><a href="/shop">Shop now</a></p></div>')[0]
      .lean,
    undefined
  );
  assert.equal(run(`<div class="grid">${card('/a', 'Alpha')}</div>`)[0].lean, undefined);
});

// Bold body text is far more often emphasis than a title, so below 18px only
// a paragraph with both signs of a title is asked about: no sentence ending,
// and plain text after it (F2).
test(`${RULE_ID}: a bold line at body size over plain text is asked about`, () => {
  const page = (body) =>
    `<!doctype html><html><head><style>body{font-size:16px}</style></head><body>${body}</body></html>`;
  const asked = [
    '<p id="x"><strong>Opening hours</strong></p><p>Monday to Friday, from nine to five.</p>',
    '<p id="x" style="font-weight:bold">Next steps</p><ul><li>Read the guide</li></ul>',
    '<p id="x"><b>Step 2 </b><strong>Prepare the dough</strong></p><p>Mix the flour and the water.</p>'
  ];
  for (const body of asked) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }),
      RULE_ID,
      'cantTell',
      {
        minOccurrences: 1,
        maxOccurrences: 1
      }
    );
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'BOLD_SHORT_PARAGRAPH', body);
    assert.equal(occ.i18n.summaryKey, 'pAsHeading_summary_cantTell_bodySize');
    assert.ok(occ.html.includes('id="x"'));
  }
  const notAsked = [
    // ends as a sentence: emphasis
    '<p><strong>The office is closed today.</strong></p><p>We reopen tomorrow.</p>',
    '<p><strong>Note:</strong></p><p>Prices include tax.</p>',
    // nothing after it, or only more bold text
    '<p><strong>Opening hours</strong></p>',
    '<p><b>Main office</b></p><p><b>12 High Street</b></p>',
    // a <div>, a number or a single link at body size
    '<div style="font-weight:bold">New</div><p>Our latest products.</p>',
    '<p><strong>2026</strong></p><p>A year of changes.</p>',
    '<p><a href="#o"><strong>See the offer</strong></a></p><p>Valid this month.</p>',
    // part of the text is not bold
    '<p><strong>Opening</strong> hours</p><p>Monday to Friday.</p>'
  ];
  for (const body of notAsked) {
    const result = runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: bold text at 18px or more keeps its own reason code`, () => {
  const html = `<!doctype html><html><body><p style="font-weight:bold;font-size:20px">Opening hours</p><p>Monday to Friday.</p></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'BOLD_LARGE_PARAGRAPH');
});

// A theme may draw body text at 300, which makes <strong> 400: heavier than
// the paragraph and the text after it, so it reads as bold.
test(`${RULE_ID}: at body size, text heavier than its paragraph counts as bold`, () => {
  const html = `<!doctype html><html><head><style>body{font-size:16px} p{font-weight:300} strong{font-weight:400}</style></head><body><p id="x"><strong>Next steps</strong></p><p>Read the guide before you start.</p></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'BOLD_SHORT_PARAGRAPH');
  // Followed by text of the same weight, it is not set apart.
  const same = `<!doctype html><html><head><style>body{font-size:16px} p{font-weight:300} strong{font-weight:400}</style></head><body><p><strong>Next steps</strong></p><p><strong>Read the guide</strong></p></body></html>`;
  assertRule(runa11yCoreOnHtml(same, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

// What the stress test of 1.18.0 found, each pinned.
const codesOf = (html) => {
  const rule = runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${html}</body></html>`, {
    runOnly: [RULE_ID]
  }).checksResults.find((r) => r.ruleId === RULE_ID);
  return (rule.occurrences || []).map((o) => o.data.details.reasonCode);
};

test(`${RULE_ID}: the last of a run of bold lines, as an address is, is no title`, () => {
  assert.deepEqual(
    codesOf(
      '<p><b>Acme Ltd</b></p><p><b>1 Main St</b></p><p><b>Springfield</b></p><p>Phone 123</p>'
    ),
    []
  );
  // A single bold line over plain text still is.
  assert.deepEqual(codesOf('<p><b>Opening hours</b></p><p>Monday to Friday</p>'), [
    'BOLD_SHORT_PARAGRAPH'
  ]);
});

test(`${RULE_ID}: a sentence ends past closing quotes and in other scripts`, () => {
  for (const text of [
    'He said "Stay home."',
    'Read the “terms.”',
    'See the note (below).',
    'هل هذا صحيح؟',
    'यह वाक्य है।'
  ]) {
    assert.deepEqual(
      codesOf(`<p><strong>${text}</strong></p><p>Plain text after it.</p>`),
      [],
      text
    );
  }
});

test(`${RULE_ID}: a semibold <p> over lighter text is asked about; large text is not body size`, () => {
  assert.deepEqual(codesOf('<p style="font-weight:600">Opening hours</p><p>Monday to Friday</p>'), [
    'BOLD_SHORT_PARAGRAPH'
  ]);
  // From 18px, a semibold title has the large text's code, never the body-size one.
  assert.deepEqual(
    codesOf(
      '<p style="font-size:30px"><span style="font-weight:600">Opening hours</span></p><p>Monday</p>'
    ),
    ['BOLD_LARGE_PARAGRAPH']
  );
});

test(`${RULE_ID}: under jsdom, em and % sizes are read against the parent's`, () => {
  // 1.4em of 12px is 16.8px: body size, not large.
  assert.deepEqual(
    codesOf(
      '<div style="font-size:12px"><div style="font-size:1.4em;font-weight:700">Title</div></div>'
    ),
    []
  );
  // 150% of 10px is 15px: a body-size paragraph, not a large one.
  assert.deepEqual(
    codesOf(
      '<div style="font-size:10px"><p style="font-size:150%"><b>Title</b></p><p>Plain text after.</p></div>'
    ),
    ['BOLD_SHORT_PARAGRAPH']
  );
});

test(`${RULE_ID}: the text that follows is the next one shown`, () => {
  // A hidden element between them, or the title alone in a wrapper.
  assert.deepEqual(codesOf('<p><b>Opening hours</b></p><p hidden>x</p><p>Monday to Friday</p>'), [
    'BOLD_SHORT_PARAGRAPH'
  ]);
  assert.deepEqual(
    codesOf('<div><p><b>Opening hours</b></p></div><div><p>Monday to Friday</p></div>'),
    ['BOLD_SHORT_PARAGRAPH']
  );
});

// A bold <div> at body size is more often a label, a badge or a price than a
// <p> is: it is asked about only above a passage of lighter text, not
// beside a value (F2).
test(`${RULE_ID}: a bold <div> at body size over a passage is asked about`, () => {
  const page = (body) =>
    `<!doctype html><html><head><style>body{font-size:16px}</style></head><body>${body}</body></html>`;
  const asked = [
    '<div id="x"><b>Opening hours</b></div><div>Monday to Friday, from nine in the morning to five in the evening.</div>',
    '<div id="x" style="font-weight:700">Our story</div><p>We started in a garage in 1998 and grew to three hundred people.</p>',
    '<div style="display:flex;flex-direction:column"><div id="x"><strong>Shipping</strong></div><div>Free shipping on every order over fifty euros, worldwide.</div></div>'
  ];
  for (const body of asked) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'BOLD_SHORT_DIV', body);
    assert.equal(occ.i18n.summaryKey, 'pAsHeading_summary_cantTell_bodySizeDiv');
    assert.ok(occ.html.includes('id="x"'), body);
  }
  const notAsked = [
    // a label over its value, or a badge over a short line
    '<div><b>Price</b></div><div>$20 per month, billed annually.</div>',
    '<div><b>New</b></div><div>Paris</div>',
    // beside what follows it: a flex row, a grid with columns, an inline box
    '<div style="display:flex"><div><b>Shipping</b></div><div>Free shipping on every order over fifty euros, worldwide.</div></div>',
    '<div style="display:grid;grid-template-columns:10em 1fr"><div><b>Shipping</b></div><div>Free shipping on every order over fifty euros, worldwide.</div></div>',
    '<div style="display:inline-block"><b>Shipping</b></div><div>Free shipping on every order over fifty euros, worldwide.</div>',
    // ends as a sentence, a number, one link, or a run of bold lines
    '<div><b>Do not stop here.</b></div><div>Something long that follows the bold text and is a passage of text.</div>',
    '<div><b>2026</b></div><div>A year of changes for the company, its people and the city around it.</div>',
    '<div><a href="#o"><b>See the offer</b></a></div><div>Valid this month on every product of the spring catalogue, in every shop.</div>',
    '<div><b>Main office</b></div><div><b>12 High Street</b></div><div>Open from Monday to Friday, from nine in the morning to five in the evening.</div>'
  ];
  for (const body of notAsked) {
    const result = runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

// A title and its text written as one paragraph, the line broken with <br>:
// the bold first line is asked about when the text after the break is
// mostly lighter and a passage (F2).
test(`${RULE_ID}: a bold first line ended by <br> over a passage is asked about`, () => {
  const page = (body) =>
    `<!doctype html><html><head><style>body{font-size:16px}</style></head><body>${body}</body></html>`;
  const asked = [
    '<p id="x"><strong>Opening hours</strong><br>Monday to Friday, from nine in the morning to five in the evening.</p>',
    '<p id="x"><b>Delivery</b><br>We ship to every country in the European Union within three working days.</p>',
    '<div id="x"><span style="font-weight:bold">Returns</span><br>Send it back within thirty days and we refund the full price, with no questions asked.</div>',
    // a bold word in the text after the break leaves it mostly lighter
    '<p id="x"><strong>Allergies</strong><br>Every dish may contain <strong>nuts</strong>, so ask the staff before you order.</p>',
    // large as well as bold: still one line of a paragraph
    '<p id="x"><strong style="font-size:22px">Opening hours</strong><br>Monday to Friday, from nine in the morning to five in the evening.</p>'
  ];
  for (const body of asked) {
    const rule = assertRule(
      runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] }),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    const occ = rule.occurrences[0];
    assert.equal(occ.data.details.reasonCode, 'BOLD_LEAD_LINE', body);
    assert.equal(occ.i18n.summaryKey, 'pAsHeading_summary_cantTell_leadLine');
    assert.ok(occ.data.details.fontSizePx > 0, body);
    assert.ok(occ.html.includes('id="x"'), body);
  }
  const notAsked = [
    // ends as a sentence: a lead-in
    '<p><strong>Note:</strong><br>Bring your ticket and an identity card to the desk at the entrance.</p>',
    // a name over an address, a label over a number, a run of bold lines
    '<p><strong>ACME Ltd</strong><br>12 High Street<br>London</p>',
    '<p><b>Phone</b><br>555 123 456</p>',
    '<p><b>Line one</b><br><b>Line two of the bold run here</b><br>end</p>',
    // the first line is not all bold
    '<p>Some text <b>bold</b><br>more text that is a full sentence and long enough to be read.</p>',
    // a number, or one link
    '<p><b>2024</b><br>The year we opened our second office in the city centre, by the river.</p>',
    '<p><a href="/x"><b>Read more</b></a><br>An article about the city, its parks and its museums, and where to eat.</p>',
    // the break hidden, or no text after it
    '<p><b>Opening hours</b><br style="display:none">Monday to Friday, from nine in the morning to five in the evening.</p>',
    '<p><b>Opening hours</b><br></p>',
    // a control's own text
    '<label><b>Email</b><br><input> Enter the address we should write to about your order.</label>'
  ];
  for (const body of notAsked) {
    const result = runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});
