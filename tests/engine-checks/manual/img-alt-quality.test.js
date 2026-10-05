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
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 19, maxOccurrences: 19 });

  const expected = ['img_q_01', 'img_q_02', 'img_q_07', 'img_q_10'];
  for (let n = 13; n <= 27; n++) expected.push('img_q_' + n);
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
    'Signale les \u00e9l\u00e9ments <img> dont l\u2019attribut alt n\u2019est pas vide afin de v\u00e9rifier manuellement sa pertinence, et indique quand le texte alt ressemble \u00e0 un nom de fichier, \u00e0 une adresse web ou \u00e0 un texte provisoire, commence par \u00ab image de \u00bb ou est tr\u00e8s long.'
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

// Alt that looks like something other than a description gets its own
// message and data.details.altSignal. The finding stays cantTell, and carries
// no reasonCode: its identity is what it was before the signals existed.

function occurrenceFor(rule, id) {
  return (rule.occurrences || []).find(
    (o) => typeof o.html === 'string' && o.html.includes(`id="${id}"`)
  );
}

function fixtureRule(locale) {
  const html = fs.readFileSync(
    path.join(__dirname, '../..', 'fixtures', 'img-alt-quality-manual-all-scenarios.html'),
    'utf8'
  );
  const result = runa11yCoreOnHtml(html, {
    runOnly: [RULE_ID],
    engineOptions: locale ? { locale } : {}
  });
  return assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 1 });
}

test(`${RULE_ID}: each suspicious alt reports its signal and its own message`, () => {
  const rule = fixtureRule();
  const expected = {
    img_q_13: ['file-name', 'looks like a file name'],
    img_q_14: ['file-name', 'looks like a file name'],
    img_q_15: ['file-name', 'looks like a file name'],
    img_q_16: ['url', 'is a web address'],
    img_q_17: ['placeholder', 'placeholder or a generic word'],
    img_q_18: ['placeholder', 'placeholder or a generic word'],
    img_q_19: ['placeholder', 'placeholder or a generic word'],
    img_q_20: ['redundant-prefix', 'starts by saying it is an image'],
    img_q_21: ['too-long', 'characters long'],
    img_q_25: ['placeholder', 'placeholder or a generic word'],
    img_q_26: ['redundant-prefix', 'starts by saying it is an image'],
    img_q_27: ['redundant-prefix', 'starts by saying it is an image']
  };
  for (const [id, [signal, words]] of Object.entries(expected)) {
    const o = occurrenceFor(rule, id);
    assert.ok(o, id);
    assert.strictEqual(o.data.details.altSignal, signal, id);
    assert.ok(o.summary.includes(words), `${id}: ${o.summary}`);
    assert.ok(!('reasonCode' in o.data.details), `${id} carries no reasonCode`);
    const suffix = o.i18n.summaryKey.replace('textAlternative_summary_cantTell', '');
    assert.ok(suffix.length > 0 && suffix !== o.i18n.summaryKey, `${id} uses a signal message`);
    assert.strictEqual(o.i18n.hintKey, 'textAlternative_hint_cantTell' + suffix, id);
    assert.strictEqual(o.i18n.params.element, 'img', id);
  }
});

test(`${RULE_ID}: too-long says how long the alt is and where the limit is`, () => {
  const o = occurrenceFor(fixtureRule(), 'img_q_21');
  const length = Array.from(o.html.match(/alt="([^"]*)"/)[1]).length;
  assert.deepStrictEqual(o.data.details, { altSignal: 'too-long', length, limit: 150 });
  assert.strictEqual(o.i18n.params.length, length);
  assert.strictEqual(o.summary, `The text alternative of this <img> is ${length} characters long.`);

  const at = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><body><img src="x.png" alt="${'a'.repeat(150)}"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(at, RULE_ID, 'cantTell', { minOccurrences: 1, maxOccurrences: 1 });
  assert.strictEqual(rule.occurrences[0].data.details, null, '150 characters is not too long');
});

