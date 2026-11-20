'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'page-title-present';

function getFirstOccurrence(rule) {
  assert.ok(rule);
  assert.ok(Array.isArray(rule.occurrences));
  assert.ok(rule.occurrences.length > 0, 'Expected at least one occurrence');
  return rule.occurrences[0];
}

function assertOccShape(occ) {
  assert.ok(occ && typeof occ === 'object', 'occurrence must be an object');

  assert.ok(
    typeof occ.selector === 'string' && occ.selector,
    'selector must be a non-empty string'
  );
  assert.ok(typeof occ.html === 'string', 'html snippet must be a string');

  assert.ok(occ.i18n && typeof occ.i18n === 'object', 'occurrence.i18n must exist');
  assert.ok(
    typeof occ.i18n.summaryKey === 'string' && occ.i18n.summaryKey.trim(),
    'occurrence.i18n.summaryKey must be non-empty'
  );
  assert.ok(
    typeof occ.i18n.hintKey === 'string' && occ.i18n.hintKey.trim(),
    'occurrence.i18n.hintKey must be non-empty'
  );
  assert.ok(
    occ.i18n.params && typeof occ.i18n.params === 'object',
    'occurrence.i18n.params must be an object'
  );

  assert.ok(occ.data && typeof occ.data === 'object', 'occurrence.data must exist');
  assert.ok(
    occ.data.visibilityFilter && typeof occ.data.visibilityFilter === 'object',
    'occurrence.data.visibilityFilter must exist'
  );
  assert.ok(
    occ.data.details && typeof occ.data.details === 'object',
    'occurrence.data.details must exist'
  );
  assert.ok(
    typeof occ.data.details.reasonCode === 'string' && occ.data.details.reasonCode.trim(),
    'details.reasonCode must be non-empty'
  );
}

test('fail when <title> is missing entirely', () => {
  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const occ = getFirstOccurrence(rule);
  assertOccShape(occ);

  assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePresent_summary_fail_missing');
  assert.strictEqual(occ.data.details.reasonCode, 'missingTitleElement');
  assert.strictEqual(occ.html, '<title>(missing)</title>');
});

test('fail when <title></title> is empty', () => {
  const html = '<!doctype html><html lang="en"><head><title></title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const occ = getFirstOccurrence(rule);
  assertOccShape(occ);

  assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePresent_summary_fail_empty');
  assert.strictEqual(occ.data.details.reasonCode, 'emptyTitleText');
});

test('fail when <title> is whitespace-only', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>   </title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });

  const occ = getFirstOccurrence(rule);
  assertOccShape(occ);

  assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePresent_summary_fail_empty');
  assert.strictEqual(occ.data.details.reasonCode, 'emptyTitleText');
});

test('pass when <title> is non-empty and inside <head>', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>Acme Contact Support</title></head><body>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/page-title-present-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'page-title-present-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details.reasonCode, 'emptyTitleText');
});

