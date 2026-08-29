'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const { renderSarifReport } = require('../src/sarif.js');
const { computeBaselineKey, buildBaselineEntries } = require('../src/baseline.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { makeOccurrence, makeCheckResult, makeScanResult } = require('./explain/fake-result');

function parse(sarifString) {
  return JSON.parse(sarifString);
}

test('renderSarifReport: top-level SARIF 2.1.0 envelope', () => {
  const result = makeScanResult([makeCheckResult({})]);
  const sarif = parse(renderSarifReport(result, { toolVersion: '1.2.3' }));

  assert.strictEqual(sarif.version, '2.1.0');
  assert.match(sarif.$schema, /sarif-schema-2\.1\.0\.json$/);
  assert.strictEqual(sarif.runs.length, 1);
  assert.strictEqual(sarif.runs[0].tool.driver.name, 'surea11y');
  assert.strictEqual(sarif.runs[0].tool.driver.version, '1.2.3');
});

test('renderSarifReport: a fail occurrence becomes an "error"-level result', () => {
  const result = makeScanResult([makeCheckResult({})]);
  const sarif = parse(renderSarifReport(result, {}));

  assert.strictEqual(sarif.runs[0].results.length, 1);
  assert.strictEqual(sarif.runs[0].results[0].level, 'error');
  assert.strictEqual(sarif.runs[0].results[0].ruleId, 'img-alt-present');
});

test('renderSarifReport: a cantTell occurrence becomes a "warning"-level result', () => {
  const check = makeCheckResult({ ruleId: 'manual-rule', outcome: 'cantTell', type: 'manual' });
  const result = makeScanResult([check]);
  const sarif = parse(renderSarifReport(result, {}));

  assert.strictEqual(sarif.runs[0].results.length, 1);
  assert.strictEqual(sarif.runs[0].results[0].level, 'warning');
});

test('renderSarifReport: pass/notApplicable checks contribute no results, but still list the rule', () => {
  const passCheck = makeCheckResult({ ruleId: 'clean-rule', outcome: 'pass', occurrences: [] });
  const naCheck = makeCheckResult({ ruleId: 'na-rule', outcome: 'notApplicable', occurrences: [] });
  const result = makeScanResult([passCheck, naCheck]);
  const sarif = parse(renderSarifReport(result, {}));

  assert.strictEqual(sarif.runs[0].results.length, 0);
  const ruleIds = sarif.runs[0].tool.driver.rules.map((r) => r.id);
  assert.deepStrictEqual(ruleIds, ['clean-rule', 'na-rule']);
});

test("renderSarifReport: fail-first ordering, matching REPORT.md's own convention", () => {
  const cantTellCheck = makeCheckResult({
    ruleId: 'manual-rule',
    outcome: 'cantTell',
    type: 'manual'
  });
  const failCheck = makeCheckResult({ ruleId: 'img-alt-present' });
  const result = makeScanResult([cantTellCheck, failCheck]);
  const sarif = parse(renderSarifReport(result, {}));

  assert.deepStrictEqual(
    sarif.runs[0].results.map((r) => r.ruleId),
    ['img-alt-present', 'manual-rule']
  );
});

test('renderSarifReport: tool.driver.rules default level reflects rule type (automatic -> error, manual -> warning)', () => {
  const automaticCheck = makeCheckResult({ ruleId: 'auto-rule', type: 'automatic' });
  const manualCheck = makeCheckResult({
    ruleId: 'manual-rule',
    outcome: 'cantTell',
    type: 'manual'
  });
  const result = makeScanResult([automaticCheck, manualCheck]);
  const sarif = parse(renderSarifReport(result, {}));

  const byId = Object.fromEntries(sarif.runs[0].tool.driver.rules.map((r) => [r.id, r]));
  assert.strictEqual(byId['auto-rule'].defaultConfiguration.level, 'error');
  assert.strictEqual(byId['manual-rule'].defaultConfiguration.level, 'warning');
});

test('renderSarifReport: partialFingerprints reuse the same ruleId+reasonCode+html identity as the baseline mechanism', () => {
  const result = makeScanResult([makeCheckResult({})]);
  const sarif = parse(renderSarifReport(result, {}));

  const expected = computeBaselineKey('img-alt-present', 'DEFAULT', '<img src="x.png">');
  assert.strictEqual(
    sarif.runs[0].results[0].partialFingerprints['surea11y/violation/v1'],
    expected
  );
});

test('renderSarifReport: occurrence.selector is carried as a logical location', () => {
  const check = makeCheckResult({
    occurrences: [makeOccurrence({ selector: 'main > img:nth-child(2)' })]
  });
  const result = makeScanResult([check]);
  const sarif = parse(renderSarifReport(result, {}));

  assert.strictEqual(
    sarif.runs[0].results[0].locations[0].logicalLocations[0].fullyQualifiedName,
    'main > img:nth-child(2)'
  );
});

test('renderSarifReport: with a baseline, an already-known fail occurrence is omitted entirely (not downgraded)', () => {
  const check = makeCheckResult({});
  const result = makeScanResult([check]);
  const baselineEntries = buildBaselineEntries(result);

  const sarif = parse(renderSarifReport(result, { baselineEntries }));

  assert.strictEqual(sarif.runs[0].results.length, 0);
});

test('renderSarifReport: with a baseline, multiset matching still reports the actually new occurrence', () => {
  const check = makeCheckResult({
    occurrences: [
      makeOccurrence({ selector: 'main img:nth-child(1)' }),
      makeOccurrence({ selector: 'main img:nth-child(2)' })
    ]
  });
  const result = makeScanResult([check]);
  const baselineEntries = [
    {
      ruleId: 'img-alt-present',
      reasonCode: 'DEFAULT',
      selector: 'main img:nth-child(1)',
      html: '<img src="x.png">'
    }
  ];

  const sarif = parse(renderSarifReport(result, { baselineEntries }));

  assert.strictEqual(sarif.runs[0].results.length, 1);
});

test('renderSarifReport: a baseline never filters cantTell occurrences', () => {
  const check = makeCheckResult({ ruleId: 'manual-rule', outcome: 'cantTell', type: 'manual' });
  const result = makeScanResult([check]);
  // Even if some entry happened to match by identity, cantTell is out of scope for baseline filtering.
  const baselineEntries = [
    { ruleId: 'manual-rule', reasonCode: 'DEFAULT', selector: 'img', html: '<img src="x.png">' }
  ];

  const sarif = parse(renderSarifReport(result, { baselineEntries }));

  assert.strictEqual(sarif.runs[0].results.length, 1);
  assert.strictEqual(sarif.runs[0].results[0].level, 'warning');
});

test('renderSarifReport: mixed fail-rule occurrences honor per-occurrence outcome (fail=>error, cantTell=>warning)', () => {
  const check = makeCheckResult({
    ruleId: 'mixed-rule',
    outcome: 'fail',
    occurrences: [
      makeOccurrence({ selector: 'img.fail', occurrenceOutcome: 'fail' }),
      makeOccurrence({ selector: 'img.canttell', occurrenceOutcome: 'cantTell' })
    ]
  });
  const result = makeScanResult([check]);
  const sarif = parse(renderSarifReport(result, {}));

  assert.strictEqual(sarif.runs[0].results.length, 2);
  assert.deepStrictEqual(
    sarif.runs[0].results.map((r) => r.level),
    ['error', 'warning']
  );
});

test('renderSarifReport: baseline filtering applies only to fail-tier occurrences in a mixed fail rule', () => {
  const check = makeCheckResult({
    ruleId: 'mixed-rule',
    outcome: 'fail',
    occurrences: [
      makeOccurrence({ selector: 'img.fail', occurrenceOutcome: 'fail' }),
      makeOccurrence({ selector: 'img.canttell', occurrenceOutcome: 'cantTell' })
    ]
  });
  const result = makeScanResult([check]);
  const baselineEntries = buildBaselineEntries(result);
  const sarif = parse(renderSarifReport(result, { baselineEntries }));

  assert.strictEqual(sarif.runs[0].results.length, 1);
  assert.strictEqual(sarif.runs[0].results[0].level, 'warning');
  assert.strictEqual(
    sarif.runs[0].results[0].locations[0].logicalLocations[0].fullyQualifiedName,
    'img.canttell'
  );
});

test('renderSarifReport: does not mutate the input result', () => {
  const result = makeScanResult([makeCheckResult({})]);
  const before = JSON.stringify(result);

  renderSarifReport(result, { baselineEntries: buildBaselineEntries(result) });

  assert.strictEqual(JSON.stringify(result), before);
});

test('renderSarifReport: a file:// url becomes a cwd-relative artifact location', () => {
  const filePath = path.join(process.cwd(), 'fixture.html');
  const result = makeScanResult([makeCheckResult({})]);
  result.url = `file://${filePath}`;

  const sarif = parse(renderSarifReport(result, {}));

  assert.strictEqual(
    sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri,
    'fixture.html'
  );
});

test('renderSarifReport: an http(s) url is used as-is (no repo-relative path possible)', () => {
  const result = makeScanResult([makeCheckResult({})]);
  result.url = 'https://example.test/page';

  const sarif = parse(renderSarifReport(result, {}));

  assert.strictEqual(
    sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri,
    'https://example.test/page'
  );
});

test('renderSarifReport: a null url falls back to a placeholder artifact location', () => {
  const result = makeScanResult([makeCheckResult({})]);
  result.url = null;

  const sarif = parse(renderSarifReport(result, {}));

  assert.strictEqual(
    sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri,
    'about:blank'
  );
});

test('renderSarifReport: real scan end-to-end (img-alt-present) produces a well-formed SARIF result', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="logo.png"></body></html>';
  const result = runa11yCoreOnHtml(html, { runOnly: ['img-alt-present'] });

  const sarif = parse(
    renderSarifReport(result, { toolVersion: '1.2.3', informationUri: 'https://example.test/repo' })
  );

  assert.strictEqual(sarif.runs[0].tool.driver.informationUri, 'https://example.test/repo');
  const imgResult = sarif.runs[0].results.find((r) => r.ruleId === 'img-alt-present');
  assert.ok(imgResult, 'expected an img-alt-present SARIF result');
  assert.strictEqual(imgResult.level, 'error');
  assert.match(imgResult.message.text, /alt/i);
});

