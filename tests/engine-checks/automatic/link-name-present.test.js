'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let runa11yCoreOnHtml;
let createDom;
let runa11yCoreOnDom;
let assertRule;

try {
  ({ runa11yCoreOnHtml, createDom, runa11yCoreOnDom } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {
  // Repo layout fallback
}

const RULE_ID = 'link-name-present';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
}

test('link-name-present: no applicable elements => notApplicable', () => {
  const html = `
<!doctype html><html><body>
  <div>no links</div>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'link-name-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('link-name-present: missing name => fail', () => {
  const html = `
<!doctype html><html><body>
  <a href="/x" aria-label=""></a>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'link-name-present', 'fail', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
});

test('link-name-present: named link => pass', () => {
  const html = `
<!doctype html><html><body>
  <a href="/x">Read more</a>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'link-name-present', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test('link-name-present: named via a child image with alt="" but aria-labelledby pointing to real text => pass', () => {
  // Regression for a real false positive found via a live-DOM cross-engine
  // run 2026-07-21: eBay's product-card links wrap an
  // <img alt="" aria-labelledby="..."> (empty alt, correctly marking the
  // image itself decorative, but ALSO pointing to the real product-title
  // text elsewhere on the page). The shared getContentNameInfo helper
  // (src/core/dom-helpers.js) only ever checked the image's plain `alt`
  // value when computing what an image-like descendant contributes to a
  // parent's content name, missing aria-labelledby/aria-label entirely -
  // per the accname spec (HTML-AAM), those take priority over alt. Fixed
  // by checking the image's own full accessible name first, falling back
  // to alt only if that is empty.
  const html = `
<!doctype html><html><body>
  <span id="lbl">Sony Wireless Headphones</span>
  <a href="/item/1"><img alt="" aria-labelledby="lbl"></a>
</body></html>
  `;

  if (!runa11yCoreOnHtml || !assertRule) {
    assert.ok(true);
    return;
  }

  const result = runa11yCoreOnHtml(html);
  assertRule(result, 'link-name-present', 'pass', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: named via light-DOM text distributed into an unnamed shadow-DOM <slot> => pass`, () => {
  // Regression for a real false positive found via a live-DOM cross-engine
  // run 2026-07-22: Shoelace's <sl-button> renders its shadow-DOM internal
  // <a part="base"> wrapping three EMPTY <slot> elements (prefix/label/
  // suffix); the button's real accessible name is a plain light-DOM text
  // node ("Follow") with no slot="" attribute, so it's distributed into the
  // unnamed middle slot. getContentNameInfo's descendant walk used each
  // <slot>'s own childNodes (fallback content only, empty here) instead of
  // its assignedNodes({flatten:true}) (what's actually rendered/exposed to
  // the accessibility tree), so it found nothing — a real false positive on
  // any component library that projects a control's label via <slot>.
  if (!createDom || !runa11yCoreOnDom || !assertRule) { assert.ok(true); return; }

  const dom = createDom(`<!doctype html><html><body>
    <div id="host"><span slot="prefix" aria-hidden="true">icon</span>Follow</div>
  </body></html>`);
  const host = dom.window.document.getElementById('host');
  host.attachShadow({ mode: 'open' }).innerHTML =
    `<a part="base" href="https://example.test/"><slot name="prefix"></slot><slot part="label"></slot></a>`;

  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID], engineOptions: { includeShadowDom: true } });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role overrides <a href> to a value-role and only content is present (same class of bug as button-name-present's Spotify finding, different host tag)`, () => {
  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const html = `<!doctype html><html><body><a href="/x" role="combobox">List</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: pass when role overrides <a href> to a value-role but aria-label is present`, () => {
  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const html = `<!doctype html><html><body><a href="/x" role="combobox" aria-label="Sort order">List</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/link-name-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'link-name-present-all-scenarios.html');
  const html = fs.readFileSync(fixturePath, 'utf8');

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 10, maxOccurrences: 10 });

  const expectedFailIds = [
    'link_case_01', 'link_case_08b', 'link_case_09', 'link_case_10', 'link_case_11', 'link_case_13', 'link_case_15c', 'link_case_16', 'link_case_20',
    'link_case_24'
  ];

  const expectedNoOccIds = [
    'link_case_02', 'link_case_03', 'link_case_04', 'link_case_05', 'link_case_06', 'link_case_12', 'link_case_14',
    'link_case_15b', 'link_case_15d', 'link_case_15e', 'link_case_15f', 'link_case_15g', 'link_case_15h',
    'link_case_21', 'link_case_22', 'link_case_23', 'link_case_25'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
