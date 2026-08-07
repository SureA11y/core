/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check iframe-focusable-content
 * @atomic true
 * @summary <iframe>/<frame> elements with tabindex="-1" must not contain focusable content
 * @standard WCAG 2.2
 * @sc 2.1.1
 * @applicability
 *   Applies to <iframe>/<frame> elements with an explicit negative
 *   tabindex, whose embedded document is same-origin and reachable via
 *   contentDocument (cross-origin/unreachable frames assert nothing — see
 *   implementation notes).
 * @expectation
 *   The frame's embedded document contains no focusable element. Browsers
 *   do not propagate tabindex="-1" on the host <iframe> into its embedded
 *   document: Tab can still reach focusable content inside, even though
 *   the frame itself is skipped. An author who set tabindex="-1" intending
 *   to remove the frame from the tab order has not actually done so if the
 *   embedded document contains focusable content.
 * @implementation-notes
 * - Deliberately scoped to same-origin, currently-accessible content only
 *   (contentDocument access is wrapped in try/catch and treated as "no
 *   constraint asserted" — not counted as applicable — when unreachable),
 *   matching this engine's established scope-limiting rationale (see
 *   src/core/aria-helpers.js file header) rather than guessing at
 *   cross-origin content.
 * - Focusability inside the embedded document is checked with a small,
 *   self-contained heuristic (native interactive tags + non-negative
 *   tabindex) rather than ctx.helpers.getFocusableInfo, since that helper
 *   is built for the outer document's realm/caches, not an embedded
 *   document that may be a distinct realm.
 */

const id = 'iframe-focusable-content';

const meta = {
  title: 'Frames with tabindex="-1" must not contain focusable content',
  description:
    'Checks that same-origin <iframe>/<frame> elements with tabindex="-1" do not contain focusable content, since browsers do not propagate that restriction into the frame’s embedded document.',
  i18n: {
    titleKey: 'iframeFocusableContent_title',
    descriptionKey: 'iframeFocusableContent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag211', 'structure', 'atomic', 'automatic', 'keyboard', 'iframe'],
  wcagSc: ['2.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.1.1',
      title: 'Keyboard',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '2.1.1': ['iframe-tabindex-negative-content-not-focusable'] } }
};

