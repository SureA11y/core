'use strict';

/**
 * Direct tests for profiles/rgaa/map.js and its public entry point.
 *
 * The table is generated from DINUM's own criteres.json (profiles/rgaa/data/),
 * so these check two things: that the committed module is exactly what the
 * generator makes of that file, and that the result says what RGAA 4.1.2
 * says -- 13 themes, 106 criteria, 258 tests, every criterion related to
 * WCAG 2.1 A or AA criteria the engine knows.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  RGAA_VERSIONS,
  RGAA_THEMES,
  RGAA_CRITERIA,
  RGAA_TESTS,
  rgaaCriteriaForSc
} = require('../map');
const { buildTables, renderModule, formatted, plainText } = require('../scripts/generate-map');
const { wcagCriteria } = require('../../../src/wcag');

const V = '4.1.2';
// The WCAG Level A and AA criteria that make up a given WCAG version.
const wcagAAFor = (wcagVersion) =>
  wcagCriteria(wcagVersion, { levels: ['A', 'AA'] }).map((c) => c.sc);

// --- generated, not hand-edited ------------------------------------------------

test('the committed module is exactly what the generator makes of the source data', async () => {
  const expected = await formatted(renderModule(buildTables()));
  const actual = fs.readFileSync(path.join(__dirname, '..', 'map.js'), 'utf8');
  assert.equal(actual, expected, 'run npm run rgaa-map');
});

test('plainText: glossary links keep their words, code spans lose their backticks', () => {
  assert.equal(
    plainText(
      'Chaque [image porteuse d’information](#image-porteuse-d-information) (balise `<img>`) ?'
    ),
    'Chaque image porteuse d’information (balise <img>) ?'
  );
});

// --- what RGAA 4.1.2 says ----------------------------------------------------

test('every version has its tables, and every table a version', () => {
  const versions = RGAA_VERSIONS.map((v) => v.version).sort();
  for (const table of [RGAA_THEMES, RGAA_CRITERIA, RGAA_TESTS]) {
    assert.deepEqual(Object.keys(table).sort(), versions);
  }
  assert.deepEqual(RGAA_VERSIONS, [{ version: '4.1.2', published: '2023-04', wcagVersion: '2.1' }]);
});

test('RGAA 4.1.2 has 13 themes, 106 criteria and 258 tests', () => {
  assert.equal(RGAA_THEMES[V].length, 13);
  assert.equal(Object.keys(RGAA_CRITERIA[V]).length, 106);
  assert.equal(Object.keys(RGAA_TESTS[V]).length, 258);
  assert.deepEqual(
    RGAA_THEMES[V].map((t) => t.number),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
  );
  assert.equal(RGAA_THEMES[V][0].title, 'Images');
  assert.equal(RGAA_THEMES[V][12].title, 'Consultation');
});

test('criteria and tests agree on which tests belong to which criterion', () => {
  for (const [id, criterion] of Object.entries(RGAA_CRITERIA[V])) {
    assert.equal(id.split('.')[0], String(criterion.theme), id);
    assert.ok(criterion.tests.length > 0, id);
    for (const testId of criterion.tests) {
      assert.ok(testId.startsWith(`${id}.`), testId);
      assert.equal(RGAA_TESTS[V][testId].criterion, id, testId);
    }
  }
  const listed = Object.values(RGAA_CRITERIA[V]).flatMap((c) => c.tests);
  assert.deepEqual(listed.slice().sort(), Object.keys(RGAA_TESTS[V]).sort());
});

test('every title and condition is plain text: trimmed, no Markdown left', () => {
  const texts = [
    ...RGAA_THEMES[V].map((t) => t.title),
    ...Object.values(RGAA_CRITERIA[V]).map((c) => c.title),
    ...Object.values(RGAA_TESTS[V]).flatMap((t) => [t.title, ...(t.conditions || [])])
  ];
  for (const text of texts) {
    assert.ok(text && text === text.trim(), text);
    assert.doesNotMatch(text, /\]\(#|`/, text);
  }
});

test('every criterion relates to WCAG 2.1 A or AA criteria, as RGAA says', () => {
  const aa = wcagAAFor('2.1');
  for (const [id, criterion] of Object.entries(RGAA_CRITERIA[V])) {
    assert.ok(criterion.wcagSc.length > 0, id);
    for (const sc of criterion.wcagSc) assert.ok(aa.includes(sc), `${id} ${sc}`);
  }
});

test('RGAA 4.1.2 relates to every WCAG 2.1 A and AA criterion except 1.2.4 Captions (Live)', () => {
  const referenced = new Set(Object.values(RGAA_CRITERIA[V]).flatMap((c) => c.wcagSc));
  assert.deepEqual(
    wcagAAFor('2.1').filter((sc) => !referenced.has(sc)),
    ['1.2.4']
  );
});

test("the wording is RGAA's own", () => {
  assert.equal(
    RGAA_CRITERIA[V]['1.1'].title,
    'Chaque image porteuse d’information a-t-elle une alternative textuelle ?'
  );
  assert.deepEqual(RGAA_CRITERIA[V]['1.1'].wcagSc, ['1.1.1']);
  assert.equal(RGAA_TESTS[V]['11.1.1'].conditions.length > 0, true);
  assert.equal('conditions' in RGAA_TESTS[V]['1.1.1'], false);
});

test('rgaaCriteriaForSc: every criterion RGAA relates to the WCAG criterion', () => {
  const found = rgaaCriteriaForSc('1.1.1');
  assert.ok(found.length > 1, 'one WCAG criterion spans several RGAA criteria');
  assert.ok(
    found.every((c) => c.version === V && RGAA_CRITERIA[V][c.criterion].wcagSc.includes('1.1.1'))
  );
  assert.deepEqual(found[0], {
    version: V,
    criterion: '1.1',
    title: RGAA_CRITERIA[V]['1.1'].title
  });
  assert.deepEqual(rgaaCriteriaForSc(' 1.1.1 '), found);
  assert.deepEqual(rgaaCriteriaForSc('1.2.4'), []);
  assert.deepEqual(rgaaCriteriaForSc('1.4.6'), []);
  assert.deepEqual(rgaaCriteriaForSc(null), []);
});

// --- the public entry point ----------------------------------------------------

test('@surea11y/core/rgaa exposes the tables, frozen', () => {
  const pub = require('../../../src/rgaa.js');
  assert.deepEqual(Object.keys(pub).sort(), [
    'RGAA_CRITERIA',
    'RGAA_TESTS',
    'RGAA_THEMES',
    'RGAA_VERSIONS',
    'rgaaCriteriaForSc'
  ]);
  assert.ok(Object.isFrozen(pub.RGAA_CRITERIA[V]['1.1'].wcagSc));
  assert.ok(Object.isFrozen(pub.RGAA_TESTS[V]['11.1.1'].conditions));
  assert.throws(() => {
    'use strict';
    pub.RGAA_CRITERIA[V]['1.1'].title = 'x';
  }, TypeError);
});
