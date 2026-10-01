'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');
const { runa11yCoreInPage } = require('../../../../../src/index.js');

const RULE_ID = 'page-language-present';
const RUN = { runOnly: { includeRuleIds: [RULE_ID] } };
const RGAA = { engineOptions: { profile: 'rgaa-4.1.2' } };

const XHTML11 =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">';
const XHTML10 =
  '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';

function page(body, htmlAttrs = '', doctype = '<!doctype html>') {
  return `${doctype}<html${htmlAttrs}><head><title>t</title></head><body>${body}</body></html>`;
}

const run = (html, opts = RUN) => runa11yCoreOnHtml(html, opts);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const reason = (rule) => rule.occurrences[0].data.details.reasonCode;

test(`${RULE_ID}: lang on <html> passes, whatever the doctype`, () => {
  for (const doctype of ['<!doctype html>', XHTML10, XHTML11, '']) {
    assertRule(run(page('<p>Hello</p>', ' lang="en"', doctype)), RULE_ID, 'pass', {
      maxOccurrences: 0
    });
  }
});

// 8.3.1 second condition: the language on each text or one of its parents.
test(`${RULE_ID}: a language on <body> or on every text's container passes`, () => {
  for (const body of [
    '<div lang="en"><p>Hello</p><p>World</p></div>',
    '<p lang="en">Hello</p><p lang="fr">Bonjour</p>',
    '<p lang="en">Hello</p><p hidden>Not rendered</p><script>var x = 1;</script>',
    '<p lang="en">Hello</p><div style="display:none"><p>Not rendered</p></div>'
  ]) {
    assertRule(run(page(body)), RULE_ID, 'pass', { maxOccurrences: 0 });
  }
  const bodyLang = page('<p>Hello</p>').replace('<body>', '<body lang="en">');
  assertRule(run(bodyLang), RULE_ID, 'pass');
});

test(`${RULE_ID}: a page with no language anywhere fails`, () => {
  for (const html of [page('<p>Hello</p>'), page('<p>Hello</p>', ' lang=""'), page('')]) {
    const rule = assertRule(run(html), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
    assert.equal(reason(rule), 'missingLanguage');
    assert.equal(rule.occurrences[0].selector, 'html');
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'pageLanguagePresent_summary_fail_missingLanguage'
    );
  }
});

test(`${RULE_ID}: text outside every element with a language fails`, () => {
  for (const body of [
    '<p lang="en">Hello</p><p>World</p>',
    '<div lang="en"><p>Hello</p></div><p lang="">World</p>',
    // aria-hidden text is still on screen.
    '<p lang="en">Hello</p><p aria-hidden="true">World</p>'
  ]) {
    const rule = assertRule(run(page(body)), RULE_ID, 'fail', { minOccurrences: 1 });
    assert.equal(reason(rule), 'uncoveredText');
    assert.equal(rule.occurrences[0].data.details.element, 'p');
    assert.equal(
      rule.occurrences[0].summary,
      'Some text of the page has no language: neither <html> nor any of its parents has a lang or xml:lang attribute.'
    );
  }
});

// XHTML 1.1 asks for xml:lang on <html> (8.3.1 methodology).
test(`${RULE_ID}: xml:lang alone passes on XHTML 1.1`, () => {
  assertRule(run(page('<p>Hello</p>', ' xml:lang="en"', XHTML11)), RULE_ID, 'pass');
  assertRule(run(page('<div xml:lang="en"><p>Hello</p></div>', '', XHTML11)), RULE_ID, 'pass');
});

test(`${RULE_ID}: xml:lang alone passes on a page parsed as XML`, () => {
  const xhtml =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en"><head><title>t</title></head>' +
    '<body><p>Hello</p></body></html>';
  const dom = new JSDOM(xhtml, {
    url: 'https://example.test/',
    contentType: 'application/xhtml+xml',
    pretendToBeVisual: true
  });
  global.window = dom.window;
  global.document = dom.window.document;
  const result = runa11yCoreInPage(null, null, {}, RUN.runOnly);
  assertRule(result, RULE_ID, 'pass');
});

// The glossary "Langue par défaut" makes lang mandatory for HTML5 and HTML 4,
// and both attributes for XHTML 1.0 served as text/html, while the test's
// wording accepts « lang et/ou xml:lang ».
test(`${RULE_ID}: xml:lang alone asks on HTML5, HTML 4 and XHTML 1.0`, () => {
  const html4 =
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">';
  for (const doctype of ['<!doctype html>', html4, XHTML10]) {
    const rule = assertRule(
      run(page('<p>Hello</p>', ' xml:lang="en"', doctype)),
      RULE_ID,
      'cantTell',
      { minOccurrences: 1, maxOccurrences: 1 }
    );
    assert.equal(reason(rule), 'xmlLangOnly');
    assert.equal(
      rule.occurrences[0].i18n.summaryKey,
      'pageLanguagePresent_summary_cantTell_xmlLangOnly'
    );
    assert.equal(rule.occurrences[0].uncertainty.code, 'spec-only');
  }
  const onText = assertRule(run(page('<p xml:lang="en">Hello</p>')), RULE_ID, 'cantTell');
  assert.equal(onText.occurrences[0].data.details.location, 'text');
});

