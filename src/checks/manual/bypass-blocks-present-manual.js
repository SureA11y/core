/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check bypass-blocks-present
 * @atomic true
 * @summary The page must provide at least one mechanism to bypass repeated blocks of content
 * @standard WCAG 2.2
 * @sc 2.4.1
 * @applicability
 *   Always applicable to any HTML document with a <body> element:
 *   "bypass blocks" is a whole-page concern, matching
 *   aria-hidden-body / page-title-present's pattern of
 *   evaluating the document directly rather than a scoped root.
 *   Not while a modal dialog is open: the rest of the page is inert then,
 *   so the scan sees the dialog, not the page.
 *   A custom element whose ElementInternals give it the main or heading role
 *   (this.attachInternals().role) counts as a <main> or a heading does.
 * @expectation
 *   At least one of the following recognized WCAG 2.4.1 techniques is
 *   present:
 *   (a) a main landmark (<main>, or an element whose role attribute
 *       resolves to main: the first real role token, in any case), ARIA11: a
 *       screen reader user can jump straight to it, bypassing everything
 *       before it (nav, header, repeated blocks) in one step;
 *   (b) a working skip link, technique G1: an <a href="#id"> (or legacy
 *       <a name="id">) whose name reads as a skip link in one of the
 *       shipped languages (helpers.hasSkipLinkWording, as skip-link uses)
 *       and whose target resolves to a real element in the link's own tree
 *       (light DOM or the same shadow root), outside any navigation or
 *       complementary landmark (<nav>, <aside>, or the role): a link to the
 *       menu or a sidebar skips to no main content. Not required to be
 *       positioned before a <nav> or be keyboard-focus-order-first;
 *   (c) at least one heading (<h1>-<h6>, or a role resolving to heading) that is both
 *       included in the accessibility tree AND visible (not off-screen,
 *       clipped, opacity:0, zero-size-overflow-hidden, or drawn wholly
 *       above the top of the page or left of its start, where no scrolling
 *       reaches), and outside any
 *       navigation or complementary landmark, technique H69:
 *       heading navigation is itself a standards-recognized bypass
 *       mechanism (e.g. a screen reader's "jump by heading" command), but
 *       ACT 047fe0's own Expectation requires visibility too, since a
 *       screen-reader-only heading leaves sighted keyboard users with no
 *       equivalent way to locate the start of non-repeated content. H69 puts
 *       headings at the start of each section of content: one inside the
 *       navigation heads the repeated block, and jumping to it skips
 *       nothing (ACT 047fe0, Failed Example 4).
 * @reason-codes
 *   - `BYPASS_MECHANISM_ABSENT` (cantTell): no main landmark, working skip
 *     link or visible heading was found, so a person checks whether the page
 *     needs a way to bypass repeated content and offers one.
 *     It leans fail when a navigation block with links comes before the
 *     page's own text and no same-page link leads past it, and pass when
 *     nothing focusable comes before that text and the page has no header,
 *     navigation, sidebar or footer.
 *     Basis: WCAG 2.4.1 (not settled); G1; ARIA11; H69; ACT cf77f2.
 * @implementation-notes
 * - Outcome model: this rule is `type: 'manual'` (cantTell-capped, never
 *   `fail`). When a recognized mechanism is found the page has nothing to
 *   review here → `pass`, as ACT cf77f2 passes it. When none is found we
 *   return `cantTell`: "we could not detect a bypass mechanism, please
 *   verify," rather than a hard `fail`. The absence of a *detectable*
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
 *       is exposed, so a snapshot taken then would see "no mechanism" though
 *       the page has one once the dialog closes. A modal <dialog> the engine
 *       can detect (helpers.isModalDialogOpen) makes the rule notApplicable
 *       instead; one built some other way, with inert or aria-hidden on the
 *       page, still reaches this cantTell. The same applies to content
 *       that is display:none until revealed by script (tabs, accordions, an
 *       unmounted SPA view).
 *   Both cases would produce false positives under a hard `fail`, which this
 *   engine reserves for high-confidence violations; `cantTell` routes them to
 *   human review instead. No ACT rule hard-fails 2.4.1 by presence alone,
 *   for the same reason.
 * - Condition (b) checks presence, not position: getting DOM-order /
 *   keyboard-focus-order positioning right without false positives is much
 *   harder than checking presence. Because a found mechanism is a pass,
 *   the link has to read as a skip link: any working same-page link used
 *   to count, so a lone "back to top" link passed the page. A page whose
 *   only same-page links have other names gets the review prompt instead.
 * - Shadow DOM: all three conditions use `helpers.queryAllSmart`, which is
 *   shadow-DOM-aware (when the run enables includeShadowDom) and applies the
 *   engine's hidden-content policy. The same-page-anchor target is resolved
 *   in the link's own root (`getRootNode()`: the document, or the shadow
 *   root the link lives in) before falling back to the document, so a skip
 *   link encapsulated in a web component is credited the same as one in the
 *   light DOM.
 */

