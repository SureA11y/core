/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check skip-link
 * @atomic true
 * @summary A "skip" link must resolve to a real, usable target
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to <a href="#fragment"> elements that are skip links by one of
 *   two signs:
 *   - the accessible name follows a common skip-link wording in one of the
 *     shipped locales: "skip" or "jump to" (English); "aller au contenu",
 *     "passer au contenu", "accéder au contenu", "accès direct", "évitement"
 *     (French); "springen", "überspringen", "direkt zum", "zum Inhalt"
 *     (German); "saltar", "ir al contenido" (Spanish); "スキップ", "本文へ"
 *     (Japanese). "jump to" sits beside "skip" because real skip links use
 *     both conventions (e.g. a "Jump to section" link);
 *   - or it is the first link in the document, and it comes before the
 *     `main` element (or an element whose role attribute resolves to main,
 *     its first real role token in any case): the usual place of a skip link
 *     whatever its wording.
 *   Other same-page anchor links are not skip links and are left alone.
 *   Where the page has no <main> and no role="main", a custom element whose
 *   ElementInternals give it the main role (this.attachInternals().role) is
 *   the main a link's position is measured against.
 * @expectation
 *   The link's fragment resolves to a real element in the document
 *   (via a matching id, or a legacy <a name="...">), and that target is
 *   currently usable (not hidden from the accessibility tree; and, when
 *   browser geometry is available, rendered with an area that no ancestor
 *   cuts to nothing: one with `overflow: hidden` collapsed to no size, or
 *   `overflow: clip` keeping it outside). A skip link whose target is
 *   missing or effectively unusable does not provide a reliable bypass
 *   destination.
 *   An empty target (no element or text inside it), such as
 *   `<a id="content" tabindex="-1"></a>` or a legacy `<a name>`, has no area
 *   by nature: following the link moves focus, or the sequential focus
 *   navigation starting point, to it (HTML, "scroll to the fragment"), so
 *   the next Tab goes on from there. What it marks is measured instead: its
 *   nearest ancestor with content of its own, such as the <main> it opens.
 *   A `display: contents` target has no box of its own, and is measured by
 *   its children's.
 * @reports
 *   - `href`: the link's `href`.
 *   - `unusableReasonCode` (a target that is not usable): why it is not:
 *     `ACC_TREE_INELIGIBLE` when it is hidden from the accessibility tree,
 *     `NO_CLIENT_RECTS` when it is not rendered, `ZERO_AREA_TARGET` when it,
 *     or for an empty target the content it marks, has no area or is cut
 *     to nothing.
 *   - `targetSelector` (a target that is not usable): a selector for the
 *     target.
 *   - `geometryCheckEnabled` (a target that is not usable): whether the
 *     target's geometry could be measured, which needs a browser.
 *   - `viewport.width`, `viewport.height` (a target whose geometry was
 *     measured): the viewport the page was laid out in, in CSS pixels. A
 *     target hidden at one width can be usable at another.
 * @reason-codes
 *   - `SKIP_LINK_TARGET_MISSING` (cantTell): a skip link's fragment matches
 *     no element id or legacy anchor name in the document.
 *     It leans fail when the link reads as a skip link, its fragment is not
 *     a route, and an early listener hook saw no click listener on it, its
 *     ancestors, the document or the window.
 *     Basis: G1 (best practice); HTML scroll to the fragment.
 *   - `SKIP_LINK_TARGET_UNUSABLE` (cantTell): a skip link's target exists
 *     but is hidden from the accessibility tree, not rendered, or has no
 *     area.
 *     It leans fail when aria-hidden or inert hides the target and no modal
 *     dialog is open.
 *     Basis: G1 (best practice); HTML scroll to the fragment.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Keyed mainly on the wording, matching the same deliberate-leniency
 *   reasoning documented in bypass-blocks-present's implementation notes.
 *   The one positional sign is narrow on purpose: only the page's very
 *   first link, and only when a main landmark follows it, so an ordinary
 *   in-page link (a "Menu" toggle after other links, a table of contents)
 *   is not taken for a skip link.
 */

