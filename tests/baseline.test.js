'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  buildBaselineEntries,
  matchBaseline,
  computeBaselineKey,
  getReasonCode
} = require('../src/baseline');
const { makeOccurrence, makeCheckResult, makeScanResult } = require('./explain/fake-result');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

test('buildBaselineEntries: one entry per fail occurrence', () => {
  const check = makeCheckResult({
    occurrences: [
      makeOccurrence({ selector: 'img:nth-child(1)' }),
      makeOccurrence({ selector: 'img:nth-child(2)' })
    ]
  });
  const entries = buildBaselineEntries(makeScanResult([check]));

  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].ruleId, 'img-alt-present');
  assert.strictEqual(entries[0].reasonCode, 'DEFAULT');
  assert.strictEqual(entries[0].html, '<img src="x.png">');
  assert.strictEqual(entries[0].selector, 'img:nth-child(1)');
});

test('buildBaselineEntries: only fail outcomes contribute entries (pass/notApplicable/cantTell do not)', () => {
  const failCheck = makeCheckResult({});
  const passCheck = makeCheckResult({ ruleId: 'other-rule', outcome: 'pass', occurrences: [] });
  const cantTellCheck = makeCheckResult({ ruleId: 'manual-rule', outcome: 'cantTell' });
  const entries = buildBaselineEntries(makeScanResult([failCheck, passCheck, cantTellCheck]));

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].ruleId, 'img-alt-present');
});

test('buildBaselineEntries: under a fail rule, only fail-tier occurrences are written (cantTell-tier occurrences are excluded)', () => {
  const check = makeCheckResult({
    occurrences: [
      makeOccurrence({ selector: 'img.fail', occurrenceOutcome: 'fail' }),
      makeOccurrence({ selector: 'img.canttell', occurrenceOutcome: 'cantTell' })
    ]
  });
  const entries = buildBaselineEntries(makeScanResult([check]));

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].selector, 'img.fail');
});

test('matchBaseline: an occurrence identical to a baseline entry is known, not new', () => {
  const check = makeCheckResult({});
  const result = makeScanResult([check]);
  const baseline = buildBaselineEntries(result);

  const match = matchBaseline(result, baseline);

  assert.strictEqual(match.totalFail, 1);
  assert.strictEqual(match.knownCount, 1);
  assert.strictEqual(match.newCount, 0);
  assert.strictEqual(match.staleCount, 0);
});

test('matchBaseline: under a fail rule, cantTell-tier occurrences are not counted as fail/new', () => {
  const check = makeCheckResult({
    occurrences: [
      makeOccurrence({ selector: 'img.fail', occurrenceOutcome: 'fail' }),
      makeOccurrence({ selector: 'img.canttell', occurrenceOutcome: 'cantTell' })
    ]
  });
  const result = makeScanResult([check]);

  const match = matchBaseline(result, []);

  assert.strictEqual(match.totalFail, 1);
  assert.strictEqual(match.newCount, 1);
  assert.strictEqual(match.newOccurrences[0].selector, 'img.fail');
});

test('matchBaseline: an occurrence not present in the baseline is new and gates the build', () => {
  const check = makeCheckResult({});
  const result = makeScanResult([check]);

  const match = matchBaseline(result, []);

  assert.strictEqual(match.totalFail, 1);
  assert.strictEqual(match.knownCount, 0);
  assert.strictEqual(match.newCount, 1);
  assert.strictEqual(match.newOccurrences[0].ruleId, 'img-alt-present');
});

test('matchBaseline: multiset matching -- baseline has 1 of a shape, fresh scan has 2 identical occurrences => 1 known + 1 new', () => {
  const check = makeCheckResult({
    occurrences: [
      makeOccurrence({ selector: 'main img:nth-child(1)' }),
      makeOccurrence({ selector: 'main img:nth-child(2)' })
    ]
  });
  const result = makeScanResult([check]);

  // Baseline only recorded ONE of the two identical (same ruleId/reasonCode/html) occurrences.
  const baseline = [
    {
      ruleId: 'img-alt-present',
      reasonCode: 'DEFAULT',
      selector: 'main img:nth-child(1)',
      html: '<img src="x.png">'
    }
  ];

  const match = matchBaseline(result, baseline);

  assert.strictEqual(match.totalFail, 2);
  assert.strictEqual(match.knownCount, 1);
  assert.strictEqual(match.newCount, 1);
});

test('matchBaseline: baseline entries with no matching fresh occurrence are reported as stale, not as a failure', () => {
  const check = makeCheckResult({ occurrences: [], outcome: 'notApplicable' });
  const result = makeScanResult([check]);
  const baseline = [
    { ruleId: 'img-alt-present', reasonCode: 'DEFAULT', selector: 'img', html: '<img src="x.png">' }
  ];

  const match = matchBaseline(result, baseline);

  assert.strictEqual(match.totalFail, 0);
  assert.strictEqual(match.newCount, 0);
  assert.strictEqual(match.staleCount, 1);
});

