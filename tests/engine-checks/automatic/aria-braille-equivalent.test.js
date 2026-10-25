'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-braille-equivalent';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no element uses a braille-specific attribute`, () => {
  const html = `<!doctype html><html><body><button>Plain</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when aria-braillelabel is accompanied by visible text content`, () => {
  const html = `<!doctype html><html><body><button aria-braillelabel="save">Save</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when aria-braillelabel has no accessible name at all`, () => {
  const html = `<!doctype html><html><body><button aria-braillelabel="save"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'BRAILLE_ATTR_WITHOUT_EQUIVALENT');
});

test(`${RULE_ID}: cantTell when aria-brailleroledescription has no aria-roledescription`, () => {
  const html = `<!doctype html><html><body><div role="img" aria-brailleroledescription="pic" aria-label="cat">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass when aria-brailleroledescription is accompanied by aria-roledescription`, () => {
  const html = `<!doctype html><html><body><div role="img" aria-brailleroledescription="pic" aria-roledescription="picture" aria-label="cat">x</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><button aria-braillelabel="save"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent'
  );
});

test(`${RULE_ID}: each missing equivalent gets its own message key`, () => {
  const html = `<!doctype html><html><body>
    <button id="label" aria-braillelabel="save"></button>
    <div id="rd" role="img" aria-brailleroledescription="pic" aria-label="cat">x</div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  const keysFor = (id) =>
    rule.occurrences.find((o) => o.html.includes(`id="${id}"`)).i18n.summaryKey;

  assert.equal(keysFor('label'), 'ariaBrailleEquivalent_summary_fail_label');
  assert.equal(keysFor('rd'), 'ariaBrailleEquivalent_summary_fail_roleDescription');
});

test(`${RULE_ID}: translated messages carry no interpolated English`, () => {
  const html = `<!doctype html><html><body><button aria-braillelabel="save"></button></body></html>`;
  for (const locale of ['de', 'es', 'fr', 'ja']) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale } });
    const occ = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 }).occurrences[0];
    assert.doesNotMatch(`${occ.summary} ${occ.hint}`, /an accessible name/, locale);
  }
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-braille-equivalent-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-braille-equivalent-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  const expectedFailIds = ['abe_case_04', 'abe_case_05'];
  const expectedNoOccIds = ['abe_case_01', 'abe_case_02', 'abe_case_03', 'abe_case_06'];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
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

test(`${RULE_ID}: leans fail for a braille label alone on a role that needs a name`, () => {
  const lean = leanOn('<button id="a" aria-braillelabel="ok"></button>', 'a');
  assert.strictEqual(lean.toward, 'fail');
  assert.strictEqual(lean.i18n.whyKey, 'ariaBrailleEquivalent_lean_why_label');
});

test(`${RULE_ID}: no lean for a braille label alone on a role that needs no name`, () => {
  assert.strictEqual(leanOn('<div id="a" aria-braillelabel="ok"></div>', 'a'), undefined);
});

test(`${RULE_ID}: leans pass for a braille role description without aria-roledescription`, () => {
  const lean = leanOn(
    '<span id="a" role="img" aria-label="Star" aria-brailleroledescription="ico"></span>',
    'a'
  );
  assert.strictEqual(lean.toward, 'pass');
  assert.strictEqual(lean.i18n.whyKey, 'ariaBrailleEquivalent_lean_why_roleDescription');
});