test('pass when <title> is non-empty but ends up outside <head> (in <body>)', () => {
  // Regression test: a <title> encountered after <head> has closed is not
  // re-parented into <head> per HTML parsing rules, but document.title still
  // resolves it. This previously produced a false "missing title" fail.
  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><title>Acme Contact Support</title>Hi</body></html>';

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`page-title-present: notApplicable when contextSelector scopes narrower than the whole document (fragment-scan applicability)`, () => {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>Hi</body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['page-title-present'],
    contextSelector: 'body'
  });
  assertRule(result, 'page-title-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

test(`${RULE_ID}: an inline <svg><title> is not the page title, so the reason is missingTitleElement`, () => {
  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><svg role="img" aria-labelledby="t"><title id="t">Logo</title><rect width="4" height="4"/></svg></body></html>';
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    const occ = getFirstOccurrence(rule);
    assert.strictEqual(occ.data.details.reasonCode, 'missingTitleElement');
    assert.strictEqual(occ.i18n.summaryKey, 'pageTitlePresent_summary_fail_svgOnly');
  }
});

test(`${RULE_ID}: an HTML <title> is found after an inline <svg><title>`, () => {
  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><svg><title>Logo</title></svg><title>Acme Contact Support</title></body></html>';
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`page-title-present: notApplicable when engineOptions.fragment is true, even unscoped`, () => {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>Hi</body></html>`;
  const result = runa11yCoreOnHtml(html, {
    runOnly: ['page-title-present'],
    engineOptions: { fragment: true }
  });
  assertRule(result, 'page-title-present', 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
});

// An SVG file opened on its own is not an HTML page: its title is its own
// <title> child, and there is no <head> to put one in (#150).
test('page-title-present: an SVG document is notApplicable', () => {
  const { JSDOM } = require('jsdom');
  const { runDomRulesInPage } = require('../../../src/index.js');
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><title>Sales chart</title><text x="10" y="50">Sales up 10%</text></svg>';
  const dom = new JSDOM(svg, { contentType: 'image/svg+xml', url: 'https://example.test/a.svg' });
  const saved = [global.window, global.document];
  global.window = dom.window;
  global.document = dom.window.document;
  try {
    const result = runDomRulesInPage(null, null, {}, ['page-title-present']);
    assertRule(result, 'page-title-present', 'notApplicable', {
      minOccurrences: 0,
      maxOccurrences: 0
    });
  } finally {
    [global.window, global.document] = saved;
  }
});

// The selector names the element the finding is about: the title itself,
// the first of several, or, with none, <head> where it belongs, or <html>
// without a <head>.
function resolve(html, selector) {
  return [...new JSDOM(html).window.document.querySelectorAll(selector)];
}

test(`${RULE_ID}: each finding's selector names its own element`, () => {
  const noTitle =
    '<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>Hi</body></html>';
  let occ = getFirstOccurrence(runa11yCoreOnHtml(noTitle, { runOnly: [RULE_ID] }).checksResults[0]);
  assert.deepEqual(
    resolve(noTitle, occ.selector).map((e) => e.localName),
    ['head']
  );

  const twoEmpty =
    '<!doctype html><html lang="en"><head><title id="a"></title><title id="b">x</title></head><body>Hi</body></html>';
  occ = getFirstOccurrence(runa11yCoreOnHtml(twoEmpty, { runOnly: [RULE_ID] }).checksResults[0]);
  assert.deepEqual(
    resolve(twoEmpty, occ.selector).map((e) => e.id),
    ['a']
  );
});

test(`${RULE_ID}: with no <head>, the finding points at <html>`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
  const dom = createDom('<!doctype html><html lang="en"><head></head><body>Hi</body></html>');
  const doc = dom.window.document;
  doc.documentElement.removeChild(doc.head);
  const result = runa11yCoreOnDom(dom, { runOnly: [RULE_ID] });
  const occ = getFirstOccurrence(result.checksResults[0]);
  assert.equal(occ.selector, 'html');
  assert.deepEqual([...doc.querySelectorAll(occ.selector)], [doc.documentElement]);
});

test(`${RULE_ID}: a fail says when the only <title> is an svg's, or a later <title> has the text`, () => {
  const svgOnly = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head></head><body><svg><title>Logo</title></svg></body></html>',
    { runOnly: [RULE_ID] }
  );
  const a = assertRule(svgOnly, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 })
    .occurrences[0];
  assert.equal(a.i18n.summaryKey, 'pageTitlePresent_summary_fail_svgOnly');
  assert.equal(
    a.summary,
    'This page has no <title> element of its own: the only <title> ("Logo") is inside an <svg>, where it names the graphic.'
  );
  assert.equal(a.data.details.reasonCode, 'missingTitleElement');

  const later = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title></title><title>Shop</title></head><body></body></html>',
    { runOnly: [RULE_ID] }
  );
  const b = assertRule(later, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 })
    .occurrences[0];
  assert.equal(b.i18n.hintKey, 'pageTitlePresent_hint_fail_laterTitle');
  assert.equal(
    b.hint,
    'Browsers use the first <title>, which is empty; the later <title> ("Shop") is ignored. Remove the empty one, or put the title text in it.'
  );
  assert.equal(b.data.details.reasonCode, 'emptyTitleText');
});
