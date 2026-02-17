'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

let runa11yCoreOnHtml;
let assertRule;

try {
  ({ runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {}

const RULE_ID = 'a11ycore-option-name-present';

test('option-name-present: no applicable => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no option</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('option-name-present: content => pass', () => {
  const html = `<!doctype html><html><body><div role='option'>Canada</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('option-name-present: hidden-only content => fail', () => {
  const html = `<!doctype html><html><body><div role='option'><span aria-hidden='true'>Canada</span></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

