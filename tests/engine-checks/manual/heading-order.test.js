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

const RULE_ID = 'heading-order';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when fewer than two headings exist`, () => {
  const html = `<!doctype html><html><body><h1>A</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass for consecutive heading levels`, () => {
  const html = `<!doctype html><html><body><h1>A</h1><h2>B</h2><h3>C</h3></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when headings go back up to a shallower level`, () => {
  const html = `<!doctype html><html><body><h1>A</h1><h2>B</h2><h3>C</h3><h4>D</h4><h2>E</h2><h3>F</h3><h1>G</h1></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell on a skip after the previous heading even when a deeper level was reached earlier`, () => {
  const html = `<!doctype html><html><body>
    <div class="cookies"><h2>Cookies</h2><h3>Settings</h3><h4>Analytics</h4></div>
    <h1>Page</h1><h2>Section</h2><h4 id="a">Share the page</h4></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.fromLevel, 2);
  assert.equal(rule.occurrences[0].data.details.toLevel, 4);
});

test(`${RULE_ID}: cantTell on h1, h2, h3, h2, h4 (the h4 skips a level within the second h2 section)`, () => {
  const html = `<!doctype html><html><body><h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2><h4 id="a">E</h4></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.fromLevel, 2);
});

test(`${RULE_ID}: a hidden or inert heading neither counts as the previous heading nor is flagged`, () => {
  for (const hidden of [
    '<h3 style="display:none">H</h3>',
    '<h3 hidden>H</h3>',
    '<div inert><h3>H</h3></div>',
    '<div aria-hidden="true"><h3>H</h3></div>'
  ]) {
    const masked = `<!doctype html><html><body><h1>A</h1>${hidden}<h4 id="a">B</h4></body></html>`;
    const rule = assertRule(
      runa11yCoreOnHtml(masked, { runOnly: [RULE_ID] }),
      RULE_ID,
      'cantTell',
      {
        minOccurrences: 1,
        maxOccurrences: 1
      }
    );
    assert.ok(hasOccurrenceForId(rule, 'a'), hidden);
    assert.equal(rule.occurrences[0].data.details.fromLevel, 1, hidden);

    const quiet = `<!doctype html><html><body><h1>A</h1><h2>B</h2>${hidden.replace(/h3/g, 'h6')}<h3>C</h3></body></html>`;
    assertRule(runa11yCoreOnHtml(quiet, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      minOccurrences: 0,
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: cantTell when a heading skips a level`, () => {
  const html = `<!doctype html><html><body><h1>A</h1><h3 id="a">B</h3></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.fromLevel, 1);
  assert.equal(rule.occurrences[0].data.details.toLevel, 3);
});

test(`${RULE_ID}: a heading role in a fallback list or upper case is a heading, an unknown role leaves the native one`, () => {
  for (const second of [
    '<div role="foo heading" aria-level="3" id="a">B</div>',
    '<div role="HEADING" aria-level="3" id="a">B</div>',
    '<h3 role="foo" id="a">B</h3>'
  ]) {
    const html = `<!doctype html><html><body><h1>A</h1>${second}</body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'a'));
    assert.equal(rule.occurrences[0].data.details.toLevel, 3);
  }
});

// Browsers expose aria-level on <hx> in place of the tag level.
test(`${RULE_ID}: aria-level on a native heading gives its level`, () => {
  const quiet = `<!doctype html><html><body><h1>S</h1><h4 aria-level="2">N</h4></body></html>`;
  for (const engineOptions of [{}]) {
    const result = runa11yCoreOnHtml(quiet, { runOnly: [RULE_ID], engineOptions });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }

  const skip = `<!doctype html><html><body><h1>S</h1><h2 id="a" aria-level="4">N</h2></body></html>`;
  for (const engineOptions of [{}]) {
    const result = runa11yCoreOnHtml(skip, { runOnly: [RULE_ID], engineOptions });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'a'));
    assert.equal(rule.occurrences[0].data.details.toLevel, 4);
  }
});

