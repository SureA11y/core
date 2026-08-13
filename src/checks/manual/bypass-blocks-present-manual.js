/* SPDX-License-Identifier: MPL-2.0 */

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
 *       a real element in the link's own tree (light DOM or the same shadow
 *       root). Deliberately NOT required to be positioned before a <nav> or
 *       be keyboard-focus-order-first — see implementation notes;
 *   (c) at least one heading (<h1>-<h6> or [role="heading"]) — technique
 *       H69: heading navigation is itself a standards-recognized bypass
 *       mechanism (e.g. a screen reader's "jump by heading" command).
 * @implementation-notes
 * - Outcome model: this rule is `type: 'manual'` (cantTell-capped, never
 *   `fail`). When a recognized mechanism is found the page has nothing to
 *   review here → `notApplicable` (matching page-has-heading-one-manual /
 *   skip-link-manual's "nothing to flag" convention). When none is found we
 *   return `cantTell` — "we could not detect a bypass mechanism, please
 *   verify" — rather than a hard `fail`. The absence of a *detectable*
 *   mechanism is NOT high-confidence evidence that 2.4.1 is violated, for
 *   several reasons the engine cannot resolve from a single static snapshot:
 *     • Applicability itself is undecidable in-page. 2.4.1 governs blocks of
 *       content "repeated on multiple Web pages"; whether any block is
 *       actually repeated across the site is not knowable from one document,
 *       so a page that legitimately needs no bypass mechanism would be
 *       indistinguishable from one that omits a required one.
 *     • Transient accessibility-tree state. When a modal dialog is open the
 *       rest of the page is routinely made `inert` or `aria-hidden="true"`,
 *       so the page's real <main>/headings are (correctly) filtered out by
 *       isAccTreeEligible for the duration of that state and only the dialog
 *       is exposed — a snapshot taken then would see "no mechanism" though
 *       the page has one once the dialog closes. The same applies to content
 *       that is display:none until revealed by script (tabs, accordions, an
 *       unmounted SPA view).
 *   Both cases would produce false positives under a hard `fail`, which this
 *   engine reserves for high-confidence violations; `cantTell` routes them to
 *   human review instead. This mirrors how other tools treat 2.4.1 (e.g. axe
 *   marks the no-mechanism case "needs review" via reviewOnFail rather than
 *   failing it), and why no ACT rule hard-fails 2.4.1 by presence alone.
 * - This rule intentionally checks presence, not position, for the
 *   same-page-anchor condition (b): a full bypass algorithm is heuristic
 *   (see ROADMAP.md's Tier 1a note on why this rule was
 *   deferred from the rest of that batch), and getting DOM-order /
 *   keyboard-focus-order positioning exactly right without introducing
 *   false positives is materially harder than the rest of Tier 1a. Being
 *   lenient about condition (b) can only make us *miss* a review prompt
 *   (a page whose only anchor link isn't a real skip mechanism, e.g. a
 *   "back to top" link) — never raise a spurious one.
 * - Shadow DOM: all three conditions use `helpers.queryAllSmart`, which is
 *   shadow-DOM-aware (when the run enables includeShadowDom) and applies the
 *   engine's hidden-content policy. The same-page-anchor target is resolved
 *   in the link's own root (`getRootNode()` — the document, or the shadow
 *   root the link lives in) before falling back to the document, so a skip
 *   link encapsulated in a web component is credited the same as one in the
 *   light DOM. (Previously the anchor path used raw
 *   `document.querySelectorAll`/`getElementById`, which never pierced shadow
 *   roots — a genuine gap now closed.)
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
  tags: ['wcag2a', 'wcag241', 'navigation', 'atomic', 'manual'],
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
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
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
  // don't count as "a bypass mechanism is present") -- see
  // page-has-heading-one-manual.js for the identical real-world trigger
  // (e.g. a page whose only <h1> sits inside a display:none ancestor,
  // unreachable by sighted and screen reader users alike). A fully
  // non-rendered <main>/heading must not be credited here, since that would
  // wrongly treat a page with zero currently-exposed bypass mechanisms as
  // having one.
  function hasMainLandmark() {
    for (const el of queryAll('main, [role="main"]')) {
      if (el && isExposedToAt(el)) return true;
    }
    return false;
  }

  // Resolve a fragment id (or legacy <a name>) inside a specific root node
  // (a Document or a ShadowRoot). Both expose getElementById; querySelector
  // is used for the legacy anchor-name fallback.
  function resolveInRoot(root, fragment) {
    if (!root) return null;
    let target;
    try {
      target = typeof root.getElementById === 'function' ? root.getElementById(fragment) : null;
    } catch {
      target = null;
    }
    if (target) return target;
    try {
      target =
        typeof root.querySelector === 'function'
          ? root.querySelector('a[name="' + fragment.replace(/"/g, '\\"') + '"]')
          : null;
    } catch {
      target = null;
    }
    return target;
  }

  // Shadow-DOM-aware: gather anchors via queryAllSmart (pierces shadow roots
  // when includeShadowDom is enabled, and drops hard-hidden links), and
  // resolve each fragment in the link's own root before falling back to the
  // document. This credits a skip link encapsulated in a web component the
  // same way as one authored in the light DOM.
  function hasWorkingAnchorLink() {
    let links;
    try {
      links =
        helpers && typeof helpers.queryAllSmart === 'function'
          ? helpers.queryAllSmart('a[href]')
          : document.querySelectorAll('a[href]');
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

      let root = document;
      try {
        if (typeof a.getRootNode === 'function') {
          const r = a.getRootNode();
          if (r) root = r;
        }
      } catch {
        root = document;
      }

      let target = resolveInRoot(root, fragment);
      if (!target && root !== document) {
        target = resolveInRoot(document, fragment);
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

  // A recognized mechanism is present -> nothing to review on this page.
  if (mainLandmark || anchorLink || heading) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
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
        'No recognized way to bypass repeated blocks of content was detected on this page — verify a bypass mechanism exists.',
      hint: 'Confirm the page offers a bypass mechanism: a main landmark (<main> or role="main"), a working "skip to content" link, or heading elements that assistive technology can use to jump past repeated content. (A mechanism may be temporarily hidden — e.g. while a modal dialog makes the page inert — or provided on a per-site basis; this needs human confirmation.)',
      i18n: {
        summaryKey: 'bypassBlocksPresent_summary_cantTell',
        hintKey: 'bypassBlocksPresent_hint_cantTell',
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
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage, applicability };
