'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'img-alt-decorative';

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
    'img-alt-decorative-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });

  const expected = ['img_d_01', 'img_d_05', 'img_d_08'];
  const notExpected = [
    'img_d_02',
    'img_d_03',
    'img_d_04',
    'img_d_06',
    'img_d_07',
    'img_d_09',
    'img_d_10'
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
    'img-alt-decorative-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(
    rule.title,
    '<img> avec alt="" : d\u00e9coratif \u00e0 confirmer (revue manuelle)'
  );
  assert.strictEqual(
    rule.description,
    'Signale les \u00e9l\u00e9ments <img> dont l\u2019attribut alt est vide afin de confirmer qu\u2019ils sont purement d\u00e9coratifs.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(occ.summary, 'V\u00e9rifiez si <img> est d\u00e9coratif (alt="").');
  assert.strictEqual(
    occ.hint,
    'Confirmez que l\u2019image est purement d\u00e9corative. Sinon, fournissez un texte alt pertinent.'
  );
});

// role="presentation"/"none" exclusion (mirrors img-alt-present policy: exclude
// only when the element is NOT focusable, since a focusable element stays in
// the tab order and still needs a usable name). An <img> is not focusable on its own, so the exclusion applies until a tabindex puts it in the tab order.

test(`${RULE_ID}: a non-focusable role="presentation" img is excluded from review`, () => {
  const applicable = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt=""></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(applicable, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="" role="presentation"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role="none" excludes the same way role="presentation" does`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="" role="none"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: a focusable role="presentation" img is still reviewed`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><img id="img1" src="x.png" alt="" role="presentation" tabindex="0"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 'img1'));
});
