'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'landmark-banner-is-top-level';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no banner landmark is present`, () => {
  const html = `<!doctype html><html><body><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the banner is top-level`, () => {
  const html = `<!doctype html><html><body><header>Site header</header><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a <header> is nested inside <main> (2026-08-01 fix — see file header comment: candidate selection no longer reuses the suppression that makes a nested header lose its own implicit banner role, matching a widely-used reference engine's unconditional header selector; found live on TurboTax's real homepage)`, () => {
  const html = `<!doctype html><html><body><main><header id="a">inner</header></main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_BANNER_NOT_TOP_LEVEL');
});

test(`${RULE_ID}: cantTell when a <header> nested inside an ancestor whose role has been overridden away from a landmark-scoping role (<aside role="dialog">) still keeps its implicit banner role, and is correctly flagged non-top-level when that ancestor is itself nested inside a real landmark (found on a real site — handsontable.com's docs-assistant side panel; the outer wrapper uses role="search" rather than <nav> deliberately, so this test isolates the <aside role="dialog"> fix from an unrelated, already-suppressing <nav> ancestor)`, () => {
  const html = `<!doctype html><html><body>
    <div role="search" aria-label="Docs assistant"><aside role="dialog" aria-label="Assistant panel"><header id="a">Panel header</header></aside></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: cantTell when a <header> is nested inside a NAMED <aside> — the aside is a genuine complementary landmark ancestor, so this is real non-top-level nesting (2026-08-01 fix, see above)`, () => {
  const html = `<!doctype html><html><body><aside aria-label="Related"><header id="a">inner</header></aside></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: an UNNAMED top-level <aside> is STILL a real complementary landmark (per getImplicitLandmarkRole: only an aside that is itself nested inside sectioning content needs a name to keep the role) — so this is real non-top-level nesting too, same as the named case above`, () => {
  const html = `<!doctype html><html><body><aside><header id="a">inner</header></aside></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when a <header> is nested inside an UNNAMED <section> — an unnamed <section> has no implicit role at all, unlike a top-level <aside> (see above), so there is genuinely no landmark ancestor here; proves the 2026-08-01 fix only flags real landmark nesting, not every sectioning-tag ancestor`, () => {
  const html = `<!doctype html><html><body><section><header id="a">inner</header></section></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when an explicit role="banner" is nested inside another landmark`, () => {
  const html = `<!doctype html><html><body><div role="navigation"><div role="banner" id="a">Nested</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_BANNER_NOT_TOP_LEVEL');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div role="navigation"><div role="banner" id="a">Nested</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Banner landmark must be top-level');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/landmark-banner-is-top-level-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'landmark-banner-is-top-level-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'lbtl_case_02'));
  assert.ok(hasOccurrenceForId(rule, 'lbtl_case_03'));
});
