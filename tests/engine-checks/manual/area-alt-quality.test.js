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
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 13, maxOccurrences: 13 });

  const expected = [
    'area_q_01',
    'area_q_05', // hidden on <area> itself does not exclude it
    'area_q_06', // inert on <area> itself does not exclude it
    'area_q_07', // referencing img aria-hidden does not propagate to <area>
    'area_q_08', // named by title only
    'area_q_09', // named by aria-label only
    'area_q_10', // named by aria-labelledby only
    'area_q_11', // alt="" but named by title
    'area_q_12',
    'area_q_13',
    'area_q_14',
    'area_q_15',
    'area_q_16'
  ];
  const notExpected = ['area_q_02', 'area_q_03', 'area_q_04'];

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

  assert.strictEqual(
    rule.title,
    '<area> : alternative textuelle \u00e0 v\u00e9rifier (revue manuelle)'
  );
  assert.strictEqual(
    rule.description,
    'Signale les \u00e9l\u00e9ments <area> dont l\u2019alternative textuelle (alt, aria-label, aria-labelledby ou title) n\u2019est pas vide afin de v\u00e9rifier manuellement sa pertinence. Indique quand le nom ressemble \u00e0 un nom de fichier, \u00e0 une adresse web ou \u00e0 un texte provisoire, commence par \u00ab image de \u00bb ou est tr\u00e8s long.'
  );

  const occ = rule.occurrences[0];
  assert.strictEqual(
    occ.summary,
    'V\u00e9rifiez l\u2019alternative textuelle de cet \u00e9l\u00e9ment <area> (alt) (exactitude et pertinence).'
  );
  assert.strictEqual(
    occ.hint,
    'Assurez-vous que chaque alternative textuelle indiqu\u00e9e identifie la destination/l\u2019action de la zone dans son contexte.'
  );
});

// An <area> inside a used <map> is natively focusable regardless of tabindex,
// so role="presentation"/"none" alone never excludes it here. Pinned so a
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

// Every text-alternative source is reviewed, not only alt (alt, title,
// aria-label and aria-labelledby; WCAG 1.1.1 judges whatever names the area).

function mapPage(area, extra = '') {
  return `<!doctype html><html lang="en"><head><title>t</title></head><body><img src="x.png" usemap="#m" alt="Map"><map name="m">${area}</map>${extra}</body></html>`;
}

for (const [label, area, extra, sources] of [
  [
    'title',
    '<area id="a1" href="/paris" title="Paris" shape="rect" coords="0,0,10,10">',
    '',
    ['title']
  ],
  [
    'aria-label',
    '<area id="a1" href="/paris" aria-label="Paris" shape="rect" coords="0,0,10,10">',
    '',
    ['aria-label']
  ],
  [
    'aria-labelledby',
    '<area id="a1" href="/paris" aria-labelledby="lbl" shape="rect" coords="0,0,10,10">',
    '<span id="lbl">Paris</span>',
    ['aria-labelledby']
  ],
  [
    'alt="" and title',
    '<area id="a1" href="/paris" alt="" title="Paris" shape="rect" coords="0,0,10,10">',
    '',
    ['title']
  ],
  [
    'aria-label, alt and title together',
    '<area id="a1" href="/paris" aria-label="Paris" alt="Paris" title="Ville de Paris" shape="rect" coords="0,0,10,10">',
    '',
    ['aria-label', 'alt', 'title']
  ]
]) {
  test(`${RULE_ID}: an area named by ${label} is asked about, listing its sources`, () => {
    const result = runa11yCoreOnHtml(mapPage(area, extra), { runOnly: [RULE_ID] });
    const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
    assert.ok(hasOccurrenceForId(rule, 'a1'));
    const occ = rule.occurrences[0];
    assert.deepStrictEqual(occ.data.details.sources, sources);
    assert.strictEqual(occ.data.details.name, occ.data.details.name.trim());
    assert.ok(occ.summary.includes(`(${sources.join(', ')})`), occ.summary);
  });
}

test(`${RULE_ID}: aria-labelledby that resolves to nothing is not a source`, () => {
  const result = runa11yCoreOnHtml(
    mapPage('<area id="a1" href="/x" aria-labelledby="missing" shape="rect" coords="0,0,10,10">'),
    { runOnly: [RULE_ID] }
  );
  assertRule(result, RULE_ID, 'notApplicable', { maxOccurrences: 0 });
});

test(`${RULE_ID}: a title-only area is asked about under wcag22-aa`, () => {
  const html = mapPage(
    '<area id="a1" href="/paris" title="Paris" shape="rect" coords="0,0,10,10">'
  );
  const wcag = runa11yCoreOnHtml(html, { engineOptions: { profile: 'wcag22-aa' } });
  assertRule(wcag, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
});

// A name that looks like something other than a description gets the shared
// signal message (helpers.getTextAlternativeSignal), as img-alt-quality does.
// The finding stays cantTell and gains no reasonCode.

test(`${RULE_ID}: a suspicious name reports its signal and the shared message`, () => {
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', 'area-alt-quality-manual-all-scenarios.html'),
    'utf8'
  );
  const rule = assertRule(runa11yCoreOnHtml(html, { runOnly: [RULE_ID] }), RULE_ID, 'cantTell');
  const occurrenceFor = (id) =>
    rule.occurrences.find((o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`));
  const expected = {
    area_q_12: 'file-name',
    area_q_13: 'url',
    area_q_14: 'placeholder',
    area_q_15: 'too-long',
    area_q_16: 'redundant-prefix'
  };
  for (const [id, signal] of Object.entries(expected)) {
    const o = occurrenceFor(id);
    assert.ok(o, id);
    assert.strictEqual(o.data.details.altSignal, signal, id);
    assert.ok(!('reasonCode' in o.data.details), `${id} carries no reasonCode`);
    assert.ok(Array.isArray(o.data.details.sources), `${id} keeps its sources`);
    assert.match(o.i18n.summaryKey, /^textAlternative_summary_cantTell[A-Z]/, id);
    assert.strictEqual(o.i18n.params.element, 'area', id);
    assert.ok(o.summary.startsWith('The text alternative of this <area>'), o.summary);
  }
  for (const id of ['area_q_01', 'area_q_08']) {
    const o = occurrenceFor(id);
    assert.ok(o, id);
    assert.ok(!('altSignal' in o.data.details), id);
    assert.doesNotMatch(o.i18n.summaryKey, /^textAlternative_/, id);
  }
});
