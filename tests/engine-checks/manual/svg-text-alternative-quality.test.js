'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = 'svg-text-alternative-quality';

// The fixture's scenarios never use role="presentation"/"none", so
// isRolePresentationExcluded's focusable-vs-not-focusable branches never run
// through runa11yCoreOnHtml (toString-embedded, uncounted by Node's
// --experimental-test-coverage per tests/node-runtime-parity.test.js's header
// comment) nor through the fixture's single runDomRulesInPage pass. Exercise
// them directly here.
function runNode(html) {
  createDom(html);
  return runDomRulesInPage('https://example.test/', null, {}, { includeRuleIds: [RULE_ID] });
}

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no matching elements`, () => {
  const html = `<!doctype html><html><body><p>None</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when at least one applicable element triggers manual review`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'svg-text-alternative-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 6, maxOccurrences: 6 });

  const expected = ['s_q_01', 's_q_02', 's_q_05', 's_q_06', 's_q_07', 's_q_10'];
  const notExpected = ['s_q_03', 's_q_04', 's_q_08', 's_q_09', 's_q_11'];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'svg-text-alternative-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(
    rule.title,
    'L\u2019\u00e9quivalent textuel de <svg> doit \u00eatre appropri\u00e9 (v\u00e9rification manuelle)'
  );
  assert.strictEqual(
    rule.description,
    'Signale les graphiques <svg> concern\u00e9s pour lesquels un \u00e9quivalent textuel a \u00e9t\u00e9 d\u00e9tect\u00e9, afin de v\u00e9rifier manuellement sa pertinence.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'V\u00e9rifiez que l\u2019\u00e9quivalent textuel de ce <svg> est exact.'
  );
  assert.strictEqual(
    occ.hint,
    'Le <title>, le <desc> ou le nom ARIA devrait dire ce que le graphique signifie ou fait ici.'
  );
});

test(`${RULE_ID} (node runtime): non-focusable role="presentation" svg is excluded, even with an aria-label`, () => {
  const html = `<!doctype html><html><body><svg id="s1" role="presentation" aria-label="Decorative"></svg></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): non-focusable role="none" svg is excluded, same as role="presentation"`, () => {
  const html = `<!doctype html><html><body><svg id="s2" role="none" aria-label="Decorative"></svg></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): a focusable role="presentation" svg is NOT excluded (mirrors img-alt-present policy)`, () => {
  const html = `<!doctype html><html><body><svg id="s3" role="presentation" tabindex="0" aria-label="Focusable graphic"></svg></body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
});

test(`${RULE_ID} (node runtime): role presentation is read from a fallback list, in any case (#91)`, () => {
  const html = `<!doctype html><html><body>
    <svg role="foo presentation" aria-label="Decorative"></svg>
    <svg role="NONE" aria-label="Decorative"></svg>
  </body></html>`;
  const result = runNode(html);
  const rule = result.checksResults.find((r) => r.ruleId === RULE_ID);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

// A name the drawing tool or the export left behind, a file name or a
// generic word does not describe the graphic: it leans fail, on its own and
// as a control's only content. Any other name needs a person.
test(`${RULE_ID}: leans fail on a tool leftover, a file name or a placeholder name`, () => {
  const run = (body) =>
    assertRule(
      runa11yCoreOnHtml(`<!doctype html><html lang="en"><body><main>${body}</main></body></html>`, {
        runOnly: [RULE_ID]
      }),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    ).occurrences[0];
  const svg = (inner, attrs = '') =>
    `<svg role="img" ${attrs} viewBox="0 0 10 10">${inner}<rect width="10" height="10"/></svg>`;
  for (const [body, value] of [
    [svg('<title>Layer 1</title>'), 'tool-artefact'],
    [svg('<title>Rectangle 2 copy 3</title>'), 'tool-artefact'],
    [svg('<title>Created with Sketch.</title>'), 'tool-artefact'],
    [svg('', 'aria-label="icon-search"'), 'tool-artefact'],
    [svg('<title>chart-final.svg</title>'), 'file-name'],
    [svg('<title>graphic</title>'), 'placeholder']
  ]) {
    const o = run(body);
    assert.strictEqual(o.lean.toward, 'fail', body);
    assert.strictEqual(o.lean.i18n.whyKey, 'svg_textAltQuality_lean_why', body);
    assert.deepStrictEqual(o.lean.signals, [{ signal: 'name-signal', value }], body);
  }
  const control = run(`<button>${svg('<title>Group 3</title>')}</button>`);
  assert.strictEqual(control.data.details.reasonCode, 'IMAGE_ONLY_CONTROL_CONTENT');
  assert.strictEqual(control.lean.toward, 'fail');
  assert.strictEqual(control.lean.i18n.whyKey, 'svg_textAltQuality_lean_why_control');
  for (const body of [
    svg('<title>Rainfall by month</title>'),
    svg('<title>Rectangle</title>'),
    `<button>${svg('<title>Search</title>')}</button>`
  ]) {
    assert.strictEqual(run(body).lean, undefined, body);
  }
  // A shape name with a long run of digits, then something else, is
  // rejected at once: the pattern can't split the digits many ways.
  const started = Date.now();
  assert.strictEqual(run(svg(`<title>rect${'0'.repeat(40)}x</title>`)).lean, undefined);
  assert.ok(Date.now() - started < 1000, `took ${Date.now() - started} ms`);
});
