'use strict';

// engineOptions.output.detail: 'findings' (#163) keeps whole only the check
// results that report something; any other pass or notApplicable keeps its
// rule, outcome and type. Verdicts don't change, and the reporters read a
// compact result as the full one.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderHtmlReport } = require('../src/report.js');
const { renderEarlReport } = require('../src/earl.js');
const { buildBaselineEntries } = require('../src/baseline.js');
const { getMargins } = require('../src/index.js');

const EMPTY =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>';
const FIXTURE = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'img-alt-present-all-scenarios.html'),
  'utf8'
);

function both(html, engineOptions = {}) {
  const opts = (extra) => ({
    url: 'https://example.test/',
    engineOptions: { timestamp: '2026-10-08T00:00:00Z', ...engineOptions, ...extra }
  });
  return {
    full: runa11yCoreOnHtml(html, opts({})),
    compact: runa11yCoreOnHtml(html, opts({ output: { detail: 'findings' } }))
  };
}

test('a compact result keeps whole only the results that report something', () => {
  const { full, compact } = both(FIXTURE);
  assert.equal(compact.engine.outputDetail, 'findings');
  assert.equal('outputDetail' in full.engine, false);
  assert.equal(compact.checksResults.length, full.checksResults.length);
  for (let i = 0; i < full.checksResults.length; i++) {
    const f = full.checksResults[i];
    const c = compact.checksResults[i];
    const reports =
      f.outcome === 'fail' || f.outcome === 'cantTell' || (f.occurrences && f.occurrences.length);
    if (reports) {
      // Each result carries the scan's engineOptions, output.detail included.
      const { engineOptions: ce, ...cRest } = c;
      const { engineOptions: fe, ...fRest } = f;
      assert.deepEqual(cRest, fRest, f.ruleId);
      assert.deepEqual(ce.output, { detail: 'findings' });
      assert.equal(fe.output, undefined);
    } else {
      const expected = { ruleId: f.ruleId, outcome: f.outcome, type: f.type };
      if (f.margin) expected.margin = f.margin;
      if (f.error != null) expected.error = f.error;
      assert.deepEqual(c, expected, f.ruleId);
    }
  }
  // The rollups were built from the whole results: the same verdicts.
  assert.deepEqual(
    compact.rulesResults.map((r) => [r.ruleId, r.outcome]),
    full.rulesResults.map((r) => [r.ruleId, r.outcome])
  );
  assert.deepEqual(getMargins(compact), getMargins(full));
});

test('a compact result is about a third of the size on an empty page', () => {
  const { full, compact } = both(EMPTY);
  const size = (r) => Buffer.byteLength(JSON.stringify(r));
  assert.ok(size(compact) < size(full) * 0.4, `${size(compact)} of ${size(full)}`);
});

test('every reporter reads a compact result as the full one', () => {
  for (const engineOptions of [
    {},
    { locale: 'de', mappings: 'en301549' },
    { profile: 'en301549-v4.1.1' }
  ]) {
    const { full, compact } = both(FIXTURE, engineOptions);
    const label = JSON.stringify(engineOptions);
    assert.equal(renderSarifReport(compact), renderSarifReport(full), `SARIF ${label}`);
    assert.equal(renderJunitReport(compact), renderJunitReport(full), `JUnit ${label}`);
    assert.equal(renderHtmlReport(compact), renderHtmlReport(full), `HTML ${label}`);
    assert.deepEqual(renderEarlReport(compact), renderEarlReport(full), `EARL ${label}`);
    assert.deepEqual(
      buildBaselineEntries(compact),
      buildBaselineEntries(full),
      `baseline ${label}`
    );
  }
});

test('a compact custom rule is named by its id in the reporters', () => {
  const result = runa11yCoreOnHtml(EMPTY, {
    url: 'https://example.test/',
    runOnly: ['acme-x'],
    engineOptions: {
      output: { detail: 'findings' },
      customRules: [
        {
          id: 'acme-x',
          meta: { title: 'X', tags: ['best-practice'] },
          runInPage: () => ({ outcome: 'pass', occurrences: [] })
        }
      ]
    }
  });
  assert.deepEqual(result.checksResults, [
    { ruleId: 'acme-x', outcome: 'pass', type: 'automatic' }
  ]);
  const rule = JSON.parse(renderSarifReport(result)).runs[0].tool.driver.rules[0];
  assert.equal(rule.id, 'acme-x');
  assert.equal(rule.shortDescription.text, 'acme-x');
});

test('output.detail takes full or findings', () => {
  const full = runa11yCoreOnHtml(EMPTY, { engineOptions: { output: { detail: 'full' } } });
  assert.equal('outputDetail' in full.engine, false);
  assert.ok(full.checksResults.every((c) => c.meta));
  assert.throws(
    () =>
      runa11yCoreOnHtml(EMPTY, {
        engineOptions: { strictOptions: true, output: { detail: 'compact' } }
      }),
    { code: 'INVALID_ENGINE_OPTIONS', message: /output\.detail must be one of "full", "findings"/ }
  );
});
