'use strict';

// Options given the wrong way are read as meant, or said: on/off options
// read 'false' and 0 as off, a wrong type is warned about, runOnly as a Map
// throws, rules[ruleId] matches like a rule id and names an unknown one, an
// unusable rootCanvasFallback is white and echoed as white, JUnit's
// cantTellAs reads any case, and a baseline file as saved is read.

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');
const { renderJunitReport } = require('../src/junit.js');
const { matchBaseline, buildBaselineEntries } = require('../src/baseline.js');
const { renderSarifReport } = require('../src/sarif.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img class="ad" src="a.png"><p style="color:#767676">Grey</p></main></body></html>';

function scan(engineOptions, runOnly) {
  const warn = console.warn;
  const warnings = [];
  console.warn = (m) => warnings.push(String(m));
  try {
    const result = runa11yCoreOnHtml(PAGE, { engineOptions, runOnly, entryPointParity: false });
    return { result, warnings };
  } finally {
    console.warn = warn;
  }
}

test("on/off options read 'false' and 0 as off, 'true' and 1 as on", () => {
  assert.equal(scan({ perfStats: 'false' }).result.perfStats, null);
  assert.ok(scan({ perfStats: 'true' }).result.perfStats);
  assert.ok(scan({ perfStats: 1 }).result.perfStats);
  const html = (eo) => scan(eo, ['img-alt-present']).result.checksResults[0].occurrences[0].html;
  assert.equal(html({ output: { includeHtml: 'false' } }), '');
  assert.equal(html({ output: { includeHtml: 0 } }), '');
  assert.notEqual(html({}), '');
});

test('a wrong type is warned about, and runOnly as a Map or a Date throws', () => {
  assert.ok(
    scan({ perfStats: 'maybe' }).warnings.some((w) =>
      /perfStats must be true or false, not "maybe"; ignored/.test(w)
    )
  );
  for (const runOnly of [new Map([['tags', ['wcag2a']]]), new Date()]) {
    assert.throws(() => scan({}, runOnly), { code: 'INVALID_RUN_ONLY' });
  }
});

test('rules[ruleId] matches like a rule id, and an unknown id is named', () => {
  const outcome = (key) =>
    scan({ rules: { [key]: { excludeSelectors: ['.ad'] } } }, ['img-alt-present']).result
      .checksResults[0].outcome;
  for (const key of ['img-alt-present', 'IMG-ALT-PRESENT', 'a11ycore-img-alt-present']) {
    assert.equal(outcome(key), 'notApplicable', key);
  }
  const { result, warnings } = scan(
    { rules: { 'img-alt-presnt': { excludeSelectors: ['.ad'] } } },
    ['img-alt-present']
  );
  assert.equal(result.checksResults[0].outcome, 'fail');
  assert.ok(
    warnings.some((w) =>
      /no rule named "img-alt-presnt" \(did you mean "img-alt-present"\?\)/.test(w)
    )
  );
  assert.throws(() => scan({ strictOptions: true, rules: { 'img-alt-presnt': {} } }), {
    code: 'INVALID_ENGINE_OPTIONS'
  });
});

test('an unusable rootCanvasFallback is white, said, and echoed as white', () => {
  for (const color of ['banana', '#fff0', 'transparent']) {
    const { result, warnings } = scan({ contrast: { rootCanvasFallback: color } }, [
      'contrast-minimum'
    ]);
    assert.equal(
      result.checksResults[0].engineOptions.contrast.rootCanvasFallback,
      '#ffffff',
      color
    );
    assert.ok(
      warnings.some((w) => /rootCanvasFallback must be an opaque color/.test(w)),
      color
    );
  }
  assert.equal(
    scan({ contrast: { rootCanvasFallback: '#000' } }, ['contrast-minimum']).result.checksResults[0]
      .engineOptions.contrast.rootCanvasFallback,
    '#000'
  );
  assert.throws(() => scan({ strictOptions: true, contrast: { rootCanvasFallback: 'banana' } }), {
    code: 'INVALID_ENGINE_OPTIONS'
  });
});

test("JUnit's cantTellAs reads any case and refuses other values", () => {
  const { result } = scan({}, ['img-alt-present', 'img-alt-quality']);
  assert.equal(
    renderJunitReport(result, { cantTellAs: 'Failure' }),
    renderJunitReport(result, { cantTellAs: 'failure' })
  );
  for (const value of ['fail', true]) {
    assert.throws(() => renderJunitReport(result, { cantTellAs: value }), TypeError);
  }
});

test('a baseline file as saved is read by matchBaseline and the reporters', () => {
  const { result } = scan({}, ['img-alt-present']);
  const entries = buildBaselineEntries(result);
  const file = { version: 1, generatedAt: '2026-10-10T00:00:00.000Z', entries };
  assert.deepEqual(matchBaseline(result, file), matchBaseline(result, entries));
  assert.equal(matchBaseline(result, file).newCount, 0);
  assert.equal(
    renderSarifReport(result, { baselineEntries: file }),
    renderSarifReport(result, { baselineEntries: entries })
  );
  assert.equal(
    renderJunitReport(result, { baselineEntries: file }),
    renderJunitReport(result, { baselineEntries: entries })
  );
});
