'use strict';

/**
 * @check page-has-heading-one
 * @atomic true
 * @summary The page should have at least one level-one heading
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Always applicable to any HTML document with a <body> element —
 *   "does the page have an h1" is a whole-page concern, matching
 *   bypass-blocks-present's pattern of evaluating the document
 *   directly.
 * @expectation
 *   At least one heading with level 1 exists (native <h1>, or
 *   role="heading" with aria-level="1"). A page with no top-level
 *   heading has no clear entry point for assistive technology users
 *   navigating by heading.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Filters candidates through `isAccTreeEligible` (hidden/aria-hidden/
 *   display:none/inert elements don't count as "the page has a heading
 *   one"), matching `landmark-one-main`'s own precedent. Found via a real
 *   page (CDC's flu page, 2026-07-30): its only `<h1>` sits inside a
 *   `display:none` ancestor — genuinely unreachable by sighted and screen
 *   reader users alike — and a raw `document.querySelectorAll` credited it
 *   anyway, reporting `notApplicable` where the reference engine correctly fails. This
 *   does NOT regress purely-visually-clipped-but-AT-exposed headings (e.g.
 *   eBay's homepage `<h1>` hidden via clip-path/off-screen positioning,
 *   `visibility:visible`, no `aria-hidden`) — `isAccTreeEligible` only
 *   excludes elements actually removed from the accessibility tree, not
 *   ones merely clipped from the visual viewport.
 */

const id = 'page-has-heading-one';

const meta = {
  title: 'Page should have a level-one heading',
  description: 'Checks that the page has at least one level-one heading (<h1> or role="heading" with aria-level="1").',
  i18n: {
    titleKey: 'pageHasHeadingOne_title',
    descriptionKey: 'pageHasHeadingOne_description'
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

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  function isExposedToAt(el) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  // queryAllSmart (shadow-DOM-aware) instead of plain document.querySelectorAll -- see
  // landmark-one-main-manual.js's identical precedent.
  let nodes = [];
  try {
    nodes = helpers && typeof helpers.queryAllSmart === 'function'
      ? helpers.queryAllSmart('h1, [role]')
      : document.querySelectorAll('h1, [role]');
  } catch {
    nodes = [];
  }

  const hasH1 = Array.from(nodes).some((el) => el && isLevelOneHeading(el) && isExposedToAt(el));

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
        summaryKey: 'pageHasHeadingOne_summary_cantTell',
        hintKey: 'pageHasHeadingOne_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'HEADING_ONE_MISSING' }
      }
    }]
  };
}

module.exports = { id, meta, runInPage, applicability };
