'use strict';

/**
 * DOM helpers used by rules (ctx.helpers).
 *
 * Kernel philosophy (A11yCore helpers contract)
 * ---------------------------------------------
 * These helpers exist to keep rules:
 * - **Atomic** (rules decide outcomes; helpers provide facts),
 * - **Deterministic** (no randomness, time, locale, or non-deterministic iteration),
 * - **Serializable** (inlined into generated core.js; no Node-only APIs),
 * - **Standards-aligned** (helpers are mechanism-aware where requirements depend on element/type).
 *
 * Design principles:
 * 1) Helpers return **structured "Info" objects** (facts + mechanism + flags), not verdicts.
 *    - Rules produce outcomes: pass/fail/cantTell/notApplicable.
 * 2) Prefer **mechanism-first** semantics:
 *    - Example: <img> requires an `alt` attribute (even if aria-label exists). Helpers surface that:
 *      `{ present:false, flags:['name-present-but-alt-missing'] }` when `alt` is missing.
 * 3) Keep "kernel" helpers small, stable, and reusable across domains. If/when domain helpers emerge
 *    (tables/media/forms), they should build on these kernel primitives.
 *
 * Kernel helpers included (A → F):
 * A) eligibility: isAccTreeEligible (existing), getEligibilityInfo (new)
 * B) name/description: getAccessibleNameInfo, getAccessibleDescriptionInfo (new)
 * C) text alternatives: getTextAlternativeInfo (new)
 * D) role/focusability: getRoleInfo, getFocusableInfo (new)
 * E) IDREF resolution: resolveIdRefs, getTextFromIdRefs (new)
 * F) selector/snippet: buildSelector/buildSimpleSelector/getOuterHtmlSnippet (existing)
 */

const {createContrastHelpers} = require('./contrast-helpers');

function normalizeSelectorList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof value === 'string') {
        // allow "#a,#b" or "#a, #b"
        return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
}

