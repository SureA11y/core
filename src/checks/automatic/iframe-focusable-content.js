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
 *   contentDocument. A cross-origin or otherwise unreachable frame can't
 *   be looked into, so nothing is asserted about it.
 * @expectation
 *   The frame's embedded document contains no element in its sequential
 *   focus navigation order. A negative tabindex on the <iframe> takes its
 *   whole browsing context out of the tab order: Tab skips everything
 *   inside, so a link or control there cannot be reached by keyboard (ACT
 *   akn7bn; in Chromium, Tab goes from the element before the frame to the
 *   one after it). An element is in the order by HTML's rules, read in the
 *   frame's own document: not when disabled (:disabled, which counts a
 *   disabled <fieldset> but not its first <legend>) or inert; a tabindex
 *   that parses as an integer decides, and an invalid one ("", "abc") is
 *   ignored; otherwise links with href, form controls but hidden inputs,
 *   frames, media with controls, an <area> of an image map an <img> uses
 *   (usemap matched exactly), the first <summary> of a <details> and
 *   editing hosts (contenteditable "", "true" or "plaintext-only") are.
 *   Exception: an iframe with
 *   both a `width` and `height` HTML attribute of 2px or less (a common
 *   "tracking pixel" pattern) cannot render any perceptible content, so
 *   focusable content inside it never satisfies ACT akn7bn's "visible"
 *   requirement and doesn't count.
 * @implementation-notes
 * - Scoped to same-origin, currently-accessible content only
 *   (contentDocument access is wrapped in try/catch and treated as "no
 *   constraint asserted", not counted as applicable, when unreachable),
 *   matching this engine's established scope-limiting rationale (see
 *   src/core/aria-helpers.js file header) rather than guessing at
 *   cross-origin content.
 * - A `srcdoc` iframe's document is same-origin by definition, but some
 *   environments (notably jsdom, including this library's own Node/jsdom
 *   integration path, see docs/INTEGRATION.md) never populate
 *   `contentDocument` from the attribute. When the live document looks
 *   empty and a `srcdoc` attribute is present, its HTML string is parsed
 *   directly via DOMParser as a static fallback, no rendering pipeline
 *   needed, and a real browser's already-loaded contentDocument is always
 *   preferred untouched.
 * - Focusability inside the embedded document is checked by the rule's own
 *   reading of HTML's rules (above) rather than ctx.helpers.getFocusableInfo,
 *   since that helper is built for the outer document's realm/caches, not
 *   an embedded document that may be a distinct realm.
 */

const id = 'iframe-focusable-content';

