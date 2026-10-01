'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'deprecated-elements-not-used';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: pass when no <marquee> is present`, () => {
  const html = `<!doctype html><html><body><p id="a">plain text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// No current browser makes <blink> blink, so it holds no blinking content for
// 2.2.2.
test(`${RULE_ID}: pass when only <blink> is present`, () => {
  const html = `<!doctype html><html><body><blink id="a">Sale</blink></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when <marquee> is present (a page pause control is possible)`, () => {
  const html = `<!doctype html><html><body><marquee id="a">scroll</marquee></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  const occ = rule.occurrences[0];
  assert.equal(occ.data.details.element, 'marquee');
  assert.equal(occ.data.details.reasonCode, 'MARQUEE_PAUSE_MECHANISM_UNKNOWN');
  assert.equal(occ.uncertainty.code, 'runtime-dependent');
});

test(`${RULE_ID}: a <marquee> with a page pause button is still asked about, not failed`, () => {
  const html = `<!doctype html><html><body><marquee id="m">News</marquee><button type="button" onclick="document.getElementById('m').stop()">Pause</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: only the <marquee> is reported when both elements are present`, () => {
  const html = `<!doctype html><html><body><blink id="a">flash</blink><marquee id="b">scroll</marquee></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.ok(!hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: reports multiple occurrences of <marquee>`, () => {
  const html = `<!doctype html><html><body><marquee id="a">1</marquee><marquee id="b">2</marquee></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: same outcomes under the wcag22-aa profile`, () => {
  const blink = `<!doctype html><html lang="en"><head><title>t</title></head><body><blink>Sale</blink></body></html>`;
  const marquee = `<!doctype html><html lang="en"><head><title>t</title></head><body><marquee>News</marquee></body></html>`;
  const run = (html) => runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  assertRule(run(blink), RULE_ID, 'pass', { maxOccurrences: 0 });
  assertRule(run(marquee), RULE_ID, 'cantTell', { minOccurrences: 1 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><marquee id="a">scroll</marquee></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Scrolling <marquee> content must be possible to pause, stop, or hide'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/deprecated-elements-not-used-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'deprecated-elements-not-used-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  const expectedCantTellIds = ['dep_case_02', 'dep_case_04'];
  const expectedNoOccIds = ['dep_case_01', 'dep_case_03'];

  for (const id of expectedCantTellIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
