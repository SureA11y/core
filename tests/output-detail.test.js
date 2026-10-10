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

// Every reporter, compact against full.
function assertReportsAlike(full, compact, label) {
  assert.equal(renderSarifReport(compact), renderSarifReport(full), `SARIF ${label}`);
  assert.equal(renderJunitReport(compact), renderJunitReport(full), `JUnit ${label}`);
  assert.equal(renderHtmlReport(compact), renderHtmlReport(full), `HTML ${label}`);
  assert.deepEqual(renderEarlReport(compact), renderEarlReport(full), `EARL ${label}`);
  assert.deepEqual(buildBaselineEntries(compact), buildBaselineEntries(full), `baseline ${label}`);
}

const CUSTOM = {
  id: 'acme-x',
  meta: {
    title: 'X',
    tags: ['best-practice'],
    wcagSc: ['1.1.1'],
    helpUrl: 'https://example.test/acme-x',
    normativeMappings: [{ standard: 'EN 301 549', version: '3.2.1', requirement: '9.1.1.1' }]
  },
  runInPage: () => ({ outcome: 'pass', occurrences: [] })
};

test('a compact result keeps a passing custom rule whole', () => {
  const { full, compact } = both(FIXTURE, { customRules: [CUSTOM] });
  const kept = compact.checksResults.find((c) => c.ruleId === 'acme-x');
  assert.equal(kept.outcome, 'pass');
  assert.equal(kept.title, 'X');
  assert.equal(kept.meta.helpUrl, 'https://example.test/acme-x');
  // Core's own passing rules are still compact.
  assert.equal(compact.checksResults.find((c) => c.ruleId === 'aria-hidden-body').meta, undefined);
  assertReportsAlike(full, compact, 'custom rule');
});

test("a compact result keeps a rule whole when the caller's messages word it", () => {
  const { full, compact } = both(FIXTURE, {
    locale: 'de',
    messages: { de: { ariaHiddenBody_title: 'EIGENER TITEL' } }
  });
  const kept = compact.checksResults.find((c) => c.ruleId === 'aria-hidden-body');
  assert.equal(kept.title, 'EIGENER TITEL');
  // A rule the messages don't word stays compact.
  const other = full.checksResults.find(
    (c) => c.ruleId !== 'aria-hidden-body' && c.outcome === 'pass' && !c.occurrences.length
  );
  assert.equal(compact.checksResults.find((c) => c.ruleId === other.ruleId).meta, undefined);
  assertReportsAlike(full, compact, 'messages');
  // A locale of the caller's own.
  const own = both(FIXTURE, { locale: 'xx', messages: { xx: { ariaHiddenBody_title: 'XX' } } });
  assertReportsAlike(own.full, own.compact, 'own locale');
});

test('a compact result of a scan with packs keeps every rule whole', () => {
  const sample = require('./fixtures/packs/sample.js');
  const { full, compact } = both(FIXTURE, { packs: [sample], profile: 'sample-1.0' });
  assert.equal(compact.engine.outputDetail, 'findings');
  assert.deepEqual(
    compact.checksResults.filter((c) => !c.meta).map((c) => c.ruleId),
    []
  );
  assertReportsAlike(full, compact, 'packs');
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
