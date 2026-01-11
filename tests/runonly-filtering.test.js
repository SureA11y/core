'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

/**
 * These tests lock down runOnly behavior for both:
 * - legacy shape: { type:'tag', values:[...] }
 * - modern shape: { tags/includeRuleIds/excludeRuleIds }
 *
 * They assume your helper accepts an options object:
 *   runa11yCoreOnHtml(html, { runOnly, engineOptions, contextSelector, excludeSelectors })
 */

test('runOnly: legacy tag filter includes only matching-tag rules', () => {
  const html = `<!doctype html><html><body><img src="x.png"></body></html>`;

  // img-alt-attr-present is tagged wcag2a
  const result = runa11yCoreOnHtml(html, { runOnly: { type: 'tag', values: ['wcag2a'] } });

  assertRule(result, 'a11yCore-img-alt-attr-present', 'fail', { minOccurrences: 1 });

  // best-practice rule should not run when filtering to wcag2a
  const noopener = result.rules.find((r) => r.ruleId === 'a11yCore-links-target-blank-noopener');
  assert.ok(!noopener, 'best-practice rule should not be present when filtering to wcag2a');
});

test('runOnly: modern tags filter includes only matching-tag rules', () => {
  const html = `<!doctype html><html><body><img src="x.png"></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: { tags: ['wcag2a'] } });

  assertRule(result, 'a11yCore-img-alt-attr-present', 'fail', { minOccurrences: 1 });

  const noopener = result.rules.find((r) => r.ruleId === 'a11yCore-links-target-blank-noopener');
  assert.ok(!noopener, 'best-practice rule should not be present when filtering to wcag2a');
});

test('runOnly: includeRuleIds allows selecting a single rule', () => {
  const html = `<!doctype html><html><body><a target="_blank" href="https://x.test/">X</a></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: { includeRuleIds: ['a11yCore-links-target-blank-noopener'] }
  });

  // Only the included rule should run
  assertRule(result, 'a11yCore-links-target-blank-noopener', 'fail', { minOccurrences: 1 });

  const anyOther = result.rules.find((r) => r.ruleId !== 'a11yCore-links-target-blank-noopener');
  assert.ok(!anyOther, 'no other rules should be present when includeRuleIds is set');
});

test('runOnly: excludeRuleIds blocks a rule even if tags match', () => {
  const html = `<!doctype html><html><body><img src="x.png"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: {
      tags: ['wcag2a'],
      excludeRuleIds: ['a11yCore-img-alt-attr-present']
    }
  });

  const blocked = result.rules.find((r) => r.ruleId === 'a11yCore-img-alt-attr-present');
  assert.ok(!blocked, 'excluded rule should not be present');
});

test('runOnly: include/exclude accept ids with and without ENGINE_TAG prefix', () => {
  const html = `<!doctype html><html><body><a target="_blank" href="https://x.test/">X</a></body></html>`;

  // Your engine supports matching with/without the 'a11yCore-' prefix.
  const result = runa11yCoreOnHtml(html, {
    runOnly: { includeRuleIds: ['links-target-blank-noopener'] }
  });

  assertRule(result, 'a11yCore-links-target-blank-noopener', 'fail', { minOccurrences: 1 });
});
