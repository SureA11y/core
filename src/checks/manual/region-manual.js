/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check region
 * @atomic true
 * @summary Page content should be contained within a landmark region
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to a page whose <body> has content: an element that directly
 *   carries visible text (or other own content, see
 *   @implementation-notes) outside any landmark, or a landmark with
 *   anything in it. Live regions, dialogs, buttons, <svg>,
 *   <iframe>/<frame> and resolvable skip links are not content that needs
 *   a landmark.
 *   Not while a modal dialog is open: the rest of the page is inert then,
 *   so the scan sees the dialog, not the page.
 * @expectation
 *   Every top-level piece of page content lives inside a landmark region
 *   (main, navigation, banner, contentinfo, complementary, region, form,
 *   search), so assistive technology users navigating by landmark do not
 *   miss content that was never placed inside one.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent and the landmark-
 *   detection model.
 * - Recursive tree walk, not a direct-<body>-children-only scan: a
 *   direct-children-only scope is nearly inert on the single most common
 *   real-world page shape, a modern framework's single root mount div
 *   (`<body><div id="root">...everything...</div></body>`). That shape
 *   gives at most one candidate for the entire page and either misses
 *   every real gap inside it or collapses the whole page into one
 *   undifferentiated report.
 * - Algorithm, using this engine's own helpers (see
 *   hasLandmarkScopingAncestor's header comment):
 *     1. Depth-first walk from <body>'s children.
 *     2. At each node: if it's ineligible for the accessibility tree
 *        (helpers.isAccTreeEligible), OR is itself a "stopper" (landmark,
 *        live region, dialog, button, <svg>, <iframe>/<frame>, or a
 *        resolvable skip-link), mark it and every ancestor up to <body> as
 *        "has a stopper" and don't recurse further into it (an <iframe>/
 *        <frame> is additionally reported as its own occurrence, since its
 *        content is opaque to this engine, so from the outer page's
 *        perspective it IS unplaced content).
 *     3. Otherwise, if the node has OWN content (a direct child text node,
 *        being an inherently visual element, or an aria-label), checked
 *        non-recursively so a plain wrapper <div> with only nested
 *        children never short-circuits the walk into its descendants,
 *        collect it as a candidate and stop recursing into it.
 *     4. Otherwise recurse into its element children.
 *   Each collected candidate is then walked back UP through parents while
 *   the parent has no "stopper" marker and isn't <body> itself, collapsing
 *   contiguous unplaced content into one occurrence per real gap instead
 *   of reporting every individual text-bearing leaf. This is what keeps
 *   the walk from being noisy on ordinary pages that mix landmarked and
 *   stray content.
 * - "Stopper" exemptions (button, dialog, <svg>, resolvable skip-links)
 *   are a scope choice, not an oversight: these
 *   are extremely common real-world patterns (floating action buttons,
 *   modal dialogs, decorative/icon SVGs, "skip to content" links) that
 *   aren't the kind of "content organization" gap this rule exists to
 *   catch, and flagging them would reintroduce the false-positive noise
 *   the original narrow scope was trying to avoid.
 * - The "own content" check for aria-label does NOT resolve
 *   aria-labelledby, a known, narrow scope gap (an element named only via aria-labelledby, with no
 *   own text/aria-label, and no other content anywhere in its subtree,
 *   could be silently skipped) accepted to avoid a full accessible-name
 *   computation (recursive itself) inside an already-recursive structural
 *   walk.
 * - Bounded by a node-visit budget (see MAX_VISITED_NODES) as a defensive
 *   guard against pathological pages, matching the existing pattern used
 *   by getContentNameInfo's maxContentNodes in src/core/dom-helpers.js.
 */

const id = 'region';

