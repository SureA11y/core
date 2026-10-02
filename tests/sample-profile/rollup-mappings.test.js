'use strict';

/**
 * A rollup names the requirements of a rule-mapped standard from the rules
 * that produced its outcome, not from every rule it groups: such a standard
 * is mapped rule by rule, and the requirements of a rule that passed or did
 * not apply say nothing about why the rollup failed. EN 301 549 restates the
 * rollup's own criterion, so its clause stays whichever rule decided. Run
 * against the engine copy with the sample profile (tests/helpers/sampleEngine.js),
 * which maps img-alt-present to S1, img-alt-decorative to S3 and
 * aria-hidden-body to S8.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { requireSample } = require('../helpers/sampleEngine');

const { runa11yCoreOnHtml } = requireSample('tests/helpers/runDomRulesOnHtml.js');
const { renderHtmlReport } = requireSample('src/report.js');
const core = requireSample('src/core.js');

function page(body) {
  return (
    '<!doctype html><html lang="en"><head><title>Report</title></head><body><main>' +
    body +
    '</main></body></html>'
  );
}

const SAMPLE = { profile: 'sample-1.0' };

function rollup(html, prefix, engineOptions = SAMPLE) {
  const result = runa11yCoreOnHtml(html, { engineOptions });
  return { result, composite: result.rulesResults.find((r) => r.ruleId.startsWith(prefix)) };
}

const sampleOf = (composite) =>
  composite.meta.normativeMappings
    .filter((m) => m.standard === 'Sample Standard')
    .map((m) => m.requirement);
const enOf = (composite) =>
  composite.meta.normativeMappings.filter((m) => m.standard === 'EN 301 549');

test('a failing rollup names the requirements of its failing rules only', () => {
  const { composite } = rollup(page('<img src="a.png">'), 'wcag-1.1.1-');
  assert.equal(composite.outcome, 'fail');
  assert.deepEqual(sampleOf(composite), ['S1']);
  // The catalog entry still lists every rule's requirements.
  const entry = core.getCompositeRuleById('wcag-1.1.1-non-text-content', SAMPLE);
  assert.deepEqual(entry.meta.standardMappings.map((m) => m.requirement).sort(), [
    'S1',
    'S2',
    'S3'
  ]);
});

test('a cantTell rollup names the requirements of its undecided rules only', () => {
  // img-alt-present passes on alt="", img-alt-decorative asks whether it is.
  const { composite } = rollup(page('<img src="a.png" alt="">'), 'wcag-1.1.1-');
  assert.equal(composite.outcome, 'cantTell');
  assert.deepEqual(sampleOf(composite), ['S3']);
});

test('a passing rollup names the requirements of its passing rules', () => {
  // aria-hidden-body passes on a page whose <body> is not aria-hidden.
  const { composite } = rollup(page('<p>x</p>'), 'wcag-4.1.2-name');
  assert.equal(composite.outcome, 'pass');
  assert.deepEqual(sampleOf(composite), ['S8']);
});

test('a notApplicable rollup names no requirement', () => {
  const { composite } = rollup(page('<p>x</p>'), 'wcag-1.2.2-');
  assert.equal(composite.outcome, 'notApplicable');
  assert.deepEqual(sampleOf(composite), []);
});

test("a mapping option names each version's requirements", () => {
  const { composite } = rollup(page('<img src="a.png">'), 'wcag-1.1.1-', {
    mappings: ['sample']
  });
  assert.deepEqual(
    composite.meta.normativeMappings
      .filter((m) => m.standard === 'Sample Standard')
      .map((m) => `${m.version} ${m.requirement}`),
    ['1.0 S1', '2.0 S1']
  );
});

test('EN 301 549 clauses stay on the rollup whichever rules decided', () => {
  for (const [html, prefix] of [
    [page('<img src="a.png">'), 'wcag-1.1.1-'],
    [page('<p>x</p>'), 'wcag-1.2.2-']
  ]) {
    const { composite } = rollup(html, prefix, { mappings: ['sample', 'en301549'] });
    assert.deepEqual(
      enOf(composite).map((m) => m.version),
      ['V3.2.1', 'V4.1.1'],
      prefix
    );
  }
});

test('the mappings opt-in still applies to rollups', () => {
  const { composite } = rollup(page('<img src="a.png">'), 'wcag-1.1.1-', {});
  assert.deepEqual(
    composite.meta.normativeMappings.map((m) => m.standard),
    ['WCAG']
  );
});

test('the HTML report rollup row lists only the requirements that produced the outcome', () => {
  const { result } = rollup(page('<img src="a.png">'), 'wcag-1.1.1-');
  assert.match(
    renderHtmlReport(result),
    /WCAG 1\.1\.1<br><span class="note">Sample Standard S1<\/span>/
  );
});
