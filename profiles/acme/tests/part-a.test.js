'use strict';

/**
 * ACME Part A: WCAG's A and AA criteria renumbered `A.<sc>`, per version, and
 * how they show on results, rollups and reports. Stress points 1, 9, 11 and
 * 14 of DESIGN.md.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../../../tests/helpers/runDomRulesOnHtml.js');
const { renderHtmlReport } = require('../../../src/report.js');
const { renderSarifReport } = require('../../../src/sarif.js');
const { renderJunitReport } = require('../../../src/junit.js');
const { ACME_PART_A } = require('../part-a');
const { buildTable, renderModule, formatted } = require('../scripts/generate-part-a');

// Low-contrast text fails 1.4.3; nothing on the page is video, so 1.2.2 is
// notApplicable.
const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<p style="color:#777;background:#fff">grey text</p></main></body></html>';

const acme = (r) => (r.meta.normativeMappings || []).filter((m) => m.standard === 'ACME');
const ids = (r) => acme(r).map((m) => `${m.version}:${m.requirement}`);
const scan = (engineOptions) => runa11yCoreOnHtml(PAGE, { engineOptions });
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);

test('part-a.js is what the generator makes of WCAG', async () => {
  const actual = fs.readFileSync(path.join(__dirname, '..', 'part-a.js'), 'utf8');
  assert.equal(actual, await formatted(renderModule(buildTable())));
});

test('1.0 restates WCAG 2.1 A and AA, 4.1.1 included; 2.0 restates WCAG 2.2', () => {
  assert.equal(Object.keys(ACME_PART_A['1.0']).length, 50);
  assert.equal(Object.keys(ACME_PART_A['2.0']).length, 55);
  assert.deepEqual(ACME_PART_A['1.0']['4.1.1'], { requirement: 'A.4.1.1', title: 'Parsing' });
  assert.equal(ACME_PART_A['2.0']['4.1.1'], undefined);
  assert.equal(ACME_PART_A['1.0']['2.5.8'], undefined);
  assert.equal(ACME_PART_A['2.0']['2.5.8'].requirement, 'A.2.5.8');
});

test("mappings: ['acme'] names every version that restates a rule's criteria", () => {
  const result = scan({ mappings: ['acme'] });
  assert.deepEqual(ids(check(result, 'contrast-minimum')), ['1.0:A.1.4.3', '2.0:A.1.4.3']);
  assert.deepEqual(ids(check(result, 'target-size-minimum')), ['2.0:A.2.5.8']);
  assert.deepEqual(acme(check(result, 'contrast-minimum'))[0], {
    standard: 'ACME',
    version: '1.0',
    requirement: 'A.1.4.3',
    title: 'Contrast (Minimum)',
    wcagSc: ['1.4.3']
  });
});

test("each profile runs its WCAG version's rules and names its own version only", () => {
  const pairs = [
    ['acme-1.0', 'en301549-v3.2.1', '1.0'],
    ['acme-2.0', 'wcag22-aa', '2.0']
  ];
  for (const [profile, sameRulesAs, version] of pairs) {
    const result = scan({ profile });
    assert.equal(result.engine.profile, profile);
    assert.deepEqual(
      result.checksResults.map((r) => r.ruleId).sort(),
      scan({ profile: sameRulesAs })
        .checksResults.map((r) => r.ruleId)
        .sort(),
      `${profile} runs what ${sameRulesAs} runs: Part B adds no rule yet`
    );
    assert.deepEqual(ids(check(result, 'contrast-minimum')), [`${version}:A.1.4.3`]);
  }
});

test('a failing WCAG rollup names its Part A requirement', () => {
  const result = scan({ profile: 'acme-2.0' });
  assert.deepEqual(ids(rollup(result, 'wcag-1.4.3-contrast-minimum')), ['2.0:A.1.4.3']);
});

// Finding F3 (DESIGN.md): `ruleMapped` is one flag per standard. ACME needs it
// for Part B, so a notApplicable rollup names no Part A requirement, while
// EN 301 549, which restates WCAG the same way, names its clause.
test('F3, as it stands: a notApplicable rollup names EN 301 549 but not Part A', () => {
  const result = scan({ mappings: ['acme', 'en301549'] });
  const r = rollup(result, 'wcag-1.2.2-captions-prerecorded');
  assert.equal(r.outcome, 'notApplicable');
  assert.ok(r.meta.normativeMappings.some((m) => m.standard === 'EN 301 549'));
  assert.deepEqual(acme(r), []);
});

test('a default run names no ACME requirement; RGAA and ACME together each name theirs', () => {
  assert.deepEqual(ids(check(scan({}), 'contrast-minimum')), []);
  // aria-hidden-body: RGAA 10.8.1, and WCAG 1.3.1 and 4.1.2.
  const both = check(scan({ mappings: ['rgaa', 'acme'] }), 'aria-hidden-body');
  const standards = new Set(both.meta.normativeMappings.map((m) => m.standard));
  assert.ok(standards.has('RGAA') && standards.has('ACME'));
});

test('the reporters name Part A: HTML, SARIF and JUnit', () => {
  const result = scan({ profile: 'acme-2.0' });
  assert.match(renderHtmlReport(result), /ACME A\.1\.4\.3/);
  assert.match(renderSarifReport(result), /"acme-A\.1\.4\.3"/);
  assert.match(renderJunitReport(result), /<property name="acme" value="A\.1\.4\.3"/);
});
