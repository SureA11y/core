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
  assert.ok(report.includes(expectedBreakdown), expectedBreakdown);
  assert.match(report, new RegExp(composite.data.details.checksIds[0]));
});

test('renderHtmlReport: meta bar reports the locale the scan resolved to', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>';
  const report = renderHtmlReport(runa11yCoreOnHtml(html, { engineOptions: { locale: 'de' } }));

  assert.match(report, /<b>de<\/b>Sprache/);
  assert.doesNotMatch(report, /angefordert/);
});

test('renderHtmlReport: meta bar names the requested locale when it fell back', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>';
  const report = renderHtmlReport(runa11yCoreOnHtml(html, { engineOptions: { locale: 'ko' } }));

  assert.match(report, /<b>en<\/b>locale \(requested ko\)/);
});

test('renderHtmlReport: a report for a shipped locale is written entirely in that language', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"><img src="y.png"></body></html>';
  const report = renderHtmlReport(runa11yCoreOnHtml(html, { engineOptions: { locale: 'ja' } }));

  assert.match(report, /<html lang="ja">/);
  assert.match(report, /<h2>確認が必要な項目<\/h2>/);
  assert.match(report, /<b>ja<\/b>ロケール/);
  assert.match(report, /\(不合格、重大度: 重大\)/);
  assert.match(report, /<div class="card-snippet">&lt;img&gt; 要素に alt 属性がありません。/);
  assert.doesNotMatch(report, /<span lang=|<td lang=/);

  // Every label of the English page, none of which may survive.
  for (const english of [
    'Worth reviewing',
    'WCAG rollup',
    'rules run',
    'total occurrences',
    'schema version',
    'Selector:',
    'Scorecard',
    'Needs review',
    'applicable checks',
    'Prev',
    'No matching occurrences',
    'Contributing rules',
    'surea11y scan report'
  ]) {
    assert.ok(!report.includes(english), `English label left in a Japanese report: ${english}`);
  }
});

test('renderHtmlReport: a dictionary supplied at scan time keeps English labels and tags the findings', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>';
  const result = runa11yCoreOnHtml(html, {
    engineOptions: {
      locale: 'nl',
      messages: { nl: { img_altPresent_summary_fail: 'Het alt-attribuut ontbreekt op <img>.' } }
    }
  });
  const report = renderHtmlReport(result);

  assert.equal(result.engine.locale.resolved, 'nl');
  assert.match(report, /<html lang="en">/);
  assert.match(report, /<h2>Worth reviewing<\/h2>/);
  // Only the string the dictionary translated is marked; its English hint,
  // other rules' English text and English rollup titles are not.
  assert.match(
    report,
    /<div class="card-snippet"><span lang="nl">Het alt-attribuut ontbreekt op &lt;img&gt;\.<\/span> — Add an alt attribute/
  );
  assert.doesNotMatch(report, /<td lang="nl">/);
  const json = report.match(
    /<script type="application\/json" id="report-data">([\s\S]*?)<\/script>/
  )[1];
  const marked = JSON.parse(json)
    .filter((row) => row.summaryLang)
    .map((row) => `${row.ruleId}:${row.summaryLang}`);
  assert.deepEqual([...new Set(marked)], ['img-alt-present:nl']);
});