test('renderSarifReport: aria-prohibited-attr mixed-tier occurrences produce both error and warning results', () => {
  const html = `<!doctype html><html><body>
    <span id="roleless_canttell" aria-label="Custom label">Visible text</span>
    <span id="roleless_fail" aria-label="icon-only"></span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['aria-prohibited-attr'] });
  const sarif = parse(renderSarifReport(result, {}));
  const results = sarif.runs[0].results.filter((r) => r.ruleId === 'aria-prohibited-attr');

  assert.strictEqual(results.length, 2);
  assert.deepStrictEqual(results.map((r) => r.level).sort(), ['error', 'warning']);
});

// --- degraded and minimal inputs -------------------------------------------
//
// A SARIF log is written by CI, often from whatever a scan produced on a page
// nobody controls. These cover the shapes the well-formed fixtures above never
// produce -- a rule with no WCAG mapping, an occurrence with no hint, a result
// object that is missing pieces entirely -- where the requirement is a valid
// log, not an exception.

test('renderSarifReport: a rule with no normative mappings still gets the base tags', () => {
  for (const meta of [
    null,
    undefined,
    {},
    { normativeMappings: null },
    { normativeMappings: [] }
  ]) {
    const result = makeScanResult([makeCheckResult({ meta })]);
    const rule = parse(renderSarifReport(result, {})).runs[0].tool.driver.rules[0];
    assert.deepStrictEqual(rule.properties.tags, ['accessibility', 'automatic']);
  }
});

test('renderSarifReport: a malformed normative mapping is skipped, the valid ones are kept', () => {
  const result = makeScanResult([
    makeCheckResult({
      meta: { normativeMappings: [null, {}, { requirement: '' }, { requirement: '4.1.2' }] }
    })
  ]);

  const rule = parse(renderSarifReport(result, {})).runs[0].tool.driver.rules[0];
  assert.deepStrictEqual(rule.properties.tags, ['accessibility', 'automatic', 'wcag-4.1.2']);
});

test('renderSarifReport: a manual rule is tagged manual', () => {
  const result = makeScanResult([makeCheckResult({ type: 'manual', outcome: 'cantTell' })]);
  const rule = parse(renderSarifReport(result, {})).runs[0].tool.driver.rules[0];
  assert.ok(rule.properties.tags.includes('manual'));
});

test('renderSarifReport: a rule with no title or description falls back to its id', () => {
  const result = makeScanResult([
    makeCheckResult({ ruleId: 'bare-rule', title: null, description: null })
  ]);

  const rule = parse(renderSarifReport(result, {})).runs[0].tool.driver.rules[0];
  assert.strictEqual(rule.shortDescription.text, 'bare-rule');
  assert.strictEqual(rule.fullDescription.text, 'bare-rule');
});

test('renderSarifReport: a rule with a title but no description reuses the title', () => {
  const result = makeScanResult([makeCheckResult({ title: 'Only a title', description: null })]);
  const rule = parse(renderSarifReport(result, {})).runs[0].tool.driver.rules[0];
  assert.strictEqual(rule.fullDescription.text, 'Only a title');
});

test('renderSarifReport: an occurrence with no hint uses the summary alone as the message', () => {
  const result = makeScanResult([
    makeCheckResult({ occurrences: [makeOccurrence({ summary: 'Missing alt.', hint: null })] })
  ]);

  const sarifResult = parse(renderSarifReport(result, {})).runs[0].results[0];
  assert.strictEqual(sarifResult.message.text, 'Missing alt.');
});

test('renderSarifReport: an occurrence with no selector gets no logical location', () => {
  const result = makeScanResult([
    makeCheckResult({ occurrences: [makeOccurrence({ selector: null })] })
  ]);

  const location = parse(renderSarifReport(result, {})).runs[0].results[0].locations[0];
  assert.strictEqual(location.logicalLocations, undefined);
  assert.ok(location.physicalLocation);
});

test('renderSarifReport: a non-string occurrence html is reported as an empty string', () => {
  const result = makeScanResult([
    makeCheckResult({ occurrences: [makeOccurrence({ html: undefined })] })
  ]);

  const sarifResult = parse(renderSarifReport(result, {})).runs[0].results[0];
  assert.strictEqual(sarifResult.properties.html, '');
  assert.strictEqual(
    sarifResult.partialFingerprints['surea11y/violation/v1'],
    computeBaselineKey('img-alt-present', 'DEFAULT', '')
  );
});

test('renderSarifReport: the same rule reported twice is declared once', () => {
  const result = makeScanResult([
    makeCheckResult({ occurrences: [makeOccurrence({ selector: 'img.a' })] }),
    makeCheckResult({ occurrences: [makeOccurrence({ selector: 'img.b' })] })
  ]);

  const run = parse(renderSarifReport(result, {})).runs[0];
  assert.strictEqual(run.tool.driver.rules.length, 1);
  assert.strictEqual(run.results.length, 2);
});

test('renderSarifReport: checks and occurrences that are not usable are skipped, not fatal', () => {
  const result = makeScanResult([
    null,
    makeCheckResult({ ruleId: 'no-occurrences-array', occurrences: 'nope' }),
    makeCheckResult({ occurrences: [null, makeOccurrence()] })
  ]);

  const run = parse(renderSarifReport(result, {})).runs[0];
  assert.deepStrictEqual(
    run.tool.driver.rules.map((r) => r.id),
    ['img-alt-present'],
    'a check with no occurrences array is not even declared as a rule'
  );
  assert.strictEqual(run.results.length, 1);
});

test('renderSarifReport: a missing or malformed result still produces a valid empty log', () => {
  for (const bad of [null, undefined, {}, { checksResults: null }, { checksResults: 'x' }]) {
    const sarif = parse(renderSarifReport(bad, {}));
    assert.strictEqual(sarif.version, '2.1.0');
    assert.deepStrictEqual(sarif.runs[0].results, []);
    assert.deepStrictEqual(sarif.runs[0].tool.driver.rules, []);
  }
});

test('renderSarifReport: called with no options at all still names the tool', () => {
  const driver = parse(renderSarifReport(makeScanResult([]))).runs[0].tool.driver;

  assert.strictEqual(driver.name, 'surea11y');
  assert.strictEqual(driver.version, '0.0.0');
  assert.strictEqual(driver.informationUri, 'https://github.com/SureA11y/core');
});

test('renderSarifReport: toolVersion and informationUri are carried through when given', () => {
  const driver = parse(
    renderSarifReport(makeScanResult([]), {
      toolVersion: '9.9.9',
      informationUri: 'https://example.test/tool'
    })
  ).runs[0].tool.driver;

  assert.strictEqual(driver.version, '9.9.9');
  assert.strictEqual(driver.informationUri, 'https://example.test/tool');
});

test('renderSarifReport: a file:// url pointing at the cwd itself keeps the absolute path', () => {
  const result = makeScanResult([makeCheckResult({})]);
  result.url = `file://${process.cwd()}`;

  const sarif = parse(renderSarifReport(result, {}));

  // path.relative(cwd, cwd) is '' -- not a usable URI, so the absolute path
  // stands in rather than an empty artifact location.
  assert.strictEqual(
    sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri,
    process.cwd()
  );
});

