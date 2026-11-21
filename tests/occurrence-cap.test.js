'use strict';

// engineOptions.output.maxOccurrencesPerRule: at most that many occurrences of
// each rule in the result, the rest counted (occurrencesOmitted), while every
// outcome, rollup, count and gate stays as without the cap.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { checkEngineOptions } = require('../src/core/engine-options.js');
const { capOccurrences } = require('../src/core/multi-profile.js');
const { consoleHelpers } = require('../src/core/console-helpers.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderHtmlReport } = require('../src/report.js');
const { renderEarlReport } = require('../src/earl.js');
const { matchBaseline, buildBaselineEntries } = require('../src/baseline.js');

// Five images without alt (img-alt-present fails five times).
const PAGE =
  '<!doctype html><html lang="en"><head><title>Home</title></head><body><main><h1>Home</h1>' +
  [1, 2, 3, 4, 5].map((n) => `<img src="${n}.png">`).join('') +
  '</main></body></html>';

function quietly(fn) {
  const warn = console.warn;
  const said = [];
  console.warn = (...args) => said.push(args.join(' '));
  try {
    return { value: fn(), said };
  } finally {
    console.warn = warn;
  }
}

function scan(engineOptions) {
  return quietly(() => runa11yCoreOnHtml(PAGE, { engineOptions })).value;
}
const check = (result, id) => result.checksResults.find((c) => c.ruleId === id);
// A result without the options each entry echoes, which differ by the cap.
const plain = (value) =>
  JSON.parse(JSON.stringify(value, (key, v) => (key === 'engineOptions' ? undefined : v)));

const full = scan({});
const capped = scan({ output: { maxOccurrencesPerRule: 2 } });

test('output.maxOccurrencesPerRule takes a whole number of 1 or more, and nothing else', () => {
  assert.deepEqual(checkEngineOptions({ output: { maxOccurrencesPerRule: 1 } }), []);
  assert.deepEqual(checkEngineOptions({ output: { maxOccurrencesPerRule: 50 } }), []);
  for (const bad of [0, -3, 2.5, '5', NaN, Infinity, null]) {
    const problems = checkEngineOptions({ output: { maxOccurrencesPerRule: bad } });
    assert.equal(problems.length, 1, String(bad));
    assert.equal(problems[0].path, 'output.maxOccurrencesPerRule');
    assert.match(problems[0].message, /must be a whole number, 1 or more/);
  }
  assert.throws(
    () =>
      runa11yCoreOnHtml(PAGE, {
        engineOptions: { strictOptions: true, output: { maxOccurrencesPerRule: 0 } }
      }),
    (err) => err.code === 'INVALID_ENGINE_OPTIONS' && /maxOccurrencesPerRule/.test(err.message)
  );
  const { value: ignored, said } = quietly(() =>
    runa11yCoreOnHtml(PAGE, { engineOptions: { output: { maxOccurrencesPerRule: 'two' } } })
  );
  assert.ok(said.some((s) => /output\.maxOccurrencesPerRule must be .*; ignored\./.test(s)));
  assert.equal(check(ignored, 'img-alt-present').occurrences.length, 5);
  assert.equal(ignored.engine.occurrenceCap, undefined);
});

test('a capped result keeps at most N occurrences per rule and counts the rest', () => {
  const kept = check(capped, 'img-alt-present');
  assert.equal(kept.outcome, 'fail');
  assert.equal(kept.occurrences.length, 2);
  assert.equal(kept.occurrencesOmitted, 3);
  assert.deepEqual(kept.occurrencesOmittedByOutcome, { fail: 3 });
  assert.deepEqual(
    kept.occurrences.map((o) => o.html),
    check(full, 'img-alt-present')
      .occurrences.slice(0, 2)
      .map((o) => o.html)
  );
  assert.equal(capped.engine.occurrenceCap.maxOccurrencesPerRule, 2);
  assert.ok(capped.engine.occurrenceCap.occurrencesOmitted >= 3);
  // A rule within the cap is as it was, with no new field.
  for (const c of capped.checksResults) {
    if (c.occurrencesOmitted) continue;
    assert.equal('occurrencesOmittedByOutcome' in c, false);
    assert.deepEqual(plain(c), plain(check(full, c.ruleId)));
  }
  // No cap, no field.
  assert.equal(full.engine.occurrenceCap, undefined);
  assert.equal('occurrencesOmitted' in check(full, 'img-alt-present'), false);
});

test('outcomes, severities and rollups are exactly those of the uncapped scan', () => {
  assert.deepEqual(
    capped.checksResults.map((c) => [c.ruleId, c.outcome, c.severity]),
    full.checksResults.map((c) => [c.ruleId, c.outcome, c.severity])
  );
  assert.deepEqual(plain(capped.rulesResults), plain(full.rulesResults));
});

test('failing occurrences are kept first, then the undecided that lean fail', () => {
  const occ = (tier, lean) => ({
    occurrenceOutcome: tier,
    ...(lean ? { lean: { toward: lean } } : {})
  });
  const result = {
    engine: {},
    checksResults: [
      {
        ruleId: 'r',
        outcome: 'fail',
        occurrences: [
          occ('pass'),
          occ('cantTell'),
          occ('cantTell', 'fail'),
          occ('fail'),
          occ('fail')
        ]
      }
    ],
    rulesResults: [
      {
        ruleId: 'wcag-x',
        data: {
          details: {
            contributors: [{ testId: 'r', findingOutcomes: ['pass', 'c1', 'c2', 'f1', 'f2'] }]
          }
        }
      }
    ]
  };
  const out = capOccurrences(result, { output: { maxOccurrencesPerRule: 3 } });
  const c = out.checksResults[0];
  // The kept ones stay in the rule's order.
  assert.deepEqual(c.occurrences, [occ('cantTell', 'fail'), occ('fail'), occ('fail')]);
  assert.equal(c.occurrencesOmitted, 2);
  assert.deepEqual(c.occurrencesOmittedByOutcome, { pass: 1, cantTell: 1 });
  // The rollup's record of each finding follows the findings kept.
  assert.deepEqual(out.rulesResults[0].data.details.contributors[0].findingOutcomes, [
    'c2',
    'f1',
    'f2'
  ]);
  assert.deepEqual(out.engine.occurrenceCap, {
    maxOccurrencesPerRule: 3,
    occurrencesOmitted: 2,
    rulesCapped: 1
  });
  // The input is not changed.
  assert.equal(result.checksResults[0].occurrences.length, 5);
});

test('a scan of several profiles is capped after its verdicts are merged', () => {
  const opts = { profile: ['wcag22-aa', 'wcag21-aa'] };
  const merged = scan(opts);
  const cappedMerged = scan({ ...opts, output: { maxOccurrencesPerRule: 1 } });
  const c = check(cappedMerged, 'img-alt-present');
  assert.equal(c.occurrences.length, 1);
  assert.equal(c.occurrencesOmitted, 4);
  assert.deepEqual(c.verdicts, check(merged, 'img-alt-present').verdicts);
  assert.deepEqual(
    c.occurrences[0].verdicts,
    check(merged, 'img-alt-present').occurrences[0].verdicts
  );
  assert.deepEqual(plain(cappedMerged.rulesResults), plain(merged.rulesResults));
  assert.deepEqual(cappedMerged.profiles, merged.profiles);
  assert.deepEqual(cappedMerged.engine.profiles, ['wcag22-aa', 'wcag21-aa']);
  assert.equal(cappedMerged.engine.occurrenceCap.maxOccurrencesPerRule, 1);
});

test('HTML report: the total counts what was left out, and the card says "+N more"', () => {
  const html = renderHtmlReport(capped, { manualChecks: false });
  const fullHtml = renderHtmlReport(full, { manualChecks: false });
  const total = (h) => /<div><b>([\d,]+)<\/b>total occurrences<\/div>/.exec(h)[1];
  assert.equal(total(html), total(fullHtml));
  assert.match(html, /<\/b>occurrences not listed<\/div>/);
  assert.match(
    html,
    /\+3 more not listed: the scan kept 2 occurrences of this rule \(output\.maxOccurrencesPerRule\)/
  );
  assert.match(html, /<strong>img-alt-present<\/strong>[^<]*<span class="card-count">× 5<\/span>/);
  assert.doesNotMatch(fullHtml, /more not listed/);
  const es = renderHtmlReport(scan({ locale: 'es', output: { maxOccurrencesPerRule: 2 } }), {
    manualChecks: false
  });
  assert.match(es, /\+3 más, sin listar/);
});

test('SARIF: a note per capped rule, and the failures it keeps still gate', () => {
  const sarif = JSON.parse(renderSarifReport(capped));
  const run = sarif.runs[0];
  const errors = run.results.filter((r) => r.ruleId === 'img-alt-present' && r.level === 'error');
  assert.equal(errors.length, 2);
  const note = run.invocations[0].toolExecutionNotifications.find(
    (n) => n.associatedRule && n.associatedRule.id === 'img-alt-present'
  );
  assert.equal(note.level, 'note');
  assert.match(note.message.text, /^\+3 more occurrences of the rule img-alt-present not listed/);
});

test('SARIF: with a baseline that knows every failure kept, the ones left out still gate', () => {
  const entries = quietly(() => buildBaselineEntries(capped)).value;
  const sarif = JSON.parse(renderSarifReport(capped, { baselineEntries: entries }));
  const errors = sarif.runs[0].results.filter((r) => r.level === 'error');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].ruleId, 'img-alt-present');
  assert.equal(errors[0].properties.reasonCode, 'OCCURRENCES_OMITTED');
  assert.match(errors[0].message.text, /3 failing occurrences were left out/);
});

