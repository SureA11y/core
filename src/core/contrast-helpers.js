/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

const { createSafeDom } = require('./safe-dom');

function createContrastHelpers(opts, shared) {
  const dom = createSafeDom();
  const window = opts && opts.window ? opts.window : null;

  const trim = shared.trim;
  const computedStyle = shared.computedStyle;
  const composedParent = shared.composedParent;
  const buildSimpleSelector = shared.buildSimpleSelector;

  const clamp01 = (n) => {
    const x = Number(n);
    if (Number.isNaN(x)) return 0;
    if (x < 0) return 0;
    if (x > 1) return 1;
    return x;
  };

  const clamp255 = (n) => {
    const x = Number(n);
    if (Number.isNaN(x)) return 0;
    if (x < 0) return 0;
    if (x > 255) return 255;
    return x;
  };

  // -------- Shared per-run caches (shared.__contrastSharedCache lifetime is per engine run) --------

  function __getSharedWeakMapCache(propName) {
    try {
      const sc = shared && shared.__contrastSharedCache ? shared.__contrastSharedCache : null;
      if (!sc) return null;
      const existing = sc[propName];
      if (existing && typeof existing.get === 'function' && typeof existing.set === 'function')
        return existing;
      const wm = new WeakMap();
      sc[propName] = wm;
      return wm;
    } catch {
      return null;
    }
  }

  function __getSharedTextScanCache() {
    try {
      const sc = shared && shared.__contrastSharedCache ? shared.__contrastSharedCache : null;
      if (!sc) return null;

      if (
        sc.__textScanCache &&
        typeof sc.__textScanCache.get === 'function' &&
        typeof sc.__textScanCache.set === 'function' &&
        typeof sc.__textScanCache.has === 'function'
      ) {
        return sc.__textScanCache;
      }

      try {
        Object.defineProperty(sc, '__textScanCache', {
          value: new Map(),
          writable: false,
          enumerable: false,
          configurable: true
        });
      } catch {
        sc.__textScanCache = new Map();
      }
      return sc.__textScanCache;
    } catch {
      return null;
    }
  }

  function __getSharedColorParseCache() {
    try {
      const sc = shared && shared.__contrastSharedCache ? shared.__contrastSharedCache : null;
      if (!sc) return null;

      if (sc.__colorParseCache && typeof sc.__colorParseCache.get === 'function') {
        return sc.__colorParseCache;
      }
      const m = new Map();
      sc.__colorParseCache = m;
      return m;
    } catch {
      return null;
    }
  }

  // -------- Computed style memoization (per element, per run) --------

  const __localComputedStyleCache = new WeakMap();
  const __computedStyleCache =
    __getSharedWeakMapCache('__computedStyleCache') || __localComputedStyleCache;

  function __contrastComputedStyle(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return computedStyle(el);
      if (__computedStyleCache.has(el)) return __computedStyleCache.get(el);
      const cs = computedStyle(el);
      __computedStyleCache.set(el, cs);
      return cs;
    } catch {
      // Always no-throw: return empty object on any failure
      try {
        const cs = computedStyle(el);
        if (el && dom.nodeType(el) === 1) __computedStyleCache.set(el, cs);
        return cs;
      } catch {
        return {};
      }
    }
  }

  // Cache common booleans per element (per run)
  const __localHasBgImgCache = new WeakMap();
  const __localHasBlendModeCache = new WeakMap();
  const __localHasFilterCache = new WeakMap();
  const __localTextShadowInfoCache = new WeakMap();
  const __hasBgImgCache = __getSharedWeakMapCache('__hasBgImgCache') || __localHasBgImgCache;
  const __hasBlendModeCache =
    __getSharedWeakMapCache('__hasBlendModeCache') || __localHasBlendModeCache;
  const __hasFilterCache = __getSharedWeakMapCache('__hasFilterCache') || __localHasFilterCache;
  const __textShadowInfoCache =
    __getSharedWeakMapCache('__textShadowInfoCache') || __localTextShadowInfoCache;

  // -------- Visibility mode resolution for getTextScan --------

  function __getVisibilityMode(engineOptions) {
    const m =
      engineOptions && typeof engineOptions.visibilityMode === 'string'
        ? engineOptions.visibilityMode
        : '';
    return m || 'styleOnly';
  }

  function __resolveVisibilityMode(ctx, engineOptions, d, w) {
    // If getTextScan was called with a direct string (unlikely, but safe)
    if (typeof engineOptions === 'string') return engineOptions;

    const candidates = [
      engineOptions,

      // common shapes
      ctx && ctx.engineOptions,
      ctx && ctx.options && ctx.options.engineOptions,
      ctx && ctx.options,
      ctx && ctx.opts && ctx.opts.engineOptions,
      ctx && ctx.opts,

      // policy layering shapes
      ctx && ctx.policyOverrides && ctx.policyOverrides.engineOptions,
      ctx && ctx.policyOverrides,
      ctx && ctx.policy && ctx.policy.engineOptions,
      ctx && ctx.policy,

      // sometimes hoisted
      ctx,

      // opts passed into createContrastHelpers
      opts && opts.engineOptions,
      opts && opts.options && opts.options.engineOptions,
      opts && opts.options,
      opts && opts.opts && opts.opts.engineOptions,
      opts && opts.opts,

      opts && opts.policyOverrides && opts.policyOverrides.engineOptions,
      opts && opts.policyOverrides,
      opts && opts.policy && opts.policy.engineOptions,
      opts && opts.policy,

      // globals sometimes used by runners
      w && w.__a11ycoreEngineOptions,
      d && d.__a11ycoreEngineOptions
    ];

    for (const c of candidates) {
      if (!c || typeof c !== 'object') continue;

      if (typeof c.visibilityMode === 'string') return c.visibilityMode;

      if (
        c.engineOptions &&
        typeof c.engineOptions === 'object' &&
        typeof c.engineOptions.visibilityMode === 'string'
      ) {
        return c.engineOptions.visibilityMode;
      }

      if (
        c.options &&
        typeof c.options === 'object' &&
        c.options.engineOptions &&
        typeof c.options.engineOptions === 'object' &&
        typeof c.options.engineOptions.visibilityMode === 'string'
      ) {
        return c.options.engineOptions.visibilityMode;
      }

      if (
        c.policy &&
        typeof c.policy === 'object' &&
        c.policy.engineOptions &&
        typeof c.policy.engineOptions === 'object' &&
        typeof c.policy.engineOptions.visibilityMode === 'string'
      ) {
        return c.policy.engineOptions.visibilityMode;
      }

      if (
        c.policyOverrides &&
        typeof c.policyOverrides === 'object' &&
        c.policyOverrides.engineOptions &&
        typeof c.policyOverrides.engineOptions === 'object' &&
        typeof c.policyOverrides.engineOptions.visibilityMode === 'string'
      ) {
        return c.policyOverrides.engineOptions.visibilityMode;
      }
    }

    return '';
  }

  // Whether the document has a layout to measure: a browser lays out the root
  // element; jsdom gives it no boxes.
  function __hasLayout(d) {
    try {
      const root = d && dom.documentElement(d);
      const rects = root ? dom.getClientRects(root) : null;
      return !!(rects && rects.length);
    } catch {
      return false;
    }
  }

  function __asEligibilityBool(v) {
    if (typeof v === 'boolean') return v;
    if (v && typeof v === 'object' && typeof v.eligible === 'boolean') return v.eligible;
    return !!v;
  }

  // WCAG 1.4.3/1.4.6 "Incidental" exception: text that is part of an inactive
  // (disabled) user interface component has no contrast requirement. Walk the
  // ancestor chain (not just the text's immediate parent) so text nested inside
  // a disabled control, e.g. <button disabled><span>Label</span></button>, is
  // still recognized as inactive.
  function isDisabledWidget(node) {
    try {
      if (typeof dom.get(node, 'matches') === 'function' && dom.matches(node, ':disabled'))
        return true;
    } catch {}
    try {
      const ad = dom.get(node, 'getAttribute')
        ? String(dom.getAttribute(node, 'aria-disabled') || '')
            .trim()
            .toLowerCase()
        : '';
      if (ad === 'true') return true;
    } catch {}
    return false;
  }

  function isInactiveUiComponent(el) {
    let node = el;
    let depth = 0;
    let labelAncestor = null;
    while (node && dom.nodeType(node) === 1 && depth++ < 100) {
      if (isDisabledWidget(node)) return true;
      if (!labelAncestor && String(dom.tagName(node) || '').toLowerCase() === 'label') {
        labelAncestor = node;
      }
      node = dom.parentElement(node);
    }

    // WCAG 1.4.3/1.4.6 "disabled label" exception: text that forms the
    // accessible name of a disabled widget has no contrast requirement
    // either, even when the disabled control itself is a SIBLING of the
    // text rather than an ancestor -- e.g. <label>My name<input disabled/>
    // </label> (implicit/explicit native label association), or a
    // <label id="x">...</label> referenced via aria-labelledby="x" from a
    // separate aria-disabled widget. Only attempted when an enclosing
    // <label> was actually found above, to avoid a document-wide query for
    // the common case of plain text with no label ancestor at all.
    if (labelAncestor) {
      try {
        // Not the native `.control`, which walks the whole document on
        // every call in jsdom.
        const control = shared.getLabelControl
          ? shared.getLabelControl(labelAncestor)
          : labelAncestor.control || null;
        if (control && isDisabledWidget(control)) return true;
      } catch {}

      try {
        // Only an element in the label's own tree (its shadow root, or the
        // document) can reference it by id.
        const root = dom.getRootNode(labelAncestor);
        const tree =
          root && typeof dom.get(root, 'getElementById') === 'function'
            ? root
            : dom.ownerDocument(labelAncestor);
        const labelId = dom.get(labelAncestor, 'id');
        if (tree && labelId) {
          const referrers = dom.querySelectorAll(tree, '[aria-labelledby~="' + labelId + '"]');
          for (const ref of referrers) {
            if (isDisabledWidget(ref)) return true;
          }
        }
      } catch {}
    }

    return false;
  }

  // -------- Text shown in a form field (#103) --------
  //
  // An <input>'s value, a <textarea>'s current value and a placeholder are
  // drawn by the browser inside the field, not from text nodes, so the text
  // walk never meets them. A field shows its value or, while that is empty,
  // its placeholder, whose color, font, opacity and background come from
  // the ::placeholder pseudo-element (CSS Pseudo-Elements 4).

  // Input types that show their value as text. A missing or unknown type
  // is text; `type` reflects it so.
  const __TEXT_FIELD_TYPES = new Set([
    'text',
    'search',
    'email',
    'url',
    'tel',
    'password',
    'number',
    'date',
    'time',
    'datetime-local',
    'month',
    'week'
  ]);
  // The types that show a placeholder (HTML, the placeholder attribute).
  const __PLACEHOLDER_TYPES = new Set([
    'text',
    'search',
    'email',
    'url',
    'tel',
    'password',
    'number'
  ]);

  // As the text walk's: text with a letter or digit (ACT afw4f7).
  const __hasLetterOrDigit = (t) => t != null && /[\p{L}\p{N}]/u.test(String(t));

  const __localFieldTextCache = new WeakMap();
  const __fieldTextCache = __getSharedWeakMapCache('__fieldTextCache') || __localFieldTextCache;

  // What text a field shows: { placeholder: false } for its value,
  // { placeholder: true, style } for its placeholder with the
  // ::placeholder computed style, or null for no text (an empty field, a
  // field that isn't a text field, or a placeholder whose style can't be
  // read: jsdom computes no pseudo-element styles).
  function __fieldText(el) {
    if (!el || dom.nodeType(el) !== 1) return null;
    if (__fieldTextCache.has(el)) return __fieldTextCache.get(el);
    let out = null;
    try {
      const tag = String(dom.localName(el) || '').toLowerCase();
      const isInputNs =
        !dom.namespaceURI(el) || dom.namespaceURI(el) === 'http://www.w3.org/1999/xhtml';
      const type = tag === 'input' ? String(dom.get(el, 'type') || 'text').toLowerCase() : '';
      if (isInputNs && (tag === 'textarea' || (tag === 'input' && __TEXT_FIELD_TYPES.has(type)))) {
        const value = dom.get(el, 'value');
        // A placeholder shows only while the value is empty.
        if (value != null && String(value) !== '') {
          if (__hasLetterOrDigit(value)) out = { placeholder: false };
        } else if (tag === 'textarea' || __PLACEHOLDER_TYPES.has(type)) {
          let ph = dom.get(el, 'getAttribute') ? dom.getAttribute(el, 'placeholder') : null;
          // An input's placeholder is shown without its line breaks.
          if (tag === 'input' && ph) ph = ph.replace(/[\r\n]/g, '');
          const doc = dom.ownerDocument(el);
          const view = doc && dom.defaultView(doc);
          if (
            __hasLetterOrDigit(ph) &&
            __hasLayout(doc) &&
            view &&
            typeof view.getComputedStyle === 'function'
          ) {
            const style = view.getComputedStyle(el, '::placeholder');
            if (style) out = { placeholder: true, style };
          }
        }
      }
    } catch {
      out = null;
    }
    __fieldTextCache.set(el, out);
    return out;
  }

  // The computed style that sets the color and font of el's text: the
  // ::placeholder style while a field shows its placeholder, el's own
  // otherwise.
  function textStyleOf(el) {
    const field = __fieldText(el);
    return field && field.placeholder ? field.style : __contrastComputedStyle(el);
  }

  function getTextScan(ctx, helpers, engineOptions) {
    try {
      const d = (ctx && ctx.document) || (opts && opts.document) || null;

      const w = (ctx && ctx.window) || (d && dom.defaultView(d)) || window || null;

      // Unset, the text a reader can see is decided from the layout where
      // there is one (#99): text off the page or clipped away is drawn
      // nowhere it can be seen. Without a layout (jsdom), from styles only.
      const rawMode =
        __resolveVisibilityMode(ctx, engineOptions, d, w) ||
        (__hasLayout(d) ? 'styleAndGeometry' : 'styleOnly');

      const visibilityMode =
        __getVisibilityMode({ visibilityMode: rawMode }) === 'styleAndGeometry'
          ? 'styleAndGeometry'
          : 'styleOnly';

      if (!d || typeof dom.get(d, 'createTreeWalker') !== 'function') {
        return { eligibleTextCount: 0, elements: [], visibilityMode };
      }

      // Default on, opt out with includeShadowDom: false -- same contract as
      // helpers.queryAllSmart. Part of the cache key: a scan that skipped
      // shadow roots must not be reused by one that should not.
      const includeShadowDom = !(engineOptions && engineOptions.includeShadowDom === false);

      const cache = __getSharedTextScanCache();
      const cacheKey = `visibilityMode=${visibilityMode}|sd=${includeShadowDom ? 1 : 0}`;
      if (cache && cache.has(cacheKey)) return cache.get(cacheKey);

      // ctx.root is an array with multi-region contextSelector support
      // (dom-runner.js resolves it that way now) but back-compat with
      // any caller still passing a single element directly.
      const walkRootsRaw =
        ctx && ctx.root
          ? Array.isArray(ctx.root)
            ? ctx.root
            : [ctx.root]
          : [dom.body(d) || dom.documentElement(d) || d];
      const lightRoots = walkRootsRaw
        .map((wr) =>
          wr && dom.nodeType(wr) === 9 ? dom.body(wr) || dom.documentElement(wr) || wr : wr
        )
        .filter(Boolean);

      // A TreeWalker stops at a shadow boundary and querySelectorAll does not
      // cross one either, so every open shadow root has to be walked as a root
      // in its own right or the text inside a component is never seen at all.
      function withShadowRoots(roots) {
        if (!includeShadowDom) return roots;

        const out = [];
        const seen = new Set();
        const queue = roots.slice();
        let guard = 0;

        while (queue.length && guard++ < 10000) {
          const root = queue.shift();
          if (!root || seen.has(root)) continue;
          seen.add(root);
          out.push(root);

          let hosts;
          try {
            hosts = dom.get(root, 'querySelectorAll') ? dom.querySelectorAll(root, '*') : [];
          } catch {
            continue;
          }
          for (const el of hosts) {
            if (el && dom.shadowRoot(el) && !seen.has(dom.shadowRoot(el)))
              queue.push(dom.shadowRoot(el));
          }
        }

        return out;
      }

      const walkRoots = withShadowRoots(lightRoots);

      const SHOW_TEXT =
        w && w.NodeFilter && typeof w.NodeFilter.SHOW_TEXT === 'number'
          ? w.NodeFilter.SHOW_TEXT
          : 4;

      // ACT afw4f7/09o5cg's own applicability is scoped to text that
      // "expresses something in human language". A string of pure
      // punctuation/symbol characters, with no letter or digit at all,
      // isn't language and is out of scope entirely, not a violation. Their
      // own passed example is exactly that: a paragraph of nothing but
      // punctuation/symbol glyphs.
      const isNonEmptyText = (t) => {
        if (t == null) return false;
        const s = String(t);
        return /\S/.test(s) && /[\p{L}\p{N}]/u.test(s);
      };

      const elToCount = new WeakMap();
      const elements = [];
      let eligibleTextCount = 0;

      const eligCache = new WeakMap();
      const inactiveCache = new WeakMap();
      const clipHiddenCache = new WeakMap();

      // clip:rect(0,0,0,0) / clip-path:inset(50%+) (the sr-only technique) has
      // no visually-presented color, so contrast rules exempt it even though
      // isDomVisibleEligible itself keeps it eligible for other callers
      // (aria-hidden-focus etc. need to find clipped-but-focusable elements).
      const isClipHidden = (el) => {
        if (!helpers || typeof helpers.getVisibilityHintsInfo !== 'function') return false;
        if (clipHiddenCache.has(el)) return clipHiddenCache.get(el);

        let hidden = false;
        try {
          let cur = el;
          let guard = 0;
          while (cur && dom.nodeType(cur) === 1 && guard++ < 100) {
            const info = helpers.getVisibilityHintsInfo(cur, ctx, {});
            if (info && Array.isArray(info.hints) && info.hints.indexOf('clipped') !== -1) {
              hidden = true;
              break;
            }
            cur = composedParent ? composedParent(cur) : dom.parentElement(cur);
          }
        } catch {
          hidden = false;
        }

        clipHiddenCache.set(el, hidden);
        return hidden;
      };

      // Text behind an open modal dialog is out of the scan, as everywhere
      // else: the browser makes it inert, and the scan judges the dialog.
      // Only that reason counts here, since aria-hidden text that is drawn
      // still has to meet contrast. Asked once, so a page with no modal open
      // pays nothing for it.
      let modalOpen = false;
      try {
        modalOpen = !!(
          helpers &&
          typeof helpers.isModalDialogOpen === 'function' &&
          helpers.isModalDialogOpen()
        );
      } catch {
        modalOpen = false;
      }
      const isBehindModal = (el) => {
        if (!modalOpen || typeof helpers.isAccTreeEligible !== 'function') return false;
        const r = helpers.isAccTreeEligible(el);
        return !!(
          r &&
          r.eligible === false &&
          Array.isArray(r.reasons) &&
          r.reasons.includes('modalInert')
        );
      };

      // Text the page draws nowhere a reader can see it. From CSS alone:
      // a font size of 0, or a fully transparent color, unless the color is
      // left transparent for a background to show through the glyphs
      // (background-clip: text, gradient text), which the computability
      // check then asks about. With layout (styleAndGeometry): text entirely
      // above or left of the page, where no scrolling reaches (the
      // left: -9999px technique), or clipped to nothing by an ancestor that
      // hides its overflow (height: 0; overflow: hidden).
      // Measured once per scan: many text elements share the ancestors
      // that clip them.
      const clipBoxCache = new Map();
      const clipBoxOf = (node) => {
        let box = clipBoxCache.get(node);
        if (box === undefined) {
          const acs = __contrastComputedStyle(node);
          const clipsX = !!acs && (acs.overflowX === 'hidden' || acs.overflowX === 'clip');
          const clipsY = !!acs && (acs.overflowY === 'hidden' || acs.overflowY === 'clip');
          box = {
            clipsX,
            clipsY,
            rect: clipsX || clipsY ? dom.getBoundingClientRect(node) : null,
            stops: !!acs && (acs.position === 'fixed' || acs.position === 'absolute')
          };
          clipBoxCache.set(node, box);
        }
        return box;
      };

      const isUndrawn = (el) => {
        const cs = __contrastComputedStyle(el);
        if (!cs) return false;
        if (Number.parseFloat(cs.fontSize) === 0) return true;
        const color = parseCssColorToRgba(__textFillOf(cs));
        if (color && color.a === 0) {
          const clip = String(cs.backgroundClip || cs.webkitBackgroundClip || '');
          if (!/\btext\b/.test(clip)) return true;
        }
        if (
          visibilityMode !== 'styleAndGeometry' ||
          typeof dom.get(el, 'getBoundingClientRect') !== 'function'
        ) {
          return false;
        }
        const r = dom.getBoundingClientRect(el);
        if (!r || !(r.width > 0) || !(r.height > 0)) return false;
        const win = dom.ownerDocument(el) && dom.defaultView(dom.ownerDocument(el));
        const sx = (win && win.scrollX) || 0;
        const sy = (win && win.scrollY) || 0;
        if (r.right + sx <= 0 || r.bottom + sy <= 0) return true;
        let left = r.left;
        let top = r.top;
        let right = r.right;
        let bottom = r.bottom;
        let cur = composedParent(el);
        for (let depth = 0; cur && dom.nodeType(cur) === 1 && depth < 100; depth++) {
          // hidden and clip cut content off; auto and scroll let a reader
          // scroll to it.
          const { clipsX, clipsY, rect: a, stops } = clipBoxOf(cur);
          if (clipsX || clipsY) {
            if (clipsX) {
              left = Math.max(left, a.left);
              right = Math.min(right, a.right);
            }
            if (clipsY) {
              top = Math.max(top, a.top);
              bottom = Math.min(bottom, a.bottom);
            }
            if (right - left < 1 || bottom - top < 1) return true;
          }
          if (stops) break;
          cur = composedParent(cur);
        }
        return false;
      };

      // An <option> has no layout box of its own, yet it is drawn: the
      // selected one in the closed control, the others in the list it opens.
      // Its <select> is what has a place on the page to measure.
      const selectOf = (el) => {
        const tag = String(dom.localName(el) || '').toLowerCase();
        if (tag !== 'option' && tag !== 'optgroup') return null;
        try {
          return dom.closest(el, 'select');
        } catch {
          return null;
        }
      };

      const isVisibleEligible = (el) => {
        if (!helpers || typeof helpers.isDomVisibleEligible !== 'function') return true;
        if (eligCache.has(el)) return eligCache.get(el);

        let ok;
        try {
          const select = visibilityMode === 'styleAndGeometry' ? selectOf(el) : null;
          const r = helpers.isDomVisibleEligible(el, ctx, {
            visibilityMode: select ? 'styleOnly' : visibilityMode
          });
          ok = __asEligibilityBool(r);
          if (ok && select)
            ok = __asEligibilityBool(helpers.isDomVisibleEligible(select, ctx, { visibilityMode }));
          if (ok && select && isUndrawn(select)) ok = false;
          if (ok && isClipHidden(el)) ok = false;
          if (ok && isBehindModal(el)) ok = false;
          if (ok && isUndrawn(el)) ok = false;
        } catch {
          ok = false;
        }

        eligCache.set(el, ok);
        return ok;
      };

      const isInactive = (el) => {
        if (inactiveCache.has(el)) return inactiveCache.get(el);
        let inactive;
        try {
          inactive = isInactiveUiComponent(el);
        } catch {
          inactive = false;
        }
        inactiveCache.set(el, inactive);
        return inactive;
      };

      // ACT afw4f7/09o5cg: text whose foreground color exactly matches its
      // effective background is not "visible" at all (nothing distinguishes
      // it from the background), so it's out of scope entirely -- not a
      // fail, not cantTell, just not there. This is a plain equality check
      // on fully-resolved, fully-opaque colors, not a guess at authorial
      // intent: it only fires when both colors are cleanly computable, and
      // leaves any gradient/image/partial-opacity background (which
      // contrast-computable already reports as cantTell) untouched.
      const contrastOptsForBg =
        engineOptions && typeof engineOptions.contrast === 'object' && engineOptions.contrast
          ? engineOptions.contrast
          : {};
      const bgResolveOpts = {
        contrast: {
          mode: contrastOptsForBg.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance',
          rootCanvasFallback:
            typeof contrastOptsForBg.rootCanvasFallback === 'string' &&
            contrastOptsForBg.rootCanvasFallback.trim()
              ? contrastOptsForBg.rootCanvasFallback.trim()
              : '#ffffff'
        },
        collectStack: false
      };
      const sameColorCache = new WeakMap();
      const isSameColorAsBackground = (el) => {
        if (sameColorCache.has(el)) return sameColorCache.get(el);
        let same = false;
        try {
          const fg = computeEffectiveForeground(el);
          if (fg && fg.rgba && fg.alpha === 1) {
            const bg = computeEffectiveBackground(el, bgResolveOpts);
            if (bg && bg.ok && bg.rgba && bg.alpha === 1) {
              same = fg.rgba.r === bg.rgba.r && fg.rgba.g === bg.rgba.g && fg.rgba.b === bg.rgba.b;
            }
          }
        } catch {
          same = false;
        }
        sameColorCache.set(el, same);
        return same;
      };

      let node = null;
      let guard = 0;
      // Guards against double-counting text nodes reachable from more
      // than one root when contextSelector regions overlap/nest (a
      // single TreeWalker never revisits a node, but running one
      // walker per root could otherwise walk the same subtree twice).
      const visitedTextNodes = new Set();

      for (const walkRoot of walkRoots) {
        if (guard >= 500000) break;
        let walker;
        try {
          walker = dom.createTreeWalker(d, walkRoot, SHOW_TEXT, null);
        } catch {
          continue;
        }

        while ((node = walker.nextNode()) && guard++ < 500000) {
          if (visitedTextNodes.has(node)) continue;
          visitedTextNodes.add(node);

          const text = node && dom.nodeValue(node);
          if (!isNonEmptyText(text)) continue;

          const parentNode = dom.parentNode(node);
          // Text assigned straight to a shadow root has no parent element, but
          // it renders with the host's inherited color and background.
          const el =
            dom.parentElement(node) ||
            (parentNode && dom.nodeType(parentNode) === 1 ? parentNode : null) ||
            (parentNode && dom.nodeType(parentNode) === 11 && dom.host(parentNode)
              ? dom.host(parentNode)
              : null);

          if (!el) continue;
          // A <textarea>'s text nodes are its default value; what it shows is
          // its current value, read with the other fields below.
          if (String(dom.localName(el) || '').toLowerCase() === 'textarea') continue;
          // Respect subtree exclusions from engineOptions.excludeSelectors
          try {
            if (helpers && typeof helpers.isExcluded === 'function' && helpers.isExcluded(el))
              continue;
          } catch {}
          if (!isVisibleEligible(el)) continue;
          if (isInactive(el)) continue;
          if (isSameColorAsBackground(el)) continue;

          eligibleTextCount++;

          const prev = elToCount.get(el);
          if (prev === undefined) {
            elToCount.set(el, 1);
            elements.push(el);
          } else {
            elToCount.set(el, prev + 1);
          }
        }
      }

      // <input type="submit"|"button"|"reset">'s visible label is
      // rendered from its `value` attribute, not a DOM text node, so it's
      // structurally invisible to the SHOW_TEXT walk above (void elements
      // can't have text-node children at all). Without this, these inputs
      // would be silently skipped by both contrast-minimum and
      // contrast-enhanced. The text a field shows, its value or its
      // placeholder, isn't a text node either (#103; see __fieldText). Same
      // eligibility gates as the text-node path above, applied to the input
      // element itself.
      const visitedValueInputs = new Set();
      for (const walkRoot of walkRoots) {
        let candidates;
        try {
          candidates = dom.querySelectorAll(walkRoot, 'input, textarea');
        } catch {
          continue;
        }
        for (const el of candidates) {
          if (visitedValueInputs.has(el)) continue;
          visitedValueInputs.add(el);

          const type =
            String(dom.localName(el) || '').toLowerCase() === 'input'
              ? String(dom.get(el, 'type') || '').toLowerCase()
              : '';
          if (type === 'submit' || type === 'button' || type === 'reset') {
            const value = dom.get(el, 'getAttribute') ? dom.getAttribute(el, 'value') : el.value;
            if (!isNonEmptyText(value)) continue;
          } else if (!__fieldText(el)) {
            continue;
          }

          try {
            if (helpers && typeof helpers.isExcluded === 'function' && helpers.isExcluded(el))
              continue;
          } catch {}
          if (!isVisibleEligible(el)) continue;
          if (isInactive(el)) continue;
          if (isSameColorAsBackground(el)) continue;

          eligibleTextCount++;

          const prev = elToCount.get(el);
          if (prev === undefined) {
            elToCount.set(el, 1);
            elements.push(el);
          } else {
            elToCount.set(el, prev + 1);
          }
        }
      }

      const out = Object.freeze({
        eligibleTextCount,
        visibilityMode,
        elements: Object.freeze(
          elements.map((el) => Object.freeze({ el, textCount: elToCount.get(el) || 0 }))
        )
      });

      if (cache) cache.set(cacheKey, out);
      return out;
    } catch {
      return { eligibleTextCount: 0, elements: [], visibilityMode: 'styleOnly' };
    }
  }

  // -------- Formatting helpers --------

  function toHex2(n) {
    const x = clamp255(n);
    const s = x.toString(16).toLowerCase();
    return s.length === 1 ? '0' + s : s;
  }

  function rgbToHex(rgb) {
    try {
      if (!rgb || typeof rgb !== 'object') return '';
      return '#' + toHex2(rgb.r) + toHex2(rgb.g) + toHex2(rgb.b);
    } catch {
      return '';
    }
  }

  // 96px/in, 72pt/in => 1px = 0.75pt
  function pxToPt(px) {
    const x = parseFloat(px);
    if (!Number.isFinite(x)) return '';
    return (x * 0.75).toFixed(1);
  }

  function fontWeightLabel(fontWeightNum) {
    const w = Number(fontWeightNum);
    if (Number.isFinite(w) && w >= 700) return 'bold';
    return 'normal';
  }

  function round2(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return '0.00';
    return (Math.round(x * 100) / 100).toFixed(2);
  }

  function rgbaToString(rgba) {
    if (!rgba || typeof rgba !== 'object') return '';
    const r = clamp255(rgba.r);
    const g = clamp255(rgba.g);
    const b = clamp255(rgba.b);
    const a = clamp01(rgba.a);
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }

  function parsePx(value) {
    if (value == null) return null;

    if (typeof value === 'number' && Number.isFinite(value)) return value;

    const s = String(value).trim().toLowerCase();
    if (!s) return null;

    const n = parseFloat(s);
    if (!Number.isFinite(n)) return null;

    if (s.endsWith('px')) return n;
    if (s.endsWith('pt')) return n * (96 / 72);

    if (s.endsWith('rem')) return n * 16;
    if (s.endsWith('em')) return n * 16;
    if (s.endsWith('%')) return (n / 100) * 16;

    return n;
  }

  function normalizeFontWeight(v) {
    const s = trim(v).toLowerCase();
    if (!s) return 400;
    if (s === 'normal') return 400;
    if (s === 'bold' || s === 'bolder') return 700;
    if (s === 'lighter') return 300;
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : 400;
  }

  // `boldLargeMinPx` overrides the size from which bold text is large. It
  // defaults to WCAG's 14pt; a standard may set another (18.5px). Omitted or not a
  // finite number, the WCAG threshold applies, so existing callers are
  // unchanged.
  function isLargeText(fontSizePx, fontWeightNum, boldLargeMinPx) {
    const size = parseFloat(fontSizePx);
    const w = Number(fontWeightNum);
    if (!Number.isFinite(size)) return false;
    if (size >= 24) return true;
    if (typeof boldLargeMinPx === 'number' && Number.isFinite(boldLargeMinPx)) {
      return size >= boldLargeMinPx && Number.isFinite(w) && w >= 700;
    }
    // WCAG's bold-large threshold is 14pt. Derived via parsePx('14pt')
    // rather than a hardcoded decimal (e.g. "18.6667") or a hand-written
    // reconversion: floating-point multiplication/division isn't
    // associative, so (14*96)/72 and 14*(96/72) both equal ~18.6667 but
    // differ in their last bit (18.666666666666668 vs 18.666666666666664)
    // -- any value that isn't byte-identical to what parsePx('14pt')
    // itself produces for a real `font-size: 14pt` can silently reject
    // text sized exactly at the threshold.
    const boldLargeThresholdPx = parsePx('14pt');
    if (size >= boldLargeThresholdPx && Number.isFinite(w) && w >= 700) return true;
    return false;
  }

  function requiredRatio(level, large) {
    const l = String(level || '').toUpperCase();
    if (l === 'AAA') return large ? 4.5 : 7.0;
    return large ? 3.0 : 4.5;
  }

  // -------- CSS color parsing + memoization --------

  const __localColorParseCache = new Map();
  const __colorParseCache = __getSharedColorParseCache() || __localColorParseCache;

  function __normalizeCssColorCacheKey(input) {
    const raw = input == null ? '' : String(input);
    let s = trim(raw).toLowerCase();
    if (!s) return '';
    s = s.replace(/\s+/g, ' ');
    s = s.replace(/\s*,\s*/g, ',');
    s = s.replace(/\(\s+/g, '(');
    s = s.replace(/\s+\)/g, ')');
    s = s.replace(/\s*\/\s*/g, '/');
    // Only strip whitespace BEFORE a '%' (e.g. "50 %" -> "50%"). Stripping
    // trailing whitespace too (the original /\s*%\s*/ pattern) ate the
    // space that separates adjacent percentage-suffixed channels in the
    // modern space-separated syntax (e.g. "rgb(100% 0% 0%)" collapsed to
    // "rgb(100%0%0%)", one fused token instead of three), silently
    // breaking that whole syntax variant.
    s = s.replace(/\s*%/g, '%');
    return s;
  }

  // The CSS Color 4 functions a browser keeps as written in a computed
  // style: oklab(), oklch(), lab(), lch() and color(<space> ...). color-mix()
  // and relative colors resolve to one of them. Converted to sRGB with the
  // matrices CSS Color 4 gives; a color outside sRGB is clipped to it. null
  // for anything else, or a value that does not parse.
  function __parseCssColor4(s) {
    const m = /^(oklab|oklch|lab|lch|color)\((.*)\)$/.exec(s);
    if (!m) return null;
    const fn = m[1];
    const slash = m[2].split('/');
    if (slash.length > 2) return null;
    const tokens = trim(slash[0]).split(/\s+/).filter(Boolean);
    let space = fn;
    if (fn === 'color') space = tokens.shift() || '';
    if (tokens.length !== 3) return null;

    // A channel: 'none' is 0, a percentage is a fraction of `full`.
    const num = (t, full) => {
      if (t === 'none') return 0;
      if (t.endsWith('%')) {
        const p = Number.parseFloat(t);
        return Number.isFinite(p) ? (p / 100) * full : NaN;
      }
      const n = Number(t);
      return Number.isFinite(n) ? n : NaN;
    };
    const hue = (t) => {
      if (t === 'none') return 0;
      const u = /^(-?[\d.]+(?:e[+-]?\d+)?)(deg|rad|grad|turn)?$/.exec(t);
      if (!u) return NaN;
      const n = Number(u[1]);
      const unit = u[2] || 'deg';
      const deg =
        unit === 'rad'
          ? (n * 180) / Math.PI
          : unit === 'grad'
            ? n * 0.9
            : unit === 'turn'
              ? n * 360
              : n;
      return (deg * Math.PI) / 180;
    };
    let alpha = 1;
    if (slash.length === 2) {
      alpha = num(trim(slash[1]), 1);
      if (!Number.isFinite(alpha)) return null;
    }

    const mul = (M, v) => [
      M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
      M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
      M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
    ];
    const D50_TO_D65 = [
      [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
      [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
      [0.012314014864481998, -0.020507649298898964, 1.330365926242124]
    ];
    const XYZ65_TO_LSRGB = [
      [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
      [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
      [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]
    ];
    const srgbDecode = (v) => {
      const a = Math.abs(v);
      return a <= 0.04045 ? v / 12.92 : Math.sign(v) * Math.pow((a + 0.055) / 1.055, 2.4);
    };
    const labToXyz65 = (L, a, b) => {
      const k = 24389 / 27;
      const e = 216 / 24389;
      const f1 = (L + 16) / 116;
      const f0 = a / 500 + f1;
      const f2 = f1 - b / 200;
      const xyz = [
        Math.pow(f0, 3) > e ? Math.pow(f0, 3) : (116 * f0 - 16) / k,
        L > k * e ? Math.pow(f1, 3) : L / k,
        Math.pow(f2, 3) > e ? Math.pow(f2, 3) : (116 * f2 - 16) / k
      ];
      const white = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585];
      return mul(D50_TO_D65, [xyz[0] * white[0], xyz[1] * white[1], xyz[2] * white[2]]);
    };
    const oklabToLinear = (L, a, b) => {
      const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
      const mm = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
      const ss = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
      return [
        4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss,
        -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss,
        -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss
      ];
    };

    let linear = null;
    let encoded = null;
    if (space === 'oklab' || space === 'oklch') {
      const L = num(tokens[0], 1);
      let a;
      let b;
      if (space === 'oklab') {
        a = num(tokens[1], 0.4);
        b = num(tokens[2], 0.4);
      } else {
        const C = num(tokens[1], 0.4);
        const h = hue(tokens[2]);
        a = C * Math.cos(h);
        b = C * Math.sin(h);
      }
      if (![L, a, b].every(Number.isFinite)) return null;
      linear = oklabToLinear(L, a, b);
    } else if (space === 'lab' || space === 'lch') {
      const L = num(tokens[0], 100);
      let a;
      let b;
      if (space === 'lab') {
        a = num(tokens[1], 125);
        b = num(tokens[2], 125);
      } else {
        const C = num(tokens[1], 150);
        const h = hue(tokens[2]);
        a = C * Math.cos(h);
        b = C * Math.sin(h);
      }
      if (![L, a, b].every(Number.isFinite)) return null;
      linear = mul(XYZ65_TO_LSRGB, labToXyz65(L, a, b));
    } else if (fn === 'color') {
      const v = tokens.map((t) => num(t, 1));
      if (!v.every(Number.isFinite)) return null;
      if (space === 'srgb') encoded = v;
      else if (space === 'srgb-linear') linear = v;
      else if (space === 'xyz' || space === 'xyz-d65') linear = mul(XYZ65_TO_LSRGB, v);
      else if (space === 'xyz-d50') linear = mul(XYZ65_TO_LSRGB, mul(D50_TO_D65, v));
      else if (space === 'display-p3') {
        const P3_TO_XYZ65 = [
          [0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
          [0.2289745640697488, 0.6917385218365064, 0.079286914093745],
          [0, 0.04511338185890264, 1.043944368900976]
        ];
        linear = mul(XYZ65_TO_LSRGB, mul(P3_TO_XYZ65, v.map(srgbDecode)));
      } else if (space === 'a98-rgb') {
        const A98_TO_XYZ65 = [
          [0.5766690429101305, 0.1855582379065463, 0.1882286462349947],
          [0.29734497525053605, 0.6273635662554661, 0.07529145849399788],
          [0.02703136138641234, 0.07068885253582723, 0.9913375368376388]
        ];
        const dec = v.map((c) => Math.sign(c) * Math.pow(Math.abs(c), 563 / 256));
        linear = mul(XYZ65_TO_LSRGB, mul(A98_TO_XYZ65, dec));
      } else if (space === 'prophoto-rgb') {
        const PROPHOTO_TO_XYZ50 = [
          [0.7977666449006423, 0.13518129740053308, 0.0313477341283922],
          [0.2880748288194013, 0.711835234241873, 0.00008993693872564],
          [0, 0, 0.8251046025104602]
        ];
        const dec = v.map((c) =>
          Math.abs(c) <= 16 / 512 ? c / 16 : Math.sign(c) * Math.pow(Math.abs(c), 1.8)
        );
        linear = mul(XYZ65_TO_LSRGB, mul(D50_TO_D65, mul(PROPHOTO_TO_XYZ50, dec)));
      } else if (space === 'rec2020') {
        const REC2020_TO_XYZ65 = [
          [0.6369580483012914, 0.14461690358620832, 0.1688809751641721],
          [0.2627002120112671, 0.6779980715188708, 0.05930171646986196],
          [0, 0.028072693049087428, 1.060985057710791]
        ];
        const al = 1.09929682680944;
        const be = 0.018053968510807;
        const dec = v.map((c) => {
          const a = Math.abs(c);
          return a < be * 4.5 ? c / 4.5 : Math.sign(c) * Math.pow((a + al - 1) / al, 1 / 0.45);
        });
        linear = mul(XYZ65_TO_LSRGB, mul(REC2020_TO_XYZ65, dec));
      } else return null;
    } else return null;

    if (!encoded) {
      encoded = linear.map((c) => {
        const a = Math.abs(c);
        return a <= 0.0031308 ? c * 12.92 : Math.sign(c) * (1.055 * Math.pow(a, 1 / 2.4) - 0.055);
      });
    }
    if (!encoded.every(Number.isFinite)) return null;
    const to255 = (c) => clamp255(Math.round(Math.min(1, Math.max(0, c)) * 255));
    return { r: to255(encoded[0]), g: to255(encoded[1]), b: to255(encoded[2]), a: clamp01(alpha) };
  }

  function __parseCssColorToRgbaUncached(input) {
    const s = trim(input).toLowerCase();
    if (!s) return null;
    if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

    // A CSS Color 4 function the converter can't read (an unknown color()
    // space, say) is not parsed: the platform would only hand the same
    // value back.
    if (/^(oklab|oklch|lab|lch|color)\(/.test(s)) return __parseCssColor4(s);

    if (s[0] === '#') {
      const hex = s.slice(1);
      const isHex = /^[0-9a-f]+$/i.test(hex);
      if (!isHex) return null;

      const hexToInt = (h) => Number.parseInt(h, 16);

      try {
        if (hex.length === 3) {
          const r = hexToInt(hex[0] + hex[0]);
          const g = hexToInt(hex[1] + hex[1]);
          const b = hexToInt(hex[2] + hex[2]);
          return { r, g, b, a: 1 };
        }
        if (hex.length === 4) {
          const r = hexToInt(hex[0] + hex[0]);
          const g = hexToInt(hex[1] + hex[1]);
          const b = hexToInt(hex[2] + hex[2]);
          const a = hexToInt(hex[3] + hex[3]) / 255;
          return { r, g, b, a: clamp01(a) };
        }
        if (hex.length === 6) {
          const r = hexToInt(hex.slice(0, 2));
          const g = hexToInt(hex.slice(2, 4));
          const b = hexToInt(hex.slice(4, 6));
          return { r, g, b, a: 1 };
        }
        if (hex.length === 8) {
          const r = hexToInt(hex.slice(0, 2));
          const g = hexToInt(hex.slice(2, 4));
          const b = hexToInt(hex.slice(4, 6));
          const a = hexToInt(hex.slice(6, 8)) / 255;
          return { r, g, b, a: clamp01(a) };
        }
      } catch {}
      return null;
    }

    const m = s.match(/^rgba?\((.*)\)$/);

    // Modern space-separated: rgb(0 0 0 / 0.5)
    if (m && m[1] && m[1].indexOf(',') === -1) {
      const body = trim(m[1]);
      const parts2 = body.split('/').map((x) => trim(x));
      const rgbPart = parts2[0] || '';
      const aPart = parts2[1] || '';

      const rgbNums = rgbPart
        .split(/\s+/)
        .map((x) => trim(x))
        .filter(Boolean);
      if (rgbNums.length >= 3) {
        const parseChannel2 = (t) => {
          if (!t) return null;
          if (t.endsWith('%')) {
            const p = Number.parseFloat(t);
            if (!Number.isFinite(p)) return null;
            return clamp255(Math.round((p / 100) * 255));
          }
          const n = Number.parseFloat(t);
          if (!Number.isFinite(n)) return null;
          return clamp255(Math.round(n));
        };

        const r = parseChannel2(rgbNums[0]);
        const g = parseChannel2(rgbNums[1]);
        const b = parseChannel2(rgbNums[2]);
        if (r == null || g == null || b == null) return null;

        let a = 1;
        if (aPart) {
          if (aPart.endsWith('%')) {
            const p = Number.parseFloat(aPart);
            if (Number.isFinite(p)) a = clamp01(p / 100);
          } else {
            const n = Number.parseFloat(aPart);
            if (Number.isFinite(n)) a = clamp01(n);
          }
        }

        return { r, g, b, a };
      }
    }

    // Comma-separated: rgb(0,0,0) / rgba(0,0,0,0.5)
    if (m && m[1]) {
      const parts = m[1].split(',').map((x) => trim(x));
      if (parts.length < 3) return null;

      const parseChannel = (t) => {
        if (!t) return null;
        if (t.endsWith('%')) {
          const p = Number.parseFloat(t);
          if (!Number.isFinite(p)) return null;
          return clamp255(Math.round((p / 100) * 255));
        }
        const n = Number.parseFloat(t);
        if (!Number.isFinite(n)) return null;
        return clamp255(Math.round(n));
      };

      const r = parseChannel(parts[0]);
      const g = parseChannel(parts[1]);
      const b = parseChannel(parts[2]);
      if (r == null || g == null || b == null) return null;

      let a = 1;
      if (parts.length >= 4) {
        const t = parts[3];
        if (t && t.endsWith('%')) {
          const p = Number.parseFloat(t);
          if (Number.isFinite(p)) a = clamp01(p / 100);
        } else {
          const n = Number.parseFloat(t);
          if (Number.isFinite(n)) a = clamp01(n);
        }
      }
      return { r, g, b, a };
    }

    // Fallback: let the platform parse named/system colors.
    // Useful in jsdom/browsers where computed styles may return keywords like "black" or "CanvasText".
    try {
      const w = window || null;
      const d = w && w.document ? w.document : null;
      if (
        w &&
        d &&
        typeof dom.get(d, 'createElement') === 'function' &&
        typeof w.getComputedStyle === 'function'
      ) {
        // A computed value never holds var(): only jsdom, which doesn't
        // substitute custom properties, hands one over. The probe can't
        // resolve it either, and adding it to the document would empty
        // jsdom's whole style cache.
        if (/\bvar\(/i.test(String(input))) return null;
        const probe = dom.createElement(d, 'span');
        // Avoid layout/paint side effects
        probe.style.position = 'absolute';
        probe.style.left = '-9999px';
        probe.style.top = '-9999px';
        probe.style.opacity = '0';
        probe.style.color = String(input);
        // A value the platform rejects leaves the property unset, and the
        // probe would then report the color it inherits.
        if (!probe.style.color) return null;
        const parent = dom.body(d) || dom.documentElement(d);
        if (parent && typeof dom.get(parent, 'appendChild') === 'function')
          dom.appendChild(parent, probe);

        let computed = '';
        try {
          computed = (w.getComputedStyle(probe) && w.getComputedStyle(probe).color) || '';
        } catch {
          computed = '';
        }

        try {
          if (probe && dom.parentNode(probe)) dom.removeChild(dom.parentNode(probe), probe);
        } catch {}

        const normalized = __normalizeCssColorCacheKey(computed);
        if (normalized && normalized !== __normalizeCssColorCacheKey(input)) {
          // Reuse the parser on the computed rgb()/rgba() string.
          const parsed = __parseCssColorToRgbaUncached(normalized);
          if (parsed) return parsed;
        }
      }
    } catch {}

    return null;
  }

  function parseCssColorToRgba(input) {
    const key = __normalizeCssColorCacheKey(input);
    if (!key) return null;
    if (__colorParseCache.has(key)) return __colorParseCache.get(key);

    const out = __parseCssColorToRgbaUncached(key);
    __colorParseCache.set(key, out);
    return out;
  }

  // -------- Color math --------

  function compositeRgba(src, dst) {
    const s = src && typeof src === 'object' ? src : { r: 0, g: 0, b: 0, a: 0 };
    const d = dst && typeof dst === 'object' ? dst : { r: 0, g: 0, b: 0, a: 0 };

    const as = clamp01(s.a);
    const ad = clamp01(d.a);

    const outA = as + ad * (1 - as);
    if (outA <= 0) return { r: 0, g: 0, b: 0, a: 0 };

    const rs = clamp255(s.r);
    const gs = clamp255(s.g);
    const bs = clamp255(s.b);

    const rd = clamp255(d.r);
    const gd = clamp255(d.g);
    const bd = clamp255(d.b);

    const outR = (rs * as + rd * ad * (1 - as)) / outA;
    const outG = (gs * as + gd * ad * (1 - as)) / outA;
    const outB = (bs * as + bd * ad * (1 - as)) / outA;

    return {
      r: clamp255(Math.round(outR)),
      g: clamp255(Math.round(outG)),
      b: clamp255(Math.round(outB)),
      a: clamp01(outA)
    };
  }

  function srgbToLinear(c) {
    const cs = Number(c) / 255;
    if (cs <= 0.03928) return cs / 12.92;
    return Math.pow((cs + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(rgb) {
    const r = srgbToLinear(clamp255(rgb.r));
    const g = srgbToLinear(clamp255(rgb.g));
    const b = srgbToLinear(clamp255(rgb.b));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(fgRgb, bgRgb) {
    const L1 = relativeLuminance(fgRgb);
    const L2 = relativeLuminance(bgRgb);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function truncateCssValue(v, maxLen) {
    const s = trim(v);
    const n = (Number(maxLen) | 0) > 10 ? Number(maxLen) | 0 : 80;
    if (s.length <= n) return s;
    return s.slice(0, n - 3) + '...';
  }

  function hasBackgroundImageOrGradient(style) {
    try {
      const v = style && style.backgroundImage;
      return !!(v && String(v).trim() && String(v).trim().toLowerCase() !== 'none');
    } catch {
      return false;
    }
  }

  function hasBlendMode(style) {
    try {
      const v = style && style.mixBlendMode;
      return !!(v && String(v).trim() && String(v).trim().toLowerCase() !== 'normal');
    } catch {
      return false;
    }
  }

  function hasFilter(style) {
    try {
      const f = style && style.filter;
      const bf = style && style.backdropFilter;
      const fOn = f && String(f).trim().toLowerCase() !== 'none';
      const bfOn = bf && String(bf).trim().toLowerCase() !== 'none';
      return !!(fOn || bfOn);
    } catch {
      return false;
    }
  }

  // Takes the ALREADY-READ raw text-shadow string, never the style object
  // -- see __textShadowInfoEl's header comment for why this property must
  // only ever be read once per element.
  function hasTextShadow(raw) {
    try {
      const v = raw == null ? '' : String(raw).trim();
      if (!v || v.toLowerCase() === 'none') return false;
      // jsdom's cssstyle serializes an absent/"none" text-shadow as a
      // fully-transparent color string (e.g. "rgba(0, 0, 0, 0)") rather
      // than the literal "none" it should be per spec, and truncates a
      // real declared shadow down to just its color component (dropping
      // the offset/blur lengths) -- so `v` here is sometimes a bare color.
      // Parsing it as one and checking for zero alpha catches jsdom's
      // "no shadow" default without mistaking it for a real one; a value
      // that doesn't parse as a pure color (the real multi-value shorthand
      // a real browser reports) falls through and is treated as a real
      // shadow, the safe direction.
      const c = parseCssColorToRgba(v);
      if (c && typeof c.a === 'number' && c.a === 0) return false;
      return true;
    } catch {
      return false;
    }
  }

  function __hasBackgroundImageOrGradientEl(el, cs) {
    try {
      if (!el || dom.nodeType(el) !== 1) return hasBackgroundImageOrGradient(cs);
      if (__hasBgImgCache.has(el)) return __hasBgImgCache.get(el);
      const v = hasBackgroundImageOrGradient(cs);
      __hasBgImgCache.set(el, v);
      return v;
    } catch {
      return false;
    }
  }

  function __hasBlendModeEl(el, cs) {
    try {
      if (!el || dom.nodeType(el) !== 1) return hasBlendMode(cs);
      if (__hasBlendModeCache.has(el)) return __hasBlendModeCache.get(el);
      const v = hasBlendMode(cs);
      __hasBlendModeCache.set(el, v);
      return v;
    } catch {
      return false;
    }
  }

  function __hasFilterEl(el, cs) {
    try {
      if (!el || dom.nodeType(el) !== 1) return hasFilter(cs);
      if (__hasFilterCache.has(el)) return __hasFilterCache.get(el);
      const v = hasFilter(cs);
      __hasFilterCache.set(el, v);
      return v;
    } catch {
      return false;
    }
  }

  // jsdom's cssstyle has a confirmed bug where reading a computed
  // `text-shadow` value a SECOND time -- via any accessor (`.textShadow`
  // or `getPropertyValue`), even from a freshly-requested
  // CSSStyleDeclaration for the same element -- silently returns a
  // different, "no shadow" result instead of the real declared value (see
  // docs/LIMITATIONS.md). Reading it exactly once and caching the {has,
  // value} pair here avoids compounding that with a second read from
  // elsewhere in this same run (e.g. this function being called more than
  // once for the same element). The shared cache this uses is reset at
  // the start of every run (see dom-runner.js), so this does not survive
  // across two independent runs against the same window, and nothing here
  // relies on it doing so; a fresh jsdom window, or a real browser, is
  // unaffected either way.
  function __textShadowInfoEl(el, cs) {
    try {
      if (!el || dom.nodeType(el) !== 1) {
        const raw = cs && cs.textShadow; // single read
        const value = raw == null ? '' : String(raw);
        return { has: hasTextShadow(value), value };
      }
      if (__textShadowInfoCache.has(el)) return __textShadowInfoCache.get(el);
      const raw = cs && cs.textShadow; // single read, cached below -- never read again
      const value = raw == null ? '' : String(raw);
      const info = { has: hasTextShadow(value), value };
      __textShadowInfoCache.set(el, info);
      return info;
    } catch {
      return { has: false, value: '' };
    }
  }

  // -------- Opacity product memoization --------

  const __localOpacityProductCache = new WeakMap();
  const __opacityProductCache =
    __getSharedWeakMapCache('__opacityProductCache') || __localOpacityProductCache;

  function computeOpacityProduct(el) {
    try {
      if (!el || (typeof el !== 'object' && typeof el !== 'function')) return 1;
      if (__opacityProductCache.has(el)) return __opacityProductCache.get(el);

      let prod = 1;
      let cur = el;
      let guard = 0;
      while (cur && guard++ < 200) {
        if (dom.nodeType(cur) !== 1) {
          cur = composedParent(cur);
          continue;
        }
        const cs = __contrastComputedStyle(cur);
        const o = clamp01(Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1'));
        prod *= o;
        cur = composedParent(cur);
        if (prod <= 0) break;
      }

      const out = clamp01(prod);
      __opacityProductCache.set(el, out);
      return out;
    } catch {
      return 1;
    }
  }

  // -------- Effective foreground/background memoization --------

  // Populated by resolveGroupOpacityColors (defined near
  // getComputabilityBlocker, below) for the narrow ancestor-opacity case
  // it can safely resolve. Checked first by both functions below so a
  // rule computing fg/bg right after a clean computability check gets the
  // correctly group-composited colors without needing to know that case
  // was ever in play.
  const __groupOpacityOverrideCache = new WeakMap();
  // Elements whose group opacity resolveGroupOpacityColors could not resolve
  // only because nothing behind them, up to the root, is opaque: what is
  // missing then is the page's canvas, which computeEffectiveBackground
  // already reports (BACKGROUND_NOT_OPAQUE_AT_ROOT), not the opacity.
  const __groupOpacityRootNotOpaque = new WeakSet();

  const __localEffectiveForegroundCache = new WeakMap();
  const __effectiveForegroundCache =
    __getSharedWeakMapCache('__effectiveForegroundCache') || __localEffectiveForegroundCache;

  const __SVG_NS = 'http://www.w3.org/2000/svg';
  const __SVG_TEXT_TAGS = new Set(['text', 'tspan', 'textpath']);
  // The color HTML text is painted in: -webkit-text-fill-color, which is
  // currentcolor, so the value of color, unless set (Compatibility Standard),
  // and is inherited (#112). Where the property isn't computed (jsdom),
  // color.
  function __textFillOf(cs) {
    if (!cs) return '';
    const fill = cs.webkitTextFillColor || cs['-webkit-text-fill-color'] || '';
    return String(fill).trim() && parseCssColorToRgba(fill) ? fill : cs.color;
  }

  function __isSvgTextElement(el) {
    return (
      !!el &&
      dom.namespaceURI(el) === __SVG_NS &&
      __SVG_TEXT_TAGS.has(String(dom.localName(el) || '').toLowerCase())
    );
  }

  function computeEffectiveForeground(el) {
    // The override first, as computeEffectiveBackground does: a caller can
    // ask for the foreground before the computability check resolves the
    // group opacity (the contrast rules' same-color filter does), and the
    // cached naive color would then count the ancestor's opacity twice,
    // once on the text and once more in the composited background.
    try {
      const override = el && __groupOpacityOverrideCache.get(el);
      if (override) {
        const out = {
          rgba: { r: override.fg.r, g: override.fg.g, b: override.fg.b, a: 1 },
          alpha: 1,
          opacityProduct: 1
        };
        __effectiveForegroundCache.set(el, out);
        return out;
      }
    } catch {}

    try {
      if (el && __effectiveForegroundCache.has(el)) return __effectiveForegroundCache.get(el);
    } catch {}

    // A field's placeholder is painted in the ::placeholder color, faded by
    // its own opacity as well as the field's.
    const field = __fieldText(el);
    const placeholder = field && field.placeholder ? field.style : null;
    const cs = placeholder || __contrastComputedStyle(el);
    // SVG text is painted with `fill`, not `color` (which only feeds
    // currentColor): <text fill="#000" style="color:#eee"> is black. A fill
    // of none (outline-only text) or a paint server (url(#gradient)) does
    // not parse, and leaves the text not computable.
    const svgText = __isSvgTextElement(el);
    let c = parseCssColorToRgba(cs && (svgText ? cs.fill : __textFillOf(cs)));
    if (c && svgText) {
      const fillOpacity = Number.parseFloat(cs.fillOpacity);
      if (Number.isFinite(fillOpacity)) c = { ...c, a: clamp01(c.a * clamp01(fillOpacity)) };
    }
    if (!c) {
      const out = { rgba: null, alpha: 0, opacityProduct: computeOpacityProduct(el) };
      try {
        if (el) __effectiveForegroundCache.set(el, out);
      } catch {}
      return out;
    }

    let op = computeOpacityProduct(el);
    if (placeholder) {
      const own = Number.parseFloat(placeholder.opacity);
      if (Number.isFinite(own)) op *= clamp01(own);
    }
    const out = {
      rgba: { r: c.r, g: c.g, b: c.b, a: clamp01(c.a * op) },
      alpha: clamp01(c.a * op),
      opacityProduct: op
    };
    try {
      if (el) __effectiveForegroundCache.set(el, out);
    } catch {}
    return out;
  }

  const __localEffectiveBackgroundCache = new WeakMap();
  const __effectiveBackgroundCache =
    __getSharedWeakMapCache('__effectiveBackgroundCache') || __localEffectiveBackgroundCache;

  function __bgCacheKey(opts2) {
    const contrast =
      opts2 && opts2.contrast && typeof opts2.contrast === 'object' ? opts2.contrast : {};
    const mode = contrast.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance';
    const rootCanvasFallback =
      typeof contrast.rootCanvasFallback === 'string' && contrast.rootCanvasFallback.trim()
        ? contrast.rootCanvasFallback.trim()
        : '#ffffff';

    // Cache key must include any input that can affect computed background.
    // Note: we only cache when collectStack is false.
    return `${mode}|${rootCanvasFallback}`;
  }

  function computeEffectiveBackground(el, opts2) {
    try {
      const override = el && __groupOpacityOverrideCache.get(el);
      if (override) {
        return {
          ok: true,
          rgba: { r: override.bg.r, g: override.bg.g, b: override.bg.b, a: 1 },
          alpha: 1,
          stack: [],
          reasonCode: null
        };
      }
    } catch {}

    // Paint that isn't an ancestor's, under the text and part of its
    // background in the paint order (#101).
    try {
      const ordered = __paintBackdropOf(el);
      if (ordered && ordered.rgba) {
        return {
          ok: true,
          rgba: { r: ordered.rgba.r, g: ordered.rgba.g, b: ordered.rgba.b, a: 1 },
          alpha: 1,
          stack: [],
          reasonCode: null
        };
      }
    } catch {}

    const __bgKey = __bgCacheKey(opts2);
    const __collectStack = !!(opts2 && opts2.collectStack);

    // Only cache when stack collection is off
    if (!__collectStack) {
      try {
        if (el && __effectiveBackgroundCache.has(el)) {
          const m = __effectiveBackgroundCache.get(el);
          if (m && typeof m.get === 'function' && m.has(__bgKey)) return m.get(__bgKey);
        }
      } catch {}
    }

    const contrast =
      opts2 && opts2.contrast && typeof opts2.contrast === 'object' ? opts2.contrast : {};
    const mode = contrast.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance';
    const rootCanvasFallback =
      typeof contrast.rootCanvasFallback === 'string' && contrast.rootCanvasFallback.trim()
        ? contrast.rootCanvasFallback.trim()
        : '#ffffff';

    const collectStack = !!(opts2 && opts2.collectStack);
    const stack = collectStack ? [] : null;

    let acc = { r: 0, g: 0, b: 0, a: 0 };
    // SVG text: the <rect>s painted behind it, above every ancestor's
    // background, topmost first (see __svgBackdropOf).
    const svgBackdrop = __svgBackdropOf(el);
    if (svgBackdrop && !svgBackdrop.blocked) {
      for (let i = svgBackdrop.layers.length - 1; i >= 0; i--) {
        const layer = svgBackdrop.layers[i];
        if (collectStack) {
          stack.push({
            selector: __getSimpleSelectorCached(layer.el, 'rect'),
            bg: { r: layer.rgba.r, g: layer.rgba.g, b: layer.rgba.b, a: layer.rgba.a },
            opacity: 1
          });
        }
        acc = compositeRgba(acc, layer.rgba);
      }
    }
    // A placeholder's own background is painted under its text, above the
    // field's.
    const field = __fieldText(el);
    if (field && field.placeholder) {
      const own = parseCssColorToRgba(field.style.backgroundColor);
      if (own && own.a > 0) {
        if (collectStack) {
          stack.push({
            selector: __getSimpleSelectorCached(el, 'input') + '::placeholder',
            bg: { r: own.r, g: own.g, b: own.b, a: clamp01(own.a) },
            opacity: 1
          });
        }
        acc = compositeRgba(acc, { r: own.r, g: own.g, b: own.b, a: clamp01(own.a) });
      }
    }
    let cur = el;
    let guard = 0;
    // A background color this parser can't read, met while what is in front
    // of it still lets it show through. Skipping it as if transparent would
    // judge the text against whatever lies further out.
    let unparsable = null;

    while (cur && guard++ < 200) {
      if (dom.nodeType(cur) !== 1) {
        cur = composedParent(cur);
        continue;
      }

      const cs = __contrastComputedStyle(cur);
      const bg = parseCssColorToRgba(cs && cs.backgroundColor);
      const op = clamp01(Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1'));

      if (!bg && acc.a < 1 && trim(cs && cs.backgroundColor)) {
        unparsable = {
          selector: __getSimpleSelectorCached(
            cur,
            (dom.tagName(cur) || '').toLowerCase() || 'html'
          ),
          value: truncateCssValue(trim(cs.backgroundColor), 80)
        };
        break;
      }

      if (bg) {
        const layer = { r: bg.r, g: bg.g, b: bg.b, a: clamp01(bg.a) };
        if (collectStack) {
          stack.push({
            selector: __getSimpleSelectorCached(
              cur,
              (dom.tagName(cur) || '').toLowerCase() || 'html'
            ),
            bg: { r: layer.r, g: layer.g, b: layer.b, a: layer.a },
            opacity: op
          });
        }
        // This ancestor's own background sits BEHIND everything
        // already accumulated from its descendants (acc is painted
        // over it here).
        acc = compositeRgba(acc, layer);
      }

      // CSS opacity on an ancestor scales the *entire rendered
      // subtree* (its own background plus everything already
      // accumulated from descendants) as one compositing group
      // against whatever is further out, not just that ancestor's
      // own background layer. Applying it here (after folding in
      // this ancestor's own bg) keeps that correct even when
      // accumulated alpha already reached 1 from an inner opaque
      // layer, which is why there is no longer an early
      // `acc.a >= 1` exit: a still-unvisited outer ancestor's
      // opacity can still reduce that alpha.
      if (op < 1) {
        acc = { r: acc.r, g: acc.g, b: acc.b, a: clamp01(acc.a * op) };
      }

      cur = composedParent(cur);
    }

    let out;
    const allowAssumptions = mode === 'auditorAssist';

    if (unparsable) {
      out = {
        ok: false,
        rgba: acc,
        alpha: acc.a,
        stack: stack || [],
        reasonCode: 'BACKGROUND_UNPARSABLE',
        blockerSelector: unparsable.selector,
        blockerProperty: 'background-color',
        blockerValue: unparsable.value
      };
    } else if (acc.a < 1) {
      if (allowAssumptions) {
        // If the root is not opaque, apply an explicit canvas fallback.
        const fb = parseCssColorToRgba(rootCanvasFallback) || { r: 255, g: 255, b: 255, a: 1 };
        const fbOpaque = { r: fb.r, g: fb.g, b: fb.b, a: 1 };

        acc = compositeRgba(fbOpaque, acc);

        out = {
          ok: true,
          rgba: { r: acc.r, g: acc.g, b: acc.b, a: 1 },
          alpha: 1,
          stack: stack || [],
          reasonCode: null,
          assumptionsApplied: ['ROOT_CANVAS_FALLBACK'],
          assumedRootCanvasColor: rootCanvasFallback
        };
      } else {
        out = {
          ok: false,
          rgba: acc,
          alpha: acc.a,
          stack: stack || [],
          reasonCode: 'BACKGROUND_NOT_OPAQUE_AT_ROOT'
        };
      }
    } else {
      out = { ok: true, rgba: acc, alpha: acc.a, stack: stack || [], reasonCode: null };
    }

    if (!__collectStack && el) {
      try {
        let m = __effectiveBackgroundCache.get(el);
        if (!m) {
          m = new Map();
          __effectiveBackgroundCache.set(el, m);
        }
        m.set(__bgKey, out);
      } catch {}
    }

    return out;
  }

  // -------- Selector memoization --------

  const __localSimpleSelectorCache = new WeakMap();
  const __simpleSelectorCache =
    __getSharedWeakMapCache('__simpleSelectorCache') || __localSimpleSelectorCache;

  function __getSimpleSelectorCached(el, fallbackTag) {
    try {
      if (!el || dom.nodeType(el) !== 1) return '';
      if (__simpleSelectorCache.has(el)) return __simpleSelectorCache.get(el) || '';
      const s = buildSimpleSelector(el, fallbackTag);
      __simpleSelectorCache.set(el, s || '');
      return s || '';
    } catch {
      return '';
    }
  }

  function classifyBackgroundImageValue(bgImageValue) {
    try {
      const v = bgImageValue == null ? '' : String(bgImageValue).trim();
      if (!v) return 'unknown';
      const s = v.toLowerCase();
      if (s === 'none') return 'unknown';

      // Multiple layers can be comma-separated; we keep it simple + deterministic:
      // if any layer has url()/image-set() => image
      // if any layer has *gradient( => gradient
      const hasGradient = /gradient\s*\(/i.test(s);
      const hasUrl = /\burl\s*\(/i.test(s);
      const hasImageSet = /\bimage-set\s*\(/i.test(s);

      const isImage = hasUrl || hasImageSet;
      const isGradient = hasGradient;

      if (isImage && isGradient) return 'imageAndGradient';
      if (isImage) return 'image';
      if (isGradient) return 'gradient';

      // Other background-image functions exist; treat as unknown rather than guessing.
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // -------- Group-opacity contrast resolution (narrow, safe case) --------

  // getComputabilityBlocker's default policy treats any ANCESTOR (not el
  // itself) with fractional opacity as an unconditional blocker, because
  // naively combining the existing per-element opacity product (folded
  // into the foreground via computeOpacityProduct, which walks ALL
  // ancestors) with the existing ancestor-opacity-aware background walk
  // (computeEffectiveBackground, which ALSO folds ancestor opacity into
  // its own compositing) double-counts the ancestor's opacity: a
  // foreground already darkened by the full ancestor-inclusive opacity
  // product, composited against a background that separately already
  // absorbed that same opacity, applies the ancestor's dimming twice and
  // lands on a lighter (wrong) color than real compositing produces
  // whenever the local and external colors actually differ. Verified by
  // hand against a real rendered screenshot.
  //
  // This resolves both colors in a single walk instead, tracking a
  // background accumulator (as computeEffectiveBackground already does)
  // and a parallel foreground accumulator that receives el's own text
  // color as its innermost layer at el's own level, then applying every
  // ancestor's own background-color and opacity to BOTH accumulators in
  // lockstep. Nothing is combined after the fact, so there's nothing to
  // double-count, and it handles any number of nested opacity ancestors
  // -- each with its own background-color or not -- uniformly. It only
  // bails (returns null, leaving the existing ANCESTOR_OPACITY cantTell
  // in place) for a blend-mode/filter/background-image anywhere in the
  // chain, a missing declared text color, or a background that never
  // reaches full opacity even after the whole chain is walked.
  function resolveGroupOpacityColors(el) {
    try {
      if (el && __groupOpacityOverrideCache.has(el)) return __groupOpacityOverrideCache.get(el);
    } catch {}

    function __cacheAndReturn(res) {
      try {
        if (el) __groupOpacityOverrideCache.set(el, res);
      } catch {}
      return res;
    }

    try {
      if (!el || dom.nodeType(el) !== 1) return __cacheAndReturn(null);

      const elCs = __contrastComputedStyle(el);
      // A placeholder: its own color, opacity and background (__fieldText).
      const field = __fieldText(el);
      const placeholder = field && field.placeholder ? field.style : null;
      const textCs = placeholder || elCs;
      let elColor = parseCssColorToRgba(
        textCs && (__isSvgTextElement(el) ? textCs.fill : __textFillOf(textCs))
      );
      if (!elColor) return __cacheAndReturn(null);
      let phBg = null;
      if (placeholder) {
        const phOpacity = Number.parseFloat(placeholder.opacity);
        if (Number.isFinite(phOpacity)) {
          elColor = { ...elColor, a: clamp01(elColor.a) * clamp01(phOpacity) };
        }
        phBg = parseCssColorToRgba(placeholder.backgroundColor);
      }

      let bgAcc = { r: 0, g: 0, b: 0, a: 0 };
      let fgAcc = { r: 0, g: 0, b: 0, a: 0 };
      let cur = el;
      let guard = 0;

      while (cur && guard++ < 200) {
        if (dom.nodeType(cur) !== 1) {
          cur = composedParent(cur);
          continue;
        }
        const cs = __contrastComputedStyle(cur);

        if (
          __hasBlendModeEl(cur, cs) ||
          __hasFilterEl(cur, cs) ||
          __hasBackgroundImageOrGradientEl(cur, cs)
        ) {
          return __cacheAndReturn(null);
        }

        const bg = parseCssColorToRgba(cs && cs.backgroundColor);
        if (!bg && bgAcc.a < 1 && trim(cs && cs.backgroundColor)) return __cacheAndReturn(null);
        if (bg) {
          const layer = { r: bg.r, g: bg.g, b: bg.b, a: clamp01(bg.a) };
          bgAcc = compositeRgba(bgAcc, layer);
          fgAcc = compositeRgba(fgAcc, layer);
        }

        if (cur === el) {
          if (phBg && phBg.a > 0) {
            const layer = { r: phBg.r, g: phBg.g, b: phBg.b, a: clamp01(phBg.a) };
            bgAcc = compositeRgba(layer, bgAcc);
            fgAcc = compositeRgba(layer, fgAcc);
          }
          // el's own text color is the innermost foreground layer,
          // painted over whatever el's own background (if any) already
          // contributed to fgAcc above.
          fgAcc = compositeRgba(
            { r: elColor.r, g: elColor.g, b: elColor.b, a: clamp01(elColor.a) },
            fgAcc
          );
        }

        const op = clamp01(Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1'));
        if (op < 1) {
          bgAcc = { r: bgAcc.r, g: bgAcc.g, b: bgAcc.b, a: clamp01(bgAcc.a * op) };
          fgAcc = { r: fgAcc.r, g: fgAcc.g, b: fgAcc.b, a: clamp01(fgAcc.a * op) };
        }

        cur = composedParent(cur);
      }

      if (bgAcc.a < 1 || fgAcc.a < 1) {
        try {
          __groupOpacityRootNotOpaque.add(el);
        } catch {}
        return __cacheAndReturn(null);
      }

      return __cacheAndReturn({
        fg: { r: fgAcc.r, g: fgAcc.g, b: fgAcc.b },
        bg: { r: bgAcc.r, g: bgAcc.g, b: bgAcc.b }
      });
    } catch {
      return __cacheAndReturn(null);
    }
  }

  // -------- Computability blocker (memoized per element, per run) --------

  const __localComputabilityBlockerCache = new WeakMap();
  const __computabilityBlockerCache =
    __getSharedWeakMapCache('__computabilityBlockerCache') || __localComputabilityBlockerCache;

  function getComputabilityBlocker(el) {
    try {
      if (el && __computabilityBlockerCache.has(el)) return __computabilityBlockerCache.get(el);
    } catch {}

    let cur = el;
    let guard = 0;
    // Once a closer ancestor's own background-color is confirmed fully
    // opaque (and that ancestor is itself free of blend-mode/filter), it
    // visually PAINTS OVER anything farther out -- a background-image/
    // gradient beyond that point can no longer affect what's rendered
    // behind el's text, so continuing to flag it as a computability blocker
    // would be a false "not computable". This covers the common "solid
    // card/nav/modal over a page-level hero image" pattern.
    //
    // This does NOT extend to mix-blend-mode/filter or an ancestor's
    // `opacity`: those are compositing-GROUP operations applied to that
    // ancestor's entire rendered subtree (including any "opaque" layer
    // inside it) before blending against whatever is further out, so a
    // closer opaque paint layer does not shield against them the way it
    // shields against a plain background-image. Applying the same
    // short-circuit there would risk a confidently wrong pass, so it
    // is not done here, matching this engine's no-false-positives bar.
    //
    // `backdrop-filter` IS extended, because it is the
    // opposite kind of operation: it samples/filters whatever is already
    // rendered BEHIND the element (earlier in paint order), not the
    // element's own subtree, so a closer-to-el fully-opaque
    // background-color paints OVER the filtered result at el's screen
    // position and hides it completely, the same physical occlusion
    // background-image gets, just sourced from "behind" instead of
    // "this element's own background image". Confirmed with a live
    // Chromium repro (not just spec-reading): a `backdrop-filter:
    // blur()` ancestor containing an inner fully-opaque
    // `background-color` div renders that div pixel-flat, with zero
    // blur bleed-through, while sibling content without that opaque
    // layer shows the blurred backdrop clearly.
    let paintOccluded = false;
    // el and its ancestors up to the first with an opaque background.
    const chain = [];

    // A placeholder's own background image, or its own opacity over a
    // background of its own (one group faded together), stops the
    // measurement as the same on an element would.
    const field = __fieldText(el);
    const placeholder = field && field.placeholder ? field.style : null;
    if (placeholder) {
      const phOpacity = clamp01(
        Number.parseFloat(placeholder.opacity != null ? placeholder.opacity : '1')
      );
      const phBg = parseCssColorToRgba(placeholder.backgroundColor);
      let out = null;
      if (hasBackgroundImageOrGradient(placeholder)) {
        out = {
          ok: false,
          reasonCode: 'BACKGROUND_IMAGE_OR_GRADIENT',
          blockerProperty: 'background-image',
          blockerValue: truncateCssValue(placeholder.backgroundImage || '', 80),
          backgroundFillType: classifyBackgroundImageValue(placeholder.backgroundImage || '')
        };
      } else if (phOpacity < 1 && phBg && phBg.a > 0) {
        out = {
          ok: false,
          reasonCode: 'ELEMENT_OPACITY',
          blockerProperty: 'opacity',
          blockerValue: truncateCssValue(String(placeholder.opacity), 80)
        };
      }
      if (out) {
        out.blockerSelector = __getSimpleSelectorCached(el, 'input') + '::placeholder';
        try {
          __computabilityBlockerCache.set(el, out);
        } catch {}
        return out;
      }
    }

    while (cur && guard++ < 200) {
      if (dom.nodeType(cur) !== 1) {
        cur = composedParent(cur);
        continue;
      }
      const cs = __contrastComputedStyle(cur);

      if (__hasBlendModeEl(cur, cs)) {
        const out = {
          ok: false,
          reasonCode: 'MIX_BLEND_MODE',
          blockerSelector: __getSimpleSelectorCached(
            cur,
            (dom.tagName(cur) || '').toLowerCase() || 'html'
          ),
          blockerProperty: 'mix-blend-mode',
          blockerValue: truncateCssValue(cs && cs.mixBlendMode, 80)
        };
        try {
          if (el) __computabilityBlockerCache.set(el, out);
        } catch {}
        return out;
      }

      if (__hasFilterEl(cur, cs)) {
        const isFilter = cs && cs.filter && String(cs.filter).trim().toLowerCase() !== 'none';
        // __hasFilterEl's OR means: if it's not plain `filter`, it must be
        // `backdrop-filter` that's set. Unlike `filter` (unconditional
        // blocker, see the paintOccluded comment above the loop),
        // backdrop-filter is skipped once a closer opaque layer already
        // occludes it -- it can't affect what's actually rendered at el's
        // position anymore, so continue the walk rather than reporting it.
        if (!(paintOccluded && !isFilter)) {
          const out = {
            ok: false,
            reasonCode: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
            blockerSelector: __getSimpleSelectorCached(
              cur,
              (dom.tagName(cur) || '').toLowerCase() || 'html'
            ),
            blockerProperty: isFilter ? 'filter' : 'backdrop-filter',
            blockerValue: truncateCssValue((isFilter ? cs.filter : cs.backdropFilter) || '', 80)
          };
          try {
            if (el) __computabilityBlockerCache.set(el, out);
          } catch {}
          return out;
        }
      }

      // text-shadow is a FOREGROUND property, already resolved by
      // inheritance in `cs` on `el` itself -- unlike background-image/
      // filter/blend-mode, it needs no ancestor walk, so it's checked once
      // on `cur === el` rather than at every level. ACT afw4f7/09o5cg's
      // own failed example (a low-contrast pair "rescued" by a contrasting
      // text-shadow) gives no computation method for how a shadow affects
      // the ratio, and this engine has no glyph-rendering model to derive
      // one either -- rather than assert a confident fail that a real
      // browser's rendering might contradict, this defers to manual
      // review, the same shape as every other computability blocker here.
      // A placeholder's shadow is the ::placeholder one.
      const textShadowInfo =
        cur !== el
          ? null
          : placeholder
            ? {
                has: hasTextShadow(String(placeholder.textShadow || '')),
                value: String(placeholder.textShadow || '')
              }
            : __textShadowInfoEl(cur, cs);
      if (textShadowInfo && textShadowInfo.has) {
        const out = {
          ok: false,
          reasonCode: 'TEXT_SHADOW',
          blockerSelector:
            __getSimpleSelectorCached(cur, (dom.tagName(cur) || '').toLowerCase() || 'html') +
            (placeholder ? '::placeholder' : ''),
          blockerProperty: 'text-shadow',
          blockerValue: truncateCssValue(textShadowInfo.value, 80)
        };
        try {
          if (el) __computabilityBlockerCache.set(el, out);
        } catch {}
        return out;
      }

      // -webkit-text-stroke outlines each glyph in its own colour, and a
      // wide stroke is most of what is drawn: the fill colour alone is not
      // the text's colour, and there is no model for combining the two, so
      // it defers to manual review as a text-shadow does.
      if (cur === el && !placeholder) {
        let strokeWidth;
        let strokeColor = '';
        try {
          strokeWidth = String(
            (cs && cs.getPropertyValue && cs.getPropertyValue('-webkit-text-stroke-width')) || ''
          ).trim();
          strokeColor = String(
            (cs && cs.getPropertyValue && cs.getPropertyValue('-webkit-text-stroke-color')) || ''
          ).trim();
        } catch {
          strokeWidth = '';
        }
        const strokeRgba = strokeColor ? parseCssColorToRgba(strokeColor) : null;
        if (Number.parseFloat(strokeWidth) > 0 && !(strokeRgba && strokeRgba.a === 0)) {
          const out = {
            ok: false,
            reasonCode: 'TEXT_STROKE',
            blockerSelector: __getSimpleSelectorCached(
              cur,
              (dom.tagName(cur) || '').toLowerCase() || 'html'
            ),
            blockerProperty: '-webkit-text-stroke',
            blockerValue: truncateCssValue(strokeWidth + ' ' + strokeColor, 80)
          };
          try {
            if (el) __computabilityBlockerCache.set(el, out);
          } catch {}
          return out;
        }
      }

      if (!paintOccluded && __hasBackgroundImageOrGradientEl(cur, cs)) {
        const bgImg = (cs && cs.backgroundImage) || '';
        const out = {
          ok: false,
          reasonCode: 'BACKGROUND_IMAGE_OR_GRADIENT',
          blockerSelector: __getSimpleSelectorCached(
            cur,
            (dom.tagName(cur) || '').toLowerCase() || 'html'
          ),
          blockerProperty: 'background-image',
          blockerValue: truncateCssValue(bgImg, 80),
          backgroundFillType: classifyBackgroundImageValue(bgImg)
        };
        try {
          if (el) __computabilityBlockerCache.set(el, out);
        } catch {}
        return out;
      }

      // el's own opacity, when el also paints a background of its own,
      // makes el's background and its text one group faded together (CSS
      // Color 4, opacity): the per-element opacity product would fade the
      // text once and the background walk fade el's background again,
      // measuring a badge darker against lighter than it looks (#95). It is
      // resolved the way an ancestor's is, below, or reported when an effect
      // (image, gradient, blend mode, filter) in the way stops it; a page
      // with no opaque background is left to the root-canvas handling.
      // Without a background of its own, el's opacity only fades the text,
      // which the opacity product already gets right.
      if (cur === el) {
        const ownOpacity = clamp01(Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1'));
        const ownBg = ownOpacity < 1 ? parseCssColorToRgba(cs && cs.backgroundColor) : null;
        if (
          ownBg &&
          ownBg.a > 0 &&
          !resolveGroupOpacityColors(el) &&
          !__groupOpacityRootNotOpaque.has(el)
        ) {
          const out = {
            ok: false,
            reasonCode: 'ELEMENT_OPACITY',
            blockerSelector: __getSimpleSelectorCached(
              cur,
              (dom.tagName(cur) || '').toLowerCase() || 'html'
            ),
            blockerProperty: 'opacity',
            blockerValue: truncateCssValue(String(cs && cs.opacity != null ? cs.opacity : '1'), 80)
          };
          try {
            if (el) __computabilityBlockerCache.set(el, out);
          } catch {}
          return out;
        }
      }

      // An ANCESTOR (not el itself) with fractional opacity is treated
      // as a computability blocker rather than being folded into a
      // confident ratio, UNLESS resolveGroupOpacityColors can resolve it
      // safely (see its own header comment): el's local background is
      // opaque before the opacity ancestor, that ancestor paints nothing
      // of its own, and the backdrop beyond it resolves cleanly. That
      // covers the common case -- a semi-transparent wrapper with no
      // background of its own -- without risking the double-counted,
      // confidently-wrong ratio a naive combination of the existing
      // per-element foreground and ancestor-aware background would
      // produce for the general case. (el's own opacity is handled just
      // above.)
      if (cur !== el) {
        const ancestorOpacity = clamp01(
          Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1')
        );
        if (ancestorOpacity < 1 && resolveGroupOpacityColors(el)) {
          const out = {
            ok: true,
            reasonCode: null,
            blockerSelector: '',
            blockerProperty: '',
            blockerValue: ''
          };
          try {
            if (el) __computabilityBlockerCache.set(el, out);
          } catch {}
          return out;
        }
        if (ancestorOpacity < 1) {
          const out = {
            ok: false,
            reasonCode: 'ANCESTOR_OPACITY',
            blockerSelector: __getSimpleSelectorCached(
              cur,
              (dom.tagName(cur) || '').toLowerCase() || 'html'
            ),
            blockerProperty: 'opacity',
            blockerValue: truncateCssValue(String(cs && cs.opacity != null ? cs.opacity : '1'), 80)
          };
          try {
            if (el) __computabilityBlockerCache.set(el, out);
          } catch {}
          return out;
        }
      }

      // `cur` cleared every check above (no blend-mode/filter/
      // background-image/gradient of its own, and no reduced
      // opacity) -- if its own background-color also happens to be
      // fully opaque, it paints over everything farther out, so
      // suppress BACKGROUND_IMAGE_OR_GRADIENT for any ancestor beyond
      // this point (see the paintOccluded comment above the loop).
      if (!paintOccluded) {
        chain.push(cur);
        const ownBg = parseCssColorToRgba(cs && cs.backgroundColor);
        if (ownBg && clamp01(ownBg.a) >= 1) paintOccluded = true;
      }

      cur = composedParent(cur);
    }

    const overlap = __findPaintUnderText(el, chain);
    const out = overlap
      ? {
          ok: false,
          reasonCode: 'BACKGROUND_OVERLAP',
          blockerSelector: overlap.selector,
          blockerProperty: overlap.property,
          blockerValue: overlap.value
        }
      : {
          ok: true,
          reasonCode: null,
          blockerSelector: '',
          blockerProperty: '',
          blockerValue: ''
        };
    try {
      if (el) __computabilityBlockerCache.set(el, out);
    } catch {}
    return out;
  }

  // -------- Paint behind the text that is not an ancestor's --------
  //
  // The background above is the stack of el's ancestors' backgrounds. What a
  // page paints behind text can come from elsewhere: an <img> hero under a
  // heading positioned over it, a dark sibling block the text is pulled
  // over with a negative margin, an absolutely positioned overlay or a
  // ::before. The ratio against the ancestors is then confidently wrong,
  // so the text is not computable. Needs a layout (a real browser); without
  // one nothing is found and nothing changes.
  //
  // Only paint inside the nearest ancestor whose own background is opaque
  // counts: anything outside it sits behind that background (a hero image
  // under a white card) or is a page-level overlay this check does not try
  // to order. The text's own line boxes are measured, not its element's
  // box, so a float the text wraps around does not count.

  const __OVERLAP_CELL = 256;
  const __OVERLAP_MAX_PAINTERS = 20000;
  const __REPLACED_PAINT = new Set(['img', 'video', 'canvas', 'iframe', 'object', 'embed', 'svg']);
  const __SVG_SHAPE_TAGS = new Set([
    'rect',
    'circle',
    'ellipse',
    'line',
    'polyline',
    'polygon',
    'path'
  ]);
  let __overlapIndex;

  // Called for every element on the page, and most paint nothing: a
  // transparent background and no image are told from the computed values
  // as the browser serializes them, before anything is parsed.
  function __paintOf(node, cs) {
    if (!cs) return null;
    const paint = __paintCandidate(node, cs);
    if (!paint) return null;
    if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return null;
    if (clamp01(Number.parseFloat(cs.opacity != null ? cs.opacity : '1')) === 0) return null;
    return paint;
  }

  function __paintCandidate(node, cs) {
    const tag = String(dom.localName(node) || '').toLowerCase();
    // SVG shapes paint with fill and stroke, not a CSS background (#96). A
    // <line> has no inside to fill.
    if (__SVG_SHAPE_TAGS.has(tag) && dom.namespaceURI(node) === __SVG_NS) {
      const fill = trim(cs.fill);
      if (tag !== 'line' && fill && fill !== 'none')
        return { property: 'fill', value: truncateCssValue(fill, 80) };
      const stroke = trim(cs.stroke);
      if (stroke && stroke !== 'none')
        return { property: 'stroke', value: truncateCssValue(stroke, 80) };
      return null;
    }
    if ((tag === 'image' || tag === 'use') && dom.namespaceURI(node) === __SVG_NS) {
      return { property: 'element', value: tag };
    }
    if (__REPLACED_PAINT.has(tag) && !(tag === 'svg' && node.ownerSVGElement)) {
      return { property: 'element', value: tag };
    }
    const rawBg = cs.backgroundColor;
    if (rawBg !== 'rgba(0, 0, 0, 0)' && rawBg !== 'transparent') {
      const raw = trim(rawBg);
      const bg = parseCssColorToRgba(raw);
      if ((bg && bg.a > 0) || (!bg && raw)) return { property: 'background-color', value: raw };
    }
    const img = cs.backgroundImage;
    if (img && img !== 'none' && hasBackgroundImageOrGradient(cs)) {
      return { property: 'background-image', value: truncateCssValue(img, 80) };
    }
    return null;
  }

  // Fixed and sticky boxes, and what is inside them, sit over the page as
  // it scrolls: a cookie banner, a sticky header. They cover text rather
  // than paint behind it, and where they stand depends on the scroll
  // position the scan was taken at.
  const __pinnedCache = new WeakMap();
  function __isPinned(node) {
    const path = [];
    let cur = node;
    let pinned = false;
    let guard = 0;
    while (cur && dom.nodeType(cur) === 1 && guard++ < 200) {
      if (__pinnedCache.has(cur)) {
        pinned = __pinnedCache.get(cur);
        break;
      }
      path.push(cur);
      const cs = __contrastComputedStyle(cur);
      if (cs && (cs.position === 'fixed' || cs.position === 'sticky')) {
        pinned = true;
        break;
      }
      cur = composedParent(cur);
    }
    for (const n of path) __pinnedCache.set(n, pinned);
    return pinned;
  }

  // The content of a closed <details> (everything but its first <summary>), and
  // whatever sits under content-visibility: hidden (hidden="until-found"
  // too), keeps its layout box in Chromium, so it has a rect, but none of it
  // is painted. checkVisibility() answers that; without it, the two are
  // looked for along the composed ancestors.
  function __isUnpainted(node) {
    if (typeof dom.get(node, 'checkVisibility') === 'function') {
      try {
        return !dom.checkVisibility(node);
      } catch {}
    }
    // A shadow root on the way up is stepped over to its host.
    let child = node;
    let cur = composedParent(node);
    for (let guard = 0; cur && guard < 1000; guard++) {
      if (dom.nodeType(cur) === 1) {
        if (
          String(dom.localName(cur) || '').toLowerCase() === 'details' &&
          !dom.hasAttribute(cur, 'open') &&
          child !== __firstSummaryChild(cur)
        ) {
          return true;
        }
        const cs = __contrastComputedStyle(cur);
        if (cs && cs.contentVisibility === 'hidden') return true;
      }
      child = cur;
      cur = composedParent(cur);
    }
    return false;
  }

  // Only the first <summary> child of a <details> is its toggle.
  function __firstSummaryChild(details) {
    for (let c = dom.firstElementChild(details); c; c = dom.nextElementSibling(c)) {
      if (String(dom.localName(c) || '').toLowerCase() === 'summary') return c;
    }
    return null;
  }

  function __buildOverlapIndex() {
    const doc = window && window.document;
    if (!doc || !dom.documentElement(doc) || typeof dom.get(doc, 'createRange') !== 'function')
      return null;
    try {
      const rootRects = dom.getClientRects(dom.documentElement(doc));
      if (!rootRects || !rootRects.length) return null;
    } catch {
      return null;
    }
    const painters = [];
    const cells = new Map();
    const roots = [doc];
    for (let ri = 0; ri < roots.length; ri++) {
      let all;
      try {
        all = dom.querySelectorAll(roots[ri], '*');
      } catch {
        continue;
      }
      for (const node of all) {
        if (dom.shadowRoot(node)) roots.push(dom.shadowRoot(node));
        const cs = __contrastComputedStyle(node);
        const paint = __paintOf(node, cs);
        if (!paint || __isUnpainted(node)) continue;
        // An inline box that wraps has one fragment per line, and its
        // bounding box spans the lines between: what it paints is the
        // fragments.
        let boxes;
        try {
          boxes =
            cs &&
            String(cs.display).startsWith('inline') &&
            !__REPLACED_PAINT.has(String(dom.localName(node) || '').toLowerCase())
              ? Array.from(dom.getClientRects(node))
              : [dom.getBoundingClientRect(node)];
        } catch {
          continue;
        }
        for (const r of boxes) {
          if (!r || !(r.width >= 1) || !(r.height >= 1)) continue;
          if (painters.length >= __OVERLAP_MAX_PAINTERS) return null;
          const index = painters.length;
          painters.push({ el: node, rect: r, paint });
          const x0 = Math.floor(r.left / __OVERLAP_CELL);
          const x1 = Math.floor(r.right / __OVERLAP_CELL);
          const y0 = Math.floor(r.top / __OVERLAP_CELL);
          const y1 = Math.floor(r.bottom / __OVERLAP_CELL);
          for (let cx = x0; cx <= x1; cx++) {
            for (let cy = y0; cy <= y1; cy++) {
              const key = cx + ',' + cy;
              const list = cells.get(key);
              if (list) list.push(index);
              else cells.set(key, [index]);
            }
          }
        }
      }
    }
    return { painters, cells };
  }

  function __getOverlapIndex() {
    if (__overlapIndex === undefined) {
      try {
        const sc = shared && shared.__contrastSharedCache;
        if (sc && sc.__overlapIndex !== undefined) __overlapIndex = sc.__overlapIndex;
        else {
          __overlapIndex = __buildOverlapIndex();
          if (sc) sc.__overlapIndex = __overlapIndex;
        }
      } catch {
        __overlapIndex = null;
      }
    }
    return __overlapIndex;
  }

  // The line boxes of el's own text.
  function __ownTextRects(el) {
    const doc = dom.ownerDocument(el);
    const out = [];
    let range;
    try {
      range = dom.createRange(doc);
    } catch {
      return out;
    }
    for (let n = dom.firstChild(el); n && out.length < 50; n = dom.nextSibling(n)) {
      if (dom.nodeType(n) !== 3 || !trim(dom.nodeValue(n))) continue;
      try {
        range.selectNodeContents(n);
        for (const r of dom.getClientRects(range)) {
          if (r.width >= 1 && r.height >= 1) out.push(r);
        }
      } catch {}
    }
    return out;
  }

  // Two boxes meet when they share at least 2px across. Against a line of
  // text, paint has to cover about a glyph of it, half the line's height
  // across and a third down: a glyph box runs past a tight line-height into
  // the block above or below, and an icon can nudge into the text beside
  // it, and neither puts the line on that paint.
  const __intersects = (a, b) =>
    Math.min(a.right, b.right) - Math.max(a.left, b.left) >= 2 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) >= 2;
  const __coversLine = (paint, line) =>
    Math.min(paint.right, line.right) - Math.max(paint.left, line.left) >=
      Math.max(2, Math.min(line.width, line.height / 2)) &&
    Math.min(paint.bottom, line.bottom) - Math.max(paint.top, line.top) >=
      Math.max(2, line.height / 3);

  function __isComposedInside(node, container) {
    let cur = node;
    let guard = 0;
    while (cur && guard++ < 1000) {
      if (cur === container) return true;
      cur = composedParent(cur);
    }
    return false;
  }

  // Where an absolutely positioned pseudo-element of a positioned host sits,
  // from its resolved offsets and size, which a browser reports in pixels
  // for an element positioned out of flow. Its containing block is the
  // host's padding box. A scale or translation is applied about the
  // transform origin; a pseudo-element scaled to nothing paints nothing
  // (an underline waiting for hover), so it is `false`. null when the
  // browser does not give pixels, or the transform rotates or skews, and
  // then the host's box stands in.
  function __pseudoBox(host, hostCs, pcs) {
    try {
      if (pcs.position !== 'absolute') return null;
      const px = (v) => (/^-?[\d.]+px$/.test(String(v || '')) ? Number.parseFloat(v) : NaN);
      const left = px(pcs.left);
      const top = px(pcs.top);
      const width = px(pcs.width);
      const height = px(pcs.height);
      if (![left, top, width, height].every(Number.isFinite)) return null;
      let m = [1, 0, 0, 1, 0, 0];
      const t = trim(pcs.transform);
      if (t && t !== 'none') {
        const mm = /^matrix\(([^)]*)\)$/.exec(t);
        if (!mm) return null;
        m = mm[1].split(',').map((v) => Number.parseFloat(v));
        if (m.length !== 6 || !m.every(Number.isFinite) || m[1] !== 0 || m[2] !== 0) return null;
        if (m[0] === 0 || m[3] === 0) return false;
      }
      const origin = String(pcs.transformOrigin || '').split(/\s+/);
      const ox = Number.isFinite(px(origin[0])) ? px(origin[0]) : width / 2;
      const oy = Number.isFinite(px(origin[1])) ? px(origin[1]) : height / 2;
      const r = dom.getBoundingClientRect(host);
      const baseX = r.left + (px(hostCs.borderLeftWidth) || 0) + left;
      const baseY = r.top + (px(hostCs.borderTopWidth) || 0) + top;
      const xs = [0, width].map((u) => baseX + ox + m[0] * (u - ox) + m[4]);
      const ys = [0, height].map((v) => baseY + oy + m[3] * (v - oy) + m[5]);
      const box = {
        left: Math.min(xs[0], xs[1]),
        right: Math.max(xs[0], xs[1]),
        top: Math.min(ys[0], ys[1]),
        bottom: Math.max(ys[0], ys[1])
      };
      box.width = box.right - box.left;
      box.height = box.bottom - box.top;
      return box;
    } catch {
      return null;
    }
  }

  // A positioned element's ::before or ::after when it is positioned out of
  // flow and paints a color or gradient, as { name, property, value }; null
  // otherwise.
  const __positionedPaintPseudoCache = new WeakMap();
  function __hasPositionedPaintPseudo(host) {
    if (__positionedPaintPseudoCache.has(host)) return __positionedPaintPseudoCache.get(host);
    let found = null;
    // The overlay pattern positions the pseudo-element against its own
    // element, which is then positioned itself; reading every element's
    // pseudo-elements would cost a style lookup per text element.
    const hostCs = __contrastComputedStyle(host);
    const positioned = !!hostCs && !!hostCs.position && hostCs.position !== 'static';
    if (positioned && window && typeof window.getComputedStyle === 'function') {
      for (const name of ['::before', '::after']) {
        let pcs;
        try {
          pcs = window.getComputedStyle(host, name);
        } catch {
          continue;
        }
        if (!pcs) continue;
        const content = trim(pcs.content);
        if (!content || content === 'none' || content === 'normal') continue;
        if (pcs.position !== 'absolute' && pcs.position !== 'fixed') continue;
        if (pcs.display === 'none') continue;
        if (clamp01(Number.parseFloat(pcs.opacity != null ? pcs.opacity : '1')) === 0) continue;
        const bg = parseCssColorToRgba(pcs.backgroundColor);
        const gradient = /gradient\(/i.test(String(pcs.backgroundImage || ''));
        if (!(bg && bg.a > 0) && !gradient) continue;
        const box = __pseudoBox(host, hostCs, pcs);
        if (box === false) continue;
        found = {
          name,
          property: gradient ? 'background-image' : 'background-color',
          value: truncateCssValue(gradient ? pcs.backgroundImage : pcs.backgroundColor, 80),
          box
        };
        break;
      }
    }
    __positionedPaintPseudoCache.set(host, found);
    return found;
  }

  // `chain` is el and its ancestors up to and including the first with an
  // opaque background of its own (all of them when none has one).
  function __findPaintUnderText(el, chain) {
    try {
      if (!el || dom.nodeType(el) !== 1 || !chain.length) return null;
      const index = __getOverlapIndex();
      if (!index) return null;
      const opaque = chain[chain.length - 1];
      const ancestors = new Set(chain);
      // Painters near el's box at all, before measuring its text, which
      // costs more: on most pages nothing but ancestors paints there.
      const near = (r) => {
        const x0 = Math.floor(r.left / __OVERLAP_CELL);
        const x1 = Math.floor(r.right / __OVERLAP_CELL);
        const y0 = Math.floor(r.top / __OVERLAP_CELL);
        const y1 = Math.floor(r.bottom / __OVERLAP_CELL);
        for (let cx = x0; cx <= x1; cx++) {
          for (let cy = y0; cy <= y1; cy++) {
            for (const i of index.cells.get(cx + ',' + cy) || []) {
              const p = index.painters[i];
              if (!ancestors.has(p.el) && __intersects(p.rect, r)) return true;
            }
          }
        }
        return false;
      };
      let box = null;
      try {
        box = dom.getBoundingClientRect(el);
      } catch {}
      const pseudoCandidates = chain.some((host) => __hasPositionedPaintPseudo(host));
      // The paint order decides about paint that isn't an ancestor's, and
      // about ancestors' paint that isn't under the text (__paintBackdropOf):
      // measured against, in the way, or irrelevant. Where it can't be
      // worked out, the search below looks for it.
      const ordered = __paintBackdropOf(el);
      if (ordered && ordered.blocked) return ordered.blocked;
      const paintOrdered = ordered === null || !!(ordered && ordered.rgba);
      if (box && !pseudoCandidates && (paintOrdered || !near(box))) return null;
      const rects = __ownTextRects(el);
      if (!rects.length) return null;
      // Solid paint the same color as the background the text is measured
      // against changes nothing (a white fade-out over white text).
      let measured = null;
      try {
        const bg = computeEffectiveBackground(el, {});
        measured = bg && bg.ok && bg.rgba ? bg.rgba : null;
      } catch {}
      const sameAsMeasured = (value) => {
        const c = measured && parseCssColorToRgba(value);
        return !!c && c.a >= 1 && c.r === measured.r && c.g === measured.g && c.b === measured.b;
      };

      // The <rect>s SVG text is measured against are its background, not
      // paint in the way of measuring it (see __svgBackdropOf).
      const backdrop = __svgBackdropOf(el);
      const backdropEls =
        backdrop && !backdrop.blocked ? new Set(backdrop.layers.map((l) => l.el)) : null;

      const seen = new Set();
      for (const tr of paintOrdered ? [] : rects) {
        const x0 = Math.floor(tr.left / __OVERLAP_CELL);
        const x1 = Math.floor(tr.right / __OVERLAP_CELL);
        const y0 = Math.floor(tr.top / __OVERLAP_CELL);
        const y1 = Math.floor(tr.bottom / __OVERLAP_CELL);
        for (let cx = x0; cx <= x1; cx++) {
          for (let cy = y0; cy <= y1; cy++) {
            for (const i of index.cells.get(cx + ',' + cy) || []) {
              if (seen.has(i)) continue;
              seen.add(i);
              const p = index.painters[i];
              if (ancestors.has(p.el) || !__coversLine(p.rect, tr)) continue;
              if (backdropEls && backdropEls.has(p.el)) continue;
              // Pinned paint is in the index but never counts; asked only
              // of the few painters that reach text, since it walks the
              // ancestors.
              if (__isPinned(p.el)) continue;
              // An ancestor beyond `opaque` is behind its background.
              if (__isComposedInside(el, p.el)) continue;
              // Inside el: paint of its own descendants, beside its text.
              if (__isComposedInside(p.el, el)) continue;
              if (!__isComposedInside(p.el, opaque)) continue;
              if (p.paint.property === 'background-color' && sameAsMeasured(p.paint.value))
                continue;
              return {
                selector: __getSimpleSelectorCached(p.el, String(dom.localName(p.el) || '')),
                property: p.paint.property,
                value: p.paint.value
              };
            }
          }
        }
      }

      // A positioned ::before or ::after on el or an ancestor, painting a
      // color or gradient: the overlay pattern. Its box can't be measured,
      // so its element's box stands in for it.
      for (const host of chain) {
        const pseudo = __hasPositionedPaintPseudo(host);
        if (!pseudo) continue;
        if (pseudo.property === 'background-color' && sameAsMeasured(pseudo.value)) continue;
        let hostRect = pseudo.box;
        if (!hostRect) {
          try {
            hostRect = dom.getBoundingClientRect(host);
          } catch {
            hostRect = null;
          }
        }
        if (!hostRect || !rects.some((tr) => __coversLine(hostRect, tr))) continue;
        return {
          selector:
            __getSimpleSelectorCached(host, String(dom.localName(host) || '')) + pseudo.name,
          property: pseudo.property,
          value: pseudo.value
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  // -------- SVG shapes behind SVG text (#96) --------
  //
  // SVG paints in document order, so a shape earlier than a text element and
  // under it is the text's background, which no CSS background shows. The
  // simple case is measured: a <rect> with a solid fill, painted before the
  // text, not rotated, covering all of the text clear of its rounded corners
  // and stroke, with nothing between it and the text that groups it (opacity,
  // a filter, a mask or a clip). Several such rects stack. Any other shape
  // under or over the text is left to the paint-overlap check, which reports
  // it. Needs a layout; without one nothing is found and nothing changes.
  const __svgBackdropCache = new WeakMap();

  function __svgBackdropOf(el) {
    if (!__isSvgTextElement(el)) return null;
    if (__svgBackdropCache.has(el)) return __svgBackdropCache.get(el);
    let out;
    try {
      out = __computeSvgBackdrop(el);
    } catch {
      out = null;
    }
    __svgBackdropCache.set(el, out);
    return out;
  }

  function __computeSvgBackdrop(el) {
    const index = __getOverlapIndex();
    if (!index) return null;
    let svg = composedParent(el);
    let guard = 0;
    while (
      svg &&
      guard++ < 1000 &&
      !(dom.namespaceURI(svg) === __SVG_NS && String(dom.localName(svg)) === 'svg')
    ) {
      svg = composedParent(svg);
    }
    if (!svg) return null;
    const rects = __ownTextRects(el);
    if (!rects.length) return null;
    const layers = [];
    const seen = new Set();
    for (const tr of rects) {
      const x0 = Math.floor(tr.left / __OVERLAP_CELL);
      const x1 = Math.floor(tr.right / __OVERLAP_CELL);
      const y0 = Math.floor(tr.top / __OVERLAP_CELL);
      const y1 = Math.floor(tr.bottom / __OVERLAP_CELL);
      for (let cx = x0; cx <= x1; cx++) {
        for (let cy = y0; cy <= y1; cy++) {
          for (const i of index.cells.get(cx + ',' + cy) || []) {
            if (seen.has(i)) continue;
            seen.add(i);
            const p = index.painters[i];
            if (p.el === svg || !__isComposedInside(p.el, svg)) continue;
            if (!__coversLine(p.rect, tr) || __isComposedInside(el, p.el)) continue;
            const rgba = __svgRectLayer(p.el, p.rect, el, rects);
            if (!rgba) return { layers: [], blocked: true };
            if (!layers.some((l) => l.el === p.el)) layers.push({ el: p.el, rgba });
          }
        }
      }
    }
    // Bottom first, as painted.
    layers.sort((a, b) => (dom.compareDocumentPosition(a.el, b.el) & 4 ? -1 : 1));
    return { layers, blocked: false };
  }

  // The color a <rect> paints behind all of el's text, or null when it isn't
  // that simple case.
  function __svgRectLayer(shape, box, el, textRects) {
    if (String(dom.localName(shape)) !== 'rect') return null;
    // Painted before el: el follows it in document order.
    if (!(dom.compareDocumentPosition(shape, el) & 4)) return null;
    const cs = __contrastComputedStyle(shape);
    const fill = parseCssColorToRgba(cs && cs.fill);
    if (!fill) return null;
    const grouped = (node, ncs) =>
      __hasBlendModeEl(node, ncs) ||
      __hasFilterEl(node, ncs) ||
      (trim(ncs && ncs.clipPath) && trim(ncs.clipPath) !== 'none') ||
      (trim(ncs && ncs.maskImage) && trim(ncs.maskImage) !== 'none');
    if (grouped(shape, cs)) return null;
    // Up to the first ancestor el shares, whose effects apply to both.
    for (
      let cur = composedParent(shape), guard = 0;
      cur && guard < 1000 && !__isComposedInside(el, cur);
      cur = composedParent(cur), guard++
    ) {
      const ccs = __contrastComputedStyle(cur);
      if (grouped(cur, ccs)) return null;
      if (clamp01(Number.parseFloat(ccs && ccs.opacity != null ? ccs.opacity : '1')) < 1)
        return null;
    }
    let ctm;
    try {
      ctm = dom.getScreenCTM(shape);
    } catch {
      ctm = null;
    }
    if (!ctm || Math.abs(ctm.b) > 1e-6 || Math.abs(ctm.c) > 1e-6 || !(ctm.a > 0) || !(ctm.d > 0))
      return null;
    // Rounded corners and the inner half of a stroke don't paint the fill.
    const len = (v) => {
      const n = parsePx(v);
      return Number.isFinite(n) && n > 0 ? n : 0;
    };
    let rx = len(cs.rx);
    let ry = len(cs.ry);
    if (!rx) rx = ry;
    if (!ry) ry = rx;
    const stroke = trim(cs.stroke);
    const halfStroke = stroke && stroke !== 'none' ? len(cs.strokeWidth) / 2 : 0;
    const ix = Math.max(rx, halfStroke) * ctm.a;
    const iy = Math.max(ry, halfStroke) * ctm.d;
    const inside = (r) =>
      r.left >= box.left + ix - 0.5 &&
      r.right <= box.right - ix + 0.5 &&
      r.top >= box.top + iy - 0.5 &&
      r.bottom <= box.bottom - iy + 0.5;
    if (!textRects.every(inside)) return null;
    const fillOpacity = Number.parseFloat(cs.fillOpacity);
    const opacity = Number.parseFloat(cs.opacity);
    const a = clamp01(
      fill.a *
        (Number.isFinite(fillOpacity) ? clamp01(fillOpacity) : 1) *
        (Number.isFinite(opacity) ? clamp01(opacity) : 1)
    );
    return { r: fill.r, g: fill.g, b: fill.b, a };
  }

  // -------- Paint order: what lies under a piece of text (#101) --------
  //
  // The background walk sees only el's ancestors. Other boxes can paint
  // under the text (a positioned panel, a fixed backdrop) or over it, and
  // which one it is follows CSS's painting order (CSS 2.1 Appendix E):
  // stacking contexts, then within one, negative z-index, block
  // backgrounds, floats, inline content (text), positioned boxes and
  // z-index 0, positive z-index, each in document order. This orders el's
  // text, its ancestors' backgrounds and the boxes overlapping it, and
  // composites what lies under the text from the top down. Solid colors
  // covering all of the text are measured against; anything else under or
  // over the text (an image, a gradient, partial cover, a group effect) is
  // reported. A fixed or sticky box over the text is not: it covers it at
  // the scroll position the scan was taken at only.
  //
  // __paintBackdropOf returns null when no such box takes part (the
  // ancestors decide, as before), { rgba } for the color under the text,
  // { blocked } for paint in the way, or { fallback: true } where the order
  // isn't worked out here (SVG text, a group effect on an ancestor, another
  // tree), which leaves the overlap search to the older check.
  const __paintBackdropCache = new WeakMap();
  const __paintKeyCache = new WeakMap();
  // Boxes of the ancestors that paint, shared by the texts inside them.
  const __paintBoxCache = new WeakMap();
  const __lname = (node) => String(dom.localName(node) || '').toLowerCase();

  function __isStackingContext(node, cs) {
    if (!cs) return false;
    if (__lname(node) === 'html') return true;
    const pos = cs.position;
    if (pos === 'fixed' || pos === 'sticky') return true;
    if ((pos === 'absolute' || pos === 'relative') && cs.zIndex !== 'auto') return true;
    if (clamp01(Number.parseFloat(cs.opacity != null ? cs.opacity : '1')) < 1) return true;
    const set = (v) => !!v && v !== 'none';
    if (
      set(cs.transform) ||
      set(cs.filter) ||
      set(cs.backdropFilter) ||
      set(cs.perspective) ||
      set(cs.clipPath) ||
      set(cs.maskImage) ||
      set(cs.webkitMaskImage)
    )
      return true;
    if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') return true;
    if (cs.isolation === 'isolate') return true;
    if (/\b(paint|layout|strict|content)\b/.test(String(cs.contain || ''))) return true;
    if (
      /\b(transform|opacity|filter|perspective|clip-path|mask)\b/.test(String(cs.willChange || ''))
    )
      return true;
    if (cs.zIndex && cs.zIndex !== 'auto') {
      const parent = composedParent(node);
      const pcs = parent && dom.nodeType(parent) === 1 ? __contrastComputedStyle(parent) : null;
      if (pcs && /(^|-)(flex|grid)$/.test(String(pcs.display || ''))) return true;
    }
    return false;
  }

  // How a box paints as one unit in its stacking context: its phase and
  // z-index there. null for a box painted with its context's own phases.
  const __paintGroupCache = new WeakMap();
  function __paintGroup(node) {
    if (__paintGroupCache.has(node)) return __paintGroupCache.get(node);
    const g = __computePaintGroup(node);
    __paintGroupCache.set(node, g);
    return g;
  }
  function __computePaintGroup(node) {
    const cs = __contrastComputedStyle(node);
    if (!cs) return null;
    if (__isStackingContext(node, cs)) {
      const z = Number.parseInt(cs.zIndex, 10) || 0;
      return { kind: 'context', phase: z < 0 ? 1 : z === 0 ? 5 : 6, z };
    }
    if (cs.position && cs.position !== 'static') return { kind: 'positioned', phase: 5, z: 0 };
    const float = cs.cssFloat || cs.float;
    if (float && float !== 'none') return { kind: 'float', phase: 3, z: 0 };
    if (/^inline-(block|flex|grid|table)$/.test(String(cs.display || '')))
      return { kind: 'inline-block', phase: 4, z: 0 };
    return null;
  }

  // The box node paints in: the nearest stacking context, or for content
  // that isn't positioned, the nearest box painted as a unit.
  function __paintContextOf(node) {
    const g = __paintGroup(node);
    const hoisted = !!g && (g.kind === 'context' || g.kind === 'positioned');
    for (
      let cur = composedParent(node), guard = 0;
      cur && dom.nodeType(cur) === 1 && guard < 1000;
      cur = composedParent(cur), guard++
    ) {
      if (__lname(cur) === 'html') return cur;
      const cg = __paintGroup(cur);
      if (!cg) continue;
      if (cg.kind === 'context' || !hoisted) return cur;
    }
    return null;
  }

  function __participantKey(node) {
    if (__paintKeyCache.has(node)) return __paintKeyCache.get(node);
    let key;
    if (__lname(node) === 'html') key = [];
    else {
      const ctx = __paintContextOf(node);
      const g = __paintGroup(node);
      const base = ctx && g ? __participantKey(ctx) : null;
      key = base ? base.concat([[g.phase, g.z, node]]) : null;
    }
    __paintKeyCache.set(node, key);
    return key;
  }

  // When node's background ('bg') or its own text and replaced content
  // ('content') is painted, as a key ordered by __cmpPaintKeys.
  function __paintKey(node, part) {
    const isRoot = __lname(node) === 'html';
    if (isRoot || __paintGroup(node)) {
      const base = __participantKey(node);
      return base ? base.concat([[part === 'bg' ? 0 : 4, 0, node]]) : null;
    }
    const ctx = __paintContextOf(node);
    const base = ctx ? __participantKey(ctx) : null;
    if (!base) return null;
    const cs = __contrastComputedStyle(node);
    const inline = /^inline/.test(String((cs && cs.display) || ''));
    const phase = part === 'bg' && !inline ? 2 : 4;
    return base.concat([[phase, 0, node]]);
  }

  // Negative when a is painted before b; NaN when they are in different
  // trees and can't be ordered here.
  function __cmpPaintKeys(a, b) {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const x = a[i];
      const y = b[i];
      if (x[0] !== y[0]) return x[0] - y[0];
      if (x[1] !== y[1]) return x[1] - y[1];
      if (x[2] !== y[2]) {
        const pos = dom.compareDocumentPosition(x[2], y[2]);
        if (pos & 1) return Number.NaN;
        return pos & 4 ? -1 : 1;
      }
    }
    return a.length - b.length;
  }

  function __paintBackdropOf(el) {
    if (!el || dom.nodeType(el) !== 1) return null;
    if (__paintBackdropCache.has(el)) return __paintBackdropCache.get(el);
    let out;
    try {
      out = __computePaintBackdrop(el);
    } catch {
      out = { fallback: true };
    }
    __paintBackdropCache.set(el, out);
    return out;
  }

  function __computePaintBackdrop(el) {
    const FALLBACK = { fallback: true };
    if (__isSvgTextElement(el)) return FALLBACK;
    const index = __getOverlapIndex();
    if (!index) return FALLBACK;
    const chain = [];
    for (
      let cur = el, guard = 0;
      cur && dom.nodeType(cur) === 1 && guard < 1000;
      cur = composedParent(cur), guard++
    ) {
      chain.push(cur);
    }
    const inChain = new Set(chain);
    const outerSvg = (node) => {
      let found = null;
      for (let cur = node, guard = 0; cur && guard < 1000; cur = composedParent(cur), guard++) {
        if (__lname(cur) === 'svg' && dom.namespaceURI(cur) === __SVG_NS) found = cur;
      }
      return found;
    };
    const blocked = (p) => ({
      blocked: {
        selector: __getSimpleSelectorCached(p.el, __lname(p.el)),
        property: p.paint.property,
        value: p.paint.value
      }
    });

    // Painters near el's box at all, before measuring its text.
    let box;
    try {
      box = dom.getBoundingClientRect(el);
    } catch {
      box = null;
    }
    if (!box) return FALLBACK;
    let near = false;
    const bx0 = Math.floor(box.left / __OVERLAP_CELL);
    const bx1 = Math.floor(box.right / __OVERLAP_CELL);
    const by0 = Math.floor(box.top / __OVERLAP_CELL);
    const by1 = Math.floor(box.bottom / __OVERLAP_CELL);
    for (let cx = bx0; cx <= bx1 && !near; cx++) {
      for (let cy = by0; cy <= by1 && !near; cy++) {
        for (const i of index.cells.get(cx + ',' + cy) || []) {
          const p = index.painters[i];
          if (!inChain.has(p.el) && __intersects(p.rect, box) && !__isComposedInside(p.el, el)) {
            near = true;
            break;
          }
        }
      }
    }
    // The canvas (the root, or the body when the root paints nothing)
    // covers the page; any other ancestor's background lies under the text
    // only where its box does.
    const root = chain[chain.length - 1];
    const rootCs = __contrastComputedStyle(root);
    const rootBg = parseCssColorToRgba(rootCs && rootCs.backgroundColor);
    const rootPaints =
      (rootBg && rootBg.a > 0) || (rootCs && __hasBackgroundImageOrGradientEl(root, rootCs));
    const isCanvas = (a) => a === root || (__lname(a) === 'body' && !rootPaints);
    const paints = (a, cs) => {
      if (!cs) return false;
      const bg = parseCssColorToRgba(cs.backgroundColor);
      return (bg && bg.a > 0) || __hasBackgroundImageOrGradientEl(a, cs);
    };
    const boxOf = (a) => {
      if (__paintBoxCache.has(a)) return __paintBoxCache.get(a);
      let r;
      try {
        r = dom.getBoundingClientRect(a);
      } catch {
        r = null;
      }
      __paintBoxCache.set(a, r);
      return r;
    };
    const contains = (r, t) =>
      !!r &&
      t.left >= r.left - 0.5 &&
      t.right <= r.right + 0.5 &&
      t.top >= r.top - 0.5 &&
      t.bottom <= r.bottom + 0.5;
    const outside = chain.some(
      (a) => !isCanvas(a) && paints(a, __contrastComputedStyle(a)) && !contains(boxOf(a), box)
    );
    // Text in a stacking context with a negative z-index can be painted
    // under its own ancestors' backgrounds.
    const sunk = chain.some((a) => {
      const g = __paintGroup(a);
      return !!g && g.kind === 'context' && g.z < 0;
    });
    if (!near && !outside && !sunk) return null;
    const rects = __ownTextRects(el);
    if (!rects.length) return null;
    const textKey = __paintKey(el, 'content');
    if (!textKey) return FALLBACK;

    // The boxes that meet the text, in front of it or behind. Candidates
    // come from every line's cells first, so a box is tested against every
    // line, not only the first one whose cells hold it.
    const candidates = new Set();
    for (const tr of rects) {
      const x0 = Math.floor(tr.left / __OVERLAP_CELL);
      const x1 = Math.floor(tr.right / __OVERLAP_CELL);
      const y0 = Math.floor(tr.top / __OVERLAP_CELL);
      const y1 = Math.floor(tr.bottom / __OVERLAP_CELL);
      for (let cx = x0; cx <= x1; cx++) {
        for (let cy = y0; cy <= y1; cy++) {
          for (const i of index.cells.get(cx + ',' + cy) || []) candidates.add(i);
        }
      }
    }
    const behind = [];
    for (const i of candidates) {
      const p = index.painters[i];
      if (inChain.has(p.el) || !rects.some((tr) => __coversLine(p.rect, tr))) continue;
      if (__isComposedInside(p.el, el)) continue;
      // Shapes inside an <svg> paint with it.
      const orderEl = outerSvg(p.el) || p.el;
      if (inChain.has(orderEl)) continue;
      const key = __paintKey(orderEl, p.paint.property === 'element' ? 'content' : 'bg');
      const c = key ? __cmpPaintKeys(key, textKey) : Number.NaN;
      if (Number.isNaN(c)) return FALLBACK;
      if (c > 0) {
        if (__isPinned(p.el)) continue;
        return blocked(p);
      }
      behind.push({ p, key, svg: orderEl !== p.el });
    }
    if (!behind.length && !outside && !sunk) return null;

    // el's ancestors' backgrounds where they lie under the text, with what
    // else lies behind it.
    const layers = [];
    let changed = null;
    for (const a of chain) {
      const cs = __contrastComputedStyle(a);
      if (!cs) continue;
      // A group effect on an ancestor applies to the foreign paint too only
      // when it groups both; that is left to the older checks.
      if (
        clamp01(Number.parseFloat(cs.opacity != null ? cs.opacity : '1')) < 1 ||
        __hasBlendModeEl(a, cs) ||
        __hasFilterEl(a, cs)
      )
        return FALLBACK;
      const image = __hasBackgroundImageOrGradientEl(a, cs);
      const bg = parseCssColorToRgba(cs.backgroundColor);
      if (!image && (!bg || bg.a === 0)) continue;
      const own = {
        el: a,
        paint: { property: 'background-color', value: trim(cs.backgroundColor) }
      };
      let color = image ? null : bg;
      let partial = null;
      if (!isCanvas(a)) {
        const r = boxOf(a);
        const under = rects.filter((t) => contains(r, t)).length;
        // Text that overflows the box isn't over its background.
        if (!under && !rects.some((t) => !!r && __intersects(r, t))) {
          changed = changed || own;
          continue;
        }
        if (under < rects.length) {
          color = null;
          partial = own;
        }
      }
      // Without a background of its own, the root takes the body's: it
      // paints the canvas, under everything.
      const key = __lname(a) === 'body' && !rootPaints ? [[-1, 0, a]] : __paintKey(a, 'bg');
      if (!key) return FALLBACK;
      // Text with a negative z-index is painted under an ancestor's
      // background, which then covers it.
      const order = __cmpPaintKeys(key, textKey);
      if (Number.isNaN(order)) return FALLBACK;
      if (order > 0) return blocked(own);
      layers.push({ el: a, key, color, foreign: null, partial });
    }
    for (const b of behind) {
      const cs = __contrastComputedStyle(b.p.el);
      let color =
        !b.svg && b.p.paint.property === 'background-color'
          ? parseCssColorToRgba(b.p.paint.value)
          : null;
      // Grouped with something el isn't in: its own opacity, a filter.
      for (
        let cur = b.p.el, guard = 0;
        color && cur && dom.nodeType(cur) === 1 && guard < 1000 && !__isComposedInside(el, cur);
        cur = composedParent(cur), guard++
      ) {
        const ccs = __contrastComputedStyle(cur);
        if (
          clamp01(Number.parseFloat(ccs && ccs.opacity != null ? ccs.opacity : '1')) < 1 ||
          __hasBlendModeEl(cur, ccs) ||
          __hasFilterEl(cur, ccs)
        )
          color = null;
      }
      // All of the text, clear of rounded corners.
      if (color) {
        const radius = Math.max(
          0,
          ...[
            'borderTopLeftRadius',
            'borderTopRightRadius',
            'borderBottomLeftRadius',
            'borderBottomRightRadius'
          ].map((k) => {
            const v = parsePx(cs && cs[k]);
            return Number.isFinite(v) ? v : 0;
          })
        );
        const r = b.p.rect;
        const inside = (t) =>
          t.left >= r.left + radius - 0.5 &&
          t.right <= r.right - radius + 0.5 &&
          t.top >= r.top + radius - 0.5 &&
          t.bottom <= r.bottom - radius + 0.5;
        if (!rects.every(inside)) color = null;
      }
      layers.push({ el: b.p.el, key: b.key, color, foreign: b.p });
    }

    let unordered = false;
    layers.sort((x, y) => {
      const c = __cmpPaintKeys(y.key, x.key);
      if (Number.isNaN(c)) {
        unordered = true;
        return 0;
      }
      return c;
    });
    if (unordered) return FALLBACK;

    // Topmost first, down to the first opaque layer.
    let acc = { r: 0, g: 0, b: 0, a: 0 };
    let usedForeign = null;
    for (const layer of layers) {
      if (!layer.color) {
        if (layer.foreign) return blocked(layer.foreign);
        if (layer.partial) return blocked(layer.partial);
        // An ancestor's image or gradient: the older checks report it, or
        // the foreign paint under it if they don't.
        return usedForeign ? blocked(usedForeign) : FALLBACK;
      }
      acc = compositeRgba(acc, {
        r: layer.color.r,
        g: layer.color.g,
        b: layer.color.b,
        a: clamp01(layer.color.a)
      });
      if (layer.foreign && !usedForeign) usedForeign = layer.foreign;
      if (acc.a >= 1) break;
    }
    if (!usedForeign && !changed) return null;
    if (acc.a < 1) return blocked(usedForeign || changed);
    return { rgba: { r: acc.r, g: acc.g, b: acc.b, a: 1 } };
  }

  // Whether a's box is painted before b's (negative) or after it
  // (positive), in the painting order above; NaN when it can't be told (a
  // box in another tree, or one that isn't ordered here). target-size-minimum
  // asks it of the boxes over a target (#105).
  function comparePaintOrder(a, b) {
    try {
      const ka = __paintKey(a, 'bg');
      const kb = __paintKey(b, 'bg');
      return ka && kb ? __cmpPaintKeys(ka, kb) : Number.NaN;
    } catch {
      return Number.NaN;
    }
  }

  return {
    clamp01,
    clamp255,
    round2,
    rgbaToString,
    parsePx,
    normalizeFontWeight,
    isLargeText,
    requiredRatio,
    parseCssColorToRgba,
    compositeRgba,
    relativeLuminance,
    contrastRatio,
    toHex2,
    rgbToHex,
    pxToPt,
    fontWeightLabel,
    hasBackgroundImageOrGradient,
    hasBlendMode,
    hasFilter,
    computeOpacityProduct,
    computeEffectiveForeground,
    computeEffectiveBackground,
    getComputabilityBlocker,
    getTextScan,
    textStyleOf,
    isInactiveUiComponent,
    comparePaintOrder,
    isPinned: __isPinned
  };
}

module.exports = { createContrastHelpers };