test('matchBaseline: a different ruleId never matches, even with identical html', () => {
  const check = makeCheckResult({ ruleId: 'other-rule' });
  const result = makeScanResult([check]);
  const baseline = [
    { ruleId: 'img-alt-present', reasonCode: 'DEFAULT', selector: 'img', html: '<img src="x.png">' }
  ];

  const match = matchBaseline(result, baseline);

  assert.strictEqual(match.knownCount, 0);
  assert.strictEqual(match.newCount, 1);
  assert.strictEqual(match.staleCount, 1);
});

test('matchBaseline: a distinct reasonCode never matches an entry recorded under a different reasonCode', () => {
  const check = makeCheckResult({
    occurrences: [makeOccurrence({ data: { details: { reasonCode: 'CODE_A' } } })]
  });
  const result = makeScanResult([check]);
  const baseline = [
    { ruleId: 'img-alt-present', reasonCode: 'CODE_B', selector: 'img', html: '<img src="x.png">' }
  ];

  const match = matchBaseline(result, baseline);

  assert.strictEqual(match.knownCount, 0);
  assert.strictEqual(match.newCount, 1);
});

test('matchBaseline/buildBaselineEntries: does not mutate the input result at all', () => {
  const result = makeScanResult([makeCheckResult({})]);
  const before = JSON.stringify(result);

  buildBaselineEntries(result);
  matchBaseline(result, []);

  assert.strictEqual(JSON.stringify(result), before);
});

test('matchBaseline: a changed selector alone does not break the match, as long as ruleId/reasonCode/html are unchanged', () => {
  // Simulates the flagged element having moved position on the page (e.g. an
  // unrelated sibling added/removed elsewhere) -- selector/structuralPath
  // would differ, but identity here is selector-independent on purpose.
  const check = makeCheckResult({
    occurrences: [makeOccurrence({ selector: 'body > main > div:nth-child(7) > img' })]
  });
  const result = makeScanResult([check]);
  const baseline = [
    {
      ruleId: 'img-alt-present',
      reasonCode: 'DEFAULT',
      selector: 'body > main > div:nth-child(2) > img',
      html: '<img src="x.png">'
    }
  ];

  const match = matchBaseline(result, baseline);

  assert.strictEqual(match.knownCount, 1);
  assert.strictEqual(match.newCount, 0);
});

test('computeBaselineKey: same ruleId/reasonCode/html always produces the same key', () => {
  const a = computeBaselineKey('img-alt-present', 'DEFAULT', '<img src="x.png">');
  const b = computeBaselineKey('img-alt-present', 'DEFAULT', '<img src="x.png">');
  const c = computeBaselineKey('img-alt-present', 'DEFAULT', '<img src="y.png">');

  assert.strictEqual(a, b);
  assert.notStrictEqual(a, c);
});

test('buildBaselineEntries: aria-prohibited-attr mixed-tier page contributes only its fail-tier occurrence', () => {
  const html = `<!doctype html><html><body>
    <span id="roleless_canttell" aria-label="Custom label">Visible text</span>
    <span id="roleless_fail" aria-label="icon-only"></span>
  </body></html>`;
  const result = runa11yCoreOnHtml(html, { runOnly: ['aria-prohibited-attr'] });
  const entries = buildBaselineEntries(result).filter((e) => e.ruleId === 'aria-prohibited-attr');

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].ruleId, 'aria-prohibited-attr');
  assert.match(entries[0].html, /id="roleless_fail"/);
});

// A baseline records what a page looks like, not what the report reads like,
// so switching language must not turn every known violation into a new one.
test('matchBaseline: a baseline written in one locale matches a scan in another', () => {
  const page =
    '<!doctype html><html><head><title>t</title></head><body><img src="x.png"></body></html>';
  const scan = (engineOptions) => runa11yCoreOnHtml(page, { engineOptions });

  const germanBaseline = buildBaselineEntries(scan({ locale: 'de' }));
  assert.ok(germanBaseline.length > 0, 'the fixture produces at least one fail occurrence');

  assert.equal(matchBaseline(scan({ locale: 'en' }), germanBaseline).newCount, 0);
  assert.equal(matchBaseline(scan({ locale: 'fr' }), germanBaseline).newCount, 0);
  assert.equal(
    matchBaseline(
      scan({ locale: 'de', messages: { de: { img_altPresent_title: 'X' } } }),
      germanBaseline
    ).newCount,
    0,
    'a caller-supplied dictionary does not change baseline identity either'
  );
});

// A broken baseline must report more, never fewer -- silently swallowing
// violations because a file was malformed is the dangerous direction.
test('matchBaseline: malformed baseline input degrades to treating everything as new', () => {
  const page =
    '<!doctype html><html><head><title>t</title></head><body><img src="x.png"></body></html>';
  const result = runa11yCoreOnHtml(page, { engineOptions: {} });
  const expected = buildBaselineEntries(result).length;

  for (const entries of [null, undefined, { a: 1 }, [null], [{}], ['x']]) {
    assert.equal(
      matchBaseline(result, entries).newCount,
      expected,
      `entries ${JSON.stringify(entries)} should leave every occurrence new`
    );
  }
});