function createDomHelpers(opts) {
    const document = opts && opts.document ? opts.document : null;
    const window = opts && opts.window ? opts.window : null;
    // Some engine paths may not pass opts.window; recover it from document when possible.
    const realmWindow =
        window ||
        (document && document.defaultView) ||
        null;
    const root = opts && opts.root ? opts.root : null;
    const includeShadowDom = !!(opts && opts.includeShadowDom);
    const excludeSelectors = Array.isArray(opts && opts.excludeSelectors) ? opts.excludeSelectors : [];

    // -------------------------------------------------------------------------
    // Per-run shared caches (DOM helpers)
    // Stored on the realm window when possible so multiple helper instances
    // within the same run share caches deterministically.
    // -------------------------------------------------------------------------
    var __domSharedCache = {};
    var __selectorCache = null;
    var __outerHtmlCache = null;
    var __idLookupDocCache = null;   // Map<string, Element|null>
    var __idLookupRootCache = null;  // Map<string, Element|null>
    var __idRefCacheByRoot = null;   // WeakMap<object, Map<string, {refs, missing, flags, partsLen}>>
    var __idRefReverseIndexByScope = null; // WeakMap<object, Map<string, Set<Element>>>
    var __uniqIndexByScope = null; // WeakMap<object, object> (selector uniqueness index per scope)
    var __shadowRootsByRoot = null; // WeakMap<object, Array<object>> (cached open shadow roots per root)

    // -------------------------------------------------------------------------
    // Optional per-run performance counters (debug/benchmark only)
    // -------------------------------------------------------------------------
    const __perfEnabled = !!(opts && opts.perfStats);
    const __perf = __perfEnabled ? {enabled: true, counters: Object.create(null)} : null;

    function __perfInc(key, n) {
        if (!__perfEnabled || !__perf) return;
        const k = String(key);
        const add = n == null ? 1 : (Number(n) || 0);
        __perf.counters[k] = (__perf.counters[k] || 0) + add;
    }

    function getPerfStats() {
        if (!__perfEnabled || !__perf) return {enabled: false, counters: {}};
        // Return a shallow copy to prevent accidental mutation by callers
        return {enabled: true, counters: {...__perf.counters}};
    }

    function resetPerfStats() {
        if (!__perfEnabled || !__perf) return;
        __perf.counters = Object.create(null);
    }


    // -------------------------------------------------------------------------
    // Shared escaping helpers (reduce per-call allocations, deterministic)
    // -------------------------------------------------------------------------
    const __w = realmWindow || window;
    const __cssEscapeSafe = (s) => {
        try {
            return __w && __w.CSS && typeof __w.CSS.escape === 'function' ? __w.CSS.escape(String(s)) : String(s);
        } catch {
            return String(s);
        }
    };
    const __cssEscapeIdent = (s) => {
        try {
            if (__w && __w.CSS && typeof __w.CSS.escape === 'function') return __w.CSS.escape(String(s));
        } catch {
        }
        return String(s).replace(/[^a-zA-Z0-9\-_]/g, '\\$&');
    };
    const __escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');


    // --- eligibility utilities ---
    const isElement = (n) => !!n && n.nodeType === 1;
    const computedStyle = (el) => {
        // Per-run memoization scoped by *helper scope* (root/document), to ensure
        // style caching does not bleed across helper instances with different roots.
        // This aligns with eligibility cache scoping semantics locked by tests.
        const scope = (root && typeof root === 'object') ? root : (document && typeof document === 'object' ? document : null);

        let map = null;

        try {
            if (__computedStyleCacheByScope && scope && el && typeof el === 'object') {
                map = __computedStyleCacheByScope.get(scope) || null;
                if (map && map.has(el)) {
                    __perfInc('computedStyle.hit');
                    const c = map.get(el);
                    return c && typeof c === 'object' ? c : {};
                }
            }
        } catch { /* ignore */
        }

        __perfInc('computedStyle.miss');
        let cs = {};
        try {
            const w = realmWindow || window;
            cs = w && w.getComputedStyle ? w.getComputedStyle(el) : (el && el.style) || {};
        } catch {
            cs = {};
        }

        try {
            if (__computedStyleCacheByScope && scope && el && typeof el === 'object') {
                if (!map) {
                    map = __computedStyleCacheByScope.get(scope) || null;
                    if (!map) {
                        map = new WeakMap();
                        __computedStyleCacheByScope.set(scope, map);
                    }
                }
                map.set(el, cs);
            }
        } catch {
            __perfInc('computedStyle.nocache');
        }

        return cs && typeof cs === 'object' ? cs : {};
    };

    const getOpenModalDialogs = () => {
        // Per-run memoization of open modal dialogs (document-scoped).
        // Safe under engine constraints (no DOM mutation during a run); deterministic.
        if (!document || !document.querySelectorAll) return [];
        if (!__openModalDialogsByDoc) {
            __perfInc('modalDialogs.nocache');
        }
        try {
            if (__openModalDialogsByDoc) {
                const cached = __openModalDialogsByDoc.get(document);
                if (cached) {
                    __perfInc('modalDialogs.hit');
                    return cached;
                }
                __perfInc('modalDialogs.miss');
            }
        } catch {
            __perfInc('modalDialogs.nocache');
        }

        let list = [];
        try {
            const nl = document.querySelectorAll('dialog[open][aria-modal="true"]');
            // Preserve document order, avoid Array.from allocation where possible.
            for (const el of nl) list.push(el);
        } catch {
            list = [];
        }

        try {
            if (__openModalDialogsByDoc) __openModalDialogsByDoc.set(document, list);
        } catch { /* ignore */
        }

        return list;
    };

    const getRootNodeSafe = (n) => {
        try {
            return n && n.getRootNode ? n.getRootNode({composed: true}) : (document || null);
        } catch {
            return document || null;
        }
    };
    const composedParent = (n) => {
        if (!n) return null;
        const p = n.parentNode || (n.assignedSlot ? n.assignedSlot : null);
        if (p) return p;
        const rn = getRootNodeSafe(n);
        return rn && rn.host ? rn.host : null;
    };
    const ancestorsIncludingSelf = (n) => {
        if (!n) return [];
        // Cache ancestor chains per node, per run, to avoid repeated composed-parent walks.
        // Deterministic: purely memoized within the current run, no cross-run persistence.
        try {
            if (__ancestorsIncludingSelfCache && typeof __ancestorsIncludingSelfCache.get === 'function') {
                const cached = __ancestorsIncludingSelfCache.get(n);
                if (cached) {
                    __perfInc('ancestorsIncludingSelf.hit');
                    return cached;
                }
                __perfInc('ancestorsIncludingSelf.miss');
                const out = [];
                let cur = n, guard = 0;
                while (cur && guard++ < 200) {
                    out.push(cur);
                    cur = composedParent(cur);
                }
                __ancestorsIncludingSelfCache.set(n, out);
                return out;
            }
        } catch { /* fall through */
        }

        __perfInc('ancestorsIncludingSelf.nocache');
        const out = [];
        let cur = n, guard = 0;
        while (cur && guard++ < 200) {
            out.push(cur);
            cur = composedParent(cur);
        }
        return out;
    };

    function getClosestMap(el) {
        try {
            if (!isElement(el)) return null;
            return el.closest ? el.closest('map') : null;
        } catch {
            return null;
        }
    }

    function hasBlockingInert(node) {
        // Default behavior: inert anywhere in ancestorsIncludingSelf blocks.
        if (!isElement(node)) return false;

        const tag = (node.tagName || '').toLowerCase();
        const isArea = tag === 'area';

        let mapEl = null;
        if (isArea) mapEl = getClosestMap(node);

        const chain = ancestorsIncludingSelf(node);

        for (const a of chain) {
            if (!isElement(a)) continue;

            // Exception: for <area>, inert on itself or on its <map> does NOT block
            if (isArea) {
                if (a === node) continue;     // ignore <area inert>
                if (mapEl && a === mapEl) continue; // ignore <map inert>
            }

            if (a.hasAttribute && a.hasAttribute('inert')) return true;
        }
        return false;
    }

    const trim = (v) => (v == null ? '' : String(v)).trim();

    const getAttr = (el, name) => {
        try {
            return el && el.getAttribute ? el.getAttribute(name) : null;
        } catch {
            return null;
        }
    };

    function parseTabIndex(el) {
        const raw = getAttr(el, 'tabindex');
        const t = trim(raw);
        if (raw == null || t === '') return {has: false, value: null, valid: false};
        const n = Number(t);
        if (Number.isNaN(n)) return {has: true, value: null, valid: false};
        return {has: true, value: n, valid: true};
    }

    function getPlatformFocusability(el) {
        // Per-run memoization (WeakMap<Element, Result>)
        try {
            if (__focusabilityCache && el && typeof el === 'object' && __focusabilityCache.has(el)) {
                __perfInc('focusability.hit');
                const c = __focusabilityCache.get(el);
                if (c && typeof c === 'object') {
                    return {
                        focusable: !!c.focusable,
                        tabbable: !!c.tabbable,
                        mechanism: c.mechanism || 'none',
                        flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
                    };
                }
            }
        } catch {
        }

        __perfInc('focusability.miss');
        let result = null;

        if (!isElement(el)) {
            result = {focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement']};
        } else if (hasBlockingInert(el)) {
            result = {focusable: false, tabbable: false, mechanism: 'none', flags: ['inert']};
        } else {
            const flags = [];
            const disabled = !!(el.matches && el.matches(':disabled'));
            if (disabled) {
                result = {focusable: false, tabbable: false, mechanism: 'disabled', flags: ['disabled']};
            } else {
                const ti = parseTabIndex(el);
                if (ti.has) {
                    if (!ti.valid) result = {
                        focusable: false,
                        tabbable: false,
                        mechanism: 'tabindex',
                        flags: ['tabindex-invalid']
                    };
                    else if (ti.value < 0) result = {
                        focusable: true,
                        tabbable: false,
                        mechanism: 'tabindex',
                        flags: ['tabindex-negative']
                    };
                    else result = {
                            focusable: true,
                            tabbable: true,
                            mechanism: 'tabindex',
                            flags: ['tabindex-nonnegative']
                        };
                } else {
                    // native focusability
                    const native = isPlatformFocusable(el); // uses your existing boolean logic
                    if (native) result = {focusable: true, tabbable: true, mechanism: 'native', flags};
                    else result = {focusable: false, tabbable: false, mechanism: 'none', flags};
                }
            }
        }

        try {
            if (__focusabilityCache && el && typeof el === 'object') {
                __focusabilityCache.set(el, {
                    focusable: !!result.focusable,
                    tabbable: !!result.tabbable,
                    mechanism: result.mechanism || 'none',
                    flags: Array.isArray(result.flags) ? result.flags.slice(0) : []
                });
            }
        } catch {
        }

        return {
            focusable: !!result.focusable,
            tabbable: !!result.tabbable,
            mechanism: result.mechanism || 'none',
            flags: Array.isArray(result.flags) ? result.flags.slice(0) : []
        };
    }

    // --- attribute ---
    function getAttributeInfo(el, attr) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const attrValue = trim(getAttr(el, attr));
        if (!attrValue) return {present: false, value: '', mechanism: attr, flags: ['empty']};

        return {present: true, value: attrValue, mechanism: attr, flags};
    }

    // --- ARIA name primitives (reusable across rules) ---
    function getAriaLabelInfo(el) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const ariaLabel = trim(getAttr(el, 'aria-label'));
        if (!ariaLabel) return {present: false, value: '', mechanism: 'aria-label', flags: ['empty']};

        return {present: true, value: ariaLabel, mechanism: 'aria-label', flags};
    }

    function getAriaLabelledByInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const ariaLabelledBy = trim(getAttr(el, 'aria-labelledby'));
        if (!ariaLabelledBy) return {present: false, value: '', mechanism: 'aria-labelledby', flags: ['missing']};

        const t = getTextFromIdRefs(ariaLabelledBy, _ctx, opts);
        for (const f of t.flags) flags.push(f);

        if (!t.text) flags.push('empty');

        return {
            present: !!t.text,
            value: t.text || '',
            mechanism: 'aria-labelledby',
            refsCount: t.refsCount,
            missing: t.missing ? t.missing.slice(0) : [],
            flags
        };
    }

    /**
     * getAriaNameInfo: ARIA-only name, with correct precedence.
     * aria-labelledby (if non-empty) wins over aria-label.
     */
    function getAriaNameInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const lb = getAriaLabelledByInfo(el, _ctx, opts);
        if (lb.present && lb.value) return {
            present: true,
            value: lb.value,
            mechanism: 'aria-labelledby',
            flags: flags.concat(lb.flags || [])
        };

        const al = getAriaLabelInfo(el);
        if (al.present && al.value) return {
            present: true,
            value: al.value,
            mechanism: 'aria-label',
            flags: flags.concat(al.flags || [])
        };

        // If aria-labelledby existed but was empty/unresolvable, preserve that info in flags.
        if (trim(getAttr(el, 'aria-labelledby'))) flags.push('aria-labelledby-empty-or-unresolvable');
        if (getAttr(el, 'aria-label') != null && !trim(getAttr(el, 'aria-label'))) flags.push('aria-label-empty');

        return {present: false, value: '', mechanism: 'none', flags};
    }

    const lower = (v) => trim(v).toLowerCase();

    const safeDocGetById = (id) => {
        const key = trim(id);
        if (!key) return null;

        // Shared cache (per run)
        try {
            if (__idLookupDocCache && __idLookupDocCache.has(key)) {
                __perfInc('idLookup.doc.hit');
                return __idLookupDocCache.get(key) || null;
            }
        } catch {
        }

        __perfInc('idLookup.doc.miss');
        let el = null;
        try {
            if (document && document.getElementById) el = document.getElementById(key);
        } catch {
            el = null;
        }

        try {
            if (__idLookupDocCache) __idLookupDocCache.set(key, el || null);
        } catch {
        }

        return el || null;
    };

    const safeRootQueryById = (id) => {
        // Best-effort for cases where root is not the document (e.g. shadow root-like, fragment roots).
        // Note: IDs are document-global in HTML, but test harnesses may use scoped roots.
        const key = trim(id);
        if (!key) return null;
        if (!root || !root.querySelector) return null;

        try {
            const cacheKey = '#' + key;
            if (__idLookupRootCache && __idLookupRootCache.has(cacheKey)) {
                __perfInc('idLookup.root.hit');
                return __idLookupRootCache.get(cacheKey) || null;
            }
        } catch {
        }

        __perfInc('idLookup.root.miss');
        let el = null;
        try {
            el = root.querySelector('#' + key);
        } catch {
            el = null;
        }

        try {
            const cacheKey = '#' + key;
            if (__idLookupRootCache) __idLookupRootCache.set(cacheKey, el || null);
        } catch {
        }

        return el || null;
    };

    function inClosedDetailsContent(node) {
        try {
            if (!isElement(node)) return false;
            const summary = node.closest && node.closest('summary');
            if (summary && summary.contains(node)) return false;
            const details = node.closest && node.closest('details');
            if (details && !details.hasAttribute('open')) return true;
        } catch {
        }
        return false;
    }

    function isPlatformFocusable(el) {
        if (!isElement(el) || hasBlockingInert(el)) return false;
        const tag = (el.tagName || '').toLowerCase();
        const type = (el.getAttribute && (el.getAttribute('type') || '').toLowerCase()) || '';
        const disabled = !!(el.matches && el.matches(':disabled'));
        if (disabled) return false;

        if (tag === 'a') {
            const href = el.getAttribute && el.getAttribute('href');
            if (href && href.trim()) return true;
        }
        if (tag === 'area') {
            // Engine policy: treat <area> as focusable when it's part of a *used* image map.
            const map = getClosestMap(el);
            if (map) {
                const rawName = (map.getAttribute && (map.getAttribute('name') || map.getAttribute('id') || '')).trim();
                if (rawName && document && document.querySelector) {
                    const esc = __cssEscapeSafe;
                    const n = esc(rawName);

                    // Be practical: accept both "#name" and "name", and ignore case.
                    const sels = [
                        `img[usemap="#${n}" i]`,
                        `img[usemap="${n}" i]`
                    ];

                    for (const sel of sels) {
                        try {
                            if (document.querySelector(sel)) return true;
                        } catch {
                        }
                    }
                }
            }
        }
        if (tag === 'input') {
            if (type !== 'hidden') return true;
        }
        if (tag === 'select' || tag === 'textarea' || tag === 'button' || tag === 'summary') return true;
        if (el.hasAttribute && el.hasAttribute('contenteditable')) return true;

        const tabindex = el.getAttribute && el.getAttribute('tabindex');
        if (tabindex != null && String(tabindex).trim() !== '' && !Number.isNaN(Number(tabindex))) return true;

        return false;
    }


    function getIdRefReverseIndex(scopeObj) {
        // Reverse index: id token -> referencing elements (aria-labelledby / aria-describedby)
        // Built once per scope per run. Deterministic: querySelectorAll order is document order.
        if (!scopeObj || !scopeObj.querySelectorAll) return null;

        if (!__idRefReverseIndexByScope) {
            __perfInc('idrefReverseIndex.nocache');
            return null;
        }

        try {
            const cached = __idRefReverseIndexByScope.get(scopeObj);
            if (cached) {
                __perfInc('idrefReverseIndex.hit');
                return cached;
            }
        } catch {
            __perfInc('idrefReverseIndex.nocache');
            return null;
        }

        __perfInc('idrefReverseIndex.miss');

        const idx = new Map();
        let refs = [];
        try {
            refs = Array.from(scopeObj.querySelectorAll('[aria-labelledby],[aria-describedby]'));
        } catch {
            refs = [];
        }

        for (const el of refs) {
            if (!isElement(el)) continue;

            // Parse tokens deterministically
            const lb = trim(getAttr(el, 'aria-labelledby'));
            const db = trim(getAttr(el, 'aria-describedby'));

            // Avoid pushing same element twice for the same token when both attrs contain it.
            const pushed = new Set();

            if (lb) {
                const parts = lb.split(/\s+/).filter(Boolean);
                for (const t of parts) {
                    const tok = trim(t);
                    if (!tok || pushed.has(tok)) continue;
                    pushed.add(tok);
                    const arr = idx.get(tok);
                    if (arr) arr.push(el);
                    else idx.set(tok, [el]);
                }
            }

            if (db) {
                const parts = db.split(/\s+/).filter(Boolean);
                for (const t of parts) {
                    const tok = trim(t);
                    if (!tok || pushed.has(tok)) continue;
                    pushed.add(tok);
                    const arr = idx.get(tok);
                    if (arr) arr.push(el);
                    else idx.set(tok, [el]);
                }
            }
        }

        try {
            __idRefReverseIndexByScope.set(scopeObj, idx);
            __perfInc('idrefReverseIndex.build');
        } catch {
            // ignore cache set errors
        }

        return idx;
    }

    function isReferencedByVisibleIdRef(node) {
        if (!document || !isElement(node)) return false;
        const id = node.getAttribute && node.getAttribute('id');
        const idTok = id && id.trim ? id.trim() : '';
        if (!idTok) return false;

        // Prefer reverse-index lookup (single build per run) over repeated querySelectorAll per node.
        const idx = getIdRefReverseIndex(document);
        if (idx && typeof idx.get === 'function') {
            let refs = null;
            try {
                refs = idx.get(idTok) || null;
            } catch {
                refs = null;
            }
            if (refs && refs.length) {
                for (const ref of refs) {
                    if (!isElement(ref)) continue;
                    const elig = isAccTreeEligible(ref); // safe recursion
                    if (elig && elig.eligible) return true;
                }
                return false;
            }
            // If index exists but no references, short-circuit.
            return false;
        }

        // Fallback to querySelectorAll when cache is unavailable.
        const esc = __cssEscapeSafe;
        const idSel = esc(idTok);
        let refs = [];
        try {
            refs = [
                ...Array.from(document.querySelectorAll('[aria-labelledby~="' + idSel + '"]')),
                ...Array.from(document.querySelectorAll('[aria-describedby~="' + idSel + '"]')),
            ];
        } catch {
            refs = [];
        }
        for (const ref of refs) {
            if (!isElement(ref)) continue;
            const elig = isAccTreeEligible(ref); // safe recursion
            if (elig && elig.eligible) return true;
        }
        return false;
    }


    function isExcluded(el) {
        if (!excludeSelectors.length || !el || !el.closest) return false;
        try {
            return excludeSelectors.some((sel) => !!el.closest(sel));
        } catch {
            return false;
        }
    }

    function queryAll(sel) {
        if (!root) return [];
        try {
            return Array.from(root.querySelectorAll(sel));
        } catch {
            return [];
        }
    }

    function queryAllDeep(sel) {
        if (!root) return [];
        // Performance note:
        // Avoid the old "querySelectorAll('*')" approach which is O(N) per shadow host
        // and explodes on huge DOMs. Instead, walk shadow roots only and run the selector
        // in each root once. This keeps work proportional to the number of shadow roots.
        const results = [];
        const seen = new Set();
        const visitedRoots = new Set();

        const pushMatches = (scope) => {
            if (!scope || !scope.querySelectorAll) return;
            let els = [];
            try {
                els = scope.querySelectorAll(sel);
            } catch {
                els = [];
            }
            // NodeList is iterable; avoid Array.from to reduce allocations.
            for (const el of els) {
                if (el && !seen.has(el) && !isExcluded(el)) {
                    seen.add(el);
                    results.push(el);
                }
            }
        };

        const collectShadowRoots = (scope) => {
            if (!scope || !scope.querySelectorAll) return [];

            // Cache shadow root discovery per root to avoid repeated querySelectorAll('*') walks.
            // IMPORTANT: do not cache when excludeSelectors is non-empty (different helpers may differ).
            if (!excludeSelectors.length && __shadowRootsByRoot) {
                try {
                    const cached = __shadowRootsByRoot.get(scope);
                    if (cached) {
                        __perfInc('shadowRoots.hit');
                        return cached;
                    }
                    __perfInc('shadowRoots.miss');

                    let hosts = [];
                    try {
                        hosts = scope.querySelectorAll('*');
                    } catch {
                        hosts = [];
                    }

                    const roots = [];
                    for (const el of hosts) {
                        if (!el || el.nodeType !== 1) continue;
                        const sr = el.shadowRoot;
                        if (sr) roots.push(sr);
                    }

                    try {
                        __shadowRootsByRoot.set(scope, roots);
                    } catch {
                        __perfInc('shadowRoots.nocache');
                    }
                    return roots;
                } catch {
                    __perfInc('shadowRoots.nocache');
                    // fall through to uncached path
                }
            } else {
                __perfInc('shadowRoots.nocache');
            }

            // Uncached path (preserves excludeSelectors filtering semantics).
            let hosts = [];
            try {
                hosts = scope.querySelectorAll('*');
            } catch {
                hosts = [];
            }
            const roots = [];
            for (const el of hosts) {
                if (!el || el.nodeType !== 1) continue;
                if (isExcluded(el)) continue;
                const sr = el.shadowRoot;
                if (sr) roots.push(sr);
            }
            return roots;
        };

        const q = [root];
        for (let qi = 0; qi < q.length; qi++) {
            const curRoot = q[qi];
            if (!curRoot || visitedRoots.has(curRoot)) continue;
            visitedRoots.add(curRoot);

            pushMatches(curRoot);

            const childShadowRoots = collectShadowRoots(curRoot);
            for (const sr of childShadowRoots) q.push(sr);
        }

        return results;
    }

    function queryAllSmart(sel) {
        const list = includeShadowDom ? queryAllDeep(sel) : queryAll(sel);
        return excludeSelectors.length ? list.filter((el) => !isExcluded(el)) : list;
    }

    // -------------------------------------------------------------------------
    // Per-run shared caches (DOM helpers)
    // -------------------------------------------------------------------------
    try {
        const w =
            realmWindow ||
            (document && document.defaultView) ||
            (typeof global !== 'undefined' && global.window ? global.window : null);

        if (w) {
            if (!w.__a11ycoreSharedCache) w.__a11ycoreSharedCache = {};
            if (!w.__a11ycoreSharedCache.dom) w.__a11ycoreSharedCache.dom = {};
            __domSharedCache = w.__a11ycoreSharedCache.dom;
        }
    } catch {
        __domSharedCache = {};
    }

    // Selector/snippet caches (per element)
    try {
        __selectorCache = __domSharedCache.selectorCache instanceof WeakMap
            ? __domSharedCache.selectorCache
            : (__domSharedCache.selectorCache = new WeakMap());
    } catch {
        __selectorCache = null;
    }

    try {
        __outerHtmlCache = __domSharedCache.outerHtmlCache instanceof WeakMap
            ? __domSharedCache.outerHtmlCache
            : (__domSharedCache.outerHtmlCache = new WeakMap());
    } catch {
        __outerHtmlCache = null;
    }

    // ID lookups: cache getElementById / root.querySelector(#id) results within a run
    try {
        __idLookupDocCache = __domSharedCache.idLookupDocCache instanceof Map
            ? __domSharedCache.idLookupDocCache
            : (__domSharedCache.idLookupDocCache = new Map());
    } catch {
        __idLookupDocCache = null;
    }

    try {
        __idLookupRootCache = __domSharedCache.idLookupRootCache instanceof Map
            ? __domSharedCache.idLookupRootCache
            : (__domSharedCache.idLookupRootCache = new Map());
    } catch {
        __idLookupRootCache = null;
    }

    // IDREF resolution: cache resolveIdRefs results (root-scoped) within a run
    try {
        __idRefCacheByRoot = __domSharedCache.idRefCacheByRoot instanceof WeakMap
            ? __domSharedCache.idRefCacheByRoot
            : (__domSharedCache.idRefCacheByRoot = new WeakMap());
    } catch {
        __idRefCacheByRoot = null;
    }

    // Reverse index for aria-labelledby/aria-describedby -> id token
    try {
        __idRefReverseIndexByScope = __domSharedCache.idRefReverseIndexByScope instanceof WeakMap
            ? __domSharedCache.idRefReverseIndexByScope
            : (__domSharedCache.idRefReverseIndexByScope = new WeakMap());
    } catch {
        __idRefReverseIndexByScope = null;
    }

    // Selector uniqueness index (per scope) within a run
    try {
        __uniqIndexByScope = __domSharedCache.uniqIndexByScope instanceof WeakMap
            ? __domSharedCache.uniqIndexByScope
            : (__domSharedCache.uniqIndexByScope = new WeakMap());
    } catch {
        __uniqIndexByScope = null;
    }

    // Shadow root discovery cache (per root) within a run.
    // Only used when excludeSelectors is empty to avoid cross-helper bleed.
    try {
        __shadowRootsByRoot = __domSharedCache.shadowRootsByRoot instanceof WeakMap
            ? __domSharedCache.shadowRootsByRoot
            : (__domSharedCache.shadowRootsByRoot = new WeakMap());
    } catch {
        __shadowRootsByRoot = null;
    }