const meta = {
  title: 'Page content should be inside a landmark region',
  description: 'Checks that content under <body> is contained within a landmark region.',
  i18n: {
    titleKey: 'region_title',
    descriptionKey: 'region_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'landmarks', 'structure', 'atomic', 'manual'],
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
//
// Also notApplicable while a modal dialog is open: the rest of the page is
// inert then, so the scan saw the dialog, not the page's structure.
function applicability(ctx) {
  const { helpers } = ctx;
  if (helpers.isWholeDocumentScope && !helpers.isWholeDocumentScope()) return false;
  return !(helpers.isModalDialogOpen && helpers.isModalDialogOpen());
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const body = document && document.body ? document.body : null;
  if (!body) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function lower(s) {
    return String(s || '').toLowerCase();
  }

  function getExplicitRoleToken(el) {
    const raw = normalizeWs(el.getAttribute && el.getAttribute('role'));
    if (!raw) return '';
    return lower(raw.split(/\s+/)[0]);
  }

  function isLandmark(el) {
    return !!helpers.getLandmarkRole(el, ctx);
  }

  const SKIP_TAGS = new Set(['script', 'style', 'template', 'noscript', 'link', 'meta', 'title']);

  // Roles/attributes that make an element its own self-contained
  // announced area: not literally a WAI-ARIA landmark, but not "content
  // that needs a landmark" either.
  const LIVE_REGION_ROLES = new Set(['alert', 'status', 'log', 'marquee', 'timer']);

  function isAriaLive(el) {
    const v = lower(normalizeWs(el.getAttribute && el.getAttribute('aria-live')));
    return v === 'polite' || v === 'assertive';
  }

  function isDialogLike(el) {
    const tag = el.tagName ? lower(el.tagName) : '';
    if (tag === 'dialog') return true;
    const role = getExplicitRoleToken(el);
    return role === 'dialog' || role === 'alertdialog';
  }

  function isButtonLike(el) {
    const role = getExplicitRoleToken(el);
    if (role) return role === 'button';
    const tag = el.tagName ? lower(el.tagName) : '';
    if (tag === 'button' || tag === 'summary') return true;
    if (tag === 'input') {
      const type = lower(normalizeWs(el.getAttribute && el.getAttribute('type')));
      return type === 'button' || type === 'submit' || type === 'reset' || type === 'image';
    }
    return false;
  }

  // A "skip to content" link is placed outside the main content flow
  // on purpose, at the very top of the page. Exempting it (when its
  // fragment actually resolves to a real target, not a dead "#"
  // placeholder) avoids flagging a helpful, common accessibility pattern
  // as the very thing this rule is meant to catch.
  function isResolvableSkipLink(el) {
    const tag = el.tagName ? lower(el.tagName) : '';
    if (tag !== 'a') return false;
    const href = el.getAttribute && el.getAttribute('href');
    if (!href || href.charAt(0) !== '#' || href.length < 2) return false;
    try {
      return !!(document.getElementById && document.getElementById(href.slice(1)));
    } catch {
      return false;
    }
  }

  function isStopper(el) {
    if (isLandmark(el)) return true;
    if (isAriaLive(el)) return true;
    const role = getExplicitRoleToken(el);
    if (role && LIVE_REGION_ROLES.has(role)) return true;
    if (isDialogLike(el)) return true;
    if (isButtonLike(el)) return true;
    const tag = el.tagName ? lower(el.tagName) : '';
    if (tag === 'svg' || tag === 'iframe' || tag === 'frame') return true;
    if (isResolvableSkipLink(el)) return true;
    return false;
  }

  const VISUAL_CONTENT_TAGS = new Set(['img', 'video', 'audio', 'canvas', 'object', 'embed']);

  // Non-recursive "does THIS element, on its own, carry content" check.
  // Mirrors only the direct-content half of getContentNameInfo on purpose,
  // not a full name-from-content recursion: the whole point is to keep
  // recursing through plain wrapper elements (a framework's root mount
  // <div> included) until reaching the actual content-bearing node, rather
  // than a coarse ancestor swallowing everything beneath it into one report.
  function hasOwnContent(el) {
    const kids = el.childNodes || [];
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i];
      if (k.nodeType === 3 && normalizeWs(k.nodeValue)) return true;
    }
    const tag = el.tagName ? lower(el.tagName) : '';
    if (VISUAL_CONTENT_TAGS.has(tag)) return true;
    if (
      tag === 'input' &&
      lower(normalizeWs(el.getAttribute && el.getAttribute('type'))) !== 'hidden'
    )
      return true;
    if (normalizeWs(el.getAttribute && el.getAttribute('aria-label'))) return true;
    return false;
  }

  // Defensive guard against pathological pages (mirrors the maxContentNodes
  // pattern in src/core/dom-helpers.js's getContentNameInfo) -- a full-body
  // structural walk visits more nodes than a single element's name
  // computation, hence the larger budget.
  const MAX_VISITED_NODES = 20000;
  let visited = 0;
  let truncated = false;
  // Whether some landmark holds anything: with nothing outside one, that is
  // what makes the page a pass rather than an empty one.
  let placedContent = false;

  const leaves = [];
  const stopperFlagged = new WeakSet();

  function markFlaggedUpToBody(el) {
    let cur = el;
    while (cur) {
      if (stopperFlagged.has(cur)) break; // everything above is already marked
      stopperFlagged.add(cur);
      if (cur === body) break;
      cur = cur.parentElement;
    }
  }

  function walk(el) {
    if (truncated || !el || el.nodeType !== 1) return;
    visited += 1;
    if (visited > MAX_VISITED_NODES) {
      truncated = true;
      return;
    }

    const tag = el.tagName ? lower(el.tagName) : '';
    if (SKIP_TAGS.has(tag)) return;

    const eligRes = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el) : { eligible: true };
    if (!(eligRes && eligRes.eligible)) {
      markFlaggedUpToBody(el);
      return;
    }

    if (isStopper(el)) {
      markFlaggedUpToBody(el);
      if (
        !placedContent &&
        isLandmark(el) &&
        (normalizeWs(el.textContent) || el.firstElementChild)
      ) {
        placedContent = true;
      }
      if (tag === 'iframe' || tag === 'frame') leaves.push(el);
      return;
    }

    if (hasOwnContent(el)) {
      leaves.push(el);
      return;
    }

    // Sibling links, not el.children: in jsdom a children collection stays
    // live once read, and each later change under a large parent rebuilds
    // it, so reading body.children made a 20,000-node page slow to scan
    // and to close.
    for (let kid = el.firstElementChild; kid; kid = kid.nextElementSibling) {
      walk(kid);
      if (truncated) return;
    }
  }

  for (let child = body.firstElementChild; child; child = child.nextElementSibling) walk(child);

  // Collapse each candidate leaf upward through parents that have no OTHER
  // stopper anywhere in their subtree, so contiguous unplaced content
  // merges into ONE occurrence per real gap instead of one per text node --
  // this collapsing is what keeps ordinary pages (landmarked content mixed
  // with a little stray content) from producing noisy, one-per-leaf reports.
  const collapsed = [];
  const seen = new Set();
  for (const leaf of leaves) {
    let cur = leaf;
    while (
      cur.parentElement &&
      cur.parentElement !== body &&
      !stopperFlagged.has(cur.parentElement)
    ) {
      cur = cur.parentElement;
    }
    if (!seen.has(cur)) {
      seen.add(cur);
      collapsed.push(cur);
    }
  }

  // Report the element itself: without a node reference the engine re-finds
  // each one with document.querySelector to build its structuralPath.
  const occurrences = collapsed.map((el) => {
    const tag = el.tagName ? lower(el.tagName) : '';
    const partial = {
      summary: 'This content is not contained within a landmark region.',
      hint: 'Move this content inside a landmark region (main, nav, aside, a labeled section, etc.).',
      i18n: {
        summaryKey: 'region_summary_cantTell',
        hintKey: 'region_hint_cantTell',
        params: { element: tag }
      },
      data: {
        details: { reasonCode: 'CONTENT_OUTSIDE_LANDMARK', element: tag }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      return helpers.reportOccurrence(el, partial);
    }

    return {
      selector: helpers.buildSelector ? helpers.buildSelector(el) : 'html',
      html: helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '',
      ...partial
    };
  });

  if (occurrences.length === 0) {
    // A walk cut short by the node budget cannot vouch for the rest of the
    // page, so it never passes.
    const outcome = placedContent && !truncated ? 'pass' : 'notApplicable';
    return { ruleId: rule.ruleId, outcome, severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage, applicability };