test(`${RULE_ID}: an invalid aria-level on a native heading leaves the tag level`, () => {
  const html = `<!doctype html><html><body><h1>S</h1><h3 id="a" aria-level="0">N</h3><h3 aria-level="x">M</h3></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.toLevel, 3);
});

// Chromium, Firefox and WebKit all expose <h3 role="heading"> at level 3:
// role="heading" on a native heading leaves its tag level.
test(`${RULE_ID}: role="heading" on a native heading keeps its tag level`, () => {
  const quiet = `<!doctype html><html><body><h1>A</h1><h2>B</h2><h3 role="heading">C</h3><h4>D</h4></body></html>`;
  assertRule(runa11yCoreOnHtml(quiet, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });

  const skip = `<!doctype html><html><body><h1>A</h1><h3 role="heading" id="a">B</h3></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(skip, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.toLevel, 3);
});

// Browsers read aria-level's leading integer, on a native heading too.
test(`${RULE_ID}: aria-level on a native heading is read from its leading integer`, () => {
  const html = `<!doctype html><html><body><h1>S</h1><h4 aria-level="2.5">N</h4><h5 aria-level="3x">M</h5></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><h1>A</h1><h3 id="a">B</h3></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Heading levels must not skip a level');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/heading-order-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'heading-order-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  assert.ok(hasOccurrenceForId(rule, 'ho_case_01'));
  assert.ok(hasOccurrenceForId(rule, 'ho_case_02'));
  assert.ok(!hasOccurrenceForId(rule, 'ho_case_03'));
  assert.ok(hasOccurrenceForId(rule, 'ho_case_04'));
});

test(`${RULE_ID}: an aria-hidden heading is excluded from the outline (regression -- neither flagged itself nor allowed to mask a real skip after it)`, () => {
  const html = `<!doctype html><html><body><h1>Title</h1><h3 aria-hidden="true">Hidden from AT</h3><h4 id="a">Visible</h4></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.fromLevel, 1);
  assert.equal(rule.occurrences[0].data.details.toLevel, 4);
});

test(`heading-order: respects contextSelector scoping (regression -- used to bypass helpers.queryAllSmart and always scan the whole document)`, () => {
  const html = `<!doctype html><html><body><div id="target"><p>Just some unrelated text.</p></div><h1>A</h1><h3 id="a">B</h3></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['heading-order'],
    contextSelector: '#target'
  });
  assertRule(result, 'heading-order', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

function runWithShadow(light, shadowByHost) {
  const dom = createDom(`<!doctype html><html><body>${light}</body></html>`);
  for (const [host, inner] of Object.entries(shadowByHost)) {
    dom.window.document.querySelector(host).attachShadow({ mode: 'open' }).innerHTML = inner;
  }
  return runa11yCoreOnDom(dom, { runOnly: [RULE_ID], engineOptions: { includeShadowDom: true } });
}

test(`${RULE_ID}: a shadow root's headings are read at their host`, () => {
  const card = runWithShadow(
    '<h1>Shop</h1><h2>Products</h2><h3>Shoes</h3><x-card></x-card><h2>Contact</h2>',
    { 'x-card': '<h4 id="sneaker">Sneaker X</h4><p>Description</p>' }
  );
  assertRule(card, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });

  const section = runWithShadow('<h1>Shop</h1><x-sec></x-sec><h3>Sub</h3>', {
    'x-sec': '<h2>Section</h2>'
  });
  assertRule(section, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });

  const skip = runWithShadow('<h1>Shop</h1><x-sec></x-sec><h2>Contact</h2>', {
    'x-sec': '<h3 id="a">Section</h3>'
  });
  const rule = assertRule(skip, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.fromLevel, 1);
});

