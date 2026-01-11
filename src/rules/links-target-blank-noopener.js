'use strict';

/**
 * Example third party custom rule: links-target-blank-noopener
 *
 * Checks that links that open in a new tab/window use rel="noopener" or rel="noreferrer".
 */

const id = 'links-target-blank-noopener';

const meta = {
  title: 'Links that open in a new tab should use rel="noopener"',
  description: 'Ensures links with target="_blank" mitigate reverse tabnabbing risks.',
  helpUrl: null,
  tags: ['best-practice', 'links'],
  wcagSc: [],
  defaultSeverity: 'minor',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'medium'  // good, but slightly more heuristic
};

/**
 * NOTE (engine constraint):
 * runInPage() is serialized and executed from source (fnSource) by a11yCore-core,
 * so it must NOT reference outer-scope variables like `meta` or `id`.
 * Only use `ctx.*`, locals, and DOM APIs.
 */
function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;

  const queryAll = helpers && helpers.queryAll ? helpers.queryAll : (sel) => {
    try {
      return Array.from((root || document).querySelectorAll(sel));
    } catch {
      return [];
    }
  };
  const getOuterHtmlSnippet = helpers && helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet
      : (el) => (el && el.outerHTML) || '';
  const buildSimpleSelector = helpers && helpers.buildSimpleSelector
      ? helpers.buildSimpleSelector
      : ((el) => {
        if (!el || typeof el !== 'object') return 'html';
        const tag = el.tagName ? el.tagName.toLowerCase() : 'html';
        return tag;
      });

  const links = queryAll('a[target="_blank"]');

  if (!links.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'minor',   // ✅ use rule
      occurrences: []
    };
  }

  const failing = [];

  for (const a of links) {
    const rel = (a.getAttribute && a.getAttribute('rel')) || '';
    const relParts = rel.split(/\s+/).filter(Boolean).map((s) => s.toLowerCase());
    const hasNoopener = relParts.includes('noopener') || relParts.includes('noreferrer');

    if (!hasNoopener) {
      failing.push({
        selector: buildSimpleSelector(a, 'a'),
        html: getOuterHtmlSnippet(a),
        summary: 'Link opens in a new tab but does not use rel="noopener" or rel="noreferrer".'
      });
    }
  }

  if (!failing.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'pass',
      severity: rule.defaultSeverity || 'minor',   // ✅ use rule
      occurrences: []
    };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'minor',     // ✅ use rule
    occurrences: failing
  };
}

module.exports = {
  id,
  meta,
  runInPage
};
