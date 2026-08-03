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

test('renderSarifReport: with a baseline, multiset matching still reports the genuinely new occurrence', () => {
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
  assert.deepStrictEqual(
    results.map((r) => r.level).sort(),
    ['error', 'warning']
  );
});
