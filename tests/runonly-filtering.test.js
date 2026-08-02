'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

/**
 * These checks lock down runOnly behavior for both:
 * - legacy shape: { type:'tag', values:[...] }
 * - modern shape: { tags/includeRuleIds/excludeRuleIds }
 *
 * They assume your helper accepts an options object:
 *   runa11yCoreOnHtml(html, { runOnly, engineOptions, contextSelector, excludeSelectors })
 */

test('runOnly: legacy tag filter includes only matching-tag checks', () => {
  const html = `<!doctype html><html><body><img src="x.png"></body></html>`;

  // img-alt-attr-present is tagged wcag2a
  const result = runa11yCoreOnHtml(html, { runOnly: { type: 'tag', values: ['wcag2a'] } });

  assertRule(result, 'img-alt-present', 'fail', { minOccurrences: 1 });

  // best-practice rule should not run when filtering to wcag2a
  const noopener = result.checksResults.find((r) => r.ruleId === 'links-target-blank-noopener');
  assert.ok(!noopener, 'best-practice rule should not be present when filtering to wcag2a');
});

test('runOnly: modern tags filter includes only matching-tag checks', () => {
  const html = `<!doctype html><html><body><img src="x.png"></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: { tags: ['wcag2a'] } });

  assertRule(result, 'img-alt-present', 'fail', { minOccurrences: 1 });

  const noopener = result.checksResults.find((r) => r.ruleId === 'links-target-blank-noopener');
  assert.ok(!noopener, 'best-practice rule should not be present when filtering to wcag2a');
});

test('runOnly: includeRuleIds allows selecting a single rule', () => {
  // Use a clearly normative automatic rule here to avoid coupling filtering behavior
  // to advisory / best-practice semantics.
  const html = `<!doctype html><html><body><input type="text"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: { includeRuleIds: ['form-control-programmatic-label-present'] }
  });

  // Only the included rule should run
  assertRule(result, 'form-control-programmatic-label-present', 'fail', { minOccurrences: 1 });

  const anyOther = result.checksResults.find(
    (r) => r.ruleId !== 'form-control-programmatic-label-present'
  );
  assert.ok(!anyOther, 'no other checks should be present when includeRuleIds is set');
});

test('runOnly: excludeRuleIds blocks a rule even if tags match', () => {
  const html = `<!doctype html><html><body><img src="x.png"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: {
      tags: ['wcag2a'],
      excludeRuleIds: ['img-alt-present']
    }
  });

  const blocked = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.ok(!blocked, 'excluded rule should not be present');
});

test('runOnly: include/exclude accept ids with and without ENGINE_TAG prefix', () => {
  const html = `<!doctype html><html><body><input type="text"></body></html>`;

  // Your engine supports matching with/without the '' prefix.
  const result = runa11yCoreOnHtml(html, {
    runOnly: { includeRuleIds: ['form-control-programmatic-label-present'] }
  });

  assertRule(result, 'form-control-programmatic-label-present', 'fail', { minOccurrences: 1 });
});