const id = 'skip-link';

const meta = {
  title: 'Skip link must have a resolvable, usable target',
  description:
    'Checks that a "skip to ..." link\'s href fragment resolves to a real, currently usable element in the document.',
  i18n: {
    titleKey: 'skipLink_title',
    descriptionKey: 'skipLink_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'keyboard', 'navigation', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    SKIP_LINK_TARGET_MISSING: {
      steps: [
        'Load the page, press Tab once or twice until the skip link the report names appears, and note its href.',
        'Press Enter to follow it.',
        'Press Tab once more and see where focus lands.'
      ],
      passWhen:
        'Following the link moves to the main content and the next Tab goes to the first control in it.',
      failWhen:
        "Nothing happens or focus stays at the top, because no element matches the link's target, so the link does not bypass repeated content (best practice, G1)."
    },
    SKIP_LINK_TARGET_UNUSABLE: {
      steps: [
        'Load the page at the window width the report gives (if any), press Tab until the skip link appears, and press Enter.',
        'Watch whether the page scrolls to the target and the target area is visible.',
        'Press Tab once more and see where focus lands.'
      ],
      passWhen:
        'The page moves to the visible main content and the next Tab goes to the first control in it.',
      failWhen:
        'The target is hidden, not shown or has no size, so focus does not move past the repeated content (best practice, G1).'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getAccessibleNameText(el) {
    const al = normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-label'));
    if (al) return al;
    const alb = normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-labelledby'));
    if (alb) {
      const parts = [];
      for (const refId of alb.split(/\s+/).filter(Boolean)) {
        try {
          const ref = helpers.getElementByIdInTree(el, refId);
          if (ref) {
            const t = normalizeWs(dom.textContent(ref));
            if (t) parts.push(t);
          }
        } catch {}
      }
      const joined = normalizeWs(parts.join(' '));
      if (joined) return joined;
    }
    return normalizeWs(dom.textContent(el));
  }

  function hasReliableGeometrySupport() {
    const probe = dom.documentElement(document) || dom.body(document) || null;
    if (!probe || !dom.get(probe, 'getClientRects') || !dom.get(probe, 'getBoundingClientRect'))
      return false;
    try {
      const rects = dom.getClientRects(probe);
      const rectCount = rects ? rects.length : 0;
      const r = dom.getBoundingClientRect(probe);
      const w = r && Number.isFinite(r.width) ? r.width : 0;
      const h = r && Number.isFinite(r.height) ? r.height : 0;
      return rectCount > 0 && (w > 0 || h > 0);
    } catch {
      return false;
    }
  }

  function toEligibility(info) {
    return {
      eligible: !!(info && info.eligible),
      reasons: info && Array.isArray(info.reasons) ? info.reasons.slice(0) : []
    };
  }

  // A target with nothing inside it, such as <a id="content" tabindex="-1">
  // </a> or a legacy <a name>, marks a point in the page (HTML, "scroll to
  // the fragment"): what it marks is the content around it, measured instead.
  function isEmptyMarker(target) {
    try {
      if (dom.firstElementChild(target)) return false;
    } catch {
      return false;
    }
    return !/\S/.test(String(dom.textContent(target) || ''));
  }
  const EMBEDDED =
    'img, svg, video, canvas, iframe, object, embed, input, select, textarea, button';
  function markedBy(target) {
    let last = target;
    for (let a = dom.parentElement(target), i = 0; a && i < 100000; a = dom.parentElement(a), i++) {
      last = a;
      try {
        if (/\S/.test(String(dom.textContent(a) || '')) || dom.querySelector(a, EMBEDDED)) return a;
      } catch {}
    }
    return last;
  }

  const geometrySupported = hasReliableGeometrySupport();
  const view = dom.defaultView(document) || null;
  function styleOf(el) {
    try {
      return view.getComputedStyle(el);
    } catch {
      return null;
    }
  }

  // The box an element's content is drawn in, as a rect, or null when none
  // is drawn. A display: contents element has no box: its children's count.
  function drawnBox(el) {
    const rects = [];
    const cs = styleOf(el);
    if (cs && cs.display === 'contents') {
      for (const child of Array.from(dom.childNodes(el) || [])) {
        if (dom.nodeType(child) === 1) {
          const r = drawnBox(child);
          if (r) rects.push(r);
        } else if (dom.nodeType(child) === 3 && /\S/.test(dom.nodeValue(child) || '')) {
          try {
            const range = dom.createRange(document);
            range.selectNodeContents(child);
            rects.push(...Array.from(dom.getClientRects(range)));
          } catch {}
        }
      }
    } else {
      try {
        rects.push(...Array.from(dom.getClientRects(el)));
      } catch {}
    }
    if (!rects.length) return null;
    const area = rects.filter((r) => r.width > 0 && r.height > 0);
    const from = area.length ? area : rects.slice(0, 1);
    const left = Math.min(...from.map((r) => r.left));
    const top = Math.min(...from.map((r) => r.top));
    const right = Math.max(...from.map((r) => r.right));
    const bottom = Math.max(...from.map((r) => r.bottom));
    const width = area.length ? right - left : 0;
    const height = area.length ? bottom - top : 0;
    return { left, top, right, bottom, width, height };
  }
  // Whether a box with area is cut to nothing by an ancestor: one with
  // overflow hidden that has collapsed to no size (a fragment link scrolls a
  // hidden box, not one of no size), or overflow clip, which never scrolls.
  function clippedAway(el, box) {
    const up = (a) =>
      typeof helpers.containingBlockOf === 'function'
        ? helpers.containingBlockOf(a)
        : dom.parentElement(a);
    const root = dom.documentElement(document);
    for (let a = up(el), i = 0; a && a !== root && i < 100000; a = up(a), i++) {
      const cs = styleOf(a);
      if (!cs) continue;
      const r = dom.getBoundingClientRect(a);
      for (const [axis, start, end, size] of [
        [cs.overflowX, 'left', 'right', dom.get(a, 'clientWidth')],
        [cs.overflowY, 'top', 'bottom', dom.get(a, 'clientHeight')]
      ]) {
        if (axis === 'hidden' && !(size > 0)) return true;
        if (
          axis === 'clip' &&
          (Math.min(box[end], r[end]) <= Math.max(box[start], r[start]) || !(size > 0))
        )
          return true;
      }
    }
    return false;
  }
  // NO_CLIENT_RECTS, ZERO_AREA_TARGET, or null when the element shows its content.
  function geometryProblem(el, own) {
    const box = drawnBox(el);
    if (!box) return own ? 'NO_CLIENT_RECTS' : 'ZERO_AREA_TARGET';
    if (!(box.width > 0 && box.height > 0) || clippedAway(el, box)) return 'ZERO_AREA_TARGET';
    return null;
  }

  // Skip-link wording in the shipped locales, one list for every rule that
  // looks for a skip link (helpers.hasSkipLinkWording, docs/RULE_HELPERS.md).
  const hasSkipWording = (name) => helpers.hasSkipLinkWording(name);

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('a[href]')
    : helpers.queryAll('a[href]');

  // The page's first link, when it comes before the main landmark, is where a
  // skip link sits whatever its wording.
  // The first custom element whose internals make it the main, or null.
  function internalsMain() {
    if (typeof helpers.getInternalsRoleElements !== 'function') return null;
    const found = helpers.getInternalsRoleElements().find((e) => e.role === 'main');
    return found ? found.el : null;
  }

  let positionalSkipLink = null;
  try {
    // The first <main>, or element whose role attribute resolves to main
    // (the first token naming a real role, in any case).
    // Failing that, a custom element whose internals make it the main.
    const main =
      Array.from(dom.querySelectorAll(document, 'main, [role~="main" i]') || []).find(
        (el) =>
          String(dom.localName(el) || '').toLowerCase() === 'main' ||
          helpers.aria.getExplicitRole(el) === 'main'
      ) || internalsMain();
    const first = nodes.length ? nodes[0] : null;
    if (
      main &&
      first &&
      typeof dom.get(first, 'compareDocumentPosition') === 'function' &&
      dom.compareDocumentPosition(first, main) & 4 // Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      positionalSkipLink = first;
    }
  } catch {
    positionalSkipLink = null;
  }

  // ---- Leans ----

  // Whether a script could take the click: an inline handler on the link
  // or an ancestor, or a click listener the hook saw on them, the document
  // or the window. null when that can't be ruled out: no listener hook, or
  // one installed after the page's scripts ran.
  function clickHandled(el) {
    for (let a = el, i = 0; a && i < 100000; a = dom.parentElement(a), i++) {
      if (dom.getAttribute(a, 'onclick') != null) return true;
    }
    if (typeof helpers.getEventListenerInfo !== 'function') return null;
    const targets = [];
    for (let a = el, i = 0; a && i < 100000; a = dom.parentElement(a), i++) targets.push(a);
    targets.push(document);
    if (view) targets.push(view);
    for (const t of targets) {
      const info = helpers.getEventListenerInfo(t, ['click']);
      if (!info || info.hook !== 'early') return null;
      if (info.listens) return true;
    }
    return false;
  }

  // A link that says it skips, pointing at an id that doesn't exist, with
  // no script to take the click, goes nowhere. One taken for a skip link
  // only by its place, or whose fragment is a route ("#/home", "#!x"),
  // gets no lean.
  function missingTargetLean(el, name, fragment) {
    if (!hasSkipWording(name)) return null;
    if (/^[/!]/.test(fragment)) return null;
    if (clickHandled(el) !== false) return null;
    return {
      toward: 'fail',
      why: 'The link reads as a skip link, its target does not exist, and no script on the page listens for its click.',
      signals: [
        { signal: 'matched-by-wording', value: true },
        { signal: 'click-listener', value: false },
        { signal: 'hash-route-shape', value: false }
      ],
      caution:
        'The target may still be added later by script, such as content that loads after the scan.',
      i18n: {
        whyKey: 'skipLink_lean_why_missing',
        cautionKey: 'skipLink_lean_caution_missing'
      }
    };
  }

  // A target taken out of the accessibility tree by aria-hidden or inert,
  // with no modal dialog open to explain it, defeats the link at any width.
  // A target hidden by display or by its size depends on the viewport, and
  // gets no lean.
  function unusableTargetLean(reasons) {
    const hiddenBy = ['ariaHidden', 'inert'].find((r) => reasons.indexOf(r) !== -1);
    if (!hiddenBy || reasons.indexOf('displayNone') !== -1 || reasons.indexOf('hiddenAttr') !== -1)
      return null;
    const modalOpen = !!(helpers.isModalDialogOpen && helpers.isModalDialogOpen());
    if (modalOpen) return null;
    return {
      toward: 'fail',
      why: 'The target is hidden from assistive technology by aria-hidden or inert, and no modal dialog is open to explain it.',
      signals: [
        { signal: 'unusable-reason-code', value: 'ACC_TREE_INELIGIBLE' },
        { signal: 'acc-ineligible-reasons', value: hiddenBy },
        { signal: 'modal-dialog-open', value: false }
      ],
      caution:
        'A dialog built without the <dialog> element may make the page inert while it is open.',
      i18n: {
        whyKey: 'skipLink_lean_why_hiddenTarget',
        cautionKey: 'skipLink_lean_caution_hiddenTarget'
      }
    };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const href = String(dom.getAttribute(el, 'href') || '').trim();
    if (href.length < 2 || href.charAt(0) !== '#') continue;

    const name = getAccessibleNameText(el);
    if (el !== positionalSkipLink && !hasSkipWording(name)) continue;

    applicableCount += 1;

    let fragment = href.slice(1);
    try {
      fragment = decodeURIComponent(fragment);
    } catch {}
    fragment = fragment.trim();

    let target = null;
    if (fragment) {
      try {
        // eslint-disable-next-line safe-dom/tree-scoped-ids -- a fragment link's target is looked up in the document (HTML's indicated part of the document)
        target = dom.getElementById(document, fragment);
      } catch {
        target = null;
      }
      if (!target) {
        // A legacy <a name>, compared as an attribute rather than built into a
        // selector, which a backslash or quote in the name would break.
        try {
          target =
            Array.from(dom.querySelectorAll(document, 'a[name]')).find(
              (a) => dom.getAttribute(a, 'name') === fragment
            ) || null;
        } catch {
          target = null;
        }
      }
    }

    if (target) {
      const accEligibility = toEligibility(
        helpers.getEligibilityInfo
          ? helpers.getEligibilityInfo(target, ctx, { targetSet: 'acc' })
          : helpers.isAccTreeEligible
            ? helpers.isAccTreeEligible(target, ctx)
            : { eligible: true, reasons: [] }
      );

      let geometryEligibility = null;
      let geometryReasonCode = null;
      if (geometrySupported && helpers.isDomVisibleEligible) {
        geometryEligibility = toEligibility(
          helpers.isDomVisibleEligible(target, ctx, {
            visibilityMode: 'styleAndGeometry',
            ignoreOpacity: true
          })
        );
        const reasons = geometryEligibility.reasons;
        if (
          geometryEligibility.eligible ||
          reasons.includes('noClientRects') ||
          reasons.includes('zeroArea')
        ) {
          geometryReasonCode = isEmptyMarker(target)
            ? geometryProblem(markedBy(target), false)
            : geometryProblem(target, true);
        }
      }

      const unusableByAcc = !accEligibility.eligible;
      const unusableByGeometry = !!geometryReasonCode;
      if (!unusableByAcc && !unusableByGeometry) continue;
      const unusableLean = unusableByAcc ? unusableTargetLean(accEligibility.reasons) : null;

      occurrences.push(
        helpers.reportOccurrence(el, {
          ...(unusableLean ? { lean: unusableLean } : {}),
          summary:
            "This skip link points to an element that exists but can't be reached right now.",
          hint: 'Point it at an element that is visible and not hidden from assistive technology.',
          i18n: {
            summaryKey: 'skipLink_summary_unusableTarget_cantTell',
            hintKey: 'skipLink_hint_unusableTarget_cantTell',
            params: { href }
          },
          data: {
            details: {
              reasonCode: 'SKIP_LINK_TARGET_UNUSABLE',
              href,
              unusableReasonCode: unusableByAcc ? 'ACC_TREE_INELIGIBLE' : geometryReasonCode,
              targetSelector: helpers.buildSelector ? helpers.buildSelector(target) : null,
              geometryCheckEnabled: geometrySupported,
              // A target hidden at one breakpoint may be shown at another.
              ...(geometrySupported && view
                ? { viewport: { width: view.innerWidth, height: view.innerHeight } }
                : {})
            },
            visibilityFilter: {
              targetSet: 'acc',
              accEligible: accEligibility.eligible,
              reasons: accEligibility.reasons
            },
            targetGeometry: geometryEligibility
              ? { eligible: geometryEligibility.eligible, reasons: geometryEligibility.reasons }
              : { eligible: null, reasons: [] }
          }
        })
      );
      continue;
    }

    const missingLean = missingTargetLean(el, name, fragment);
    occurrences.push(
      helpers.reportOccurrence(el, {
        ...(missingLean ? { lean: missingLean } : {}),
        summary: "The target of this skip link doesn't exist.",
        hint: "Point the skip link's href at an id that exists in the document, or add the missing target element.",
        i18n: {
          summaryKey: 'skipLink_summary_cantTell',
          hintKey: 'skipLink_hint_cantTell',
          params: { href }
        },
        data: {
          details: { reasonCode: 'SKIP_LINK_TARGET_MISSING', href }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
