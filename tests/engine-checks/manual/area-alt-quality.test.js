'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'area-alt-quality';

function hasOccurrenceForId(rule, id) {
  return (rule.occurrences || []).some(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

test(`${RULE_ID}: notApplicable when no matching elements`, () => {
  const html = `<!doctype html><html><body><p>None</p></body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: cantTell when at least one applicable element triggers manual review`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'area-alt-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });

  const expected = ['area_q_01', 'area_q_06'];
  const notExpected = ['area_q_02', 'area_q_03', 'area_q_04', 'area_q_05', 'area_q_07'];

  for (const id of expected) {
    assert.ok(hasOccurrenceForId(rule, id), `Expected occurrence for id="${id}"`);
  }
  for (const id of notExpected) {
    assert.ok(!hasOccurrenceForId(rule, id), `Did not expect occurrence for id="${id}"`);
  }
});

test(`${RULE_ID}: i18n (fr) rule title/description are localized`, () => {
  const fixturePath = path.join(
    __dirname,
    '../..',
    'fixtures',
    'area-alt-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<area> : texte alt \u00e0 v\u00e9rifier (revue manuelle)');
  assert.strictEqual(
    rule.description,
    'Signale les \u00e9l\u00e9ments <area> dont l\u2019attribut alt n\u2019est pas vide afin de v\u00e9rifier manuellement sa pertinence.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'V\u00e9rifiez le texte alt de <area> (exactitude et pertinence).'
  );
  assert.strictEqual(
    occ.hint,
    'Assurez-vous que le texte alt identifie la destination/l\u2019action de la zone dans son contexte.'
  );
});

// An <area> inside a used <map> is natively focusable regardless of tabindex,
// so role="presentation"/"none" alone never excludes it here -- the same
// documented outcome as area-alt-decorative's identical helper. Pinned so a
// future change to the exclusion cannot silently start dropping <area>
// elements from review.

test(`${RULE_ID}: role="presentation" does not exclude an area in a used map`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img src="x.png" usemap="#m" alt="Map"><map name="m"><area id="a1" role="presentation" shape="rect" coords="0,0,10,10" href="/x" alt="Go"></map></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'a1'));
});

test(`${RULE_ID}: role="none" does not exclude an area in a used map either`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img src="x.png" usemap="#m" alt="Map"><map name="m"><area id="a1" role="none" shape="rect" coords="0,0,10,10" href="/x" alt="Go"></map></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

test(`${RULE_ID}: a tabindex on a role="presentation" area changes nothing`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img src="x.png" usemap="#m" alt="Map"><map name="m"><area id="a1" role="presentation" tabindex="0" shape="rect" coords="0,0,10,10" href="/x" alt="Go"></map></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});
