'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'aria-prohibited-attr';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

function getOccurrenceForId(rule, id) {
  return (rule.occurrences || []).find(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when nothing is present at all (no role, no naming attributes)`, () => {
  const html = `<!doctype html><html><body><div id="a"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when role does not prohibit naming`, () => {
  const html = `<!doctype html><html><body><div id="a" role="button" aria-label="Submit"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass when a naming-prohibited role has no naming attribute`, () => {
  const html = `<!doctype html><html><body><div id="a" role="generic"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-label is present on a naming-prohibited role`, () => {
  const html = `<!doctype html><html><body><div id="a" role="generic" aria-label="Something"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-label');
  assert.equal(rule.occurrences[0].data.details.role, 'generic');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_PROHIBITED');
});

test(`${RULE_ID}: fail when aria-labelledby is present on a naming-prohibited role`, () => {
  const html = `<!doctype html><html><body><span id="lbl">Label</span><strong id="a" role="strong" aria-labelledby="lbl"></strong></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-labelledby');
});

test(`${RULE_ID}: fail when aria-label is present on role="mark" (widened role, Tier 4)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="mark" aria-label="Highlighted"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.role, 'mark');
});

test(`${RULE_ID}: fail when aria-label is present on role="presentation" (widened 2026-07-21 — verified against a reference engine's own prohibitedAttrs table)`, () => {
  const html = `<!doctype html><html><body><div id="a" role="presentation" aria-label="Something"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.role, 'presentation');
});

test(`${RULE_ID}: fail when aria-labelledby is present on role="none" (widened 2026-07-21 — "none" is "presentation"'s ARIA 1.2 alias)`, () => {
  const html = `<!doctype html><html><body><span id="lbl">Label</span><div id="a" role="none" aria-labelledby="lbl"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.equal(rule.occurrences[0].data.details.role, 'none');
});

test(`${RULE_ID}: reports one occurrence per prohibited naming attribute on the same element`, () => {
  const html = `<!doctype html><html><body><span id="lbl">Label</span><div id="a" role="paragraph" aria-label="Something" aria-labelledby="lbl"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const attrs = rule.occurrences.map((o) => o.data.details.attr).sort();
  assert.deepStrictEqual(attrs, ['aria-label', 'aria-labelledby']);
});

test(`${RULE_ID}: pass when naming attribute is empty/whitespace`, () => {
  const html = `<!doctype html><html><body><div id="a" role="generic" aria-label="   "></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-label is on a roleless span with no content fallback (widened 2026-07-31 — the emoji-mart case)`, () => {
  const html = `<!doctype html><html><body><span id="a" aria-label="party_parrot" class="emoji-mart-emoji-custom"></span></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-label');
  assert.equal(rule.occurrences[0].data.details.role, null);
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_PROHIBITED_ROLELESS');
});

test(`${RULE_ID}: fail when aria-labelledby is on a roleless div with no content fallback`, () => {
  const html = `<!doctype html><html><body><span id="lbl">Label</span><div id="a" aria-labelledby="lbl"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-labelledby');
});

test(`${RULE_ID}: fail when aria-label is on a span carrying an INVALID role="" token (not a recognized ARIA role) with no content fallback — must not be silently skipped as "has a real role" (fixed 2026-07-31; confirmed by comparing against the identical markup with the role attribute removed entirely, which already correctly failed)`, () => {
  const html = `<!doctype html><html><body><span id="a" role="totally-bogus-not-a-real-role" aria-label="icon-only" class="icon-x"></span></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-label');
  assert.equal(rule.occurrences[0].data.details.role, null);
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_PROHIBITED_ROLELESS');
});

test(`${RULE_ID}: cantTell when aria-label is on a roleless span that already has content-derived text`, () => {
  const html = `<!doctype html><html><body><span id="a" aria-label="Custom label">Visible text</span></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(
    rule.occurrences[0].data.details.reasonCode,
    'ARIA_ATTR_PROHIBITED_ROLELESS_NEEDS_REVIEW'
  );
});

test(`${RULE_ID}: mixed fail + cantTell occurrences on one page preserve per-occurrence outcome tier`, () => {
  const html = `<!doctype html><html><body>
    <span id="roleless_canttell" aria-label="Custom label">Visible text</span>
    <span id="roleless_fail" aria-label="icon-only"></span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 2, maxOccurrences: 2 });
  const cantTellOccurrence = getOccurrenceForId(rule, 'roleless_canttell');
  const failOccurrence = getOccurrenceForId(rule, 'roleless_fail');
  assert.ok(cantTellOccurrence);
  assert.ok(failOccurrence);
  assert.strictEqual(cantTellOccurrence.occurrenceOutcome, 'cantTell');
  assert.strictEqual(failOccurrence.occurrenceOutcome, 'fail');
});

test(`${RULE_ID}: pass (exempted, not notApplicable — the rule did evaluate this candidate) when a roleless span with aria-label sits inside a widget-type role`, () => {
  const html = `<!doctype html><html><body><div role="slider" aria-valuenow="5"><span id="a" aria-label="thumb"></span></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: pass (not flagged) when aria-label is on a tag with a real native role (e.g. a bare <button>)`, () => {
  const html = `<!doctype html><html><body><button id="a" aria-label="Close"></button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when aria-label is on a roleless tag not in the curated list (e.g. <section>, handled elsewhere)`, () => {
  const html = `<!doctype html><html><body><section id="a" aria-label="Widget region"></section></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: fail when aria-label is on a roleless autonomous custom element with no content fallback (added 2026-08-03 — the rottentomatoes.com <play-button> case)`, () => {
  const html = `<!doctype html><html><body><play-button id="a" aria-label="Play The Odyssey trailer"></play-button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  assert.equal(rule.occurrences[0].data.details.attr, 'aria-label');
  assert.equal(rule.occurrences[0].data.details.reasonCode, 'ARIA_ATTR_PROHIBITED_ROLELESS');
});

test(`${RULE_ID}: cantTell when aria-labelledby is on a roleless autonomous custom element that already has content-derived text`, () => {
  const html = `<!doctype html><html><body><span id="lbl">Guides</span><app-carousel id="a" aria-labelledby="lbl">Some visible content</app-carousel></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
});

test(`${RULE_ID}: notApplicable when aria-label is on a custom element that also has an explicit, real role (e.g. role="button" on the custom tag)`, () => {
  const html = `<!doctype html><html><body><play-button id="a" role="button" aria-label="Play"></play-button></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable for a spec-reserved hyphenated (non-custom-element) tag like <missing-glyph> — not misclassified as an autonomous custom element`, () => {
  const html = `<!doctype html><html><body><missing-glyph id="a" aria-label="Fallback glyph"></missing-glyph></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a roleless element with hidden="until-found" is still evaluated for its own aria-labelledby, unlike a plain [hidden] (added 2026-08-03 — the irs.gov accordion-panel case)`, () => {
  const html = `<!doctype html><html><body>
    <button id="btn_panel">Question</button>
    <div id="panel" hidden="until-found" aria-labelledby="btn_panel">Some real answer content here.</div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'panel'));
});

test(`${RULE_ID}: notApplicable when the SAME roleless element instead has a plain [hidden] attribute (not "until-found") — the panel itself stays excluded`, () => {
  const html = `<!doctype html><html><body>
    <button id="btn_panel">Question</button>
    <div id="panel" hidden aria-labelledby="btn_panel">Some real answer content here.</div>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><div id="a" role="generic" aria-label="Something"></div></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'ARIA naming attributes must not be used on roles that prohibit them'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/aria-prohibited-attr-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'aria-prohibited-attr-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'fail', { minOccurrences: 10, maxOccurrences: 10 });

  const expectedFailIds = [
    'apa_case_03',
    'apa_case_04',
    'apa_case_05',
    'apa_case_07',
    'apa_case_08',
    'apa_case_09',
    'apa_case_10',
    'apa_case_11',
    'apa_case_16'
  ];
  const expectedNoOccIds = [
    'apa_case_01',
    'apa_case_02',
    'apa_case_06',
    'apa_case_12',
    'apa_case_13',
    'apa_case_14'
  ];

  for (const id of expectedFailIds) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of expectedNoOccIds) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});
