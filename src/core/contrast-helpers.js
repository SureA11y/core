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

  // -------- The options of a drop-down <select> (#219) --------
  //
  // A drop-down select (no `multiple`, a size of 1 or none) shows its
  // selected option in the closed control, drawn in the select's own
  // colour, font and background whatever colours the option has. Its
  // other options are shown only in the list it opens, which the platform
  // draws, in the options' colours or in its own. A list box (`multiple`,
  // or a size above 1) draws its options as they are styled, and so does a
  // customizable select (`appearance: base-select`), whose list the page
  // styles; both are left to the options' own colours.

  const __dropDownOptionCache = new WeakMap();

  // For el, an <option> of a drop-down select or an element in one:
  // { select, option, shown, differs }, where shown says whether the option
  // is the one the closed control shows, and differs names the first of
  // its colours that isn't the select's ({ el, property, value }), or is
  // null. Null for every other element.
  function __dropDownOption(el) {
    if (!el || dom.nodeType(el) !== 1) return null;
    if (__dropDownOptionCache.has(el)) return __dropDownOptionCache.get(el);
    let out = null;
    try {
      const option = dom.closest(el, 'option');
      const select = option ? dom.closest(option, 'select') : null;
      const selectCs = select ? __contrastComputedStyle(select) : null;
      if (
        select &&
        selectCs &&
        !dom.get(select, 'multiple') &&
        !(Number(dom.get(select, 'size')) > 1) &&
        String(selectCs.appearance || '') !== 'base-select'
      ) {
        const index = Number(dom.get(select, 'selectedIndex'));
        const options = dom.get(select, 'options');
        const shown = index >= 0 && !!options && options[index] === option;
        let differs = null;
        const cs = __contrastComputedStyle(el);
        const fill = cs ? parseCssColorToRgba(__textFillOf(cs)) : null;
        const selectFill = parseCssColorToRgba(__textFillOf(selectCs));
        if (
          !fill ||
          !selectFill ||
          fill.r !== selectFill.r ||
          fill.g !== selectFill.g ||
          fill.b !== selectFill.b ||
          fill.a !== selectFill.a
        ) {
          differs = { el, property: 'color', value: String((cs && __textFillOf(cs)) || '') };
        }
        // A background, a background image or an opacity of its own on
        // the option, or on an element between it and the select.
        for (
          let cur = el, guard = 0;
          !differs && cur && cur !== select && dom.nodeType(cur) === 1 && guard < 100;
          cur = dom.parentElement(cur), guard++
        ) {
          const ccs = __contrastComputedStyle(cur);
          if (!ccs) continue;
          const bgValue = trim(ccs.backgroundColor);
          const bg = bgValue ? parseCssColorToRgba(bgValue) : { a: 0 };
          const opacity = Number.parseFloat(ccs.opacity);
          if (!bg || bg.a > 0) {
            differs = { el: cur, property: 'background-color', value: trim(ccs.backgroundColor) };
          } else if (__hasBackgroundImageOrGradientEl(cur, ccs)) {
            differs = {
              el: cur,
              property: 'background-image',
              value: trim(ccs.backgroundImage)
            };
          } else if (Number.isFinite(opacity) && opacity < 1) {
            differs = { el: cur, property: 'opacity', value: String(ccs.opacity) };
          }
        }
        out = { select, option, shown, differs };
      }
    } catch {
      out = null;
    }
    __dropDownOptionCache.set(el, out);
    return out;
  }

  // The element whose colours, font and background el's text is drawn in,
  // where that is not el: for text in a drop-down select's shown option,
  // and in any other of its options whose colours are the select's, the
  // select. Null otherwise: an option with colours of its own, shown only
  // in the list the platform draws, is asked about instead
  // (getComputabilityBlocker, SELECT_OPTION_COLOR).
  function __closedSelectTextOwner(el) {
    const dropDown = __dropDownOption(el);
    if (!dropDown) return null;
    return dropDown.shown || !dropDown.differs ? dropDown.select : null;
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

        let hidden;
        try {
          hidden = clippedDistance(el) < 100;
        } catch {
          hidden = false;
        }

        clipHiddenCache.set(el, hidden);
        return hidden;
      };

      // How many steps up from el (0 for el itself) the nearest clipped
      // element is, Infinity when none is. Remembered for every element on
      // the way, so sibling texts do not walk the same ancestors again.
      const clippedDistanceCache = new WeakMap();
      const clippedDistance = (el) => {
        const chain = [];
        let cur = el;
        let known = Infinity;
        while (cur && dom.nodeType(cur) === 1 && chain.length < 10000) {
          if (clippedDistanceCache.has(cur)) {
            known = clippedDistanceCache.get(cur);
            break;
          }
          const info = helpers.getVisibilityHintsInfo(cur, ctx, {});
          if (info && Array.isArray(info.hints) && info.hints.indexOf('clipped') !== -1) {
            known = 0;
            clippedDistanceCache.set(cur, 0);
            break;
          }
          chain.push(cur);
          cur = composedParent ? composedParent(cur) : dom.parentElement(cur);
        }
        for (let i = chain.length - 1; i >= 0; i--) {
          known += 1;
          clippedDistanceCache.set(chain[i], known);
        }
        return chain.length ? clippedDistanceCache.get(chain[0]) : known;
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

      const scrollOf = new Map();
      const isUndrawn = (el) => {
        const cs = __contrastComputedStyle(el);
        if (!cs) return false;
        if (Number.parseFloat(cs.fontSize) === 0) return true;
        const color = parseCssColorToRgba(__textFillOf(cs));
        if (color && color.a === 0) {
          const clip = String(cs.backgroundClip || cs.webkitBackgroundClip || '');
          if (!/\btext\b/.test(clip) && !__drawsOutlineEl(el, cs)) return true;
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
        let scroll = scrollOf.get(win);
        if (!scroll) {
          scroll = { x: (win && win.scrollX) || 0, y: (win && win.scrollY) || 0 };
          scrollOf.set(win, scroll);
        }
        const sx = scroll.x;
        const sy = scroll.y;
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
        // A stroke or shadow draws the glyphs where the fill can't be seen.
        if (same && __drawsOutlineEl(el, __contrastComputedStyle(el))) same = false;
        // The resolved background skips layers it can't measure (a gradient,
        // an image), so text matching it is only invisible when nothing blocks.
        if (same) {
          try {
            const blocker = getComputabilityBlocker(el);
            if (blocker && blocker.ok === false) same = false;
          } catch {
            same = false;
          }
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
          // A drop-down select's shown option is drawn by the closed
          // control, in the select's colours and font, as are its other
          // options that have the select's colours: the select is measured.
          const owner = __closedSelectTextOwner(el) || el;
          if (isSameColorAsBackground(owner)) continue;

          eligibleTextCount++;

          const prev = elToCount.get(owner);
          if (prev === undefined) {
            elToCount.set(owner, 1);
            elements.push(owner);
          } else {
            elToCount.set(owner, prev + 1);
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

      // Text a ::before or ::after, or a list item's ::marker, generates
      // (#219): one record per pseudo-element, { el, pseudo, textCount },
      // kept apart from `elements`, whose text is the element's own. Read
      // only where there is a layout: jsdom computes no pseudo-element
      // styles, so there the text is left out, as placeholders are.
      // A ::before or ::after is looked for on the elements a style sheet
      // gives one (__beforeOrAfterHosts), a marker on list items (<li>).
      const generated = [];
      if (__hasLayout(d)) {
        const visitedHosts = new Map();
        for (const walkRoot of walkRoots) {
          let beforeOrAfter;
          try {
            beforeOrAfter = __beforeOrAfterHosts(dom.getRootNode(walkRoot));
          } catch {
            beforeOrAfter = '*';
          }
          const groups = [['li', ['::marker']]];
          if (beforeOrAfter) groups.unshift([beforeOrAfter, ['::before', '::after']]);
          for (const [selector, pseudos] of groups) {
            let hosts;
            try {
              hosts = Array.from(dom.querySelectorAll(walkRoot, selector));
              if (dom.nodeType(walkRoot) === 1 && dom.matches(walkRoot, selector))
                hosts.unshift(walkRoot);
            } catch {
              continue;
            }
            for (const el of hosts) {
              for (const pseudo of pseudos) {
                // Regions of the scan that overlap meet an element twice.
                if (!visitedHosts.has(pseudo)) visitedHosts.set(pseudo, new Set());
                if (visitedHosts.get(pseudo).has(el)) continue;
                visitedHosts.get(pseudo).add(el);
                if (!__generatedTextOf(el, pseudo)) continue;
                try {
                  if (helpers && typeof helpers.isExcluded === 'function' && helpers.isExcluded(el))
                    break;
                } catch {}
                if (!isVisibleEligible(el) || isInactive(el)) break;
                const m = measureGeneratedText(el, pseudo, bgResolveOpts);
                if (!m || m.same) continue;
                generated.push(Object.freeze({ el, pseudo, textCount: 1 }));
              }
            }
          }
        }
      }

      const out = Object.freeze({
        eligibleTextCount,
        visibilityMode,
        elements: Object.freeze(
          elements.map((el) => Object.freeze({ el, textCount: elToCount.get(el) || 0 }))
        ),
        generated: Object.freeze(generated)
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

  // A browser reports a computed font size in px. jsdom keeps it as written,
  // so a keyword or a calc() is read here: the keywords at a browser's sizes
  // for a 16px default, and calc() of lengths and numbers with + - * / and
  // parentheses. Anything else (larger, smaller, a length times a length)
  // reads as null.
  const FONT_SIZE_KEYWORDS = {
    'xx-small': 9,
    'x-small': 10,
    small: 13,
    medium: 16,
    large: 18,
    'x-large': 24,
    'xx-large': 32,
    'xxx-large': 48
  };
  function lengthPx(n, unit) {
    if (unit === 'px') return n;
    if (unit === 'pt') return n * (96 / 72);
    if (unit === 'rem' || unit === 'em') return n * 16;
    if (unit === '%') return (n / 100) * 16;
    return null;
  }
  // calc(): each value is { px } for a length or { n } for a number.
  function calcPx(text) {
    const tokens = [];
    for (let i = 0; i < text.length;) {
      const ch = text[i];
      if (ch === ' ' || ch === '\t' || ch === '\n') {
        i++;
      } else if ('+-*/()'.includes(ch)) {
        tokens.push(ch);
        i++;
      } else if ((ch >= '0' && ch <= '9') || ch === '.') {
        let j = i;
        while (j < text.length && ((text[j] >= '0' && text[j] <= '9') || text[j] === '.')) j++;
        let k = j;
        while (k < text.length && ((text[k] >= 'a' && text[k] <= 'z') || text[k] === '%')) k++;
        const n = Number(text.slice(i, j));
        const unit = text.slice(j, k);
        if (!Number.isFinite(n)) return null;
        if (unit) {
          const px = lengthPx(n, unit);
          if (px === null) return null;
          tokens.push({ px });
        } else tokens.push({ n });
        i = k;
      } else if (text.startsWith('calc', i)) {
        i += 4;
      } else return null;
    }
    let at = 0;
    const factor = () => {
      const t = tokens[at++];
      if (t === '(') {
        const v = sum();
        return tokens[at++] === ')' ? v : null;
      }
      if (t === '-') {
        const v = factor();
        return v && ('px' in v ? { px: -v.px } : { n: -v.n });
      }
      return t && typeof t === 'object' ? t : null;
    };
    const product = () => {
      let v = factor();
      while (v && (tokens[at] === '*' || tokens[at] === '/')) {
        const op = tokens[at++];
        const w = factor();
        if (!w) return null;
        if (op === '*') {
          if ('px' in v && 'px' in w) return null;
          v = 'px' in v ? { px: v.px * w.n } : 'px' in w ? { px: v.n * w.px } : { n: v.n * w.n };
        } else {
          if ('px' in w || w.n === 0) return null;
          v = 'px' in v ? { px: v.px / w.n } : { n: v.n / w.n };
        }
      }
      return v;
    };
    const sum = () => {
      let v = product();
      while (v && (tokens[at] === '+' || tokens[at] === '-')) {
        const op = tokens[at++];
        const w = product();
        if (!w || 'px' in v !== 'px' in w) return null;
        const sign = op === '+' ? 1 : -1;
        v = 'px' in v ? { px: v.px + sign * w.px } : { n: v.n + sign * w.n };
      }
      return v;
    };
    const v = sum();
    return v && at === tokens.length && 'px' in v && Number.isFinite(v.px) ? v.px : null;
  }

  function parsePx(value) {
    if (value == null) return null;

    if (typeof value === 'number' && Number.isFinite(value)) return value;

    const s = String(value).trim().toLowerCase();
    if (!s) return null;

    if (Object.prototype.hasOwnProperty.call(FONT_SIZE_KEYWORDS, s)) return FONT_SIZE_KEYWORDS[s];
    if (s.startsWith('calc(')) return calcPx(s);

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

  // How much larger than its computed font-size `el`'s text is drawn by the
  // page itself: an SVG text element by its viewBox and transforms (the
  // scale of its screen CTM, which includes any CSS zoom), any other element
  // by CSS zoom (currentCSSZoom, the product over its ancestors, not the
  // user's browser zoom). WCAG's large-scale size is the size as delivered,
  // so 12px text under zoom: 2 is 24px. 1 where neither applies or can be
  // read, such as in jsdom.
  function renderedTextScale(el) {
    try {
      if (dom.namespaceURI(el) === __SVG_NS) {
        if (typeof dom.get(el, 'getScreenCTM') !== 'function') return 1;
        const m = dom.getScreenCTM(el);
        const s = m ? Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) : NaN;
        return Number.isFinite(s) && s > 0 ? s : 1;
      }
      const z = Number(dom.get(el, 'currentCSSZoom'));
      return Number.isFinite(z) && z > 0 ? z : 1;
    } catch {
      return 1;
    }
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

  // Pages repeat a few computed colors thousands of times ("rgb(0, 0, 0)"),
  // so a color is looked up first as given, before its key is worked out.
  // The same string always gives the same key, so the result is the same.
  const __colorParseByInput = new Map();
  function parseCssColorToRgba(input) {
    if (typeof input === 'string' && __colorParseByInput.has(input)) {
      return __colorParseByInput.get(input);
    }
    const key = __normalizeCssColorCacheKey(input);
    let out;
    if (!key) out = null;
    else if (__colorParseCache.has(key)) out = __colorParseCache.get(key);
    else {
      out = __parseCssColorToRgbaUncached(key);
      __colorParseCache.set(key, out);
    }
    if (typeof input === 'string') __colorParseByInput.set(input, out);
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

  // Rounded to 12 decimals: past that, a ratio's digits depend on the order
  // the colours were composited in, which differs between jsdom and a
  // browser (1.0778038367054583 against 1.077803836705458), and one page
  // would report two numbers. The thresholds have two decimals, so no
  // outcome turns on a digit this far down.
  function contrastRatio(fgRgb, bgRgb) {
    const L1 = relativeLuminance(fgRgb);
    const L2 = relativeLuminance(bgRgb);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return Math.round(((lighter + 0.05) / (darker + 0.05)) * 1e12) / 1e12;
  }

  function truncateCssValue(v, maxLen) {
    const s = trim(v);
    const n = (Number(maxLen) | 0) > 10 ? Number(maxLen) | 0 : 80;
    if (s.length <= n) return s;
    return s.slice(0, n - 3) + '...';
  }

  // A comma-separated list's items, split on its own commas only: those
  // inside a function (a gradient's stops, a url()) belong to the item.
  function __splitTopLevel(value) {
    const s = String(value == null ? '' : value);
    const parts = [];
    let depth = 0;
    let quote = '';
    let start = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = '';
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ',' && depth === 0) {
        parts.push(s.slice(start, i).trim());
        start = i + 1;
      }
    }
    parts.push(s.slice(start).trim());
    return parts;
  }

  // Whether any background-image layer paints an image or a gradient. A
  // list of layers that are all `none` ("none, none", which a computed
  // style gives for an element with two background layers and no image)
  // paints nothing.
  function __hasImageLayer(value) {
    const s = value == null ? '' : String(value).trim().toLowerCase();
    if (!s || s === 'none') return false;
    if (s.indexOf(',') === -1) return true;
    return __splitTopLevel(s).some((layer) => !!layer && layer !== 'none');
  }
  function hasBackgroundImageOrGradient(style) {
    try {
      return __hasImageLayer(style && style.backgroundImage);
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

  // Whether a filter is drop-shadow() alone, once or more. It draws a
  // shadow of the element's content under that content, so it shows only
  // where the content is not opaque.
  function __isDropShadowOnly(filter) {
    const f = trim(filter);
    if (!/drop-shadow\(/i.test(f)) return false;
    return f.replace(/drop-shadow\((?:[^()]|\([^()]*\))*\)/gi, '').trim() === '';
  }

  // A filter that is only drop-shadow(), with no backdrop-filter: over
  // opaque content it changes nothing.
  function __hidesOwnShadow(cs) {
    const b = trim(cs && cs.backdropFilter);
    return (!b || b === 'none') && __isDropShadowOnly(cs && cs.filter);
  }

  // Whether a computed style's own background color is opaque.
  function __opaqueBgOf(cs) {
    const bg = parseCssColorToRgba(cs && cs.backgroundColor);
    return !!bg && clamp01(bg.a) >= 1;
  }

  // Whether all of textEl's line boxes lie where box paints its background:
  // inside its background-clip box and clear of its rounded corners. Text
  // that overflows the box sits over whatever a drop shadow draws there.
  function __textInOpaqueBox(textEl, box) {
    try {
      if (__scaledOrRotated(box)) return false;
      const rects = __ownTextRects(textEl);
      const r = dom.getBoundingClientRect(box);
      const cs = __contrastComputedStyle(box);
      if (!rects.length || !r || !cs) return false;
      const clips = __splitTopLevel(trim(cs.backgroundClip));
      const side = (prop) => {
        const v = parsePx(cs[prop]);
        return Number.isFinite(v) ? v : 0;
      };
      let [left, top, right, bottom] = [r.left, r.top, r.right, r.bottom];
      const inset = ([l, t, rt, b]) => {
        left += side(l);
        top += side(t);
        right -= side(rt);
        bottom -= side(b);
      };
      if (clips.some((c) => c === 'padding-box' || c === 'content-box'))
        inset(['borderLeftWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth']);
      if (clips.some((c) => c === 'content-box'))
        inset(['paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom']);
      if (clips.some((c) => c === 'text')) return false;
      let radius = 0;
      for (const k of [
        'borderTopLeftRadius',
        'borderTopRightRadius',
        'borderBottomLeftRadius',
        'borderBottomRightRadius'
      ]) {
        const toks = __splitTopLevelSpace(cs[k] || '0px');
        for (const t of toks) {
          const v = /^[\d.]+px$/.test(t) ? Number.parseFloat(t) : t === '0' ? 0 : NaN;
          if (!Number.isFinite(v)) return false;
          radius = Math.max(radius, v);
        }
      }
      const inCorner = (t) =>
        radius > 0 &&
        (t.left < left + radius || t.right > right - radius) &&
        (t.top < top + radius || t.bottom > bottom - radius);
      return rects.every(
        (t) =>
          t.left >= left - 0.5 &&
          t.right <= right + 0.5 &&
          t.top >= top - 0.5 &&
          t.bottom <= bottom + 0.5 &&
          !inCorner(t)
      );
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

  // -------- Background layers: solid colors, and layers that paint nothing --------
  //
  // A background-image layer is no image to ask about when it is a gradient
  // whose every stop is one color (a solid color drawn as a gradient), or
  // when it paints nothing under the text: `none`, a layer sized to nothing,
  // or one 2px thick or less along an axis it doesn't repeat on, which is an
  // underline (the DSFR draws its link underlines so). A solid layer
  // covering the element's whole background is painted over its background
  // color; one sized or placed to cover part of it counts where it meets the
  // text's line boxes: not at all when it is clear of them, as a color when
  // it covers all of them, and as paint covering part of the text otherwise.

  // Splits on whitespace outside parentheses: "calc(100% - 1px) 2px".
  function __splitTopLevelSpace(value) {
    const s = String(value == null ? '' : value).trim();
    const out = [];
    let depth = 0;
    let cur = '';
    for (const ch of s) {
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && /\s/.test(ch)) {
        if (cur) out.push(cur);
        cur = '';
      } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  }

  // A gradient token that is no color: an angle, length or percentage, a
  // direction, shape, size or position keyword, or an interpolation space.
  const __gradientWordRe =
    /^(?:to|at|from|in|left|right|top|bottom|center|circle|ellipse|closest-side|closest-corner|farthest-side|farthest-corner|srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|lab|oklab|xyz|xyz-d50|xyz-d65|hsl|hwb|lch|oklch|shorter|longer|increasing|decreasing|hue)$/i;
  const __gradientNonColor = (tok) =>
    __gradientWordRe.test(tok) ||
    /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:%|[a-z]+)?$/i.test(tok) ||
    /^(?:calc|min|max|clamp)\(/i.test(tok);

  // The one color all of a gradient's stops have, or null. `currentColor`
  // is the element's color. A token that is neither a color it reads nor a
  // known non-color word may be a stop of another color, so it gives null.
  function __solidGradientColor(layer, currentColor) {
    const m = /^(?:repeating-)?(?:linear|radial|conic)-gradient\(([\s\S]*)\)$/i.exec(layer);
    if (!m) return null;
    let color = null;
    for (const arg of __splitTopLevel(m[1])) {
      let found = null;
      for (const tok of __splitTopLevelSpace(arg)) {
        const c = /^currentcolor$/i.test(tok) ? currentColor : parseCssColorToRgba(tok);
        if (!c) {
          if (!__gradientNonColor(tok)) return null;
          continue;
        }
        if (found) return null;
        found = c;
      }
      if (!found) continue;
      if (!color) color = found;
      else if (
        found.r !== color.r ||
        found.g !== color.g ||
        found.b !== color.b ||
        found.a !== color.a
      )
        return null;
    }
    return color;
  }

  // Each background-image layer of el, topmost first, as { kind, color,
  // full, size, pos, rep, origin }: kind 'none' (paints nothing), 'thin'
  // (an underline), 'solid' (one color, `full` when it covers the whole
  // background) or 'image'. null when el has no image layer.
  const __bgLayerKindsCache = new WeakMap();
  function __bgLayerKinds(el, cs) {
    if (el && __bgLayerKindsCache.has(el)) return __bgLayerKindsCache.get(el);
    let out = null;
    try {
      const raw = trim(cs.backgroundImage);
      if (__hasImageLayer(raw)) {
        const list = (v, dflt) => {
          const parts = __splitTopLevel(trim(v)).filter(Boolean);
          return parts.length ? parts : [dflt];
        };
        const images = __splitTopLevel(raw);
        const sizes = list(cs.backgroundSize, 'auto');
        const positions = list(cs.backgroundPosition, '0% 0%');
        const repeats = list(cs.backgroundRepeat, 'repeat');
        const clips = list(cs.backgroundClip, 'border-box');
        const origins = list(cs.backgroundOrigin, 'padding-box');
        const blends = list(cs.backgroundBlendMode, 'normal');
        const attachments = list(cs.backgroundAttachment, 'scroll');
        const blended = blends.some((b) => b !== 'normal');
        // A browser gives each longhand one value per layer. Lists that
        // don't match the layers (jsdom keeps only the first of several
        // sizes) can't say which value is whose.
        const matched =
          images.length === 1 ||
          [sizes, positions, repeats].every((l) => l.length === images.length);
        const currentColor = parseCssColorToRgba(cs.color);
        const px = (t) =>
          /^-?[\d.]+px$/.test(t) ? Number.parseFloat(t) : /^0%?$/.test(t) ? 0 : NaN;
        const whole = (t) => t === 'auto' || t === '100%' || t === 'cover' || t === 'contain';
        out = images.map((image, i) => {
          const layer = image.trim();
          if (!layer || layer.toLowerCase() === 'none') return { kind: 'none' };
          if (!matched) return { kind: 'image' };
          const sizeToks = __splitTopLevelSpace(sizes[i % sizes.length]);
          const size = [
            sizeToks[0] || 'auto',
            sizeToks[1] || (/^(cover|contain)$/.test(sizeToks[0]) ? sizeToks[0] : 'auto')
          ];
          const posToks = __splitTopLevelSpace(positions[i % positions.length]);
          const pos = [posToks[0] || '0%', posToks[1] || '50%'];
          const repToks = __splitTopLevelSpace(repeats[i % repeats.length]);
          const rep =
            repToks.length > 1
              ? repToks
              : repToks[0] === 'repeat-x'
                ? ['repeat', 'no-repeat']
                : repToks[0] === 'repeat-y'
                  ? ['no-repeat', 'repeat']
                  : [repToks[0] || 'repeat', repToks[0] || 'repeat'];
          const origin = origins[i % origins.length];
          const attachment = attachments[i % attachments.length];
          if (clips[i % clips.length] === 'text') return { kind: 'image' };
          const w = px(size[0]);
          const h = px(size[1]);
          if (w === 0 || h === 0) return { kind: 'none' };
          const color = blended ? null : __solidGradientColor(layer, currentColor);
          if (color && color.a === 0) return { kind: 'none' };
          if ((h <= 2 && rep[1] === 'no-repeat') || (w <= 2 && rep[0] === 'no-repeat'))
            return { kind: 'thin', color };
          if (!color) return { kind: 'image' };
          const tiles = (axis) => rep[axis] === 'repeat' || rep[axis] === 'round';
          // A fixed layer is placed against the viewport, so only one that
          // tiles both ways is known to cover the element.
          if (attachment === 'fixed')
            return tiles(0) && tiles(1) ? { kind: 'solid', color, full: true } : { kind: 'image' };
          const covers = (axis) =>
            tiles(axis) || (whole(size[axis]) && (/%$/.test(pos[axis]) || px(pos[axis]) === 0));
          // `space` spreads whole tiles across the area with gaps between,
          // so a tile smaller than the area leaves stripes it can't place.
          if (rep.some((r, axis) => r === 'space' && !whole(size[axis]))) return { kind: 'image' };
          return {
            kind: 'solid',
            color,
            full: covers(0) && covers(1),
            size,
            pos,
            rep,
            origin,
            attachment
          };
        });
        // One or two thin layers draw an underline; more can stripe over
        // the whole text.
        if (out.filter((k) => k.kind === 'thin').length > 2)
          out = out.map((k) => (k.kind === 'thin' ? { kind: 'image' } : k));
      }
    } catch {
      out = [{ kind: 'image' }];
    }
    if (el) __bgLayerKindsCache.set(el, out);
    return out;
  }

  // Whether any of a computed style's background-image layers draws
  // something: not `none`, sized to nothing or wholly transparent.
  function paintsBackgroundLayer(cs) {
    const kinds = __bgLayerKinds(null, cs);
    return !!kinds && kinds.some((k) => k.kind !== 'none');
  }

  // Each background-image layer of a computed style, as __bgLayerKinds gives them.
  function backgroundLayerKinds(cs) {
    return __bgLayerKinds(null, cs);
  }

  // Whether el's background images paint anything that can lie under text.
  function __bgImagePaints(el, cs) {
    if (!__hasBackgroundImageOrGradientEl(el, cs)) return false;
    const kinds = __bgLayerKinds(el, cs);
    return !!kinds && kinds.some((k) => k.kind === 'solid' || k.kind === 'image');
  }

  // Whether el or an ancestor scales, rotates, skews or zooms, so that its
  // client rects are no longer its CSS pixel sizes. A translation is not.
  const __scaledCache = new WeakMap();
  function __scaledOrRotated(el) {
    if (__scaledCache.has(el)) return __scaledCache.get(el);
    let out = false;
    let guard = 0;
    for (let cur = el; cur && guard++ < 200; cur = composedParent(cur)) {
      if (dom.nodeType(cur) !== 1) continue;
      const cs = __contrastComputedStyle(cur);
      if (!cs) continue;
      const t = trim(cs.transform);
      const set = (v) => !!trim(v) && trim(v) !== 'none';
      const zoom = trim(cs.zoom);
      if (
        (t && t !== 'none' && !/^matrix\(\s*1,\s*0,\s*0,\s*1,[^,]+,[^,]+\)$/.test(t)) ||
        set(cs.scale) ||
        set(cs.rotate) ||
        (zoom && zoom !== '1' && zoom !== 'normal')
      ) {
        out = true;
        break;
      }
    }
    __scaledCache.set(el, out);
    return out;
  }

  // Where a solid layer of el's background that covers part of it lies
  // against textEl's line boxes: 'none', 'all', or null when it meets part
  // of them or that can't be worked out (no layout, an inline box, a size or
  // position it can't resolve, a scaled or rotated box, a layer that scrolls
  // with a scroll container's content).
  function __layerCoverOfText(el, cs, k, textEl) {
    if (String(cs.display || '') === 'inline') return null;
    if (__scaledOrRotated(el)) return null;
    const scrolls = (v) => !!v && v !== 'visible' && v !== 'clip';
    if (k.attachment === 'local' && (scrolls(cs.overflowX) || scrolls(cs.overflowY))) return null;
    const rects = __ownTextRects(textEl);
    if (!rects.length) return null;
    let box;
    try {
      box = dom.getBoundingClientRect(el);
    } catch {
      return null;
    }
    if (!box || !(box.width > 0) || !(box.height > 0)) return null;
    const side = (prop) => {
      const v = parsePx(cs[prop]);
      return Number.isFinite(v) ? v : 0;
    };
    let left = box.left;
    let top = box.top;
    let right = box.right;
    let bottom = box.bottom;
    if (k.origin !== 'border-box') {
      left += side('borderLeftWidth');
      top += side('borderTopWidth');
      right -= side('borderRightWidth');
      bottom -= side('borderBottomWidth');
    }
    if (k.origin === 'content-box') {
      left += side('paddingLeft');
      top += side('paddingTop');
      right -= side('paddingRight');
      bottom -= side('paddingBottom');
    }
    // A length, a percentage of `of`, or calc() of one percentage and one
    // length, as the browser gives it.
    const resolve = (t, of) => {
      if (/^-?[\d.]+px$/.test(t)) return Number.parseFloat(t);
      if (/^-?[\d.]+%$/.test(t)) return (Number.parseFloat(t) / 100) * of;
      const c = /^calc\((-?[\d.]+)%\s*([+-])\s*([\d.]+)px\)$/.exec(t);
      if (c) return (Number(c[1]) / 100) * of + (c[2] === '-' ? -1 : 1) * Number(c[3]);
      return Number.NaN;
    };
    const span = (axis, from, to) => {
      const area = to - from;
      if (k.rep[axis] === 'repeat' || k.rep[axis] === 'round') return [from, to];
      const sz = /^(auto|cover|contain)$/.test(k.size[axis]) ? area : resolve(k.size[axis], area);
      // A percentage of the position is of the room the layer leaves.
      const at = resolve(k.pos[axis], area - sz);
      return [from + at, from + at + sz];
    };
    const [x0, x1] = span(0, left, right);
    const [y0, y1] = span(1, top, bottom);
    if (![x0, x1, y0, y1].every(Number.isFinite)) return null;
    const meets = (r) =>
      Math.min(r.right, x1) - Math.max(r.left, x0) > 0.5 &&
      Math.min(r.bottom, y1) - Math.max(r.top, y0) > 0.5;
    const within = (r) =>
      r.left >= x0 - 0.5 && r.right <= x1 + 0.5 && r.top >= y0 - 0.5 && r.bottom <= y1 + 0.5;
    if (!rects.some(meets)) return 'none';
    if (rects.every(within)) return 'all';
    return null;
  }

  // The solid colors el's background images paint under textEl's text,
  // topmost first, as { colors }, or { blocked: true } when a layer paints
  // an image, a gradient, or a color under part of it. null when el has no
  // image layer.
  function __bgLayersUnder(el, cs, textEl) {
    const kinds = __bgLayerKinds(el, cs);
    if (!kinds) return null;
    const colors = [];
    for (const k of kinds) {
      if (k.kind === 'none' || k.kind === 'thin') continue;
      if (k.kind === 'image') return { blocked: true };
      const cover = k.full ? 'all' : __layerCoverOfText(el, cs, k, textEl);
      if (cover === 'none') continue;
      if (cover !== 'all') return { blocked: true };
      colors.push(k.color);
      // What lies under an opaque layer is hidden by it.
      if (k.color.a >= 1) break;
    }
    return { colors };
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

  // Whether a visible -webkit-text-stroke or text-shadow draws el's glyphs.
  // Text whose fill is transparent, or the colour of its background, is not
  // drawn by its fill, but an outline or a shadow still draws it: outlined
  // headings are a common design, and WCAG's techniques count an outline or
  // halo in a text's contrast (G18, G145). Such text is not skipped as
  // invisible; it reaches the TEXT_STROKE / TEXT_SHADOW review instead.
  function __drawsOutlineEl(el, cs) {
    try {
      if (!cs) return false;
      const width = Number.parseFloat(
        String((cs.getPropertyValue && cs.getPropertyValue('-webkit-text-stroke-width')) || '')
      );
      const strokeColor = String(
        (cs.getPropertyValue && cs.getPropertyValue('-webkit-text-stroke-color')) || ''
      ).trim();
      const stroke = strokeColor ? parseCssColorToRgba(strokeColor) : null;
      if (width > 0 && !(stroke && stroke.a === 0)) return true;
      const shadow = __textShadowInfoEl(el, cs);
      if (!shadow.has) return false;
      // A shadow drawn only in transparent colours draws nothing.
      const colors =
        String(shadow.value).match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|transparent/gi) || [];
      return !(
        colors.length &&
        colors.every((c) => {
          const rgba = parseCssColorToRgba(c);
          return !!rgba && rgba.a === 0;
        })
      );
    } catch {
      return false;
    }
  }

  // The colours el's glyphs are drawn in by a visible -webkit-text-stroke
  // and text-shadow, for text whose fill draws nothing: { colors, complete }.
  // complete is false when a colour can't be read, so a caller never
  // concludes from part of what is drawn. Each colour keeps its own alpha.
  function getOutlineColors(el) {
    const out = { colors: [], complete: true };
    try {
      if (!el || dom.nodeType(el) !== 1) return { colors: [], complete: false };
      const cs = __contrastComputedStyle(el);
      if (!cs) return { colors: [], complete: false };
      const width = Number.parseFloat(
        String((cs.getPropertyValue && cs.getPropertyValue('-webkit-text-stroke-width')) || '')
      );
      if (width > 0) {
        const raw = String(
          (cs.getPropertyValue && cs.getPropertyValue('-webkit-text-stroke-color')) || ''
        ).trim();
        const stroke = raw ? parseCssColorToRgba(raw) : null;
        if (!stroke) out.complete = false;
        else if (stroke.a > 0) out.colors.push(stroke);
      }
      const shadow = __textShadowInfoEl(el, cs);
      if (shadow.has) {
        // One shadow per comma outside parentheses, each with one colour.
        const parts = [];
        let depth = 0;
        let start = 0;
        const v = String(shadow.value);
        for (let i = 0; i < v.length; i++) {
          if (v[i] === '(') depth++;
          else if (v[i] === ')') depth--;
          else if (v[i] === ',' && depth === 0) {
            parts.push(v.slice(start, i));
            start = i + 1;
          }
        }
        parts.push(v.slice(start));
        for (const part of parts) {
          const m = part.match(/(?:rgba?|hsla?)\([^)]*\)|#[0-9a-f]{3,8}\b|\btransparent\b/i);
          const rgba = m ? parseCssColorToRgba(m[0]) : null;
          if (!rgba) out.complete = false;
          else if (rgba.a > 0) out.colors.push(rgba);
        }
      }
    } catch {
      return { colors: [], complete: false };
    }
    return out;
  }

  // Text whose fill draws nothing, drawn only by a stroke or a shadow,
  // measured by the best of the colours it is drawn in against a flat
  // background: { ratio, drawn, background, isLargeText, drawnBy, bg }, or
  // null when the fill is seen, the background isn't one opaque colour, or
  // a colour can't be read. Below the ratio, no reading of the text meets
  // it (ACT: "If all background pixels have a low contrast with all
  // foreground pixels, the success criterion is guaranteed to not be
  // satisfied"); above it, how legible the outline is takes a person.
  function measureOutlineOnlyText(el, bgOpts) {
    try {
      const cs = __contrastComputedStyle(el);
      if (!cs || !__drawsOutlineEl(el, cs)) return null;
      const bg = computeEffectiveBackground(el, bgOpts || {});
      if (!bg || bg.ok === false || !bg.rgba || bg.alpha !== 1) return null;
      const fg = computeEffectiveForeground(el);
      if (!fg || !fg.rgba) return null;
      const fillUnseen =
        fg.rgba.a === 0 ||
        fg.alpha === 0 ||
        (fg.alpha === 1 &&
          fg.rgba.r === bg.rgba.r &&
          fg.rgba.g === bg.rgba.g &&
          fg.rgba.b === bg.rgba.b);
      if (!fillUnseen) return null;
      const outline = getOutlineColors(el);
      if (!outline.complete || !outline.colors.length) return null;
      const background = { r: bg.rgba.r, g: bg.rgba.g, b: bg.rgba.b, a: 1 };
      const fade = Number.isFinite(fg.opacityProduct) ? fg.opacityProduct : 1;
      let best = null;
      for (const c of outline.colors) {
        const drawn = compositeRgba({ r: c.r, g: c.g, b: c.b, a: c.a * fade }, background);
        const ratio = contrastRatio(drawn, background);
        if (!best || ratio > best.ratio) best = { ratio, drawn };
      }
      const style = textStyleOf(el);
      const sizePx = style ? parsePx(style.fontSize) : NaN;
      const weight = style ? normalizeFontWeight(style.fontWeight) : 400;
      const scale = renderedTextScale(el);
      const width = Number.parseFloat(
        String((cs.getPropertyValue && cs.getPropertyValue('-webkit-text-stroke-width')) || '')
      );
      return {
        ratio: best.ratio,
        drawn: best.drawn,
        background,
        isLargeText: isLargeText(Number.isFinite(sizePx) ? sizePx * scale : NaN, weight),
        drawnBy: width > 0 ? 'textStroke' : 'textShadow',
        bg
      };
    } catch {
      return null;
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

  // The canvas the browser paints behind the root: the Canvas system colour
  // of the root's color scheme, white unless the page asks for dark, where
  // Chromium paints #121212. Read once per run, from an element the engine
  // adds and removes at once, which is how the Canvas system colour
  // resolves for the page. Null where nothing resolves it (jsdom).
  let __canvas;
  function __pageCanvasColor() {
    if (__canvas !== undefined) return __canvas;
    __canvas = null;
    try {
      const doc = window && window.document;
      const root = doc && dom.documentElement(doc);
      if (!root || typeof window.getComputedStyle !== 'function') return null;
      // Under forced colors the canvas is the forced palette's, and the
      // browser resolves Canvas, and the page's color scheme, to it: a page
      // that asks for dark reads white. The page's own canvas can't be read
      // then, so it is unknown, as in an emulator.
      if (
        typeof window.matchMedia === 'function' &&
        dom.get(window.matchMedia('(forced-colors: active)'), 'matches')
      ) {
        return null;
      }
      const probe = dom.call(doc, 'createElement', 'div');
      probe.style.cssText =
        'position:absolute;left:0;top:0;width:1px;height:1px;overflow:hidden;visibility:hidden;background-color:Canvas';
      dom.call(root, 'appendChild', probe);
      let bg = '';
      let laidOut = false;
      try {
        // Only a page with a layout paints a canvas: an emulator (jsdom)
        // resolves system colours to fixed values and measures every box at
        // zero, so it has none to read.
        laidOut = dom.getBoundingClientRect(probe).width === 1;
        bg = String(window.getComputedStyle(probe).backgroundColor || '');
      } finally {
        dom.removeChild(root, probe);
      }
      const rgba = parseCssColorToRgba(bg);
      if (laidOut && rgba && rgba.a === 1) __canvas = bg;
    } catch {
      __canvas = null;
    }
    return __canvas;
  }

  // The canvas a page that asks for a dark color scheme is drawn on: the
  // root's color-scheme or a <meta name="color-scheme"> naming dark makes
  // the browser paint its dark Canvas behind a page with no background of
  // its own, where the root canvas fallback assumes white. Null for a page
  // that doesn't ask for dark, or where nothing resolves it (jsdom), so the
  // fallback applies as before.
  function __pageDarkCanvasColor() {
    try {
      const doc = window && window.document;
      const root = doc && dom.documentElement(doc);
      if (!root || typeof window.getComputedStyle !== 'function') return null;
      const rootScheme = String(window.getComputedStyle(root).colorScheme || '');
      const meta = dom.call(doc, 'querySelector', 'meta[name="color-scheme" i]');
      const metaScheme = meta ? String(dom.getAttribute(meta, 'content') || '') : '';
      if (!/\bdark\b/i.test(rootScheme) && !/\bdark\b/i.test(metaScheme)) return null;
    } catch {
      return null;
    }
    return __pageCanvasColor();
  }

  // Whether the colors the rules read are forced: the page is shown in
  // forced colors (engine.environment.forcedColors) and its root element is
  // not kept out of them. The browser then forces color and
  // background-color in the computed style but not the text fill color, so
  // what the rules measure is neither the page's colors, which WCAG judges,
  // nor the ones on screen. A scan holds the page in its own colors
  // (holdPageColors, src/core/dom-runner.js), so this is false unless that
  // could not be done. Read once per run; false where nothing answers the
  // media query (jsdom).
  let __colorsForced;
  function colorsForced() {
    if (__colorsForced !== undefined) return __colorsForced;
    __colorsForced = false;
    try {
      if (
        window &&
        typeof window.matchMedia === 'function' &&
        dom.get(window.matchMedia('(forced-colors: active)'), 'matches')
      ) {
        const root = dom.documentElement(window.document);
        const adjust = root
          ? String(window.getComputedStyle(root).getPropertyValue('forced-color-adjust')).trim()
          : '';
        __colorsForced = adjust !== 'none';
      }
    } catch {
      __colorsForced = false;
    }
    return __colorsForced;
  }

  // Marks a contrast rule's occurrences when the colors measured were
  // forced (colorsForced): `details.forcedColors: true`, and a hint saying
  // to check again with forced colors off, in place of one that would have
  // the colors changed or measured by hand on screen. The outcomes stay as
  // measured.
  function noteForcedColors(occurrences) {
    if (!Array.isArray(occurrences) || !colorsForced()) return occurrences;
    for (const occ of occurrences) {
      if (!occ || typeof occ !== 'object') continue;
      if (!occ.data || typeof occ.data !== 'object') occ.data = {};
      if (!occ.data.details || typeof occ.data.details !== 'object') occ.data.details = {};
      occ.data.details.forcedColors = true;
      occ.hint =
        'Forced colors were on when this page was checked, so the colors measured may be neither the page’s own nor the ones on screen. Check the page again with forced colors off: WCAG judges contrast in the page’s own colors.';
      if (occ.i18n && typeof occ.i18n === 'object') occ.i18n.hintKey = 'contrast_hint_forcedColors';
    }
    return occurrences;
  }

  // The canvas under el's text where it is measured rather than assumed: in
  // a browser, for an element of the page the engine runs in, when that
  // page isn't in a frame. A frame's canvas is transparent where the frame
  // shares its parent's color scheme, and what shows through then is the
  // parent page, which the frame can't see. Null otherwise, which leaves it
  // to the contrast mode (computeEffectiveBackground).
  function __measuredCanvasUnder(el) {
    try {
      if (!window || !el || dom.ownerDocument(el) !== window.document) return null;
      if (window.self !== window.top) return null;
      const rgba = parseCssColorToRgba(__pageCanvasColor());
      return rgba ? { r: rgba.r, g: rgba.g, b: rgba.b, a: 1 } : null;
    } catch {
      return null;
    }
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

      // Solid colors its background images paint, over its background color.
      const images = __hasBackgroundImageOrGradientEl(cur, cs)
        ? __bgLayersUnder(cur, cs, el)
        : null;
      if (images && images.colors) {
        for (const c of images.colors) {
          if (collectStack) {
            stack.push({
              selector: __getSimpleSelectorCached(
                cur,
                (dom.tagName(cur) || '').toLowerCase() || 'html'
              ),
              bg: { r: c.r, g: c.g, b: c.b, a: clamp01(c.a) },
              opacity: op
            });
          }
          acc = compositeRgba(acc, { r: c.r, g: c.g, b: c.b, a: clamp01(c.a) });
        }
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
    } else if (acc.a < 1 && __measuredCanvasUnder(el)) {
      // Nothing behind the text up to the root is opaque, but the browser
      // paints its canvas under the root and that colour was read, so the
      // text is measured on it in either mode, as it is drawn.
      acc = compositeRgba(acc, __measuredCanvasUnder(el));
      out = {
        ok: true,
        rgba: { r: acc.r, g: acc.g, b: acc.b, a: 1 },
        alpha: 1,
        stack: stack || [],
        reasonCode: null
      };
    } else if (acc.a < 1) {
      if (allowAssumptions) {
        // If the root is not opaque, apply the canvas: the browser's dark one
        // when the page asks for a dark color scheme, else the fallback.
        const canvasColor = __pageDarkCanvasColor() || rootCanvasFallback;
        const fb = parseCssColorToRgba(canvasColor) || { r: 255, g: 255, b: 255, a: 1 };
        const fbOpaque = { r: fb.r, g: fb.g, b: fb.b, a: 1 };

        // The canvas is under the page: what the page paints is drawn over it.
        acc = compositeRgba(acc, fbOpaque);

        out = {
          ok: true,
          rgba: { r: acc.r, g: acc.g, b: acc.b, a: 1 },
          alpha: 1,
          stack: stack || [],
          reasonCode: null,
          assumptionsApplied: ['ROOT_CANVAS_FALLBACK'],
          assumedRootCanvasColor: canvasColor
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

      // The browser's canvas, where it was read, lies under the root and
      // outside every group, so both colours are composited onto it.
      const canvas = bgAcc.a < 1 || fgAcc.a < 1 ? __measuredCanvasUnder(el) : null;
      if (canvas) {
        bgAcc = compositeRgba(bgAcc, canvas);
        fgAcc = compositeRgba(fgAcc, canvas);
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

  // Whether a style sheet of the document or shadow root `root` has a
  // selector matching `re`, rules inside @media and nested rules included.
  // A sheet whose rules can't be read (another origin's) may, so it counts
  // as one that does. Only selectors are read: a pseudo-element is named
  // nowhere else, and writing out every declaration of a large sheet as text
  // cost more than the rest of the contrast rules on some pages. Answered
  // once per root, in `byRoot`.
  function __rulesHaveSelector(rules, re) {
    const stack = [rules];
    while (stack.length) {
      const list = stack.pop();
      const n = (list && list.length) || 0;
      for (let i = 0; i < n; i++) {
        const rule = list[i];
        if (!rule) continue;
        const selector = rule.selectorText;
        if (typeof selector === 'string' && re.test(selector)) return true;
        if (rule.cssRules && rule.cssRules.length) stack.push(rule.cssRules);
      }
    }
    return false;
  }
  function __rootStylesSelector(root, re, byRoot) {
    if (!root) return false;
    try {
      if (byRoot.has(root)) return byRoot.get(root);
    } catch {}
    let found = false;
    try {
      const sheets = Array.from(dom.get(root, 'styleSheets') || []).concat(
        Array.from(dom.get(root, 'adoptedStyleSheets') || [])
      );
      for (const sheet of sheets) {
        let rules;
        try {
          rules = sheet.cssRules || [];
        } catch {
          found = true;
          break;
        }
        if (__rulesHaveSelector(rules, re)) {
          found = true;
          break;
        }
      }
    } catch {
      found = false;
    }
    try {
      byRoot.set(root, found);
    } catch {}
    return found;
  }

  // ::first-line or ::first-letter: only where a sheet names one is a
  // pseudo-element's own style read, so other pages pay nothing for it.
  const __firstLineOrLetterRe = /first-(line|letter)/i;
  const __firstLineOrLetterByRoot = new WeakMap();
  function __rootStylesFirstLineOrLetter(root) {
    return __rootStylesSelector(root, __firstLineOrLetterRe, __firstLineOrLetterByRoot);
  }

  // -------- Generated text: ::before, ::after and ::marker (#219) --------
  //
  // Text that `content` writes into a ::before or ::after, and a list
  // item's marker, is drawn, but no text node holds it, so the text walk
  // never meets it. It is read from the pseudo-element's computed style,
  // which only a browser gives (jsdom computes none), and measured in the
  // pseudo-element's colour and font, against its element's background and
  // its own if it has one.

  // ::before and ::after: their styles are read only for the elements a
  // style sheet gives content, so other elements, and other pages, pay
  // nothing for it. A pseudo-element draws text only where a rule sets its
  // `content` (the browser's own sheet adds quotation marks, which are not
  // text), so rules that only style one, such as the common
  // `*, ::before, ::after { box-sizing: border-box }`, are left out: counted,
  // they made every element a host. The selector the document or shadow root
  // `root`'s sheets give for those elements: each selector naming one in a
  // rule that sets `content`, with the pseudo-element cut off
  // (".card .tag::before" gives ".card .tag"), '*' where that can't be
  // worked out (a sheet that can't be read, a nested rule, :host), or ''
  // where no sheet names one. Answered once per root.
  const __beforeOrAfterRe = /::?(before|after)\b/i;
  // Whether a style rule sets `content` to something that can draw: not
  // left unset, and not `none` or `normal`, which draw nothing on ::before
  // and ::after. A rule whose declarations can't be read counts.
  function __setsContent(rule) {
    try {
      const style = rule.style;
      if (!style || typeof style.getPropertyValue !== 'function') return true;
      const value = String(style.getPropertyValue('content') || '')
        .trim()
        .toLowerCase();
      return value !== '' && value !== 'none' && value !== 'normal';
    } catch {
      return true;
    }
  }
  const __beforeOrAfterHostsByRoot = new WeakMap();
  function __beforeOrAfterHosts(root) {
    if (!root) return '*';
    try {
      if (__beforeOrAfterHostsByRoot.has(root)) return __beforeOrAfterHostsByRoot.get(root);
    } catch {}
    const bases = new Set();
    let all = false;
    try {
      const sheets = Array.from(dom.get(root, 'styleSheets') || []).concat(
        Array.from(dom.get(root, 'adoptedStyleSheets') || [])
      );
      const stack = [];
      for (const sheet of sheets) {
        try {
          stack.push(sheet.cssRules || []);
        } catch {
          all = true;
        }
      }
      while (!all && stack.length) {
        const list = stack.pop();
        const n = (list && list.length) || 0;
        for (let i = 0; i < n && !all; i++) {
          const rule = list[i];
          if (!rule) continue;
          const text = rule.selectorText;
          if (typeof text === 'string' && __beforeOrAfterRe.test(text) && __setsContent(rule)) {
            // The selector list's own commas, not those inside :is() and
            // the like.
            let depth = 0;
            let start = 0;
            const parts = [];
            for (let j = 0; j < text.length; j++) {
              const c = text[j];
              if (c === '(') depth++;
              else if (c === ')') depth--;
              else if (c === ',' && depth === 0) {
                parts.push(text.slice(start, j));
                start = j + 1;
              }
            }
            parts.push(text.slice(start));
            for (const part of parts) {
              if (!__beforeOrAfterRe.test(part)) continue;
              if (/[&]|:host|::(part|slotted)\b/i.test(part)) {
                all = true;
                break;
              }
              let base = part.replace(/::?(before|after)\b[\s\S]*$/i, '').trim();
              if (!base || /[>+~]$/.test(base)) base += '*';
              bases.add(base);
            }
          }
          if (rule.cssRules && rule.cssRules.length) stack.push(rule.cssRules);
        }
      }
    } catch {
      all = true;
    }
    let out = all ? '*' : Array.from(bases).join(', ');
    if (out && out !== '*') {
      try {
        dom.querySelectorAll(root, out);
      } catch {
        out = '*';
      }
    }
    try {
      __beforeOrAfterHostsByRoot.set(root, out);
    } catch {}
    return out;
  }

  // List styles whose markers are letters or digits, text as the text walk
  // counts it (ACT afw4f7: a letter or a digit), and those that draw a
  // symbol, which isn't. Any other style, a page's own @counter-style among
  // them, can't be read from its name.
  const __ALPHANUMERIC_LIST_STYLES = new Set([
    'decimal',
    'decimal-leading-zero',
    'lower-roman',
    'upper-roman',
    'lower-alpha',
    'upper-alpha',
    'lower-latin',
    'upper-latin',
    'lower-greek',
    'lower-armenian',
    'upper-armenian',
    'armenian',
    'georgian',
    'hebrew',
    'arabic-indic',
    'persian',
    'devanagari',
    'bengali',
    'thai',
    'cjk-decimal',
    'cjk-earthly-branch',
    'cjk-heavenly-stem',
    'cjk-ideographic',
    'hiragana',
    'katakana',
    'hiragana-iroha',
    'katakana-iroha',
    'japanese-informal',
    'japanese-formal',
    'korean-hangul-formal',
    'simp-chinese-informal',
    'simp-chinese-formal',
    'trad-chinese-informal',
    'trad-chinese-formal',
    'ethiopic-numeric'
  ]);
  const __SYMBOL_LIST_STYLES = new Set([
    'none',
    'disc',
    'circle',
    'square',
    'disclosure-open',
    'disclosure-closed'
  ]);

  // A counter drawn in list style `style`: '0' for letters or digits, ''
  // for a symbol, null for a style that can't be read.
  function __counterText(style) {
    const s = String(style || 'decimal')
      .trim()
      .toLowerCase();
    if (__ALPHANUMERIC_LIST_STYLES.has(s)) return '0';
    if (__SYMBOL_LIST_STYLES.has(s)) return '';
    return null;
  }

  // A CSS string's text, its escapes (\201C, \") resolved.
  function __cssUnescape(s) {
    return String(s).replace(/\\([0-9a-f]{1,6})\s?|\\([\s\S])/gi, (m, hex, ch) => {
      if (!hex) return ch === '\n' ? '' : ch;
      const code = parseInt(hex, 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '�';
    });
  }

  // The text a computed `content` value writes: { text, readable }. Strings
  // are read as written, attr() as the browser resolves it to a string, a
  // counter as letters or digits in its list style, and quotation marks and
  // images (url(), gradients) as no text; the alternative text after a "/"
  // isn't drawn. readable is false for anything else, which can't be read.
  function __contentText(value) {
    const v = String(value || '').trim();
    let text = '';
    let readable = true;
    if (!v || v === 'none' || v === 'normal') return { text, readable };
    const re =
      /"((?:[^"\\]|\\[\s\S])*)"|'((?:[^'\\]|\\[\s\S])*)'|([a-z-]+)\(((?:[^()"']|"(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*')*)\)|(\/)|([a-z-]+)|(\S)/gi;
    let m;
    while ((m = re.exec(v))) {
      if (m[1] != null || m[2] != null) {
        text += __cssUnescape(m[1] != null ? m[1] : m[2]);
      } else if (m[3]) {
        const fn = m[3].toLowerCase();
        if (fn === 'counter' || fn === 'counters') {
          // counter(name, style), counters(name, "separator", style)
          const args = m[4]
            .replace(/"(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'/g, (s) => {
              text += __cssUnescape(s.slice(1, -1));
              return '""';
            })
            .split(',');
          const counter = __counterText(args[fn === 'counter' ? 1 : 2]);
          if (counter === null) readable = false;
          else text += counter;
        } else if (!/^(url|image|image-set|-webkit-image-set|cross-fade|element)$/.test(fn)) {
          if (!/gradient$/.test(fn)) readable = false;
        }
      } else if (m[5]) {
        break;
      } else if (m[6]) {
        if (!/^(no-)?(open|close)-quote$/i.test(m[6])) readable = false;
      } else {
        readable = false;
      }
    }
    return { text, readable };
  }

  // Elements a ::before or ::after isn't drawn for: replaced and void
  // elements, and the parts of a <select>.
  const __NO_GENERATED_CONTENT = new Set([
    'img',
    'input',
    'textarea',
    'select',
    'option',
    'optgroup',
    'video',
    'audio',
    'iframe',
    'canvas',
    'object',
    'embed',
    'br',
    'wbr',
    'hr',
    'meter',
    'progress',
    'area'
  ]);

  const __generatedTextCache = new WeakMap();
  // Whether a document has a layout (__hasLayout), asked once per run.
  const __layoutByDoc = new WeakMap();

  // The text el's `pseudo` (::before, ::after or ::marker) draws, where it
  // has a letter or a digit or can't be read: { style, readable, value,
  // outside }, with the pseudo-element's computed style. Null where it
  // draws no such text (no content, only images, quotation marks or a
  // bullet), where it isn't drawn, and without a layout.
  function __generatedTextOf(el, pseudo) {
    if (!el || dom.nodeType(el) !== 1) return null;
    let byPseudo = __generatedTextCache.get(el);
    if (!byPseudo) {
      byPseudo = new Map();
      __generatedTextCache.set(el, byPseudo);
    }
    if (byPseudo.has(pseudo)) return byPseudo.get(pseudo);
    let out = null;
    try {
      const doc = dom.ownerDocument(el);
      const view = doc && dom.defaultView(doc);
      const html = !dom.namespaceURI(el) || dom.namespaceURI(el) === 'http://www.w3.org/1999/xhtml';
      const cs = __contrastComputedStyle(el);
      let ps = null;
      let value = '';
      let outside = false;
      if (!__layoutByDoc.has(doc)) __layoutByDoc.set(doc, __hasLayout(doc));
      if (
        html &&
        cs &&
        view &&
        typeof view.getComputedStyle === 'function' &&
        __layoutByDoc.get(doc)
      ) {
        if (pseudo === '::marker') {
          // A list item's marker: its ::marker content, or else its
          // list-style-type, unless an image takes its place.
          if (/\blist-item\b/.test(String(cs.display || ''))) {
            outside = String(cs.listStylePosition || '').trim() !== 'inside';
            // An outside marker is drawn outside the item's box, and an
            // item that clips its overflow hides it.
            const clips = String(cs.overflowX || cs.overflow || 'visible') !== 'visible';
            if (!(outside && clips)) {
              ps = view.getComputedStyle(el, '::marker');
              const content = String((ps && ps.content) || '').trim();
              if (content && content !== 'normal') value = content;
              else if (String(cs.listStyleImage || 'none').trim() === 'none') {
                const type = String(cs.listStyleType || '').trim();
                value = /^["']/.test(type)
                  ? type
                  : __counterText(type) === null
                    ? `counter(list-item, ${type})`
                    : __counterText(type)
                      ? '"0"'
                      : '';
              }
            }
          }
        } else if (!__NO_GENERATED_CONTENT.has(String(dom.localName(el) || '').toLowerCase())) {
          ps = view.getComputedStyle(el, pseudo);
          value = String((ps && ps.content) || '').trim();
          if (ps && String(ps.display || '') === 'none') value = '';
        }
      }
      const read = value ? __contentText(value) : { text: '', readable: true };
      const fill = ps ? parseCssColorToRgba(__textFillOf(ps)) : null;
      const drawn =
        !!ps &&
        Number.parseFloat(ps.fontSize) !== 0 &&
        !/^(hidden|collapse)$/.test(String(ps.visibility || '')) &&
        !(fill && fill.a === 0);
      if (drawn && (!read.readable || __hasLetterOrDigit(read.text))) {
        out = { style: ps, readable: read.readable, value, outside };
      }
    } catch {
      out = null;
    }
    byPseudo.set(pseudo, out);
    return out;
  }

  // What a computed `content` value gives an accessible name: the
  // alternative text after "/" where there is one, else its strings (attr()
  // computes to one). Images, counters and quotation marks give none.
  // Icon-font glyphs (private-use characters) are dropped: no one can read them.
  function __contentNameText(value) {
    const v = String(value || '').trim();
    if (!v || v === 'none' || v === 'normal') return { text: '', glyphs: false };
    const re =
      /"((?:[^"\\]|\\[\s\S])*)"|'((?:[^'\\]|\\[\s\S])*)'|([a-z-]+)\(((?:[^()"']|"(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*')*)\)|(\/)|([a-z-]+)|(\S)/gi;
    let drawn = '';
    let alt = null;
    let m;
    while ((m = re.exec(v))) {
      if (m[5]) alt = '';
      else if (m[1] != null || m[2] != null) {
        const s = __cssUnescape(m[1] != null ? m[1] : m[2]);
        if (alt === null) drawn += s;
        else alt += s;
      }
    }
    const raw = alt === null ? drawn : alt;
    const text = raw.replace(/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/gu, '');
    return { text, glyphs: text !== raw };
  }

  const __generatedNameCache = new WeakMap();
  // The text el's ::before or ::after adds to a name from content (accname
  // 2F.ii): { text, block, glyphs }, block when the pseudo-element is not
  // inline, glyphs when icon-font characters were dropped. Null where none
  // is generated, and without a layout (jsdom computes no pseudo styles).
  function getGeneratedNameText(el, pseudo) {
    if (!el || dom.nodeType(el) !== 1) return null;
    let byPseudo = __generatedNameCache.get(el);
    if (!byPseudo) {
      byPseudo = new Map();
      __generatedNameCache.set(el, byPseudo);
    }
    if (byPseudo.has(pseudo)) return byPseudo.get(pseudo);
    let out = null;
    try {
      const doc = dom.ownerDocument(el);
      const view = doc && dom.defaultView(doc);
      const html = !dom.namespaceURI(el) || dom.namespaceURI(el) === 'http://www.w3.org/1999/xhtml';
      if (!__layoutByDoc.has(doc)) __layoutByDoc.set(doc, __hasLayout(doc));
      const hosts =
        html &&
        view &&
        typeof view.getComputedStyle === 'function' &&
        __layoutByDoc.get(doc) &&
        !__NO_GENERATED_CONTENT.has(String(dom.localName(el) || '').toLowerCase())
          ? __beforeOrAfterHosts(dom.getRootNode(el))
          : '';
      if (hosts && (hosts === '*' || dom.matches(el, hosts))) {
        const ps = view.getComputedStyle(el, pseudo);
        const display = String((ps && ps.display) || '');
        if (ps && display !== 'none' && !/^(hidden|collapse)$/.test(String(ps.visibility || ''))) {
          const read = __contentNameText(ps.content);
          if (read.text || read.glyphs) {
            out = {
              text: read.text,
              block: display !== 'inline' && display.indexOf('ruby') !== 0,
              glyphs: read.glyphs
            };
          }
        }
      }
    } catch {
      out = null;
    }
    byPseudo.set(pseudo, out);
    return out;
  }

  // Measures the text el's `pseudo` generates (__generatedTextOf): null
  // where it draws none; { ok: false, reasonCode, blocker... } where its
  // contrast can't be worked out; otherwise { ok: true, fg, bg, ratio,
  // fontSizePx, fontWeightNum, same }, the colours opaque, the font size as
  // drawn (CSS zoom included), and same when the text is the colour of its
  // background. bgOpts as computeEffectiveBackground's.
  function measureGeneratedText(el, pseudo, bgOpts) {
    try {
      const gen = __generatedTextOf(el, pseudo);
      if (!gen) return null;
      const ps = gen.style;
      const selector =
        __getSimpleSelectorCached(el, (dom.tagName(el) || '').toLowerCase() || 'element') + pseudo;
      const blocked = (reasonCode, property, value, extra) => ({
        ok: false,
        reasonCode,
        blockerSelector: selector,
        blockerProperty: property,
        blockerValue: truncateCssValue(String(value == null ? '' : value), 80),
        ...(extra || {})
      });
      if (!gen.readable) return blocked('GENERATED_TEXT_UNREADABLE', 'content', gen.value);

      // Effects on the generated text itself, which draw something other
      // than its declared colours.
      if (hasBlendMode(ps)) return blocked('MIX_BLEND_MODE', 'mix-blend-mode', ps.mixBlendMode);
      if (hasFilter(ps)) {
        const filter = trim(ps.filter);
        return filter && filter.toLowerCase() !== 'none'
          ? blocked('BACKGROUND_FILTER_OR_BACKDROP_FILTER', 'filter', filter)
          : blocked('BACKGROUND_FILTER_OR_BACKDROP_FILTER', 'backdrop-filter', ps.backdropFilter);
      }
      if (hasBackgroundImageOrGradient(ps)) {
        return blocked('BACKGROUND_IMAGE_OR_GRADIENT', 'background-image', ps.backgroundImage, {
          backgroundFillType: classifyBackgroundImageValue(ps.backgroundImage)
        });
      }
      const shadow = String(ps.textShadow || '');
      if (hasTextShadow(shadow)) return blocked('TEXT_SHADOW', 'text-shadow', shadow);
      const strokeWidth = Number.parseFloat(
        String((ps.getPropertyValue && ps.getPropertyValue('-webkit-text-stroke-width')) || '')
      );
      if (strokeWidth > 0) {
        return blocked(
          'TEXT_STROKE',
          '-webkit-text-stroke',
          `${strokeWidth}px ${trim(ps.getPropertyValue('-webkit-text-stroke-color'))}`
        );
      }

      // What lies behind it: the element's background, or, for a marker
      // outside an item that paints a background of its own, the item's
      // parent's, since the marker is drawn outside the item's box. What
      // stops that being worked out stops it here too.
      const elCs = __contrastComputedStyle(el);
      const elBg = parseCssColorToRgba(elCs && elCs.backgroundColor);
      const behind =
        gen.outside &&
        ((elBg && elBg.a > 0) || __hasBackgroundImageOrGradientEl(el, elCs)) &&
        composedParent(el)
          ? composedParent(el)
          : el;
      const blocker = getComputabilityBlocker(behind);
      if (blocker && blocker.ok === false) return { ...blocker };
      const fade = computeOpacityProduct(el);
      // An opacity resolved as a group (resolveGroupOpacityColors) fades
      // the background with the element's own text, not with this one.
      if (__groupOpacityOverrideCache.get(behind)) {
        return blocked('ANCESTOR_OPACITY', 'opacity', String(Math.round(fade * 100) / 100));
      }
      const bg = computeEffectiveBackground(behind, bgOpts || {});
      if (!bg || bg.ok === false || !bg.rgba) {
        return {
          ok: false,
          reasonCode: (bg && bg.reasonCode) || 'BACKGROUND_NOT_COMPUTABLE',
          blockerSelector: (bg && bg.blockerSelector) || '',
          blockerProperty: (bg && bg.blockerProperty) || '',
          blockerValue: (bg && bg.blockerValue) || '',
          background: bg && bg.rgba ? rgbaToString(bg.rgba) : '',
          backgroundAlpha: bg && typeof bg.alpha === 'number' ? round2(bg.alpha) : ''
        };
      }
      let back = { r: bg.rgba.r, g: bg.rgba.g, b: bg.rgba.b, a: 1 };

      // Its own background, over the element's, and its own opacity.
      let ownOpacity = 1;
      if (pseudo !== '::marker') {
        const ownValue = trim(ps.backgroundColor);
        const own = ownValue ? parseCssColorToRgba(ownValue) : { r: 0, g: 0, b: 0, a: 0 };
        if (!own) return blocked('BACKGROUND_UNPARSABLE', 'background-color', ownValue);
        const opacity = Number.parseFloat(ps.opacity);
        ownOpacity = Number.isFinite(opacity) ? clamp01(opacity) : 1;
        if (own.a > 0 && (ownOpacity < 1 || fade < 1)) {
          return blocked('ELEMENT_OPACITY', 'opacity', ownOpacity < 1 ? ps.opacity : fade);
        }
        // Taken out of the flow, it can sit anywhere: over its element's
        // background only as far as is known, unless it paints its own.
        const position = String(ps.position || '');
        if (own.a < 1 && (position === 'absolute' || position === 'fixed')) {
          return blocked('GENERATED_TEXT_POSITIONED', 'position', position);
        }
        if (own.a > 0) back = { ...compositeRgba(own, back), a: 1 };
      }

      const fillValue = __textFillOf(ps);
      const fill = parseCssColorToRgba(fillValue);
      if (!fill) {
        return blocked('FOREGROUND_UNPARSABLE', 'color', fillValue, {
          background: rgbaToString(back),
          backgroundAlpha: round2(1)
        });
      }
      const alpha = clamp01(fill.a * fade * ownOpacity);
      const fg = { ...compositeRgba({ r: fill.r, g: fill.g, b: fill.b, a: alpha }, back), a: 1 };
      const sizePx = parsePx(ps.fontSize);
      return {
        ok: true,
        fg,
        bg: back,
        ratio: contrastRatio(fg, back),
        fontSizePx: Number.isFinite(sizePx) ? sizePx * renderedTextScale(el) : 0,
        fontWeightNum: normalizeFontWeight(ps.fontWeight),
        same: alpha === 1 && fg.r === back.r && fg.g === back.g && fg.b === back.b,
        assumptionsApplied:
          Array.isArray(bg.assumptionsApplied) && bg.assumptionsApplied.length
            ? bg.assumptionsApplied.slice(0)
            : null,
        assumedRootCanvasColor:
          typeof bg.assumedRootCanvasColor === 'string' ? bg.assumedRootCanvasColor : null
      };
    } catch {
      return null;
    }
  }

  // Whether the text el shows is its placeholder: the contrast rules ask
  // about such text below its ratio rather than failing it, for now
  // (docs/LIMITATIONS.md).
  function isPlaceholderText(el) {
    const field = __fieldText(el);
    return !!(field && field.placeholder);
  }

  // -------- Computability blocker (memoized per element, per run) --------

  const __localComputabilityBlockerCache = new WeakMap();
  const __computabilityBlockerCache =
    __getSharedWeakMapCache('__computabilityBlockerCache') || __localComputabilityBlockerCache;

  function getComputabilityBlocker(el) {
    try {
      if (el && __computabilityBlockerCache.has(el)) return __computabilityBlockerCache.get(el);
    } catch {}

    // An option of a drop-down select, other than the shown one, with
    // colours that aren't the select's: it is shown only in the list the
    // select opens, which the platform draws in those colours or in its
    // own, so there is no one way it is drawn to measure.
    const dropDown = __dropDownOption(el);
    if (dropDown && !dropDown.shown && dropDown.differs) {
      const out = {
        ok: false,
        reasonCode: 'SELECT_OPTION_COLOR',
        blockerSelector: __getSimpleSelectorCached(
          dropDown.differs.el,
          (dom.tagName(dropDown.differs.el) || '').toLowerCase() || 'option'
        ),
        blockerProperty: dropDown.differs.property,
        blockerValue: truncateCssValue(dropDown.differs.value, 80)
      };
      try {
        __computabilityBlockerCache.set(el, out);
      } catch {}
      return out;
    }

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
    // The element whose opaque paint set paintOccluded.
    let occluder = null;
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
        // A filter that is only drop-shadow() draws a shadow of cur's
        // content under that content: where the content is opaque behind
        // the text (cur's own background, or a closer one), it is hidden.
        const backdropOn = !!trim(cs && cs.backdropFilter) && trim(cs.backdropFilter) !== 'none';
        const filterBlocks =
          isFilter &&
          !(
            __isDropShadowOnly(cs.filter) &&
            ((paintOccluded && __textInOpaqueBox(el, occluder)) ||
              (__opaqueBgOf(cs) && __textInOpaqueBox(el, cur)))
          );
        if (filterBlocks || (backdropOn && !paintOccluded)) {
          const out = {
            ok: false,
            reasonCode: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
            blockerSelector: __getSimpleSelectorCached(
              cur,
              (dom.tagName(cur) || '').toLowerCase() || 'html'
            ),
            blockerProperty: filterBlocks ? 'filter' : 'backdrop-filter',
            blockerValue: truncateCssValue((filterBlocks ? cs.filter : cs.backdropFilter) || '', 80)
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

      // ::first-line and ::first-letter paint part of the text in a colour
      // of their own (a first line in black over #bbb text, a drop cap).
      // Which text is on the first line takes layout to know, so a
      // pseudo-element whose colour or background differs from the
      // element's defers to manual review rather than measuring the wrong
      // colour.
      if (cur === el && !placeholder && window && typeof window.getComputedStyle === 'function') {
        let root;
        try {
          root = dom.getRootNode(el);
        } catch {
          root = null;
        }
        if (__rootStylesFirstLineOrLetter(root)) {
          for (const pseudo of ['::first-line', '::first-letter']) {
            let ps;
            try {
              ps = window.getComputedStyle(el, pseudo);
            } catch {
              ps = null;
            }
            if (!ps) continue;
            const color = String(ps.color || '');
            const bg = String(ps.backgroundColor || '');
            const bgRgba = bg ? parseCssColorToRgba(bg) : null;
            const colorDiffers = color && color !== String((cs && cs.color) || '');
            const bgDiffers =
              bgRgba && bgRgba.a > 0 && bg !== String((cs && cs.backgroundColor) || '');
            if (!colorDiffers && !bgDiffers) continue;
            const out = {
              ok: false,
              reasonCode: 'PSEUDO_ELEMENT_COLOR',
              blockerSelector:
                __getSimpleSelectorCached(cur, (dom.tagName(cur) || '').toLowerCase() || 'html') +
                pseudo,
              blockerProperty: colorDiffers ? 'color' : 'background-color',
              blockerValue: truncateCssValue(colorDiffers ? color : bg, 80)
            };
            try {
              if (el) __computabilityBlockerCache.set(el, out);
            } catch {}
            return out;
          }
        }
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

      // Layers that paint nothing under the text (an underline) or one
      // solid color don't stop the measurement (see __bgLayerKinds).
      const layersUnder =
        !paintOccluded && __hasBackgroundImageOrGradientEl(cur, cs)
          ? __bgLayersUnder(cur, cs, el)
          : null;
      if (layersUnder && layersUnder.blocked) {
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
        if (
          (ownBg && clamp01(ownBg.a) >= 1) ||
          (layersUnder && layersUnder.colors.some((c) => c.a >= 1))
        ) {
          paintOccluded = true;
          occluder = cur;
        }
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
    if (img && img !== 'none' && __bgImagePaints(node, cs)) {
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

  // The boxes that clip what a box inside `a` paints, from `a` up: the same
  // walk as __paintedPart's, kept per ancestor and per whether the box is
  // absolutely positioned, since the painters inside one ancestor share it.
  // `steps` counts the ancestors walked, so a chain longer than
  // __paintedPart's guard is left to it.
  function __clipAbove(a, abs, clipRects, memo) {
    const path = [];
    let base = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity, steps: 0 };
    for (let guard = 0; ; guard++) {
      // Too deep to tell where the walk would end: nothing is kept.
      if (guard >= 1000) return { steps: Infinity };
      if (!a || dom.nodeType(a) !== 1) break;
      const key = abs ? 'abs' : 'flow';
      const known = memo.get(a);
      if (known && known[key]) {
        base = known[key];
        break;
      }
      const name = __lname(a);
      if (name === 'html' || name === 'body') break;
      const cs = __contrastComputedStyle(a);
      const positioned = !!cs && !!cs.position && cs.position !== 'static';
      // Not this box's containing block: it isn't clipped by a.
      const skip = !cs || (abs && !positioned);
      let clip = null;
      if (!skip) {
        const cx = !!cs.overflowX && cs.overflowX !== 'visible';
        const cy = !!cs.overflowY && cs.overflowY !== 'visible';
        if (cx || cy) {
          let ar = clipRects.get(a);
          if (ar === undefined) {
            try {
              ar = dom.getBoundingClientRect(a);
            } catch {
              ar = null;
            }
            clipRects.set(a, ar);
          }
          if (ar) clip = { cx, cy, ar };
        }
      }
      path.push({ a, key, clip });
      if (!skip) {
        if (cs.position === 'fixed') break;
        abs = cs.position === 'absolute';
      }
      a = composedParent(a);
    }
    for (let i = path.length - 1; i >= 0; i--) {
      const { a, key, clip } = path[i];
      const next = {
        left: base.left,
        top: base.top,
        right: base.right,
        bottom: base.bottom,
        steps: base.steps + 1
      };
      if (clip) {
        if (clip.cx) {
          next.left = Math.max(next.left, clip.ar.left);
          next.right = Math.min(next.right, clip.ar.right);
        }
        if (clip.cy) {
          next.top = Math.max(next.top, clip.ar.top);
          next.bottom = Math.min(next.bottom, clip.ar.bottom);
        }
      }
      const known = memo.get(a) || {};
      known[key] = next;
      memo.set(a, known);
      base = next;
    }
    return base;
  }

  // The part of a painter's box its ancestors don't clip away: what it
  // paints. Boxes a list scrolls out of view, or a track keeps off screen,
  // paint nothing outside it. Clipping follows the containing block chain
  // (an absolutely positioned box escapes the boxes between it and its
  // positioned ancestor, a fixed one all of them); the root's and the
  // body's overflow belong to the viewport. null when nothing is left.
  function __paintedPart(node, r, clipRects, memo) {
    const own = __contrastComputedStyle(node);
    const ownPos = own ? own.position : 'static';
    if (ownPos === 'fixed') return r;
    if (memo) {
      const c = __clipAbove(composedParent(node), ownPos === 'absolute', clipRects, memo);
      if (c.steps < 1000) {
        const left = Math.max(r.left, c.left);
        const top = Math.max(r.top, c.top);
        const right = Math.min(r.right, c.right);
        const bottom = Math.min(r.bottom, c.bottom);
        if (right - left < 1 || bottom - top < 1) return null;
        if (left === r.left && top === r.top && right === r.right && bottom === r.bottom) return r;
        return { left, top, right, bottom, width: right - left, height: bottom - top };
      }
    }
    let left = r.left;
    let top = r.top;
    let right = r.right;
    let bottom = r.bottom;
    let pos = ownPos;
    for (
      let a = composedParent(node), guard = 0;
      a && dom.nodeType(a) === 1 && guard < 1000;
      a = composedParent(a), guard++
    ) {
      const name = __lname(a);
      if (name === 'html' || name === 'body') break;
      const cs = __contrastComputedStyle(a);
      if (!cs) continue;
      const positioned = !!cs.position && cs.position !== 'static';
      // Not this box's containing block: it isn't clipped by a.
      if (pos === 'absolute' && !positioned) continue;
      const cx = !!cs.overflowX && cs.overflowX !== 'visible';
      const cy = !!cs.overflowY && cs.overflowY !== 'visible';
      if (cx || cy) {
        let ar = clipRects.get(a);
        if (ar === undefined) {
          try {
            ar = dom.getBoundingClientRect(a);
          } catch {
            ar = null;
          }
          clipRects.set(a, ar);
        }
        if (ar) {
          if (cx) {
            left = Math.max(left, ar.left);
            right = Math.min(right, ar.right);
          }
          if (cy) {
            top = Math.max(top, ar.top);
            bottom = Math.min(bottom, ar.bottom);
          }
          if (right - left < 1 || bottom - top < 1) return null;
        }
      }
      pos = cs.position;
      if (pos === 'fixed') break;
    }
    if (left === r.left && top === r.top && right === r.right && bottom === r.bottom) return r;
    return { left, top, right, bottom, width: right - left, height: bottom - top };
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
    const clipRects = new Map();
    const clipMemo = new Map();
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
          // rect: what it paints, or null when clipped away; raw: its box,
          // where it would be shown scrolled into view (__paintBackdropOf).
          painters.push({
            el: node,
            rect: __paintedPart(node, r, clipRects, clipMemo),
            raw: r,
            paint,
            hollow: paint.property === 'stroke' ? __strokeHollow(node, cs, r) : null
          });
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
  // Whether painter p, where it lies (`at`), paints on a line of text: it
  // covers it, and for a shape drawn with a stroke alone, the line isn't in
  // the hollow the stroke goes round.
  const __paintsOnLine = (p, at, line) =>
    __coversLine(at, line) &&
    !(
      p.hollow &&
      line.left >= p.hollow.left - 0.5 &&
      line.right <= p.hollow.right + 0.5 &&
      line.top >= p.hollow.top - 0.5 &&
      line.bottom <= p.hollow.bottom + 0.5
    );

  // Inside an SVG <rect> drawn with a stroke and no fill, the part clear of
  // the stroke and of its rounded corners, on screen, given its box `r`
  // (which a browser gives without the stroke): a chart's frame, whose
  // labels sit inside it, not on it. null for other shapes, or a rect
  // rotated or skewed.
  function __strokeHollow(node, cs, r) {
    try {
      if (String(dom.localName(node) || '').toLowerCase() !== 'rect') return null;
      const ctm = dom.getScreenCTM(node);
      if (!ctm || Math.abs(ctm.b) > 1e-6 || Math.abs(ctm.c) > 1e-6) return null;
      if (!(ctm.a > 0) || !(ctm.d > 0)) return null;
      // A percentage radius is of the nearest viewport, in its user units:
      // its viewBox, or else its own box.
      let viewport;
      const viewportSize = () => {
        if (viewport !== undefined) return viewport;
        viewport = null;
        let svg = composedParent(node);
        for (let g = 0; svg && __lname(svg) !== 'svg' && g < 1000; g++) svg = composedParent(svg);
        if (!svg) return viewport;
        const vb = String(dom.getAttribute(svg, 'viewBox') || '')
          .trim()
          .split(/[\s,]+/)
          .map(Number);
        if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) viewport = { w: vb[2], h: vb[3] };
        else {
          const sr = dom.getBoundingClientRect(svg);
          const sm = dom.getScreenCTM(svg);
          if (sr && sm && sm.a > 0 && sm.d > 0)
            viewport = { w: sr.width / sm.a, h: sr.height / sm.d };
        }
        return viewport;
      };
      // A length in user units; undefined for auto, NaN when it can't be read.
      const len = (v, axis) => {
        const s = trim(v);
        if (s === 'auto') return undefined;
        const pct = /^(-?[\d.]+)%$/.exec(s);
        if (pct) {
          const vp = viewportSize();
          return vp ? (Number.parseFloat(pct[1]) / 100) * vp[axis] : Number.NaN;
        }
        const n = /^-?[\d.]+px$/.test(s) ? Number.parseFloat(s) : Number.NaN;
        return Number.isFinite(n) ? Math.max(0, n) : Number.NaN;
      };
      // A non-scaling stroke keeps its width on screen.
      const fixed = trim(cs.vectorEffect) === 'non-scaling-stroke';
      const sw = /^[\d.]+px$/.test(trim(cs.strokeWidth)) ? Number.parseFloat(cs.strokeWidth) : NaN;
      if (!Number.isFinite(sw)) return null;
      const half = sw / 2;
      let rx = len(cs.rx, 'w');
      let ry = len(cs.ry, 'h');
      if (Number.isNaN(rx) || Number.isNaN(ry)) return null;
      // auto or 0 takes the other's value: the larger corner is the safe guess.
      if (!rx) rx = ry || 0;
      if (!ry) ry = rx || 0;
      rx = Math.min(rx, r.width / ctm.a / 2);
      ry = Math.min(ry, r.height / ctm.d / 2);
      const dx = Math.max(fixed ? half / ctm.a : half, rx) * ctm.a;
      const dy = Math.max(fixed ? half / ctm.d : half, ry) * ctm.d;
      const hollow = {
        left: r.left + dx,
        top: r.top + dy,
        right: r.right - dx,
        bottom: r.bottom - dy
      };
      return hollow.right > hollow.left && hollow.bottom > hollow.top ? hollow : null;
    } catch {
      return null;
    }
  }

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

  // Whether node and its ancestors are at most translated: a scale, a
  // rotation or a zoom moves a pseudo-element away from the pixel offsets
  // the browser reports for it.
  const __translatedOnlyCache = new WeakMap();
  function __translatedOnly(node) {
    const walked = [];
    let ok = true;
    for (
      let cur = node, guard = 0;
      cur && dom.nodeType(cur) === 1 && guard < 1000;
      cur = composedParent(cur), guard++
    ) {
      if (__translatedOnlyCache.has(cur)) {
        ok = __translatedOnlyCache.get(cur);
        break;
      }
      walked.push(cur);
    }
    for (let i = walked.length - 1; i >= 0; i--) {
      const cs = ok ? __contrastComputedStyle(walked[i]) : null;
      if (ok && cs) {
        const set = (k) => !!trim(cs[k]) && trim(cs[k]) !== 'none';
        const t = trim(cs.transform);
        const mm = /^matrix\(([^)]*)\)$/.exec(t);
        const lin = mm ? mm[1].split(',').map((v) => Number.parseFloat(v)) : null;
        const translates =
          !t ||
          t === 'none' ||
          (!!lin && lin[0] === 1 && lin[1] === 0 && lin[2] === 0 && lin[3] === 1);
        const zoom = trim(cs.zoom);
        ok =
          translates &&
          !set('scale') &&
          !set('rotate') &&
          !set('offsetPath') &&
          (!zoom || zoom === '1' || zoom === 'normal');
      }
      __translatedOnlyCache.set(walked[i], ok);
    }
    return ok;
  }

  // Where an absolutely positioned pseudo-element of a positioned host sits,
  // from its resolved offsets and size, which a browser reports in pixels
  // for an element positioned out of flow. Its containing block is the
  // host's padding box; the box is its border box. A scale or translation
  // is applied about the transform origin; a pseudo-element scaled to
  // nothing paints nothing (an underline waiting for hover), so it is
  // `false`. null when the browser does not give pixels, or a transform on
  // it or above it rotates, skews or scales the host, and then the host's
  // box stands in.
  function __pseudoBox(host, hostCs, pcs) {
    try {
      if (pcs.position !== 'absolute') return null;
      if (!__translatedOnly(host)) return null;
      const px = (v) => (/^-?[\d.]+px$/.test(String(v || '')) ? Number.parseFloat(v) : NaN);
      const sides = (f) => ['Top', 'Right', 'Bottom', 'Left'].map((s) => px(pcs[f(s)]));
      const left = px(pcs.left);
      const top = px(pcs.top);
      let width = px(pcs.width);
      let height = px(pcs.height);
      const margin = sides((s) => 'margin' + s);
      const pad = sides((s) => 'padding' + s);
      const border = sides((s) => 'border' + s + 'Width');
      if (![left, top, width, height, ...margin, ...pad, ...border].every(Number.isFinite))
        return null;
      // Width and height are the content box's unless box-sizing says otherwise.
      if (trim(pcs.boxSizing) !== 'border-box') {
        width += pad[1] + pad[3] + border[1] + border[3];
        height += pad[0] + pad[2] + border[0] + border[2];
      }
      for (const k of ['scale', 'rotate', 'offsetPath']) {
        const v = trim(pcs[k]);
        if (v && v !== 'none') return null;
      }
      let m = [1, 0, 0, 1, 0, 0];
      const t = trim(pcs.transform);
      if (t && t !== 'none') {
        const mm = /^matrix\(([^)]*)\)$/.exec(t);
        if (!mm) return null;
        m = mm[1].split(',').map((v) => Number.parseFloat(v));
        if (m.length !== 6 || !m.every(Number.isFinite) || m[1] !== 0 || m[2] !== 0) return null;
        if (m[0] === 0 || m[3] === 0) return false;
      }
      const tr = trim(pcs.translate);
      if (tr && tr !== 'none') {
        const v = tr.split(/\s+/).map(px);
        if (v.length > 2 || !v.every(Number.isFinite)) return null;
        m[4] += v[0];
        m[5] += v[1] || 0;
      }
      const origin = String(pcs.transformOrigin || '').split(/\s+/);
      const ox = Number.isFinite(px(origin[0])) ? px(origin[0]) : width / 2;
      const oy = Number.isFinite(px(origin[1])) ? px(origin[1]) : height / 2;
      const r = dom.getBoundingClientRect(host);
      // Positioned in a host that scrolls, it moves with the host's content.
      const scrolled = (k) => {
        const v = Number(dom.get(host, k));
        return Number.isFinite(v) ? v : 0;
      };
      const baseX =
        r.left + (px(hostCs.borderLeftWidth) || 0) + left + margin[3] - scrolled('scrollLeft');
      const baseY =
        r.top + (px(hostCs.borderTopWidth) || 0) + top + margin[0] - scrolled('scrollTop');
      const place = (x0, y0, x1, y1) => {
        const xs = [x0, x1].map((u) => baseX + ox + m[0] * (u - ox) + m[4]);
        const ys = [y0, y1].map((v) => baseY + oy + m[3] * (v - oy) + m[5]);
        const out = {
          left: Math.min(xs[0], xs[1]),
          right: Math.max(xs[0], xs[1]),
          top: Math.min(ys[0], ys[1]),
          bottom: Math.max(ys[0], ys[1])
        };
        out.width = out.right - out.left;
        out.height = out.bottom - out.top;
        return out;
      };
      const box = place(0, 0, width, height);
      // `fill`: where its background color alone paints, inside a visible
      // border and within its background-clip; null when that isn't known.
      const clip = trim(
        String(pcs.backgroundClip || 'border-box')
          .split(',')
          .pop()
      );
      const visible = (s, i) => {
        const c = parseCssColorToRgba(pcs['border' + s + 'Color']);
        return border[i] > 0 && !(c && c.a === 0);
      };
      const inset = ['Top', 'Right', 'Bottom', 'Left'].map((s, i) => {
        if (clip === 'border-box') return visible(s, i) ? border[i] : 0;
        if (clip === 'padding-box') return border[i];
        if (clip === 'content-box') return border[i] + pad[i];
        return Number.NaN;
      });
      box.fill =
        inset.every(Number.isFinite) &&
        width - inset[1] - inset[3] >= 1 &&
        height - inset[0] - inset[2] >= 1
          ? place(inset[3], inset[0], width - inset[1], height - inset[2])
          : null;
      return box;
    } catch {
      return null;
    }
  }

  // A positioned element's ::before and ::after when they are positioned out
  // of flow and paint a background (a color, a gradient or an image), each
  // as { el: host, pseudo, ref, z, paint, box, color, radius, ordered }:
  // `z` its z-index (null for auto), `box` where it sits (null when that
  // can't be worked out), `color` the solid color it paints when that is
  // all it paints, and `ordered` whether the paint order below places it
  // (__computePaintBackdrop) rather than the older overlap search.
  const __positionedPseudosCache = new WeakMap();
  function __positionedPseudos(host) {
    if (__positionedPseudosCache.has(host)) return __positionedPseudosCache.get(host);
    const out = [];
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
        if (pcs.visibility === 'hidden' || pcs.visibility === 'collapse') continue;
        const opacity = clamp01(Number.parseFloat(pcs.opacity != null ? pcs.opacity : '1'));
        if (opacity === 0) continue;
        const bg = parseCssColorToRgba(pcs.backgroundColor);
        const image = hasBackgroundImageOrGradient(pcs);
        if (!(bg && bg.a > 0) && !image) continue;
        const box = __pseudoBox(host, hostCs, pcs);
        if (box === false) continue;
        const zRaw = trim(pcs.zIndex);
        const z = /^[+-]?\d+$/.test(zRaw) ? Number.parseInt(zRaw, 10) : null;
        // A clip-path, clip or mask leaves what it paints unknown.
        const shaped =
          (!!trim(pcs.clipPath) && trim(pcs.clipPath) !== 'none') ||
          (!!trim(pcs.clip) && trim(pcs.clip) !== 'auto') ||
          (!!trim(pcs.maskImage) && trim(pcs.maskImage) !== 'none') ||
          (!!trim(pcs.webkitMaskImage) && trim(pcs.webkitMaskImage) !== 'none') ||
          (!!trim(pcs.webkitMaskBoxImage) && trim(pcs.webkitMaskBoxImage) !== 'none');
        const color =
          !image && bg && !shaped && !(box && !box.fill) && !hasBlendMode(pcs) && !hasFilter(pcs)
            ? { r: bg.r, g: bg.g, b: bg.b, a: clamp01(bg.a) * opacity }
            : null;
        const radius = Math.max(
          0,
          ...[
            'borderTopLeftRadius',
            'borderTopRightRadius',
            'borderBottomLeftRadius',
            'borderBottomRightRadius'
          ].map((k) => {
            const v = parsePx(pcs[k]);
            return Number.isFinite(v) ? v : 0;
          })
        );
        out.push({
          el: host,
          pseudo: name,
          // Stands for the pseudo-element in a paint key (__treeOrder).
          ref: { pseudoHost: host, which: name },
          z,
          paint: {
            property: image ? 'background-image' : 'background-color',
            value: truncateCssValue(image ? pcs.backgroundImage : pcs.backgroundColor, 80)
          },
          box,
          color,
          radius,
          // Positioned against its element, the paint order places it, by
          // its z-index: a negative one puts it under the text of its
          // stacking context and over that context's own background. A
          // fixed one is placed against the viewport, which __pseudoBox
          // does not work out.
          ordered: pcs.position === 'absolute'
        });
      }
    }
    __positionedPseudosCache.set(host, out);
    return out;
  }

  // Where a positioned pseudo-element paints, as { rect, exact }: its box,
  // or its element's where that can't be worked out (`exact` false), less
  // what its element and the element's ancestors clip away. null when
  // nothing of it is left. `boxOf` gives an element's box.
  function __pseudoPaintedBox(ps, boxOf) {
    if (ps.painted !== undefined) return ps.painted;
    let out = null;
    try {
      const host = ps.el;
      const hostRect = boxOf(host);
      let r = ps.box || hostRect;
      const hcs = __contrastComputedStyle(host);
      if (r && hostRect && hcs) {
        const cx = !!hcs.overflowX && hcs.overflowX !== 'visible';
        const cy = !!hcs.overflowY && hcs.overflowY !== 'visible';
        const left = cx ? Math.max(r.left, hostRect.left) : r.left;
        const right = cx ? Math.min(r.right, hostRect.right) : r.right;
        const top = cy ? Math.max(r.top, hostRect.top) : r.top;
        const bottom = cy ? Math.min(r.bottom, hostRect.bottom) : r.bottom;
        r = { left, top, right, bottom, width: right - left, height: bottom - top };
      }
      // An ancestor that clips its element clips it too: its containing
      // block is its element.
      if (r && r.width >= 1 && r.height >= 1) r = __paintedPart(host, r, new Map(), null);
      if (r && r.width >= 1 && r.height >= 1) out = { rect: r, exact: !!ps.box };
    } catch {
      out = null;
    }
    ps.painted = out;
    return out;
  }

  // When a positioned pseudo-element's background is painted, as a key
  // ordered by __cmpPaintKeys: it is positioned, so it paints in the nearest
  // stacking context among its element and the element's ancestors, by its
  // z-index there.
  function __pseudoPaintKey(ps) {
    let ctx = null;
    for (
      let cur = ps.el, guard = 0;
      cur && dom.nodeType(cur) === 1 && guard < 1000;
      cur = composedParent(cur), guard++
    ) {
      const g = __lname(cur) === 'html' ? null : __paintGroup(cur);
      if (__lname(cur) === 'html' || (g && g.kind === 'context')) {
        ctx = cur;
        break;
      }
    }
    const base = ctx ? __participantKey(ctx) : null;
    if (!base) return null;
    const z = ps.z || 0;
    const phase = z < 0 ? 1 : z === 0 ? 5 : 6;
    return base.concat([
      [phase, z, ps.ref],
      [0, 0, ps.ref]
    ]);
  }

  // The first of host's positioned ::before and ::after painting a color or
  // gradient, as { name, property, value, box }, leaving out those the paint
  // order places when `unorderedOnly`; null when there is none.
  function __hasPositionedPaintPseudo(host, unorderedOnly) {
    for (const p of __positionedPseudos(host)) {
      if (unorderedOnly && p.ordered) continue;
      if (p.paint.property === 'background-image' && !/gradient\(/i.test(p.paint.value)) continue;
      return { name: p.pseudo, property: p.paint.property, value: p.paint.value, box: p.box };
    }
    return null;
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
              if (!ancestors.has(p.el) && p.rect && __intersects(p.rect, r)) return true;
            }
          }
        }
        return false;
      };
      let box = null;
      try {
        box = dom.getBoundingClientRect(el);
      } catch {}
      // The paint order decides about paint that isn't an ancestor's, and
      // about ancestors' paint that isn't under the text (__paintBackdropOf):
      // measured against, in the way, or irrelevant. Where it can't be
      // worked out, the search below looks for it.
      const ordered = __paintBackdropOf(el);
      if (ordered && ordered.blocked) return ordered.blocked;
      const paintOrdered = ordered === null || !!(ordered && ordered.rgba);
      // Pseudo-elements the paint order placed are decided already.
      const pseudoCandidates = chain.some((host) => __hasPositionedPaintPseudo(host, paintOrdered));
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
              if (ancestors.has(p.el) || !p.rect || !__paintsOnLine(p, p.rect, tr)) continue;
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
        const pseudo = __hasPositionedPaintPseudo(host, paintOrdered);
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
            if (!p.rect || !__paintsOnLine(p, p.rect, tr) || __isComposedInside(el, p.el)) continue;
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
  // Whether an ancestor paints a background, shared by the texts inside it.
  const __paintsBgCache = new WeakMap();
  // Per scan: the root's own facts, each element's overflow clipping, and
  // whether an element or one of its ancestors sinks under a negative z-index.
  const __rootFactsCache = new WeakMap();
  const __clipsCache = new WeakMap();
  const __sunkCache = new WeakMap();
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

  // Tree order of two boxes, each a node or a pseudo-element's ref
  // ({ pseudoHost, which }): ::before comes after its element and before
  // the element's content, ::after after all of it. Negative when a comes
  // first; NaN when they are in different trees.
  function __treeOrder(a, b) {
    const ha = a.pseudoHost;
    const hb = b.pseudoHost;
    if (!ha && !hb) {
      const pos = dom.compareDocumentPosition(a, b);
      if (pos & 1) return Number.NaN;
      return pos & 4 ? -1 : 1;
    }
    if (ha && hb && ha === hb) return a.which === '::before' ? -1 : 1;
    // A pseudo-element against a node.
    const against = (pseudo, node) => {
      const host = pseudo.pseudoHost;
      if (node === host) return 1;
      const pos = dom.compareDocumentPosition(host, node);
      if (pos & 1) return Number.NaN;
      if (pos & 16) return pseudo.which === '::before' ? -1 : 1;
      return pos & 4 ? -1 : 1;
    };
    if (!hb) return against(a, b);
    if (!ha) return -against(b, a);
    // Two hosts: the pseudo-element of the inner one sits where its host
    // does, inside the outer one.
    const pos = dom.compareDocumentPosition(ha, hb);
    if (pos & 1) return Number.NaN;
    return pos & 8 ? -against(b, ha) : against(a, hb);
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
      if (x[2] !== y[2]) return __treeOrder(x[2], y[2]);
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
        selector: __getSimpleSelectorCached(p.el, __lname(p.el)) + (p.pseudo || ''),
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
    // Text that a box clipping its overflow (a scrolled list, a dialog's
    // content) keeps partly or wholly out of view is seen once scrolled
    // into it, and moves with the box's content: it is then over the box
    // and the box's ancestors, beside what else the box holds. What lies
    // where it is now, outside the box, is never under it. So for such
    // text, the ancestors from the innermost such box up are under all of
    // it, and only paint inside that box is ordered with it. The root and
    // a body whose overflow is the viewport's scroll the page, which moves
    // everything but fixed boxes alike.
    const root = chain[chain.length - 1];
    let rootFacts = __rootFactsCache.get(root);
    if (!rootFacts) {
      const rcs = __contrastComputedStyle(root);
      const rbg = parseCssColorToRgba(rcs && rcs.backgroundColor);
      rootFacts = {
        overflows: !!rcs && (rcs.overflowX !== 'visible' || rcs.overflowY !== 'visible'),
        paints: (rbg && rbg.a > 0) || (rcs && __bgImagePaints(root, rcs))
      };
      __rootFactsCache.set(root, rootFacts);
    }
    const rootOverflows = rootFacts.overflows;
    let scrolledFrom = chain.length;
    for (let i = 1; i < chain.length; i++) {
      const a = chain[i];
      const name = __lname(a);
      if (name === 'html' || (name === 'body' && !rootOverflows)) continue;
      let clips = __clipsCache.get(a);
      if (!clips) {
        const cs = __contrastComputedStyle(a);
        clips = {
          x: !!cs && !!cs.overflowX && cs.overflowX !== 'visible',
          y: !!cs && !!cs.overflowY && cs.overflowY !== 'visible'
        };
        __clipsCache.set(a, clips);
      }
      const clipsX = clips.x;
      const clipsY = clips.y;
      if (!clipsX && !clipsY) continue;
      const r = boxOf(a);
      if (!r) continue;
      if (
        (clipsX && (box.left < r.left - 0.5 || box.right > r.right + 0.5)) ||
        (clipsY && (box.top < r.top - 0.5 || box.bottom > r.bottom + 0.5))
      ) {
        scrolledFrom = i;
        break;
      }
    }
    const scroller = scrolledFrom < chain.length ? chain[scrolledFrom] : null;
    const scrollsWith = (node) => !scroller || __isComposedInside(node, scroller);
    // Where a painter lies under the text: what it paints, or for text out of
    // view, where it lies scrolled into the box with the text.
    const at = (p) => (scroller ? p.raw : p.rect);
    // The ::before and ::after of el and its ancestors that the paint order
    // places, with where each paints: a positioned one with a negative
    // z-index is painted over its stacking context's background and under
    // its text (CSS 2.1 Appendix E), as the overlay or hover fill of a
    // button is. Where its box can't be worked out, its element's stands
    // in, and only for finding it.
    const pseudos = [];
    for (const host of chain) {
      for (const ps of __positionedPseudos(host)) {
        if (!ps.ordered || !scrollsWith(host)) continue;
        // Scrolled into view with the text, it isn't clipped where it is now.
        const r = scroller
          ? { rect: ps.box || boxOf(host), exact: !!ps.box }
          : __pseudoPaintedBox(ps, boxOf);
        if (r && r.rect) pseudos.push({ p: ps, rect: r.rect, exact: r.exact });
      }
    }
    // A descendant of el sunk under its text by a negative z-index, in el's
    // stacking context, paints under el's own text, not beside it.
    const sunkInside = (node) => {
      for (let cur = node, guard = 0; cur && cur !== el && guard < 1000; guard++) {
        const zcs = __contrastComputedStyle(cur);
        if (Number.parseInt(zcs && zcs.zIndex, 10) < 0) return true;
        cur = composedParent(cur);
      }
      return false;
    };
    const nearPseudo = pseudos.some((x) => __intersects(x.rect, box));
    let near = false;
    const bx0 = Math.floor(box.left / __OVERLAP_CELL);
    const bx1 = Math.floor(box.right / __OVERLAP_CELL);
    const by0 = Math.floor(box.top / __OVERLAP_CELL);
    const by1 = Math.floor(box.bottom / __OVERLAP_CELL);
    for (let cx = bx0; cx <= bx1 && !near; cx++) {
      for (let cy = by0; cy <= by1 && !near; cy++) {
        for (const i of index.cells.get(cx + ',' + cy) || []) {
          const p = index.painters[i];
          if (
            !inChain.has(p.el) &&
            scrollsWith(p.el) &&
            !!at(p) &&
            __intersects(at(p), box) &&
            (!__isComposedInside(p.el, el) || sunkInside(p.el))
          ) {
            near = true;
            break;
          }
        }
      }
    }
    // The canvas (the root, or the body when the root paints nothing)
    // covers the page; any other ancestor's background lies under the text
    // only where its box does.
    const rootPaints = rootFacts.paints;
    const isCanvas = (a) => a === root || (__lname(a) === 'body' && !rootPaints);
    const scrolledOver = new Set(chain.slice(scrolledFrom));
    // Under all of the text: the canvas, and for text scrolled out of view,
    // the box it is scrolled in and its ancestors.
    const underAll = (a) => isCanvas(a) || scrolledOver.has(a);
    const paints = (a, cs) => {
      if (!cs) return false;
      if (__paintsBgCache.has(a)) return __paintsBgCache.get(a);
      const bg = parseCssColorToRgba(cs.backgroundColor);
      const v = !!((bg && bg.a > 0) || __bgImagePaints(a, cs));
      __paintsBgCache.set(a, v);
      return v;
    };
    const contains = (r, t) =>
      !!r &&
      t.left >= r.left - 0.5 &&
      t.right <= r.right + 0.5 &&
      t.top >= r.top - 0.5 &&
      t.bottom <= r.bottom + 0.5;
    const outside = chain.some(
      (a) => !underAll(a) && paints(a, __contrastComputedStyle(a)) && !contains(boxOf(a), box)
    );
    // Text in a stacking context with a negative z-index can be painted
    // under its own ancestors' backgrounds. Only a negative z-index can
    // give that, so it is read before the paint group is worked out.
    const sinks = (a) => {
      const zcs = __contrastComputedStyle(a);
      if (!(Number.parseInt(zcs && zcs.zIndex, 10) < 0)) return false;
      const g = __paintGroup(a);
      return !!g && g.kind === 'context' && g.z < 0;
    };
    // The chain's tail is shared with every other text in the same
    // ancestors, so each answer is kept per element, for it and above it.
    // A chain the guard cut short isn't the whole tail: it is asked afresh.
    let sunk;
    if (chain.length >= 1000) sunk = chain.some(sinks);
    else {
      let i = chain.length - 1;
      let up = false;
      while (i >= 0 && __sunkCache.has(chain[i])) i--;
      if (i < chain.length - 1) up = __sunkCache.get(chain[i + 1]);
      for (; i >= 0; i--) {
        up = up || sinks(chain[i]);
        __sunkCache.set(chain[i], up);
      }
      sunk = up;
    }
    if (!near && !nearPseudo && !outside && !sunk) return null;
    const rects = __ownTextRects(el);
    if (!rects.length) return null;
    const textKey = __paintKey(el, 'content');
    if (!textKey) return FALLBACK;

    // The boxes that meet the text, in front of it or behind. Candidates
    // come from every line's cells first, so a box is tested against every
    // line, not only the first one whose cells hold it.
    const candidates = new Set();
    // No box meets el's but the pseudo-elements: none meets its text.
    for (const tr of near || outside || sunk ? rects : []) {
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
      if (inChain.has(p.el) || !scrollsWith(p.el)) continue;
      const pr = at(p);
      if (!pr || !rects.some((tr) => __paintsOnLine(p, pr, tr))) continue;
      // el's own descendants paint beside its text, unless sunk under it.
      const inside = __isComposedInside(p.el, el);
      if (inside && !sunkInside(p.el)) continue;
      // Shapes inside an <svg> paint with it.
      const orderEl = outerSvg(p.el) || p.el;
      if (inChain.has(orderEl)) continue;
      const key = __paintKey(orderEl, p.paint.property === 'element' ? 'content' : 'bg');
      const c = key ? __cmpPaintKeys(key, textKey) : Number.NaN;
      if (Number.isNaN(c)) return FALLBACK;
      if (c > 0) {
        if (inside || __isPinned(p.el)) continue;
        return blocked(p);
      }
      behind.push({ p, key, svg: orderEl !== p.el, rect: pr });
    }
    // Pseudo-elements painted over the text: in the way, unless an opaque
    // color the same as what lies under the text (a white fade-out over
    // white), which changes nothing.
    const above = [];
    for (const x of pseudos) {
      if (!rects.some((tr) => __coversLine(x.rect, tr))) continue;
      const key = __pseudoPaintKey(x.p);
      const c = key ? __cmpPaintKeys(key, textKey) : Number.NaN;
      if (Number.isNaN(c)) return FALLBACK;
      if (c > 0) {
        if (!x.exact || !x.p.color || x.p.color.a < 1) return blocked(x.p);
        // Its border, or the part its background-clip leaves bare, isn't its color.
        const f = x.p.box.fill;
        const b = x.p.box;
        const ring = f.left > b.left || f.right < b.right || f.top > b.top || f.bottom < b.bottom;
        if (ring && rects.some((tr) => __intersects(x.rect, tr) && !contains(f, tr)))
          return blocked(x.p);
        above.push(x.p);
        continue;
      }
      behind.push({ p: x.p, key, svg: false, rect: x.rect, pseudo: x });
    }
    if (!behind.length && !above.length && !outside && !sunk) return null;

    // el's ancestors' backgrounds where they lie under the text, with what
    // else lies behind it.
    const layers = [];
    let changed = null;
    // Whether el or an ancestor walked so far paints an opaque background.
    let opaqueBelow = false;
    for (const a of chain) {
      const cs = __contrastComputedStyle(a);
      if (!cs) continue;
      opaqueBelow = opaqueBelow || (__opaqueBgOf(cs) && __textInOpaqueBox(el, a));
      // A group effect on an ancestor applies to the foreign paint too only
      // when it groups both; that is left to the older checks. A drop shadow
      // under an opaque background is hidden by it.
      if (
        clamp01(Number.parseFloat(cs.opacity != null ? cs.opacity : '1')) < 1 ||
        __hasBlendModeEl(a, cs) ||
        (__hasFilterEl(a, cs) && !(opaqueBelow && __hidesOwnShadow(cs)))
      )
        return FALLBACK;
      const under = __hasBackgroundImageOrGradientEl(a, cs) ? __bgLayersUnder(a, cs, el) : null;
      const image = !!(under && under.blocked);
      let bg = parseCssColorToRgba(cs.backgroundColor);
      // Solid colors its background images paint, over its background color.
      if (under && under.colors && under.colors.length) {
        let over = { r: 0, g: 0, b: 0, a: 0 };
        for (const c of under.colors) over = compositeRgba(over, c);
        if (bg && bg.a > 0) over = compositeRgba(over, bg);
        bg = over;
      }
      if (!image && (!bg || bg.a === 0)) continue;
      const own = {
        el: a,
        paint: { property: 'background-color', value: trim(cs.backgroundColor) }
      };
      let color = image ? null : bg;
      let partial = null;
      if (!underAll(a)) {
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
      // A pseudo-element's own color, with its opacity, where its box is
      // known.
      let color = b.pseudo
        ? b.pseudo.exact
          ? b.p.color
          : null
        : !b.svg && b.p.paint.property === 'background-color'
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
          (__hasFilterEl(cur, ccs) && !(color.a >= 1 && __hidesOwnShadow(ccs)))
        )
          color = null;
      }
      // All of the text, clear of rounded corners.
      if (color) {
        const radius = b.pseudo
          ? b.p.radius
          : Math.max(
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
        const f = b.pseudo ? b.p.box.fill : null;
        const r = f
          ? {
              left: Math.max(b.rect.left, f.left),
              right: Math.min(b.rect.right, f.right),
              top: Math.max(b.rect.top, f.top),
              bottom: Math.min(b.rect.bottom, f.bottom)
            }
          : b.rect;
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
    if (!usedForeign && !changed && !above.length) return null;
    // The browser's canvas, where it was read, is under every layer.
    const canvas = acc.a < 1 ? __measuredCanvasUnder(el) : null;
    if (canvas) acc = compositeRgba(acc, canvas);
    if (acc.a < 1) return usedForeign || changed ? blocked(usedForeign || changed) : null;
    for (const p of above) {
      if (p.color.r !== acc.r || p.color.g !== acc.g || p.color.b !== acc.b) return blocked(p);
    }
    if (!usedForeign && !changed) return null;
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
    renderedTextScale,
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
    paintsBackgroundLayer,
    backgroundLayerKinds,
    hasBlendMode,
    hasFilter,
    computeOpacityProduct,
    computeEffectiveForeground,
    computeEffectiveBackground,
    getComputabilityBlocker,
    getOutlineColors,
    measureOutlineOnlyText,
    measureGeneratedText,
    getGeneratedNameText,
    getTextScan,
    textStyleOf,
    isPlaceholderText,
    isInactiveUiComponent,
    comparePaintOrder,
    colorsForced,
    noteForcedColors,
    isPinned: __isPinned
  };
}

module.exports = { createContrastHelpers };
