'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'server-side-image-map-absent';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: pass when no img[ismap] is present`, () => {
  const html = `<!doctype html><html><body><img src="a.png" alt="A regular image"></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

// 2.1.1 is met when the map's destinations are also keyboard-operable links
// (RGAA 1.1.4 step 2), which the rule cannot verify, so it asks.
test(`${RULE_ID}: cantTell when an img with ismap is inside a link`, () => {
  const html = `<!doctype html><html><body><a href="/map"><img id="a" src="map.png" ismap alt="Map"></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a'));
  const occ = rule.occurrences[0];
  assert.strictEqual(occ.data.details.reasonCode, 'SERVER_SIDE_IMAGE_MAP');
  assert.strictEqual(occ.uncertainty.code, 'equivalence-unknown');
});

test(`${RULE_ID}: cantTell even with equivalent links next to the map`, () => {
  const html = `<!doctype html><html><body><a href="/carte"><img id="a" alt="Carte" src="map.png" ismap></a><ul><li><a href="/nord">Nord</a></li><li><a href="/sud">Sud</a></li></ul></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: notApplicable when ismap is only on images outside a link`, () => {
  for (const body of [
    '<img id="a" alt="x" src="map.png" ismap>',
    '<a><img id="a" alt="x" src="map.png" ismap></a>'
  ]) {
    const result = runa11yCoreOnHtml(`<!doctype html><html><body>${body}</body></html>`, {
      runOnly: [RULE_ID]
    });
    assertRule(result, RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  }
});

test(`${RULE_ID}: same outcomes under wcag22-aa`, () => {
  const page = (body) =>
    `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  const engineOptions = { profile: 'wcag22-aa' };
  const asked = runa11yCoreOnHtml(
    page('<a href="/carte"><img alt="Carte" src="map.png" ismap></a><a href="/nord">Nord</a>'),
    { engineOptions }
  );
  assertRule(asked, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  const outside = runa11yCoreOnHtml(page('<img alt="x" src="map.png" ismap>'), { engineOptions });
  assertRule(outside, RULE_ID, 'notApplicable');
});

test(`${RULE_ID}: i18n default is English`, () => {
  const html = `<!doctype html><html><body><a href="/map"><img id="a" src="map.png" ismap alt="Map"></a></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
  assert.strictEqual(
    rule.title,
    'Server-side image maps must have a keyboard-operable alternative'
  );
});

test(`${RULE_ID}: fixture coverage (tests/fixtures/server-side-image-map-absent-all-scenarios.html)`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'server-side-image-map-absent-all-scenarios.html'
  );
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf8');
  const result = runa11yCoreOnHtml(fixtureHtml, { runOnly: [RULE_ID] });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  assert.ok(hasOccurrenceForId(rule, 'ssim_case_01'));
  assert.ok(!hasOccurrenceForId(rule, 'ssim_case_02'));
  assert.ok(!hasOccurrenceForId(rule, 'ssim_case_03'));
  assert.ok(!hasOccurrenceForId(rule, 'ssim_case_04'));
});
