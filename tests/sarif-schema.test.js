'use strict';

/**
 * Every SARIF log renderSarifReport writes is valid against the official
 * SARIF 2.1.0 schema (#97).
 *
 * The schema (tests/schemas/, see its README) allows no property it doesn't
 * define, so a misspelt one, such as the toolExecutionNotices the invocation
 * object once carried for toolExecutionNotifications, makes a consumer that
 * validates SARIF reject the whole file.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');

const { renderSarifReport } = require('../src/sarif.js');
const { buildBaselineEntries } = require('../src/baseline.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { makeOccurrence, makeCheckResult, makeScanResult } = require('./helpers/fake-result');

const FIXTURES = path.join(__dirname, 'fixtures');

// The schema is draft-04, which ajv 6 reads with its draft-04 meta-schema.
const schema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'schemas', 'sarif-schema-2.1.0.json'), 'utf8')
);
const ajv = new Ajv({ allErrors: true, schemaId: 'id', logger: false });
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
const validate = ajv.compile(schema);

function assertValid(sarifString, label) {
  const sarif = JSON.parse(sarifString);
  const ok = validate(sarif);
  const errors = ok
    ? []
    : validate.errors.map((e) => `${e.dataPath} ${e.message} ${JSON.stringify(e.params)}`);
  assert.deepEqual(errors, [], `${label}: not valid SARIF 2.1.0`);
  return sarif;
}

test('the schema is the SARIF 2.1.0 one, and names the property the engine writes', () => {
  assert.match(schema.id, /sarif-schema-2\.1\.0\.json$/);
  // $schema names the schema by its own id, which OASIS publishes; the
  // repository path it used to name is gone.
  const sarif = JSON.parse(renderSarifReport(makeScanResult([makeCheckResult({})])));
  assert.equal(sarif.$schema, schema.id);
  assert.ok(schema.definitions.invocation.properties.toolExecutionNotifications);
  assert.equal(schema.definitions.invocation.additionalProperties, false);
});

test('the SARIF of a scan of every fixture page is valid', () => {
  const files = fs.readdirSync(FIXTURES).filter((f) => f.endsWith('.html'));
  assert.ok(files.length > 100);
  let withNotifications = 0;
  for (const f of files) {
    const result = runa11yCoreOnHtml(fs.readFileSync(path.join(FIXTURES, f), 'utf8'), {
      entryPointParity: false
    });
    const sarif = assertValid(renderSarifReport(result, { toolVersion: '1.2.3' }), f);
    if (sarif.runs[0].invocations) withNotifications++;
  }
  // The notes a rule leaves when it had nothing to judge are covered too.
  assert.ok(withNotifications > 0, 'some scan carries tool execution notifications');
});

test('notes from a rule that could not check are tool execution notifications', () => {
  const result = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><p>Hello world</p></body></html>'
  );
  const sarif = assertValid(renderSarifReport(result), 'notes only');
  const invocation = sarif.runs[0].invocations[0];
  assert.ok(Array.isArray(invocation.toolExecutionNotifications));
  assert.equal(invocation.toolExecutionNotices, undefined);
});

test('the SARIF of edge-case results is valid', () => {
  const failing = makeScanResult([
    makeCheckResult({
      ruleId: 'img-alt-present',
      outcome: 'fail',
      occurrences: [makeOccurrence({ selector: 'img', html: '<img src="a.png">' })]
    }),
    makeCheckResult({
      ruleId: 'link-name-quality',
      outcome: 'cantTell',
      occurrences: [makeOccurrence({ selector: 'a', html: '<a href="/x">x</a>' })]
    })
  ]);
  const cases = [
    ['no checks', makeScanResult([]), {}],
    ['a pass only', makeScanResult([makeCheckResult({ outcome: 'pass', occurrences: [] })]), {}],
    ['a fail and a cantTell', failing, { toolVersion: '9.9.9', category: 'ci/a11y' }],
    [
      'with a baseline covering the fail',
      failing,
      { baselineEntries: buildBaselineEntries(failing) }
    ]
  ];
  for (const [label, result, options] of cases) {
    assertValid(renderSarifReport(result, options), label);
  }
});
