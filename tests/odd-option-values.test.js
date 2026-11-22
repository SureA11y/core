'use strict';

// A BigInt or an object with no prototype given as an option is refused, or
// warned about, with a message that names it, never a bare TypeError from
// writing the message (round 12, A12-9).

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderHtmlReport } = require('../src/report.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
const ODD = [10n, Object.create(null), Symbol('s')];

function quietly(fn) {
  const warn = console.warn;
  const said = [];
  console.warn = (...args) => said.push(args.map(String).join(' '));
  try {
    return { value: fn(), said };
  } finally {
    console.warn = warn;
  }
}

test('engineOptions.includeMode: a BigInt or a bare object is warned about, or refused under strictOptions (round 12, A12-9)', () => {
  for (const includeMode of ODD) {
    const { value, said } = quietly(() =>
      runa11yCoreOnHtml(PAGE, { engineOptions: { includeMode }, entryPointParity: false })
    );
    assert.ok(value.checksResults.length > 0);
    assert.ok(
      said.some((s) => /includeMode must be "and" or "or", not /.test(s)),
      String(said)
    );
    assert.throws(
      () =>
        quietly(() =>
          runa11yCoreOnHtml(PAGE, {
            engineOptions: { includeMode, strictOptions: true },
            entryPointParity: false
          })
        ),
      (err) => err.code === 'INVALID_ENGINE_OPTIONS' && /includeMode must be/.test(err.message)
    );
  }
  assert.throws(
    () => runa11yCoreOnHtml(PAGE, { runOnly: { type: 10n, values: [] }, entryPointParity: false }),
    (err) => err.code === 'INVALID_RUN_ONLY' && /not 10n/.test(err.message)
  );
});

test('the reporters refuse a BigInt or a bare object option with a message naming it (round 12, A12-9)', () => {
  const result = quietly(() => runa11yCoreOnHtml(PAGE, { entryPointParity: false })).value;
  const cases = [
    ['renderSarifReport', (o) => renderSarifReport(result, o), 'leanFailAs'],
    ['renderJunitReport', (o) => renderJunitReport(result, o), 'leanFailAs'],
    ['renderJunitReport', (o) => renderJunitReport(result, o), 'cantTellAs'],
    ['renderJunitReport', (o) => renderJunitReport(result, o), 'includeNotApplicable'],
    ['renderHtmlReport', (o) => renderHtmlReport(result, o), 'manualChecks'],
    ['renderHtmlReport', (o) => renderHtmlReport(result, o), 'title']
  ];
  for (const [name, render, key] of cases) {
    for (const value of ODD) {
      assert.throws(
        () => render({ [key]: value }),
        (err) =>
          err instanceof TypeError &&
          err.message.startsWith(`${name}: ${key} must be`) &&
          / not (10n|\{\}|a Symbol)$/.test(err.message),
        `${name} ${key}`
      );
    }
  }
  // A title that is a string still works, and none gives the default.
  assert.match(renderHtmlReport(result, { title: 'Mine' }), /<title>Mine/);
});

// What strict mode promises it checks: probes as JSON-safe data, the object
// options as plain objects, and a profile or timestamp that names something.
// Each warns without strictOptions, and throws under it (round 12, A12-13).
test('probes, the object options, and an empty profile or timestamp are checked (round 12, A12-13)', () => {
  const circular = {};
  circular.self = circular;
  const refused = [
    ['probes', () => 1],
    ['probes', Symbol('s')],
    ['probes', 10n],
    ['probes', 'text'],
    ['probes', 5],
    ['probes', [1, 2]],
    ['probes', { when: new Date() }],
    ['probes', { n: Number.NaN }],
    ['probes', circular],
    [
      'probes',
      new Proxy(
        {},
        {
          ownKeys() {
            throw new Error('no keys');
          }
        }
      )
    ],
    ...['contrast', 'output', 'policy', 'policyContract', 'rules', 'tags', 'tests', 'messages'].map(
      (key) => [key, new Date()]
    ),
    ['profile', ''],
    ['profile', []],
    ['timestamp', ''],
    ['timestamp', '  ']
  ];
  for (const [key, value] of refused) {
    const label = `${key}: ${typeof value === 'symbol' ? 'Symbol' : Object.prototype.toString.call(value)}`;
    const { said } = quietly(() =>
      runa11yCoreOnHtml(PAGE, { engineOptions: { [key]: value }, entryPointParity: false })
    );
    assert.ok(
      said.some(
        (s) => s.includes(`engineOptions${key === 'profile' ? '' : ':'}`) && s.includes(key)
      ),
      `${label}: ${said}`
    );
    assert.throws(
      () =>
        quietly(() =>
          runa11yCoreOnHtml(PAGE, {
            engineOptions: { [key]: value, strictOptions: true },
            entryPointParity: false
          })
        ),
      (err) => err.code === 'INVALID_ENGINE_OPTIONS',
      label
    );
  }
  // What is meant still works without a word.
  const fine = {
    probes: { 'crawl.pageTitles': { pages: [{ url: 'https://example.test/', title: 't' }] } },
    contrast: { mode: 'auditorAssist' },
    output: Object.assign(Object.create(null), { includeHtml: false }),
    policy: JSON.parse('{"coerceManualFailToCantTell": true}'),
    rules: { exclude: ['img-alt-present'] },
    profile: ['wcag22-aa'],
    timestamp: '2026-01-01T00:00:00Z'
  };
  const { said } = quietly(() =>
    runa11yCoreOnHtml(PAGE, {
      engineOptions: { ...fine, strictOptions: true },
      entryPointParity: false
    })
  );
  assert.deepEqual(said, []);
});