test(`${RULE_ID}: a scoped or fragment run is not applicable`, () => {
  const html = page('<main><p>Hello</p></main>');
  assertRule(run(html, { ...RUN, contextSelector: 'main' }), RULE_ID, 'notApplicable');
  assertRule(run(html, { ...RUN, engineOptions: { fragment: true } }), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: messages follow the scan locale`, () => {
  const rule = assertRule(
    run(page('<p>Hello</p>'), { ...RUN, engineOptions: { locale: 'fr' } }),
    RULE_ID,
    'fail'
  );
  assert.equal(
    rule.occurrences[0].summary,
    'La page n’indique aucune langue par défaut : aucun élément n’a d’attribut lang ou xml:lang.'
  );
});

test(`${RULE_ID}: opt-in, so a default, WCAG or EN 301 549 run does not include it`, () => {
  const html = page('<p>Hello</p>');
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v4.1.1' }]) {
    const result = runa11yCoreOnHtml(html, { engineOptions });
    assert.ok(
      !result.checksResults.some((r) => r.ruleId === RULE_ID),
      JSON.stringify(engineOptions)
    );
  }
});

test(`${RULE_ID}: the RGAA profile, the rgaa tag and the 8.3 rollup id run it`, () => {
  const html = page('<p>Hello</p>');
  for (const opts of [
    RGAA,
    { engineOptions: { tags: { include: 'rgaa' } } },
    { engineOptions: { rules: { include: 'rgaa-4.1.2-8.3' } } }
  ]) {
    const rule = runa11yCoreOnHtml(html, opts).checksResults.find((r) => r.ruleId === RULE_ID);
    assert.ok(rule, JSON.stringify(opts));
    assert.equal(rule.outcome, 'fail');
  }
});

// html-lang-attr-present fails a page whose language is on <body>; 8.3.1
// passes it. Both views come out of the same RGAA run.
test(`${RULE_ID}: RGAA 8.3 passes a <body lang> page that WCAG 3.1.1 fails`, () => {
  const html = page('<main><p>Hello</p></main>').replace('<body>', '<body lang="en">');
  const result = runa11yCoreOnHtml(html, RGAA);
  assert.equal(rollup(result, 'rgaa-4.1.2-8.3').outcome, 'pass');
  assert.deepEqual(rollup(result, 'rgaa-4.1.2-8.3').data.details.checksIds, [RULE_ID]);
  assert.equal(rollup(result, 'wcag-3.1.1-language-of-page').outcome, 'fail');
});

test(`${RULE_ID}: RGAA 8.3 passes an XHTML 1.1 xml:lang page that WCAG 3.1.1 fails`, () => {
  const result = runa11yCoreOnHtml(
    page('<main><p>Hello</p></main>', ' xml:lang="en"', XHTML11),
    RGAA
  );
  assert.equal(rollup(result, 'rgaa-4.1.2-8.3').outcome, 'pass');
  assert.equal(rollup(result, 'wcag-3.1.1-language-of-page').outcome, 'fail');
});

test(`${RULE_ID}: RGAA 8.3 and WCAG 3.1.1 agree on a page with no language, and on lang="en"`, () => {
  const none = runa11yCoreOnHtml(page('<main><p>Hello</p></main>'), RGAA);
  assert.equal(rollup(none, 'rgaa-4.1.2-8.3').outcome, 'fail');
  assert.equal(rollup(none, 'wcag-3.1.1-language-of-page').outcome, 'fail');
  const en = runa11yCoreOnHtml(page('<main><p>Hello</p></main>', ' lang="en"'), RGAA);
  assert.equal(rollup(en, 'rgaa-4.1.2-8.3').outcome, 'pass');
  assert.equal(rollup(en, 'wcag-3.1.1-language-of-page').outcome, 'pass');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/${RULE_ID}-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`);
  const html = fs.readFileSync(fixturePath, 'utf8');
  assertRule(run(html), RULE_ID, 'pass', { maxOccurrences: 0 });
  assertRule(
    runa11yCoreOnHtml(html, { runOnly: { includeRuleIds: ['html-lang-attr-present'] } }),
    'html-lang-attr-present',
    'fail'
  );
});
