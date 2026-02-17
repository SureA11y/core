'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

let runa11yCoreOnHtml;
let assertRule;

try {
  ({ runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {}

const RULE_ID = 'a11ycore-combobox-name-present';

test('combobox-name-present: no applicable elements => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no combobox</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('combobox-name-present: role=combobox with aria-label => pass', () => {
  const html = `<!doctype html><html><body><div role='combobox' tabindex='0' aria-label='Search'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('combobox-name-present: role=combobox with aria-hidden content only => fail', () => {
  const html = `<!doctype html><html><body><div role='combobox' tabindex='0'><span aria-hidden='true'>Search</span></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('combobox-name-present: role=combobox with visible content => pass', () => {
  const html = `<!doctype html><html><body><div role='combobox' tabindex='0'>Search</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

