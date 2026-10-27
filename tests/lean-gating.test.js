'use strict';

/**
 * Gating on findings that lean fail (docs/LEANS.md): the shared reading of an
 * occurrence's outcome, leaningFailures and its scope, baseline entries for
 * such findings, and leanFailWcagOnly, in JUnit and SARIF alike.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { occurrenceOutcome, reviewGroupOf, leaningFailures } = require('../src/index.js');
const { buildBaselineEntries, matchBaseline } = require('../src/baseline.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderSarifReport } = require('../src/sarif.js');
const { makeOccurrence, makeCheckResult, makeScanResult } = require('./helpers/fake-result');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const LEAN = { toward: 'fail', why: 'The evidence points to fail.', signals: [] };

function leaning(overrides = {}) {
  return makeOccurrence({
    selector: 'table',
    html: '<table><tr><th></th></tr></table>',
    occurrenceOutcome: 'cantTell',
    lean: LEAN,
    data: { details: { reasonCode: 'TABLE_HEADER_EMPTY' } },
    ...overrides
  });
}

const wcag = (requirement, conformanceLevel = 'A') => ({
  standard: 'WCAG',
  version: '2.2',
  requirement,
  conformanceLevel
});

function leaningCheck(ruleId, mappings, occurrences = [leaning()]) {
  return makeCheckResult({
    ruleId,
    outcome: 'cantTell',
    type: 'manual',
    meta: { ruleId, normativeMappings: mappings },
    occurrences
  });
}

// A page with one WCAG rule's leaning finding, one best-practice rule's, and
// one of a rule mapped only to an AAA criterion, in an AA scan.
function mixedResult() {
  const result = makeScanResult([
    leaningCheck('th-has-data', [wcag('1.3.1')]),
    leaningCheck('heading-order', [], [leaning({ selector: 'h3', html: '<h3>Details</h3>' })]),
    leaningCheck(
      'aaa-only',
      [wcag('2.4.10', 'AAA')],
      [leaning({ selector: 'h2', html: '<h2></h2>' })]
    )
  ]);
  result.engine = { ...result.engine, wcagVersion: '2.2', wcagLevel: 'AA' };
  return result;
}

const HEADINGS =
  '<!doctype html><html lang="en"><head><title>T</title></head><body><main>' +
  '<h1>A</h1><h3>Details</h3></main></body></html>';

test('occurrenceOutcome: the occurrence tier, else the check outcome when it is fail or cantTell', () => {
  const fail = { outcome: 'fail' };
  assert.equal(occurrenceOutcome(fail, { occurrenceOutcome: 'cantTell' }), 'cantTell');
  assert.equal(occurrenceOutcome(fail, {}), 'fail');
  // The outcome an older label-in-name wrote on its occurrences.
  assert.equal(occurrenceOutcome({ outcome: 'cantTell' }, { outcome: 'fail' }), 'fail');
  assert.equal(occurrenceOutcome({ outcome: 'pass' }, {}), null);
  assert.equal(occurrenceOutcome({ outcome: 'notApplicable' }, null), null);
  assert.equal(occurrenceOutcome(null, null), null);
});

test('reviewGroupOf: a failure, a lean either way, or a question only a person answers', () => {
  const asked = { outcome: 'cantTell' };
  assert.equal(reviewGroupOf(asked, { lean: LEAN }), 'leanFail');
  assert.equal(reviewGroupOf(asked, { lean: { ...LEAN, toward: 'pass' } }), 'leanPass');
  assert.equal(reviewGroupOf(asked, {}), 'open');
  // A lean on a failure changes nothing, and an unknown direction is no lean.
  assert.equal(reviewGroupOf({ outcome: 'fail' }, { lean: LEAN }), 'fail');
  assert.equal(reviewGroupOf(asked, { lean: { toward: 'unsure' } }), 'open');
  // Each occurrence by its own tier, as occurrenceOutcome reads it.
  assert.equal(
    reviewGroupOf({ outcome: 'fail' }, { occurrenceOutcome: 'cantTell', lean: LEAN }),
    'leanFail'
  );
  assert.equal(reviewGroupOf({ outcome: 'pass' }, {}), null);
  assert.equal(reviewGroupOf(null, null), null);
});

test('reviewGroupOf sorts a scan as the HTML report groups its cards', () => {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>T</title></head><body><main>' +
      '<h1>A</h1><h3>B</h3><input type="checkbox" checked aria-checked="false" aria-label="A"><img src="x.png">' +
      '</main></body></html>',
    { runOnly: ['heading-order', 'aria-checked-state-mismatch', 'img-alt-present'] }
  );
  const groups = {};
  for (const check of result.checksResults) {
    for (const occ of check.occurrences) {
      const group = reviewGroupOf(check, occ);
      if (group) (groups[group] = groups[group] || []).push(check.ruleId);
    }
  }
  assert.deepEqual(groups, {
    leanFail: ['heading-order'],
    leanPass: ['aria-checked-state-mismatch'],
    fail: ['img-alt-present']
  });
});

test('leaningFailures: the findings that lean fail, less those of rules outside the target', () => {
  const all = leaningFailures(mixedResult());
  assert.deepEqual(
    all.map((l) => l.ruleId),
    ['th-has-data', 'heading-order']
  );
  assert.equal(all[0].reasonCode, 'TABLE_HEADER_EMPTY');
  assert.equal(all[0].occurrence.lean.toward, 'fail');
  assert.ok(!('frame' in all[0]));

  const wcagOnly = leaningFailures(mixedResult(), { wcagOnly: true });
  assert.deepEqual(
    wcagOnly.map((l) => l.ruleId),
    ['th-has-data']
  );
});

test('leaningFailures: a lean toward pass, and a failure, are not leaning failures', () => {
  const result = makeScanResult([
    leaningCheck('th-has-data', [wcag('1.3.1')], [leaning({ lean: { ...LEAN, toward: 'pass' } })]),
    makeCheckResult({ occurrences: [makeOccurrence({ lean: LEAN })] })
  ]);
  assert.deepEqual(leaningFailures(result), []);
  assert.throws(() => leaningFailures({ topFrame: {} }), TypeError);
});

test('leaningFailures: a finding inside a frame names the frame', () => {
  const frame = makeScanResult([leaningCheck('th-has-data', [wcag('1.3.1')])]);
  const crossFrame = {
    topFrame: makeScanResult([]),
    frames: [{ selector: '#embed', topFrame: frame, frames: [] }]
  };
  const found = leaningFailures(crossFrame);
  assert.equal(found.length, 1);
  assert.deepEqual(found[0].frame, ['#embed']);
});

test('buildBaselineEntries: entries for findings that lean fail only when asked, marked lean: fail', () => {
  const result = makeScanResult([makeCheckResult({}), ...mixedResult().checksResults]);
  result.engine = mixedResult().engine;
  assert.deepEqual(
    buildBaselineEntries(result).map((e) => e.ruleId),
    ['img-alt-present']
  );
  const entries = buildBaselineEntries(result, { leanFail: true });
  assert.deepEqual(
    entries.map((e) => [e.ruleId, e.lean]),
    [
      ['img-alt-present', undefined],
      ['th-has-data', 'fail'],
      ['heading-order', 'fail']
    ]
  );
  assert.equal(entries[1].reasonCode, 'TABLE_HEADER_EMPTY');
  assert.ok(!('lean' in entries[0]));
});

test('matchBaseline: lean entries are left out unless asked for, and match only findings that lean fail', () => {
  const result = mixedResult();
  const entries = buildBaselineEntries(result, { leanFail: true });
  const plain = matchBaseline(result, entries);
  assert.equal(plain.totalFail, 0);
  assert.equal(plain.staleCount, 0, 'a lean entry is not a stale failure');
  assert.ok(!('leanFail' in plain));

  const withLeans = matchBaseline(result, entries, { leanFail: true });
  assert.deepEqual(
    { ...withLeans.leanFail, newOccurrences: withLeans.leanFail.newOccurrences.length },
    { total: 2, knownCount: 2, newCount: 0, newOccurrences: 0, staleCount: 0 }
  );

  // A failure with the same identity as a lean entry is not known by it,
  // nor is a finding that leans fail known by a plain entry.
  const failing = makeScanResult([
    makeCheckResult({
      ruleId: 'th-has-data',
      occurrences: [leaning({ occurrenceOutcome: 'fail', lean: undefined })]
    })
  ]);
  const crossed = matchBaseline(failing, [entries[0]], { leanFail: true });
  assert.equal(crossed.newCount, 1);
  assert.equal(crossed.leanFail.staleCount, 1);
  const plainEntry = { ...entries[0] };
  delete plainEntry.lean;
  const other = matchBaseline(result, [plainEntry], { leanFail: true });
  assert.equal(other.staleCount, 1);
  assert.equal(other.leanFail.newCount, 2);
});

test('JUnit: a best-practice rule leaning fail gates under leanFailAs, and not with leanFailWcagOnly', () => {
  const result = runa11yCoreOnHtml(HEADINGS, {});
  assert.ok(
    leaningFailures(result).some((l) => l.ruleId === 'heading-order'),
    'heading-order leans fail on an <h1> then an <h3>'
  );
  const gated = renderJunitReport(result, { leanFailAs: 'failure' });
  assert.match(gated, /name="heading-order" time="0">\n\s+<failure type="leanFail"/);

  const wcagOnly = renderJunitReport(result, { leanFailAs: 'failure', leanFailWcagOnly: true });
  assert.doesNotMatch(wcagOnly, /type="leanFail"/);
  assert.match(wcagOnly, /name="heading-order" time="0">\n\s+<skipped/);

  assert.throws(
    () => renderJunitReport(result, { leanFailAs: 'failure', leanFailWcagOnly: 'yes' }),
    TypeError
  );
});

test('JUnit: a WCAG rule leaning fail still gates with leanFailWcagOnly', () => {
  const xml = renderJunitReport(mixedResult(), { leanFailAs: 'failure', leanFailWcagOnly: true });
  assert.match(xml, /name="th-has-data" time="0">\n\s+<failure type="leanFail"/);
  assert.doesNotMatch(xml, /name="heading-order" time="0">\n\s+<failure/);
});

test('JUnit: a finding that leans fail recorded in the baseline does not gate; a new one does', () => {
  const before = runa11yCoreOnHtml(HEADINGS, {});
  const baselineEntries = buildBaselineEntries(before, { leanFail: true });
  assert.ok(baselineEntries.some((e) => e.ruleId === 'heading-order' && e.lean === 'fail'));

  const known = renderJunitReport(before, { leanFailAs: 'failure', baselineEntries });
  assert.doesNotMatch(known, /type="leanFail"/);
  assert.match(known, /1 known likely failure recorded in the baseline/);

  const after = runa11yCoreOnHtml(HEADINGS.replace('</main>', '<h5>More</h5></main>'), {});
  const fresh = renderJunitReport(after, { leanFailAs: 'failure', baselineEntries });
  assert.match(fresh, /<failure type="leanFail" message="1 occurrence likely fails/);
  assert.match(fresh, /html: &lt;h5&gt;More&lt;\/h5&gt;/);
});

test('SARIF: leanFailWcagOnly and lean baseline entries keep a finding that leans fail a warning', () => {
  const levelOf = (sarif, html) =>
    JSON.parse(sarif).runs[0].results.find((r) => r.properties.html === html).level;
  const result = mixedResult();
  const h3 = '<h3>Details</h3>';
  const th = '<table><tr><th></th></tr></table>';

  const raised = renderSarifReport(result, { leanFailAs: 'error' });
  assert.equal(levelOf(raised, h3), 'error');
  assert.equal(levelOf(raised, th), 'error');
  assert.equal(levelOf(raised, '<h2></h2>'), 'note', 'outside the target');

  const wcagOnly = renderSarifReport(result, { leanFailAs: 'error', leanFailWcagOnly: true });
  assert.equal(levelOf(wcagOnly, h3), 'warning');
  assert.equal(levelOf(wcagOnly, th), 'error');

  const baselineEntries = buildBaselineEntries(result, { leanFail: true }).filter(
    (e) => e.ruleId === 'th-has-data'
  );
  const known = renderSarifReport(result, { leanFailAs: 'error', baselineEntries });
  assert.equal(levelOf(known, th), 'warning');
  assert.equal(levelOf(known, h3), 'error');

  assert.throws(() => renderSarifReport(result, { leanFailWcagOnly: 1 }), TypeError);
});
