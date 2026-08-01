'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
const { runDomRulesInPage } = require('../../../src/index.js');

const RULE_ID = 'landmark-no-duplicate-contentinfo';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

// Same gap as landmark-no-duplicate-banner's identical structure: everything
// above runs through runa11yCoreOnHtml/runa11yCoreOnDom (toString-embedded),
// uncounted by Node's --experimental-test-coverage, and the generic parity
// harness's fixture only has two plain <footer>s. Exercise the real gaps via
// runDomRulesInPage.
function runNode(html) {
  createDom(html);
  return runDomRulesInPage('https://example.test/', null, {}, { includeRuleIds: [RULE_ID] });
}

function ruleFrom(result) {
  return result.checksResults.find((r) => r.ruleId === RULE_ID);
}

test(`${RULE_ID}: notApplicable when no contentinfo is present`, () => {
  const html = `<!doctype html><html><body><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when there is exactly one contentinfo`, () => {
  const html = `<!doctype html><html><body><footer>Site footer</footer></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell with one occurrence per contentinfo when more than one exists`, () => {
  const html = `<!doctype html><html><body><footer id="a">First</footer><footer id="b">Second</footer></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_DUPLICATE_CONTENTINFO');
});

test(`${RULE_ID}: cantTell when a <footer> nested inside an ancestor whose role has been overridden away from a landmark-scoping role (<aside role="dialog">) still keeps its implicit contentinfo role and collides with a top-level footer (mirrors a real bug found on handsontable.com's docs-assistant side panel, banner/<header> variant)`, () => {
  const html = `<!doctype html><html><body>
    <footer id="a">Site footer</footer>
    <aside role="dialog" aria-label="Assistant panel"><footer id="b">Panel footer</footer></aside>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: notApplicable when a <footer> is nested inside a plain (no role override) <aside> — the ancestor's bare tag still suppresses contentinfo exactly as before, only an explicit role override on the ancestor changes the outcome`, () => {
  const html = `<!doctype html><html><body>
    <footer id="a">Site footer</footer>
    <aside aria-label="Related"><footer id="b">Not a landmark</footer></aside>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the only "duplicate" contentinfo is display:none (a responsive desktop/mobile pattern) — matches a reference engine's own visibility gate (same fix applied to the sibling banner/main rules after real hidden-duplicate false positives on Trello and Zoom)`, () => {
  const html = `<!doctype html><html><body>
    <footer id="a">Visible</footer>
    <footer id="b" style="display:none">Hidden duplicate</footer>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when a second contentinfo landmark lives inside a shadow root (found on a real site — Airtable's homepage, 2026-07-23: a third-party Transcend cookie-consent widget renders its own <footer> inside a shadow root, colliding with the page's own footer; a plain document.querySelectorAll never sees inside shadow roots, so this was a real, confirmed false negative — surea11y reported no violation at all while a widely-used reference engine, running against the real browser DOM, correctly caught it)`, () => {
  const dom = createDom(`<!doctype html><html><body>
    <footer id="a">Page footer</footer>
    <div id="host"></div>
  </body></html>`);
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = `<footer id="b">Widget footer</footer>`;

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], engineOptions: { includeShadowDom: true } });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><footer id="a">First</footer><footer id="b">Second</footer></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Page must not have more than one contentinfo landmark');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/landmark-no-duplicate-contentinfo-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'landmark-no-duplicate-contentinfo-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'ndc_case_01a'));
  assert.ok(hasOccurrenceForId(rule, 'ndc_case_01b'));
});

test(`${RULE_ID} (node runtime): explicit role="contentinfo" duplicates are detected the same as implicit <footer>`, () => {
  const html = `<!doctype html><html><body><div id="a" role="contentinfo">A</div><div id="b" role="contentinfo">B</div></body></html>`;
  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 2);
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID} (node runtime): other landmark tags/roles (header, main, nav, named aside/section/form) are never mistaken for a contentinfo`, () => {
  const html = `<!doctype html><html><body>
    <footer id="a">First</footer>
    <footer id="b">Second</footer>
    <header>Site header</header>
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

test(`${RULE_ID} (node runtime): a <footer> nested inside a role-overridden ancestor still collides`, () => {
  const html = `<!doctype html><html><body>
    <footer id="a">Site footer</footer>
    <aside role="dialog" aria-label="Assistant panel"><footer id="b">Panel footer</footer></aside>
  </body></html>`;
  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'cantTell');
  assert.strictEqual(rule.occurrences.length, 2);
});

test(`${RULE_ID} (node runtime): a display:none duplicate footer is excluded (not exposed to AT)`, () => {
  const html = `<!doctype html><html><body>
    <footer id="a">Visible</footer>
    <footer id="b" style="display:none">Hidden duplicate</footer>
  </body></html>`;
  const result = runNode(html);
  const rule = ruleFrom(result);
  assert.ok(rule);
  assert.strictEqual(rule.outcome, 'notApplicable');
  assert.strictEqual(rule.occurrences.length, 0);
});
