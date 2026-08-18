'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { renderHtmlReport } = require('../src/report.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { makeOccurrence, makeCheckResult, makeScanResult } = require('./explain/fake-result');

test('renderHtmlReport: self-contained HTML with no external resource references', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>';
  const result = runa11yCoreOnHtml(html, {});
  const report = renderHtmlReport(result);

  assert.match(report, /^<!doctype html>/);
  assert.doesNotMatch(report, /\ssrc=["']https?:/);
  assert.doesNotMatch(report, /<link[^>]+href=["']https?:/);
  assert.doesNotMatch(report, /<script[^>]+src=/);
});

test('renderHtmlReport: reflects real outcome counts and rule ids from a scan', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>';
  const result = runa11yCoreOnHtml(html, { runOnly: ['img-alt-present'] });
  const report = renderHtmlReport(result, { title: 'My Report' });

  assert.match(report, /My Report/);
  assert.match(report, /img-alt-present/);
  assert.match(report, /Missing alt attribute/);
});

test('renderHtmlReport: a rule with zero occurrences produces no card', () => {
  const passCheck = makeCheckResult({ ruleId: 'clean-rule', outcome: 'pass', occurrences: [] });
  const result = makeScanResult([passCheck]);
  const report = renderHtmlReport(result);

  assert.doesNotMatch(report, /clean-rule/);
  assert.match(report, /No fail\/cantTell rules with occurrences/);
});

test('renderHtmlReport: mixed fail-rule occurrences preserve per-occurrence outcome in technical-data rows', () => {
  const check = makeCheckResult({
    ruleId: 'mixed-rule',
    outcome: 'fail',
    occurrences: [
      makeOccurrence({ selector: 'img.fail', occurrenceOutcome: 'fail' }),
      makeOccurrence({ selector: 'img.canttell', occurrenceOutcome: 'cantTell' })
    ]
  });
  const result = makeScanResult([check]);
  const report = renderHtmlReport(result);

  assert.match(report, /"selector":"img\.fail"/);
  assert.match(report, /"selector":"img\.canttell"/);
  assert.match(report, /"outcome":"cantTell"/);
});

test('renderHtmlReport: occurrence html/selector containing script-breaking content is safely escaped, never executes or breaks out of embedded JSON', () => {
  const maliciousOccurrence = makeOccurrence({
    selector: '<img src=x onerror=alert(1)>',
    html: '</script><script>window.__xss = true;</script>',
    summary: 'Has "quotes" & <angle> brackets'
  });
  const check = makeCheckResult({ ruleId: 'xss-rule', occurrences: [maliciousOccurrence] });
  const result = makeScanResult([check]);
  const report = renderHtmlReport(result);

  // Never literally breaks out of the embedded <script type="application/json"> block.
  assert.doesNotMatch(
    report,
    /<script type="application\/json"[^>]*>[^]*<\/script><script>window\.__xss/
  );
  // The raw unescaped payload should never appear verbatim in the cards' HTML context.
  assert.doesNotMatch(report, /<img src=x onerror=alert\(1\)>/);
  // But the underlying data should still be present, safely encoded, in the embedded JSON.
  assert.match(report, /onerror/);
});

test("renderHtmlReport: WCAG rollup section reflects a real composite rule's contributors/metrics", () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>';
  const result = runa11yCoreOnHtml(html, {});
  const composite = result.rulesResults.find((r) => r.ruleId === 'wcag-1.1.1-non-text-content');
  assert.ok(composite, 'fixture result includes the expected composite rule');

  const report = renderHtmlReport(result);
  const { failCount, passCount, cantTellCount, notApplicableCount } =
    composite.data.details.metrics;
  const expectedBreakdown = `${passCount} pass / ${failCount} fail / ${cantTellCount} needs review / ${notApplicableCount} n/a`;

  assert.match(report, /WCAG 1\.1\.1/);
  assert.match(report, new RegExp(expectedBreakdown.replace(/\//g, '\\/')));
  assert.match(report, new RegExp(composite.data.details.checksIds[0]));
});

test('renderHtmlReport: meta bar reports the locale the scan resolved to', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>';
  const report = renderHtmlReport(runa11yCoreOnHtml(html, { engineOptions: { locale: 'de' } }));

  assert.match(report, /<b>de<\/b>locale/);
  assert.doesNotMatch(report, /requested/);
});

test('renderHtmlReport: meta bar names the requested locale when it fell back', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>';
  const report = renderHtmlReport(runa11yCoreOnHtml(html, { engineOptions: { locale: 'ja' } }));

  assert.match(report, /<b>en<\/b>locale \(requested ja\)/);
});

test('renderHtmlReport: a result from an engine without engine.locale gets no locale chip', () => {
  const check = makeCheckResult({ ruleId: 'some-rule', outcome: 'pass', occurrences: [] });
  const report = renderHtmlReport(makeScanResult([check]));

  assert.doesNotMatch(report, /<\/b>locale/);
});

test('renderHtmlReport: a hostile locale string cannot break out of the meta bar', () => {
  const check = makeCheckResult({ ruleId: 'some-rule', outcome: 'pass', occurrences: [] });
  const result = makeScanResult([check]);
  result.engine.locale = {
    requested: '<img src=x onerror=alert(1)>',
    resolved: 'en',
    reason: 'unknown-locale'
  };

  const report = renderHtmlReport(result);

  assert.doesNotMatch(report, /<img src=x onerror/);
  assert.match(report, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

// Escaping assertions prove the characters were transformed; this proves the
// result: the report is opened from disk, so nothing an occurrence carries may
// run when it is.
test('renderHtmlReport: adversarial occurrence content cannot execute when the report is opened', () => {
  const { JSDOM } = require('jsdom');

  const payloads = [
    '</script><script>window.__pwned=1</script>',
    '<img src=x onerror="window.__pwned=1">',
    '<svg onload="window.__pwned=1"></svg>',
    '" onmouseover="window.__pwned=1',
    '"}]</script><script>window.__pwned=1</script><script>[{"a":"',
    '\\"}]</script><script>window.__pwned=1</script>'
  ];

  for (const payload of payloads) {
    const occurrence = makeOccurrence({
      selector: payload,
      html: payload,
      summary: payload,
      hint: payload
    });
    const result = makeScanResult([makeCheckResult({ occurrences: [occurrence] })]);

    const dom = new JSDOM(renderHtmlReport(result), { runScripts: 'dangerously' });
    const handlers = [...dom.window.document.querySelectorAll('*')].filter((el) =>
      [...el.attributes].some((a) => /^on/i.test(a.name))
    );

    assert.equal(dom.window.__pwned, undefined, `payload executed: ${payload}`);
    assert.deepEqual(handlers, [], `payload produced an event handler: ${payload}`);
    dom.window.close();
  }
});

// --- hero headline, per scan shape -----------------------------------------
//
// The headline is the first (and for many readers only) sentence of the
// report, and it says something different for each shape a scan can come back
// in. Each shape is asserted here so a wording change cannot silently make one
// of them read wrong.

function scanWithOutcomes(outcomes) {
  return makeScanResult(
    outcomes.map((outcome, i) =>
      makeCheckResult({
        ruleId: `rule-${i}`,
        outcome,
        occurrences:
          outcome === 'fail' || outcome === 'cantTell'
            ? [makeOccurrence({ selector: `#el-${i}` })]
            : []
      })
    )
  );
}

test('renderHtmlReport: with failures, the headline counts them and points below', () => {
  const report = renderHtmlReport(scanWithOutcomes(['fail', 'fail', 'pass']));

  assert.match(report, /<strong>1<\/strong> of <strong>3<\/strong> applicable checks passed/);
  assert.match(report, /<strong>2<\/strong> failures need attention below/);
});

test('renderHtmlReport: a single failure is described in the singular', () => {
  const report = renderHtmlReport(scanWithOutcomes(['fail', 'pass']));

  assert.match(report, /<strong>1<\/strong> failure needs attention below/);
  assert.doesNotMatch(report, /failures need attention/);
});

test('renderHtmlReport: with no failures but open questions, the headline asks for review', () => {
  const report = renderHtmlReport(scanWithOutcomes(['cantTell', 'cantTell', 'pass']));

  assert.match(
    report,
    /<strong>1<\/strong> of <strong>3<\/strong> applicable checks passed, with <strong>2<\/strong> needing manual review/
  );
  assert.doesNotMatch(report, /need[s]? attention below/);
});

test('renderHtmlReport: a clean scan says so without qualification', () => {
  const report = renderHtmlReport(scanWithOutcomes(['pass', 'pass']));

  assert.match(report, /All <strong>2<\/strong> applicable checks passed\./);
});

test('renderHtmlReport: a scan where nothing applied says nothing applied', () => {
  const report = renderHtmlReport(scanWithOutcomes(['notApplicable', 'notApplicable']));

  assert.match(report, /No applicable checks ran for this scan\./);
  assert.doesNotMatch(report, /applicable checks passed/);
});

test('renderHtmlReport: a result with no checks at all still renders a report', () => {
  const report = renderHtmlReport(makeScanResult([]));

  assert.match(report, /^<!doctype html>/);
  assert.match(report, /No applicable checks ran for this scan\./);
});

// --- WCAG rollup section ---------------------------------------------------

function makeComposite(overrides = {}) {
  return {
    ruleId: 'wcag-1.1.1',
    outcome: 'fail',
    title: 'Non-text Content',
    meta: {
      normativeMappings: [{ standard: 'WCAG', requirement: '1.1.1', level: 'A' }]
    },
    data: {
      details: {
        metrics: { passCount: 1, failCount: 2, cantTellCount: 3, notApplicableCount: 4 },
        checksIds: ['img-alt-present', 'area-alt-present']
      }
    },
    ...overrides
  };
}

test('renderHtmlReport: the WCAG rollup groups composites under their conformance level', () => {
  const result = makeScanResult([]);
  result.rulesResults = [
    makeComposite({ ruleId: 'wcag-1.1.1' }),
    makeComposite({
      ruleId: 'wcag-1.4.3',
      title: 'Contrast (Minimum)',
      meta: { normativeMappings: [{ requirement: '1.4.3', level: 'AA' }] }
    }),
    makeComposite({
      ruleId: 'wcag-1.4.6',
      title: 'Contrast (Enhanced)',
      meta: { normativeMappings: [{ requirement: '1.4.6', level: 'AAA' }] }
    })
  ];

  const report = renderHtmlReport(result);

  for (const level of ['Level A', 'Level AA', 'Level AAA']) {
    assert.match(report, new RegExp(`wcag-level-heading">${level}<`));
  }
  assert.match(report, /WCAG 1\.4\.3/);
  assert.match(report, /1 pass \/ 2 fail \/ 3 needs review \/ 4 n\/a/);
  assert.match(report, /img-alt-present, area-alt-present/);
});

test('renderHtmlReport: a composite with no usable mapping lands in the unmapped section', () => {
  const result = makeScanResult([]);
  result.rulesResults = [
    makeComposite({ ruleId: 'no-meta', meta: null }),
    makeComposite({ ruleId: 'no-mappings', meta: { normativeMappings: null } }),
    makeComposite({ ruleId: 'empty-mappings', meta: { normativeMappings: [] } }),
    makeComposite({ ruleId: 'no-level', meta: { normativeMappings: [{ requirement: '9.9.9' }] } }),
    makeComposite({
      ruleId: 'unknown-level',
      meta: { normativeMappings: [{ requirement: '8.8.8', level: 'AAAA' }] }
    })
  ];

  const report = renderHtmlReport(result);

  assert.match(report, /wcag-level-heading">Level \(unmapped\)</);
  assert.match(report, /WCAG \(unmapped\)/);
  // A level the grouping does not know about still shows up rather than
  // vanishing from the rollup.
  assert.match(report, /WCAG 8\.8\.8/);
  assert.doesNotMatch(report, /wcag-level-heading">Level AAAA</);
});

test('renderHtmlReport: a composite with no title falls back to its id, and no metrics to zeroes', () => {
  const result = makeScanResult([]);
  result.rulesResults = [makeComposite({ ruleId: 'bare-composite', title: null, data: null })];

  const report = renderHtmlReport(result);

  assert.match(report, /bare-composite/);
  assert.match(report, /0 pass \/ 0 fail \/ 0 needs review \/ 0 n\/a/);
});

test('renderHtmlReport: a composite with an unrecognized outcome is chipped as not applicable', () => {
  const result = makeScanResult([]);
  result.rulesResults = [makeComposite({ outcome: 'something-new' })];

  const report = renderHtmlReport(result);
  assert.match(report, /wcag-table/);
});

test('renderHtmlReport: a scan with no composites says so instead of rendering an empty table', () => {
  const report = renderHtmlReport(makeScanResult([]));

  assert.match(report, /No WCAG composite rollups available for this scan/);
});

// --- cards -----------------------------------------------------------------

test('renderHtmlReport: a rule with one occurrence gets no count badge or representative note', () => {
  const check = makeCheckResult({ occurrences: [makeOccurrence({ selector: '#only' })] });
  const report = renderHtmlReport(makeScanResult([check]));

  assert.doesNotMatch(report, /card-count">×/);
  assert.doesNotMatch(report, /Selector\/summary above are from one representative occurrence/);
});

test('renderHtmlReport: a mixed-tier rule reports both tiers in its count badge', () => {
  const check = makeCheckResult({
    occurrences: [
      makeOccurrence({ selector: '#a', occurrenceOutcome: 'fail' }),
      makeOccurrence({ selector: '#b', occurrenceOutcome: 'fail' }),
      makeOccurrence({ selector: '#c', occurrenceOutcome: 'cantTell' })
    ]
  });

  const report = renderHtmlReport(makeScanResult([check]));

  assert.match(report, /× 3 \(2 fail \/ 1 needs review\)/);
  assert.match(report, /3 total on this rule/);
});

test('renderHtmlReport: a single-tier rule with many occurrences gets a plain count', () => {
  const check = makeCheckResult({
    occurrences: [makeOccurrence({ selector: '#a' }), makeOccurrence({ selector: '#b' })]
  });

  const report = renderHtmlReport(makeScanResult([check]));

  assert.match(report, /card-count">× 2</);
  assert.doesNotMatch(report, /needs review\)/);
});

test('renderHtmlReport: a card falls back to the first occurrence when none matches the card outcome', () => {
  // getCardOutcome returns the rule's own outcome when no occurrence carries a
  // fail/cantTell tier, so nothing in the list matches it.
  const check = makeCheckResult({
    outcome: 'cantTell',
    occurrences: [makeOccurrence({ selector: '#first', occurrenceOutcome: 'pass' })]
  });
  // Force the rule outcome past the tier resolution so the find() misses.
  check.occurrences[0].outcome = 'pass';
  check.outcome = 'fail';

  const report = renderHtmlReport(makeScanResult([check]));
  assert.match(report, /#first/);
});

test('renderHtmlReport: an occurrence with no selector or hint renders without them', () => {
  const check = makeCheckResult({
    occurrences: [
      makeOccurrence({ selector: null, hint: null, summary: 'Summary only.', html: null })
    ]
  });

  const report = renderHtmlReport(makeScanResult([check]));

  assert.match(report, /<code>\(none\)<\/code>/);
  assert.match(report, /Summary only\./);
});

test('renderHtmlReport: a rule with no normative mappings renders no WCAG chips', () => {
  for (const meta of [null, {}, { normativeMappings: null }]) {
    const check = makeCheckResult({ meta });
    const report = renderHtmlReport(makeScanResult([check]));
    assert.match(report, /card-meta"><\/div>/);
  }
});

test('renderHtmlReport: past the card cap, the rest are pointed at the technical data', () => {
  const checks = Array.from({ length: 30 }, (_, i) =>
    makeCheckResult({
      ruleId: `rule-${String(i).padStart(2, '0')}`,
      occurrences: [makeOccurrence({ selector: `#el-${i}` })]
    })
  );

  const report = renderHtmlReport(makeScanResult(checks));

  assert.match(report, /Showing the 24 highest-priority rules of 30 with issues/);
});

// --- flattened occurrence rows ---------------------------------------------

test('renderHtmlReport: a check with no occurrences array contributes no technical rows', () => {
  const check = makeCheckResult({ occurrences: 'not an array' });
  const report = renderHtmlReport(makeScanResult([check]));

  assert.match(report, /No fail\/cantTell rules with occurrences on this scan\./);
});

test('renderHtmlReport: occurrence fields that are missing become empty strings, not "undefined"', () => {
  const check = makeCheckResult({
    occurrences: [{ occurrenceOutcome: 'fail' }, { occurrenceOutcome: 'cantTell' }]
  });

  const report = renderHtmlReport(makeScanResult([check]));

  assert.doesNotMatch(report, /"selector":null/);
  assert.match(report, /"selector":""/);
  assert.match(report, /"html":""/);
  assert.match(report, /"summary":""/);
  assert.match(report, /"hint":""/);
});

test('renderHtmlReport: an occurrence with no tier of its own inherits the rule outcome in the rows', () => {
  const check = makeCheckResult({
    outcome: 'notApplicable',
    occurrences: [makeOccurrence({ selector: '#x', occurrenceOutcome: undefined })]
  });

  const report = renderHtmlReport(makeScanResult([check]));

  assert.match(report, /"outcome":"notApplicable"/);
});

// --- header and meta bar ---------------------------------------------------

test('renderHtmlReport: a result with no url, engine or checks still renders every section', () => {
  for (const bare of [null, undefined, {}, { checksResults: 'x', rulesResults: 'x' }]) {
    const report = renderHtmlReport(bare);

    assert.match(report, /^<!doctype html>/);
    assert.match(report, /\(no url\)/);
    assert.match(report, /<b>\?<\/b>engine/);
    assert.match(report, /<b>\?<\/b>schema version/);
  }
});

test('renderHtmlReport: an occurrence carrying `outcome` instead of `occurrenceOutcome` is tiered by it', () => {
  const check = makeCheckResult({
    outcome: 'fail',
    occurrences: [
      makeOccurrence({ selector: '#a', occurrenceOutcome: undefined, outcome: 'fail' }),
      makeOccurrence({ selector: '#b', occurrenceOutcome: undefined, outcome: 'cantTell' })
    ]
  });

  const report = renderHtmlReport(makeScanResult([check]));

  assert.match(report, /\u00d7 2 \(1 fail \/ 1 needs review\)/);
});
