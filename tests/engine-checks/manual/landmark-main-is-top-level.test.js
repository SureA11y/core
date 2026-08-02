'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = 'landmark-main-is-top-level';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

// Same gap as this rule's landmark-no-duplicate-*/landmark-one-main
// siblings, which share this identical getImplicitLandmarkRole/
// hasSectioningAncestor/getAccessibleLandmarkName block: everything above
// runs through runa11yCoreOnHtml (toString-embedded), uncounted by Node's
// --experimental-test-coverage, and the fixture only has a bare <main> and a
// role="navigation" ancestor. Exercise the real gaps via runDomRulesInPage.
function runNode(html) {
  createDom(html);
  return runDomRulesInPage('https://example.test/', null, {}, { includeRuleIds: [RULE_ID] });
}

function ruleFrom(result) {
  return result.checksResults.find((r) => r.ruleId === RULE_ID);
}

test(`${RULE_ID}: notApplicable when no main landmark is present`, () => {
  const html = `<!doctype html><html><body><div>no main</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when main is top-level`, () => {
  const html = `<!doctype html><html><body><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when main is nested inside another landmark`, () => {
  const html = `<!doctype html><html><body><div role="navigation"><main id="a">Nested</main></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_MAIN_NOT_TOP_LEVEL');
});

test(`${RULE_ID}: cantTell when main is nested inside a <header> whose own implicit banner role is only correctly recognized because its <aside role="dialog"> ancestor's role has been overridden away from a landmark-scoping role — before this fix, the ancestor <header> was incorrectly not recognized as a landmark at all, so this nesting went entirely undetected (mirrors a real bug found on handsontable.com's docs-assistant side panel)`, () => {
  const html = `<!doctype html><html><body>
    <aside role="dialog" aria-label="Assistant panel"><header><main id="a">Nested</main></header></aside>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div role="navigation"><main id="a">Nested</main></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Main landmark must be top-level');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/landmark-main-is-top-level-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'landmark-main-is-top-level-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'lmtl_case_02'));
});

test(`${RULE_ID} (node runtime): notApplicable when a top-level explicit role="main" is used instead of <main>`, () => {
  const html = `<!doctype html><html><body><div role="main">Content</div></body></html>`;
  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});

test(`${RULE_ID} (node runtime): cantTell when main is nested inside an implicit <header>/<footer>/<nav>/named <aside>/<section>/<form> landmark, one ancestor per case`, () => {
  const cases = [
    ['header', '<header><main id="m">Nested</main></header>'],
    ['footer', '<footer><main id="m">Nested</main></footer>'],
    ['nav', '<nav><main id="m">Nested</main></nav>'],
    ['aside', '<aside aria-label="Related"><main id="m">Nested</main></aside>'],
    ['section', '<section aria-label="Named section"><main id="m">Nested</main></section>'],
    ['form', '<form aria-label="Named form"><main id="m">Nested</main></form>']
  ];

  for (const [label, inner] of cases) {
    const html = `<!doctype html><html><body>${inner}</body></html>`;
    const result = runNode(html);
    const rule = ruleFrom(result);
    assert.ok(rule, `expected a checksResults entry for ${label}`);
    assert.strictEqual(rule.outcome, 'cantTell', `${label}: expected cantTell`);
    assert.strictEqual(rule.occurrences.length, 1, `${label}: expected 1 occurrence`);
  }
});

test(`${RULE_ID} (node runtime): notApplicable when main is nested inside an unnamed (not a landmark) <section>/<form>`, () => {
  const cases = [
    '<section><main id="m">Not nested in a landmark</main></section>',
    '<form><main id="m">Not nested in a landmark</main></form>'
  ];

  for (const inner of cases) {
    const html = `<!doctype html><html><body>${inner}</body></html>`;
    const result = runNode(html);
    const rule = ruleFrom(result);
    assert.ok(rule);
    assert.strictEqual(rule.outcome, 'notApplicable');
    assert.strictEqual(rule.occurrences.length, 0);
  }
});

test(`${RULE_ID} (node runtime): cantTell when main is nested inside an unnamed top-level <aside> — a bare <aside> is implicitly complementary (HTML-AAM) unless nested inside sectioning content without a name`, () => {
  const html = `<!doctype html><html><body><aside><main id="m">Nested</main></aside></body></html>`;
  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 1);
});

test(`${RULE_ID} (node runtime): a main scoped to the top of a contextSelector-narrowed run does not climb past the scanned scope to find a false ancestor landmark`, () => {
  const html = `<!doctype html><html><body>
    <div role="navigation">
      <div id="scope"><main id="m">Content</main></div>
    </div>
  </body></html>`;
  createDom(html);
  const result = runDomRulesInPage(
    'https://example.test/',
    '#scope',
    {},
    { includeRuleIds: [RULE_ID] }
  );
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});
