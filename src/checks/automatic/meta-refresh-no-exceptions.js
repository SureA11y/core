/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check meta-refresh-no-exceptions
 * @atomic true
 * @summary At the AAA level, a meta refresh must not be used at all
 * @standard WCAG 2.2
 * @sc 2.2.4, 3.2.5
 * @applicability
 *   Applies to any <meta http-equiv="refresh"> element with a non-empty
 *   content attribute.
 * @expectation
 *   No meta refresh is present, regardless of delay. This is the
 *   stricter AAA-level counterpart of meta-refresh-timing-absent
 *   (the A-level rule, which only forbids a positive delay and allows
 *   delay="0" as an immediate redirect). At AAA, WCAG 2.2.4
 *   (Interruptions) and 3.2.5 (Change on Request) require that automatic
 *   context changes — including an immediate meta-refresh redirect —
 *   happen only at the user's request, with no exception for a zero
 *   delay.
 * @implementation-notes
 * - Distinct, atomic decision from meta-refresh-timing-absent:
 *   that rule's delay="0" pass case is this rule's fail case.
 * - A <meta> nested inside <noscript> is excluded: it only ever takes
 *   effect when scripting is disabled, which is never the case for any
 *   context capable of running accessibility tooling in the first place
 *   (e.g. a <noscript><meta http-equiv="refresh" content="0; URL=/?nojs=1">
 *   </noscript> JS-disabled fallback).
 */

const id = 'meta-refresh-no-exceptions';

const meta = {
  title: 'Page must not use a meta refresh at all (AAA)',
  description:
    'Checks that <meta http-equiv="refresh"> is not present at all, regardless of delay — the stricter AAA-level counterpart of the A-level positive-delay-only check.',
  i18n: {
    titleKey: 'metaRefreshNoExceptions_title',
    descriptionKey: 'metaRefreshNoExceptions_description'
  },
  helpUrl: null,
  tags: ['wcag2aaa', 'wcag224', 'wcag325', 'structure', 'atomic', 'automatic'],
  wcagSc: ['2.2.4', '3.2.5'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.2.4',
      title: 'Interruptions',
      conformanceLevel: 'AAA'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '3.2.5',
      title: 'Change on Request',
      conformanceLevel: 'AAA'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '2.2.4': ['meta-refresh-no-exceptions'],
      '3.2.5': ['meta-refresh-no-exceptions']
    }
  }
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const nodes = document.querySelectorAll
    ? document.querySelectorAll('meta[http-equiv="refresh" i]')
    : [];

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (el.closest && el.closest('noscript')) continue; // never applies with scripting enabled
    const raw = String(el.getAttribute('content') || '').trim();
    if (!raw) continue;

    applicableCount += 1;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary:
        'This page uses a meta refresh, which is an automatic context change not initiated by the user.',
      hint: 'Remove the meta refresh; trigger the redirect/refresh only in response to a user action instead.',
      i18n: {
        summaryKey: 'metaRefreshNoExceptions_summary_fail',
        hintKey: 'metaRefreshNoExceptions_hint_fail',
        params: {}
      },
      data: {
        details: { reasonCode: 'META_REFRESH_PRESENT' }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
