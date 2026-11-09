'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'page-zones-landmark';

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
const run = (body, options = {}) =>
  runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID], ...options });
const codes = (rule) => (rule.occurrences || []).map((o) => o.data.details.reasonCode);

test(`${RULE_ID}: a page whose zones are landmarks passes`, () => {
  for (const body of [
    '<header><a href="/">Site</a></header><nav class="menu"><a href="/a">A</a><a href="/b">B</a></nav><main><p>x</p><search><form><input type="search" name="q"></form></search></main><footer class="footer">(c)</footer>',
    // A role on any element, or on a block around or inside the named one.
    '<div role="banner" class="header">Site</div><div class="menu"><ul role="navigation"><li><a href="/a">A</a></li><li><a href="/b">B</a></li></ul></div><main><form role="search"><input name="q"></form></main><div role="contentinfo" id="footer">(c)</div>',
    // A <header> in an article is the article's, when the page has its own.
    '<header>Site</header><main><article><header><h1>Post</h1></header><p>x</p><footer>By me</footer></article></main><footer>(c)</footer>'
  ]) {
    assertRule(run(body), RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: a page with no zone to judge is notApplicable`, () => {
  for (const body of [
    '<main><p>x</p></main>',
    // A "menu" with one link is no navigation; "menuitem" and "headerless" are no zone's name.
    '<main><p>x</p><div class="menu"><a href="/a">A</a></div><div class="menuitem headerless">y</div></main>'
  ]) {
    assertRule(run(body), RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: blocks named as zones that are no landmark are asked about`, () => {
  const rule = assertRule(
    run(
      '<div class="site-header"><a href="/">Site</a><ul class="menu"><li><a href="/a">A</a></li><li><a href="/b">B</a></li></ul></div><main><p>x</p><form><input name="q"></form></main><div id="pied-de-page">(c)</div>'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 4, maxOccurrences: 4 }
  );
  assert.deepEqual(codes(rule), [
    'BANNER_NOT_EXPOSED',
    'NAVIGATION_NOT_EXPOSED',
    'CONTENTINFO_NOT_EXPOSED',
    'SEARCH_NOT_EXPOSED'
  ]);
  assert.deepEqual(
    rule.occurrences.map((o) => o.data.details.zone),
    ['banner', 'navigation', 'contentinfo', 'search']
  );
});

test(`${RULE_ID}: a page header or footer nested in a section, with none at the top, is asked about`, () => {
  const rule = assertRule(
    run('<main><header><a href="/">Site</a></header><p>x</p><footer>(c)</footer></main>'),
    RULE_ID,
    'cantTell',
    { minOccurrences: 2, maxOccurrences: 2 }
  );
  assert.deepEqual(codes(rule), ['HEADER_NESTED', 'FOOTER_NESTED']);
  // With a banner and a contentinfo on the page, nested ones are the sections' own.
  assertRule(
    run(
      '<header>Site</header><main><section><header><h2>Part</h2></header><footer>Note</footer></section></main><footer>(c)</footer>'
    ),
    RULE_ID,
    'pass'
  );
});

test(`${RULE_ID}: only the outermost block of a zone is asked about, and a hidden one not at all`, () => {
  const rule = assertRule(
    run(
      '<div class="header"><div class="header-inner masthead">Site</div></div><main><p>x</p></main>'
    ),
    RULE_ID,
    'cantTell',
    { minOccurrences: 1, maxOccurrences: 1 }
  );
  assert.match(rule.occurrences[0].html, /class="header"/);
  assertRule(
    run('<div class="header" hidden>Site</div><main><p>x</p></main>'),
    RULE_ID,
    'notApplicable'
  );
});

test(`${RULE_ID}: a fragment or a scoped scan is notApplicable`, () => {
  const body = '<div class="site-header">Site</div><main><p>x</p></main>';
  assertRule(run(body, { engineOptions: { fragment: true } }), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/page-zones-landmark-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'page-zones-landmark-all-scenarios.html'
  );
  const result = runa11yCoreOnHtml(fs.readFileSync(fixturePath, 'utf8'), { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });
  for (const id of ['pzl_case_01a', 'pzl_case_01b', 'pzl_case_01c', 'pzl_case_01d']) {
    assert.ok(
      rule.occurrences.some((o) => o.html.includes(`id="${id}"`)),
      `${id} is asked about`
    );
  }
});
