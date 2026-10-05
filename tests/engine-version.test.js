'use strict';

/**
 * engine.version: the package release that produced a result. It is baked
 * into the generated core at build time (scripts/build-core.js), so a version
 * bump without a rebuild would report the old release; the first test fails
 * then. The SARIF and EARL reporters fall back to it for the tool version.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { renderSarifReport } = require('../src/sarif.js');
const { renderEarlReport } = require('../src/earl.js');
const { version } = require('../package.json');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';

test('engine.version is the package version, in the Node build and the browser bundle', () => {
  assert.equal(runa11yCoreOnHtml(PAGE).engine.version, version);
  const bundle = fs.readFileSync(path.join(__dirname, '../surea11y.browser.js'), 'utf8');
  assert.ok(
    bundle.includes(JSON.stringify(version)),
    'the bundle was built from this package version'
  );
});

test('SARIF: driver.version is the toolVersion given, else the engine version', () => {
  const result = runa11yCoreOnHtml(PAGE);
  const driver = (options) => JSON.parse(renderSarifReport(result, options)).runs[0].tool.driver;
  assert.equal(driver({}).version, version);
  assert.equal(driver({ toolVersion: '9.9.9' }).version, '9.9.9');
  // A result from a release before engine.version.
  const older = { ...result, engine: { ...result.engine, version: undefined } };
  assert.equal(JSON.parse(renderSarifReport(older, {})).runs[0].tool.driver.version, '0.0.0');
});

test('EARL: the assertor release is the version given, else the one release the results share', () => {
  const a = { ...runa11yCoreOnHtml(PAGE), url: 'https://example.test/a' };
  const b = { ...a, url: 'https://example.test/b' };
  const assertor = (results, options) =>
    renderEarlReport(results, options)['@graph'][0].assertions[0].assertedBy;

  assert.deepEqual(assertor([a, b], {}).release, { '@type': 'Version', revision: version });
  assert.equal(assertor([a], { assertor: { version: '2.0.0' } }).release.revision, '2.0.0');

  const otherRelease = { ...b, engine: { ...b.engine, version: '0.1.0' } };
  assert.ok(!('release' in assertor([a, otherRelease], {})), 'two releases claim none');
  assert.equal(assertor([a], { assertor: null }), undefined);
});
