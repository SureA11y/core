'use strict';

/**
 * ACME B4 and B5: requirements checked by rules ACME does not own. B4 makes
 * two of core's best-practice rules mandatory, B5 reuses RGAA's own
 * skip-link-present. Stress points 6 and 7 of DESIGN.md, and finding F5.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../../../src/index.js');
const { runa11yCoreOnHtml } = require('../../../tests/helpers/runDomRulesOnHtml.js');
const { renderHtmlReport } = require('../../../src/report.js');

// Navigation before the main content and no skip link (B5 fails), a skipped
// heading level and content outside every landmark (B4 asks).
const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body>' +
  '<nav><a href="/a">A</a> <a href="/b">B</a></nav>' +
  '<main><h1>Title</h1><h3>Section</h3></main><p>Outside</p></body></html>';

const scan = (engineOptions) => runa11yCoreOnHtml(PAGE, { engineOptions });
const outcome = (result, id) => {
  const r = result.checksResults.find((c) => c.ruleId === id);
  return r ? r.outcome : null;
};
const acmeRollups = (result) =>
  result.rulesResults.filter((r) => r.meta && r.meta.standard === 'ACME');

test("ACME's profile runs the core best-practice rules it maps (stress 6)", () => {
  const result = scan({ profile: 'acme-2.0' });
  assert.equal(outcome(result, 'heading-order'), 'cantTell');
  assert.equal(outcome(result, 'region'), 'cantTell');
  const wcag = scan({ profile: 'wcag22-aa' });
  assert.equal(outcome(wcag, 'heading-order'), null);
  assert.equal(outcome(wcag, 'region'), null);
});

test('a rollup per requirement, grouping the rules that check it', () => {
  const rollups = acmeRollups(scan({ profile: 'acme-2.0' }));
  assert.deepEqual(
    rollups.map((r) => [r.ruleId, r.outcome]),
    [
      ['acme-2.0-B2', 'notApplicable'],
      ['acme-2.0-B3', 'fail'],
      ['acme-2.0-B4', 'cantTell'],
      ['acme-2.0-B5', 'fail']
    ]
  );
  const b4 = rollups[2];
  assert.equal(b4.title, 'Headings are in order and the page has landmarks');
  assert.deepEqual(
    b4.meta.normativeMappings.filter((m) => m.standard === 'ACME').map((m) => m.requirement),
    ['B4']
  );
});

// Before the fix, a profile ran its standard's rollups for every version: one
// tag selected them all.
test("each profile produces its own version's rollups; optInRules: 'all' every version's", () => {
  const ids = (engineOptions) => acmeRollups(scan(engineOptions)).map((r) => r.ruleId);
  const B = (v) => ['B2', 'B3', 'B4', 'B5'].map((r) => `acme-${v}-${r}`);
  assert.deepEqual(ids({ profile: 'acme-1.0' }), B('1.0'));
  assert.deepEqual(ids({ profile: 'acme-2.0' }), B('2.0'));
  assert.deepEqual(ids({ optInRules: 'all' }), [
    'acme-1.0-B2',
    'acme-1.0-B3',
    'acme-1.0-B4',
    'acme-1.0-B5',
    'acme-2.0-B2',
    'acme-2.0-B3',
    'acme-2.0-B4',
    'acme-2.0-B5'
  ]);
  assert.deepEqual(ids({ profile: 'wcag22-aa' }), []);
  assert.deepEqual(
    core
      .getRulesCatalog({ profile: 'acme-2.0' })
      .map((r) => r.id)
      .filter((id) => id.startsWith('acme-')),
    B('2.0'),
    'the catalog lists what the scan produces'
  );
});

test('the HTML report gives ACME its own section, with its note', () => {
  const html = renderHtmlReport(scan({ profile: 'acme-2.0' }));
  assert.match(html, /<h2>ACME rollup<\/h2>/);
  assert.match(html, /One row per ACME requirement that a rule is linked to/);
});

// Finding F5 (DESIGN.md): naming RGAA's opt-in rule in ACME's table is enough
// to run it under ACME's profile. ACME now depends on RGAA, and nothing
// declares it; only the build's table check would notice RGAA going.
test('F5, as it stands: ACME runs an RGAA rule just by mapping it (stress 7)', () => {
  const result = scan({ profile: 'acme-2.0' });
  assert.equal(outcome(result, 'skip-link-present'), 'fail');
  const tags = core.getChecksCatalog().find((r) => r.ruleId === 'skip-link-present').tags;
  assert.ok(tags.includes('rgaa') && !tags.includes('acme'));
  assert.equal(outcome(scan({}), 'skip-link-present'), null, 'still opt-in elsewhere');
});
