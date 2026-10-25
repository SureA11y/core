'use strict';

/**
 * A lean: which way a cantTell finding points, when the page gives evidence
 * for one (docs/OUTPUT_SCHEMA.md, "Leans"). The outcome stays cantTell; the
 * engine keeps a well-formed lean on a cantTell-tier occurrence only,
 * translates its texts, and the reporters show it or, when asked, gate on it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeLean } = require('../src/core/lean');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderHtmlReport } = require('../src/report.js');

const page = (body) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;

test('normalizeLean keeps a well-formed lean and drops what is not', () => {
  assert.deepEqual(
    normalizeLean({
      toward: 'fail',
      why: ' The heading skips a level. ',
      signals: [
        { signal: 'heading-level-skipped', value: true },
        { signal: 'Bad Name', value: 1 },
        { signal: 'object-value', value: { a: 1 } },
        { signal: 'infinite', value: Infinity }
      ],
      caution: '',
      measured: { agreed: 3, cases: 2 },
      i18n: { whyKey: 'k', params: { a: 1 } }
    }),
    {
      toward: 'fail',
      why: 'The heading skips a level.',
      signals: [{ signal: 'heading-level-skipped', value: true }],
      i18n: { whyKey: 'k', params: { a: 1 } }
    }
  );
  assert.deepEqual(
    normalizeLean({ toward: 'pass', why: 'w', measured: { agreed: 9, cases: 10, corpus: 'act' } }),
    {
      toward: 'pass',
      why: 'w',
      signals: [],
      measured: { agreed: 9, cases: 10, corpus: 'act' }
    }
  );
  for (const bad of [
    null,
    [],
    'fail',
    { toward: 'maybe', why: 'w' },
    { toward: 'fail' },
    { toward: 'fail', why: ' ' }
  ]) {
    assert.equal(normalizeLean(bad), null, JSON.stringify(bad));
  }
});

// A custom rule returning what the engine is to clean up.
function scanWith(occurrences, outcome = 'cantTell') {
  const rule = {
    id: 'acme-lean',
    meta: { title: 'Lean probe', type: 'automatic', tags: ['best-practice'] },
    runInPage: (ctx) => {
      const el = ctx.document.querySelector('p');
      return {
        outcome,
        occurrences: occurrences.map((o) => ctx.helpers.reportOccurrence(el, o))
      };
    }
  };
  return runa11yCoreOnHtml(page('<main><p>x</p></main>'), {
    runOnly: ['acme-lean'],
    engineOptions: { customRules: [rule] }
  }).checksResults.find((r) => r.ruleId === 'acme-lean');
}

test('the engine keeps a lean on a cantTell occurrence and drops it on a decided one', () => {
  const lean = { toward: 'fail', why: 'Probably fails.', signals: [{ signal: 'probe', value: 1 }] };
  const probe = scanWith([
    { summary: 'a', occurrenceOutcome: 'cantTell', lean },
    { summary: 'b', occurrenceOutcome: 'fail', lean },
    { summary: 'c', occurrenceOutcome: 'cantTell', lean: { toward: 'unsure', why: 'x' } }
  ]);
  assert.equal(probe.outcome, 'fail');
  assert.deepEqual(probe.occurrences[0].lean, lean);
  assert.equal(probe.occurrences[1].lean, undefined);
  assert.equal(probe.occurrences[2].lean, undefined);
  assert.equal(probe.occurrences[2].occurrenceOutcome, 'cantTell');
});

test('a rule lean is translated in the scan locale', () => {
  const html = page('<main><h1>a</h1><h3>b</h3></main>');
  const en = runa11yCoreOnHtml(html, { runOnly: ['heading-order'] }).checksResults[0];
  const fr = runa11yCoreOnHtml(html, {
    runOnly: ['heading-order'],
    engineOptions: { locale: 'fr' }
  }).checksResults[0];
  assert.equal(en.outcome, 'cantTell');
  assert.equal(en.occurrences[0].lean.toward, 'fail');
  assert.equal(en.occurrences[0].lean.why, 'The heading skips a level after the one before it.');
  assert.equal(fr.occurrences[0].lean.why, 'Le titre saute un niveau par rapport au précédent.');
  assert.deepEqual(en.occurrences[0].lean.signals, [
    { signal: 'heading-level-skipped', value: true }
  ]);
});

test('a criterion the target removed, or the errata satisfy, leans pass', () => {
  const html = page('<p id="a">1</p><p id="a">2</p>');
  for (const [wcagVersion, key] of [
    ['2.2', 'engine_lean_why_removedSc'],
    ['2.1', 'engine_lean_why_errata']
  ]) {
    const rule = runa11yCoreOnHtml(html, {
      runOnly: ['duplicate-id'],
      engineOptions: { wcagVersion }
    }).checksResults[0];
    assert.equal(rule.outcome, 'cantTell');
    for (const o of rule.occurrences) {
      assert.equal(o.lean.toward, 'pass');
      assert.equal(o.lean.i18n.whyKey, key);
    }
  }
  const kept = runa11yCoreOnHtml(html, {
    engineOptions: { profile: 'en301549-v3.2.1' }
  }).checksResults.find((r) => r.ruleId === 'duplicate-id');
  assert.equal(kept.outcome, 'fail');
  assert.ok(kept.occurrences.every((o) => o.lean === undefined));
});

const LEANING = page('<main><h1>a</h1><h3>b</h3></main><main>x</main>');
const RULES = ['heading-order', 'landmark-no-duplicate-main'];

test('JUnit gates on likely failures only with leanFailAs: failure', () => {
  const result = runa11yCoreOnHtml(LEANING, { runOnly: RULES });
  assert.doesNotMatch(renderJunitReport(result), /<failure/);
  const gated = renderJunitReport(result, { leanFailAs: 'failure' });
  assert.equal((gated.match(/<failure type="leanFail"/g) || []).length, 2);
  assert.match(gated, /1 occurrence likely fails: /);
  assert.throws(() => renderJunitReport(result, { leanFailAs: 'yes' }), /leanFailAs must be/);
});

test('SARIF carries the lean, and raises likely failures to error when asked', () => {
  const result = runa11yCoreOnHtml(LEANING, { runOnly: RULES });
  const plain = JSON.parse(renderSarifReport(result)).runs[0].results;
  assert.ok(plain.length >= 2);
  assert.ok(plain.every((r) => r.level === 'warning' && r.properties.lean.toward === 'fail'));
  const raised = JSON.parse(renderSarifReport(result, { leanFailAs: 'error' })).runs[0].results;
  assert.ok(raised.every((r) => r.level === 'error'));
  assert.throws(() => renderSarifReport(result, { leanFailAs: 'fail' }), /leanFailAs must be/);
});

test('the HTML report groups undecided findings by their lean', () => {
  const result = runa11yCoreOnHtml(
    page(
      '<main><h1>a</h1><h3>b</h3><input type="checkbox" checked aria-checked="false" aria-label="A"><img src="x.png"></main>'
    ),
    { runOnly: ['heading-order', 'aria-checked-state-mismatch', 'img-alt-present'] }
  );
  const html = renderHtmlReport(result);
  const at = (s) => html.indexOf(s);
  assert.ok(at('Likely fails: confirm') > -1);
  assert.ok(at('Likely passes: confirm') > at('Likely fails: confirm'));
  assert.match(html, /Likely fails: The heading skips a level/);
  assert.match(html, /Likely passes: Browsers ignore aria-checked/);
});
