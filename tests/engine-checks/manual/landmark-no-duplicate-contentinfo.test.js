'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'landmark-no-duplicate-contentinfo';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
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
