'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = 'landmark-no-duplicate-banner';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

// Every scenario above is real, verified behavior -- but all of it runs
// through runa11yCoreOnHtml (toString-embedded), which Node's
// --experimental-test-coverage can't attribute back to this file (see
// tests/node-runtime-parity.test.js's header comment). The fixture the
// generic harness runs through the real entry point only has two plain
// <header>s, so getImplicitLandmarkRole's footer/main/nav/aside/section/form
// branches, the explicit-role path, and getAccessibleLandmarkName never ran
// through it either. Exercise the real gaps here via runDomRulesInPage.
function runNode(html) {
  createDom(html);
  return runDomRulesInPage('https://example.test/', null, {}, { includeRuleIds: [RULE_ID] });
}

function ruleFrom(result) {
  return result.checksResults.find((r) => r.ruleId === RULE_ID);
}

test(`${RULE_ID}: notApplicable when no banner is present`, () => {
  const html = `<!doctype html><html><body><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when there is exactly one banner`, () => {
  const html = `<!doctype html><html><body><header>Site header</header></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell with one occurrence per banner when more than one exists`, () => {
  const html = `<!doctype html><html><body><header id="a">First</header><header id="b">Second</header></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_DUPLICATE_BANNER');
});

test(`${RULE_ID}: cantTell when a <header> nested inside an ancestor whose role has been overridden away from a landmark-scoping role (<aside role="dialog">) still keeps its implicit banner role and collides with a top-level header (found on a real site — handsontable.com's docs-assistant side panel)`, () => {
  const html = `<!doctype html><html><body>
    <header id="a">Site header</header>
    <aside role="dialog" aria-label="Assistant panel"><header id="b">Panel header</header></aside>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: notApplicable when a <header> is nested inside a plain (no role override) <aside> — the ancestor's bare tag still suppresses banner exactly as before, only an explicit role override on the ancestor changes the outcome`, () => {
  const html = `<!doctype html><html><body>
    <header id="a">Site header</header>
    <aside aria-label="Related"><header id="b">Not a landmark</header></aside>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the only "duplicate" banner is display:none (a responsive desktop/mobile pattern) — matches a reference engine's own visibility gate (found on a real site, Trello's homepage)`, () => {
  const html = `<!doctype html><html><body>
    <header id="a">Visible</header>
    <header id="b" style="display:none">Hidden duplicate</header>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><header id="a">First</header><header id="b">Second</header></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page must not have more than one banner landmark');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/landmark-no-duplicate-banner-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'landmark-no-duplicate-banner-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'ndb_case_01a'));
  assert.ok(hasOccurrenceForId(rule, 'ndb_case_01b'));
});

test(`${RULE_ID} (node runtime): explicit role="banner" duplicates are detected the same as implicit <header>`, () => {
  const html = `<!doctype html><html><body><div id="a" role="banner">A</div><div id="b" role="banner">B</div></body></html>`;
  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 2);
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID} (node runtime): other landmark tags/roles (footer, main, nav, named aside/section/form) are never mistaken for a banner`, () => {
  const html = `<!doctype html><html><body>
    <header id="a">First</header>
    <header id="b">Second</header>
    <footer>Site footer</footer>
    <main>Content</main>
    <nav>Nav</nav>
    <aside aria-label="Related">Aside</aside>
    <section aria-label="Named section">Section</section>
    <form aria-label="Named form">Form</form>
  </body></html>`;
  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 2);
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID} (node runtime): a <header> nested inside a role-overridden ancestor still collides (handsontable.com pattern)`, () => {
  const html = `<!doctype html><html><body>
    <header id="a">Site header</header>
    <aside role="dialog" aria-label="Assistant panel"><header id="b">Panel header</header></aside>
  </body></html>`;
  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 2);
});

test(`${RULE_ID} (node runtime): a display:none duplicate header is excluded (not exposed to AT)`, () => {
  const html = `<!doctype html><html><body>
    <header id="a">Visible</header>
    <header id="b" style="display:none">Hidden duplicate</header>
  </body></html>`;
  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});
