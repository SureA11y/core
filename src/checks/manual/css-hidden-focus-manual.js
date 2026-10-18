/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check css-hidden-focus
 * @atomic true
 * @summary focusable elements must be visible to sighted keyboard users
 * @standard WCAG 2.2
 * @sc 2.4.7
 * @applicability
 *   Applies to elements that are tabbable (keyboard-focusable) but are visually hidden
 *   via CSS techniques that can leave them in the tab order.
 * @expectation
 *   No element should be tabbable while visually hidden (e.g., opacity:0, clipped, off-screen).
 *   An element that CSS brings back into view when it takes focus is not
 *   hidden while focused, and is not flagged: the usual skip-link pattern
 *   (`.skip { position: absolute; left: -9999px } .skip:focus { left: 0 }`),
 *   or a hiding rule that stops applying on focus
 *   (`.visually-hidden-focusable:not(:focus) { clip: rect(0 0 0 0) }`).
 * @reports
 *   - `metrics.visibilityHints`: how the element is hidden while it can
 *     take focus: `opacityZero`, `offscreen`, `clipped` or
 *     `zeroSizeOverflowHidden` (no size, with overflow hidden) by its own
 *     styles; when they show it, `outOfReach` (a container is positioned
 *     off screen, or, in a browser, the box focus would show lies where no
 *     scrolling reaches) or `containerClipped` (a container is clipped to
 *     nothing, or has no size with overflow hidden).
 *   - `runtimeProbe`: `null` unless focusing the element moved focus
 *     straight to another element
 *     (`cssHiddenTabbable_runtimeRedirect_needsReview`). Then it holds
 *     `redirected: true` and the tag and id of the element focus moved to
 *     (`redirectedToTag`, `redirectedToId`). Only the first three hidden
 *     elements are tried this way.
 * @implementation-notes
 * - This rule intentionally targets CSS techniques that *can* keep an element focusable.
 * - Elements removed from rendering (display:none, visibility:hidden, [hidden]) are excluded.
 * - The element's own styles and its containers' are read from computed
 *   style, which jsdom has too. Only in a browser is the rendered box also
 *   measured, to find a container slid out of view by a transform: focus
 *   scrolls the scroll containers the element is in, so the outermost one
 *   below <body> is what is measured. A container at opacity 0 is not
 *   counted, and neither is a container that a :focus-within (or other
 *   focus) rule reaches, since it may come into view with the focus.
 * - The focused style is worked out from the stylesheets, not by focusing the
 *   element: a DOM emulator does not restyle `:focus`. Rules whose subject
 *   carries `:focus`, `:focus-visible` or `:focus-within` (or an ancestor
 *   carries `:focus-within`) are laid over the computed style in document
 *   order; a rule written `:not(:focus)` / `:not(:focus-within)` /
 *   `:not(:focus-visible)` has its declarations reset to their initial values.
 *   Inline style outranks a stylesheet rule unless the rule is `!important`.
 *   The overlay ignores specificity among the focus rules, and cross-origin
 *   stylesheets cannot be read, so their focus rules are not seen.
 * - To see whether the page redirects focus, up to three candidates are
 *   focused for a moment. Focus then goes back where it was, or is blurred
 *   when nothing had it, so the rules after this one and a later scan see
 *   the page as it was. The page's own focus handlers still run.
 */

const id = 'css-hidden-focus';

