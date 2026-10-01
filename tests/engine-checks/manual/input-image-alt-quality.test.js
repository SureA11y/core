'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');

const RULE_ID = 'input-image-alt-quality';

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
    'input-image-alt-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, { runOnly: [RULE_ID] });
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 7, maxOccurrences: 7 });

  const expected = ['ii_q_01', 'ii_q_02', 'ii_q_08', 'ii_q_10', 'ii_q_11', 'ii_q_12', 'ii_q_13'];
  const notExpected = [
    'ii_q_03',
    'ii_q_04',
    'ii_q_05',
    'ii_q_06',
    'ii_q_07',
    'ii_q_09',
    'ii_q_14' // alt="" with another name: input-image-alt-decorative asks
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
    'input-image-alt-quality-manual-all-scenarios.html'
  );
  const html = fs.readFileSync(fixturePath, 'utf8');

  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: { locale: 'fr' }
  });

  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });

  assert.strictEqual(
    rule.title,
    '<input type="image"> : alternative textuelle \u00e0 v\u00e9rifier (revue manuelle)'
  );
  assert.strictEqual(
    rule.description,
    'Signale les \u00e9l\u00e9ments <input type="image"> dont l\u2019alternative textuelle (alt, aria-label, aria-labelledby ou title) n\u2019est pas vide afin de v\u00e9rifier manuellement sa pertinence.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'V\u00e9rifiez l\u2019alternative textuelle de cet \u00e9l\u00e9ment <input type="image"> (alt) (exactitude et pertinence).'
  );
  assert.strictEqual(
    occ.hint,
    'Assurez-vous que chaque alternative textuelle indiqu\u00e9e d\u00e9crit l\u2019action du contr\u00f4le (ex. \u00ab Rechercher \u00bb, \u00ab Envoyer \u00bb) dans son contexte.'
  );
});

// role="presentation"/"none" exclusion (mirrors img-alt-present policy: exclude
// only when the element is NOT focusable, since a focusable element stays in
// the tab order and still needs a usable name). An <input type="image"> is
// natively focusable, so only a disabled one can ever reach the exclusion.

test(`${RULE_ID}: a disabled role="presentation" image button is excluded from review`, () => {
  const applicable = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><input id="s1" type="image" src="go.png" alt="Search" disabled></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(applicable, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });

  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><input id="s1" type="image" src="go.png" alt="Search" role="presentation" disabled></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: role="none" excludes a disabled image button the same way`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><input id="s1" type="image" src="go.png" alt="Search" role="none" disabled></body></html>`,
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: an enabled role="presentation" image button is still reviewed`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body><input id="s1" type="image" src="go.png" alt="Search" role="presentation"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.ok(hasOccurrenceForId(rule, 's1'));
});

// Every text-alternative source is reviewed, not only alt (alt, title,
// aria-label and aria-labelledby; WCAG 1.1.1 judges whatever names the
// control).

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><form>${body}</form></body></html>`;

for (const [label, body, sources] of [
  ['aria-label', '<input id="b" type="image" src="a.png" aria-label="Rechercher">', ['aria-label']],
  ['title', '<input id="b" type="image" src="a.png" title="Rechercher">', ['title']],
  [
    'aria-labelledby',
    '<span id="l">Rechercher</span><input id="b" type="image" src="a.png" aria-labelledby="l">',
    ['aria-labelledby']
  ],
  [
    'alt and title together',
    '<input id="b" type="image" src="a.png" alt="Rechercher" title="Lancer la recherche">',
    ['alt', 'title']
  ]
]) {
  test(`${RULE_ID}: an image button named by ${label} is asked about, listing its sources`, () => {
    const result = runa11yCoreOnHtml(page(body), { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'b'));
    assert.deepStrictEqual(rule.occurrences[0].data.details.sources, sources);
  });
}

test(`${RULE_ID}: alt="" with another name is left to input-image-alt-decorative`, () => {
  const html = page('<input id="b" type="image" src="a.png" alt="" aria-label="Rechercher">');
  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID, 'input-image-alt-decorative']
  });
  assertRule(result, RULE_ID, 'notApplicable', { maxOccurrences: 0 });
  assertRule(result, 'input-image-alt-decorative', 'cantTell', { minOccurrences: 1 });
});

test(`${RULE_ID}: an aria-label-only image button is asked about under wcag22-aa`, () => {
  const html = page('<input id="b" type="image" src="a.png" aria-label="Rechercher">');
  const wcag = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  assertRule(wcag, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});
