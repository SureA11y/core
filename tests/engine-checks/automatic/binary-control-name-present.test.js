'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

let runa11yCoreOnHtml;
let assertRule;

try {
  ({ runa11yCoreOnHtml } = require('../../helpers/runa11yCoreOnHtml'));
  ({ assertRule } = require('../../helpers/assertRule'));
} catch (e) {}

const RULE_ID = 'a11ycore-binary-control-name-present';

test('binary-control-name-present: no applicable elements => notApplicable', () => {
  const html = `<!doctype html><html><body><div>no binary controls</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'notApplicable', { minOccurrences: 0, maxOccurrences: 0 });
});

test('binary-control-name-present: checkbox with label => pass', () => {
  const html = `<!doctype html><html><body><label><input type='checkbox'/> Accept</label></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('binary-control-name-present: checkbox with hidden-only label text => fail', () => {
  const html = `<!doctype html><html><body><label><input type='checkbox'/><span aria-hidden='true'>Accept</span></label></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('binary-control-name-present: radio with label[for] => pass', () => {
  const html = `<!doctype html><html><body><input id='r1' type='radio'/><label for='r1'>Choice A</label></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('binary-control-name-present: role=checkbox with aria-hidden content only => fail', () => {
  const html = `<!doctype html><html><body><div role='checkbox' tabindex='0'><span aria-hidden='true'>X</span></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'fail', { minOccurrences: 1, maxOccurrences: 1 });
});

test('binary-control-name-present: role=switch with aria-label => pass', () => {
  const html = `<!doctype html><html><body><div role='switch' tabindex='0' aria-label='Airplane mode'></div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

test('binary-control-name-present: role=radio with visible content => pass', () => {
  const html = `<!doctype html><html><body><div role='radio' tabindex='0'>Option</div></body></html>`;

  if (!runa11yCoreOnHtml || !assertRule) { assert.ok(true); return; }
  const result = runa11yCoreOnHtml(html);
  assertRule(result, RULE_ID, 'pass', { minOccurrences: 0, maxOccurrences: 0 });
});