test(`${RULE_ID}: a slotted heading is read at its slot, and an unslotted one not at all`, () => {
  const slotted = runWithShadow('<h1>A</h1><x-s><h3 slot="b">Slotted</h3></x-s>', {
    'x-s': '<h2>Shadow</h2><slot name="b"></slot>'
  });
  assertRule(slotted, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });

  const before = runWithShadow('<h1>A</h1><x-s><h4 id="a" slot="b">Slotted</h4></x-s>', {
    'x-s': '<slot name="b"></slot><h2>Shadow</h2><h3>Sub</h3>'
  });
  const rule = assertRule(before, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.fromLevel, 1);

  const unslotted = runWithShadow('<h1>A</h1><x-s><h4>Not rendered</h4></x-s><h2>B</h2>', {
    'x-s': '<p>No slot</p>'
  });
  assertRule(unslotted, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// WAI-ARIA's presentational roles conflict resolution: role="none" on a
// heading that can take focus or carries a global ARIA attribute is ignored,
// so the heading still counts in the outline, as Chromium exposes it.
test(`${RULE_ID}: a heading whose role="none" is ignored still counts in the order`, () => {
  for (const middle of [
    '<h2 role="presentation" aria-label="Part">Part</h2>',
    '<h2 role="none" tabindex="0">Part</h2>'
  ]) {
    const html = `<!doctype html><html><body><h1>Title</h1>${middle}<h3>Sub</h3></body></html>`;
    assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'pass', {
      minOccurrences: 0,
      maxOccurrences: 0
    });
  }
});

test(`${RULE_ID}: a heading with role="none" and nothing to override it is out of the order`, () => {
  const html = `<!doctype html><html><body><h1>Title</h1><h2 role="none">Part</h2><h3>Sub</h3></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test(`${RULE_ID}: names the heading it jumps from`, () => {
  const html = `<!doctype html><html><body><h1>Shop</h1><h2 id="p">Pricing</h2><p>Long content</p><h4 id="f">FAQ</h4></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell');
  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'This level-4 heading "FAQ" follows the level-2 heading "Pricing", skipping a level.'
  );
  assert.strictEqual(occ.i18n.summaryKey, 'headingOrder_summary_cantTell_previous');
  assert.strictEqual(occ.data.details.previousText, 'Pricing');
  assert.strictEqual(occ.data.details.previousSelector, '#p');
  assert.strictEqual(occ.data.details.fromLevel, 2);
});

// aria-level from 1 to 9: Chromium ignores a larger one, and ARIA has any
// value below 1 or no integer ignored. The heading keeps its own level.
test('heading-order: an aria-level outside 1 to 9 is ignored', () => {
  for (const level of ['10', '99', '99999999999999999999', '0', '-1', 'abc']) {
    const html = `<!doctype html><html lang="en"><body><h1>A</h1><h2 aria-level="${level}">B</h2></body></html>`;
    const rule = runa11yCoreOnHtml(html, { runOnly: ['heading-order'] }).checksResults.find(
      (r) => r.ruleId === 'heading-order'
    );
    assert.strictEqual(rule.outcome, 'pass', level);
  }
});

// An excluded area is part of the page's outline as its readers meet it:
// its headings are read as context, and nothing is reported on them.
test('heading-order: excluded headings are context, never findings', () => {
  const outcome = (body, excludeSelectors) => {
    const rule = runa11yCoreOnHtml(`<!doctype html><html lang="en"><body>${body}</body></html>`, {
      runOnly: ['heading-order'],
      engineOptions: { excludeSelectors }
    }).checksResults.find((r) => r.ruleId === 'heading-order');
    return [rule.outcome, (rule.occurrences || []).map((o) => o.data.details.toLevel)];
  };
  // The excluded <h2> bridges the <h1> and the <h3>: no skip a reader meets.
  assert.deepStrictEqual(outcome('<h1>A</h1><div id="x"><h2>B</h2></div><h3>C</h3>', ['#x']), [
    'pass',
    []
  ]);
  // A skip into the page from an excluded heading is reported on the page's own.
  assert.deepStrictEqual(outcome('<div id="x"><h2>A</h2></div><h4>B</h4>', ['#x']), [
    'cantTell',
    [4]
  ]);
  // A skip onto an excluded heading is not reported.
  assert.deepStrictEqual(outcome('<h1>A</h1><div id="x"><h3>B</h3></div>', ['#x']), ['pass', []]);
  // Every heading excluded: nothing to judge.
  assert.deepStrictEqual(outcome('<div id="x"><h1>A</h1><h3>B</h3></div>', ['#x']), [
    'notApplicable',
    []
  ]);
});