const meta = {
  title: 'Focusable elements must not be visually hidden',
  description:
    'Checks that keyboard-focusable elements are not visually hidden by CSS techniques that can leave them in the tab order.',
  i18n: {
    titleKey: 'cssHidden_focus_title',
    descriptionKey: 'cssHidden_focus_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag247', 'navigation', 'focus', 'css', 'atomic', 'manual'],
  wcagSc: ['2.4.7'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.7',
      title: 'Focus Visible',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: {
    facetsBySc: {
      '2.4.7': ['css-hidden-focusable']
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  const isDomVisibleEligible =
    helpers && typeof helpers.isDomVisibleEligible === 'function'
      ? helpers.isDomVisibleEligible
      : null;
  const reportOccurrence =
    helpers && typeof helpers.reportOccurrence === 'function' ? helpers.reportOccurrence : null;

  const trim = (v) => (v == null ? '' : String(v)).trim();
  const lower = (v) => trim(v).toLowerCase();

  function qAll(sel) {
    try {
      if (queryAllSmart) {
        const r = queryAllSmart(sel);
        if (Array.isArray(r)) return r;
        return Array.from(r || []);
      }
    } catch {
      // fall through
    }
    try {
      if (safeRoot && typeof dom.get(safeRoot, 'querySelectorAll') === 'function')
        return Array.from(dom.querySelectorAll(safeRoot, sel));
    } catch {
      // fall through
    }
    return [];
  }

  function getComputedStyleSafe(el) {
    try {
      const w =
        document && dom.defaultView(document)
          ? dom.defaultView(document)
          : typeof window !== 'undefined'
            ? window
            : null;
      return w && w.getComputedStyle ? w.getComputedStyle(el) : null;
    } catch {
      return null;
    }
  }

  // Returns deterministic "visually hidden but can remain focusable" hints.
  function getVisibilityHints(el) {
    if (!el) return [];
    return hintsFromStyle(getComputedStyleSafe(el));
  }

  // The same hints, read off any object carrying the computed-style fields
  // used below (a CSSStyleDeclaration, or the focused-state overlay).
  function hintsFromStyle(cs) {
    const out = [];

    // opacity:0
    try {
      const rawOp = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
      const op = rawOp ? Number.parseFloat(rawOp) : 1;
      if (Number.isFinite(op) && op <= 0.0001) out.push('opacityZero');
    } catch {}

    // clip / clip-path
    try {
      if (helpers.isClipHidden(cs)) out.push('clipped');
    } catch {}

    // zero-size + overflow hidden/clip
    try {
      const wv = cs && cs.width != null ? String(cs.width).trim() : '';
      const hv = cs && cs.height != null ? String(cs.height).trim() : '';
      const ov = cs && cs.overflow != null ? String(cs.overflow).trim().toLowerCase() : '';
      const isZeroW = wv === '0px' || wv === '0';
      const isZeroH = hv === '0px' || hv === '0';
      const hidesOverflow = ov === 'hidden' || ov === 'clip';
      if ((isZeroW || isZeroH) && hidesOverflow) out.push('zeroSizeOverflowHidden');
    } catch {}

    // off-screen heuristic (absolute/fixed + left/top <= -5000 OR text-indent <= -5000)
    try {
      const pos = cs && cs.position != null ? String(cs.position).trim().toLowerCase() : '';
      const left = cs && cs.left != null ? String(cs.left).trim().toLowerCase() : '';
      const top = cs && cs.top != null ? String(cs.top).trim().toLowerCase() : '';
      const ti = cs && cs.textIndent != null ? String(cs.textIndent).trim().toLowerCase() : '';

      const parsePx = (s) => {
        if (!s || s === 'auto') return null;
        const m = String(s).match(/-?\d+(\.\d+)?/);
        if (!m) return null;
        const n = Number.parseFloat(m[0]);
        return Number.isFinite(n) ? n : null;
      };

      const l = parsePx(left);
      const t = parsePx(top);
      const ind = parsePx(ti);

      if (pos === 'absolute' || pos === 'fixed') {
        if ((l != null && l <= -5000) || (t != null && t <= -5000)) out.push('offscreen');
      }
      if (ind != null && ind <= -5000) out.push('offscreen');
    } catch {}

    // Dedup
    const seen = new Set();
    const uniq = [];
    for (const k of out) {
      const kk = String(k);
      if (!seen.has(kk)) {
        seen.add(kk);
        uniq.push(kk);
      }
    }
    return uniq;
  }

  // ---- Focused state, worked out from the stylesheets ----
  const CSS_STYLE_RULE = 1;
  const MAX_RULE_DEPTH = 10;
  const FOCUS_STATE = /:focus(?:-visible|-within)?(?![-\w])/g;
  const OWN_FOCUS_STATE = /:focus(?:-visible)?(?![-\w])/;
  const NOT_FOCUS_STATE = /:not\(\s*:focus(?:-visible|-within)?\s*\)/g;
  // Longhand name -> computed-style field read by hintsFromStyle.
  const HINT_PROPS = {
    opacity: 'opacity',
    clip: 'clip',
    'clip-path': 'clipPath',
    width: 'width',
    height: 'height',
    overflow: 'overflow',
    position: 'position',
    left: 'left',
    top: 'top',
    'text-indent': 'textIndent',
    transform: 'transform',
    translate: 'translate'
  };
  const INITIAL_VALUES = {
    opacity: '1',
    clip: 'auto',
    'clip-path': 'none',
    width: 'auto',
    height: 'auto',
    overflow: 'visible',
    position: 'static',
    left: 'auto',
    top: 'auto',
    'text-indent': '0px',
    transform: 'none',
    translate: 'none'
  };

  function splitTopLevel(text, separators) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of String(text || '')) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && separators.indexOf(ch) !== -1) {
        parts.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    parts.push(current);
    return parts.map(trim).filter(Boolean);
  }

  function hasPseudoElement(part) {
    return /::[a-z-]+/i.test(part) || /:(before|after)\b/i.test(part);
  }

  // Selector for the element while it has focus, or null when the rule
  // cannot apply to it then (`.a:focus .b`: .a cannot have focus while .b
  // does).
  function focusedBase(part) {
    const compounds = splitTopLevel(part, [' ', '>', '+', '~']);
    for (let i = 0; i < compounds.length - 1; i++) {
      if (OWN_FOCUS_STATE.test(compounds[i])) return null;
    }
    // `:focus` standing alone in a compound becomes `*`, then every focus
    // state is dropped: while focused, the element matches them all.
    return trim(part.replace(/(^|[\s>+~(])(?=:focus)/g, '$1*').replace(FOCUS_STATE, '')) || '*';
  }

  const ESCAPED_COLON = '\u0001';
  function unescapeColons(selector) {
    return selector.split(ESCAPED_COLON).join('\\:');
  }

  let focusRules = null;
  function getFocusRules() {
    if (focusRules) return focusRules;
    focusRules = [];
    function consider(cssRule) {
      const style = cssRule.style;
      if (!style) return;
      const props = Object.keys(HINT_PROPS).filter((p) => trim(style.getPropertyValue(p)));
      if (!props.length) return;
      for (const raw of splitTopLevel(cssRule.selectorText, [','])) {
        // A colon escaped with a backslash is part of a name, not a
        // pseudo-class: GOV.UK Frontend styles a class called ":focus" as
        // `.\:focus`. Escaped colons are hidden from the focus patterns
        // and put back in the selector the element is matched against.
        const part = raw.replace(/\\:/g, ESCAPED_COLON);
        if (hasPseudoElement(part)) continue;
        NOT_FOCUS_STATE.lastIndex = 0;
        if (NOT_FOCUS_STATE.test(part)) {
          const base = trim(part.replace(NOT_FOCUS_STATE, '')) || '*';
          FOCUS_STATE.lastIndex = 0;
          if (!FOCUS_STATE.test(base))
            focusRules.push({
              kind: 'notFocus',
              base: unescapeColons(base),
              style,
              props,
              within: /:focus-within/.test(part)
            });
          continue;
        }
        FOCUS_STATE.lastIndex = 0;
        if (!FOCUS_STATE.test(part)) continue;
        const base = focusedBase(part);
        if (base)
          focusRules.push({
            kind: 'focus',
            base: unescapeColons(base),
            style,
            props,
            within: /:focus-within/.test(part)
          });
      }
    }
    function walk(rules, depth) {
      if (!rules || depth > MAX_RULE_DEPTH) return;
      for (const cssRule of rules) {
        if (!cssRule) continue;
        if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
          consider(cssRule);
          continue;
        }
        let nested;
        try {
          nested = cssRule.cssRules || null;
        } catch {
          nested = null;
        }
        if (nested) walk(nested, depth + 1);
      }
    }
    try {
      for (const sheet of dom.styleSheets(document) || []) {
        // Another origin's sheet: its text from engineOptions.styleSheetTexts, if
        // given (helpers.cssRulesOf); otherwise not inspectable.
        let rules = null;
        try {
          rules = helpers.cssRulesOf ? helpers.cssRulesOf(sheet) : sheet && sheet.cssRules;
        } catch {
          continue;
        }
        if (rules) walk(rules, 0);
      }
    } catch {
      // no readable stylesheets
    }
    return focusRules;
  }

  function matchesSafe(el, selector) {
    try {
      return typeof dom.get(el, 'matches') === 'function' && dom.matches(el, selector);
    } catch {
      return false;
    }
  }

  // The visibility hints the element would have while focused, or null when
  // no focus-dependent rule reaches it.
  function focusedVisibilityHints(el) {
    const rules = getFocusRules().filter((r) => matchesSafe(el, r.base));
    if (!rules.length) return null;
    const inline = dom.get(el, 'style') || null;
    const inlineHas = (p) => {
      try {
        return !!(inline && trim(inline.getPropertyValue(p)));
      } catch {
        return false;
      }
    };
    const overlay = {};
    for (const r of rules) {
      if (r.kind !== 'notFocus') continue;
      for (const p of r.props) if (!inlineHas(p)) overlay[p] = INITIAL_VALUES[p];
    }
    for (const r of rules) {
      if (r.kind !== 'focus') continue;
      for (const p of r.props) {
        const important = String(r.style.getPropertyPriority(p) || '') === 'important';
        if (inlineHas(p) && !important) continue;
        overlay[p] = trim(r.style.getPropertyValue(p));
      }
    }
    const cs = getComputedStyleSafe(el);
    const focused = {};
    for (const p of Object.keys(HINT_PROPS)) {
      const field = HINT_PROPS[p];
      focused[field] = Object.prototype.hasOwnProperty.call(overlay, p)
        ? overlay[p]
        : cs
          ? cs[field]
          : '';
    }
    return hintsFromStyle(focused);
  }

  function getFocusableInfoSafe(el) {
    if (!getFocusableInfo) return null;
    try {
      return getFocusableInfo(el, ctx);
    } catch {
      return null;
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

  function runFocusObservationWindow(docRef, fn) {
    const w =
      docRef && dom.defaultView(docRef)
        ? dom.defaultView(docRef)
        : typeof window !== 'undefined'
          ? window
          : null;
    if (!w || typeof fn !== 'function') return;

    const originalSetTimeout = typeof w.setTimeout === 'function' ? w.setTimeout.bind(w) : null;
    const originalRequestAnimationFrame =
      typeof w.requestAnimationFrame === 'function' ? w.requestAnimationFrame.bind(w) : null;
    const originalQueueMicrotask =
      typeof w.queueMicrotask === 'function' ? w.queueMicrotask.bind(w) : null;

    const queuedMicrotasks = [];
    const queuedRaf = [];
    const queuedTimers = [];
    let fakeTimerId = 1;

    const patchedSetTimeout = function (cb, delay) {
      const d = Number.isFinite(Number(delay)) ? Number(delay) : 0;
      if (typeof cb === 'function' && d <= 200) {
        const args = [];
        for (let i = 2; i < arguments.length; i++) args.push(arguments[i]);
        queuedTimers.push({ delay: d, cb: () => cb.apply(w, args) });
        return fakeTimerId++;
      }
      if (originalSetTimeout) return originalSetTimeout.apply(w, arguments);
      return fakeTimerId++;
    };

    const patchedRaf = function (cb) {
      if (typeof cb === 'function') {
        queuedRaf.push(cb);
        return fakeTimerId++;
      }
      if (originalRequestAnimationFrame) return originalRequestAnimationFrame.apply(w, arguments);
      return fakeTimerId++;
    };

    const patchedQueueMicrotask = function (cb) {
      if (typeof cb === 'function') queuedMicrotasks.push(cb);
    };

    try {
      if (originalSetTimeout) w.setTimeout = patchedSetTimeout;
      if (originalRequestAnimationFrame) w.requestAnimationFrame = patchedRaf;
      if (originalQueueMicrotask) w.queueMicrotask = patchedQueueMicrotask;
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
      if (originalSetTimeout) w.setTimeout = originalSetTimeout;
      if (originalRequestAnimationFrame) w.requestAnimationFrame = originalRequestAnimationFrame;
      if (originalQueueMicrotask) w.queueMicrotask = originalQueueMicrotask;
    }
  }

  // Put focus back where it was before a probe. Focusing the body does
  // nothing, so when nothing had focus the probed element (or wherever the
  // page sent focus) is blurred instead. Left focused, a skip link that CSS
  // reveals on focus would be visible to every rule after this one and to
  // the next scan of the page.
  function restoreFocus(before) {
    const now = getDeepActiveElement(document);
    if (now === before) return;
    const hadFocus =
      before && before !== dom.body(document) && before !== dom.documentElement(document);
    if (hadFocus && focusElementSafe(before) && getDeepActiveElement(document) === before) return;
    try {
      if (now && typeof dom.get(now, 'blur') === 'function') dom.blur(now);
    } catch {}
  }

  function probeImmediateFocusRedirect(candidate) {
    if (!candidate || typeof dom.get(candidate, 'addEventListener') !== 'function') return null;

    let focusedByEvent = false;
    const onFocusCapture = () => {
      focusedByEvent = true;
    };
    try {
      dom.addEventListener(candidate, 'focus', onFocusCapture, true);
    } catch {}

    const before = getDeepActiveElement(document);
    let focused = false;
    runFocusObservationWindow(document, () => {
      focused = focusElementSafe(candidate);
    });

    try {
      dom.removeEventListener(candidate, 'focus', onFocusCapture, true);
    } catch {}
    if (!focused || !focusedByEvent) return null;

    const after = getDeepActiveElement(document);
    restoreFocus(before);

    if (!after || after === candidate) return null;
    const redirectedTag = (() => {
      try {
        return lower(dom.tagName(after) || '');
      } catch {
        return '';
      }
    })();
    const redirectedId = (() => {
      try {
        return trim(dom.get(after, 'getAttribute') && dom.getAttribute(after, 'id'));
      } catch {
        return '';
      }
    })();
    return {
      redirected: true,
      redirectedToTag: redirectedTag || null,
      redirectedToId: redirectedId || null
    };
  }

  // ---- Hidden by a container ----
  // The element's own styles may show it while a container hides it: a link
  // in a closed off-canvas menu moved off screen (left: -9999px) or slid
  // away (transform: translateX(-100%)), or in a box clipped to nothing.
  const containerStyleCache = new Map();
  function containerStyleHints(c) {
    if (!containerStyleCache.has(c)) {
      const hs = hintsFromStyle(getComputedStyleSafe(c));
      const out = [];
      // A container at opacity 0 is left out: content faded in on scroll
      // is seen by the time a reader gets to it.
      if (hs.includes('offscreen')) out.push('outOfReach');
      if (hs.includes('clipped') || hs.includes('zeroSizeOverflowHidden'))
        out.push('containerClipped');
      containerStyleCache.set(c, out);
    }
    return containerStyleCache.get(c);
  }

  const parentOf = (n) =>
    helpers.flatParentElement ? helpers.flatParentElement(n) : dom.parentNode(n);
  const htmlEl = dom.documentElement(document);
  const bodyEl = dom.body(document);

  function containersOf(el) {
    const out = [];
    let c = parentOf(el);
    for (let steps = 0; c && c !== htmlEl && steps < 200; steps++) {
      if (dom.nodeType(c) === 1) out.push(c);
      c = parentOf(c);
    }
    return out;
  }

  // What an element's containers say, worked out once per container and
  // inherited by everything inside it, so a page costs one pass rather than
  // one walk up the tree per focusable element: whether one is positioned off
  // screen (outOfReach) or clipped to nothing (clipped), the outermost scroll
  // container below <body> (box), and whether one is fixed to the viewport.
  const NO_CONTAINER = { outOfReach: false, clipped: false, box: null, fixed: false };
  const scrolls = (v) => v === 'hidden' || v === 'auto' || v === 'scroll';
  const chainCache = new Map();
  function chainOf(c) {
    if (!c || c === htmlEl) return NO_CONTAINER;
    if (chainCache.has(c)) return chainCache.get(c);
    const pending = [];
    let n = c;
    while (n && n !== htmlEl && !chainCache.has(n) && pending.length < 200) {
      pending.push(n);
      n = parentOf(n);
    }
    let acc = n && chainCache.has(n) ? chainCache.get(n) : NO_CONTAINER;
    // Outermost first, so an ancestor's scroll container wins over a nearer one.
    for (let k = pending.length - 1; k >= 0; k--) {
      const e = pending[k];
      if (dom.nodeType(e) !== 1) {
        chainCache.set(e, acc);
        continue;
      }
      const own = containerStyleHints(e);
      const cs = e === bodyEl ? null : getComputedStyleSafe(e);
      acc = {
        outOfReach: acc.outOfReach || own.includes('outOfReach'),
        clipped: acc.clipped || own.includes('containerClipped'),
        box: acc.box || (cs && (scrolls(cs.overflowX) || scrolls(cs.overflowY)) ? e : null),
        fixed: acc.fixed || (!!cs && cs.position === 'fixed')
      };
      chainCache.set(e, acc);
    }
    return acc;
  }

  const view = (() => {
    try {
      return dom.defaultView(document) || null;
    } catch {
      return null;
    }
  })();
  // The page's own measures, read once: whether it has a layout at all, the
  // viewport, the scroll offset and extent, and its writing direction.
  let page = null;
  function pageGeometry() {
    if (page) return page;
    page = { layout: false };
    try {
      const r = dom.getBoundingClientRect(htmlEl);
      if (!view || !r || !(r.width > 0 || r.height > 0)) return page;
      const rootCs = getComputedStyleSafe(htmlEl);
      const quirks = dom.get(document, 'compatMode') === 'BackCompat';
      const se = quirks ? bodyEl : htmlEl;
      page = {
        layout: true,
        vw: Number(view.innerWidth) || 0,
        vh: Number(view.innerHeight) || 0,
        sx: Number(view.scrollX) || 0,
        sy: Number(view.scrollY) || 0,
        sw: Number(se && dom.get(se, 'scrollWidth')) || 0,
        sh: Number(se && dom.get(se, 'scrollHeight')) || 0,
        rtl: !!rootCs && rootCs.direction === 'rtl'
      };
    } catch {
      page = { layout: false };
    }
    return page;
  }

  // In a browser: whether the box focus would show lies where no scrolling
  // can bring it into view. Focus scrolls any scroll container the element
  // is in, so the box judged is that of the outermost one below <body>, or
  // the element's own when it is in none. A box fixed to the viewport is out
  // of reach when it is wholly outside the viewport; any other box when it
  // is wholly above or before the page's start (left of it, on a
  // left-to-right page) or past the extent the page scrolls to.
  function outOfReachByLayout(el, chain) {
    const g = pageGeometry();
    if (!g.layout) return false;
    const ownCs = getComputedStyleSafe(el);
    const box = chain.box || el;
    const fixed = chain.fixed || (!!ownCs && ownCs.position === 'fixed');
    let r;
    try {
      r = dom.getBoundingClientRect(box);
    } catch {
      return false;
    }
    if (!r) return false;
    // Wholly past an edge, and starting past it: a box with no width or
    // height that sits on the edge (an inline link around a block image, at
    // x = 0) is not out of reach.
    if (fixed) {
      if (!g.vw || !g.vh) return false;
      return (
        (r.right <= 0 && r.left < 0) ||
        (r.bottom <= 0 && r.top < 0) ||
        (r.left >= g.vw && r.right > g.vw) ||
        (r.top >= g.vh && r.bottom > g.vh)
      );
    }
    if (r.bottom + g.sy <= 0 && r.top + g.sy < 0) return true;
    if (g.sh && r.top + g.sy >= g.sh && r.bottom + g.sy > g.sh) return true;
    if (!g.rtl) {
      if (r.right + g.sx <= 0 && r.left + g.sx < 0) return true;
      if (g.sw && r.left + g.sx >= g.sw && r.right + g.sx > g.sw) return true;
    }
    return false;
  }

  // The hints an element's containers give it; `containers` is listed only
  // when there are some, for containerShownOnFocus.
  function containerHints(el) {
    const chain = chainOf(parentOf(el));
    const outOfReach = chain.outOfReach || outOfReachByLayout(el, chain);
    const hints = [];
    if (outOfReach) hints.push('outOfReach');
    if (chain.clipped) hints.push('containerClipped');
    return { hints, containers: hints.length ? containersOf(el) : [] };
  }

  // A :focus-within rule that reaches a container (`.menu:focus-within`,
  // `.menu:focus-within .panel`, or one written `:not(:focus-within)`) may
  // bring it into view when the element takes focus. The engine can't tell
  // what it does, so the element is not asked about. A plain :focus rule
  // can't apply to a container while the element inside it has the focus.
  function containerShownOnFocus(containers) {
    const rules = getFocusRules().filter((r) => r.within);
    if (!rules.length) return false;
    return containers.some((c) => rules.some((r) => matchesSafe(c, r.base)));
  }

  function isTabbable(el, info) {
    const f = info || getFocusableInfoSafe(el);
    return !!(f && f.focusable && f.tabbable);
  }

  // Exclude elements that are not rendered / not in the visual rendering tree.
  function isRendered(el) {
    if (!isDomVisibleEligible) return true;
    try {
      const vis = isDomVisibleEligible(el, ctx, {
        visibilityMode: 'styleOnly',
        disableGeometry: true
      });
      if (vis && vis.eligible === false) {
        const rs = Array.isArray(vis.reasons) ? vis.reasons : [];
        // We *include* opacityZero in this rule. Everything else is treated as not rendered for this purpose.
        const nonOpacity = rs.filter((r) => String(r) !== 'opacityZero');
        if (nonOpacity.length) return false;
      }
    } catch {
      // If in doubt, keep deterministic behavior and consider it rendered.
    }
    return true;
  }
  const candidates = qAll(
    'a[href],area[href],button,input,select,textarea,summary,[tabindex],[contenteditable]'
  );
  if (!candidates.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  const maxRuntimeProbeCount = 3;
  let runtimeProbeCount = 0;

  // Two passes: every element is measured first, and only then are the
  // flagged ones focused for the redirect probe. Focusing restyles the page,
  // so a measurement after it would make the browser lay the page out again.
  const flagged = [];
  for (const el of candidates) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const finfo = getFocusableInfoSafe(el);
    if (!isTabbable(el, finfo)) continue;

    // Skip elements not rendered (display:none, visibility:hidden, [hidden], etc.)
    if (!isRendered(el)) continue;

    let hints = getVisibilityHints(el);
    if (hints.length) {
      // Brought back into view when it takes focus: visible while focused.
      const whenFocused = focusedVisibilityHints(el);
      if (whenFocused && !whenFocused.length) continue;
    } else {
      // Its own styles show it; a container may still hide it.
      const byContainer = containerHints(el);
      if (!byContainer.hints.length) continue; // <-- applicability gate
      if (containerShownOnFocus(byContainer.containers)) continue;
      // Its own focus rule may move it into view (a skip link slid in with
      // `:focus { transform: none }`), which its hints can't show.
      if (getFocusRules().some((r) => matchesSafe(el, r.base))) continue;
      hints = byContainer.hints;
    }
    flagged.push({ el, hints });
  }

  for (const { el, hints } of flagged) {
    const tagName = (() => {
      try {
        return lower(dom.tagName(el) || '');
      } catch {
        return '';
      }
    })();

    const hintOrder = [
      'opacityZero',
      'offscreen',
      'clipped',
      'zeroSizeOverflowHidden',
      'outOfReach',
      'containerClipped'
    ];
    const hintsArr = [];
    for (const k of hintOrder) if (hints.includes(k)) hintsArr.push(k);

    const runtimeProbe =
      runtimeProbeCount < maxRuntimeProbeCount ? probeImmediateFocusRedirect(el) : null;
    if (runtimeProbeCount < maxRuntimeProbeCount) runtimeProbeCount += 1;
    const downgradedToRedirectReview = !!(runtimeProbe && runtimeProbe.redirected);

    const baseOccurrence = {
      summary: downgradedToRedirectReview
        ? `This focusable <${tagName}> can't be seen, but focus moved straight on to another element, as a focus trap's sentinel does.`
        : `Focusable ${tagName} is visually hidden (${hintsArr.join(',')}).`,
      hint: downgradedToRedirectReview
        ? 'Check that this is a deliberate focus handoff, and that keyboard focus never stays on the hidden element.'
        : 'Make the element visible when it can receive keyboard focus, or remove it from the tab order until it is visible.',
      i18n: downgradedToRedirectReview
        ? {
            summaryKey: 'cssHidden_focus_summary_cantTell_redirect',
            hintKey: 'cssHidden_focus_hint_cantTell_redirect',
            params: { element: tagName }
          }
        : {
            summaryKey: 'cssHidden_focus_summary_cantTell',
            hintKey: 'cssHidden_focus_hint_cantTell',
            // One flag per technique, so each locale words them as sentences
            // instead of showing the internal codes. visibilityHints stays
            // for callers that read params directly.
            params: {
              element: tagName,
              visibilityHints: hintsArr.join(','),
              opacityZero: hintsArr.includes('opacityZero'),
              offscreen: hintsArr.includes('offscreen'),
              clipped: hintsArr.includes('clipped'),
              zeroSizeOverflowHidden: hintsArr.includes('zeroSizeOverflowHidden'),
              outOfReach: hintsArr.includes('outOfReach'),
              containerClipped: hintsArr.includes('containerClipped')
            }
          },
      data: {
        details: {
          reasonCode: downgradedToRedirectReview
            ? 'cssHiddenTabbable_runtimeRedirect_needsReview'
            : 'cssHiddenTabbable_needsFocusStateVerification',
          metrics: { visibilityHints: hintsArr.slice(0) },
          runtimeProbe: runtimeProbe || null
        }
      }
    };

    occurrences.push(
      reportOccurrence
        ? reportOccurrence(el, baseOccurrence)
        : { __node: el, selector: '', html: '', ...baseOccurrence }
    );
  }

  // Manual rule + validator invariant: cantTell must have >= 1 occurrence
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
