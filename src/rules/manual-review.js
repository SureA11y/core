'use strict';

/**
 * Rule: manual-review
 * Manual review for keyboard navigation and focus order.
 */

const id = 'manual-review';

const meta = {
  ruleId: 'manual-review',
  title: 'Manual review: keyboard navigation and focus order',
  description: 'Flags that a manual review of keyboard navigation and focus order is required.',
  helpUrl: null,
  tags: ['manual'],
  wcagSc: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',              // this rule exists only to flag manual checks
  defaultConfidence: 'medium'  // manual by design, not automatic confidence
};

/**
 * NOTE (engine constraint):
 * runInPage() is serialized and executed from source (fnSource) by a11yCore-core,
 * so it must NOT reference outer-scope variables like `meta` or `id`.
 * Only use `ctx.*`, locals, and DOM APIs.
 */
function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;

  const getOuterHtmlSnippet = helpers && helpers.getOuterHtmlSnippet
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
      rootEl ||
      document.documentElement ||
      document.body ||
      document.querySelector('html');

  const html = getOuterHtmlSnippet(fallbackRoot);

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: 'moderate',
    occurrences: [
      {
        selector: contextSelector || 'html',
        html,
        summary: 'Manual review required for keyboard navigation and focus order.'
      }
    ]
  };
}

module.exports = {
  id,
  meta,
  runInPage
};
