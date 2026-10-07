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

// ACT de46e4 judges the primary language subtag.
test(`${RULE_ID}: a malformed later subtag passes; an unknown primary subtag fails`, () => {
  const ok = `<!doctype html><html lang="fr"><body><p lang="en-US_x">Hello</p><p lang="de-DE-!!">Hallo</p></body></html>`;
  for (const engineOptions of [{}, { profile: 'wcag22-aa' }]) {
    const result = runa11yCoreOnHtml(ok, { runOnly: [RULE_ID], engineOptions });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
  const bad = `<!doctype html><html lang="fr"><body><p id="a" lang="xx">Hello</p><p id="b" lang="en_US">Hi</p></body></html>`;
  for (const engineOptions of [{}]) {
    const result = runa11yCoreOnHtml(bad, { runOnly: [RULE_ID], engineOptions });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
    assert.ok(hasOccurrenceForId(rule, 'a'));
    assert.ok(hasOccurrenceForId(rule, 'b'));
  }
});

// "qaa" (private use) and "eng" are well-formed tags that name no
// language: they fail, but are not called malformed (#147).
test(`${RULE_ID}: a well-formed tag naming no language is not called malformed`, () => {
  const html = `<!doctype html><html lang="fr"><body><p id="q" lang="qaa">x</p><p id="e" lang="eng-GB">y</p><p id="m" lang="en_US">z</p></body></html>`;
  for (const locale of ['en', 'de', 'es', 'fr', 'ja']) {
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions: { locale } });
    const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 3, maxOccurrences: 3 });
    const byId = (id) => rule.occurrences.find((o) => o.html.includes(`id="${id}"`));
    for (const o of rule.occurrences)
      assert.equal(o.data.details.reasonCode, 'ELEMENT_LANG_INVALID');
    assert.match(byId('q').summary, /qaa/);
    assert.match(byId('e').summary, /eng/);
    if (locale === 'en') {
      assert.match(byId('q').summary, /is well formed, but "qaa" names no known language/);
      assert.doesNotMatch(byId('q').summary, /syntactically/);
      assert.match(byId('e').summary, /"eng" names no known language/);
      assert.match(byId('m').summary, /is not a syntactically valid language tag/);
    }
    assert.notEqual(byId('q').summary, byId('m').summary.replace('en_US', 'qaa'));
  }
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
  assert.ok(!hasOccurrenceForId(rule, 'vl_case_04'));
});

// The text a lang governs is read in the flat tree, as the page renders it
// (#154): a host's shadow content counts, and light-DOM text a shadow root
// without a slot never renders doesn't.
test(`${RULE_ID}: governed text is read in the flat tree`, () => {
  const { createDom, runa11yCoreOnDom } = require('../../helpers/runDomRulesOnHtml.js');
  const outcome = (shadowHtml, light) => {
    const dom = createDom(
      `<!doctype html><html lang="en"><head><title>t</title></head><body><main><div id="host" lang="xx">${light}</div></main></body></html>`
    );
    dom.window.document.getElementById('host').attachShadow({ mode: 'open' }).innerHTML =
      shadowHtml;
    return runa11yCoreOnDom(dom, { runOnly: [RULE_ID] }).checksResults.find(
      (r) => r.ruleId === RULE_ID
    ).outcome;
  };
  assert.strictEqual(outcome('<p>secret</p>', ''), 'fail');
  assert.strictEqual(outcome('<p></p>', 'secret'), 'notApplicable');
  assert.strictEqual(outcome('<p><slot></slot></p>', 'secret'), 'fail');
});