const meta = {
  title: 'Frames with tabindex="-1" must not contain focusable content',
  description:
    'Checks that same-origin <iframe>/<frame> elements with tabindex="-1" do not contain focusable content, which keyboard users cannot reach: the negative tabindex takes the frame’s whole content out of the tab order.',
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
  const dom = ctx.helpers.dom;
  const { helpers, rule, document } = ctx;

  // Self-contained rendering check for the embedded document (a distinct
  // realm, see this rule's own header comment on why the outer
  // document's shared eligibility helpers can't be reused here).
  // Checks only genuine non-rendering (display:none,
  // visibility:hidden, the hidden attribute, the content of a closed
  // <details> and of content-visibility:hidden, hidden="until-found"
  // included) and inertness via the ancestor chain, NOT
  // aria-hidden: aria-hidden alone does not remove an element from a real
  // browser's native tab order (the same anti-pattern this engine's own
  // aria-hidden-focus rule exists to catch), so an aria-hidden-but-
  // visually-rendered focusable element inside the frame is still
  // reachable by keyboard and must stay flagged.
  function isRenderedInDoc(doc, el) {
    try {
      if (dom.get(el, 'closest') && dom.closest(el, '[inert]')) return false;
      if (typeof dom.get(el, 'checkVisibility') === 'function') {
        return dom.checkVisibility(el, { visibilityProperty: true });
      }
      const view = dom.defaultView(doc);
      if (!view || typeof view.getComputedStyle !== 'function') return true;
      let child = null;
      let node = el;
      // Bounded as a safety net only: a walk up a real tree always ends.
      for (let steps = 0; node && dom.nodeType(node) === 1 && steps < 100000; steps++) {
        if (dom.get(node, 'hasAttribute') && dom.hasAttribute(node, 'hidden')) {
          // hidden="until-found" hides the element's content, not itself.
          const v = String(dom.getAttribute(node, 'hidden') || '')
            .trim()
            .toLowerCase();
          if (v !== 'until-found' || child) return false;
        }
        // A closed <details> shows only its first <summary> child.
        if (child && dom.localName(node) === 'details' && !dom.hasAttribute(node, 'open')) {
          let first = dom.firstElementChild(node);
          while (first && dom.localName(first) !== 'summary') first = dom.nextElementSibling(first);
          if (child !== first) return false;
        }
        const cs = view.getComputedStyle(node);
        if (cs) {
          if (cs.display === 'none') return false;
          if (child && cs.contentVisibility === 'hidden') return false;
          if (!child && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) return false;
        }
        child = node;
        node = dom.parentElement(node);
      }
      return true;
    } catch {
      return true;
    }
  }

  function getDeepActiveElement(docRef) {
    let cur = docRef && dom.activeElement(docRef) ? dom.activeElement(docRef) : null;
    let guard = 0;
    while (cur && dom.shadowRoot(cur) && dom.activeElement(dom.shadowRoot(cur)) && guard++ < 20) {
      cur = dom.activeElement(dom.shadowRoot(cur));
    }
    return cur;
  }

  function focusElementSafe(el) {
    if (!el || typeof dom.get(el, 'focus') !== 'function') return false;
    try {
      dom.focus(el, { preventScroll: true });
      return true;
    } catch {
      try {
        dom.focus(el);
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

  // A tabindex value read by HTML's rules for parsing integers: leading
  // white space, an optional sign, then digits, anything after them
  // ignored. null when there are no digits: the attribute is then ignored,
  // and the element keeps the focusability it has without one.
  function parseTabIndex(raw) {
    const m = /^[\t\n\f\r ]*([+-]?)(\d+)/.exec(String(raw));
    if (!m) return null;
    const n = Number(m[2]);
    return m[1] === '-' ? -n : n;
  }

  // Whether an <area>'s <map> is used by an <img> in the same document:
  // an <area> is focusable only as part of an image map in use. A usemap
  // is "#" and the map's name (or id), matched exactly.
  function isAreaInUsedMap(doc, area) {
    try {
      const map = dom.closest(area, 'map');
      if (!map) return false;
      for (const img of dom.querySelectorAll(doc, 'img[usemap]')) {
        const ref = String(dom.getAttribute(img, 'usemap') || '');
        if (ref.charAt(0) !== '#' || ref.length < 2) continue;
        const name = ref.slice(1);
        let target = null;
        for (const m of dom.querySelectorAll(doc, 'map')) {
          if (dom.getAttribute(m, 'id') === name || dom.getAttribute(m, 'name') === name) {
            target = m;
            break;
          }
        }
        if (target === map) return true;
      }
    } catch {}
    return false;
  }

  // Whether an element is in its document's sequential focus navigation
  // order, by HTML's rules, read in the frame's own document: a disabled
  // control (:disabled, which counts a disabled <fieldset> ancestor, but not
  // from inside its first <legend>) is not; a valid tabindex decides; else
  // links, form controls, frames, media with controls, an <area> of a used
  // image map, the first <summary> of a <details> and editing hosts are.
  function isInFocusOrder(doc, el) {
    try {
      if (dom.matches(el, ':disabled')) return false;
      const raw = dom.getAttribute(el, 'tabindex');
      const index = raw == null ? null : parseTabIndex(raw);
      if (index !== null) return index >= 0;
      const tag = String(dom.localName(el) || '').toLowerCase();
      if (tag === 'a') return dom.hasAttribute(el, 'href');
      if (tag === 'area') return dom.hasAttribute(el, 'href') && isAreaInUsedMap(doc, el);
      if (tag === 'input')
        return String(dom.getAttribute(el, 'type') || '').toLowerCase() !== 'hidden';
      if (['button', 'select', 'textarea', 'iframe', 'frame'].includes(tag)) return true;
      if (tag === 'audio' || tag === 'video') return dom.hasAttribute(el, 'controls');
      if (tag === 'summary') {
        const details = dom.parentElement(el);
        if (!details || String(dom.localName(details)).toLowerCase() !== 'details') return false;
        let first = dom.firstElementChild(details);
        while (first && String(dom.localName(first)).toLowerCase() !== 'summary')
          first = dom.nextElementSibling(first);
        return first === el;
      }
      const editable = dom.getAttribute(el, 'contenteditable');
      if (editable != null) {
        return ['', 'true', 'plaintext-only'].includes(String(editable).trim().toLowerCase());
      }
    } catch {}
    return false;
  }

  function getFocusableCandidates(doc) {
    if (!doc || !dom.get(doc, 'querySelectorAll')) return [];
    let els;
    try {
      els = dom.querySelectorAll(
        doc,
        'a[href], area[href], button, input, select, textarea, iframe, frame, summary, ' +
          'audio[controls], video[controls], [contenteditable], [tabindex]'
      );
    } catch {
      return [];
    }
    const candidates = [];
    for (const el of els) {
      if (!el || !dom.get(el, 'getAttribute')) continue;
      if (!isInFocusOrder(doc, el)) continue;
      if (!isRenderedInDoc(doc, el)) continue; // display:none/visibility:hidden/[hidden]: never reachable at all
      candidates.push(el);
    }
    return candidates;
  }

  function probeImmediateFocusRedirect(frameEl, embeddedDoc, candidate) {
    if (!frameEl || !embeddedDoc || !candidate) return null;
    const embeddedWindow = dom.defaultView(embeddedDoc);
    if (!embeddedWindow) return null;

    let focusedByEvent = false;
    const onFocusCapture = () => {
      focusedByEvent = true;
    };
    try {
      dom.addEventListener(candidate, 'focus', onFocusCapture, true);
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
      dom.addEventListener(embeddedDoc, 'focusin', onInnerFocusIn, true);
      dom.addEventListener(document, 'focusin', onOuterFocusIn, true);
    } catch {}

    const beforeInner = getDeepActiveElement(embeddedDoc);
    const beforeOuter = getDeepActiveElement(document);
    let focused = false;
    runFocusObservationWindow(embeddedWindow, () => {
      focused = focusElementSafe(candidate);
    });
    try {
      dom.removeEventListener(embeddedDoc, 'focusin', onInnerFocusIn, true);
      dom.removeEventListener(document, 'focusin', onOuterFocusIn, true);
    } catch {}
    try {
      dom.removeEventListener(candidate, 'focus', onFocusCapture, true);
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
    const raw = dom.getAttribute(el, 'tabindex');
    if (raw == null) return false;
    const n = parseTabIndex(raw);
    return n !== null && n < 0;
  }

  // A `srcdoc` iframe's embedded document is same-origin by definition, but
  // some environments (jsdom, notably) never populate `contentDocument`
  // from the attribute at all. Parsing the attribute's own HTML string is a
  // static, deterministic fallback that needs no rendering pipeline. It
  // only kicks in when the live document looks empty, so a real browser's
  // already-loaded contentDocument is always preferred untouched.
  function parseSrcdocFallback(el) {
    try {
      const raw = dom.getAttribute(el, 'srcdoc');
      if (raw == null) return null;
      const view = dom.ownerDocument(el) && dom.defaultView(dom.ownerDocument(el));
      const DOMParserCtor = view && view.DOMParser;
      if (!DOMParserCtor) return null;
      return new DOMParserCtor().parseFromString(raw, 'text/html');
    } catch {
      return null;
    }
  }

  // ACT akn7bn's own Expectation only cares about focusable content that is
  // also *visible*: a 1x1 (or similar tracking-pixel-sized) iframe cannot
  // render any perceptible content, whatever's focusable inside it. Scoped
  // to the iframe's own HTML width/height attributes, a static, always-
  // readable signal, unlike computed/rendered size, which needs real
  // layout jsdom doesn't have (see docs/LIMITATIONS.md).
  function isIframeVisiblyTiny(el) {
    try {
      const wAttr = dom.getAttribute(el, 'width');
      const hAttr = dom.getAttribute(el, 'height');
      if (wAttr == null || hAttr == null) return false;
      const w = Number(String(wAttr).trim());
      const h = Number(String(hAttr).trim());
      return Number.isFinite(w) && Number.isFinite(h) && w <= 2 && h <= 2;
    } catch {
      return false;
    }
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe, frame')
    : helpers.queryAll('iframe, frame');

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!getNegativeTabIndex(el)) continue;

    let contentDoc;
    try {
      contentDoc = dom.contentDocument(el) || null;
    } catch {
      contentDoc = null;
    }
    const looksEmpty =
      !contentDoc || !dom.body(contentDoc) || !dom.hasChildNodes(dom.body(contentDoc));
    if (looksEmpty && dom.getAttribute(el, 'srcdoc') != null) {
      const parsed = parseSrcdocFallback(el);
      if (parsed) contentDoc = parsed;
    }
    if (!contentDoc || !dom.get(contentDoc, 'querySelectorAll')) continue; // cross-origin/unreachable: no constraint asserted

    applicableCount += 1;

    const candidates = getFocusableCandidates(contentDoc);
    if (!candidates.length) continue;
    if (isIframeVisiblyTiny(el)) continue; // ACT akn7bn: no visible content at all

    const tag = dom.tagName(el).toLowerCase();
    const shouldProbe = candidates.length === 1;
    const runtimeProbe = shouldProbe
      ? probeImmediateFocusRedirect(el, contentDoc, candidates[0])
      : null;

    if (runtimeProbe && runtimeProbe.redirected) {
      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This <${tag}> has tabindex="-1" and focusable content, but focus moves immediately to another target. Verify keyboard reachability in a real browser.`,
          hint: 'If this is an intentional focus handoff, make sure keyboard users cannot remain on hidden or intermediate frame content.',
          i18n: {
            summaryKey: 'iframeFocusableContent_summary_cantTell_redirect',
            hintKey: 'iframeFocusableContent_hint_cantTell_redirect',
            params: { element: tag }
          },
          uncertainty: {
            code: 'runtime-dependent',
            needed: 'Whether a keyboard user can reach this frame’s content in a real browser.',
            evidence: { element: tag, focusRedirected: true }
          },
          data: {
            details: {
              reasonCode: 'IFRAME_TABINDEX_NEGATIVE_CONTENT_RUNTIME_REDIRECT',
              element: tag,
              runtimeProbe
            }
          }
        })
      );
      continue;
    }

    failOccurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This frame has tabindex="-1" but its content contains focusable elements, which keyboard users cannot reach.',
        hint: 'Remove focusable content from the frame, or remove tabindex="-1" if the frame is meant to be reachable.',
        i18n: {
          summaryKey: 'iframeFocusableContent_summary_fail',
          hintKey: 'iframeFocusableContent_hint_fail',
          params: { element: tag }
        },
        data: {
          details: { reasonCode: 'IFRAME_TABINDEX_NEGATIVE_CONTENT_FOCUSABLE', element: tag }
        }
      })
    );
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
