'use strict';

/**
 * What every reporter accepts as a scan result (src/scan-result.js): an
 * object with a checksResults array, or a cross-frame result. Anything else used to render as a clean
 * scan, so a CI gate fed the output of runa11yCoreAcrossFrames, an array of
 * results, or nothing at all from a scan that broke, passed.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { renderHtmlReport } = require('../src/report.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderJunitReport } = require('../src/junit.js');
const { renderEarlReport } = require('../src/earl.js');
const { buildBaselineEntries, matchBaseline } = require('../src/baseline.js');

const page = (url) =>
  Object.assign(
    runa11yCoreOnHtml(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>'
    ),
    { url }
  );

const REPORTERS = {
  renderHtmlReport: (r) => renderHtmlReport(r),
  renderSarifReport: (r) => renderSarifReport(r),
  renderJunitReport: (r) => renderJunitReport(r),
  buildBaselineEntries: (r) => buildBaselineEntries(r),
  matchBaseline: (r) => matchBaseline(r, [])
};

// A cross-frame result is read, every frame of it (#145): the reporters
// threw on it, and only EARL took it.
test('reporters render every frame of a cross-frame result, and say which frame was not scanned', () => {
  const crossFrame = {
    topFrame: page('https://example.test/'),
    frames: [
      {
        url: 'https://ads.test/slot',
        selector: '#ads > iframe',
        title: 'Advertisement',
        topFrame: page('https://ads.test/slot'),
        frames: [
          {
            url: 'https://deep.test/',
            selector: 'iframe',
            title: null,
            topFrame: page('https://deep.test/'),
            frames: []
          }
        ]
      },
      { url: 'https://slow.test/', selector: '#player', title: 'Video', error: 'timeout' }
    ]
  };
  const run = JSON.parse(renderSarifReport(crossFrame)).runs[0];
  const failures = run.results.filter((r) => r.level === 'error');
  assert.deepEqual(
    failures.map((r) => [
      r.locations[0].physicalLocation.artifactLocation.uri,
      r.properties.frame || []
    ]),
    [
      ['https://example.test/', []],
      ['https://ads.test/slot', ['#ads > iframe']],
      ['https://deep.test/', ['#ads > iframe', 'iframe']]
    ]
  );
  assert.equal(
    new Set(failures.map((r) => r.partialFingerprints['surea11y/violation/v1'])).size,
    3
  );
  assert.deepEqual(
    run.invocations[0].toolExecutionNotifications.map((n) => [n.level, n.message.text]),
    [['warning', 'The frame #player (https://slow.test/) was not scanned: timeout']]
  );

  const junit = renderJunitReport(crossFrame);
  assert.match(junit, /<testsuites [^>]*failures="3" errors="0"/);
  assert.match(junit, /<testsuite name="Frame #ads &gt; iframe: WCAG 1\.1\.1/);
  assert.match(junit, /<testsuite name="Frame #ads &gt; iframe \u2192 iframe: WCAG 1\.1\.1/);
  assert.match(
    junit,
    /<testsuite name="Frame #player" tests="1" failures="0" errors="0" skipped="1"/
  );
  assert.match(junit, /<skipped message="Not scanned: timeout"\/>/);

  const html = renderHtmlReport(crossFrame);
  assert.match(html, /<h3 class="frame-heading">Frame #ads &gt; iframe<\/h3>/);
  assert.match(html, /Not scanned: timeout/);

  const entries = buildBaselineEntries(crossFrame);
  assert.deepEqual(
    entries.map((e) => e.frame || []),
    [[], ['#ads > iframe'], ['#ads > iframe', 'iframe']]
  );
  assert.deepEqual(matchBaseline(crossFrame, entries), {
    totalFail: 3,
    knownCount: 3,
    newCount: 0,
    newOccurrences: [],
    staleCount: 0
  });
  // A frame's known failure does not cover the same failure in the page.
  const onlyFrames = matchBaseline(crossFrame, entries.slice(1));
  assert.equal(onlyFrames.newCount, 1);
  assert.equal(onlyFrames.newOccurrences[0].frame, undefined);
});

test('a single result renders as it did', () => {
  const r = page('https://example.test/');
  const crossFrame = { topFrame: r, frames: [] };
  assert.equal(renderSarifReport(crossFrame), renderSarifReport(r));
  assert.equal(renderJunitReport(crossFrame), renderJunitReport(r));
  assert.deepEqual(buildBaselineEntries(crossFrame), buildBaselineEntries(r));
});

test('reporters throw on an array or a value that is not an object', () => {
  const r = page('https://example.test/');
  for (const [name, render] of Object.entries(REPORTERS)) {
    for (const bad of [[r, r], 'x', 5, true]) {
      assert.throws(() => render(bad), TypeError, `${name}(${JSON.stringify(typeof bad)})`);
    }
  }
});

test('reporters throw on a missing result, and render a partial one', () => {
  // A scan that broke and returned nothing must not read as a clean one.
  for (const [name, render] of Object.entries(REPORTERS)) {
    for (const missing of [null, undefined, {}, { checksResults: 'x' }]) {
      assert.throws(() => render(missing), TypeError, name);
    }
    assert.doesNotThrow(() => render({ checksResults: [] }), name);
  }
});

test('renderEarlReport takes a cross-frame result, each answering frame a subject of its own', () => {
  const crossFrame = {
    topFrame: page('https://example.test/'),
    frames: [
      {
        url: 'https://example.test/a',
        topFrame: page('https://example.test/a'),
        frames: [
          {
            url: 'https://example.test/a/b',
            topFrame: page('https://example.test/a/b'),
            frames: []
          }
        ]
      },
      { url: 'https://other.test/', error: 'no responder' }
    ]
  };
  const sources = (doc) => doc['@graph'].map((s) => s.source).sort();
  const earl = renderEarlReport(crossFrame);
  assert.deepEqual(sources(earl), [
    'https://example.test/',
    'https://example.test/a',
    'https://example.test/a/b'
  ]);
  assert.deepEqual(earl, renderEarlReport([crossFrame]));
  assert.throws(() => renderEarlReport('x'), TypeError);
});

test('renderEarlReport keeps several results without a URL apart', () => {
  const r = page(undefined);
  const a = { ...r, url: null };
  const b = { ...r, url: null };
  const sources = (doc) => doc['@graph'].map((s) => s.source).sort();
  assert.deepEqual(sources(renderEarlReport([a, b])), [
    'about:blank#result-1',
    'about:blank#result-2'
  ]);
  assert.deepEqual(sources(renderEarlReport(a)), ['about:blank'], 'one alone is about:blank');
});