const id = 'bypass-blocks-present';

const meta = {
  title: 'Page must provide a way to bypass repeated blocks',
  description:
    'Checks that the page has at least one recognized WCAG 2.4.1 bypass-blocks mechanism: a main landmark, a working skip link, or a heading.',
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
  coverage: { facetsBySc: { '2.4.1': ['bypass-blocks-present'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    BYPASS_MECHANISM_ABSENT: {
      steps: [
        'Close any dialog or overlay, then look at whether the page repeats blocks such as a header or menu that appear on other pages of the site.',
        'Click the address bar and press Tab: check whether a skip link appears that moves focus past the repeated blocks to the main content.',
        "Check for headings at the start of the main content, or a main landmark, in the Accessibility pane or by a screen reader's headings and landmarks lists."
      ],
      passWhen:
        'The page has no repeated blocks, or offers a working skip link, a main landmark or headings that let users jump past them.',
      failWhen:
        'Repeated blocks have no way to skip them, so keyboard and screen reader users must go through them on every page, which fails WCAG 2.4.1.'
    }
  }
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
//
// Also notApplicable while a modal dialog is open: the rest of the page is
// inert then, so the scan saw the dialog, not the page's structure.
function applicability(ctx) {
  const { helpers } = ctx;
  if (helpers.isWholeDocumentScope && !helpers.isWholeDocumentScope()) return false;
  return !(helpers.isModalDialogOpen && helpers.isModalDialogOpen());
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const body = document && dom.body(document) ? dom.body(document) : null;
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

  // Custom elements that are a main or a heading by their internals count.
  function queryAll(selector) {
    try {
      return helpers && typeof helpers.queryAllSmart === 'function'
        ? helpers.queryAllSmart(selector, { internalsRoles: true })
        : dom.querySelectorAll(document, selector);
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
  // A native element of one of `tags`, or an element whose role attribute
  // resolves to `role`: the first token naming a real role wins, in any case,
  // so role="foo main" and role="MAIN" count but role="region main" doesn't.
  // A custom element's internals may give it the role instead.
  function isTagOrRole(el, tags, role) {
    if (tags.includes(String(dom.localName(el) || '').toLowerCase())) return true;
    return helpers.aria.getAuthorRole(el) === role;
  }

  function hasMainLandmark() {
    for (const el of queryAll('main, [role~="main" i]')) {
      if (el && isTagOrRole(el, ['main'], 'main') && isExposedToAt(el)) return true;
    }
    return false;
  }

  // Resolve a fragment id (or legacy <a name>) inside a specific root node
  // (a Document or a ShadowRoot). Both expose getElementById; a legacy
  // anchor name is compared as an attribute rather than built into a
  // selector, which a backslash or quote in the name would break.
  function resolveInRoot(root, fragment) {
    if (!root) return null;
    let target;
    try {
      target =
        typeof dom.get(root, 'getElementById') === 'function'
          ? dom.getElementById(root, fragment)
          : null;
    } catch {
      target = null;
    }
    if (target) return target;
    try {
      target =
        typeof dom.get(root, 'querySelectorAll') === 'function'
          ? Array.from(dom.querySelectorAll(root, 'a[name]')).find(
              (a) => dom.getAttribute(a, 'name') === fragment
            ) || null
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
  // A link's accessible name: aria-labelledby/aria-label, else its content.
  function linkName(a) {
    const aria = helpers.getAriaNameInfo(a, ctx);
    if (aria.present && aria.value) return aria.value;
    return helpers.getContentNameInfo(a, ctx).value || '';
  }

  // Inside a navigation or complementary landmark: content a page repeats
  // or sets beside its own, not where it starts (H69, G1). Crossing shadow
  // roots, as the element is rendered.
  const ASIDE_BY_TAG = { nav: 'navigation', aside: 'complementary' };
  function isInNavigationOrAside(el) {
    let guard = 0;
    for (let cur = el; cur && guard++ < 500; cur = helpers.composedParent(cur)) {
      const role =
        helpers.aria.getAuthorRole(cur) ||
        ASIDE_BY_TAG[String(dom.localName(cur) || '').toLowerCase()] ||
        '';
      if (role === 'navigation' || role === 'complementary') return true;
    }
    return false;
  }

  function hasWorkingSkipLink() {
    let links;
    try {
      links =
        helpers && typeof helpers.queryAllSmart === 'function'
          ? helpers.queryAllSmart('a[href]')
          : dom.querySelectorAll(document, 'a[href]');
    } catch {
      links = [];
    }
    for (const a of links) {
      if (!a || !dom.get(a, 'getAttribute')) continue;
      const href = String(dom.getAttribute(a, 'href') || '').trim();
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
        if (typeof dom.get(a, 'getRootNode') === 'function') {
          const r = dom.getRootNode(a);
          if (r) root = r;
        }
      } catch {
        root = document;
      }

      if (!helpers.hasSkipLinkWording(linkName(a))) continue;

      let target = resolveInRoot(root, fragment);
      if (!target && root !== document) {
        target = resolveInRoot(document, fragment);
      }
      // A link into the navigation or a sidebar skips to no main content.
      if (target && !isInNavigationOrAside(target)) return true;
    }
    return false;
  }

  // ACT 047fe0's own Expectation requires the heading to be visible, not
  // only included in the accessibility tree: a screen-reader-only heading
  // still leaves sighted keyboard users with no way to locate the start of
  // non-repeated content. "Visible" per ACT's own glossary: making it fully
  // transparent would change rendered pixels, which every CSS-only hiding
  // technique (off-screen positioning, clip/clip-path, opacity:0, a
  // zero-size overflow:hidden box) fails.
  function isCssHidden(el) {
    if (isBeyondPageStart(el)) return true;
    if (!helpers || typeof helpers.getVisibilityHintsInfo !== 'function') return false;
    try {
      const info = helpers.getVisibilityHintsInfo(el, ctx, {});
      return !!(info && Array.isArray(info.hints) && info.hints.length > 0);
    } catch {
      return false;
    }
  }

  // Drawn wholly above the top of the page, or left of its start, where no
  // scrolling reaches (top: -999px; ACT 047fe0, Failed Example 2): the page
  // starts at 0, so the box is never on screen. A right-to-left page scrolls
  // left of its start, so only the top bounds it there, as in
  // target-size-minimum. Without layout (jsdom) a box has no size, and this
  // says nothing.
  function isBeyondPageStart(el) {
    try {
      const view = dom.defaultView(document);
      const r = dom.getBoundingClientRect(el);
      if (!view || !r || !(r.width > 0 || r.height > 0)) return false;
      const scrollX = Number(view.scrollX) || 0;
      const scrollY = Number(view.scrollY) || 0;
      if (r.bottom + scrollY <= 0) return true;
      const rootCs = helpers.computedStyle(dom.documentElement(document));
      const rtl = !!rootCs && rootCs.direction === 'rtl';
      return !rtl && r.right + scrollX <= 0;
    } catch {
      return false;
    }
  }

  const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  function hasHeading() {
    for (const el of queryAll('h1, h2, h3, h4, h5, h6, [role~="heading" i]')) {
      if (!el || !isTagOrRole(el, HEADING_TAGS, 'heading')) continue;
      // A heading in the navigation heads the block to be skipped.
      if (isExposedToAt(el) && !isCssHidden(el) && !isInNavigationOrAside(el)) return true;
    }
    return false;
  }

  const mainLandmark = hasMainLandmark();
  const anchorLink = mainLandmark ? false : hasWorkingSkipLink();
  const heading = mainLandmark || anchorLink ? false : hasHeading();

  // A recognized mechanism is present -> nothing to review on this page.
  if (mainLandmark || anchorLink || heading) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  // ---- Lean ----

  // Repeated blocks are usually a page's header, navigation, sidebars and
  // footer; its own content is text outside them.
  const BLOCK_ROLE_BY_TAG = {
    nav: 'navigation',
    aside: 'complementary',
    header: 'banner',
    footer: 'contentinfo'
  };
  const BLOCK_ROLES = ['navigation', 'complementary', 'banner', 'contentinfo'];
  function blockRoleOf(el) {
    const role = helpers.aria.getAuthorRole(el);
    if (role) return BLOCK_ROLES.indexOf(role) !== -1 ? role : '';
    return BLOCK_ROLE_BY_TAG[String(dom.localName(el) || '').toLowerCase()] || '';
  }
  function inRepeatedBlock(node) {
    let guard = 0;
    for (
      let cur = dom.nodeType(node) === 1 ? node : dom.parentElement(node);
      cur && guard++ < 500;
      cur = dom.parentElement(cur)
    ) {
      if (blockRoleOf(cur)) return true;
    }
    return false;
  }

  // The first text of the page's own: letters in a text node exposed to
  // assistive technology and outside the blocks above. null when none.
  const UNSHOWN = ['script', 'style', 'noscript', 'template'];
  function firstContentText() {
    try {
      const walker = dom.createTreeWalker(document, body, 4);
      for (let n = walker.nextNode(), i = 0; n && i < 20000; n = walker.nextNode(), i++) {
        if (!/\p{L}/u.test(String(dom.nodeValue(n) || ''))) continue;
        const parent = dom.parentElement(n);
        if (!parent || UNSHOWN.indexOf(String(dom.localName(parent) || '').toLowerCase()) !== -1)
          continue;
        if (inRepeatedBlock(n) || !isExposedToAt(parent)) continue;
        return n;
      }
    } catch {
      return null;
    }
    return null;
  }

  const FOCUSABLE =
    'a[href], area[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable]';
  // 2: the element comes before the node.
  const precedes = (el, node) => !!(dom.compareDocumentPosition(node, el) & 2);

  function bypassLean() {
    const content = firstContentText();
    if (!content) return null;
    let leading = 0;
    let navWithLinks = false;
    for (const el of queryAll(FOCUSABLE)) {
      if (!el || !isExposedToAt(el) || !precedes(el, content)) continue;
      const tabindex = dom.getAttribute(el, 'tabindex');
      if (tabindex !== null && parseInt(tabindex, 10) < 0) continue;
      leading += 1;
      if (!navWithLinks && isInNavigationOrAside(el)) {
        let guard = 0;
        for (let cur = el; cur && guard++ < 500; cur = dom.parentElement(cur)) {
          if (blockRoleOf(cur) === 'navigation') {
            navWithLinks = true;
            break;
          }
        }
      }
    }
    let blockPresent = false;
    for (const el of queryAll('nav, aside, header, footer, [role]')) {
      if (el && blockRoleOf(el) && isExposedToAt(el)) {
        blockPresent = true;
        break;
      }
    }
    // A same-page link, whatever its words, to something outside the
    // navigation and sidebars may be the way past them ("Jump to recipe").
    let otherSamePageLinks = 0;
    for (const a of queryAll('a[href]')) {
      const href = String(dom.getAttribute(a, 'href') || '').trim();
      if (href.length < 2 || href.charAt(0) !== '#') continue;
      let fragment = href.slice(1);
      try {
        fragment = decodeURIComponent(fragment);
      } catch {
        // keep the raw fragment
      }
      const target = resolveInRoot(document, fragment.trim());
      if (target && !isInNavigationOrAside(target)) otherSamePageLinks += 1;
    }
    const signals = [
      { signal: 'nav-or-header-present', value: blockPresent },
      { signal: 'leading-focusable-count', value: leading },
      { signal: 'other-same-page-links', value: otherSamePageLinks }
    ];
    // A navigation block with links in front of the page's own text, and
    // nothing to move past it: the block 2.4.1 is about (ACT cf77f2).
    if (navWithLinks && otherSamePageLinks === 0) {
      return {
        toward: 'fail',
        why: "A navigation block with links comes before the page's own content, and no skip link, main landmark, heading or same-page link leads past it.",
        signals,
        caution:
          'Whether the block repeats on other pages cannot be seen from one page, and a dialog built without <dialog> may hide the real page.',
        i18n: {
          whyKey: 'bypassBlocksPresent_lean_why_navBeforeContent',
          cautionKey: 'bypassBlocksPresent_lean_caution_navBeforeContent'
        }
      };
    }
    // Nothing a keyboard reaches before the content, and no header,
    // navigation, sidebar or footer: there is no block to bypass.
    if (!blockPresent && leading === 0) {
      return {
        toward: 'pass',
        why: "Nothing that takes focus comes before the page's own content, and the page has no header, navigation, sidebar or footer block to bypass.",
        signals,
        caution:
          'Repeated text with no links, such as a site name, may still come before the content.',
        i18n: {
          whyKey: 'bypassBlocksPresent_lean_why_nothingBefore',
          cautionKey: 'bypassBlocksPresent_lean_caution_nothingBefore'
        }
      };
    }
    return null;
  }

  // A lean is advice: a failure reading it costs the lean, not the finding.
  let lean = null;
  try {
    lean = bypassLean();
  } catch {
    // no lean
  }

  const occurrences = [
    helpers.reportOccurrence(body, {
      ...(lean ? { lean } : {}),
      summary: 'No way to skip repeated content was found on this page.',
      hint: 'Check that the page offers one: a main landmark (<main> or role="main"), a working "skip to content" link, or headings that screen reader users can jump between. One may be hidden only for now, for example while a modal dialog makes the rest of the page inert.',
      i18n: {
        summaryKey: 'bypassBlocksPresent_summary_cantTell',
        hintKey: 'bypassBlocksPresent_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'BYPASS_MECHANISM_ABSENT' },
        visibilityFilter: { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    })
  ];

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage, applicability };
