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
