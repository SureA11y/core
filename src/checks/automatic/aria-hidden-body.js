/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-hidden-body
 * @atomic true
 * @summary The document <body> must not have aria-hidden="true"
 * @standard WCAG 2.2
 * @sc 1.3.1, 4.1.2
 * @applicability
 *   Always applicable to any HTML document with a <body> element,
 *   independent of contextSelector/root scoping — this is a whole-
 *   document concern, matching page-title-present's pattern of
 *   evaluating document.body directly rather than the scoped root.
 * @expectation
 *   <body> does not have aria-hidden="true". Hiding the document body
 *   removes the entire page's content and structure from the
 *   accessibility tree at once — both 1.3.1 (Info and Relationships: the
 *   page's structure becomes entirely non-determinable) and 4.1.2 (Name,
 *   Role, Value: nothing in the document exposes a role/name/value any
 *   longer) apply.
 */

const id = 'aria-hidden-body';

const meta = {
  title: 'The document <body> must not be aria-hidden',
  description:
    'Checks that <body> does not have aria-hidden="true", which would remove the entire page from the accessibility tree.',
  i18n: {
    titleKey: 'ariaHiddenBody_title',
    descriptionKey: 'ariaHiddenBody_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'wcag412', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.3.1', '4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'critical',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.3.1': ['aria-hidden-body-absent'],
      '4.1.2': ['aria-hidden-body-absent']
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

  const body = document && document.body ? document.body : null;
  if (!body) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const raw = body.getAttribute ? body.getAttribute('aria-hidden') : null;
  const isHidden = raw != null && String(raw).trim().toLowerCase() === 'true';

  if (!isHidden) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const stableSelector = helpers.buildSelector ? helpers.buildSelector(body) : 'body';
  const html = helpers.getOuterHtmlSnippet
    ? helpers.getOuterHtmlSnippet(body)
    : (body.outerHTML || '').slice(0, 200);

  const occurrences = [
    {
      selector: stableSelector,
      html,
      summary:
        'The document body has aria-hidden="true", which hides the entire page from assistive technologies.',
      hint: 'Remove aria-hidden from <body>. Hide specific elements instead, if that was the intent.',
      i18n: {
        summaryKey: 'ariaHiddenBody_summary_fail',
        hintKey: 'ariaHiddenBody_hint_fail',
        params: {}
      },
      data: {
        details: { reasonCode: 'ARIA_HIDDEN_BODY' }
      }
    }
  ];

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'critical',
    occurrences
  };
}

module.exports = { id, meta, runInPage, applicability };