test('renderSarifReport: a baseline entry with no reasonCode or html still filters its occurrence', () => {
  const result = makeScanResult([
    makeCheckResult({
      occurrences: [makeOccurrence({ html: '', data: { details: null } })]
    })
  ]);

  const sarif = parse(
    renderSarifReport(result, { baselineEntries: [null, { ruleId: 'img-alt-present' }] })
  );

  assert.deepStrictEqual(sarif.runs[0].results, []);
});

test('renderSarifReport: a non-array baselineEntries filters nothing', () => {
  const result = makeScanResult([makeCheckResult({})]);

  for (const baselineEntries of [null, undefined, 'x', {}]) {
    const sarif = parse(renderSarifReport(result, { baselineEntries }));
    assert.strictEqual(sarif.runs[0].results.length, 1);
  }
});

test('renderSarifReport: an occurrence carrying `outcome` instead of `occurrenceOutcome` is tiered by it', () => {
  const result = makeScanResult([
    makeCheckResult({
      outcome: 'fail',
      occurrences: [
        makeOccurrence({ selector: '#a', occurrenceOutcome: undefined, outcome: 'fail' }),
        makeOccurrence({ selector: '#b', occurrenceOutcome: undefined, outcome: 'cantTell' })
      ]
    })
  ]);

  const results = parse(renderSarifReport(result, {})).runs[0].results;

  assert.deepStrictEqual(
    results.map((r) => r.level),
    ['error', 'warning']
  );
});

