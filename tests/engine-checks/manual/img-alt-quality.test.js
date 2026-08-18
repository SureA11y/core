'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'img-alt-quality';

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
    'img-alt-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 4, maxOccurrences: 4 });

  const expected = ['img_q_01', 'img_q_02', 'img_q_07', 'img_q_10'];
  const notExpected = [
    'img_q_03',
    'img_q_04',
    'img_q_05',
    'img_q_06',
    'img_q_08',
    'img_q_09',
    'img_q_11',
    'img_q_12'
  ];

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
    'img-alt-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(rule.title, '<img> : texte alt \u00e0 v\u00e9rifier (revue manuelle)');
  assert.strictEqual(
    rule.description,
    'Signale les \u00e9l\u00e9ments <img> dont l\u2019attribut alt n\u2019est pas vide afin de v\u00e9rifier manuellement sa pertinence.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'V\u00e9rifiez le texte alt de <img> (exactitude et pertinence).'
  );
  assert.strictEqual(
    occ.hint,
    'Assurez-vous que le texte alt exprime le but/l\u2019information de l\u2019image dans son contexte (ni redondant, ni nom de fichier).'
  );
});

// role="presentation"/"none" exclusion (mirrors img-alt-present policy: exclude
// only when the element is NOT focusable, since a focusable element stays in
// the tab order and still needs a usable name). An <img> is not focusable on its own, so the exclusion applies until a tabindex puts it in the tab order.

test(`${RULE_ID}: a non-focusable role="presentation" img is excluded from review`, () => {
  const applicable = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="Company logo"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(applicable, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="Company logo" role="presentation"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role="none" excludes the same way role="presentation" does`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="Company logo" role="none"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a focusable role="presentation" img is still reviewed`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="Company logo" role="presentation" tabindex="0"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'img1'));
});