test(`${RULE_ID}: ordinary alt keeps the original message and no details`, () => {
  const rule = fixtureRule();
  for (const id of ['img_q_01', 'img_q_02', 'img_q_22', 'img_q_23', 'img_q_24']) {
    const o = occurrenceFor(rule, id);
    assert.ok(o, id);
    assert.strictEqual(o.data.details, null, id);
    assert.strictEqual(o.i18n.summaryKey, 'img_altQuality_summary_cantTell', id);
    assert.strictEqual(o.i18n.hintKey, 'img_altQuality_hint_cantTell', id);
  }
});

test(`${RULE_ID}: the first signal in order wins when several apply`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><body>
      <img id="a" src="x.png" alt="image.png">
      <img id="b" src="image.png" alt="image.png">
      <img id="c" src="x.png" alt="Photo of ${'a'.repeat(160)}">
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  assert.strictEqual(occurrenceFor(rule, 'a').data.details.altSignal, 'file-name');
  assert.strictEqual(occurrenceFor(rule, 'b').data.details.altSignal, 'file-name');
  assert.strictEqual(occurrenceFor(rule, 'c').data.details.altSignal, 'redundant-prefix');
});

test(`${RULE_ID}: punctuation, case and full-width forms do not hide a placeholder`, () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><body>
      <img id="a" src="x.png" alt="Logo.">
      <img id="b" src="x.png" alt="  PHOTO  ">
      <img id="c" src="x.png" alt="ＩＭＡＧＥ">
    </body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 3, maxOccurrences: 3 });
  for (const id of ['a', 'b', 'c']) {
    assert.strictEqual(occurrenceFor(rule, id).data.details.altSignal, 'placeholder', id);
  }
});

test(`${RULE_ID}: a word list applies only in its own language`, () => {
  const html = (lang) =>
    `<!doctype html><html lang="${lang}"><body><img id="a" src="x.png" alt="Imagen de un perro"></body></html>`;
  const es = assertRule(runa11yCoreOnHtml(html('es'), { runOnly: [RULE_ID] }), RULE_ID, 'cantTell');
  assert.strictEqual(occurrenceFor(es, 'a').data.details.altSignal, 'redundant-prefix');
  const en = assertRule(runa11yCoreOnHtml(html('en'), { runOnly: [RULE_ID] }), RULE_ID, 'cantTell');
  assert.strictEqual(occurrenceFor(en, 'a').data.details, null);
});

test(`${RULE_ID}: signal messages are translated in every shipped locale`, () => {
  const en = fixtureRule();
  for (const locale of ['de', 'es', 'fr', 'ja']) {
    const rule = fixtureRule(locale);
    for (const id of ['img_q_13', 'img_q_16', 'img_q_17', 'img_q_20', 'img_q_21']) {
      const o = occurrenceFor(rule, id);
      const e = occurrenceFor(en, id);
      assert.notStrictEqual(o.summary, e.summary, `${locale} ${id} summary`);
      assert.notStrictEqual(o.hint, e.hint, `${locale} ${id} hint`);
      assert.ok(!o.summary.includes('{{'), `${locale} ${id}: ${o.summary}`);
    }
  }
});

test(`${RULE_ID}: suspicious alt has its own allowance, so 50 ordinary images can't hide it`, () => {
  const ordinary = Array.from(
    { length: 60 },
    (_, i) => `<img src="p${i}.png" alt="A photo caption number ${i}">`
  ).join('');
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><body>${ordinary}<img id="late" src="x.png" alt="IMG_1234.jpg"></body></html>`,
    { runOnly: [RULE_ID] }
  );
  const rule = assertRule(result, RULE_ID, 'cantTell', { minOccurrences: 51, maxOccurrences: 51 });
  const late = rule.occurrences.find((o) => o.html.includes('id="late"'));
  assert.ok(late, 'the file-name alt after 60 ordinary images is still reported');
  assert.equal(late.data.details.altSignal, 'file-name');
  assert.deepEqual(
    {
      applicableCount: rule.data.details.applicableCount,
      reportedCount: rule.data.details.reportedCount,
      suspiciousCount: rule.data.details.suspiciousCount,
      truncated: rule.data.details.truncated
    },
    { applicableCount: 61, reportedCount: 51, suspiciousCount: 1, truncated: true }
  );
});
