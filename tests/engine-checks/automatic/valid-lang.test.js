'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'valid-lang';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no non-root element has a lang attribute`, () => {
  const html = `<!doctype html><html lang="en"><body><p>text</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the lang value is syntactically valid`, () => {
  const html = `<!doctype html><html><body><p lang="fr">Bonjour</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the lang value is syntactically invalid`, () => {
  const html = `<!doctype html><html><body><p id="a" lang="xyz123!!">?</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ELEMENT_LANG_INVALID');
});

test(`${RULE_ID}: does not evaluate the root <html> element`, () => {
  const html = `<!doctype html><html lang="???"><body></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><p id="a" lang="xyz123!!">?</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Element lang attribute must be syntactically valid');
});

test(`${RULE_ID}: a nested descendant's own lang re-scopes all the text away from the invalid outer lang, so the outer element is not flagged (ACT de46e4 passed example)`, () => {
  const html = `<!doctype html><html><body>
    <article id="a" lang="invalid">
      <div lang="en">They wandered into a strange Tiki bar.</div>
    </article>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  assert.ok(!hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: fails when a nested descendant re-scopes text to its OWN invalid lang, leaving the outer element's valid lang ungoverned but the inner one applicable (ACT de46e4 failed example)`, () => {
  const html = `<!doctype html><html><body>
    <article lang="en">
      <div id="a" lang="invalid">They wandered into a strange Tiki bar.</div>
    </article>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: a non-empty alt attribute counts as governed text (ACT de46e4 passed/failed examples)`, () => {
  const passing = runa11yCoreOnHtml(
    `<!doctype html><html><body><div lang="EN"><img src="x.jpg" alt="Fireworks"></div></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(passing, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });

  const failing = runa11yCoreOnHtml(
    `<!doctype html><html><body><div id="a" lang="invalid"><img src="x.jpg" alt="Fireworks"></div></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(failing, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: an empty alt (decorative image) is not governed text, so no other content leaves the element notApplicable (ACT de46e4 inapplicable example)`, () => {
  const html = `<!doctype html><html><body><div lang="invalid"><img src="x.jpg" alt=""></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: display:none text is not governed text (ACT de46e4 inapplicable example)`, () => {
  const html = `<!doctype html><html><body>
    <p lang="hidden"><span style="display: none;">They wandered into a strange Tiki bar.</span></p>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: aria-hidden text still counts as governed text; only actual non-rendering exempts it (ACT de46e4 failed example)`, () => {
  const html = `<!doctype html><html><body>
    <article id="a" lang="english"><p aria-hidden="true">They wandered into a strange Tiki bar.</p></article>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: offscreen text still counts as governed text; offscreen positioning doesn't exempt it either (ACT de46e4 failed example)`, () => {
  const html = `<!doctype html><html><body>
    <article id="a" lang="English"><p style="position: absolute; top: -9999px">They wandered into a strange Tiki bar.</p></article>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: an element with no descendant text or alt at all is notApplicable`, () => {
  const html = `<!doctype html><html><body><div lang="invalid"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/valid-lang-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'valid-lang-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'vl_case_02'));
  assert.ok(!hasOccurrenceForId(rule, 'vl_case_01'));
  assert.ok(!hasOccurrenceForId(rule, 'vl_case_03'));
});