test('a notApplicable check can carry an explanatory occurrence', () => {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><p>Hello world</p></body></html>',
    { engineOptions: {} }
  );

  const contrast = result.checksResults.find((c) => c.ruleId === 'contrast-minimum');
  assert.strictEqual(contrast.outcome, 'notApplicable');
  assert.strictEqual(contrast.occurrences.length, 1, 'the rule says why it had nothing to judge');
  assert.strictEqual(contrast.occurrences[0].selector, '', 'it describes the scan, not an element');
});

test('a rule that could not check reaches SARIF as a notice, never as an alert', () => {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><p>Hello world</p></body></html>',
    { engineOptions: {} }
  );
  const sarif = parse(renderSarifReport(result, { toolVersion: '1.2.3' }));

  const ids = sarif.runs[0].results.map((r) => r.ruleId);
  assert.ok(!ids.includes('contrast-minimum'), 'not evaluated is not a violation');

  const notices = sarif.runs[0].invocations[0].toolExecutionNotices;
  const contrast = notices.find((n) => n.associatedRule.id === 'contrast-minimum');
  assert.ok(contrast, 'a SARIF-only consumer must still learn contrast went unchecked');
  assert.strictEqual(contrast.level, 'note');
  assert.match(contrast.message.text, /computable contrast/);
  assert.strictEqual(sarif.runs[0].invocations[0].executionSuccessful, true);
});

test('a run with nothing to report carries no invocations block at all', () => {
  const result = makeScanResult([makeCheckResult({ outcome: 'pass', occurrences: [] })]);
  const sarif = parse(renderSarifReport(result, { toolVersion: '1.2.3' }));

  assert.strictEqual(sarif.runs[0].invocations, undefined);
});

test('an occurrence with no summary produces no notice', () => {
  const result = makeScanResult([
    makeCheckResult({
      ruleId: 'silent-rule',
      outcome: 'notApplicable',
      occurrences: [makeOccurrence({ summary: undefined })]
    })
  ]);
  const sarif = parse(renderSarifReport(result, { toolVersion: '1.2.3' }));

  assert.strictEqual(sarif.runs[0].invocations, undefined);
});
