'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'region';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when all top-level content is inside a landmark`, () => {
  const html = `<!doctype html><html><body><header>H</header><main>Content</main><footer>F</footer></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when body has no text-bearing children`, () => {
  const html = `<!doctype html><html><body><script>1;</script></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a direct child of body has text but is not a landmark`, () => {
  const html = `<!doctype html><html><body><main>Content</main><p id="a">Stray</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'CONTENT_OUTSIDE_LANDMARK');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><p id="a">Stray</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page content should be inside a landmark region');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/region-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'region-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'rg_case_01'));
});

test(`region: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><body><main>Content</main><p id="a">Stray</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['region'], contextSelector: 'body' });
  assertRule(result, 'region', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`region: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><body><main>Content</main><p id="a">Stray</p></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['region'],
    engineOptions: { fragment: true }
  });
  assertRule(result, 'region', 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// --- Recursive walk (2026-08-01): a modern framework's single root mount
// div is the single most common real-world <body> shape (confirmed present
// as the ONLY direct <body> child on 37 of ~90 pages in the cross-engine
// comparisons project's real-world corpus) -- the check must recurse
// through it rather than treating it as one opaque top-level candidate.

test(`${RULE_ID}: recurses through a single SPA-style root wrapper div to find the real landmarks and the real gap`, () => {
  const html = `<!doctype html><html><body><div id="root">
    <header>Site header</header>
    <div class="content-wrap">
      <p id="orphan1">Stray paragraph one.</p>
      <p id="orphan2">Stray paragraph two, right next to it.</p>
    </div>
    <main>Real content</main>
    <footer>Site footer</footer>
  </div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  // Both orphan paragraphs collapse into their shared, tightest-possible
  // ancestor (.content-wrap) -- not the whole #root wrapper (which also
  // legitimately contains the header/main/footer landmarks).
  assert.ok(rule.occurrences[0].html.includes('id="orphan1"'));
  assert.ok(rule.occurrences[0].html.includes('id="orphan2"'));
  assert.ok(!rule.occurrences[0].html.includes('Site header'));
  assert.ok(!rule.occurrences[0].html.includes('Real content'));
});

test(`${RULE_ID}: notApplicable when a single SPA-style root div's content is entirely landmarked`, () => {
  const html = `<!doctype html><html><body><div id="root"><header>H</header><main>Content</main><footer>F</footer></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a floating button outside any landmark is exempt (deliberate scope choice)`, () => {
  const html = `<!doctype html><html><body><main>Content</main><button>Back to top</button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an open dialog outside any landmark is exempt (it's its own modal context)`, () => {
  const html = `<!doctype html><html><body><main>Content</main><div role="dialog" aria-label="x">Modal text</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a live region (role=status) outside any landmark is exempt (self-contained announced area)`, () => {
  const html = `<!doctype html><html><body><main>Content</main><div role="status">Saved!</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an <svg> outside any landmark is exempt (decorative/icon graphics, not text content)`, () => {
  const html = `<!doctype html><html><body><main>Content</main><svg><text>icon label</text></svg></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a resolvable "skip to content" link outside any landmark is exempt`, () => {
  const html = `<!doctype html><html><body><a href="#main">Skip to content</a><main id="main">Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a skip-link-shaped anchor with an unresolvable target is NOT exempt (not a real skip link)`, () => {
  const html = `<!doctype html><html><body><main>Content</main><a href="#nope">Broken anchor text</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(
    hasOccurrenceForId(rule, 'nope') || rule.occurrences[0].html.includes('Broken anchor text')
  );
});

test(`${RULE_ID}: an empty, non-text focus-trap sentinel div (MUI-style <div tabindex="0">) is never flagged (no own content, no false positive)`, () => {
  const html = `<!doctype html><html><body><main>Content</main><div tabindex="0" data-testid="sentinelStart"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});
