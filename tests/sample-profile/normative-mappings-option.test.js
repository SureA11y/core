'use strict';

/**
 * engineOptions.mappings and profiles with a rule-mapped standard registered:
 * naming the standard, or targeting it through a profile, adds its entries to
 * the scan result and to the catalogs alike. Run against the engine copy with
 * the sample profile (tests/helpers/sampleEngine.js), which maps
 * img-alt-present to S1.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { requireSample } = require('../helpers/sampleEngine');

const { runa11yCoreOnHtml } = requireSample('tests/helpers/runDomRulesOnHtml.js');
const core = requireSample('src/core.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<img src="a.png"></main></body></html>';

const scan = (engineOptions) => runa11yCoreOnHtml(HTML, { engineOptions });
const atomic = (r) => r.checksResults.find((c) => c.ruleId === 'img-alt-present');
const composite = (r) => r.rulesResults.find((c) => c.ruleId.startsWith('wcag-1.1.1-'));

test("naming the standard adds each rule's requirements, with their criteria", () => {
  const result = scan({ mappings: ['sample'] });
  assert.deepEqual(result.engine.mappings, ['sample']);
  const sample = atomic(result).meta.normativeMappings.filter(
    (m) => m.standard === 'Sample Standard'
  );
  assert.deepEqual(
    sample.map((m) => `${m.version} ${m.requirement} ${m.wcagSc}`),
    ['1.0 S1 1.1.1', '2.0 S1 1.1.1']
  );
  assert.ok(composite(result).meta.normativeMappings.some((m) => m.standard === 'Sample Standard'));
  // EN 301 549 stays off unless asked for too.
  assert.ok(!atomic(result).meta.normativeMappings.some((m) => m.standard === 'EN 301 549'));
});

const OPTION_SETS = [
  { mappings: ['sample'] },
  { mappings: ['en301549', 'sample'] },
  { mappings: 'sample:2.0' },
  { profile: 'sample-2.0' },
  { profile: 'sample-1.0', mappings: 'en301549:V4.1.1' }
];

test('every catalog entry names the same standards as its scan result, for each option set', () => {
  const HTML_ALL =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<img src="a.png"><h3>x</h3><a href="/x"></a><label for="nope">x</label></main></body></html>';
  for (const options of OPTION_SETS) {
    const catalog = new Map(core.getChecksCatalog(options).map((r) => [r.ruleId, r]));
    const result = runa11yCoreOnHtml(HTML_ALL, { engineOptions: options });
    assert.ok(result.checksResults.length > 100, JSON.stringify(options));
    for (const r of result.checksResults) {
      const where = `${JSON.stringify(options)} ${r.ruleId}`;
      assert.deepEqual(r.meta.normativeMappings, catalog.get(r.ruleId).normativeMappings, where);
      assert.deepEqual(
        core.getCheckDefById(r.ruleId, options).normativeMappings,
        catalog.get(r.ruleId).normativeMappings,
        where
      );
    }
  }
});

test('a profile switches its standard on in the catalog, and only when it would apply', () => {
  const standards = (entry) => [...new Set(entry.normativeMappings.map((m) => m.standard))];
  const img = (options, runOnly) =>
    core.getChecksForRunOnly(runOnly || null, options).find((r) => r.ruleId === 'img-alt-present');

  assert.deepEqual(standards(img({ profile: 'sample-2.0' })), ['WCAG', 'Sample Standard']);
  // An include overrides the profile in a scan, so it switches nothing on here either.
  assert.deepEqual(
    standards(img({ profile: 'sample-2.0' }, { includeRuleIds: ['img-alt-present'] })),
    ['WCAG']
  );
});

test("composite catalog entries filter their rules' other-standard entries the same way", () => {
  const byStandard = (entry) => [...new Set(entry.meta.standardMappings.map((m) => m.standard))];
  const id = 'wcag-1.1.1-non-text-content';
  assert.deepEqual(byStandard(core.getCompositeRuleById(id)), []);
  assert.deepEqual(byStandard(core.getCompositeRuleById(id, { mappings: 'sample' })), [
    'Sample Standard'
  ]);
});
