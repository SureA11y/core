'use strict';

/**
 * A fail names what failed (#133). A custom rule's fail with no
 * occurrences, a failure of the whole page, was accepted as it was, and
 * every reporter that builds failures from occurrences showed it as a
 * pass: JUnit had no failure, SARIF no result, the baseline no entry. It
 * is now reported on the document element.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { renderJunitReport } = require('../src/junit.js');
const { renderSarifReport } = require('../src/sarif.js');
const { buildBaselineEntries } = require('../src/baseline.js');
const { renderHtmlReport } = require('../src/report.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>Text</p></main></body></html>';

function customRule(id, body, type = 'automatic') {
  return {
    id,
    meta: { title: id, description: id, tags: ['best-practice'], wcagSc: [], type },
    runInPage: `function (ctx) { ${body} }`
  };
}

function scan(rules, engineOptions = {}) {
  return runa11yCoreOnHtml(PAGE, {
    url: 'https://example.test/',
    engineOptions: { ...engineOptions, customRules: rules },
    runOnly: rules.map((r) => r.id)
  });
}

const PAGE_FAIL = customRule(
  'page-fail',
  "return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] };"
);

test('a fail with no occurrences is reported on the document element', () => {
  const check = scan([PAGE_FAIL]).checksResults[0];
  assert.equal(check.outcome, 'fail');
  assert.equal(check.occurrences.length, 1);
  const [o] = check.occurrences;
  assert.equal(o.selector, 'html');
  assert.equal(o.html, '<html lang="en">');
  assert.equal(o.data.details.reasonCode, 'FAIL_WITHOUT_OCCURRENCE');
  assert.equal(o.summary, 'The rule failed for the page without naming an element.');
});

test('a fail whose occurrences are missing or not an array is reported the same way', () => {
  for (const occurrences of ['undefined', 'null', '"none"']) {
    const rule = customRule(
      'page-fail',
      `return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: ${occurrences} };`
    );
    const check = scan([rule]).checksResults[0];
    assert.equal(check.outcome, 'fail', occurrences);
    assert.deepEqual(
      check.occurrences.map((o) => o.data.details.reasonCode),
      ['FAIL_WITHOUT_OCCURRENCE'],
      occurrences
    );
  }
});

test('the message is in the run locale', () => {
  const check = scan([PAGE_FAIL], { locale: 'de' }).checksResults[0];
  assert.equal(
    check.occurrences[0].summary,
    'Die Regel ist für die Seite fehlgeschlagen, ohne ein Element zu nennen.'
  );
});

test('a fail that names its element is left as it is', () => {
  const rule = customRule(
    'named-fail',
    "return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [ctx.helpers.reportOccurrence(ctx.document.querySelector('p'), { summary: 'p' })] };"
  );
  const check = scan([rule]).checksResults[0];
  assert.deepEqual(
    check.occurrences.map((o) => [o.selector, o.summary]),
    [['html > body > main > p', 'p']]
  );
});

test('a manual rule that fails for the page is a cantTell on the document element', () => {
  const rule = customRule(
    'page-review',
    "return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] };",
    'manual'
  );
  const check = scan([rule]).checksResults[0];
  assert.equal(check.outcome, 'cantTell');
  assert.deepEqual(
    check.occurrences.map((o) => o.selector),
    ['html']
  );
});

test('every reporter shows the failure', () => {
  const result = scan([PAGE_FAIL]);
  const junit = renderJunitReport(result);
  assert.match(junit, /<testsuites [^>]*failures="1"/);
  assert.match(junit, /<testcase [^>]*name="page-fail"[^>]*>\s*<failure /);
  const sarif = JSON.parse(renderSarifReport(result));
  assert.deepEqual(
    sarif.runs[0].results.map((r) => [r.ruleId, r.level]),
    [['page-fail', 'error']]
  );
  assert.deepEqual(
    buildBaselineEntries(result).map((e) => [e.ruleId, e.reasonCode, e.html]),
    [['page-fail', 'FAIL_WITHOUT_OCCURRENCE', '<html lang="en">']]
  );
  assert.match(
    renderHtmlReport(result),
    /The rule failed for the page without naming an element\./
  );
});
