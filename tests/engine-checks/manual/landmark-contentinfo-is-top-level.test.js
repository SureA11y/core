'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'landmark-contentinfo-is-top-level';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no contentinfo landmark is present`, () => {
  const html = `<!doctype html><html><body><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the contentinfo is top-level`, () => {
  const html = `<!doctype html><html><body><footer>Site footer</footer></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a <footer> nested inside an ancestor whose role has been overridden away from a landmark-scoping role (<aside role="dialog">) still keeps its implicit contentinfo role, and is correctly flagged non-top-level when that ancestor is itself nested inside a real landmark (the outer wrapper uses role="search" rather than <nav> deliberately, so this test isolates the <aside role="dialog"> fix from an unrelated, already-suppressing <nav> ancestor)`, () => {
  const html = `<!doctype html><html><body>
    <div role="search" aria-label="Docs assistant"><aside role="dialog" aria-label="Assistant panel"><footer id="a">Panel footer</footer></aside></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when a <footer> is nested inside a NAMED <aside> — <aside> is sectioning content, so the footer has no contentinfo role to begin with`, () => {
  const html = `<!doctype html><html><body><aside aria-label="Related"><footer id="a">inner</footer></aside></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when a <footer> is nested inside <main> — per HTML-AAM it has no contentinfo role there, so there is no landmark to be nested`, () => {
  const html = `<!doctype html><html><body><main><footer id="a">inner</footer></main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an UNNAMED top-level <aside> is still a complementary landmark, but <aside> is sectioning content either way, so the footer has no contentinfo role and nothing is flagged`, () => {
  const html = `<!doctype html><html><body><aside><footer id="a">inner</footer></aside></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when a <footer> is nested inside an UNNAMED <section> — an unnamed <section> has no implicit role at all, unlike a top-level <aside> (see above), so there is genuinely no landmark ancestor here`, () => {
  const html = `<!doctype html><html><body><section><footer id="a">inner</footer></section></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when an explicit role="contentinfo" is nested inside another landmark`, () => {
  const html = `<!doctype html><html><body><div role="navigation"><div role="contentinfo" id="a">Nested</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_CONTENTINFO_NOT_TOP_LEVEL');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div role="navigation"><div role="contentinfo" id="a">Nested</div></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Contentinfo landmark must be top-level');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/landmark-contentinfo-is-top-level-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'landmark-contentinfo-is-top-level-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'lctl_case_02'));
  assert.ok(hasOccurrenceForId(rule, 'lctl_case_03b'));
  // A roleless <footer> under <main> has no contentinfo role per HTML-AAM.
  assert.ok(!hasOccurrenceForId(rule, 'lctl_case_03'));
});

// Regression coverage for a bug found while extending this rule family's
// direct coverage: an aria-hidden contentinfo candidate is removed from
// the accessibility tree entirely, so it isn't part of the landmark
// structure assistive technology users navigate at all -- it must not be
// flagged as "nested inside another landmark" (there's no real landmark
// there to begin with, from AT's perspective). queryAllSmart's default
// hidden-content policy only excludes "hard" CSS-based hiding
// (display:none, etc.), not the softer aria-hidden exclusion, so this
// rule needed its own explicit check.
test(`${RULE_ID}: an aria-hidden nested footer is not flagged (it isn't part of the AT-perceived landmark structure)`, () => {
  const html = `<!doctype html><html><body><div role="main"><footer aria-hidden="true">Hidden</footer></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a roleless <footer> inside sectioning content is not a contentinfo and is not flagged`, () => {
  for (const tag of ['article', 'aside', 'nav', 'section', 'main']) {
    const html = `<!doctype html><html><body><main><${tag}><footer id="f">Card footer</footer></${tag}></main></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    const rule = (result.checksResults || []).find((c) => c.ruleId === RULE_ID);
    assert.ok(rule, `expected a result for ${tag}`);
    assert.strictEqual(
      rule.outcome,
      'notApplicable',
      `<footer> inside <${tag}> must not be a contentinfo`
    );
  }
});

test(`${RULE_ID}: an explicit role="contentinfo" is still flagged wherever it is nested`, () => {
  const html = `<!doctype html><html><body><main><footer role="contentinfo" id="c">Real contentinfo</footer></main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'c'));
});
