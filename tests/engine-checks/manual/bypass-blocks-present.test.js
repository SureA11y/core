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

const RULE_ID = 'bypass-blocks-present';

// This is a manual (cantTell-capped) rule: a recognized bypass mechanism ->
// notApplicable ("nothing to review"); no detectable mechanism -> cantTell
// ("verify a mechanism exists"), never a hard fail. See the rule's
// implementation-notes for why the no-mechanism case is not high-confidence.

test(`${RULE_ID}: notApplicable when a <main> landmark is present`, () => {
  const html = `<!doctype html><html><body><nav>Nav</nav><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role="main" is present`, () => {
  const html = `<!doctype html><html><body><nav>Nav</nav><div role="main">Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when a working same-page anchor link is present`, () => {
  const html = `<!doctype html><html><body><a href="#content">Skip to content</a><nav>Nav</nav><div id="content">Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when a legacy <a name> anchor target is present`, () => {
  const html = `<!doctype html><html><body><a href="#content">Skip</a><nav>Nav</nav><a name="content"></a><div>Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when at least one heading is present`, () => {
  const html = `<!doctype html><html><body><nav>Nav</nav><h1>Title</h1><div>Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when an anchor link's target does not resolve and there is no other mechanism`, () => {
  const html = `<!doctype html><html><body><a href="#missing">Skip</a><nav>Nav</nav><div>Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: cantTell when the only <main> sits inside a display:none ancestor (same non-rendered-content gap as page-has-heading-one's CDC finding)`, () => {
  const html = `<!doctype html><html><body><nav>Nav</nav><div style="display:none"><main>Content</main></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: cantTell when the only heading sits inside a display:none ancestor and no other mechanism exists`, () => {
  const html = `<!doctype html><html><body><nav>Nav</nav><div style="display:none"><h1>Title</h1></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when the only <main> is visually clipped off-screen but remains in the accessibility tree (must NOT regress)`, () => {
  const html = `<!doctype html><html><body><nav>Nav</nav><main style="position:absolute;clip-path:inset(50%);visibility:visible">Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the only heading is positioned off-screen (ACT 047fe0: heading navigation is not equivalent for sighted keyboard users if the heading isn't visible)`, () => {
  const html = `<!doctype html><html><body>
    <nav id="chapters-navigation"><ol><li><a>Chapter 1</a></li><li><a href="/chapter2.html">Chapter 2</a></li></ol></nav>
    <div id="main"><h1 style="position:absolute;top:-9999px;left:-9999px;">Three Kingdoms</h1><p>Unity succeeds division.</p></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: cantTell when no landmark, anchor link, or heading exists`, () => {
  const html = `<!doctype html><html><body><nav>Nav</nav><div>Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'BYPASS_MECHANISM_ABSENT');
});

test(`${RULE_ID}: shadow-aware — a skip link and its target inside the same shadow root count as a mechanism`, () => {
  if (!createDom || !runa11yCoreOnDom) {
    assert.ok(true);
    return;
  }
  // Light DOM has no main/heading/resolvable-anchor; the ONLY bypass mechanism
  // (a working same-page anchor link + its target) lives inside a shadow root.
  // The raw document.querySelectorAll/getElementById path this rule used before
  // never pierced shadow roots, so this page would have wrongly been flagged.
  const dom = createDom(
    `<!doctype html><html><body><nav>Nav</nav><div id="host"></div></body></html>`
  );
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML =
    `<a href="#c">Skip</a><nav>Repeated</nav><div id="c">Content</div>`;

  const result = runa11yCoreOnDom(dom, {
    runOnly: [RULE_ID],
    engineOptions: { includeShadowDom: true }
  });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><nav>Nav</nav><div>Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page must provide a way to bypass repeated blocks');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/bypass-blocks-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'bypass-blocks-present-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'BYPASS_MECHANISM_ABSENT');
});

test(`bypass-blocks-present: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html><body><a href="#missing">Skip</a><nav>Nav</nav><div>Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['bypass-blocks-present'],
    contextSelector: 'body'
  });
  assertRule(result, 'bypass-blocks-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`bypass-blocks-present: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html><body><a href="#missing">Skip</a><nav>Nav</nav><div>Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['bypass-blocks-present'],
    engineOptions: { fragment: true }
  });
  assertRule(result, 'bypass-blocks-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});
