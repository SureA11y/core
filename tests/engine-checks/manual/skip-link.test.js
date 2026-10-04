'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'skip-link';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when there is no skip-like link`, () => {
  const html = `<!doctype html><html><body><a href="/about">About</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the skip link target resolves`, () => {
  const html = `<!doctype html><html><body><a href="#main">Skip to content</a><div id="main">Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when the skip link target exists but is hidden/ineligible`, () => {
  const html = `<!doctype html><html><body><a id="a" href="#main">Skip to content</a><div style="display:none"><main id="main">Content</main></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'SKIP_LINK_TARGET_UNUSABLE');
  assert.equal(rule.occurrences[0].data.details.unusableReasonCode, 'ACC_TREE_INELIGIBLE');
});

test(`${RULE_ID}: cantTell when the skip link target does not exist`, () => {
  const html = `<!doctype html><html><body><a id="a" href="#missing">Skip to main content</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'SKIP_LINK_TARGET_MISSING');
});

test(`${RULE_ID}: cantTell when a "Jump to ..." link (not literally containing "skip") has a missing target`, () => {
  const html = `<!doctype html><html><body><a id="a" href="#jump-menu">Jump to section</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when a "Jump to ..." link's target resolves`, () => {
  const html = `<!doctype html><html><body><a href="#main">Jump to main content</a><div id="main">Content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><a id="a" href="#missing">Skip to main content</a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Skip link must have a resolvable, usable target');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/skip-link-all-scenarios.html)`, () => {
  const fixturePath = path.join(__dirname, '../..', 'fixtures', 'skip-link-all-scenarios.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 7, maxOccurrences: 7 });
  for (const id of [
    'sl_case_02',
    'sl_case_04',
    'sl_case_06',
    'sl_case_07',
    'sl_case_09',
    'sl_case_10',
    'sl_case_11'
  ]) {
    assert.ok(hasOccurrenceForId(rule, id), id);
  }
  for (const id of ['sl_case_01', 'sl_case_03', 'sl_case_05', 'sl_case_08']) {
    assert.ok(!hasOccurrenceForId(rule, id), id);
  }
});

test(`${RULE_ID}: French wording with a missing target is asked about`, () => {
  for (const name of [
    'Aller au contenu',
    'Accès direct au contenu',
    'Passer au contenu principal'
  ]) {
    const html = `<!doctype html><html lang="fr"><body><a id="a" href="#contenu">${name}</a><p>Texte</p></body></html>`;
    // A best-practice rule: the default run runs it.
    for (const engineOptions of [{}]) {
      const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID], engineOptions });
      const rule = assertRule(result, RULE_ID, 'cantTell', {
        minOccurrences: 1,
        maxOccurrences: 1
      });
      assert.equal(rule.occurrences[0].data.details.reasonCode, 'SKIP_LINK_TARGET_MISSING', name);
    }
  }
});

test(`${RULE_ID}: German, Spanish and Japanese wording is recognised`, () => {
  for (const name of [
    'Zum Inhalt springen',
    'Direkt zum Hauptinhalt',
    'Saltar al contenido',
    'Ir al contenido principal',
    '本文へスキップ',
    '本文へ移動'
  ]) {
    const html = `<!doctype html><html><body><p>Intro</p><a href="/a">A</a><a id="a" href="#nope">${name}</a></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  }
});

test(`${RULE_ID}: the first link, placed before main, is a skip link whatever its wording`, () => {
  const html = `<!doctype html><html><body><a id="a" href="#principal">Contenu</a><nav><a href="/x">X</a></nav><main><h1>T</h1></main></body></html>`;
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell', {
    minOccurrences: 1,
    maxOccurrences: 1
  });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: a same-page link that is not the first link, or with no main after it, is not a skip link`, () => {
  const notFirst = `<!doctype html><html><body><a href="/home">Home</a><a href="#menu">Menu</a><main><h1>T</h1></main></body></html>`;
  assertRule(runa11yCoreOnHtml(notFirst, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable');
  const noMain = `<!doctype html><html><body><a href="#menu">Menu</a><p>Text</p></body></html>`;
  assertRule(runa11yCoreOnHtml(noMain, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable');
  const afterMain = `<!doctype html><html><body><main><a href="#top">Contenu</a></main></body></html>`;
  assertRule(runa11yCoreOnHtml(afterMain, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: wording that only resembles a skip link is left alone`, () => {
  const html = `<!doctype html><html><body><a href="/x">X</a><a href="#top">Aller en haut</a><a href="#s2">Section 2</a></body></html>`;
  assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'notApplicable');
});

// The anchor name is compared as an attribute: built into a selector, a
// backslash in it made the selector invalid and the target looked missing.
test(`${RULE_ID}: a legacy <a name> target with a backslash or quote in its name is found`, () => {
  for (const [name, href] of [
    ['a\\b', '#a%5Cb'],
    ['say "hi"', '#say%20%22hi%22']
  ]) {
    const html = `<!doctype html><html><body><a id="a" href="${href}">Skip to main content</a><a name='${name}'></a><main>x</main></body></html>`;
    const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
    assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
  }
});
