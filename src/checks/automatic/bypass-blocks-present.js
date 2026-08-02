'use strict';

/**
 * @check bypass-blocks-present
 * @atomic true
 * @summary The page must provide at least one mechanism to bypass repeated blocks of content
 * @standard WCAG 2.2
 * @sc 2.4.1
 * @applicability
 *   Always applicable to any HTML document with a <body> element —
 *   "bypass blocks" is a whole-page concern, matching
 *   aria-hidden-body / page-title-present's pattern of
 *   evaluating the document directly rather than a scoped root.
 * @expectation
 *   At least one of the following recognized WCAG 2.4.1 techniques is
 *   present:
 *   (a) a main landmark (<main> or [role="main"]) — technique ARIA11: a
 *       screen reader user can jump straight to it, bypassing everything
 *       before it (nav, header, repeated blocks) in one step;
 *   (b) a working same-page anchor link — technique G1/G123: an
 *       <a href="#id"> (or legacy <a name="id">) whose target resolves to
 *       a real element anywhere in the document. Deliberately NOT
 *       required to be positioned before a <nav> or be keyboard-focus-
 *       order-first — see implementation notes;
 *   (c) at least one heading (<h1>-<h6> or [role="heading"]) — technique
 *       H69: heading navigation is itself a standards-recognized bypass
 *       mechanism (e.g. a screen reader's "jump by heading" command).
 * @implementation-notes
 * - This rule intentionally checks presence, not position, for the
 *   same-page-anchor condition (b): a widely-used reference engine's real bypass algorithm is
 *   heuristic (see ROADMAP.md's Tier 1a note on why this rule was
 *   deferred from the rest of that batch), and getting DOM-order /
 *   keyboard-focus-order positioning exactly right without introducing
 *   false positives is materially harder than the rest of Tier 1a. Being
 *   lenient about condition (b) can only produce a false NEGATIVE (missing
 *   a page whose only anchor link isn't a real skip mechanism, e.g. a
 *   "back to top" link) — never a false positive — which matches this
 *   engine's non-negotiable "fail is reserved for high-confidence
 *   violations" policy. A future revision can tighten (b) once a
 *   positional heuristic has been validated against real pages without
 *   regressions.
 * - `fail` therefore means: no main landmark, no resolvable same-page
 *   anchor link anywhere, and no heading anywhere on the page. That is a
 *   strong, low-ambiguity signal that the page truly has zero recognized
 *   bypass mechanism.
 */

const id = 'bypass-blocks-present';

const meta = {
  title: 'Page must provide a way to bypass repeated blocks',
  description:
    'Checks that the page has at least one recognized WCAG 2.4.1 bypass-blocks mechanism: a main landmark, a working same-page anchor link, or a heading.',
  i18n: {
    titleKey: 'bypassBlocksPresent_title',
    descriptionKey: 'bypassBlocksPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag241', 'navigation', 'atomic', 'automatic'],
  wcagSc: ['2.4.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.1',
      title: 'Bypass Blocks',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '2.4.1': ['bypass-blocks-present'] } }
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

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

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

  function queryAll(selector) {
    try {
      return helpers && typeof helpers.queryAllSmart === 'function'
        ? helpers.queryAllSmart(selector)
        : document.querySelectorAll(selector);
    } catch {
      return [];
    }
  }

  // Filters through isAccTreeEligible (hidden/aria-hidden/display:none/inert
  // don't count as "a bypass mechanism is present") -- see page-has-heading-
  // one-manual.js's identical fix for the real-world trigger (CDC's flu
  // page, 2026-07-30: its only <h1> sits inside a display:none ancestor,
  // unreachable by sighted and screen reader users alike). A fully
  // non-rendered <main>/heading was previously credited here too, wrongly
  // returning `pass` for a page with zero actual bypass mechanisms.
  function hasMainLandmark() {
    for (const el of queryAll('main, [role="main"]')) {
      if (el && isExposedToAt(el)) return true;
    }
    return false;
  }

  function hasWorkingAnchorLink() {
    let links;
    try {
      links = document.querySelectorAll('a[href]');
    } catch {
      links = [];
    }
    for (const a of links) {
      if (!a || !a.getAttribute) continue;
      const href = String(a.getAttribute('href') || '').trim();
      if (href.length < 2 || href.charAt(0) !== '#') continue;
      let fragment = href.slice(1);
      try {
        fragment = decodeURIComponent(fragment);
      } catch {
        // keep raw fragment if it isn't a valid percent-encoded string
      }
      fragment = fragment.trim();
      if (!fragment) continue;

      let target;
      try {
        target = document.getElementById(fragment);
      } catch {
        target = null;
      }
      if (!target) {
        try {
          target = document.querySelector('a[name="' + fragment.replace(/"/g, '\\"') + '"]');
        } catch {
          target = null;
        }
      }
      if (target) return true;
    }
    return false;
  }

  function hasHeading() {
    for (const el of queryAll('h1, h2, h3, h4, h5, h6, [role="heading"]')) {
      if (el && isExposedToAt(el)) return true;
    }
    return false;
  }

  const mainLandmark = hasMainLandmark();
  const anchorLink = mainLandmark ? false : hasWorkingAnchorLink();
  const heading = mainLandmark || anchorLink ? false : hasHeading();

  if (mainLandmark || anchorLink || heading) {
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
      summary: 'This page has no recognized way to bypass repeated blocks of content.',
      hint: 'Add a main landmark (<main> or role="main"), a working "skip to content" link, or heading elements that assistive technology can use to jump past repeated content.',
      i18n: {
        summaryKey: 'bypassBlocksPresent_summary_fail',
        hintKey: 'bypassBlocksPresent_hint_fail',
        params: {}
      },
      data: {
        details: { reasonCode: 'BYPASS_MECHANISM_ABSENT' },
        visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    }
  ];

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage, applicability };
