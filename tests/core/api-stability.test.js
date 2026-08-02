'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { runa11yCoreOnHtml } = require('../helpers/runDomRulesOnHtml.js');
const { normalizeRuleMeta } = require('../../src/core/rule-meta.js');

// docs/API_STABILITY.md: a live regression guard for the fields that
// document lists as stable/semver-covered -- an accidental removal here
// fails a test, not just an unenforced doc.
test('stable result fields are present with the documented types on a real scan', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>';
  const result = runa11yCoreOnHtml(html, { runOnly: ['img-alt-present'] });

  assert.equal(typeof result.engine.tag, 'string');
  assert.equal(typeof result.engine.schemaVersion, 'string');
  assert.ok(Array.isArray(result.checksResults));
  assert.ok(Array.isArray(result.rulesResults));

  const rule = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.ok(rule);
  assert.equal(typeof rule.ruleId, 'string');
  assert.equal(typeof rule.outcome, 'string');
  assert.equal(typeof rule.outcomeNormalized, 'string');
  assert.equal(typeof rule.severity, 'string');
  assert.equal(typeof rule.confidence, 'string');
  assert.equal(typeof rule.type, 'string');
  assert.equal(typeof rule.title, 'string');
  assert.equal(typeof rule.description, 'string');
  assert.ok(rule.meta && typeof rule.meta === 'object');
  assert.ok(Array.isArray(rule.meta.normativeMappings));
  assert.equal(typeof rule.meta.deprecated, 'boolean');
  assert.equal(typeof rule.schemaVersion, 'string');

  const occ = rule.occurrences[0];
  assert.ok(occ);
  assert.equal(typeof occ.selector, 'string');
  assert.equal(typeof occ.html, 'string');
  assert.equal(typeof occ.summary, 'string');
  assert.equal(typeof occ.hint, 'string');
  assert.ok(occ.i18n === null || typeof occ.i18n === 'object');
  assert.ok(Array.isArray(occ.structuralPath) || occ.structuralPath === null);
});

test('unstable fields are absent by default (perfStats/ruleTimings, opt-in debug-only)', () => {
  const html = '<!doctype html><html lang="en"><head><title>T</title></head><body></body></html>';
  const result = runa11yCoreOnHtml(html, { runOnly: ['page-title-present'] });

  assert.equal(result.perfStats, undefined);
  assert.equal(result.ruleTimings, undefined);
});

// --- Rule-ID deprecation mechanism (docs/API_STABILITY.md) ---
// No shipped rule is deprecated yet, so this exercises the mechanism via a
// synthetic rule registered through engineOptions.customRules, matching the
// convention in tests/core/custom-rules.test.js.

test('normalizeRuleMeta: deprecated:true without deprecation.reason/sinceVersion throws', () => {
  assert.throws(
    () => normalizeRuleMeta('my-rule', 'my-rule', { title: 'x', deprecated: true }, 'a11ycore'),
    /meta\.deprecated:true requires meta\.deprecation\.reason and meta\.deprecation\.sinceVersion/
  );
  assert.throws(
    () =>
      normalizeRuleMeta(
        'my-rule',
        'my-rule',
        { title: 'x', deprecated: true, deprecation: { reason: 'x' } },
        'a11ycore'
      ),
    /requires meta\.deprecation\.reason and meta\.deprecation\.sinceVersion/
  );
});

test('normalizeRuleMeta: deprecated:true with a complete deprecation object normalizes correctly', () => {
  const normalized = normalizeRuleMeta(
    'my-rule',
    'my-rule',
    {
      title: 'x',
      deprecated: true,
      deprecation: { replacedBy: 'new-rule', reason: 'Superseded.', sinceVersion: '1.2.0' }
    },
    'a11ycore'
  );

  assert.equal(normalized.deprecated, true);
  assert.deepStrictEqual(normalized.deprecation, {
    replacedBy: 'new-rule',
    reason: 'Superseded.',
    sinceVersion: '1.2.0'
  });
});

test('normalizeRuleMeta: not deprecated by default, deprecation is null', () => {
  const normalized = normalizeRuleMeta('my-rule', 'my-rule', { title: 'x' }, 'a11ycore');
  assert.equal(normalized.deprecated, false);
  assert.equal(normalized.deprecation, null);
});

test('a deprecated custom rule still runs and produces a normal result -- deprecation is informational, not an automatic exclusion', () => {
  const html = '<!doctype html><html><body><div id="target"></div></body></html>';

  const result = runa11yCoreOnHtml(html, {
    engineOptions: {
      customRules: [
        {
          id: 'my-deprecated-rule',
          meta: {
            title: 'My deprecated rule',
            deprecated: true,
            deprecation: {
              replacedBy: 'my-new-rule',
              reason: 'Superseded by my-new-rule.',
              sinceVersion: '1.2.0'
            }
          },
          runInPage(ctx) {
            const el = ctx.document.getElementById('target');
            return el
              ? { outcome: 'fail', occurrences: [{ __node: el }] }
              : { outcome: 'notApplicable', occurrences: [] };
          }
        }
      ]
    }
  });

  const rule = result.checksResults.find((r) => r.ruleId === 'my-deprecated-rule');
  assert.ok(rule, 'deprecated rule still appears in checksResults and still ran');
  assert.equal(rule.outcome, 'fail');
  assert.equal(rule.meta.deprecated, true);
  assert.deepStrictEqual(rule.meta.deprecation, {
    replacedBy: 'my-new-rule',
    reason: 'Superseded by my-new-rule.',
    sinceVersion: '1.2.0'
  });
});