// -------------------------------------------------------------------------
// Additional per-run caches (eligibility / focusability / labeling)
// -------------------------------------------------------------------------
    let __ancestorsIncludingSelfCache = null;
    let __eligibilityAccCache = null;
    let __eligibilityDomCacheByMode = null; // Map<string, WeakMap<Element, Result>>
    let __focusabilityCache = null;
    let __computedStyleCacheByScope = null; // WeakMap<object, WeakMap<Element, CSSStyleDeclaration|object>>
    let __openModalDialogsByDoc = null; // WeakMap<Document, Array<Element>>
    let __ancestorBlockerAccByScope = null; // WeakMap<object, WeakMap<Element, {struct:string|null, css:string|null}>>
    let __ancestorBlockerDomByScope = null; // WeakMap<object, WeakMap<Element, {struct, css, cssKnown, visibility, contentVisHidden, opacity}>>
    let __ancestorBlockerDomStructFinalByScope = null; // WeakMap<object, WeakMap<Element, string|null>> (final structural blocker per element per scope)
    let __labelAssociationCache = null;
    let __labelMethodCache = null;
    let __labelForIndexByDoc = null; // WeakMap<Document, Map<string, {exists:boolean, text:string}>> (label[for] by id cache)
    let __accessibleNameCacheByKey = null; // Map<string, WeakMap<Element, Info>>
    let __accessibleDescCacheByKey = null; // Map<string, WeakMap<Element, Info>>

    try {
        __ancestorsIncludingSelfCache = __domSharedCache.ancestorsIncludingSelfCache instanceof WeakMap
            ? __domSharedCache.ancestorsIncludingSelfCache
            : (__domSharedCache.ancestorsIncludingSelfCache = new WeakMap());
    } catch {
        __ancestorsIncludingSelfCache = null;
    }

    try {
        __eligibilityAccCache = __domSharedCache.eligibilityAccCache instanceof WeakMap
            ? __domSharedCache.eligibilityAccCache
            : (__domSharedCache.eligibilityAccCache = new WeakMap());
    } catch {
        __eligibilityAccCache = null;
    }

    try {
        __eligibilityDomCacheByMode = __domSharedCache.eligibilityDomCacheByMode instanceof Map
            ? __domSharedCache.eligibilityDomCacheByMode
            : (__domSharedCache.eligibilityDomCacheByMode = new Map());
    } catch {
        __eligibilityDomCacheByMode = null;
    }

    try {
        __focusabilityCache = __domSharedCache.focusabilityCache instanceof WeakMap
            ? __domSharedCache.focusabilityCache
            : (__domSharedCache.focusabilityCache = new WeakMap());
    } catch {
        __focusabilityCache = null;
    }

    try {
        __computedStyleCacheByScope = __domSharedCache.computedStyleCacheByScope instanceof WeakMap
            ? __domSharedCache.computedStyleCacheByScope
            : (__domSharedCache.computedStyleCacheByScope = new WeakMap());
    } catch {
        __computedStyleCacheByScope = null;
    }


    try {
        __openModalDialogsByDoc = __domSharedCache.openModalDialogsByDoc instanceof WeakMap
            ? __domSharedCache.openModalDialogsByDoc
            : (__domSharedCache.openModalDialogsByDoc = new WeakMap());
    } catch {
        __openModalDialogsByDoc = null;
    }

    try {
        __ancestorBlockerAccByScope = __domSharedCache.ancestorBlockerAccByScope instanceof WeakMap
            ? __domSharedCache.ancestorBlockerAccByScope
            : (__domSharedCache.ancestorBlockerAccByScope = new WeakMap());
    } catch {
        __ancestorBlockerAccByScope = null;
    }

    try {
        __ancestorBlockerDomByScope = __domSharedCache.ancestorBlockerDomByScope instanceof WeakMap
            ? __domSharedCache.ancestorBlockerDomByScope
            : (__domSharedCache.ancestorBlockerDomByScope = new WeakMap());
    } catch {
        __ancestorBlockerDomByScope = null;
    }

    try {
        __ancestorBlockerDomStructFinalByScope = __domSharedCache.ancestorBlockerDomStructFinalByScope instanceof WeakMap
            ? __domSharedCache.ancestorBlockerDomStructFinalByScope
            : (__domSharedCache.ancestorBlockerDomStructFinalByScope = new WeakMap());
    } catch {
        __ancestorBlockerDomStructFinalByScope = null;
    }


    try {
        __labelAssociationCache = __domSharedCache.labelAssociationCache instanceof WeakMap
            ? __domSharedCache.labelAssociationCache
            : (__domSharedCache.labelAssociationCache = new WeakMap());
    } catch {
        __labelAssociationCache = null;
    }

    try {
        __labelMethodCache = __domSharedCache.labelMethodCache instanceof WeakMap
            ? __domSharedCache.labelMethodCache
            : (__domSharedCache.labelMethodCache = new WeakMap());
    } catch {
        __labelMethodCache = null;
    }


    try {
        __labelForIndexByDoc = __domSharedCache.labelForIndexByDoc instanceof WeakMap
            ? __domSharedCache.labelForIndexByDoc
            : (__domSharedCache.labelForIndexByDoc = new WeakMap());
    } catch {
        __labelForIndexByDoc = null;
    }

    try {
        __accessibleNameCacheByKey = __domSharedCache.accessibleNameCacheByKey instanceof Map
            ? __domSharedCache.accessibleNameCacheByKey
            : (__domSharedCache.accessibleNameCacheByKey = new Map());
    } catch {
        __accessibleNameCacheByKey = null;
    }

    try {
        __accessibleDescCacheByKey = __domSharedCache.accessibleDescCacheByKey instanceof Map
            ? __domSharedCache.accessibleDescCacheByKey
            : (__domSharedCache.accessibleDescCacheByKey = new Map());
    } catch {
        __accessibleDescCacheByKey = null;
    }


    function __getScopeObj() {
        const scopeObj =
            (root && typeof root === 'object') ? root :
                (document && typeof document === 'object') ? document :
                    null;
        return scopeObj;
    }


    function __getLabelForByIdCache(nameKey) {
        // Document-scoped cache for `document.querySelector('label[for="..."]')`.
        // Keeps test semantics (first lookup uses querySelector) while eliminating repeated lookups.
        if (!document || !document.querySelector) return null;
        if (!__labelForIndexByDoc) {
            __perfInc('labelForById.nocache');
            return null;
        }

        try {
            const nk = nameKey == null ? '__default__' : String(nameKey);
            let byKey = __labelForIndexByDoc.get(document);
            if (!(byKey instanceof Map)) {
                __perfInc('labelForById.miss');
                byKey = new Map();
                __labelForIndexByDoc.set(document, byKey);
                __perfInc('labelForById.build');
            }
            const existing = byKey.get(nk);
            if (existing && existing instanceof Map) {
                __perfInc('labelForById.hit');
                return existing;
            }
            __perfInc('labelForById.miss');
            const map = new Map();
            byKey.set(nk, map);
            __perfInc('labelForById.build');
            return map;
        } catch {
            __perfInc('labelForById.nocache');
            return null;
        }
    }

    function __lookupLabelForId(id, nameKey) {
        const key = trim(id);
        if (!key) return null;

        const map = __getLabelForByIdCache(nameKey);
        if (map) {
            if (map.has(key)) return map.get(key) || null;
            // compute and store
            let entry = null;
            try {
                const sel = 'label[for="' + key.replace(/\\/g, '\\\\').replace(/"/g, '\\\"') + '"]';
                const label = document.querySelector(sel);
                if (label && isElement(label)) {
                    let t = '';
                    try {
                        t = trim(label.textContent);
                    } catch {
                        t = '';
                    }
                    entry = {exists: true, text: t};
                } else {
                    entry = {exists: false, text: ''};
                }
            } catch {
                entry = {exists: false, text: ''};
            }
            try {
                map.set(key, entry);
            } catch {
            }
            return entry && entry.exists ? entry : null;
        }

        // No cache available: fallback to direct querySelector
        try {
            const sel = 'label[for="' + key.replace(/\\/g, '\\\\').replace(/"/g, '\\\"') + '"]';
            const label = document.querySelector(sel);
            if (label && isElement(label)) {
                let t = '';
                try {
                    t = trim(label.textContent);
                } catch {
                    t = '';
                }
                return {exists: true, text: t};
            }
        } catch {
        }
        return null;
    }

    function __getEligibilityAccCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__domSharedCache) return null;
        try {
            const wmByScope =
                __domSharedCache.eligibilityAccCacheByScope instanceof WeakMap
                    ? __domSharedCache.eligibilityAccCacheByScope
                    : (__domSharedCache.eligibilityAccCacheByScope = new WeakMap());

            let perScope = wmByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                wmByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }

    function __getEligibilityDomCacheForScope(modeKey) {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__domSharedCache) return null;
        try {
            const wmByScope =
                __domSharedCache.eligibilityDomCacheByScope instanceof WeakMap
                    ? __domSharedCache.eligibilityDomCacheByScope
                    : (__domSharedCache.eligibilityDomCacheByScope = new WeakMap());

            let perScopeMap = wmByScope.get(scopeObj);
            if (!(perScopeMap instanceof Map)) {
                perScopeMap = new Map();
                wmByScope.set(scopeObj, perScopeMap);
            }

            let perMode = perScopeMap.get(modeKey);
            if (!(perMode instanceof WeakMap)) {
                perMode = new WeakMap();
                perScopeMap.set(modeKey, perMode);
            }
            return perMode;
        } catch {
            return null;
        }
    }


    function __getAncestorBlockerAccCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__ancestorBlockerAccByScope) return null;
        try {
            let perScope = __ancestorBlockerAccByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                __ancestorBlockerAccByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }

    function __getAncestorBlockerDomCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__ancestorBlockerDomByScope) return null;
        try {
            let perScope = __ancestorBlockerDomByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                __ancestorBlockerDomByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }

    function __getAncestorBlockerDomStructFinalCacheForScope() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__ancestorBlockerDomStructFinalByScope) return null;
        try {
            let perScope = __ancestorBlockerDomStructFinalByScope.get(scopeObj);
            if (!(perScope instanceof WeakMap)) {
                perScope = new WeakMap();
                __ancestorBlockerDomStructFinalByScope.set(scopeObj, perScope);
            }
            return perScope;
        } catch {
            return null;
        }
    }


    function __getDomEligibilityModeKey(opts) {
        const mode = opts && opts.visibilityMode === 'styleAndGeometry' ? 'styleAndGeometry' : 'styleOnly';
        const disableGeometry = !!(opts && opts.disableGeometry === true);
        return mode + '|' + (disableGeometry ? 'dg1' : 'dg0');
    }

    function __getNameOptsKey(opts) {
        // Only include options that affect this helper's output.
        const disallowContents = !!(opts && opts.disallowContents === true);
        const maxRefs = opts && opts.maxRefs != null ? (Number(opts.maxRefs) | 0) : -1;
        return (disallowContents ? 'dc1' : 'dc0') + '|mr' + String(maxRefs);
    }

    function __getDescOptsKey(opts) {
        const allowTitle = !!(opts && opts.allowTitle === true);
        const maxRefs = opts && opts.maxRefs != null ? (Number(opts.maxRefs) | 0) : -1;
        return (allowTitle ? 'at1' : 'at0') + '|mr' + String(maxRefs);
    }

    function getOuterHtmlSnippet(el) {
        if (!el || typeof el !== 'object') return '';
        try {
            if (__outerHtmlCache && __outerHtmlCache.has(el)) {
                __perfInc('outerHtml.hit');
                return __outerHtmlCache.get(el) || '';
            }
        } catch {
        }

        __perfInc('outerHtml.miss');

        let out = '';
        try {
            const html = el.outerHTML || '';
            if (html.length > 2000) out = html.slice(0, 2000) + '…';
            else out = html;
        } catch {
            out = '';
        }

        try {
            if (__outerHtmlCache && el && typeof el === 'object') __outerHtmlCache.set(el, out);
        } catch {
        }
        return out;
    }