function runInPage(ctx) {
  const { helpers, rule, document } = ctx;

  // Self-contained rendering check for the embedded document (a distinct
  // realm — see this rule's own header comment on why the outer
  // document's shared eligibility helpers can't be reused here).
  // Deliberately checks only genuine non-rendering (display:none,
  // visibility:hidden, the hidden attribute) via the ancestor chain, NOT
  // aria-hidden: aria-hidden alone does not remove an element from a real
  // browser's native tab order (the same anti-pattern this engine's own
  // aria-hidden-focus rule exists to catch), so an aria-hidden-but-
  // visually-rendered focusable element inside the frame is still
  // genuinely reachable by keyboard and must stay flagged.
  function isRenderedInDoc(doc, el) {
    try {
      const view = doc.defaultView;
      if (!view || typeof view.getComputedStyle !== 'function') return true;
      let node = el;
      while (node && node.nodeType === 1) {
        if (node.hasAttribute && node.hasAttribute('hidden')) return false;
        const cs = view.getComputedStyle(node);
        if (cs) {
          if (cs.display === 'none') return false;
          if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
        }
        node = node.parentElement;
      }
      return true;
    } catch {
      return true;
    }
  }

  function getDeepActiveElement(docRef) {
    let cur = docRef && docRef.activeElement ? docRef.activeElement : null;
    let guard = 0;
    while (cur && cur.shadowRoot && cur.shadowRoot.activeElement && guard++ < 20) {
      cur = cur.shadowRoot.activeElement;
    }
    return cur;
  }

  function focusElementSafe(el) {
    if (!el || typeof el.focus !== 'function') return false;
    try {
      el.focus({ preventScroll: true });
      return true;
    } catch {
      try {
        el.focus();
        return true;
      } catch {
        return false;
      }
    }
  }

  function runFocusObservationWindow(win, fn) {
    if (!win || typeof fn !== 'function') return;
    const originalSetTimeout =
      typeof win.setTimeout === 'function' ? win.setTimeout.bind(win) : null;
    const originalRequestAnimationFrame =
      typeof win.requestAnimationFrame === 'function' ? win.requestAnimationFrame.bind(win) : null;
    const originalQueueMicrotask =
      typeof win.queueMicrotask === 'function' ? win.queueMicrotask.bind(win) : null;

    const queuedMicrotasks = [];
    const queuedRaf = [];
    const queuedTimers = [];
    let fakeTimerId = 1;

    const patchedSetTimeout = function (cb, delay) {
      const d = Number.isFinite(Number(delay)) ? Number(delay) : 0;
      if (typeof cb === 'function' && d <= 200) {
        const args = [];
        for (let i = 2; i < arguments.length; i++) args.push(arguments[i]);
        queuedTimers.push({ delay: d, cb: () => cb.apply(win, args) });
        return fakeTimerId++;
      }
      if (originalSetTimeout) return originalSetTimeout.apply(win, arguments);
      return fakeTimerId++;
    };

    const patchedRaf = function (cb) {
      if (typeof cb === 'function') {
        queuedRaf.push(cb);
        return fakeTimerId++;
      }
      if (originalRequestAnimationFrame) return originalRequestAnimationFrame.apply(win, arguments);
      return fakeTimerId++;
    };

    const patchedQueueMicrotask = function (cb) {
      if (typeof cb === 'function') queuedMicrotasks.push(cb);
    };

    try {
      if (originalSetTimeout) win.setTimeout = patchedSetTimeout;
      if (originalRequestAnimationFrame) win.requestAnimationFrame = patchedRaf;
      if (originalQueueMicrotask) win.queueMicrotask = patchedQueueMicrotask;
      fn();

      let guard = 0;
      while (
        (queuedMicrotasks.length || queuedRaf.length || queuedTimers.length) &&
        guard++ < 100
      ) {
        while (queuedMicrotasks.length) {
          const mt = queuedMicrotasks.shift();
          try {
            mt();
          } catch {}
        }
        while (queuedRaf.length) {
          const rf = queuedRaf.shift();
          try {
            rf(16);
          } catch {}
        }
        if (queuedTimers.length) {
          queuedTimers.sort((a, b) => a.delay - b.delay);
          const tt = queuedTimers.shift();
          try {
            tt.cb();
          } catch {}
        }
      }
    } finally {
      if (originalSetTimeout) win.setTimeout = originalSetTimeout;
      if (originalRequestAnimationFrame) win.requestAnimationFrame = originalRequestAnimationFrame;
      if (originalQueueMicrotask) win.queueMicrotask = originalQueueMicrotask;
    }
  }

  function getFocusableCandidates(doc) {
    if (!doc || !doc.querySelectorAll) return [];
    let els;
    try {
      els = doc.querySelectorAll(
        'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
          'select:not([disabled]), textarea:not([disabled]), iframe, [contenteditable="true"], [tabindex]'
      );
    } catch {
      return [];
    }
    const candidates = [];
    for (const el of els) {
      if (!el || !el.getAttribute) continue;
      const raw = el.getAttribute('tabindex');
      if (raw != null) {
        const n = Number(String(raw).trim());
        if (!Number.isNaN(n) && n < 0) continue; // explicitly removed from tab order
      }
      if (!isRenderedInDoc(doc, el)) continue; // display:none/visibility:hidden/[hidden]: never reachable at all
      candidates.push(el);
    }
    return candidates;
  }

  function probeImmediateFocusRedirect(frameEl, embeddedDoc, candidate) {
    if (!frameEl || !embeddedDoc || !candidate) return null;
    const embeddedWindow = embeddedDoc.defaultView;
    if (!embeddedWindow) return null;

    let focusedByEvent = false;
    const onFocusCapture = () => {
      focusedByEvent = true;
    };
    try {
      candidate.addEventListener('focus', onFocusCapture, true);
    } catch {}

    const innerFocusTrace = [];
    const outerFocusTrace = [];
    const onInnerFocusIn = (ev) => {
      if (ev && ev.target) innerFocusTrace.push(ev.target);
    };
    const onOuterFocusIn = (ev) => {
      if (ev && ev.target) outerFocusTrace.push(ev.target);
    };
    try {
      embeddedDoc.addEventListener('focusin', onInnerFocusIn, true);
      document.addEventListener('focusin', onOuterFocusIn, true);
    } catch {}

    const beforeInner = getDeepActiveElement(embeddedDoc);
    const beforeOuter = getDeepActiveElement(document);
    let focused = false;
    runFocusObservationWindow(embeddedWindow, () => {
      focused = focusElementSafe(candidate);
    });
    try {
      embeddedDoc.removeEventListener('focusin', onInnerFocusIn, true);
      document.removeEventListener('focusin', onOuterFocusIn, true);
    } catch {}
    try {
      candidate.removeEventListener('focus', onFocusCapture, true);
    } catch {}

    if (!focused) return null;

    const afterInner = getDeepActiveElement(embeddedDoc);
    const afterOuter = getDeepActiveElement(document);
    const sawRedirectedInnerTrace = innerFocusTrace.some((n) => n && n !== candidate);
    const sawRedirectedOuterTrace = outerFocusTrace.some(
      (n) => n && n !== frameEl && n !== candidate
    );
    const redirectedWithinFrame =
      !!(afterInner && afterInner !== candidate) || sawRedirectedInnerTrace;
    const redirectedOutOfFrame =
      !!(afterOuter && afterOuter !== frameEl) || sawRedirectedOuterTrace;
    const sawCandidateFocus = focusedByEvent || innerFocusTrace.some((n) => n === candidate);

    if (beforeInner && beforeInner !== afterInner) focusElementSafe(beforeInner);
    if (beforeOuter && beforeOuter !== afterOuter) focusElementSafe(beforeOuter);

    if (!sawCandidateFocus) return null;
    if (!redirectedWithinFrame && !redirectedOutOfFrame) return null;

    return {
      redirected: true,
      redirectedWithinFrame,
      redirectedOutOfFrame
    };
  }

  function getNegativeTabIndex(el) {
    const raw = el.getAttribute('tabindex');
    if (raw == null) return false;
    const n = Number(String(raw).trim());
    return !Number.isNaN(n) && n < 0;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe, frame')
    : helpers.queryAll('iframe, frame');

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    if (!getNegativeTabIndex(el)) continue;

    let contentDoc;
    try {
      contentDoc = el.contentDocument || null;
    } catch {
      contentDoc = null;
    }
    if (!contentDoc || !contentDoc.querySelectorAll) continue; // cross-origin/unreachable: no constraint asserted

    applicableCount += 1;

    const candidates = getFocusableCandidates(contentDoc);
    if (!candidates.length) continue;

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';
    const shouldProbe = candidates.length === 1;
    const runtimeProbe = shouldProbe
      ? probeImmediateFocusRedirect(el, contentDoc, candidates[0])
      : null;

    if (runtimeProbe && runtimeProbe.redirected) {
      cantTellOccurrences.push({
        selector: stableSelector,
        html,
        summary:
          'This frame has tabindex="-1" and a focusable candidate, but focus moves immediately to another target. Verify keyboard reachability in a real browser.',
        hint: 'If this is an intentional focus handoff, ensure keyboard users cannot remain on hidden/intermediate frame content.',
        i18n: null,
        data: {
          details: {
            reasonCode: 'IFRAME_TABINDEX_NEGATIVE_CONTENT_RUNTIME_REDIRECT',
            element: tag,
            runtimeProbe
          }
        }
      });
      continue;
    }

    failOccurrences.push({
      selector: stableSelector,
      html,
      summary:
        'This frame has tabindex="-1" but its content contains focusable elements, which remain reachable by keyboard.',
      hint: 'Remove focusable content from the frame, or remove tabindex="-1" if the frame is meant to be reachable.',
      i18n: {
        summaryKey: 'iframeFocusableContent_summary_fail',
        hintKey: 'iframeFocusableContent_hint_fail',
        params: { element: tag }
      },
      data: {
        details: { reasonCode: 'IFRAME_TABINDEX_NEGATIVE_CONTENT_FOCUSABLE', element: tag }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  // helpers.resolveTieredOutcome is unconditionally provided by dom-helpers.js
  // (see its own header comment) -- no fallback needed, matching the same
  // cleanup already applied to aria-hidden-focus.js/aria-prohibited-attr.js/
  // target-size-minimum.js.
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
