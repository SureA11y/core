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
