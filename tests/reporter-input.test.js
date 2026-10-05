'use strict';

/**
 * What every reporter accepts as a scan result (src/scan-result.js): an
 * object with a checksResults array. Anything else used to render as a clean
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

test('reporters throw on a cross-frame result instead of rendering a clean scan', () => {
  const top = page('https://example.test/');
  const crossFrame = {
    topFrame: top,
    frames: [{ url: 'https://example.test/f', error: 'timeout' }]
  };
  for (const [name, render] of Object.entries(REPORTERS)) {
    assert.throws(
      () => render(crossFrame),
      (e) => e instanceof TypeError && e.message.startsWith(name) && /cross-frame/.test(e.message),
      name
    );
  }
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
