'use strict';

// The reports name each pack a scan ran with, and its version (engine.packs):
// SARIF as a tool extension and a run property, JUnit as a property, the
// HTML report beside the engine, and EARL as part of the assertor.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { definePack } = require('../src/pack.js');
const { packsOf } = require('../src/scan-result.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderHtmlReport } = require('../src/report.js');
const { renderEarlReport } = require('../src/earl.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>Home</title></head><body><main><img src="a.png"></main></body></html>';

const scoped = definePack({
  name: '@acme/pack-one',
  version: '1.2.0',
  namespace: 'acme',
  core: '*'
});
const plain = definePack({ name: 'pack-two', version: '0.3.0', namespace: 'two', core: '*' });

function scan(engineOptions) {
  return runa11yCoreOnHtml(PAGE, { engineOptions });
}

const withPacks = scan({ packs: [plain, scoped] });
const without = scan({});

test('packsOf reads engine.packs as names and versions, a scoped name whole', () => {
  assert.deepEqual(withPacks.engine.packs, ['@acme/pack-one@1.2.0', 'pack-two@0.3.0']);
  assert.deepEqual(packsOf(withPacks), [
    { name: '@acme/pack-one', version: '1.2.0' },
    { name: 'pack-two', version: '0.3.0' }
  ]);
  assert.deepEqual(packsOf(without), []);
  assert.deepEqual(packsOf({ engine: { packs: ['bare', 7, ''] } }), [
    { name: 'bare', version: null }
  ]);
});

test('SARIF: each pack is a tool extension with its version, and the run names them', () => {
  const run = JSON.parse(renderSarifReport(withPacks)).runs[0];
  assert.deepEqual(run.tool.extensions, [
    { name: '@acme/pack-one', version: '1.2.0' },
    { name: 'pack-two', version: '0.3.0' }
  ]);
  assert.deepEqual(run.properties.packs, ['@acme/pack-one@1.2.0', 'pack-two@0.3.0']);
  const bare = JSON.parse(renderSarifReport(without)).runs[0];
  assert.equal('extensions' in bare.tool, false);
  assert.equal('packs' in (bare.properties || {}), false);
});

test('JUnit: every suite has a packs property', () => {
  const xml = renderJunitReport(withPacks);
  const suites = xml.match(/<testsuite /g).length;
  const props = xml.match(
    /<property name="packs" value="@acme\/pack-one@1\.2\.0,pack-two@0\.3\.0"\/>/g
  );
  assert.equal(props.length, suites);
  assert.doesNotMatch(renderJunitReport(without), /name="packs"/);
});

test('HTML report: names each pack and its version beside the engine', () => {
  const html = renderHtmlReport(withPacks, { manualChecks: false });
  assert.match(html, /<div><b>@acme\/pack-one 1\.2\.0, pack-two 0\.3\.0<\/b>packs<\/div>/);
  assert.doesNotMatch(renderHtmlReport(without, { manualChecks: false }), /<\/b>packs<\/div>/);
  const de = renderHtmlReport(scan({ packs: [plain, scoped], locale: 'de' }), {
    manualChecks: false
  });
  assert.match(de, /pack-two 0\.3\.0<\/b>Pakete<\/div>/);
});

test('EARL: the assertor names each pack as a part, with its release', () => {
  const earl = renderEarlReport(withPacks);
  const assertor = earl['@graph'][0].assertions[0].assertedBy;
  assert.deepEqual(assertor['dct:hasPart'], [
    {
      '@type': 'Software',
      name: '@acme/pack-one',
      release: { '@type': 'Version', revision: '1.2.0' }
    },
    { '@type': 'Software', name: 'pack-two', release: { '@type': 'Version', revision: '0.3.0' } }
  ]);
  const bare = renderEarlReport(without)['@graph'][0].assertions[0].assertedBy;
  assert.equal('dct:hasPart' in bare, false);
  // Results that ran different packs have no one set of parts.
  const mixed = renderEarlReport([withPacks, { ...without, url: 'https://example.test/b' }]);
  assert.equal('dct:hasPart' in mixed['@graph'][0].assertions[0].assertedBy, false);
});

test('a scan of several profiles names its packs in every report', () => {
  const result = scan({ packs: [plain, scoped], profile: ['wcag22-aa', 'wcag21-aa'] });
  assert.deepEqual(result.engine.profiles, ['wcag22-aa', 'wcag21-aa']);
  assert.deepEqual(result.engine.packs, ['@acme/pack-one@1.2.0', 'pack-two@0.3.0']);
  assert.equal(JSON.parse(renderSarifReport(result)).runs[0].tool.extensions.length, 2);
  assert.match(
    renderJunitReport(result),
    /name="packs" value="@acme\/pack-one@1\.2\.0,pack-two@0\.3\.0"/
  );
  assert.match(renderHtmlReport(result, { manualChecks: false }), /pack-two 0\.3\.0<\/b>packs/);
  assert.equal(
    renderEarlReport(result)['@graph'][0].assertions[0].assertedBy['dct:hasPart'].length,
    2
  );
});
