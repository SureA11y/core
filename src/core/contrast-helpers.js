'use strict';

function createContrastHelpers(opts, shared) {
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
            if (existing && typeof existing.get === 'function' && typeof existing.set === 'function') return existing;
            const wm = new WeakMap();
            sc[propName] = wm;
            return wm;
        } catch (_e) {
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
        } catch (_e) {
            return null;
        }
    }

    // -------- Computed style memoization (per element, per run) --------

    const __localComputedStyleCache = new WeakMap();
    const __computedStyleCache = __getSharedWeakMapCache('__computedStyleCache') || __localComputedStyleCache;

    function __contrastComputedStyle(el) {
        try {
            if (!el || el.nodeType !== 1) return computedStyle(el);
            if (__computedStyleCache.has(el)) return __computedStyleCache.get(el);
            const cs = computedStyle(el);
            __computedStyleCache.set(el, cs);
            return cs;
        } catch {
            // Always no-throw: return empty object on any failure
            try {
                const cs = computedStyle(el);
                if (el && el.nodeType === 1) __computedStyleCache.set(el, cs);
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
    const __hasBgImgCache = __getSharedWeakMapCache('__hasBgImgCache') || __localHasBgImgCache;
    const __hasBlendModeCache = __getSharedWeakMapCache('__hasBlendModeCache') || __localHasBlendModeCache;
    const __hasFilterCache = __getSharedWeakMapCache('__hasFilterCache') || __localHasFilterCache;

    // -------- Visibility mode resolution for getTextScan --------

    function __getVisibilityMode(engineOptions) {
        const m = engineOptions && typeof engineOptions.visibilityMode === 'string' ? engineOptions.visibilityMode : '';
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

        return 'styleOnly';
    }

    function __asEligibilityBool(v) {
        if (typeof v === 'boolean') return v;
        if (v && typeof v === 'object' && typeof v.eligible === 'boolean') return v.eligible;
        return !!v;
    }

    function getTextScan(ctx, helpers, engineOptions) {
        try {
            const d = (ctx && ctx.document) || (opts && opts.document) || null;

            const w =
                (ctx && ctx.window) ||
                (d && d.defaultView) ||
                window ||
                null;

            const rawMode = __resolveVisibilityMode(ctx, engineOptions, d, w);

            const visibilityMode =
                __getVisibilityMode({ visibilityMode: rawMode }) === 'styleAndGeometry'
                    ? 'styleAndGeometry'
                    : 'styleOnly';

            if (!d || typeof d.createTreeWalker !== 'function') {
                return { eligibleTextCount: 0, elements: [], visibilityMode };
            }

            const cache = __getSharedTextScanCache();
            const cacheKey = `visibilityMode=${visibilityMode}`;
            if (cache && cache.has(cacheKey)) return cache.get(cacheKey);

            const walkRootRaw = (ctx && ctx.root) ? ctx.root : (d.body || d.documentElement || d);
            const walkRoot = (walkRootRaw && walkRootRaw.nodeType === 9)
                ? (walkRootRaw.body || walkRootRaw.documentElement || walkRootRaw)
                : walkRootRaw;

            const SHOW_TEXT =
                (w && w.NodeFilter && typeof w.NodeFilter.SHOW_TEXT === 'number')
                    ? w.NodeFilter.SHOW_TEXT
                    : 4;

            const walker = d.createTreeWalker(walkRoot, SHOW_TEXT, null);

            const isNonEmptyText = (t) => t != null && /\S/.test(String(t));

            const elToCount = new WeakMap();
            const elements = [];
            let eligibleTextCount = 0;

            const eligCache = new WeakMap();

            const isVisibleEligible = (el) => {
                if (!helpers || typeof helpers.isDomVisibleEligible !== 'function') return true;
                if (eligCache.has(el)) return eligCache.get(el);

                let ok = true;
                try {
                    const r = helpers.isDomVisibleEligible(el, ctx, { visibilityMode });
                    ok = __asEligibilityBool(r);
                } catch {
                    ok = false;
                }

                eligCache.set(el, ok);
                return ok;
            };

            let node = null;
            let guard = 0;

            while ((node = walker.nextNode()) && guard++ < 500000) {
                const text = node && node.nodeValue;
                if (!isNonEmptyText(text)) continue;

                const el =
                    node.parentElement ||
                    (node.parentNode && node.parentNode.nodeType === 1 ? node.parentNode : null);

                if (!el) continue;
                // Respect subtree exclusions from engineOptions.excludeSelectors
                try {
                    if (helpers && typeof helpers.isExcluded === 'function' && helpers.isExcluded(el)) continue;
                } catch {}
                if (!isVisibleEligible(el)) continue;

                eligibleTextCount++;

                const prev = elToCount.get(el);
                if (prev === undefined) {
                    elToCount.set(el, 1);
                    elements.push(el);
                } else {
                    elToCount.set(el, prev + 1);
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

    function isLargeText(fontSizePx, fontWeightNum) {
        const size = parseFloat(fontSizePx);
        const w = Number(fontWeightNum);
        if (!Number.isFinite(size)) return false;
        if (size >= 24) return true;
        if (size >= 18.6667 && Number.isFinite(w) && w >= 700) return true;
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
        s = s.replace(/\s*%\s*/g, '%');
        return s;
    }

    function __parseCssColorToRgbaUncached(input) {
        const s = trim(input).toLowerCase();
        if (!s) return null;
        if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

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

            const rgbNums = rgbPart.split(/\s+/).map((x) => trim(x)).filter(Boolean);
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
            if (w && d && typeof d.createElement === 'function' && typeof w.getComputedStyle === 'function') {
                const probe = d.createElement('span');
                // Avoid layout/paint side effects
                probe.style.position = 'absolute';
                probe.style.left = '-9999px';
                probe.style.top = '-9999px';
                probe.style.opacity = '0';
                probe.style.color = String(input);
                const parent = d.body || d.documentElement;
                if (parent && typeof parent.appendChild === 'function') parent.appendChild(probe);

                let computed = '';
                try {
                    computed = (w.getComputedStyle(probe) && w.getComputedStyle(probe).color) || '';
                } catch (_e) {
                    computed = '';
                }

                try {
                    if (probe && probe.parentNode) probe.parentNode.removeChild(probe);
                } catch (_e) {}

                const normalized = __normalizeCssColorCacheKey(computed);
                if (normalized && normalized !== __normalizeCssColorCacheKey(input)) {
                    // Reuse the parser on the computed rgb()/rgba() string.
                    const parsed = __parseCssColorToRgbaUncached(normalized);
                    if (parsed) return parsed;
                }
            }
        } catch (_e) {}

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
        const n = (Number(maxLen) | 0) > 10 ? (Number(maxLen) | 0) : 80;
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

    function __hasBackgroundImageOrGradientEl(el, cs) {
        try {
            if (!el || el.nodeType !== 1) return hasBackgroundImageOrGradient(cs);
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
            if (!el || el.nodeType !== 1) return hasBlendMode(cs);
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
            if (!el || el.nodeType !== 1) return hasFilter(cs);
            if (__hasFilterCache.has(el)) return __hasFilterCache.get(el);
            const v = hasFilter(cs);
            __hasFilterCache.set(el, v);
            return v;
        } catch {
            return false;
        }
    }

    // -------- Opacity product memoization --------

    const __localOpacityProductCache = new WeakMap();
    const __opacityProductCache = __getSharedWeakMapCache('__opacityProductCache') || __localOpacityProductCache;

    function computeOpacityProduct(el) {
        try {
            if (!el || (typeof el !== 'object' && typeof el !== 'function')) return 1;
            if (__opacityProductCache.has(el)) return __opacityProductCache.get(el);

            let prod = 1;
            let cur = el;
            let guard = 0;
            while (cur && guard++ < 200) {
                if (cur.nodeType !== 1) {
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
        } catch (_e) {
            return 1;
        }
    }

    // -------- Effective foreground/background memoization --------

    const __localEffectiveForegroundCache = new WeakMap();
    const __effectiveForegroundCache =
        __getSharedWeakMapCache('__effectiveForegroundCache') || __localEffectiveForegroundCache;

    function computeEffectiveForeground(el) {
        try {
            if (el && __effectiveForegroundCache.has(el)) return __effectiveForegroundCache.get(el);
        } catch (_e) {}

        const cs = __contrastComputedStyle(el);
        const c = parseCssColorToRgba(cs && cs.color);
        if (!c) {
            const out = { rgba: null, alpha: 0, opacityProduct: computeOpacityProduct(el) };
            try { if (el) __effectiveForegroundCache.set(el, out); } catch (_e) {}
            return out;
        }

        const op = computeOpacityProduct(el);
        const out = {
            rgba: { r: c.r, g: c.g, b: c.b, a: clamp01(c.a * op) },
            alpha: clamp01(c.a * op),
            opacityProduct: op
        };
        try { if (el) __effectiveForegroundCache.set(el, out); } catch (_e) {}
        return out;
    }

    const __localEffectiveBackgroundCache = new WeakMap();
    const __effectiveBackgroundCache =
        __getSharedWeakMapCache('__effectiveBackgroundCache') || __localEffectiveBackgroundCache;

    function __bgCacheKey(opts2) {
        const contrast = (opts2 && opts2.contrast && typeof opts2.contrast === 'object') ? opts2.contrast : {};
        const mode = (contrast.mode === 'auditorAssist') ? 'auditorAssist' : 'strictConformance';
        const rootCanvasFallback =
            (typeof contrast.rootCanvasFallback === 'string' && contrast.rootCanvasFallback.trim())
                ? contrast.rootCanvasFallback.trim()
                : '#ffffff';

        // Cache key must include any input that can affect computed background.
        // Note: we only cache when collectStack is false.
        return `${mode}|${rootCanvasFallback}`;
    }

    function computeEffectiveBackground(el, opts2) {
        const __bgKey = __bgCacheKey(opts2);
        const __collectStack = !!(opts2 && opts2.collectStack);

        // Only cache when stack collection is off
        if (!__collectStack) {
            try {
                if (el && __effectiveBackgroundCache.has(el)) {
                    const m = __effectiveBackgroundCache.get(el);
                    if (m && typeof m.get === 'function' && m.has(__bgKey)) return m.get(__bgKey);
                }
            } catch (_e) {}
        }

        const contrast = (opts2 && opts2.contrast && typeof opts2.contrast === 'object') ? opts2.contrast : {};
        const mode = (contrast.mode === 'auditorAssist') ? 'auditorAssist' : 'strictConformance';
        const rootCanvasFallback =
            (typeof contrast.rootCanvasFallback === 'string' && contrast.rootCanvasFallback.trim())
                ? contrast.rootCanvasFallback.trim()
                : '#ffffff';

        const collectStack = !!(opts2 && opts2.collectStack);
        const stack = collectStack ? [] : null;

        let acc = { r: 0, g: 0, b: 0, a: 0 };
        let cur = el;
        let guard = 0;

        while (cur && guard++ < 200) {
            if (cur.nodeType !== 1) { cur = composedParent(cur); continue; }

            const cs = __contrastComputedStyle(cur);
            const bg = parseCssColorToRgba(cs && cs.backgroundColor);
            const op = clamp01(Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1'));

            if (bg) {
                const layer = { r: bg.r, g: bg.g, b: bg.b, a: clamp01(bg.a * op) };
                if (collectStack) {
                    stack.push({
                        selector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                        bg: { r: layer.r, g: layer.g, b: layer.b, a: layer.a },
                        opacity: op
                    });
                }
                acc = compositeRgba(layer, acc);
                if (acc.a >= 1) break;
            }

            cur = composedParent(cur);
        }

        let out;
        const allowAssumptions = (mode === 'auditorAssist');

        if (acc.a < 1) {
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
                if (!m) { m = new Map(); __effectiveBackgroundCache.set(el, m); }
                m.set(__bgKey, out);
            } catch (_e) {}
        }

        return out;
    }


    // -------- Selector memoization --------

    const __localSimpleSelectorCache = new WeakMap();
    const __simpleSelectorCache = __getSharedWeakMapCache('__simpleSelectorCache') || __localSimpleSelectorCache;

    function __getSimpleSelectorCached(el, fallbackTag) {
        try {
            if (!el || el.nodeType !== 1) return '';
            if (__simpleSelectorCache.has(el)) return __simpleSelectorCache.get(el) || '';
            const s = buildSimpleSelector(el, fallbackTag);
            __simpleSelectorCache.set(el, s || '');
            return s || '';
        } catch (_e) {
            return '';
        }
    }

    function classifyBackgroundImageValue(bgImageValue) {
        try {
            const v = (bgImageValue == null) ? '' : String(bgImageValue).trim();
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

    // -------- Computability blocker (memoized per element, per run) --------

    const __localComputabilityBlockerCache = new WeakMap();
    const __computabilityBlockerCache =
        __getSharedWeakMapCache('__computabilityBlockerCache') || __localComputabilityBlockerCache;

    function getComputabilityBlocker(el) {
        try {
            if (el && __computabilityBlockerCache.has(el)) return __computabilityBlockerCache.get(el);
        } catch (_e) {}

        let cur = el;
        let guard = 0;
        while (cur && guard++ < 200) {
            if (cur.nodeType !== 1) { cur = composedParent(cur); continue; }
            const cs = __contrastComputedStyle(cur);

            if (__hasBlendModeEl(cur, cs)) {
                const out = {
                    ok: false,
                    reasonCode: 'MIX_BLEND_MODE',
                    blockerSelector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                    blockerProperty: 'mix-blend-mode',
                    blockerValue: truncateCssValue(cs && cs.mixBlendMode, 80)
                };
                try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
                return out;
            }

            if (__hasFilterEl(cur, cs)) {
                const isFilter = cs && cs.filter && String(cs.filter).trim().toLowerCase() !== 'none';
                const out = {
                    ok: false,
                    reasonCode: 'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
                    blockerSelector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                    blockerProperty: isFilter ? 'filter' : 'backdrop-filter',
                    blockerValue: truncateCssValue((isFilter ? cs.filter : cs.backdropFilter) || '', 80)
                };
                try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
                return out;
            }

            if (__hasBackgroundImageOrGradientEl(cur, cs)) {
                const bgImg = (cs && cs.backgroundImage) || '';
                const out = {
                    ok: false,
                    reasonCode: 'BACKGROUND_IMAGE_OR_GRADIENT',
                    blockerSelector: __getSimpleSelectorCached(cur, (cur.tagName || '').toLowerCase() || 'html'),
                    blockerProperty: 'background-image',
                    blockerValue: truncateCssValue(bgImg, 80),
                    backgroundFillType: classifyBackgroundImageValue(bgImg)
                };
                try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
                return out;
            }

            cur = composedParent(cur);
        }

        const out = { ok: true, reasonCode: null, blockerSelector: '', blockerProperty: '', blockerValue: '' };
        try { if (el) __computabilityBlockerCache.set(el, out); } catch (_e) {}
        return out;
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
        getTextScan
    };
}

module.exports = { createContrastHelpers };
