'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-allowed-role';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no role attributes present`, () => {
  const html = `<!doctype html><html><body><nav id="a"></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when the host element has no asserted role constraint`, () => {
  const html = `<!doctype html><html><body><div id="a" role="tab"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the explicit role is permitted for the host element`, () => {
  const html = `<!doctype html><html><body><nav id="a" role="presentation"></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when the explicit role is the element's own native role`, () => {
  const html = `<!doctype html><html><body><ul id="a" role="list"></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when the explicit role is not permitted for the host element`, () => {
  const html = `<!doctype html><html><body><nav id="a" role="tab"></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.role, 'tab');
  assert.equal(rule.occurrences[0].data.details.element, 'nav');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ROLE_NOT_ALLOWED_FOR_ELEMENT');
});

test(`${RULE_ID}: pass when the explicit role is on <a href>'s permitted-roles list`, () => {
  const html = `<!doctype html><html><body><a id="a" href="/x" role="tab"></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role="group" is set on an <a> with href (found on a real site — Blick Art Materials' homepage carousel; <a href> is NOT unconstrained the way a hrefless <a> is)`, () => {
  const html = `<!doctype html><html><body><a id="a" href="/x" role="group"></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when role="link" (its own native role) is restated on an <a> with href`, () => {
  const html = `<!doctype html><html><body><a id="a" href="/x" role="link"></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for a plain hrefless <a> (genuinely unconstrained/no asserted role constraint, distinct from <a href>)`, () => {
  const html = `<!doctype html><html><body><a id="a" role="group"></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role="presentation" is set on an <img> with non-empty alt`, () => {
  const html = `<!doctype html><html><body><img id="a" alt="Decorative" src="x.png" role="presentation"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when role="presentation" is set on an <img> with empty alt`, () => {
  const html = `<!doctype html><html><body><img id="a" alt="" src="x.png" role="presentation"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a widget role is set on an <img> with non-empty alt`, () => {
  const html = `<!doctype html><html><body><img id="a" alt="Play" src="x.png" role="button"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role="presentation" is set on an <area> without href`, () => {
  const html = `<!doctype html><html><body><map name="m"><area id="a" role="presentation" shape="rect" coords="0,0,10,10"></map></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when role="link" is set on an <area> without href`, () => {
  const html = `<!doctype html><html><body><map name="m"><area id="a" role="link" shape="rect" coords="0,0,10,10"></map></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail for <area> with href and any override role (a reference engine's allowedRoles is literally false here — no override role is ever permitted, only its own native 'link' role)`, () => {
  const html = `<!doctype html><html><body><map name="m"><area id="a" href="/x" role="tab" shape="rect" coords="0,0,10,10"></map></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when role="link" (its own native role) is restated on an <area> with href`, () => {
  const html = `<!doctype html><html><body><map name="m"><area id="a" href="/x" role="link" shape="rect" coords="0,0,10,10"></map></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when any role is set on a <table> (found on a real site — Wikipedia's sidebar uses role="navigation")`, () => {
  const html = `<!doctype html><html><body><table id="a" role="navigation"><tbody><tr><td>x</td></tr></tbody></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when any role is set on a <tr>/<td>/<th>`, () => {
  const html = `<!doctype html><html><body><table><tbody><tr role="listitem" id="a"><td role="button" id="b">x</td></tr></tbody></table></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when a <label> associated with a labelable control has an explicit role (found on a real site — basecamp.com's nav toggle)`, () => {
  const html = `<!doctype html><html><body><label for="c" role="button" id="a">Toggle</label><input id="c" type="checkbox"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when a <label> not associated with any labelable control has an explicit role (unconstrained — no assertion made)`, () => {
  const html = `<!doctype html><html><body><label role="button" id="a">Unassociated</label></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role="button" is set on an <input type="checkbox"> without aria-pressed (found on a real site — Wikipedia's dropdown toggles)`, () => {
  const html = `<!doctype html><html><body><input type="checkbox" role="button" aria-haspopup="true" id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when role="button" is set on an <input type="checkbox"> paired with aria-pressed`, () => {
  const html = `<!doctype html><html><body><input type="checkbox" role="button" aria-pressed="false" id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="switch" is set on an <input type="checkbox"> without aria-pressed (unaffected by the aria-pressed split)`, () => {
  const html = `<!doctype html><html><body><input type="checkbox" role="switch" id="a"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role="region" is set on a <form> (found on a real site — Stack Overflow's search filter panel)`, () => {
  const html = `<!doctype html><html><body><form role="region" id="a"></form></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when role="search" is set on a <form>`, () => {
  const html = `<!doctype html><html><body><form role="search" id="a"></form></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role="dialog" is set on an <aside> (found on a real site — Stack Overflow's feed-link modal)`, () => {
  const html = `<!doctype html><html><body><aside role="dialog" id="a"></aside></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when role="region" is set on an <aside>`, () => {
  const html = `<!doctype html><html><body><aside role="region" id="a"></aside></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="complementary" (the native role) is restated on an <aside>`, () => {
  const html = `<!doctype html><html><body><aside role="complementary" id="a"></aside></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when role="region" is set on a <section> with no accessible name (found on a real site — ESPN's global scoreboard)`, () => {
  const html = `<!doctype html><html><body><section role="region" id="a"></section></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass when role="region" is set on a <section> that has an aria-label (region is its own conditional native role once named)`, () => {
  const html = `<!doctype html><html><body><section role="region" aria-label="Scoreboard" id="a"></section></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="region" is set on a <section> named via aria-labelledby`, () => {
  const html = `<!doctype html><html><body>
    <h2 id="t">Scoreboard</h2>
    <section role="region" aria-labelledby="t" id="a"></section>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// Regression coverage for a bug found while extending direct coverage of
// aria-helpers.js: hasAccessibleNameHint (which decides whether a
// <section> resolves to the 'section[named]' role key, whose allowed-
// roles entry is the only one that permits role="region") only checked
// aria-label/aria-labelledby, not title -- inconsistent with this same
// engine's own getLandmarkNameInfo (aria-label -> aria-labelledby ->
// title), which the 7 manual landmark-check rules already correctly
// delegate to. A <section title="..."> named only via title was wrongly
// failed for an explicit role="region" restatement, even though this
// engine's own landmark rules already treat a title-named section as a
// real, region-eligible landmark.
test(`${RULE_ID}: pass when role="region" is set on a <section> named only via title`, () => {
  const html = `<!doctype html><html><body><section role="region" title="Scoreboard" id="a"></section></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when role="banner" is set on a <section> regardless of naming`, () => {
  const html = `<!doctype html><html><body><section role="banner" id="a"></section></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when an explicit role is set on <html> itself (found on a real site — news24.com's South Africa homepage, <html role="document">; also a regression test for queryAll/queryAllSmart being unable to match the root element itself, only its descendants)`, () => {
  const html = `<!doctype html><html lang="en" role="document"><body><div>content</div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.role, 'document');
  assert.equal(rule.occurrences[0].data.details.element, 'html');
});

test(`${RULE_ID}: fail — no override role is ever permitted on <picture> (found on a real site — TradingView's homepage, <picture role="presentation"> used for hero illustrations; a reference engine's own element spec sets allowedRoles: false here, same as html/area[href])`, () => {
  const html = `<!doctype html><html><body><picture role="presentation"><img src="x.png" alt=""></picture></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.role, 'presentation');
  assert.equal(rule.occurrences[0].data.details.element, 'picture');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><nav id="a" role="tab"></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(rule.title, 'Explicit role must be permitted for its host element');
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-allowed-role-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-allowed-role-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 18, maxOccurrences: 18 });

  for (const id of [
    'aar_case_04',
    'aar_case_08',
    'aar_case_09',
    'aar_case_12',
    'aar_case_13',
    'aar_case_17',
    'aar_case_18',
    'aar_case_23',
    'aar_case_25',
    'aar_case_28',
    'aar_case_29',
    'aar_case_32',
    'aar_case_36',
    'aar_case_38',
    'aar_case_39',
    'aar_case_41',
    'aar_case_43',
    'aar_case_45'
  ]) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of [
    'aar_case_01',
    'aar_case_02',
    'aar_case_03',
    'aar_case_05',
    'aar_case_06',
    'aar_case_07',
    'aar_case_10',
    'aar_case_11',
    'aar_case_14',
    'aar_case_15',
    'aar_case_16',
    'aar_case_19',
    'aar_case_20',
    'aar_case_21',
    'aar_case_22',
    'aar_case_24',
    'aar_case_26',
    'aar_case_27',
    'aar_case_30',
    'aar_case_31',
    'aar_case_33',
    'aar_case_34',
    'aar_case_35',
    'aar_case_37',
    'aar_case_40',
    'aar_case_42',
    'aar_case_44'
  ]) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: pass — role="banner" is permitted on a top-level <header> (restates its own conditional native role; found on a real site, Navy Federal's page header)`, () => {
  const html = `<!doctype html><html><body><header id="a" role="banner"></header></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail — role="banner" is not permitted on a <header> nested inside <main> (no implicit role to restate when nested)`, () => {
  const html = `<!doctype html><html><body><main><header id="a" role="banner"></header></main></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass — role="group" is permitted on <header>`, () => {
  const html = `<!doctype html><html><body><header id="a" role="group"></header></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail — role="navigation" is not permitted on <header> (found on a real site, Vimeo's global nav header)`, () => {
  const html = `<!doctype html><html><body><header id="a" role="navigation"></header></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: pass — role="menu" is permitted on <nav> (verified against a reference engine's own allowedRoles array; found on a real site, Vimeo's global nav dropdown panels)`, () => {
  const html = `<!doctype html><html><body><nav id="a" role="menu"></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass — role="tablist" is permitted on <nav>`, () => {
  const html = `<!doctype html><html><body><nav id="a" role="tablist"></nav></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail — role="group" is not permitted on <article> (widened 2026-07-21 — found on a real site, Udacity's homepage Swiper.js carousel, 15 identical <article role="group"> slides)`, () => {
  const html = `<!doctype html><html><body><article id="a" role="group"></article></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.role, 'group');
  assert.equal(rule.occurrences[0].data.details.element, 'article');
});

test(`${RULE_ID}: pass — role="region" is permitted on <article>`, () => {
  const html = `<!doctype html><html><body><article id="a" role="region"></article></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass — role="article" (its own native role) is restated on <article>`, () => {
  const html = `<!doctype html><html><body><article id="a" role="article"></article></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});
