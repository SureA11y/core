'use strict';

/**
 * @check a11ycore-page-has-heading-one
 * @atomic true
 * @summary The page should have at least one level-one heading
 * @standard the reference engine "Best Practices" (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Always applicable to any HTML document with a <body> element —
 *   "does the page have an h1" is a whole-page concern, matching
 *   a11ycore-bypass-blocks-present's pattern of evaluating the document
 *   directly.
 * @expectation
 *   At least one heading with level 1 exists (native <h1>, or
 *   role="heading" with aria-level="1"). A page with no top-level
 *   heading has no clear entry point for assistive technology users
 *   navigating by heading.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see a11ycore-landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 */

const id = 'a11ycore-page-has-heading-one';

const meta = {
  title: 'Page should have a level-one heading',
  description: 'Checks that the page has at least one level-one heading (<h1> or role="heading" with aria-level="1").',
  i18n: {
    titleKey: 'a11ycore_pageHasHeadingOne_title',
    descriptionKey: 'a11ycore_pageHasHeadingOne_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'headings', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const body = document && document.body ? document.body : null;
  if (!body) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  function normalizeWs(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function getExplicitRoleToken(el) {
    const raw = normalizeWs(el.getAttribute && el.getAttribute('role'));
    if (!raw) return '';
    return raw.split(/\s+/)[0].toLowerCase();
  }

  function isLevelOneHeading(el) {
    const explicit = getExplicitRoleToken(el);
    if (explicit) {
      if (explicit !== 'heading') return false;
      const raw = normalizeWs(el.getAttribute && el.getAttribute('aria-level'));
      return raw === '1';
    }
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    return tag === 'h1';
  }

  let nodes = [];
  try {
    nodes = document.querySelectorAll('h1, [role]');
  } catch {
    nodes = [];
  }

  const hasH1 = Array.from(nodes).some((el) => el && isLevelOneHeading(el));

  if (hasH1) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const stableSelector = helpers.buildSelector ? helpers.buildSelector(body) : 'body';
  const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(body) : (body.outerHTML || '').slice(0, 200);

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences: [{
      selector: stableSelector,
      html,
      summary: 'This page has no level-one heading.',
      hint: 'Add a level-one heading (<h1> or role="heading" aria-level="1") that identifies the page\'s main content.',
      i18n: {
        summaryKey: 'a11ycore_pageHasHeadingOne_summary_cantTell',
        hintKey: 'a11ycore_pageHasHeadingOne_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'HEADING_ONE_MISSING' }
      }
    }]
  };
}

module.exports = { id, meta, runInPage };
