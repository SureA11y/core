'use strict';

/**
 * Direct tests for src/coverage/en301549-map.js.
 *
 * The table is hand-maintained from the ETSI text, so these pin it against the
 * engine's own WCAG registry: each version must restate exactly the Level A
 * and AA criteria of the WCAG version it is built on, no more and no fewer. A
 * missing row would leave a composite with no clause; an extra one would claim
 * EN 301 549 covers a criterion it does not.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  EN301549_VERSIONS,
  EN301549_CLAUSES,
  en301549ClausesForSc,
  en301549MappingsForScs
} = require('../../src/coverage/en301549-map');
const { FACETS } = require('../../src/coverage/wcag-facets');
const { introducedInVersion, removedInVersion } = require('../../src/coverage/wcag-version-map');
const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');

const VERSION_ORDER = ['2.0', '2.1', '2.2'];

// The WCAG Level A and AA criteria that make up a given WCAG version. 4.1.1
// carries no level in the registry, since 2.2 removed it; it was Level A.
function wcagAAFor(wcagVersion) {
  const max = VERSION_ORDER.indexOf(wcagVersion);
  return Object.keys(FACETS).filter((sc) => {
    if (FACETS[sc].level === 'AAA') return false;
    if (VERSION_ORDER.indexOf(introducedInVersion(sc)) > max) return false;
    const removed = removedInVersion(sc);
    return !(removed && VERSION_ORDER.indexOf(removed) <= max);
  });
}

test('every version has a clause table, and every table a version', () => {
  assert.deepEqual(
    EN301549_VERSIONS.map((v) => v.version).sort(),
    Object.keys(EN301549_CLAUSES).sort()
  );
});

test('each version restates exactly the WCAG A and AA criteria it is built on', () => {
  for (const { version, wcagVersion } of EN301549_VERSIONS) {
    assert.deepEqual(
      Object.keys(EN301549_CLAUSES[version]).sort(),
      wcagAAFor(wcagVersion).sort(),
      version
    );
  }
});

test('the criteria counts match the published WCAG totals', () => {
  assert.equal(Object.keys(EN301549_CLAUSES['V3.2.1']).length, 50);
  assert.equal(Object.keys(EN301549_CLAUSES['V4.1.1']).length, 55);
});

test('every clause is numbered 9. plus its criterion and has a title', () => {
  for (const [version, rows] of Object.entries(EN301549_CLAUSES)) {
    for (const [sc, row] of Object.entries(rows)) {
      assert.equal(row.clause, `9.${sc}`, `${version} ${sc}`);
      assert.ok(row.title && row.title.trim() === row.title, `${version} ${sc}`);
    }
  }
});

test('en301549ClausesForSc: a criterion in both versions gets both, oldest first', () => {
  assert.deepEqual(en301549ClausesForSc('1.4.3'), [
    { version: 'V3.2.1', clause: '9.1.4.3', title: 'Contrast (minimum)' },
    { version: 'V4.1.1', clause: '9.1.4.3', title: 'Contrast (minimum)' }
  ]);
});

test('en301549ClausesForSc: titles follow each version\'s own wording', () => {
  assert.deepEqual(
    en301549ClausesForSc('1.2.2').map((c) => c.title),
    ['Captions (pre-recorded)', 'Subtitles (pre-recorded)']
  );
});

test('en301549ClausesForSc: WCAG 2.2 additions exist only in V4.1.1', () => {
  for (const sc of ['2.4.11', '2.5.7', '2.5.8', '3.2.6', '3.3.7', '3.3.8']) {
    assert.deepEqual(
      en301549ClausesForSc(sc).map((c) => c.version),
      ['V4.1.1'],
      sc
    );
  }
});

test('en301549ClausesForSc: 4.1.1 Parsing exists only in V3.2.1', () => {
  assert.deepEqual(en301549ClausesForSc('4.1.1'), [
    { version: 'V3.2.1', clause: '9.4.1.1', title: 'Parsing' }
  ]);
});

test('en301549ClausesForSc: AAA criteria and non-criteria get no clause', () => {
  for (const sc of ['1.4.6', '2.4.13', '3.3.9', '', null, undefined, '9.9.9']) {
    assert.deepEqual(en301549ClausesForSc(sc), [], String(sc));
  }
});

test('en301549ClausesForSc: surrounding whitespace does not change the answer', () => {
  assert.deepEqual(en301549ClausesForSc(' 2.5.8 '), en301549ClausesForSc('2.5.8'));
});

// --- attaching clauses to normativeMappings ---------------------------------

const enOf = (mappings) => mappings.filter((m) => m.standard === 'EN 301 549');

test('en301549MappingsForScs: one entry per version, naming the criterion it restates', () => {
  assert.deepEqual(en301549MappingsForScs(['1.4.3']), [
    { standard: 'EN 301 549', version: 'V3.2.1', requirement: '9.1.4.3', title: 'Contrast (minimum)', wcagSc: ['1.4.3'] },
    { standard: 'EN 301 549', version: 'V4.1.1', requirement: '9.1.4.3', title: 'Contrast (minimum)', wcagSc: ['1.4.3'] }
  ]);
});

test('en301549MappingsForScs: AAA criteria contribute nothing', () => {
  assert.deepEqual(en301549MappingsForScs(['1.4.6', '2.4.9']), []);
});

test('a scan that asks for them attaches EN 301 549 clauses to atomic and composite results', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
  const result = runa11yCoreOnHtml(html, { engineOptions: { mappings: ['en301549'] } });

  const atomic = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.deepEqual(
    enOf(atomic.meta.normativeMappings).map((m) => `${m.version} ${m.requirement}`),
    ['V3.2.1 9.1.1.1', 'V4.1.1 9.1.1.1']
  );

  const composite = (sc) => result.rulesResults.find((r) => r.ruleId.startsWith(`wcag-${sc}-`));
  const versions = (sc) => enOf(composite(sc).meta.normativeMappings).map((m) => m.version);
  assert.deepEqual(versions('1.1.1'), ['V3.2.1', 'V4.1.1']);
  assert.deepEqual(versions('2.5.8'), ['V4.1.1']);
  assert.deepEqual(versions('4.1.1'), ['V3.2.1']);
  assert.deepEqual(versions('1.4.6'), []);

  // The WCAG entry stays first: consumers that read [0] still get the criterion.
  assert.equal(composite('1.1.1').meta.normativeMappings[0].standard, 'WCAG');

  // Without asking, a result names WCAG only.
  const plain = runa11yCoreOnHtml(html, {});
  for (const r of plain.checksResults.concat(plain.rulesResults)) {
    assert.deepEqual(enOf(r.meta.normativeMappings), [], r.ruleId);
  }
});

// --- the public entry point ----------------------------------------------------

test('@surea11y/core/en301549 exposes the table, frozen', () => {
  const pub = require('../../src/en301549.js');
  assert.deepEqual(Object.keys(pub).sort(), [
    'EN301549_CLAUSES',
    'EN301549_VERSIONS',
    'en301549ClausesForSc'
  ]);
  assert.equal(Object.keys(pub.EN301549_CLAUSES['V3.2.1']).length, 50);
  assert.ok(Object.isFrozen(pub.EN301549_CLAUSES['V4.1.1']['1.4.3']));
  assert.throws(() => {
    'use strict';
    pub.EN301549_CLAUSES['V4.1.1']['1.4.3'].clause = 'x';
  }, TypeError);
});

test('composite entries in the rules catalog carry their EN 301 549 clauses', () => {
  const core = require('../../src/index.js');
  const composite = core.getRulesCatalog().find((c) => c.id === 'wcag-1.1.1-non-text-content');
  assert.deepEqual(
    enOf(composite.meta.standardMappings).map((m) => `${m.version} ${m.requirement}`),
    ['V3.2.1 9.1.1.1', 'V4.1.1 9.1.1.1']
  );
});
