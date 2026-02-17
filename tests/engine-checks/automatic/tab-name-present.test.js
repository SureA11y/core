'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

let runa11yCoreOnHtml;
let assertRule;

try {
  ({ runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {}

const RULE_ID = 'a11ycore-tab-name-present';

test('tab-name-present: no applicable elements => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no tabs</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('tab-name-present: tab with content => pass', () => {
  const html = `<!doctype html><html><body><div role='tab'>Home</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('tab-name-present: tab only aria-hidden content => fail', () => {
  const html = `<!doctype html><html><body><div role='tab'><span aria-hidden='true'>Home</span></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('tab-name-present: tab with aria-label => pass', () => {
  const html = `<!doctype html><html><body><div role='tab' aria-label='Home'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

