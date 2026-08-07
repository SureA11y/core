/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check manual-review
 * Manual review for keyboard navigation and focus order.
 */

const id = 'manual-review';

const meta = {
  ruleId: 'manual-review',
  title: 'Manual review: keyboard navigation and focus order',
  description: 'Flags that a manual review of keyboard navigation and focus order is required.',
  i18n: { titleKey: 'manualReview_title', descriptionKey: 'manualReview_description' },

  helpUrl: null,
  tags: ['wcag2a', 'wcag2aa', 'wcag211', 'wcag243', 'wcag247', 'nontext', 'atomic', 'manual'],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.1.1',
      title: 'Keyboard',
      conformanceLevel: 'A',
      url: 'https://www.w3.org/TR/WCAG22/#keyboard'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.3',
      title: 'Focus Order',
      conformanceLevel: 'A',
      url: 'https://www.w3.org/TR/WCAG22/#focus-order'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.7',
      title: 'Focus Visible',
      conformanceLevel: 'AA',
      url: 'https://www.w3.org/TR/WCAG22/#focus-visible'
    },

    { standard: 'EN 301 549', version: 'V3.2.1', requirement: '9.2.1.1', title: 'Keyboard' },
    { standard: 'EN 301 549', version: 'V3.2.1', requirement: '9.2.4.3', title: 'Focus Order' },
    { standard: 'EN 301 549', version: 'V3.2.1', requirement: '9.2.4.7', title: 'Focus Visible' },

    {
      standard: 'WCAG',
      version: '2.2',
      type: 'Understanding',
      requirement: '2.1.1',
      title: 'Understanding Keyboard',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      type: 'Understanding',
      requirement: '2.4.3',
      title: 'Understanding Focus Order',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      type: 'Understanding',
      requirement: '2.4.7',
      title: 'Understanding Focus Visible',
      url: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html'
    }
  ]
};

/**
 * NOTE (engine constraint):
 * runInPage() is serialized and executed from source (fnSource) by a11yCore-core,
 * so it must NOT reference outer-scope variables like `meta` or `id`.
 * Only use `ctx.*`, locals, and DOM APIs.
 */
function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;

  const getOuterHtmlSnippet =
    helpers && helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet
      : (el) => (el && el.outerHTML) || '';

  const contextSelector = ctx.contextSelector || null;

  let rootEl = root || null;

  if (!rootEl) {
    if (contextSelector) {
      try {
        rootEl = document.querySelector(contextSelector);
      } catch {
        // invalid selector, fallback to full document
        rootEl = null;
      }
    }
    if (!rootEl) {
      rootEl = document.documentElement || document.body || document.querySelector('html');
    }
  }

  const fallbackRoot =
    rootEl || document.documentElement || document.body || document.querySelector('html');

  const html = getOuterHtmlSnippet(fallbackRoot);

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences: [
      {
        selector: contextSelector || 'html',
        html,
        summary: 'Manual review required for keyboard navigation and focus order.',
        i18n: {
          summaryKey: 'manualReview_summary_cantTell',
          hintKey: 'manualReview_hint_cantTell',
          params: {}
        }
      }
    ]
  };
}

module.exports = {
  id,
  meta,
  runInPage
};