test('buildBaselineEntries: a malformed result yields no entries instead of throwing', () => {
  for (const bad of [null, undefined, {}, { checksResults: 'x' }]) {
    assert.deepEqual(buildBaselineEntries(bad), []);
  }
});

// --- identity and normalization edges -------------------------------------
//
// docs/BASELINE.md pins occurrence identity to ruleId + reasonCode + html, so
// every way those three can arrive malformed or absent decides whether a real
// violation is silently matched away. These cover the shapes the happy-path
// tests above never produce.

test('getReasonCode: any occurrence without a reasonCode reads as DEFAULT', () => {
  for (const occurrence of [
    null,
    undefined,
    {},
    { data: null },
    { data: {} },
    { data: { details: null } },
    { data: { details: {} } },
    { data: { details: { reasonCode: '' } } }
  ]) {
    assert.equal(getReasonCode(occurrence), 'DEFAULT', JSON.stringify(occurrence));
  }

  assert.equal(
    getReasonCode(makeOccurrence({ data: { details: { reasonCode: 'NO_ALT' } } })),
    'NO_ALT'
  );
});

test('buildBaselineEntries: a fail check with a non-array occurrences field contributes nothing', () => {
  for (const occurrences of [null, undefined, 'x', {}, 3]) {
    const result = makeScanResult([makeCheckResult({ outcome: 'fail', occurrences })]);
    assert.deepEqual(buildBaselineEntries(result), []);
  }
});

test('buildBaselineEntries: a non-string selector or html is recorded as an empty string', () => {
  const check = makeCheckResult({
    outcome: 'fail',
    occurrences: [makeOccurrence({ selector: null, html: undefined })]
  });

  assert.deepEqual(buildBaselineEntries(makeScanResult([check])), [
    { ruleId: 'img-alt-present', reasonCode: 'DEFAULT', selector: '', html: '' }
  ]);
});

test('matchBaseline: an entry with no reasonCode matches an occurrence that has none either', () => {
  const check = makeCheckResult({
    outcome: 'fail',
    occurrences: [makeOccurrence({ html: '<img src="x.png">', data: { details: null } })]
  });
  const result = makeScanResult([check]);

  const summary = matchBaseline(result, [
    { ruleId: 'img-alt-present', html: '<img src="x.png">' } // no reasonCode written
  ]);

  assert.equal(summary.knownCount, 1);
  assert.equal(summary.newCount, 0);
  assert.equal(summary.staleCount, 0);
});

test('matchBaseline: an entry with a non-string html matches an occurrence with no html', () => {
  const check = makeCheckResult({
    outcome: 'fail',
    occurrences: [makeOccurrence({ html: null })]
  });

  const summary = matchBaseline(makeScanResult([check]), [
    { ruleId: 'img-alt-present', reasonCode: 'DEFAULT', html: null }
  ]);

  assert.equal(summary.knownCount, 1);
  assert.equal(summary.newCount, 0);
});

test('matchBaseline: an occurrence carrying `outcome` instead of `occurrenceOutcome` is still tiered', () => {
  const check = makeCheckResult({
    outcome: 'fail',
    occurrences: [
      makeOccurrence({ selector: 'img.fail', occurrenceOutcome: undefined, outcome: 'fail' }),
      makeOccurrence({
        selector: 'img.canttell',
        occurrenceOutcome: undefined,
        outcome: 'cantTell'
      })
    ]
  });

  const summary = matchBaseline(makeScanResult([check]), []);

  assert.equal(summary.totalFail, 1, 'only the fail-tier occurrence gates the build');
  assert.deepEqual(
    summary.newOccurrences.map((o) => o.selector),
    ['img.fail']
  );
});

test('matchBaseline: a check with a non-array occurrences field is skipped, not thrown on', () => {
  for (const occurrences of [null, undefined, 'x', {}]) {
    const result = makeScanResult([makeCheckResult({ outcome: 'fail', occurrences })]);
    assert.deepEqual(matchBaseline(result, []), {
      totalFail: 0,
      knownCount: 0,
      newCount: 0,
      newOccurrences: [],
      staleCount: 0
    });
  }
});

test('buildBaselineEntries/matchBaseline: a null entry inside checksResults is skipped', () => {
  const check = makeCheckResult({ outcome: 'fail', occurrences: [makeOccurrence()] });
  const result = makeScanResult([null, undefined, check]);

  assert.equal(buildBaselineEntries(result).length, 1);
  assert.equal(matchBaseline(result, []).totalFail, 1);
});

test('buildBaselineEntries/matchBaseline: a null occurrence inside a fail check is skipped', () => {
  const check = makeCheckResult({ outcome: 'fail', occurrences: [null, makeOccurrence()] });
  const result = makeScanResult([check]);

  assert.equal(buildBaselineEntries(result).length, 1);
  assert.equal(matchBaseline(result, []).totalFail, 1);
});
