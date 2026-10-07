'use strict';

/**
 * A rule's helpUrl and tags in the outputs (#142). Neither reached a scan
 * result, so no reporter showed a custom rule's help link or its tags.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { renderJunitReport } = require('../src/junit.js');
const { renderSarifReport } = require('../src/sarif.js');
const { renderHtmlReport } = require('../src/report.js');
const { helpUrlOf } = require('../src/scan-result.js');

const failing = (id, helpUrl, tags) => ({
  id,
  meta: { title: id, description: id, helpUrl, tags, wcagSc: [], type: 'automatic' },
  runInPage:
    "function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] }; }"
});

function scan() {
  return runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>',
    {
      url: 'https://example.test/',
      engineOptions: {
        customRules: [
          failing('acme-rule', 'https://example.test/rules/acme', [
            'best-practice',
            'acme-design-system'
          ]),
          failing('unsafe-link', 'javascript:alert(1)', ['best-practice'])
        ]
      },
      runOnly: ['acme-rule', 'unsafe-link', 'img-alt-present']
    }
  );
}

test('a check result carries the rule helpUrl and tags', () => {
  const byId = Object.fromEntries(scan().checksResults.map((c) => [c.ruleId, c.meta]));
  assert.equal(byId['acme-rule'].helpUrl, 'https://example.test/rules/acme');
  assert.deepEqual(byId['acme-rule'].tags, ['best-practice', 'acme-design-system', 'a11ycore']);
  assert.equal(typeof byId['img-alt-present'].helpUrl, 'string');
  assert.ok(byId['img-alt-present'].tags.includes('wcag2a'));
});

test('helpUrlOf links only absolute http(s) URLs', () => {
  const of = (helpUrl) => helpUrlOf({ meta: { helpUrl } });
  assert.equal(of(' https://a.test/x '), 'https://a.test/x');
  assert.equal(of('http://a.test/'), 'http://a.test/');
  for (const bad of [
    'javascript:alert(1)',
    '/rules/x',
    'rules/x',
    'data:text/html,x',
    '',
    'https://a.test/x y'
  ]) {
    assert.equal(of(bad), null, bad);
  }
  assert.equal(helpUrlOf({}), null);
});

test('SARIF: helpUri and the rule tags, without bookkeeping and criterion tags', () => {
  const rules = Object.fromEntries(
    JSON.parse(renderSarifReport(scan())).runs[0].tool.driver.rules.map((r) => [r.id, r])
  );
  assert.equal(rules['acme-rule'].helpUri, 'https://example.test/rules/acme');
  assert.deepEqual(rules['acme-rule'].properties.tags, [
    'accessibility',
    'automatic',
    'best-practice',
    'acme-design-system'
  ]);
  assert.equal('helpUri' in rules['unsafe-link'], false);
  const builtin = rules['img-alt-present'].properties.tags;
  assert.ok(builtin.includes('wcag-1.1.1') && builtin.includes('wcag2a'));
  assert.ok(
    !builtin.includes('a11ycore') && !builtin.includes('atomic') && !builtin.includes('wcag111')
  );
});

test('JUnit: a help line in the failure', () => {
  const xml = renderJunitReport(scan());
  assert.match(xml, /help: https:\/\/example\.test\/rules\/acme<\/failure>/);
  assert.doesNotMatch(xml, /help: javascript/);
});

test('HTML report: a link naming the rule, never for another scheme', () => {
  const html = renderHtmlReport(scan());
  assert.match(
    html,
    /<p class="card-help"><a href="https:\/\/example\.test\/rules\/acme">How to fix acme-rule<\/a><\/p>/
  );
  assert.doesNotMatch(html, /href="javascript:/);
});
