'use strict';

/**
 * Core's messages and the steps of its findings describe the check, not the
 * WCAG criterion it maps to: a report for another standard (RGAA, EN 301 549)
 * shows them too, and the mapping is in each rule's metadata (wcagSc,
 * normativeMappings). A text names WCAG only where WCAG is its point: a WCAG
 * rollup, a criterion WCAG removed, the version an audit applies. A finding's
 * failWhen says which criterion the case fails, as core's verdict, and a
 * standard gives its own (standard.review).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const LOCALES = ['en', 'de', 'es', 'fr', 'ja'];
const read = (...parts) => require(path.join(__dirname, '..', '..', 'src', 'i18n', ...parts));

// Messages about WCAG itself.
const MESSAGES = new Set([
  'catalog.rules.wcag_411_parsing.description',
  'avoidInlineSpacing_lean_caution_noSoftWrap',
  'report_heading_wcagRollup',
  'report_rollup_none',
  'report_rollup_unmapped',
  'engine_lean_why_removedSc',
  'engine_lean_why_errata'
]);
// Steps that ask which WCAG version an audit applies.
const STEPS = new Set([
  'duplicateId_review_DUPLICATE_ID_step4',
  'duplicateId_review_DUPLICATE_ID_pass',
  'duplicateId_review_DUPLICATE_ID_IN_SHADOW_TREE_step4',
  'duplicateId_review_DUPLICATE_ID_IN_SHADOW_TREE_pass'
]);

test('core’s messages name WCAG only where WCAG is their point', () => {
  for (const locale of LOCALES) {
    const named = Object.entries(read(`${locale}.json`))
      .filter(([key, text]) => /WCAG/i.test(text) && !MESSAGES.has(key))
      .map(([key]) => key);
    assert.deepEqual(named, [], locale);
  }
});

test('the steps of a finding describe the check, and leave WCAG to the verdict', () => {
  for (const locale of LOCALES) {
    const named = Object.entries(read('procedures', `${locale}.json`))
      .filter(([key]) => key.includes('_review_') && !key.endsWith('_fail'))
      .filter(([key, text]) => /WCAG/i.test(text) && !STEPS.has(key))
      .map(([key]) => key);
    assert.deepEqual(named, [], locale);
  }
});