test('JUnit: the failure counts every occurrence and says "+N more"; a baseline does not clear it', () => {
  const xml = renderJunitReport(capped);
  assert.match(xml, /<failure type="fail" message="5 failing occurrences: /);
  assert.match(xml, /\+3 more: 3 failing occurrences not listed \(output\.maxOccurrencesPerRule\)/);
  assert.equal(
    /failures="(\d+)"/.exec(xml)[1],
    /failures="(\d+)"/.exec(renderJunitReport(full))[1]
  );
  const entries = quietly(() => buildBaselineEntries(capped)).value;
  const gated = renderJunitReport(capped, { baselineEntries: entries });
  assert.match(
    gated,
    /<failure type="fail" message="3 failing occurrences: left out of the result/
  );
  // Uncapped, the same baseline clears the rule.
  const fullEntries = buildBaselineEntries(full);
  assert.doesNotMatch(
    renderJunitReport(full, { baselineEntries: fullEntries }),
    /name="img-alt-present" time="0">\s*<failure/
  );
});

test('matchBaseline: a failure left out counts as new, so a capped result never matches as clean', () => {
  const { value: entries, said } = quietly(() => buildBaselineEntries(capped));
  assert.ok(said.some((s) => /buildBaselineEntries: the result is incomplete/.test(s)));
  assert.equal(entries.filter((e) => e.ruleId === 'img-alt-present').length, 2);
  const match = matchBaseline(capped, entries);
  assert.equal(match.totalFail, matchBaseline(full, []).totalFail);
  assert.ok(match.newCount >= 3);
  assert.ok(match.incomplete.occurrencesOmitted >= 3);
  // The full scan's baseline matches the full scan, with nothing left out.
  const fullMatch = matchBaseline(full, buildBaselineEntries(full));
  assert.equal(fullMatch.newCount, 0);
  assert.equal('incomplete' in fullMatch, false);
});

// Undecided findings that lean fail and the cap left out gate as those kept
// do under the lean-fail gates (round 10, S10-2): seven small data tables
// without headers (td-has-header, leaning fail), against a baseline of one.
test('the lean-fail gates count the findings that lean fail the cap left out', () => {
  const TABLE = '<table><tr><td>a</td><td>1</td></tr><tr><td>b</td><td>2</td></tr></table>';
  const pageOf = (n) =>
    `<!doctype html><html lang="en"><head><title>p</title></head><body><main><h1>h</h1>${TABLE.repeat(n)}</main></body></html>`;
  const run = (n, engineOptions) =>
    quietly(() => runa11yCoreOnHtml(pageOf(n), { engineOptions })).value;
  const before = run(1, {});
  const after = run(7, {});
  const afterCap = run(7, { output: { maxOccurrencesPerRule: 1 } });
  const capCheck = check(afterCap, 'td-has-header');
  assert.equal(capCheck.occurrencesOmittedLeaningFail, 6);
  const entries = buildBaselineEntries(before, { leanFail: true });

  const lean = (r) => matchBaseline(r, entries, { leanFail: true }).leanFail;
  assert.deepEqual(
    [lean(afterCap).total, lean(afterCap).newCount],
    [lean(after).total, lean(after).newCount]
  );
  assert.equal(
    matchBaseline(afterCap, entries, { leanFail: true }).incomplete.occurrencesOmittedLeaningFail,
    6
  );
  assert.equal(
    quietly(() => buildBaselineEntries(afterCap, { leanFail: true })).said.some((s) =>
      /6 occurrence\(s\) that lean fail/.test(s)
    ),
    true
  );

  const junit = renderJunitReport(afterCap, { baselineEntries: entries, leanFailAs: 'failure' });
  assert.match(
    junit,
    /<failure type="leanFail" message="6 occurrences likely fail: left out of the result/
  );
  assert.match(junit, /\+6 more: 6 occurrences that likely fail not listed/);
  const unbaselined = renderJunitReport(run(7, { output: { maxOccurrencesPerRule: 2 } }), {
    leanFailAs: 'failure'
  });
  assert.match(unbaselined, /<failure type="leanFail" message="7 occurrences likely fail: /);
  assert.match(unbaselined, /\+5 more: 5 occurrences that likely fail not listed/);

  const sarif = JSON.parse(
    renderSarifReport(afterCap, { baselineEntries: entries, leanFailAs: 'error' })
  );
  const errors = sarif.runs[0].results.filter(
    (r) => r.level === 'error' && r.ruleId === 'td-has-header'
  );
  assert.equal(errors.length, 1);
  assert.equal(errors[0].properties.reasonCode, 'OCCURRENCES_OMITTED');
  assert.match(errors[0].message.text, /6 undecided occurrences that lean fail were left out/);
});

test('EARL asserts the same outcomes', () => {
  assert.deepEqual(renderEarlReport(capped), renderEarlReport(full));
});

test('console helpers: table() gives a "+N more" row for a capped rule', () => {
  const helpers = consoleHelpers({ console: { table: () => {} } }, {}, null);
  const rows = helpers.table(capped).filter((r) => r.rule === 'img-alt-present');
  assert.equal(rows.length, 3);
  assert.ok(rows.some((r) => r.summary === '+3 more not listed (output.maxOccurrencesPerRule)'));
});
