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
    new Set(failures.map((r) => r.partialFingerprints['surea11y/violation/v2'])).size,
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

test("reporters read a binding's frame scan, whose frames are results of their own", () => {
  const bindingFrames = {
    topFrame: page('https://example.test/'),
    frames: [page('https://ads.test/slot'), { url: 'https://gone.test/', error: 'detached' }]
  };
  const run = JSON.parse(renderSarifReport(bindingFrames)).runs[0];
  assert.deepEqual(
    run.results
      .filter((r) => r.level === 'error')
      .map((r) => r.locations[0].physicalLocation.artifactLocation.uri),
    ['https://example.test/', 'https://ads.test/slot']
  );
  assert.deepEqual(
    run.invocations[0].toolExecutionNotifications.map((n) => n.message.text),
    ['The frame iframe (https://gone.test/) was not scanned: detached']
  );
  assert.match(renderJunitReport(bindingFrames), /<testsuites [^>]*failures="2" errors="0"/);
  assert.deepEqual(
    buildBaselineEntries(bindingFrames).map((e) => e.frame || []),
    [[], ['iframe']]
  );
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

// A null check, occurrence or rollup, which a sparse array also becomes
// once saved as JSON: SARIF, JUnit, EARL and the baseline left it out, and
// the HTML report threw a TypeError.
test('every reporter leaves out a check, occurrence or rollup that is null', () => {
  const clean = { ...page('https://example.test/'), timestamp: '2026-10-15T00:00:00.000Z' };
  const dirty = JSON.parse(JSON.stringify(clean));
  const fail = dirty.checksResults.find((c) => c.outcome === 'fail');
  fail.occurrences.push(null);
  fail.occurrences.splice(0, 0, 'x', 7);
  dirty.checksResults.push(null, 'x');
  dirty.checksResults[dirty.checksResults.length + 1] = undefined; // a hole
  dirty.rulesResults.unshift(null, 3);
  const stored = JSON.parse(JSON.stringify(dirty));
  assert.ok(stored.checksResults.includes(null) && stored.rulesResults.includes(null));

  for (const [name, render] of Object.entries({ ...REPORTERS, renderEarlReport })) {
    assert.doesNotThrow(() => render(stored), name);
  }
  assert.equal(renderHtmlReport(stored), renderHtmlReport(clean));
  // A frame of a cross-frame result is read the same way.
  assert.equal(
    renderHtmlReport({ topFrame: clean, frames: [{ url: 'a', topFrame: stored, frames: [] }] }),
    renderHtmlReport({ topFrame: clean, frames: [{ url: 'a', topFrame: clean, frames: [] }] })
  );
});

// A stored result written by another tool, or edited by hand, can hold a
// value of another type where the engine writes a list or a string. The
// reporters threw on some (normativeMappings as an object or a string in
// all four, a number rule id and rulesResults as an object in JUnit, a
// requested locale that can't be read as text in the HTML report); each is
// now read as the engine would have written it, or as none.
test('every reporter reads a stored result whose fields have other types', () => {
  const compact = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>',
    { engineOptions: { output: { detail: 'findings' } } }
  );
  assert.equal(compact.engine.outputDetail, 'findings');
  const failing = (r) => r.checksResults.find((c) => c.outcome === 'fail');
  const entries = (r) => r.checksResults.concat(r.rulesResults);
  const changes = {
    'normativeMappings as an object': (r) =>
      entries(r).forEach((c) => c.meta && (c.meta.normativeMappings = { a: 1 })),
    'normativeMappings as a string': (r) =>
      entries(r).forEach((c) => c.meta && (c.meta.normativeMappings = 'WCAG 1.1.1')),
    // Two checks in one suite, so JUnit sorts them by id.
    'a number rule id': (r) => {
      const fail = failing(r);
      fail.ruleId = 42;
      r.checksResults.push({ ...fail, ruleId: 41 });
    },
    'no rule id': (r) => delete failing(r).ruleId,
    'a selector that is not a string': (r) => (failing(r).occurrences[0].selector = 7),
    'a number title': (r) => (failing(r).title = 5),
    'a number engine version': (r) => (r.engine.version = 1.2),
    'rulesResults as an object': (r) => (r.rulesResults = { a: 1 }),
    'a requested locale that cannot be read as text': (r) =>
      (r.engine.locale.requested = {
        toString() {
          throw new Error('unreadable');
        }
      })
  };
  for (const [label, base] of [
    ['full', page('https://example.test/')],
    ['compact', compact]
  ]) {
    for (const [change, apply] of Object.entries(changes)) {
      const result = JSON.parse(JSON.stringify(base));
      apply(result);
      for (const [name, render] of Object.entries({ ...REPORTERS, renderEarlReport })) {
        assert.doesNotThrow(() => render(result), `${name}, ${label}: ${change}`);
      }
    }
  }

  // A number rule id is read as its text.
  const numbered = JSON.parse(JSON.stringify(page('https://example.test/')));
  changes['a number rule id'](numbered);
  const junit = renderJunitReport(numbered);
  assert.ok(junit.indexOf('name="41"') < junit.indexOf('name="42"'), 'sorted by id');
  assert.deepEqual(
    buildBaselineEntries(numbered).map((e) => e.ruleId),
    ['42', '41']
  );
  const earl = renderEarlReport(numbered)['@graph'][0].assertions.map((a) => a.test.title);
  assert.ok(earl.includes('41') && earl.includes('42'));
  // Mappings that are not a list are none: the rule lands in "Other checks".
  const unmapped = JSON.parse(JSON.stringify(page('https://example.test/')));
  changes['normativeMappings as an object'](unmapped);
  assert.match(renderJunitReport(unmapped), /<testsuite name="Other checks" [^>]*failures="1"/);
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
