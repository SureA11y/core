'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { assertRule } = require('../../helpers/assertRule.js');
const { runa11yCoreOnHtml } = require('../../helpers/runDomRulesOnHtml.js');
const { getChecksCatalog } = require('../../../src/index.js');

// Deprecated since 1.8.0: the rule stays in the catalog but decides nothing.
// The check it used to make lives in identical-iframes-same-purpose.
const RULE_ID = 'iframe-title-unique';
const SUCCESSOR = 'identical-iframes-same-purpose';

const BASE = 'https://example.test/';

function run(body, runOnly = [RULE_ID]) {
  const html = `<!doctype html><html lang="en"><head><title>t</title></head><body>${body}</body></html>`;
  return runa11yCoreOnHtml(html, { runOnly, url: BASE });
}

test(`${RULE_ID}: is in the catalog, deprecated in favour of ${SUCCESSOR}`, () => {
  const catalog = getChecksCatalog();
  const entry = catalog.find((r) => r.ruleId === RULE_ID);
  assert.ok(entry, 'the rule id stays published until the file is removed in 2.0.0');
  assert.strictEqual(entry.deprecated, true);
  assert.strictEqual(entry.deprecation.replacedBy, SUCCESSOR);
  assert.strictEqual(entry.deprecation.sinceVersion, '1.8.0');
  assert.ok(entry.deprecation.reason, 'the catalog says why');
  assert.ok(
    catalog.some((r) => r.ruleId === SUCCESSOR && !r.deprecated),
    'the successor is a live rule'
  );
});

test(`${RULE_ID}: notApplicable on a page with no frames`, () => {
  const result = run('<p>none</p>');
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

// The case the rule used to fail: WCAG 4.1.2 asks that a name be exposed, not unique.
test(`${RULE_ID}: notApplicable, not fail, when two frames share a title and embed different resources`, () => {
  const result = run(
    '<iframe id="a" title="Widget" src="/one.html"></iframe><iframe id="b" title="Widget" src="/two.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: notApplicable when two frames share a title and a resource`, () => {
  const result = run(
    '<iframe title="List of Contributors" src="/page-one.html"></iframe><iframe title="List of Contributors" src="/page-one.html"></iframe>'
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test(`${RULE_ID}: the successor decides the case this rule used to fail`, () => {
  const result = run(
    '<iframe id="a" title="Widget" src="/one.html"></iframe><iframe id="b" title="Widget" src="/two.html"></iframe>',
    [RULE_ID, SUCCESSOR]
  );
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
  assertRule(result, SUCCESSOR, 'cantTell', { minOccurrences: 2, maxOccurrences: 2 });
});

test(`${RULE_ID}: i18n default is English`, () => {
  const result = run('<iframe title="Widget" src="/one.html"></iframe>');
  const rule = assertRule(result, RULE_ID, 'notApplicable', {
    minOccurrences: 0,
    maxOccurrences: 0
  });
  assert.strictEqual(rule.title, 'Frame titles must be unique (deprecated)');
});