test('renderHtmlReport: an English scan adds no lang attributes to rule text', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>';
  const report = renderHtmlReport(runa11yCoreOnHtml(html));

  assert.doesNotMatch(report, /class="card-snippet" lang=/);
  assert.doesNotMatch(report, /<span lang=|<td lang=|"summaryLang":"[a-z]/);
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

test('renderHtmlReport: the WCAG rollup names the EN 301 549 clause once per clause', () => {
  const result = makeScanResult([]);
  result.rulesResults = [
    makeComposite({
      meta: {
        normativeMappings: [
          { standard: 'WCAG', requirement: '1.1.1', level: 'A' },
          { standard: 'EN 301 549', version: 'V3.2.1', requirement: '9.1.1.1' },
          { standard: 'EN 301 549', version: 'V4.1.1', requirement: '9.1.1.1' }
        ]
      }
    })
  ];
  const report = renderHtmlReport(result);

  assert.strictEqual(report.match(/EN 301 549 9\.1\.1\.1/g).length, 1);
});

test('renderHtmlReport: a rollup row with no EN 301 549 clause gets no EN label', () => {
  const result = makeScanResult([]);
  result.rulesResults = [makeComposite({})];
  assert.doesNotMatch(renderHtmlReport(result), /EN 301 549/);
});

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

test('renderHtmlReport: only WCAG Success Criteria are chipped as WCAG', () => {
  const check = makeCheckResult({
    meta: {
      normativeMappings: [
        { standard: 'WCAG', version: '2.2', requirement: '2.1.1', conformanceLevel: 'A' },
        { standard: 'WCAG', version: '2.2', type: 'Understanding', requirement: '2.1.1' },
        { standard: 'EN 301 549', version: 'V3.2.1', requirement: '9.2.1.1' }
      ]
    }
  });
  const report = renderHtmlReport(makeScanResult([check]));

  assert.strictEqual(report.match(/>WCAG 2\.1\.1</g).length, 1);
  assert.doesNotMatch(report, /WCAG 9\.2\.1\.1/);
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

test('renderHtmlReport: a missing result throws; one with no url, engine or rollups renders every section', () => {
  for (const bad of [null, undefined, {}, { checksResults: 'x', rulesResults: 'x' }]) {
    assert.throws(() => renderHtmlReport(bad), TypeError);
  }
  for (const bare of [{ checksResults: [] }, { checksResults: [], rulesResults: 'x' }]) {
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

test('renderHtmlReport: the meta bar shows the WCAG target and profile when the result has them', () => {
  const result = makeScanResult([]);
  result.engine = { ...result.engine, wcagVersion: '2.1', profile: 'en301549-v3.2.1' };
  const report = renderHtmlReport(result);
  assert.match(report, /<b>WCAG 2\.1<\/b>target/);
  assert.match(report, /<b>en301549-v3\.2\.1<\/b>profile/);
});

test('renderHtmlReport: a result without a target or profile gets no chips for them', () => {
  const report = renderHtmlReport(makeScanResult([]));
  assert.doesNotMatch(report, /<\/b>target</);
  assert.doesNotMatch(report, /<\/b>profile</);
  assert.doesNotMatch(report, /<\/b>opt-in rules</);
});

test('renderHtmlReport: the meta bar names the opt-in rules a run added, in the report locale', () => {
  const result = makeScanResult([]);
  result.engine = { ...result.engine, wcagVersion: '2.2', optInRules: ['sample'] };
  assert.match(renderHtmlReport(result), /<b>sample<\/b>opt-in rules/);
  const fr = {
    ...result,
    engine: { ...result.engine, locale: { requested: 'fr', resolved: 'fr', reason: 'ok' } }
  };
  assert.match(renderHtmlReport(fr), /<b>sample<\/b>règles optionnelles/);
  result.engine.optInRules = [];
  assert.doesNotMatch(renderHtmlReport(result), /opt-in rules/);
});

test('renderHtmlReport: the meta bar shows the conditions the page was rendered under', () => {
  const result = makeScanResult([]);
  result.engine = {
    ...result.engine,
    environment: {
      layout: true,
      viewport: { width: 1024, height: 900 },
      devicePixelRatio: 1,
      colorScheme: 'dark',
      fonts: 'loaded'
    }
  };
  let report = renderHtmlReport(result);
  assert.match(report, /<b>1024\u00d7900<\/b>viewport/);
  assert.match(report, /<b>dark<\/b>color scheme/);
  // Loaded fonts are the normal case and get no chip.
  assert.doesNotMatch(report, /web fonts/);

  result.engine.environment = {
    ...result.engine.environment,
    devicePixelRatio: 2,
    fonts: 'loading'
  };
  report = renderHtmlReport(result);
  assert.match(report, /<b>1024\u00d7900 @2x<\/b>viewport/);
  assert.match(report, /<b>loading<\/b>web fonts/);

  result.engine.environment = { layout: false };
  report = renderHtmlReport(result);
  assert.match(report, /<b>none<\/b>layout/);
  assert.doesNotMatch(report, /viewport</);

  delete result.engine.environment;
  assert.doesNotMatch(renderHtmlReport(result), /<\/b>(layout|viewport)</);
});

test('renderHtmlReport: cards cap a long selector and summary, the table keeps them whole', () => {
  const selector = `html > body > ${'div > '.repeat(60)}img`;
  const summary = `Missing alt attribute on <img>. ${'Context. '.repeat(40)}`.trim();
  const result = {
    checksResults: [
      makeCheckResult({
        ruleId: 'img-alt-present',
        outcome: 'fail',
        occurrences: [{ selector, summary, hint: 'Add an alt attribute.', html: '<img>' }]
      })
    ],
    rulesResults: []
  };
  const report = renderHtmlReport(result);
  const card = report.slice(
    report.indexOf('<div class="card">'),
    report.indexOf('<h2>', report.indexOf('<div class="card">'))
  );

  assert.ok(!card.includes(selector), 'card shows the full selector');
  assert.match(card, /<code>html &gt; body &gt; (div &gt; )+[^<]*…<\/code>/);
  assert.match(
    card,
    /Missing alt attribute on &lt;img&gt;\. (Context\. )+[^<]*… — Add an alt attribute\./
  );
  const data = JSON.parse(report.match(/id="report-data">(.*?)<\/script>/)[1]);
  assert.equal(data[0].selector, selector);
  assert.equal(data[0].summary, summary);
});

// "Closest to the limit": each measuring rule's margin, in whole pixels and
// two-decimal ratios, with "less than" when there is under one unit of room.
test('report: a margins table shows how close each measuring rule came', () => {
  const result = runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head>
     <body style="background:#fff;color:#000"><p id="grey" style="color:#767676">Grey text</p></body></html>`
  );
  const contrast = result.checksResults.find((r) => r.ruleId === 'contrast-minimum');
  assert.ok(contrast.margin, 'the scan has a contrast margin');
  // A pixel margin added by hand: jsdom has no layout to measure one.
  result.checksResults.push({
    ...contrast,
    ruleId: 'target-size-minimum',
    margin: {
      measure: 'target-size-px',
      unit: 'px',
      limit: 'min',
      threshold: 24,
      value: 24.4,
      headroom: 0.4,
      measuredCount: 3,
      selector: '#snug'
    }
  });

  const report = renderHtmlReport(result);
  assert.match(report, /<h2>Closest to the limit<\/h2>/);
  assert.match(report, /4\.54:1<\/td>\s*<td>at least 4\.5:1<\/td>\s*<td>0\.04<\/td>/);
  assert.match(report, /24 px<\/td>\s*<td>at least 24 px<\/td>\s*<td>less than 1 px<\/td>/);
  assert.match(report, /<code>#snug<\/code>/);
  assert.ok(
    report.indexOf('Closest to the limit') > report.indexOf('Worth reviewing') &&
      report.indexOf('Closest to the limit') < report.indexOf('WCAG rollup'),
    'after the cards, before the rollup'
  );
});

test('report: no margins, no margins table', () => {
  const report = renderHtmlReport(makeScanResult([makeCheckResult()]));
  assert.ok(!report.includes('Closest to the limit'));
});

test('renderHtmlReport: a result with a timestamp renders the same page every time, dated by it', () => {
  const result = { ...makeScanResult([]), timestamp: '2026-10-05T12:34:56.000Z' };
  const first = renderHtmlReport(result);
  assert.equal(renderHtmlReport(result), first);
  assert.match(first, /<title>[^<]*2026[^<]*12:34:56[^<]*UTC[^<]*<\/title>/);
  // Without one, the time of rendering stands in, as before.
  assert.match(
    renderHtmlReport(makeScanResult([])),
    new RegExp(String(new Date().getUTCFullYear()))
  );
});
