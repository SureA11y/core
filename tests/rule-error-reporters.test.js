'use strict';

/**
 * A rule that did not complete, in every reporter (#134). The engine
 * reports a rule that threw as cantTell with no occurrences and its
 * error; JUnit showed an ordinary "needs review" skip with errors="0",
 * SARIF nothing, and the HTML report nothing. The page was not checked
 * against that rule, and each reporter now says so.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { renderJunitReport } = require('../src/junit.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderHtmlReport } = require('../src/report.js');
const { ruleErrorOf } = require('../src/scan-result.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>Text</p></main></body></html>';

function customRule(id, body) {
  return {
    id,
    meta: { title: id, description: id, tags: ['best-practice'], wcagSc: [], type: 'automatic' },
    runInPage: `function (ctx) { ${body} }`
  };
}

function scan(engineOptions = {}) {
  const rules = [
    customRule('boom', "throw new Error('boom');"),
    customRule('async-rule', 'return Promise.resolve(null);'),
    customRule(
      'review',
      "return { ruleId: ctx.rule.ruleId, outcome: 'cantTell', occurrences: [ctx.helpers.reportOccurrence(ctx.document.querySelector('p'), { summary: 'check this' })] };"
    )
  ];
  const { warn } = console;
  console.warn = () => {};
  try {
    return runa11yCoreOnHtml(PAGE, {
      url: 'https://example.test/',
      engineOptions: { ...engineOptions, customRules: rules },
      runOnly: rules.map((r) => r.id)
    });
  } finally {
    console.warn = warn;
  }
}

test('ruleErrorOf: only a cantTell with no occurrences and an error did not complete', () => {
  assert.equal(ruleErrorOf({ outcome: 'cantTell', occurrences: [], error: ' boom ' }), 'boom');
  assert.equal(ruleErrorOf({ outcome: 'cantTell', occurrences: [{}], error: 'a note' }), null);
  assert.equal(ruleErrorOf({ outcome: 'cantTell', occurrences: [] }), null);
  assert.equal(ruleErrorOf({ outcome: 'fail', occurrences: [], error: 'boom' }), null);
  assert.equal(ruleErrorOf({ outcome: 'cantTell', occurrences: [], error: '  ' }), null);
  assert.equal(ruleErrorOf(null), null);
});

test('JUnit: a rule that did not complete is an <error>, counted', () => {
  const xml = renderJunitReport(scan());
  assert.match(xml, /<testsuites [^>]*failures="0" errors="2" skipped="1"/);
  assert.match(xml, /<testsuite name="Other checks" tests="3" failures="0" errors="2" skipped="1"/);
  assert.match(
    xml,
    /<testcase classname="other" name="boom" time="0">\s*<error type="ruleError" message="The rule did not complete: boom">boom<\/error>/
  );
  assert.match(
    xml,
    /name="async-rule"[^>]*>\s*<error type="ruleError" message="The rule did not complete: runInPage returned a Promise/
  );
  // A rule that names what it could not decide is still for review.
  assert.match(xml, /name="review"[^>]*>\s*<skipped message="1 occurrence needs manual review"\/>/);
});

test('SARIF: a rule that did not complete is an error notification, not a result', () => {
  const sarif = JSON.parse(renderSarifReport(scan()));
  const run = sarif.runs[0];
  assert.deepEqual(
    run.results.map((r) => [r.ruleId, r.level]),
    [['review', 'warning']]
  );
  assert.deepEqual(
    run.invocations[0].toolExecutionNotifications
      .filter((n) => n.level === 'error')
      .map((n) => [n.associatedRule.id, n.message.text]),
    [
      ['boom', 'The rule boom did not complete: boom'],
      [
        'async-rule',
        'The rule async-rule did not complete: runInPage returned a Promise; rules run synchronously, so it must return a result object'
      ]
    ]
  );
});

test('HTML report: a rule that did not complete has a card saying so, in the report locale', () => {
  assert.match(renderHtmlReport(scan()), /The rule did not complete: boom/);
  assert.match(renderHtmlReport(scan({ locale: 'es' })), /La regla no se completó: boom/);
});