// --- Accessibility-tree eligibility (ordered checks) ---
    function isAccTreeEligible(node) {
        // Cache is per-scope (root/document) to avoid cross-run leakage.
        const __accCache = __getEligibilityAccCacheForScope();
        const __ancBlockCache = __getAncestorBlockerAccCacheForScope();

        if (!isElement(node)) {
            return {eligible: false, reasons: ['notElement']};
        }

        try {
            if (__accCache && node && typeof node === 'object' && __accCache.has(node)) {
                const c = __accCache.get(node);
                if (c && typeof c === 'object') {
                    return {
                        eligible: !!c.eligible,
                        reasons: Array.isArray(c.reasons) ? c.reasons.slice(0) : []
                    };
                }
            }
        } catch {
        }

        const reasons = [];

        function __cacheAndReturn(res) {
            const out = {
                eligible: !!(res && res.eligible),
                reasons: (res && Array.isArray(res.reasons)) ? res.reasons.slice(0) : []
            };
            try {
                if (__accCache && node && typeof node === 'object') {
                    __accCache.set(node, {eligible: out.eligible, reasons: out.reasons.slice(0)});
                }
            } catch {
            }
            return out;
        }

        const chain = ancestorsIncludingSelf(node);

        // 1) HTML/DOM hiding
        for (const a of chain) {
            if (!isElement(a)) continue;

            // Ancestor structural blockers are scope-cached (per run) to avoid repeated checks.
            let struct = null;
            try {
                if (__ancBlockCache && __ancBlockCache.has(a)) {
                    __perfInc('ancestorBlockerAcc.struct.hit');
                    const cached = __ancBlockCache.get(a);
                    struct = cached && cached.struct ? String(cached.struct) : null;
                } else {
                    __perfInc('ancestorBlockerAcc.struct.miss');
                    const tn = (a.tagName || '').toLowerCase();
                    if (a.hasAttribute && a.hasAttribute('hidden')) struct = 'hiddenAttr';
                    else if (tn === 'template') struct = 'templateContent';
                    else if (tn === 'script' || tn === 'style' || tn === 'meta' || tn === 'link' || tn === 'noscript') struct = 'nonRenderedElement';
                    else if (tn === 'input') {
                        const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
                        if (t === 'hidden') struct = 'inputHidden';
                    }
                    try {
                        try {
                            if (__ancBlockCache) {
                                const prev = __ancBlockCache.has(a) ? (__ancBlockCache.get(a) || null) : null;
                                __ancBlockCache.set(a, {
                                    struct,
                                    css: prev && prev.css ? prev.css : null,
                                    cssKnown: prev && prev.cssKnown === true ? true : false
                                });
                            }
                        } catch {
                            __perfInc('ancestorBlockerAcc.struct.nocache');
                        }
                    } catch {
                        __perfInc('ancestorBlockerAcc.struct.nocache');
                    }
                }
            } catch { /* ignore */
            }

            if (struct) return __cacheAndReturn({eligible: false, reasons: [struct]});
        }
        if (inClosedDetailsContent(node)) return __cacheAndReturn({eligible: false, reasons: ['detailsClosed']});

        // 2) Inertness / modality
        if (hasBlockingInert(node)) {
            return __cacheAndReturn({eligible: false, reasons: ['inert']});
        }
        // Modal dialog (best effort)
        try {
            const openModals = getOpenModalDialogs();
            if (openModals.length) {
                let inside = false;
                for (const d of openModals) {
                    if (d && d.contains && d.contains(node)) {
                        inside = true;
                        break;
                    }
                }
                if (!inside) return __cacheAndReturn({eligible: false, reasons: ['modalInert']});
            }
        } catch {
        }

        // 3) CSS rendering suppression
        for (const a of chain) {
            if (!isElement(a)) continue;

            // <area> is a non-rendered element; some DOMs report display:none for it.
            // Don’t treat the *area itself* as ineligible based on computed style.
            if (a === node) {
                const tn = (a.tagName || '').toLowerCase();
                if (tn === 'area') continue;
            }

            // Cache ancestor CSS blockers (display/visibility) per scope.
            let cssBlock = null;
            let cssKnown = false;
            try {
                if (__ancBlockCache && __ancBlockCache.has(a)) {
                    const cached = __ancBlockCache.get(a);
                    if (cached && cached.cssKnown === true) {
                        __perfInc('ancestorBlockerAcc.css.hit');
                        cssKnown = true;
                        cssBlock = cached.css ? String(cached.css) : null;
                    } else {
                        __perfInc('ancestorBlockerAcc.css.miss');
                    }
                } else {
                    __perfInc('ancestorBlockerAcc.css.miss');
                }
            } catch {
            }

            if (!cssKnown) {
                const cs = computedStyle(a);
                if (cs && cs.display === 'none') cssBlock = 'displayNone';
                else if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) cssBlock = 'visibilityHidden';

                try {
                    if (__ancBlockCache) {
                        const prev = __ancBlockCache.has(a) ? (__ancBlockCache.get(a) || null) : null;
                        __ancBlockCache.set(a, {
                            struct: prev && prev.struct ? prev.struct : null,
                            css: cssBlock || null,
                            cssKnown: true
                        });
                    }
                } catch {
                    __perfInc('ancestorBlockerAcc.css.nocache');
                }
            }

            if (cssBlock === 'displayNone') return __cacheAndReturn({eligible: false, reasons: ['displayNone']});
            if (cssBlock === 'visibilityHidden') return __cacheAndReturn({
                eligible: false,
                reasons: ['visibilityHidden']
            });
        }

        // 4) ARIA subtree hiding with exceptions with exceptions
        let ariaHidden = false;
        for (const a of chain) {
            if (!isElement(a)) continue;
            const v = a.getAttribute && a.getAttribute('aria-hidden');
            if (v != null && String(v).trim().toLowerCase() === 'true') {
                ariaHidden = true;
                break;
            }
        }
        if (ariaHidden) {
            const idref = isReferencedByVisibleIdRef(node);

            // IDREF exception stays
            if (idref) return __cacheAndReturn({eligible: true, reasons: ['ariaHiddenOverriddenIdref']});

            // Only *explicit* tabbable focus (tabindex >= 0) overrides aria-hidden by default.
            // Native focusability alone does not override aria-hidden EXCEPT for specific
            // mechanisms where the engine must still evaluate (e.g. <area> in a *used* map,
            // and <input type="image">).
            const ti = parseTabIndex(node);
            if (ti.has && ti.valid && ti.value >= 0) {
                return __cacheAndReturn({eligible: true, reasons: ['ariaHiddenOverriddenTabbable']});
            }

            // Programmatic focus (explicit tabindex < 0) does NOT override eligibility.
            if (ti.has && ti.valid && ti.value < 0) {
                return __cacheAndReturn({eligible: false, reasons: ['ariaHiddenProgrammaticFocusExcluded']});
            }

            // Exception: allow aria-hidden override for mechanisms where the engine must
            // still evaluate required labeling/alt rules. Keep this narrowly scoped.
            const tag = (node.tagName || '').toLowerCase();
            const type = tag === 'input'
                ? ((node.getAttribute && (node.getAttribute('type') || '').toLowerCase()) || '')
                : '';

            // Native form controls are tabbable by default (even without tabindex)
            // and are targeted by labeling rules.
            const isNativeFormControl =
                tag === 'select' ||
                tag === 'textarea' ||
                (tag === 'input' && type !== 'hidden'); // includes type=image

            if (tag === 'area' || isNativeFormControl) {
                const f2 = getPlatformFocusability(node);
                if (f2 && f2.tabbable) {
                    return __cacheAndReturn({eligible: true, reasons: ['ariaHiddenOverriddenTabbable']});
                }
            }

            return __cacheAndReturn({eligible: false, reasons: ['ariaHidden']});
        }

        // 5/6 handled implicitly; 7 already covered
        return __cacheAndReturn({eligible: true, reasons});
    }

    function isDomVisibleEligible(node, _ctx, opts) {
        const reasons = [];
        const out = (visible, reasonsArr, metrics) => ({
            eligible: !!visible,
            reasons: reasonsArr.slice(0),
            metrics: metrics && typeof metrics === 'object' ? {...metrics} : {}
        });

        if (!isElement(node)) return out(false, ['notElement'], {});

        const __modeKey = __getDomEligibilityModeKey(opts);
        const __domCache = __getEligibilityDomCacheForScope(__modeKey);

        const __ancBlockDomCache = __getAncestorBlockerDomCacheForScope();
        const __ancBlockStructFinalCache = __getAncestorBlockerDomStructFinalCacheForScope();

        try {
            if (__domCache && node && typeof node === 'object' && __domCache.has(node)) {
                const c = __domCache.get(node);
                if (c && typeof c === 'object') {
                    return {
                        eligible: !!c.eligible,
                        reasons: Array.isArray(c.reasons) ? c.reasons.slice(0) : [],
                        metrics: c.metrics && typeof c.metrics === 'object' ? {...c.metrics} : {}
                    };
                }
            }
        } catch {
        }

        function __cacheAndReturn(res) {
            const outRes = {
                eligible: !!(res && res.eligible),
                reasons: (res && Array.isArray(res.reasons)) ? res.reasons.slice(0) : [],
                metrics: (res && res.metrics && typeof res.metrics === 'object') ? {...res.metrics} : {}
            };
            try {
                if (__domCache && node && typeof node === 'object') {
                    __domCache.set(node, {
                        eligible: outRes.eligible,
                        reasons: outRes.reasons.slice(0),
                        metrics: {...outRes.metrics}
                    });
                }
            } catch {
            }
            return outRes;
        }

        // 1) HTML hiding
        // Final short-circuit: reuse structural blocker result for this node when already known.
        try {
            if (__ancBlockStructFinalCache && __ancBlockStructFinalCache.has(node)) {
                __perfInc('ancestorBlockerDom.structFinal.hit');
                const r = __ancBlockStructFinalCache.get(node);
                const rr = (r != null && r !== '') ? String(r) : null;
                if (rr) return __cacheAndReturn(out(false, [rr], {}));
            } else {
                __perfInc('ancestorBlockerDom.structFinal.miss');
            }
        } catch {
        }

        const chain = ancestorsIncludingSelf(node);
        const __domStructSeen = [];
        for (const a of chain) {
            if (!isElement(a)) continue;

            __domStructSeen.push(a);

            // If an ancestor already has a final structural blocker cached,
            // short-circuit immediately (this is what the test expects).
            try {
                if (__ancBlockStructFinalCache && __ancBlockStructFinalCache.has(a)) {
                    __perfInc('ancestorBlockerDom.structFinal.hit');
                    const r = __ancBlockStructFinalCache.get(a);
                    const rr = (r != null && r !== '') ? String(r) : null;
                    if (rr) {
                        // Propagate to nodes we've seen on this walk (including `node`)
                        try {
                            for (const s of __domStructSeen) {
                                if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, rr);
                            }
                        } catch {
                        }
                        return __cacheAndReturn(out(false, [rr], {}));
                    }
                }
            } catch {
            }

            // Cached structural blockers (per scope) to short-circuit shared ancestor checks.
            let struct = null;
            try {
                if (__ancBlockDomCache && __ancBlockDomCache.has(a)) {
                    __perfInc('ancestorBlockerDom.struct.hit');
                    const cached = __ancBlockDomCache.get(a);
                    struct = cached && cached.struct ? String(cached.struct) : null;
                } else {
                    __perfInc('ancestorBlockerDom.struct.miss');
                    const tn = (a.tagName || '').toLowerCase();
                    if (a.hasAttribute && a.hasAttribute('hidden')) struct = 'hiddenAttr';
                    else if (tn === 'template') struct = 'templateContent';
                    else if (tn === 'script' || tn === 'style' || tn === 'meta' || tn === 'link' || tn === 'noscript') struct = 'nonRenderedElement';
                    else if (tn === 'input') {
                        const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
                        if (t === 'hidden') struct = 'inputHidden';
                    }
                    try {
                        if (__ancBlockDomCache) {
                            const prev = __ancBlockDomCache.has(a) ? (__ancBlockDomCache.get(a) || null) : null;
                            __ancBlockDomCache.set(a, {
                                struct,
                                css: prev && prev.css ? prev.css : null,
                                cssKnown: prev && prev.cssKnown === true ? true : false,
                                visibility: prev && prev.visibility ? prev.visibility : null,
                                contentVisHidden: prev && prev.contentVisHidden === true ? true : null,
                                opacity: prev && typeof prev.opacity === 'number' ? prev.opacity : null
                            });
                        }
                    } catch {
                        __perfInc('ancestorBlockerDom.struct.nocache');
                    }

                }
            } catch {
            }

            if (struct) {
                try {
                    if (__ancBlockStructFinalCache) {
                        for (const s of __domStructSeen) {
                            if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, struct);
                        }
                    }
                } catch {
                }
                return __cacheAndReturn(out(false, [struct], {}));
            }
        }

        try {
            if (__ancBlockStructFinalCache) {
                for (const s of __domStructSeen) {
                    if (!__ancBlockStructFinalCache.has(s)) __ancBlockStructFinalCache.set(s, null);
                }
            }
        } catch {
        }

        // Closed <details> hides content visually
        if (inClosedDetailsContent(node)) return __cacheAndReturn(out(false, ['detailsClosed'], {}));

        // 2) CSS visibility suppression + opacity chain
        let opacityProduct = 1;
        for (const a of chain) {
            if (!isElement(a)) continue;

            let cssBlock = null;
            let cssKnown = false;

            let cachedVisibility = null;
            let cachedContentVisHidden = null;
            let cachedOpacity = null;
            let cs = null;

            try {
                if (__ancBlockDomCache && __ancBlockDomCache.has(a)) {
                    const cached = __ancBlockDomCache.get(a);
                    if (cached) {
                        // cssKnown means "we already computed display/visibility/content-visibility once"
                        if (cached.cssKnown === true) {
                            __perfInc('ancestorBlockerDom.css.hit');
                            cssKnown = true;
                            cssBlock = cached.css ? String(cached.css) : null;
                        } else {
                            __perfInc('ancestorBlockerDom.css.miss');
                        }

                        cachedVisibility = cached.visibility != null ? String(cached.visibility) : null;
                        cachedContentVisHidden = cached.contentVisHidden === true ? true : null;
                        cachedOpacity =
                            (typeof cached.opacity === 'number' && Number.isFinite(cached.opacity))
                                ? cached.opacity
                                : null;
                    }
                } else {
                    __perfInc('ancestorBlockerDom.css.miss');
                }
            } catch {
            }

            // Compute CSS blockers (and maybe opacity) only when needed
            if (!cssKnown && cachedContentVisHidden !== true) {
                cs = computedStyle(a);

                if (cs && cs.display === 'none') cssBlock = 'displayNone';
                else if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) {
                    cssBlock = 'visibilityHidden';
                    cachedVisibility = cs.visibility;
                } else if (cs && cs.contentVisibility === 'hidden') {
                    cssBlock = 'contentVisibilityHidden';
                    cachedContentVisHidden = true;
                }

                // NEW: parse opacity once and cache it (even if cssBlock is null)
                if (cachedOpacity == null) {
                    try {
                        const raw = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
                        const parsed = Number.parseFloat(raw);
                        if (Number.isFinite(parsed)) cachedOpacity = parsed;
                    } catch {
                    }
                }

                try {
                    if (__ancBlockDomCache) {
                        const prev = __ancBlockDomCache.has(a) ? (__ancBlockDomCache.get(a) || null) : null;
                        __ancBlockDomCache.set(a, {
                            struct: prev && prev.struct ? prev.struct : null,
                            css: cssBlock || null,
                            cssKnown: true,
                            visibility: cachedVisibility || (prev && prev.visibility ? prev.visibility : null),
                            contentVisHidden: cachedContentVisHidden === true ? true : (prev && prev.contentVisHidden === true ? true : null),
                            opacity: cachedOpacity == null ? (prev && typeof prev.opacity === 'number' ? prev.opacity : null) : cachedOpacity
                        });
                    }
                } catch {
                    __perfInc('ancestorBlockerDom.css.nocache');
                }
            }

            if (cssBlock === 'displayNone') return __cacheAndReturn(out(false, ['displayNone'], {}));
            if (cssBlock === 'visibilityHidden') {
                return __cacheAndReturn(out(false, ['visibilityHidden'], {visibility: cachedVisibility || 'hidden'}));
            }
            if (cssBlock === 'contentVisibilityHidden') {
                return __cacheAndReturn(out(false, ['contentVisibilityHidden'], {}));
            }

            // If opacity isn't cached yet, compute once and write it back even when cssBlock was cached.
            // This prevents repeated computedStyle(a) calls across many isDomVisibleEligible() invocations.
            if (cachedOpacity == null) {
                try {
                    if (!cs) cs = computedStyle(a);
                    const raw = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
                    const parsed = Number.parseFloat(raw);
                    if (Number.isFinite(parsed)) {
                        cachedOpacity = parsed;

                        // Write back to cache without disturbing other fields
                        try {
                            if (__ancBlockDomCache) {
                                const prev = __ancBlockDomCache.has(a) ? (__ancBlockDomCache.get(a) || null) : null;
                                if (prev) {
                                    __ancBlockDomCache.set(a, {
                                        struct: prev.struct || null,
                                        css: prev.css || null,
                                        visibility: prev.visibility || null,
                                        contentVisHidden: prev.contentVisHidden === true ? true : null,
                                        opacity: cachedOpacity
                                    });
                                } else {
                                    __ancBlockDomCache.set(a, {
                                        struct: null,
                                        css: cssBlock || null,
                                        visibility: cachedVisibility || null,
                                        contentVisHidden: cachedContentVisHidden === true ? true : null,
                                        opacity: cachedOpacity
                                    });
                                }
                            }
                        } catch {}
                    }
                } catch {}
            }

            // opacity handling (visual)
            const op = cachedOpacity != null ? cachedOpacity : 1;
            opacityProduct *= op;
            if (opacityProduct <= 0.0001) {
                return __cacheAndReturn(out(false, ['opacityZero'], { opacity: opacityProduct }));
            }
        }

        // 3) Layout/geometry (optional)
        const visibilityMode =
            opts && opts.visibilityMode === 'styleAndGeometry'
                ? 'styleAndGeometry'
                : 'styleOnly';

        const useGeometry =
            visibilityMode === 'styleAndGeometry' &&
            !(opts && opts.disableGeometry === true);

        if (useGeometry) {
            try {
                if (node.getClientRects) {
                    const rects = node.getClientRects();
                    const rectCount = rects ? rects.length : 0;

                    if (!rectCount) {
                        return __cacheAndReturn(out(false, ['noClientRects'], {rectCount: 0}));
                    }

                    const r = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
                    const w = r && Number.isFinite(r.width) ? r.width : 0;
                    const h = r && Number.isFinite(r.height) ? r.height : 0;

                    if (w <= 0 || h <= 0) {
                        return __cacheAndReturn(out(false, ['zeroArea'], {rectCount, width: w, height: h}));
                    }

                    return __cacheAndReturn(out(true, reasons, {
                        rectCount,
                        width: w,
                        height: h,
                        opacity: opacityProduct
                    }));
                }
            } catch {
                // ignore geometry failures; fall back to style-only eligibility
            }
        }

        return __cacheAndReturn(out(true, reasons, {opacity: opacityProduct}));
    }

    function getEligibilityInfo(node, _ctx, opts) {
        const targetSet = opts && (opts.targetSet === 'acc' || opts.targetSet === 'dom') ? opts.targetSet : 'dom';
        const r = targetSet === 'dom' ? isDomVisibleEligible(node, _ctx, opts) : isAccTreeEligible(node);
        return {
            eligible: !!(r && r.eligible),
            reasons: (r && Array.isArray(r.reasons)) ? r.reasons.slice(0) : [],
            targetSet,
            accEligible: targetSet === 'acc' ? !!(r && r.eligible) : null,
        };
    }

    // E) IDREF helpers
    function resolveIdRefs(idrefString, _ctx, opts) {
        const raw = trim(idrefString);
        if (!raw) return {refs: [], missing: [], flags: ['empty']};

        // Normalize whitespace for stable cache keys
        const parts = raw.split(/\s+/).filter(Boolean);
        const normKey = parts.join(' ');

        // Root-scoped cache map
        let cacheMap = null;
        if (__idRefCacheByRoot) {
            const scopeObj =
                (root && typeof root === 'object') ? root :
                    (document && typeof document === 'object') ? document :
                        null;
            if (scopeObj) {
                try {
                    cacheMap = __idRefCacheByRoot.get(scopeObj) || null;
                    if (!cacheMap) {
                        cacheMap = new Map();
                        __idRefCacheByRoot.set(scopeObj, cacheMap);
                    }
                } catch {
                    cacheMap = null;
                }
            }
        }

        // Cached base result is *untruncated* (opts.maxRefs applied per call)
        if (cacheMap) {
            try {
                const cached = cacheMap.get(normKey);
                if (cached && cached.refs && cached.missing && cached.flags) {
                    const baseRefs = Array.isArray(cached.refs) ? cached.refs.slice(0) : [];
                    const baseMissing = Array.isArray(cached.missing) ? cached.missing.slice(0) : [];
                    const baseFlags = Array.isArray(cached.flags) ? cached.flags.slice(0) : [];

                    // Apply deterministic truncation if requested
                    if (opts && opts.maxRefs && baseRefs.length > opts.maxRefs) {
                        baseRefs.length = Math.max(0, Number(opts.maxRefs) | 0);
                        baseFlags.push('truncated');
                    }

                    __perfInc('idref.resolve.hit');
                    return {refs: baseRefs, missing: baseMissing, flags: baseFlags};
                }
            } catch {
                // cache read errors should never throw
            }
        }

        __perfInc(cacheMap ? 'idref.resolve.miss' : 'idref.resolve.nocache');
        // Compute base result
        const refs = [];
        const missing = [];
        const seen = new Set();

        for (const id of parts) {
            const key = trim(id);
            if (!key) continue;

            let el = safeDocGetById(key);
            if (!el) el = safeRootQueryById(key);

            if (!el || !isElement(el)) {
                missing.push(key);
                continue;
            }
            if (seen.has(el)) continue;
            seen.add(el);
            refs.push(el);
        }

        const flags = [];
        if (missing.length) flags.push('idref-missing');
        if (parts.length !== refs.length + missing.length) flags.push('deduped'); // indicates repeats

        // Store untruncated base result
        if (cacheMap) {
            try {
                cacheMap.set(normKey, {
                    refs: refs.slice(0),
                    missing: missing.slice(0),
                    flags: flags.slice(0),
                    partsLen: parts.length
                });
            } catch {
                // ignore cache write errors
            }
        }

        // Apply deterministic truncation per call
        if (opts && opts.maxRefs && refs.length > opts.maxRefs) {
            refs.length = Math.max(0, Number(opts.maxRefs) | 0);
            flags.push('truncated');
        }

        return {refs, missing, flags};
    }

    function getTextFromIdRefs(idrefString, _ctx, opts) {
        const r = resolveIdRefs(idrefString, _ctx, opts);
        const texts = [];
        for (const el of r.refs) {
            try {
                const t = trim(el.textContent);
                if (t) texts.push(t);
            } catch {
            }
        }
        const text = trim(texts.join(' '));
        const flags = r.flags.slice(0);
        if (!text && r.refs.length) flags.push('resolved-empty-text');
        return {text, refsCount: r.refs.length, missing: r.missing.slice(0), flags};
    }

    function isIdRefEligibleTarget(node) {
        // IDREF policy: include hidden/aria-hidden/collapsed targets,
        // exclude only inertness or non-composed.
        if (!isElement(node)) return {eligible: false, reasons: ['notElement']};

        // NOTE: `root` is not an eligibility boundary for IDREF targets.

        if (hasBlockingInert(node)) return {eligible: false, reasons: ['inert']};

        return {eligible: true, reasons: []};
    }

    function getTextFromIdRefsIdrefEligible(idrefString, _ctx, opts) {
        const r = resolveIdRefs(idrefString, _ctx, opts);

        const texts = [];
        const excluded = []; // [{ id, reasons }]
        for (const el of r.refs) {
            const elig = isIdRefEligibleTarget(el);
            if (!elig.eligible) {
                const id = trim(el.getAttribute && el.getAttribute('id'));
                excluded.push({id: id || null, reasons: elig.reasons.slice(0)});
                continue;
            }
            try {
                const t = trim(el.textContent);
                if (t) texts.push(t);
            } catch {
            }
        }

        const text = trim(texts.join(' '));
        const flags = r.flags.slice(0);
        if (!text && r.refs.length) flags.push('resolved-empty-text');

        if (excluded.length) flags.push('idref-excluded');

        return {
            text,
            refsCount: r.refs.length,
            missing: r.missing.slice(0),
            excluded,
            flags
        };
    }

    // B) Accessible name / description helpers (mechanism-first, but scoped & deterministic)
    function getAccessibleNameInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const key = __getNameOptsKey(opts);
        try {
            if (__accessibleNameCacheByKey && __accessibleNameCacheByKey.has(key)) {
                const wm = __accessibleNameCacheByKey.get(key);
                if (wm && wm instanceof WeakMap && wm.has(el)) {
                    const c = wm.get(el);
                    if (c && typeof c === 'object') {
                        __perfInc('accessibleName.hit');
                        return {
                            present: !!c.present,
                            value: c.value == null ? '' : String(c.value),
                            mechanism: c.mechanism || 'none',
                            flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
                        };
                    }
                }
            }
        } catch {
        }
        __perfInc('accessibleName.miss');

        const aria = getAriaNameInfo(el, _ctx, opts);
        if (aria && aria.present && aria.value) {
            const out = {
                present: true,
                value: aria.value,
                mechanism: aria.mechanism,
                flags: flags.concat(aria.flags || [])
            };
            try {
                if (__accessibleNameCacheByKey) {
                    const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                    if (wm && wm instanceof WeakMap) wm.set(el, {
                        present: !!out.present,
                        value: out.value,
                        mechanism: out.mechanism,
                        flags: out.flags.slice(0)
                    });
                }
            } catch {
            }
            return out;
        }
        if (aria && aria.flags && aria.flags.length) {
            for (const f of aria.flags) flags.push(f);
        }

        // Explicit <label for="..."> or wrapping <label> (common and deterministic for form controls)
        const id = trim(getAttr(el, 'id'));
        if (id) {
            // Prefer indexed lookup (1 build per run) over repeated querySelector per element.
            const entry = __lookupLabelForId(id, key);
            if (entry && entry.exists) {
                const lt = entry.text || '';
                if (lt) {
                    const out = {present: true, value: lt, mechanism: 'label', flags};
                    try {
                        if (__accessibleNameCacheByKey) {
                            const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                            if (wm && wm instanceof WeakMap) wm.set(el, {
                                present: true,
                                value: out.value,
                                mechanism: out.mechanism,
                                flags: out.flags.slice(0)
                            });
                        }
                    } catch {
                    }
                    return out;
                }
                // If label exists but is empty, fall through (matches prior behavior: empty label doesn't produce a name).
            }
        }


        const title = trim(getAttr(el, 'title'));
        if (title) {
            flags.push('title-used');
            const out = {present: true, value: title, mechanism: 'title', flags};
            try {
                if (__accessibleNameCacheByKey) {
                    const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                    if (wm && wm instanceof WeakMap) wm.set(el, {
                        present: true,
                        value: out.value,
                        mechanism: out.mechanism,
                        flags: out.flags.slice(0)
                    });
                }
            } catch {
            }
            return out;
        }

        const out = {present: false, value: '', mechanism: 'none', flags};
        try {
            if (__accessibleNameCacheByKey) {
                const wm = __accessibleNameCacheByKey.get(key) || (__accessibleNameCacheByKey.set(key, new WeakMap()), __accessibleNameCacheByKey.get(key));
                if (wm && wm instanceof WeakMap) wm.set(el, {
                    present: false,
                    value: '',
                    mechanism: 'none',
                    flags: out.flags.slice(0)
                });
            }
        } catch {
        }
        return out;
    }

    function getAccessibleDescriptionInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const key = __getDescOptsKey(opts);
        try {
            if (__accessibleDescCacheByKey && __accessibleDescCacheByKey.has(key)) {
                const wm = __accessibleDescCacheByKey.get(key);
                if (wm && wm instanceof WeakMap && wm.has(el)) {
                    const c = wm.get(el);
                    if (c && typeof c === 'object') {
                        __perfInc('accessibleDesc.hit');
                        return {
                            present: !!c.present,
                            value: c.value == null ? '' : String(c.value),
                            mechanism: c.mechanism || 'none',
                            flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
                        };
                    }
                }
            }
        } catch {
        }
        __perfInc('accessibleDesc.miss');

        const describedBy = trim(getAttr(el, 'aria-describedby'));
        if (describedBy) {
            const t = getTextFromIdRefs(describedBy, _ctx, opts);
            for (const f of t.flags) flags.push(f);
            if (t.text) {
                const out = {present: true, value: t.text, mechanism: 'aria-describedby', flags};
                try {
                    if (__accessibleDescCacheByKey) {
                        const wm = __accessibleDescCacheByKey.get(key) || (__accessibleDescCacheByKey.set(key, new WeakMap()), __accessibleDescCacheByKey.get(key));
                        if (wm && wm instanceof WeakMap) wm.set(el, {
                            present: true,
                            value: out.value,
                            mechanism: out.mechanism,
                            flags: out.flags.slice(0)
                        });
                    }
                } catch {
                }
                return out;
            }
            flags.push('empty');
        }

        const allowTitle = !!(opts && opts.allowTitle === true);
        if (allowTitle) {
            const title = trim(getAttr(el, 'title'));
            if (title) {
                flags.push('title-used');
                const out = {present: true, value: title, mechanism: 'title', flags};
                try {
                    if (__accessibleDescCacheByKey) {
                        const wm = __accessibleDescCacheByKey.get(key) || (__accessibleDescCacheByKey.set(key, new WeakMap()), __accessibleDescCacheByKey.get(key));
                        if (wm && wm instanceof WeakMap) wm.set(el, {
                            present: true,
                            value: out.value,
                            mechanism: out.mechanism,
                            flags: out.flags.slice(0)
                        });
                    }
                } catch {
                }
                return out;
            }
        }

        const out = {present: false, value: '', mechanism: 'none', flags};
        try {
            if (__accessibleDescCacheByKey) {
                const wm = __accessibleDescCacheByKey.get(key) || (__accessibleDescCacheByKey.set(key, new WeakMap()), __accessibleDescCacheByKey.get(key));
                if (wm && wm instanceof WeakMap) wm.set(el, {
                    present: false,
                    value: '',
                    mechanism: 'none',
                    flags: out.flags.slice(0)
                });
            }
        } catch {
        }
        return out;
    }

    // C) Text alternative helper (mechanism-aware by element/type)
    function getTextAlternativeInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) {
            return {
                present: false,
                value: '',
                mechanism: 'unsupported',
                requiredMechanism: 'unknown',
                flags: ['notElement']
            };
        }

        const tag = lower(el.tagName);
        const type = tag === 'input' ? lower(getAttr(el, 'type')) : '';

        const isImageLike =
            tag === 'img' ||
            tag === 'area' ||
            (tag === 'input' && type === 'image');

        if (isImageLike) {
            const altRaw = getAttr(el, 'alt');
            const altPresent = altRaw != null;
            const altText = trim(altRaw);

            if (altPresent) {
                if (!altText) flags.push('alt-empty');
                return {
                    present: true,
                    value: altText,
                    mechanism: 'alt',
                    requiredMechanism: 'alt',
                    flags
                };
            }

            // Missing alt is a real issue even if an accessible name exists.
            const name = getAccessibleNameInfo(el, _ctx, opts);
            if (name && name.present && name.value) flags.push('name-present-but-alt-missing');
            flags.push('alt-missing');

            return {
                present: false,
                value: name && name.present ? (name.value || '') : '',
                mechanism: name && name.present ? 'accessible-name' : 'none',
                requiredMechanism: 'alt',
                flags: flags.concat((name && name.flags) ? name.flags.slice(0) : [])
            };
        }

        if (tag === 'canvas') {
            const fallback = trim(el.textContent || '');
            if (fallback) {
                return {
                    present: true,
                    value: fallback,
                    mechanism: 'canvas-fallback',
                    requiredMechanism: 'fallback-or-name',
                    flags
                };
            }

            const name = getAccessibleNameInfo(el, _ctx, opts);
            if (name && name.present && name.value) {
                return {
                    present: true,
                    value: name.value,
                    mechanism: 'accessible-name',
                    requiredMechanism: 'fallback-or-name',
                    flags: flags.concat(name.flags ? name.flags.slice(0) : [])
                };
            }

            return {
                present: false,
                value: '',
                mechanism: 'none',
                requiredMechanism: 'fallback-or-name',
                flags
            };
        }

        return {
            present: false,
            value: '',
            mechanism: 'unsupported',
            requiredMechanism: 'unknown',
            flags: ['unsupported-element']
        };
    }

    // D) Role + focusability helpers
    function getRoleInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {role: '', source: 'none', flags: ['notElement']};

        const explicit = trim(getAttr(el, 'role'));
        if (explicit) {
            const v = explicit;
            const low = v.toLowerCase();
            if (low === 'presentation' || low === 'none') flags.push('presentation');
            // Minimal sanity: role token should not contain spaces beyond role list; keep deterministic
            if (/\s/.test(v)) flags.push('multiple-roles');
            return {role: v, source: 'explicit', flags};
        }

        const allowImplicit = !(opts && opts.disallowImplicit === true);
        if (!allowImplicit) return {role: '', source: 'none', flags};

        const tag = lower(el.tagName);
        const type = tag === 'input' ? lower(getAttr(el, 'type')) : '';
        const href = tag === 'a' || tag === 'area' ? trim(getAttr(el, 'href')) : '';

        // Minimal implicit mapping (expand later if needed, but keep stable and small).
        let role = '';
        if ((tag === 'a' || tag === 'area') && href) role = 'link';
        else if (tag === 'button') role = 'button';
        else if (tag === 'summary') role = 'button';
        else if (tag === 'input') {
            if (type === 'checkbox') role = 'checkbox';
            else if (type === 'radio') role = 'radio';
            else if (type === 'range') role = 'slider';
            else if (type === 'button' || type === 'submit' || type === 'reset' || type === 'image') role = 'button';
            else if (type !== 'hidden') role = 'textbox';
        } else if (tag === 'select') role = 'combobox';
        else if (tag === 'textarea') role = 'textbox';

        if (role) return {role, source: 'implicit', flags};
        return {role: '', source: 'none', flags};
    }

    function getFocusableInfo(el, _ctx, opts) {
        // Allocation-minimal merge: avoid chained concat() which creates intermediate arrays.
        if (!isElement(el)) return {focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement']};

        const pf = getPlatformFocusability(el); // returns focusable + tabbable + mechanism + flags

        // Merge flags deterministically (stable order: local flags, then pf.flags)
        const outFlags = [];
        // (No local flags today; keep structure for forward compatibility without extra allocations.)
        if (pf && Array.isArray(pf.flags) && pf.flags.length) {
            for (let i = 0; i < pf.flags.length; i++) outFlags.push(pf.flags[i]);
        }

        return {
            focusable: !!(pf && pf.focusable),
            tabbable: !!(pf && pf.tabbable),
            mechanism: (pf && pf.mechanism) || 'none',
            flags: outFlags
        };
    }

    // Back-compat: keep existing helper but implement via new name helper.
    function hasAccessibleName(el) {
        const info = getAccessibleNameInfo(el);
        return !!(info && info.present && trim(info.value));
    }

    function createSelectorUniqIndex() {
        const scope = root && root.querySelectorAll ? root : document;

        const idCount = new Map();
        const testIdCount = new Map(); // data-testid + data-test + data-cy + data-qa
        const nameCount = new Map();   // key: tag|name
        const ariaLabelCount = new Map(); // key: tag|aria-label
        const roleAriaLabelCount = new Map(); // key: role|aria-label

        const sel = '[id],[data-testid],[data-test],[data-cy],[data-qa],[name],[aria-label],[role]';
        const nodes = (typeof queryAllSmart === 'function')
            ? (queryAllSmart(sel) || [])
            : Array.from(scope.querySelectorAll(sel));

        const inc = (map, key) => map.set(key, (map.get(key) || 0) + 1);

        for (const el of nodes) {
            if (!el || el.nodeType !== 1) continue;

            const tag = (el.tagName || '').toLowerCase();

            const id = el.getAttribute('id');
            if (id && id.trim()) inc(idCount, id.trim());

            for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                const v = el.getAttribute(a);
                if (v && v.trim()) inc(testIdCount, a + '=' + v.trim());
            }

            const name = el.getAttribute('name');
            if (name && name.trim() && tag) inc(nameCount, tag + '|' + name.trim());

            const aria = el.getAttribute('aria-label');
            if (aria && aria.trim() && tag) inc(ariaLabelCount, tag + '|' + aria.trim());

            const role = el.getAttribute('role');
            if (role && role.trim() && aria && aria.trim()) {
                inc(roleAriaLabelCount, role.trim() + '|' + aria.trim());
            }
        }

        return {idCount, testIdCount, nameCount, ariaLabelCount, roleAriaLabelCount};
    }

    function buildSimpleSelector(el, fallbackTag) {
        try {
            if (!el || el.nodeType !== 1) return fallbackTag || 'html';

            const tag = (el.tagName || fallbackTag || 'html').toLowerCase();

            const cssEscapeIdent = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {
                }
                return String(s).replace(/[^a-zA-Z0-9\\-_]/g, '\\$&');
            };

            const escapeAttrValue = __escapeAttrValue;

            const id = el.getAttribute && el.getAttribute('id');
            if (id && id.trim()) return '#' + cssEscapeIdent(id.trim());

            for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                const v = el.getAttribute && el.getAttribute(a);
                if (v && v.trim()) return '[' + a + '="' + escapeAttrValue(v.trim()) + '"]';
            }

            const name = el.getAttribute && el.getAttribute('name');
            if (name && name.trim()) return tag + '[name="' + escapeAttrValue(name.trim()) + '"]';

            return tag;
        } catch {
            return fallbackTag || 'html';
        }
    }

    function getUniqIndex() {
        const scopeObj = __getScopeObj();
        if (!scopeObj || !__uniqIndexByScope) {
            __perfInc('uniqIndex.nocache');
            // Fallback: build per call (should be rare; determinism preserved)
            return createSelectorUniqIndex();
        }

        const cached = __uniqIndexByScope.get(scopeObj);
        if (cached) {
            __perfInc('uniqIndex.hit');
            return cached;
        }

        __perfInc('uniqIndex.miss');
        const idx = createSelectorUniqIndex();
        try {
            __uniqIndexByScope.set(scopeObj, idx);
        } catch { /* ignore */
        }
        __perfInc('uniqIndex.build');
        return idx;
    }

    function buildSelectorUncached(el) {
        const escapeAttrValue = __escapeAttrValue;
        try {
            if (!el || el.nodeType !== 1) return 'html';

            const cssEscape = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {
                }
                return String(s).replace(/[^a-zA-Z0-9\\-_]/g, '\\$&');
            };

            const idx = getUniqIndex();
            const tag = (el.tagName || '').toLowerCase();

            const uniqueIdSel = () => {
                const id = el.getAttribute('id');
                if (!id || !id.trim()) return null;
                const v = id.trim();
                if (idx && (idx.idCount.get(v) || 0) === 1) return '#' + cssEscape(v);
                return null;
            };

            const uniqueTestSel = () => {
                for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                    const v = el.getAttribute(a);
                    if (!v || !v.trim()) continue;
                    const key = a + '=' + v.trim();
                    if (idx && (idx.testIdCount.get(key) || 0) === 1) {
                        return '[' + a + '="' + escapeAttrValue(v.trim()) + '"]';
                    }
                }
                return null;
            };

            const uniqueNameSel = () => {
                const v = el.getAttribute('name');
                if (!v || !v.trim() || !tag) return null;
                const key = tag + '|' + v.trim();
                if (idx && (idx.nameCount.get(key) || 0) === 1) return tag + '[name="' + escapeAttrValue(v.trim()) + '"]';
                return null;
            };

            const uniqueAriaSel = () => {
                const v = el.getAttribute('aria-label');
                if (!v || !v.trim() || !tag) return null;
                const key = tag + '|' + v.trim();
                if (idx && (idx.ariaLabelCount.get(key) || 0) === 1) return tag + '[aria-label="' + escapeAttrValue(v.trim()) + '"]';
                return null;
            };

            const uniqueRoleAriaSel = () => {
                const role = el.getAttribute('role');
                const aria = el.getAttribute('aria-label');
                if (!role || !role.trim() || !aria || !aria.trim()) return null;
                const key = role.trim() + '|' + aria.trim();
                if (idx && (idx.roleAriaLabelCount.get(key) || 0) === 1) {
                    return '[role="' + escapeAttrValue(role.trim()) + '"][aria-label="' + escapeAttrValue(aria.trim()) + '"]';
                }
                return null;
            };

            const direct =
                uniqueIdSel() ||
                uniqueTestSel() ||
                uniqueRoleAriaSel() ||
                uniqueNameSel() ||
                uniqueAriaSel();

            if (direct) return direct;

            const parts = [];

            function nthOfType(node) {
                const t = (node.tagName || '').toLowerCase() || '*';
                const p = node.parentElement;
                if (!p) return t;

                let i = 1;
                let sib = node.previousElementSibling;
                while (sib) {
                    if ((sib.tagName || '').toLowerCase() === t) i++;
                    sib = sib.previousElementSibling;
                }

                let hasSame = false;
                sib = node.nextElementSibling;
                while (sib) {
                    if ((sib.tagName || '').toLowerCase() === t) {
                        hasSame = true;
                        break;
                    }
                    sib = sib.nextElementSibling;
                }
                if (!hasSame) {
                    sib = node.nextElementSibling;
                    while (sib) {
                        if ((sib.tagName || '').toLowerCase() === t) {
                            hasSame = true;
                            break;
                        }
                        sib = sib.previousElementSibling;
                    }
                }
                return hasSame ? t + ':nth-of-type(' + i + ')' : t;
            }

            let node = el;
            let safety = 0;

            while (node && node.nodeType === 1 && safety++ < 20) {
                let anchor = null;

                if (node !== el) {
                    const t = (node.tagName || '').toLowerCase();
                    const id = node.getAttribute('id');
                    if (id && id.trim() && idx && (idx.idCount.get(id.trim()) || 0) === 1) anchor = '#' + cssEscape(id.trim());
                    if (!anchor) {
                        for (const a of ['data-testid', 'data-test', 'data-cy', 'data-qa']) {
                            const v = node.getAttribute(a);
                            if (v && v.trim() && idx && (idx.testIdCount.get(a + '=' + v.trim()) || 0) === 1) {
                                anchor = '[' + a + '="' + escapeAttrValue(v.trim()) + '"]';
                                break;
                            }
                        }
                    }
                    if (!anchor) {
                        const name = node.getAttribute('name');
                        if (name && name.trim() && t && idx && (idx.nameCount.get(t + '|' + name.trim()) || 0) === 1) {
                            anchor = t + '[name="' + escapeAttrValue(name.trim()) + '"]';
                        }
                    }
                    if (!anchor) {
                        const aria = node.getAttribute('aria-label');
                        if (aria && aria.trim() && t && idx && (idx.ariaLabelCount.get(t + '|' + aria.trim()) || 0) === 1) {
                            anchor = t + '[aria-label="' + escapeAttrValue(aria.trim()) + '"]';
                        }
                    }
                }

                if (node === el) {
                    parts.unshift(nthOfType(node));
                } else if (anchor) {
                    parts.unshift(anchor);
                    break;
                } else {
                    parts.unshift(nthOfType(node));
                }

                if (!node.parentElement || node === root) break;
                node = node.parentElement;
            }

            const candidate = parts.join(' > ') || (tag || 'html');

            try {
                const scope = root && root.querySelectorAll ? root : document;
                const matches = scope.querySelectorAll(candidate);
                if (matches && matches.length === 1 && matches[0] === el) return candidate;
            } catch {
            }

            return buildSimpleSelector(el, tag || 'html');
        } catch {
            return 'html';
        }
    }

    function buildSelector(el) {
        try {
            if (__selectorCache && el && typeof el === 'object' && __selectorCache.has(el)) {
                __perfInc('selector.hit');
                return __selectorCache.get(el) || 'html';
            }
        } catch {
        }
        __perfInc('selector.miss');
        const sel = buildSelectorUncached(el);
        try {
            if (__selectorCache && el && typeof el === 'object') __selectorCache.set(el, sel);
        } catch {
        }
        return sel;
    }

    function getNonEmptyTitle(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'title');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch {
            return null;
        }
    }

    function getNonEmptyPlaceholder(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'placeholder');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch {
            return null;
        }
    }

    function hasLabelAssociation(el) {
        // Deterministic, stable subset:
        // - <label for="id">
        // - wrapping <label> ... <input> ...
        if (!isElement(el)) return false;

        try {
            if (__labelAssociationCache && el && typeof el === 'object' && __labelAssociationCache.has(el)) {
                __perfInc('labelAssociation.hit');
                return !!__labelAssociationCache.get(el);
            }
        } catch {
        }

        __perfInc('labelAssociation.miss');
        let out = false;

        const id = trim(getAttr(el, 'id'));
        if (id) {
            const entry = __lookupLabelForId(id, '__default__');
            if (entry && entry.exists) {
                out = true;
            }
        }

        if (!out && el.closest) {
            try {
                const wrap = el.closest('label');
                if (wrap && isElement(wrap)) out = true;
            } catch {
            }
        }

        try {
            if (__labelAssociationCache && el && typeof el === 'object') __labelAssociationCache.set(el, !!out);
        } catch {
        }

        return out;
    }

    function getLabelMethod(el, _ctx, opts) {
        // returns { method, value } where value is best-effort text, deterministically trimmed
        if (!isElement(el)) return {method: 'none', value: null};

        try {
            if (__labelMethodCache && el && typeof el === 'object' && __labelMethodCache.has(el)) {
                __perfInc('labelMethod.hit');
                const c = __labelMethodCache.get(el);
                if (c && typeof c === 'object') {
                    return {method: c.method || 'none', value: c.value == null ? null : String(c.value)};
                }
            }
        } catch {
        }

        __perfInc('labelMethod.miss');
        let out = {method: 'none', value: null};

        if (hasLabelAssociation(el)) out = {method: 'label', value: null};
        else if (getAriaLabelledByInfo) {
            try {
                const info = getAriaLabelledByInfo(el, _ctx, {maxRefs: 8});
                const v = info && info.present ? trim(info.value) : '';
                if (v) out = {method: 'aria-labelledby', value: v};
            } catch {
            }
        }

        if (out.method === 'none' && getAriaLabelInfo) {
            try {
                const info = getAriaLabelInfo(el);
                const v = info && info.present ? trim(info.value) : '';
                if (v) out = {method: 'aria-label', value: v};
            } catch {
            }
        }

        if (out.method === 'none') {
            const titleV = getNonEmptyTitle(el);
            if (titleV) out = {method: 'title', value: titleV};
        }

        if (out.method === 'none') {
            const phV = getNonEmptyPlaceholder(el);
            if (phV) out = {method: 'placeholder', value: phV};
        }

        try {
            if (__labelMethodCache && el && typeof el === 'object') {
                __labelMethodCache.set(el, {method: out.method, value: out.value});
            }
        } catch {
        }

        return out;
    }

    function getLabelStrength(method) {
        // policy choice; this is deterministic and tweakable
        if (method === 'label' || method === 'aria-labelledby') return 'strong';
        if (method === 'aria-label') return 'medium';
        if (method === 'title' || method === 'placeholder') return 'weak';
        return 'none';
    }

    function reportOccurrence(node, partial) {
        const o = (partial && typeof partial === 'object' && !Array.isArray(partial)) ? { ...partial } : {};
        // Attach the node for engine-side finalization. This must be removed later before returning results.
        o.__node = node || null;
        return o;
    }

    let __contrastSharedCache = {};
    try {
        // In Node/JSDOM tests, the harness sets global.window/global.document.
        // The engine may instantiate helpers per rule without passing opts.window,
        // so we must be able to recover the stable realm window to share caches.
        const w =
            realmWindow ||
            (document && document.defaultView) ||
            (typeof global !== 'undefined' && global.window ? global.window : null);

        if (w) {
            if (!w.__a11ycoreSharedCache) w.__a11ycoreSharedCache = {};
            if (!w.__a11ycoreSharedCache.contrast) w.__a11ycoreSharedCache.contrast = {};
            __contrastSharedCache = w.__a11ycoreSharedCache.contrast;
        }
    } catch {
        __contrastSharedCache = {};
    }

    const __contrastShared = {
        trim,
        computedStyle,
        composedParent,
        buildSimpleSelector,
        __contrastSharedCache
    };

    const contrast = createContrastHelpers(
        {window: realmWindow || window, document, root},
        __contrastShared
    );

    // Expose shared cache to rules (deterministic, in-memory only)
    contrast.sharedCache = __contrastShared.__contrastSharedCache;

    return {
        // Existing query/snippet utilities
        queryAll,
        queryAllDeep,
        queryAllSmart,
        getOuterHtmlSnippet,
        buildSimpleSelector,
        buildSelector,

        // Existing (back-compat)
        hasAccessibleName,
        isExcluded,
        isAccTreeEligible,
        isDomVisibleEligible,

        // Eligibility info wrapper
        getEligibilityInfo,

        // IDREF primitives
        resolveIdRefs,
        getTextFromIdRefs,
        getTextFromIdRefsIdrefEligible,

        // ARIA-only name primitives (new)
        getAriaLabelInfo,
        getAriaLabelledByInfo,
        getAriaNameInfo,

        // Name / description
        getAccessibleNameInfo,
        getAccessibleDescriptionInfo,

        // Text alternatives
        getTextAlternativeInfo,

        // Role / focusability
        getRoleInfo,
        getFocusableInfo,

        getAttributeInfo,

        getLabelMethod, getLabelStrength,

        // Perf counters (only populated when opts.perfStats === true)
        getPerfStats,
        resetPerfStats,

        reportOccurrence,

        contrast
    };
}

module.exports = {
    normalizeSelectorList,
    createDomHelpers
};
