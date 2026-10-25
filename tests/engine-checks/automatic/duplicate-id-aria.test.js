'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'duplicate-id-aria';

test(`${RULE_ID}: notApplicable when no ARIA id-reference attribute is present`, () => {
  const html = `<!doctype html><html><body><div id="a">A</div><div id="a">A2</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the referenced id is unique`, () => {
  const html = `<!doctype html><html><body><div id="a">A</div><button aria-labelledby="a">x</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a referenced id is duplicated, one occurrence per element`, () => {
  const html = `<!doctype html><html><body><div id="a">A</div><div id="a">A2</div><button aria-labelledby="a">x</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.equal(rule.occurrences[0].data.details.id, 'a');
  assert.equal(rule.occurrences[0].data.details.duplicateCount, 2);
});

test(`${RULE_ID}: cantTell via aria-describedby`, () => {
  const html = `<!doctype html><html><body><span id="d">D1</span><span id="d">D2</span><input aria-describedby="d"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
});

const SPLIT_HTML =
  `<!doctype html><html><body>` +
  `<div id="w"><p id="a">inside</p><button aria-labelledby="a">x</button></div>` +
  `<div id="o"><p id="a">outside</p></div>` +
  `</body></html>`;

test(`${RULE_ID}: contextSelector reports the in-scope duplicate only`, () => {
  const result = runa11yCoreOnHtml(SPLIT_HTML, { runOnly: [RULE_ID], contextSelector: '#w' });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /inside/);
  assert.equal(rule.occurrences[0].data.details.duplicateCount, 2);
});

test(`${RULE_ID}: excludeSelectors keeps the excluded duplicate out of the occurrences`, () => {
  const result = runa11yCoreOnHtml(SPLIT_HTML, { runOnly: [RULE_ID], excludeSelectors: ['#o'] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.match(rule.occurrences[0].html, /inside/);
});

test(`${RULE_ID}: pass when every duplicate lies outside the scanned scope`, () => {
  const html =
    `<!doctype html><html><body>` +
    `<div id="w"><button aria-labelledby="a">x</button></div>` +
    `<div id="o"><p id="a">one</p><p id="a">two</p></div>` +
    `</body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], contextSelector: '#w' });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a">A</div><div id="a">A2</div><button aria-labelledby="a">x</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'IDs referenced by ARIA must be unique');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/duplicate-id-aria-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'duplicate-id-aria-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });

  const flaggedIds = rule.occurrences.map((o) => o.data.details.id).sort();
  assert.deepStrictEqual(flaggedIds, ['dia_ref_01', 'dia_ref_01', 'dia_ref_02', 'dia_ref_02']);

  const flaggedUniqueRefs = new Set(flaggedIds);
  assert.ok(
    !flaggedUniqueRefs.has('dia_ref_ok'),
    'the unique aria-labelledby target must not be flagged'
  );
  assert.ok(
    !flaggedUniqueRefs.has('dia_unreferenced_dup'),
    'a duplicated id never referenced by ARIA must not be flagged'
  );
});

// Leans: which way each undecided finding points.
function leanOn(html, id, ruleId = RULE_ID) {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${html}</body></html>`,
    { runOnly: [ruleId] }
  );
  const rule = assertRule(result, ruleId, 'cantTell', { minOccurrences: 1 });
  const occ = rule.occurrences.find(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
  assert.ok(occ, `expected an occurrence on #${id}`);
  assert.strictEqual(occ.occurrenceOutcome || 'cantTell', 'cantTell');
  return occ.lean;
}

test(`${RULE_ID}: leans fail when a referring element sits by a later copy of the id`, () => {
  const lean = leanOn(
    '<div><h3 id="t">One</h3><button aria-labelledby="t">Go</button></div><div><h3 id="t">Two</h3><button aria-labelledby="t">Go</button></div>',
    't'
  );
  assert.strictEqual(lean.toward, 'fail');
  assert.strictEqual(lean.i18n.whyKey, 'duplicateIdAria_lean_why_nearerCopy');
});

test(`${RULE_ID}: leans pass when every copy has the same text for a naming reference`, () => {
  const lean = leanOn(
    '<span id="s">Required</span><span id="s">Required</span><input aria-describedby="s">',
    's'
  );
  assert.strictEqual(lean.toward, 'pass');
  assert.strictEqual(lean.i18n.whyKey, 'duplicateIdAria_lean_why_sameText');
});

test(`${RULE_ID}: no lean when copies differ and the first is the nearest`, () => {
  assert.strictEqual(
    leanOn('<span id="s">One</span><input aria-describedby="s"><span id="s">Two</span>', 's'),
    undefined
  );
});
