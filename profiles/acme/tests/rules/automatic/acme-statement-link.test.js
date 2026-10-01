'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../../../../tests/helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../../../../tests/helpers/runDomRulesOnHtml.js');

const RULE_ID = 'acme-statement-link';

const page = (body) =>
  '<!doctype html><html lang="en"><head><title>t</title></head><body>' +
  `<main><h1>Title</h1></main>${body}</body></html>`;
const NAV = '<nav><a href="/accessibility">Accessibility statement</a></nav>';
const FOOTER = '<footer><a href="/legal/a11y">Accessibility statement</a></footer>';

// The rule runs under ACME's profiles, so each test names one.
function scan(html, engineOptions = { profile: 'acme-2.0' }, options = {}) {
  return runa11yCoreOnHtml(html, { engineOptions, ...options });
}

test(`${RULE_ID}: a page with no statement link fails`, () => {
  const rule = assertRule(scan(page('')), RULE_ID, 'fail', { maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'STATEMENT_LINK_MISSING');
});

test(`${RULE_ID}: a link in the footer passes, found by its text`, () => {
  assertRule(scan(page(FOOTER)), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: a link found by its URL path passes, whatever its text`, () => {
  const html = page('<footer><a href="/accessibility/">Our promise</a></footer>');
  assertRule(scan(html), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: the Spanish default text is accepted`, () => {
  const html = page('<footer><a href="/x">Declaración de accesibilidad</a></footer>');
  assertRule(scan(html), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: ACME 2.0 wants the link in the footer, ACME 1.0 anywhere`, () => {
  const rule = assertRule(scan(page(NAV)), RULE_ID, 'fail', { maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'STATEMENT_LINK_NOT_IN_FOOTER');
  assertRule(scan(page(NAV), { profile: 'acme-1.0' }), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: a <footer> inside an article is not the page footer`, () => {
  const html = page(`<article><p>News</p>${FOOTER}</article>`);
  assertRule(scan(html), RULE_ID, 'fail', { maxOccurrences: 1 });
});

test(`${RULE_ID}: the accepted texts come from engineOptions.rules (ctx.config)`, () => {
  const html = page('<footer><a href="/x">Our access promise</a></footer>');
  assertRule(scan(html), RULE_ID, 'fail', { maxOccurrences: 1 });
  const configured = {
    profile: 'acme-2.0',
    rules: { [RULE_ID]: { linkTexts: ['access promise'] } }
  };
  assertRule(scan(html, configured), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: a scoped run is notApplicable`, () => {
  const result = scan(page(''), { profile: 'acme-2.0' }, { contextSelector: 'main' });
  assertRule(result, RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: no default or WCAG run includes it`, () => {
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }, { profile: 'rgaa-4.1.2' }]) {
    const result = scan(page(''), engineOptions);
    assert.equal(
      result.checksResults.find((r) => r.ruleId === RULE_ID),
      undefined,
      JSON.stringify(engineOptions)
    );
  }
});

// Finding F9 (DESIGN.md): a rule cannot tell which version of its standard
// is targeted. It reads engineOptions.profile, so selecting ACME's rules any
// other way gives 1.0's behaviour.
test(`${RULE_ID}: F9, as it stands: selected by tag, the footer rule does not apply`, () => {
  assertRule(scan(page(NAV), { optInRules: 'acme' }), RULE_ID, 'pass', { maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (fixtures/acme-statement-link-all-scenarios.html)`, () => {
  // Whole-document rule: the fixture shows the not-in-footer branch only.
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', `${RULE_ID}-all-scenarios.html`),
    'utf8'
  );
  const rule = assertRule(scan(html), RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'STATEMENT_LINK_NOT_IN_FOOTER');
  assertRule(scan(html, { profile: 'acme-1.0' }), RULE_ID, 'pass', { maxOccurrences: 0 });
});
