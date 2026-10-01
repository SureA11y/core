'use strict';

/**
 * A rollup's RGAA tests come from the rules that produced its outcome, not
 * from every rule it groups: RGAA is mapped rule by rule, and the tests of a
 * rule that passed or did not apply say nothing about why the rollup failed.
 * EN 301 549 restates the rollup's own criterion, so its clause stays
 * whichever rule decided.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { renderHtmlReport } = require('../src/report.js');
const core = require('../src/core.js');

function page(body) {
  return (
    '<!doctype html><html lang="en"><head><title>Report</title></head><body><main>' +
    body +
    '</main></body></html>'
  );
}

function rollup(html, prefix, engineOptions = { mappings: ['rgaa', 'en301549'] }) {
  const result = runa11yCoreOnHtml(html, { engineOptions });
  return {
    result,
    composite: result.rulesResults.find((r) => r.ruleId.startsWith(prefix))
  };
}

const rgaaOf = (composite) =>
  composite.meta.normativeMappings.filter((m) => m.standard === 'RGAA').map((m) => m.requirement);
const enOf = (composite) =>
  composite.meta.normativeMappings.filter((m) => m.standard === 'EN 301 549');

test('a failing rollup names the RGAA tests of its failing rules only', () => {
  const { composite } = rollup(page('<img src="a.png">'), 'wcag-1.1.1-', {
    profile: 'rgaa-4.1.2'
  });
  assert.equal(composite.outcome, 'fail');
  assert.deepEqual(rgaaOf(composite), ['1.1.1', '1.2.1']);
  // The catalog entry still lists every rule's tests.
  const entry = core.getCompositeRuleById('wcag-1.1.1-non-text-content', { profile: 'rgaa-4.1.2' });
  assert.ok(entry.meta.standardMappings.length > 2);
});

test('a cantTell rollup names the RGAA tests of its undecided rules only', () => {
  // img-alt-present passes, img-alt-quality asks for review.
  const { composite } = rollup(page('<img src="a.png" alt="Chart of sales">'), 'wcag-1.1.1-');
  assert.equal(composite.outcome, 'cantTell');
  assert.deepEqual(rgaaOf(composite), ['1.3.1']);
});

test('a passing rollup names the RGAA tests of its passing rules', () => {
  // aria-hidden-body passes on a page whose <body> is not aria-hidden.
  const { composite } = rollup(page('<p>x</p>'), 'wcag-4.1.2-name');
  assert.equal(composite.outcome, 'pass');
  assert.deepEqual(rgaaOf(composite), ['10.8.1']);
});

test('a notApplicable rollup names no RGAA test', () => {
  const { composite } = rollup(page('<p>x</p>'), 'wcag-1.2.2-');
  assert.equal(composite.outcome, 'notApplicable');
  assert.deepEqual(rgaaOf(composite), []);
});

test('EN 301 549 clauses stay on the rollup whichever rules decided', () => {
  for (const [html, prefix] of [
    [page('<img src="a.png">'), 'wcag-1.1.1-'],
    [page('<p>x</p>'), 'wcag-1.2.2-']
  ]) {
    const { composite } = rollup(html, prefix);
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

test('the HTML report rollup row lists only the tests that produced the outcome', () => {
  const { result } = rollup(page('<img src="a.png">'), 'wcag-1.1.1-', { profile: 'rgaa-4.1.2' });
  const html = renderHtmlReport(result);
  assert.match(html, /WCAG 1\.1\.1<br><span class="note">RGAA 1\.1\.1, 1\.2\.1<\/span>/);
});
