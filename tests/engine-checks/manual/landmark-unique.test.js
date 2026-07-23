'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'a11ycore-landmark-unique';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test(`${RULE_ID}: notApplicable when no landmark role has more than one instance`, () => {
  const html = `<!doctype html><html><body><nav>Nav</nav><main>Content</main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when same-role landmarks have distinct names`, () => {
  const html = `<!doctype html><html><body><nav aria-label="Primary">A</nav><nav aria-label="Footer">B</nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when two same-role landmarks are both unnamed`, () => {
  const html = `<!doctype html><html><body><nav id="a">A</nav><nav id="b">B</nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'LANDMARK_NOT_UNIQUE');
});

test(`${RULE_ID}: cantTell when two same-role landmarks share the same name`, () => {
  const html = `<!doctype html><html><body><nav aria-label="Site" id="a">A</nav><nav aria-label="Site" id="b">B</nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: notApplicable when an unnamed explicit-role <form role="search"> is nested inside another unnamed search landmark (found on a real site — europa.eu)`, () => {
  const html = `<!doctype html><html><body>
    <div role="search" id="a"><form role="search" id="b"><input type="search"></form></div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when two named <form role="search"> elements share the same name (the name-gate does not exempt <form> outright)`, () => {
  const html = `<!doctype html><html><body>
    <form role="search" aria-label="Site search" id="a"><input type="search"></form>
    <form role="search" aria-label="Site search" id="b"><input type="search"></form>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: cantTell when two unnamed <aside> elements are direct children of <main> — <main> is not sectioning content and must not suppress <aside>'s implicit complementary role (found on a real site, Know Your Meme's two sidebar asides)`, () => {
  const html = `<!doctype html><html><body>
    <main><aside id="a">First</aside><aside id="b">Second</aside></main>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: notApplicable when a NAMED <aside> is nested inside real sectioning content (an <article>) — the reference engine's own aside() function only suppresses when both nested AND unnamed`, () => {
  const html = `<!doctype html><html><body>
    <article><aside aria-label="Related" id="a">Related content</aside></article>
    <aside aria-label="Related" id="b">Duplicate name, top-level</aside>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: notApplicable when the only "duplicate" of a named nav is display:none (a responsive desktop/mobile pattern) — matches the reference engine's own visibility gate (found on real sites, BuzzFeed/Kraken/weather.com)`, () => {
  const html = `<!doctype html><html><body>
    <nav aria-label="Hot Topics" id="a">Visible</nav>
    <nav aria-label="Hot Topics" id="b" style="display:none">Hidden mobile copy</nav>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when two aria-labelledby'd sections resolve to the same name via a NESTED descendant's aria-label (not the target's own textContent) — found on a real site, UOL's homepage with 6 identically-named "Publicidade" ad-slot regions`, () => {
  const html = `<!doctype html><html><body>
    <section aria-labelledby="lbl1" id="a"><div id="lbl1"><div aria-label="Publicidade"></div></div>Content</section>
    <section aria-labelledby="lbl2" id="b"><div id="lbl2"><div aria-label="Publicidade"></div></div>Content</section>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: notApplicable when same-role landmarks are distinguished only by a title attribute (found on a real site, DuckDuckGo's homepage — one <nav title="navigation">, one unnamed)`, () => {
  const html = `<!doctype html><html><body><nav title="navigation">A</nav><nav>B</nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when two same-role landmarks share the same title (title is a real naming source, not exempt from the duplicate check)`, () => {
  const html = `<!doctype html><html><body><nav title="Site" id="a">A</nav><nav title="Site" id="b">B</nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: cantTell when an unnamed nav inside a shadow root collides with an unnamed page-level nav (found on a real site — Airtable's homepage, 2026-07-23: a third-party Transcend cookie-consent widget renders its own unnamed <nav> inside a shadow root, colliding with the page's own unnamed header <nav>; a plain document.querySelectorAll never sees inside shadow roots, so this was a real, confirmed false negative across all 8 landmark-detection rule files sharing this same query pattern)`, () => {
  const dom = createDom(`<!doctype html><html><body>
    <nav id="a">Page nav</nav>
    <div id="host"></div>
  </body></html>`);
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML = `<nav id="b">Widget nav</nav>`;

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], engineOptions: { includeShadowDom: true } });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><nav id="a">A</nav><nav id="b">B</nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Landmarks with the same role must have unique names');
});

test(`${RULE_ID}: notApplicable when two navs are named via aria-labelledby pointing at a display:none target with distinct text (found on a real site — Discord's footer, 2026-07-23: display:none dropdown-toggle headings still contribute their text per the accname spec's directly-referenced-target exception)`, () => {
  const html = `<!doctype html><html><body>
    <div id="lbl1" style="display:none">Product</div>
    <nav aria-labelledby="lbl1" id="a">First</nav>
    <div id="lbl2" style="display:none">Company</div>
    <nav aria-labelledby="lbl2" id="b">Second</nav>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when two navs are named via aria-labelledby pointing at a display:none target that resolve to the SAME text (the hidden-target bypass makes the name resolve at all, it does not exempt the result from the duplicate check)`, () => {
  const html = `<!doctype html><html><body>
    <div id="lbl1" style="display:none">Site</div>
    <nav aria-labelledby="lbl1" id="a">First</nav>
    <div id="lbl2" style="display:none">Site</div>
    <nav aria-labelledby="lbl2" id="b">Second</nav>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.ok(hasOccurrenceForId(rule, 'b'));
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/landmark-unique-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'landmark-unique-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 12, maxOccurrences: 12 });
  assert.ok(hasOccurrenceForId(rule, 'lu_case_02a'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_02b'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_04a'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_04b'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_05a'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_05b'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_08a'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_08b'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_10a'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_10b'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_12a'));
  assert.ok(hasOccurrenceForId(rule, 'lu_case_12b'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_01a'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_01b'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_03a'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_03b'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_06'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_07a'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_07b'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_09a'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_09b'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_11a'));
  assert.ok(!hasOccurrenceForId(rule, 'lu_case_11b'));
});
