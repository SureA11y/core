'use strict';

/**
 * DOM helpers used by checks (ctx.helpers).
 *
 * Kernel philosophy (A11yCore helpers contract)
 * ---------------------------------------------
 * These helpers exist to keep checks:
 * - **Atomic** (checks decide outcomes; helpers provide facts),
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
const {createAriaHelpers} = require('./aria-helpers');

function normalizeSelectorList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof value === 'string') {
        // allow "#a,#b" or "#a, #b"
        return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
}

/**
 * Resolves a raw contextSelector (string | string[] | null) to the
 * normalized selector value (`ctxSelector`) plus the actual root elements to
 * scan (`roots`, deduped, in resolution order), falling back to
 * documentElement/body/html when nothing matches. Extracted out of
 * dom-runner.js's runCore so frame-scan.js can discover which child
 * <iframe>/<frame> elements fall within the same scan scope, without
 * duplicating this resolution logic a second time.
 */
function resolveContextRoots(document, contextSelector) {
    const ctxSelector =
        Array.isArray(contextSelector)
            ? (() => {
                const list = contextSelector
                    .map((s) => (typeof s === 'string' ? s.trim() : ''))
                    .filter(Boolean);
                return list.length ? list : null;
            })()
            : (typeof contextSelector === 'string' && contextSelector.trim())
                ? contextSelector.trim()
                : null;

    let roots = [];
    {
        const selectorList = Array.isArray(ctxSelector) ? ctxSelector : (ctxSelector ? [ctxSelector] : []);
        const seen = new Set();
        for (const sel of selectorList) {
            let matches = [];
            try {
                matches = document.querySelectorAll(sel);
            } catch {
                matches = [];
            }
            for (const el of matches) {
                if (el && !seen.has(el)) {
                    seen.add(el);
                    roots.push(el);
                }
            }
        }
    }
    if (!roots.length) {
        const fallback =
            document.documentElement ||
            document.body ||
            document.querySelector('html');
        if (fallback) roots = [fallback];
    }

    return { ctxSelector, roots };
}

function createDomHelpers(opts) {
    const document = opts && opts.document ? opts.document : null;
    const window = opts && opts.window ? opts.window : null;
    // Some engine paths may not pass opts.window; recover it from document when possible.
    const realmWindow =
        window ||
        (document && document.defaultView) ||
        null;
    // opts.root accepts either a single element (back-compat -- every
    // existing call site, including every test, passes one) or an array of
    // elements (multi-region contextSelector support, dom-runner.js). Every
    // internal consumer below works off `roots` (always an array, possibly
    // empty) rather than assuming a single element.
    const roots = (() => {
        const r = opts && opts.root;
        if (Array.isArray(r)) return r.filter((x) => x && typeof x === 'object');
        if (r && typeof r === 'object') return [r];
        return [];
    })();
    // Default on: opt OUT with `includeShadowDom: false`, not opt in.
    const includeShadowDom = !(opts && opts.includeShadowDom === false);
    // Default off: by default, helper queries skip structurally/CSS-hidden
    // subtrees (display:none, [hidden], closed <details>, etc.). Callers can
    // opt out with includeHiddenElements:true.
    const includeHiddenElements = !!(opts && opts.includeHiddenElements === true);
    const excludeSelectors = Array.isArray(opts && opts.excludeSelectors) ? opts.excludeSelectors : [];
    // Default off: explicit opt-in for "this scan target was never meant to
    // represent a real page" (e.g. a raw component fragment parsed on its
    // own), regardless of whether document.documentElement happens to be in
    // scope. See isWholeDocumentScope() below.
    const fragment = !!(opts && opts.fragment === true);

    // Rule-scoped excludes (engineOptions.rules[ruleId].excludeSelectors), set
    // by dom-runner.js immediately before invoking each rule's applicability/
    // run function via __setActiveRuleExcludeSelectors(). Safe as mutable
    // closure state because rule execution is synchronous and single-rule-
    // at-a-time: exactly one rule's excludes are ever "active" at once.
    var __activeRuleExcludeSelectors = [];

    function __getEffectiveExcludeSelectors() {
        return __activeRuleExcludeSelectors.length
            ? excludeSelectors.concat(__activeRuleExcludeSelectors)
            : excludeSelectors;
    }

    function __setActiveRuleExcludeSelectors(list) {
        __activeRuleExcludeSelectors = normalizeSelectorList(list);
    }

    // Selector-related caches (selector uniqueness index, per-element built
    // selector strings) depend on includeShadowDom/the effective exclude
    // list, since those change which elements are considered when checking
    // uniqueness. The underlying storage is shared across createDomHelpers()
    // calls on the same window/document (see __domSharedCache below), so a
    // run -- or a rule with its own rule-scoped excludes -- must not
    // read/write another run/rule's cached selectors. This key partitions
    // those caches per effective option set; recomputed per call (not a
    // constant) since the effective list changes as the active rule changes.
    function __getSelectorOptsKey() {
        return (includeShadowDom ? 'sd1' : 'sd0') + '|' + __getEffectiveExcludeSelectors().slice().sort().join(',');
    }

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

    // Shared recursion-depth guard across the mutually-recursive naming
    // functions (computeIdRefTargetTextAlternative <-> getContentNameInfo <->
    // getAccessibleNameInfo, via aria-labelledby targets that themselves
    // contain elements with their own aria-labelledby). Each per-call
    // `visited` Set only guards against cycles *within* a single top-level
    // getTextFromIdRefs() invocation; a cross-function hop (e.g. resolving a
    // labelledby target's content, which contains a descendant with its own
    // aria-labelledby) starts a *fresh* visited Set and would defeat that
    // guard on a genuine circular reference. This counter bounds the total
    // combined call depth regardless of which function is on the stack.
    var __nameComputationDepth = 0;
    var __NAME_COMPUTATION_MAX_DEPTH = 40;

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
    // Spec-accurate CSS.escape() fallback (CSSOM "serialize an identifier"
    // algorithm) for environments without a native window.CSS.escape — this
    // is jsdom's actual situation (confirmed: window.CSS.escape is
    // undefined there), so this fallback is not a rare edge case, it's the
    // one actually exercised on every selector this engine ever builds.
    // The previous fallback (a flat "escape any disallowed character"
    // regex) didn't handle CSS identifiers that START with a digit or a
    // hyphen+digit — a real pattern on real sites (UUID-style element IDs,
    // e.g. Nike's homepage: id="13cbc70d-ca70-4938-9150-5abddc780c24").
    // An unescaped leading digit makes the resulting selector fragment
    // (e.g. "#13cbc70d-...") invalid CSS, which made buildSelectorUncached's
    // own el.matches(candidate) verification throw (silently caught),
    // degrading the selector to buildSimpleSelector's bare-tag-name
    // fallback — losing all positional/uniqueness information for every
    // element anchored under that ancestor.
    function __cssEscapeIdentFallback(value) {
        const string = String(value);
        const length = string.length;
        const firstCodeUnit = string.charCodeAt(0);
        if (length === 1 && firstCodeUnit === 0x002d) return '\\' + string;
        let result = '';
        for (let index = 0; index < length; index++) {
            const codeUnit = string.charCodeAt(index);
            if (codeUnit === 0x0000) {
                result += '\uFFFD';
                continue;
            }
            if (
                (codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
                codeUnit === 0x007f ||
                (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
                (index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002d)
            ) {
                result += '\\' + codeUnit.toString(16) + ' ';
                continue;
            }
            if (
                codeUnit >= 0x0080 ||
                codeUnit === 0x002d ||
                codeUnit === 0x005f ||
                (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
                (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
                (codeUnit >= 0x0061 && codeUnit <= 0x007a)
            ) {
                result += string.charAt(index);
                continue;
            }
            result += '\\' + string.charAt(index);
        }
        return result;
    }
    const __cssEscapeIdent = (s) => {
        try {
            if (__w && __w.CSS && typeof __w.CSS.escape === 'function') return __w.CSS.escape(String(s));
        } catch {
        }
        return __cssEscapeIdentFallback(s);
    };
    const __escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');


    // --- eligibility utilities ---
    const isElement = (n) => !!n && n.nodeType === 1;
    const computedStyle = (el) => {
        // Per-run memoization scoped by *helper scope* (root/document), to ensure
        // style caching does not bleed across helper instances with different roots.
        // This aligns with eligibility cache scoping semantics locked by checks.
        const scope = __getScopeObj();

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

    // Flat-tree (composed) parent: a distributed/slotted node's real rendered
    // parent is the <slot> it's assigned to, NOT its own light-DOM parentNode
    // (parentNode is unaffected by slot assignment and stays truthy for any
    // normally-connected slotted element — checking it first, as an earlier
    // version of this helper did, means the assignedSlot branch never fires
    // for the common case of a real, connected slotted child, silently
    // treating it as if it rendered under its light-DOM parent instead of
    // the shadow-tree container it's actually distributed into). assignedSlot
    // must be checked first; parentNode only applies to nodes that aren't
    // currently distributed through a slot. Once climbing reaches a
    // ShadowRoot itself (parentNode is null there), `.host` is the shadow
    // host element directly — NOT `getRootNode({composed:true})`, which
    // resolves all the way to the top-level document, skipping past the
    // immediate shadow boundary this function is trying to climb out of one
    // level at a time.
    const composedParent = (n) => {
        if (!n) return null;
        if (n.assignedSlot) return n.assignedSlot;
        if (n.parentNode) return n.parentNode;
        return n.host || null;
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

    // --- ARIA name primitives (reusable across checks) ---
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

    // Landmark-role naming (nav/main/region/banner/contentinfo/etc.): these roles don't derive
    // a name from content (unlike a button/link), so per the accname spec their only sources are
    // aria-label, aria-labelledby, then a title-attribute fallback. Was duplicated ad hoc across 7
    // landmark rule files (landmark-unique, landmark-no-duplicate-banner/-contentinfo,
    // landmark-banner/-main/-contentinfo-is-top-level, region), each its own local
    // getAccessibleLandmarkName -- some using getAriaLabelledByInfo's target-name resolution,
    // others a raw ref.textContent copy predating that fix, and NONE checking title at all.
    // Confirmed via a real page (2026-07-22, live-DOM corpus): DuckDuckGo's homepage has two
    // <nav>s distinguished only by title="navigation" on one of them -- a widely-used reference
    // engine's landmark-unique correctly treats them as uniquely named (verified directly against
    // that engine's own runtime, not assumed), while every one of the 7 local copies saw both as unnamed and flagged a false
    // duplicate. One shared, correct implementation replaces all 7 copies.
    function getLandmarkNameInfo(el, ctx) {
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        const aria = getAriaNameInfo(el, ctx);
        if (aria.present && aria.value) return aria;

        const title = trim(getAttr(el, 'title'));
        if (title) return {present: true, value: title, mechanism: 'title', flags: (aria.flags || [])};

        return {present: false, value: '', mechanism: 'none', flags: (aria.flags || []).concat(title === '' && getAttr(el, 'title') != null ? ['title-empty'] : [])};
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
        // With multi-region contextSelector, tries each root in turn and
        // returns the first match -- IDs are meant to be document-unique
        // anyway, so at most one root should ever actually contain it.
        const key = trim(id);
        if (!key) return null;
        if (!roots.length) return null;

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
        for (const r of roots) {
            if (!r || !r.querySelector) continue;
            try {
                el = r.querySelector('#' + key);
            } catch {
                el = null;
            }
            if (el) break;
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
        if (el.hasAttribute && el.hasAttribute('contenteditable')) {
            // contenteditable="false" explicitly disables the editing host
            // and does not by itself add the element to the tab order.
            const ceVal = lower(getAttr(el, 'contenteditable'));
            if (ceVal !== 'false') return true;
        }

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
        const eff = __getEffectiveExcludeSelectors();
        if (!eff.length || !el || !el.closest) return false;
        try {
            return eff.some((sel) => !!el.closest(sel));
        } catch {
            return false;
        }
    }

    function queryAll(sel) {
        if (!roots.length) return [];
        const out = [];
        const seen = new Set();
        // Per root: self-match first (matching the original single-root
        // ordering), then descendants, deduped across all roots -- matters
        // when multiple contextSelector regions overlap/nest, so an element
        // reachable from more than one root is only ever reported once.
        for (const r of roots) {
            if (!r) continue;
            // querySelectorAll never returns its own context node, only
            // descendants — so an attribute/role selector can never match
            // `r` itself this way. In the default (unscoped) case `r` is
            // `document.documentElement` (the <html> element), meaning every
            // rule using this helper was structurally blind to an issue
            // asserted directly on <html> (e.g. `<html role="...">`,
            // `[lang]`, any `[aria-*]`) — not a narrow, rule-specific gap.
            // Found via a real page: news24.com's South Africa homepage,
            // `<html role="document">`, which a widely-used reference engine correctly flags but
            // this engine's aria-allowed-role couldn't reach at all, no
            // matter how correct its ALLOWED_ROLES_BY_ELEMENT entry was.
            if (r.nodeType === 1 && typeof r.matches === 'function' && !seen.has(r)) {
                try {
                    if (r.matches(sel)) {
                        seen.add(r);
                        out.push(r);
                    }
                } catch {
                }
            }
            try {
                const list = r.querySelectorAll(sel);
                for (const el of list) {
                    if (el && !seen.has(el)) {
                        seen.add(el);
                        out.push(el);
                    }
                }
            } catch {
                // skip this root, keep results from the others
            }
        }
        return out;
    }

    function queryAllDeep(sel) {
        if (!roots.length) return [];
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
            // Same root-self-match gap as queryAll above: querySelectorAll
            // never returns `scope` itself, so a shadow-root host element
            // (or the top-level <html> root) matching `sel` directly would
            // otherwise be invisible here too.
            if (scope.nodeType === 1 && typeof scope.matches === 'function' && !seen.has(scope) && !isExcluded(scope)) {
                try {
                    if (scope.matches(sel)) {
                        seen.add(scope);
                        results.push(scope);
                    }
                } catch {
                }
            }
        };

        const collectShadowRoots = (scope) => {
            if (!scope || !scope.querySelectorAll) return [];

            // Cache shadow root discovery per root to avoid repeated querySelectorAll('*') walks.
            // IMPORTANT: do not cache when the effective exclude list (global
            // ∪ active rule-scoped excludes) is non-empty -- different rules
            // may have different effective lists and must not share results.
            if (!__getEffectiveExcludeSelectors().length && __shadowRootsByRoot) {
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

        // Seed the BFS queue with every resolved context root (not just one)
        // -- the existing shadow-root discovery loop below already
        // generalizes to multiple starting points without further changes,
        // since it was already a growing queue, not a single fixed root.
        const q = roots.slice();
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

    const HARD_HIDDEN_REASONS = new Set([
        'displayNone',
        'hiddenAttr',
        'detailsClosed',
        'templateContent',
        'nonRenderedElement',
        'inputHidden',
        'visibilityHidden',
        'contentVisibilityHidden'
    ]);

    function queryAllSmart(sel) {
        let list = includeShadowDom ? queryAllDeep(sel) : queryAll(sel);

        // Global hidden-content policy: skip nodes that are fully excluded from
        // rendered visibility by default (unless includeHiddenElements:true).
        if (!includeHiddenElements) {
            list = list.filter((el) => {
                try {
                    const vis = isAccTreeEligible(el);
                    if (!vis || vis.eligible !== false) return true;
                    const reasons = Array.isArray(vis.reasons) ? vis.reasons : [];
                    for (const r of reasons) {
                        if (HARD_HIDDEN_REASONS.has(r)) return false;
                    }

                    // `isAccTreeEligible` can short-circuit on an inert ancestor
                    // before it reaches an outer hard-hidden ancestor (e.g.
                    // display:none wrapper). In that case the node is still
                    // structurally hidden and should be excluded by the default
                    // hidden-content policy.
                    if (reasons.includes('inert')) {
                        const domVis = isDomVisibleEligible(el, null, {
                            visibilityMode: 'styleOnly',
                            disableGeometry: true,
                            ignoreOpacity: true
                        });
                        const domReasons = Array.isArray(domVis && domVis.reasons) ? domVis.reasons : [];
                        for (const r of domReasons) {
                            if (HARD_HIDDEN_REASONS.has(r)) return false;
                        }
                    }
                    return true;
                } catch {
                    return true;
                }
            });
        }

        return __getEffectiveExcludeSelectors().length ? list.filter((el) => !isExcluded(el)) : list;
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

    // Selector cache (per element), partitioned by __selectorOptsKey since
    // built selectors depend on includeShadowDom/excludeSelectors.
    try {
        __selectorCache = __domSharedCache.selectorCache instanceof Map
            ? __domSharedCache.selectorCache
            : (__domSharedCache.selectorCache = new Map());
    } catch {
        __selectorCache = null;
    }

    function __getSelectorCacheForOpts() {
        if (!__selectorCache) return null;
        try {
            const key = __getSelectorOptsKey();
            let wm = __selectorCache.get(key);
            if (!(wm instanceof WeakMap)) {
                wm = new WeakMap();
                __selectorCache.set(key, wm);
            }
            return wm;
        } catch {
            return null;
        }
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
    let __visibilityHintsCache = null; // WeakMap<Element, {hints:Array<string>, metrics:object}>
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
        __visibilityHintsCache = __domSharedCache.visibilityHintsCache instanceof WeakMap
            ? __domSharedCache.visibilityHintsCache
            : (__domSharedCache.visibilityHintsCache = new WeakMap());
    } catch {
        __visibilityHintsCache = null;
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
        // Purely a cache-partition key -- doesn't need to BE a real scan
        // scope, just a value that's stable for this run and distinct across
        // runs with a different root set. `roots` itself (the array) is a
        // stable reference for the whole run when there's more than one.
        if (roots.length === 1) return roots[0];
        if (roots.length > 1) return roots;
        return (document && typeof document === 'object') ? document : null;
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
        // display:none is NOT inherited: if ANY ancestor (or self) has
        // display:none, the whole subtree is unrendered no matter what a
        // descendant's own display is, so this must be resolved via an
        // ancestor walk that breaks on the first blocker found.
        for (const a of chain) {
            if (!isElement(a)) continue;

            // <area> is a non-rendered element; some DOMs report display:none for it.
            // Don’t treat the *area itself* as ineligible based on computed style.
            if (a === node) {
                const tn = (a.tagName || '').toLowerCase();
                if (tn === 'area') continue;
            }

            // Cache ancestor CSS blockers (display) per scope.
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
                cssBlock = (cs && cs.display === 'none') ? 'displayNone' : null;

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
        }

        // visibility IS inherited (and thus invertible): a descendant with an
        // explicit visibility:visible re-renders even under a
        // visibility:hidden ancestor. The fully resolved, post-inheritance
        // value is already reflected in the target node's own computed
        // style, so this is checked on `node` directly rather than by
        // walking ancestors (which would incorrectly treat visibility like
        // the non-inherited `display` property above).
        {
            const tn = (node.tagName || '').toLowerCase();
            if (tn !== 'area') {
                const cs = computedStyle(node);
                if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) {
                    return __cacheAndReturn({eligible: false, reasons: ['visibilityHidden']});
                }
            }
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
            // still evaluate required labeling/alt checks. Keep this narrowly scoped.
            const tag = (node.tagName || '').toLowerCase();
            const type = tag === 'input'
                ? ((node.getAttribute && (node.getAttribute('type') || '').toLowerCase()) || '')
                : '';

            // Native form controls are tabbable by default (even without tabindex)
            // and are targeted by labeling checks.
            const isNativeFormControl =
                tag === 'select' ||
                tag === 'textarea' ||
                (tag === 'input' && type !== 'hidden'); // includes type=image

            // Other elements that are natively tabbable by default (no explicit
            // tabindex required): <button>, <summary>, and <a>/<area> with a
            // non-empty href. Real browsers keep these in the tab order
            // regardless of aria-hidden — this is exactly the "aria-hidden on a
            // focusable element" anti-pattern that aria-hidden-focus.js itself
            // detects as a violation, so the eligibility model must evaluate
            // these too rather than silently excluding them. getPlatformFocusability
            // (via isPlatformFocusable) already checks the href/disabled/inert
            // conditions correctly for each of these tags.
            const isOtherNativelyFocusable =
                tag === 'button' ||
                tag === 'summary' ||
                tag === 'a';

            if (tag === 'area' || isNativeFormControl || isOtherNativelyFocusable) {
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

        const visibilityMode =
            opts && opts.visibilityMode === 'pointer'
                ? 'pointer'
                : (opts && opts.visibilityMode === 'styleAndGeometry'
                    ? 'styleAndGeometry'
                    : 'styleOnly');

        // CSS visibility is inherited, so the target node's own computed
        // style already reflects the fully-resolved (post-inheritance)
        // value. Checked here, before the opacity accumulation walk below,
        // so an element that is BOTH opacity:0 AND visibility:hidden (a
        // common hover/JS-reveal dropdown pattern — confirmed on a real
        // site, Getty's global nav dropdowns) is correctly reported as
        // 'visibilityHidden' rather than only 'opacityZero'. Reporting only
        // 'opacityZero' matters because callers that deliberately treat
        // opacity:0 as "still in-scope" (e.g. aria-hidden-focus, which must
        // not exclude opacity-based hiding) would otherwise see no other
        // blocking reason and wrongly conclude the element is focusable,
        // even though visibility:hidden alone already removes it from the
        // tab order in real browsers.
        {
            const nodeCs = computedStyle(node);
            if (nodeCs && (nodeCs.visibility === 'hidden' || nodeCs.visibility === 'collapse')) {
                return __cacheAndReturn(out(false, ['visibilityHidden'], {visibility: nodeCs.visibility}));
            }
        }

        // 2) CSS visibility suppression + opacity chain
        //
        // Two passes over the SAME ancestor chain, deliberately NOT
        // interleaved: display:none (and content-visibility:hidden) are
        // absolute, un-overridable blocks — there is no CSS mechanism for a
        // descendant to un-hide itself from a display:none ancestor, unlike
        // visibility:hidden (invertible) or opacity (never a hard block by
        // this function's own design — see callers like aria-hidden-focus
        // that deliberately keep opacity:0 in-scope). A single interleaved
        // loop that returns on the FIRST blocking condition found while
        // walking outward from the target would let a CLOSER ancestor's
        // opacity:0 short-circuit before a FARTHER ancestor's display:none
        // is ever reached — silently hiding the stronger, unconditional
        // block behind the weaker, filterable one. Found via a real site:
        // BuzzFeed's carousel slides are aria-hidden with opacity:0 (by
        // design, for a fade transition) AND nested several levels inside a
        // responsive wrapper that is display:none at the simulated
        // viewport width — the opacity:0 on the closer ancestor was
        // masking the display:none on the farther one, wrongly reporting
        // only 'opacityZero' (which aria-hidden-focus filters out as
        // still-in-scope) and missing the real, unconditional
        // non-rendering. Pass 1 here checks every ancestor for a hard
        // structural CSS block first, with no early exit for opacity; pass
        // 2 (below) computes the accumulated opacity only once no hard
        // block was found anywhere in the chain.
        const __cssInfoByAncestor = new Map();

        for (const a of chain) {
            if (!isElement(a)) continue;

            let cssBlock = null;
            let cssKnown = false;

            let cachedVisibility = null;
            let cachedContentVisHidden = null;
            let cachedOpacity = null;
            let cachedPointerEventsNone = null;
            let cachedPointerEventsKnown = false;
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
                        cachedOpacity = (cached && typeof cached.opacity === 'number' && Number.isFinite(cached.opacity))
                                ? cached.opacity
                                : null;

                        cachedPointerEventsNone = cached.pointerEventsNone === true ? true : null;
                        cachedPointerEventsKnown = cached.pointerEventsKnown === true ? true : false;
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

                // Pointer reachability: pointer-events:none blocks hit-testing
                if (visibilityMode === 'pointer' && !cachedPointerEventsKnown) {
                    try {
                        const pe = cs && cs.pointerEvents != null ? String(cs.pointerEvents).trim() : '';
                        cachedPointerEventsKnown = true;
                        if (pe === 'none') cachedPointerEventsNone = true;
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
                            opacity: cachedOpacity == null ? (prev && typeof prev.opacity === 'number' ? prev.opacity : null) : cachedOpacity,
                            pointerEventsNone: cachedPointerEventsNone === true ? true : (prev && prev.pointerEventsNone === true ? true : null),
                            pointerEventsKnown: cachedPointerEventsKnown === true ? true : (prev && prev.pointerEventsKnown === true ? true : false)
                        });
                    }
                } catch {
                    __perfInc('ancestorBlockerDom.css.nocache');
                }
            }

            __cssInfoByAncestor.set(a, {cssBlock, cachedOpacity, cachedPointerEventsNone, cachedPointerEventsKnown});

            if (cssBlock === 'displayNone') return __cacheAndReturn(out(false, ['displayNone'], {}));
            // NOTE: unlike display:none, CSS visibility is inherited and thus
            // invertible — a descendant with an explicit visibility:visible
            // re-renders even under a visibility:hidden ancestor. So an
            // ancestor's visibility:hidden must NOT short-circuit this walk;
            // the target node's own fully-resolved visibility is checked
            // once, after the loop (see below).
            if (cssBlock === 'contentVisibilityHidden') {
                return __cacheAndReturn(out(false, ['contentVisibilityHidden'], {}));
            }
        }

        let opacityProduct = 1;
        for (const a of chain) {
            if (!isElement(a)) continue;

            const info = __cssInfoByAncestor.get(a) || {};
            let cachedOpacity = info.cachedOpacity;
            let cachedPointerEventsNone = info.cachedPointerEventsNone;
            let cachedPointerEventsKnown = info.cachedPointerEventsKnown;
            let cs = null;

            if (visibilityMode === 'pointer') {
                // pointer-events:none prevents the element from receiving pointer interactions
                if (cachedPointerEventsKnown === true && cachedPointerEventsNone === true) {
                    return __cacheAndReturn(out(false, ['pointerEventsNone'], {}));
                }

                if (cachedPointerEventsKnown !== true) {
                    try {
                        if (!cs) cs = computedStyle(a);
                        const pe = cs && cs.pointerEvents != null ? String(cs.pointerEvents).trim() : '';
                        cachedPointerEventsKnown = true;
                        if (pe === 'none') cachedPointerEventsNone = true;

                        // Write back pointer-events status without disturbing other fields
                        try {
                            if (__ancBlockDomCache) {
                                const prev = __ancBlockDomCache.has(a) ? (__ancBlockDomCache.get(a) || null) : null;
                                if (prev) {
                                    __ancBlockDomCache.set(a, {
                                        struct: prev.struct || null,
                                        css: prev.css || null,
                                        cssKnown: prev.cssKnown === true ? true : false,
                                        visibility: prev.visibility || null,
                                        contentVisHidden: prev.contentVisHidden === true ? true : null,
                                        opacity: typeof prev.opacity === 'number' ? prev.opacity : null,
                                        pointerEventsNone: cachedPointerEventsNone === true ? true : null,
                                        pointerEventsKnown: cachedPointerEventsKnown === true ? true : false
                                    });
                                } else {
                                    __ancBlockDomCache.set(a, {
                                        struct: null,
                                        css: null,
                                        cssKnown: false,
                                        visibility: null,
                                        contentVisHidden: null,
                                        opacity: null,
                                        pointerEventsNone: cachedPointerEventsNone === true ? true : null,
                                        pointerEventsKnown: cachedPointerEventsKnown === true ? true : false
                                    });
                                }
                            }
                        } catch {}
                    } catch {}
                }

                if (cachedPointerEventsNone === true) {
                    return __cacheAndReturn(out(false, ['pointerEventsNone'], {}));
                }
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
                                        opacity: cachedOpacity,
                                        pointerEventsNone: prev.pointerEventsNone === true ? true : null,
                                        pointerEventsKnown: prev.pointerEventsKnown === true ? true : false
                                    });
                                } else {
                                    // No prior cache entry for this ancestor and no hard
                                    // structural block was found for it in pass 1 above
                                    // (pass 1 would have returned early otherwise), so
                                    // struct/css/visibility/contentVisHidden are all
                                    // known-null here.
                                    __ancBlockDomCache.set(a, {
                                        struct: null,
                                        css: null,
                                        visibility: null,
                                        contentVisHidden: null,
                                        opacity: cachedOpacity,
                                        pointerEventsNone: null,
                                        pointerEventsKnown: false
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
            // Allow callers to ignore opacity-based invisibility (still focusable).
            const ignoreOpacity = !!(opts && opts.ignoreOpacity === true);

            if (!ignoreOpacity && visibilityMode !== 'pointer' && opacityProduct <= 0.0001) {
                return __cacheAndReturn(out(false, ['opacityZero'], { opacity: opacityProduct }));
            }
        }

        // 3) Layout/geometry (optional)
        const useGeometry =
            visibilityMode === 'pointer'
                ? !(opts && opts.disableGeometry === true)
                : (visibilityMode === 'styleAndGeometry' && !(opts && opts.disableGeometry === true));

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
            const scopeObj = __getScopeObj();
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

    // Native "name is derived from value/alt" mechanisms, used when resolving
    // an IDREF *target*'s own text alternative (see computeIdRefTargetTextAlternative).
    function __getElementValueLikeName(el) {
        if (!isElement(el)) return '';
        const tag = (el.tagName || '').toLowerCase();

        if (tag === 'img' || tag === 'area') {
            const alt = getAttr(el, 'alt');
            if (alt != null) {
                const t = trim(alt);
                if (t) return t;
            }
            return '';
        }

        if (tag === 'input') {
            const type = lower(getAttr(el, 'type') || 'text');
            if (type === 'button' || type === 'submit' || type === 'reset' || type === 'image') {
                const v = getAttr(el, 'value');
                if (v != null) {
                    const t = trim(v);
                    if (t) return t;
                }
                if (type === 'submit') return 'Submit';
                if (type === 'reset') return 'Reset';
            }
        }

        return '';
    }

    // Recursively computes an IDREF-referenced node's own text alternative,
    // per the Accessible Name and Description Computation spec (resolving a
    // reference re-applies the name-computation algorithm to the target, it
    // does not just read raw textContent — see getContentNameInfo for why
    // raw textContent misses image alt text and other attribute-sourced
    // names on descendants). `visited` guards against cycles reachable via
    // direct aria-labelledby chains (e.g. two elements labelling each
    // other); `__nameComputationDepth` additionally bounds the combined
    // depth across this function and getContentNameInfo/
    // getAccessibleNameInfo, since a hop through a target's *content* (a
    // descendant with its own aria-labelledby) starts a fresh `visited` Set
    // and would otherwise defeat that per-call guard on a genuine cycle.
    function computeIdRefTargetTextAlternative(el, visited, _ctx, opts) {
        if (!isElement(el)) return '';
        if (visited.has(el)) return '';
        visited.add(el);
        if (__nameComputationDepth >= __NAME_COMPUTATION_MAX_DEPTH) return '';

        // Establish opts.includeHidden exactly once per aria-labelledby/aria-describedby
        // traversal, from the top-level referenced target's own hidden state -- mirrors
        // a widely-used reference engine's prepareContext, which only computes context.includeHidden when it's
        // still undefined and never overwrites it on recursive calls, so the whole
        // referenced subtree (nested labelledby chains included) shares one decision. See
        // getContentNameInfo's collect() for what this bypasses and why (real bug found via
        // Discord's live-DOM footer nav, 2026-07-23).
        let effOpts = opts;
        if (!opts || opts.includeHidden === undefined) {
            let hidden = false;
            try {
                const elig = isAccTreeEligible(el);
                hidden = !(elig && elig.eligible);
            } catch {
                hidden = false;
            }
            effOpts = Object.assign({}, opts, {includeHidden: hidden});
        }

        __nameComputationDepth += 1;
        try {
            const ariaLabel = trim(getAttr(el, 'aria-label'));
            if (ariaLabel) return ariaLabel;

            const labelledBy = trim(getAttr(el, 'aria-labelledby'));
            if (labelledBy) {
                const parts = labelledBy.split(/\s+/).filter(Boolean);
                const texts = [];
                for (const id of parts) {
                    let ref = safeDocGetById(id);
                    if (!ref) ref = safeRootQueryById(id);
                    if (ref && isElement(ref)) {
                        const t = computeIdRefTargetTextAlternative(ref, visited, _ctx, effOpts);
                        if (t) texts.push(t);
                    }
                }
                const joined = trim(texts.join(' '));
                if (joined) return joined;
            }

            const valueLike = __getElementValueLikeName(el);
            if (valueLike) return valueLike;

            const contentInfo = getContentNameInfo(el, _ctx, effOpts);
            if (contentInfo && contentInfo.present && contentInfo.value) return contentInfo.value;

            const title = trim(getAttr(el, 'title'));
            if (title) return title;

            return '';
        } finally {
            __nameComputationDepth -= 1;
        }
    }

    function getTextFromIdRefs(idrefString, _ctx, opts) {
        const r = resolveIdRefs(idrefString, _ctx, opts);
        const texts = [];
        const visited = new Set();
        for (const el of r.refs) {
            try {
                const t = computeIdRefTargetTextAlternative(el, visited, _ctx, opts);
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
        const visited = new Set();
        for (const el of r.refs) {
            const elig = isIdRefEligibleTarget(el);
            if (!elig.eligible) {
                const id = trim(el.getAttribute && el.getAttribute('id'));
                excluded.push({id: id || null, reasons: elig.reasons.slice(0)});
                continue;
            }
            try {
                const t = computeIdRefTargetTextAlternative(el, visited, _ctx, opts);
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
    // Computes a wrapping/explicit <label>'s own text for the purpose of
    // naming ONE specific control inside it, excluding that control's own
    // subtree (matches HTML-AAM's "label text minus embedded control
    // content" and a widely-used reference engine's implicit-evaluate/explicit-evaluate, which do
    // the same exclusion via a startNode/inControlContext flag on their own
    // subtreeText recursion). Deliberately does NOT call back into
    // getAccessibleNameInfo/getContentNameInfo for descendants — only img
    // alt (getTextAlternativeInfo), aria-label (getAriaLabelInfo), and
    // aria-labelledby (getAriaLabelledByInfo) on descendants, all of which
    // are leaf-safe with respect to <label> lookups. This is intentional:
    // getAccessibleNameInfo calls this function, and getContentNameInfo's
    // own descendant walk calls getAccessibleNameInfo — if this function
    // routed back through either of those instead, a control nested inside
    // its own naming <label> (the exact case this exists to handle) would
    // recurse forever between "what's my name" and "what's my label's
    // content."
    function getLabelSubtreeNameInfo(labelEl, excludeEl, _ctx, opts) {
        if (!isElement(labelEl)) return {present: false, value: '', mechanism: 'none', flags: []};

        const parts = [];
        let guardCount = 0;

        function isImageLikeNode(node) {
            const tag = lower(node.tagName);
            const type = tag === 'input' ? lower(getAttr(node, 'type')) : '';
            return tag === 'img' || tag === 'area' || (tag === 'input' && type === 'image');
        }

        function walk(node) {
            if (node === excludeEl) return; // exclude the target control's own subtree
            guardCount += 1;
            if (guardCount > 5000) return;

            if (node.nodeType === 3) {
                const t = trim(node.nodeValue);
                if (t) parts.push(t);
                return;
            }
            if (!isElement(node)) return;

            let eligible = true;
            try {
                const r = isAccTreeEligible(node);
                eligible = !!(r && r.eligible);
            } catch {
                eligible = true;
            }
            if (!eligible) return;

            const al = getAriaLabelInfo(node);
            if (al && al.present && al.value) {
                parts.push(al.value);
                return;
            }
            const alb = getAriaLabelledByInfo(node, _ctx, opts);
            if (alb && alb.present && alb.value) {
                parts.push(alb.value);
                return;
            }

            if (isImageLikeNode(node)) {
                const alt = getTextAlternativeInfo(node, _ctx, opts);
                if (alt && alt.present && alt.value) parts.push(alt.value);
                return;
            }

            const kids = node.childNodes ? Array.from(node.childNodes) : [];
            for (const kid of kids) walk(kid);
        }

        try {
            const kids = labelEl.childNodes ? Array.from(labelEl.childNodes) : [];
            for (const kid of kids) walk(kid);
        } catch {
        }

        const value = trim(parts.join(' ').replace(/\s+/g, ' '));
        return {present: !!value, value, mechanism: 'label', flags: value ? [] : ['empty']};
    }

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

        // Native <label> association via the HTML `.labels` API, which
        // resolves BOTH `<label for="...">` and wrapping `<label>...</label>`
        // in one call, for any genuinely labelable element (button, input,
        // meter, output, progress, select, textarea — `.labels` is simply
        // absent/undefined on anything else, so this never over-triggers).
        // Found via a real page: DeviantArt's settings toggles wrap a
        // description div and an unlabeled icon-only <button aria-pressed>
        // in one <label> — a spec-valid naming mechanism (HTML lists
        // <button> as labelable) that a widely-used reference engine's
        // button-name rule already checks (its implicit-label/explicit-label checks) but this engine
        // wasn't checking at all, since the id-based lookup below only ever
        // handled explicit for="" and this button has no id to begin with.
        try {
            if (el.labels && el.labels.length) {
                for (const labelEl of Array.from(el.labels)) {
                    const info = getLabelSubtreeNameInfo(labelEl, el, _ctx, opts);
                    if (info.present && info.value) {
                        const out = {present: true, value: info.value, mechanism: 'label', flags};
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
                }
            }
        } catch {
        }

        // Explicit <label for="..."> or wrapping <label> (common and deterministic for form controls)
        // (fallback for elements where `.labels` isn't natively available,
        // e.g. a non-native-labelable element like <div role="button" id="x">
        // still explicitly pointed at by <label for="x">.)
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


        // POLICY NOTE (2026-07-23, revisit if ever reconsidered): title is accepted here as a
        // last-resort accessible-name source, matching HTML-AAM/accname and a widely-used
        // reference engine's own behavior (confirmed by reading that engine's source -- several
        // of its rules explicitly accept a
        // non-empty title, e.g. image-alt's non-empty-title check). This is a deliberate,
        // spec-compliant choice, not an oversight -- but title is a genuinely weak mechanism in
        // practice (no touch/mobile exposure, inconsistent screen-reader support, no visible
        // affordance for sighted users), and this is the shared function nearly every
        // accessible-name-dependent rule in the engine goes through. Kept for spec/reference-engine-parity
        // rather than removed outright; flagged here so it isn't silently load-bearing.
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

    // <canvas> fallback content is the element's *children*, not just its
    // rendered text — a documented HTML5 technique is an equivalent <img
    // alt="..."> (or similarly self-describing element) inside <canvas>.
    // textContent alone misses that, since alt text isn't part of it.
    function __hasMeaningfulCanvasFallbackDescendant(container) {
        try {
            if (!container || !container.querySelectorAll) return false;

            const imgs = container.querySelectorAll('img[alt]');
            for (const img of imgs) {
                if (trim(img.getAttribute && img.getAttribute('alt'))) return true;
            }

            const areas = container.querySelectorAll('area[alt]');
            for (const area of areas) {
                if (trim(area.getAttribute && area.getAttribute('alt'))) return true;
            }

            const named = container.querySelectorAll('[aria-label]');
            for (const n of named) {
                if (trim(n.getAttribute && n.getAttribute('aria-label'))) return true;
            }

            return false;
        } catch {
            return false;
        }
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
            const fallbackText = trim(el.textContent || '');
            if (fallbackText || __hasMeaningfulCanvasFallbackDescendant(el)) {
                return {
                    present: true,
                    value: fallbackText || 'fallback-content',
                    mechanism: 'canvas-fallback',
                    requiredMechanism: 'fallback-or-name',
                    flags
                };
            }

            // <canvas> is not a labelable element (no browser computes an
            // accessible name from <label for="...">), so only ARIA naming
            // (and title, as a generic last-resort accname source) count —
            // unlike getAccessibleNameInfo, which also accepts native
            // <label> associations.
            const aria = getAriaNameInfo(el, _ctx, opts);
            if (aria && aria.present && aria.value) {
                return {
                    present: true,
                    value: aria.value,
                    mechanism: aria.mechanism || 'aria',
                    requiredMechanism: 'fallback-or-name',
                    flags: flags.concat(aria.flags ? aria.flags.slice(0) : [])
                };
            }

            const title = trim(getAttr(el, 'title'));
            if (title) {
                return {
                    present: true,
                    value: title,
                    mechanism: 'title',
                    requiredMechanism: 'fallback-or-name',
                    flags: flags.concat(['title-used'])
                };
            }

            return {
                present: false,
                value: '',
                mechanism: 'none',
                requiredMechanism: 'fallback-or-name',
                flags: flags.concat(aria && aria.flags ? aria.flags.slice(0) : [])
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

    // C.1) "Name from content" — recursive accname-aligned content-name computation.
    //
    // Rationale: the accname spec's "name from content" step (2F) is recursive —
    // for each child node, use that CHILD's own accessible name if it has one
    // (aria-label/aria-labelledby/native <label>/title, or `alt` for image-like
    // elements) rather than only concatenating literal text nodes. A naive
    // TreeWalker(SHOW_TEXT)-only walk (the pattern previously duplicated across
    // the *-name-present rule family) misses any descendant that gets its name
    // from an attribute rather than visible text — the single most common
    // real-world case being `<a href="..."><img alt="Company Name"></a>` (a
    // logo link) and `<button><span role="img" aria-label="Close"></span></button>`
    // (an icon-only button). Both were confirmed to false-positive under the
    // old text-node-only approach before this helper was added.
    function getContentNameInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return {present: false, value: '', mechanism: 'unsupported', flags: ['notElement']};

        // Shares __nameComputationDepth with computeIdRefTargetTextAlternative
        // — see that function's header comment for why a single per-call
        // guard isn't enough on its own.
        if (__nameComputationDepth >= __NAME_COMPUTATION_MAX_DEPTH) {
            return {present: false, value: '', mechanism: 'none', flags: ['depth-limit']};
        }

        const maxNodes = (opts && Number.isFinite(opts.maxContentNodes)) ? Math.max(1, opts.maxContentNodes) : 5000;
        let visitedCount = 0;
        let truncated = false;

        function isImageLikeNode(node) {
            const tag = lower(node.tagName);
            const type = tag === 'input' ? lower(getAttr(node, 'type')) : '';
            return tag === 'img' || tag === 'area' || (tag === 'input' && type === 'image');
        }

        function collect(node, parts) {
            if (truncated) return;
            visitedCount += 1;
            if (visitedCount > maxNodes) {
                truncated = true;
                if (flags.indexOf('truncated') === -1) flags.push('truncated');
                return;
            }

            if (node.nodeType === 3) {
                const t = trim(node.nodeValue);
                if (t) parts.push(t);
                return;
            }

            if (!isElement(node)) return;

            // Skip anything not exposed to the accessibility tree (hidden,
            // aria-hidden, display:none, inert, etc.) — same scope as
            // isAccTreeEligible, so a hidden descendant never contributes.
            //
            // Exception: opts.includeHidden (set by computeIdRefTargetTextAlternative
            // when the aria-labelledby/aria-describedby TARGET itself is hidden) skips
            // this check entirely except for genuinely non-rendered tags. Per the accname
            // spec, a directly-referenced target's own hidden state doesn't block name
            // computation, and per a widely-used reference engine's own
            // prepareContext/context.includeHidden (verified by reading that engine's source
            // directly), that bypass covers the target's whole
            // subtree, not just the target element itself -- confirmed via a real page
            // (Discord's footer, 2026-07-23): four <nav aria-labelledby="...">, each
            // referencing a CSS-hidden (display:none, a responsive/interaction-gated
            // dropdown toggle) heading with genuinely distinct text ("Product"/"Company"/
            // "Resources"/"Policies"). surea11y's own isAccTreeEligible correctly treats
            // each toggle's hidden text as ineligible on its own terms (nothing wrong with
            // that check in isolation), but applying it while resolving what a
            // labelledby-referencing element is NAMED disagreed with that reference engine's real,
            // spec-aligned "pass" (distinct names) -- surea11y saw all four as unnamed and collapsed them
            // into one false "not unique" cluster (landmark-unique, and any other
            // rule resolving an aria-labelledby name through a hidden target, e.g. dialog/
            // tab/menuitem-name-present).
            if (opts && opts.includeHidden) {
                const tag = lower(node.tagName);
                if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template') return;
            } else {
                let eligible = true;
                try {
                    const eligRes = isAccTreeEligible(node);
                    eligible = !!(eligRes && eligRes.eligible);
                } catch {
                    eligible = true;
                }
                if (!eligible) return;
            }

            if (isImageLikeNode(node)) {
                // aria-labelledby/aria-label take priority over alt per the
                // accname spec (HTML-AAM) — checked first. Found via a real
                // page (eBay's product-card links): an <img alt=""
                // aria-labelledby="..."> pointing to real product-title text
                // was contributing nothing to the parent <a>'s content name,
                // since getTextAlternativeInfo alone only ever looks at alt
                // (by design, for the separate "is alt present" question
                // img-alt-present cares about) and an empty-but-present alt
                // short-circuited before aria-labelledby was ever checked.
                //
                // Deliberately uses getAriaNameInfo (aria only), NOT the
                // general getAccessibleNameInfo -- the latter also falls
                // back to a native <label>/title, which for an image-like
                // descendant must rank BELOW alt, not above it. Using
                // getAccessibleNameInfo here let title win over alt
                // unconditionally, for every image-like descendant, since
                // its title fallback doesn't know alt exists at all:
                // `<a href="/"><img alt="" title="Acme home"></a>` (a
                // decorative logo image, deliberately marked as
                // contributing no name via alt="") had "Acme home" wrongly
                // adopted as the link's whole content name; worse,
                // `<button><img alt="Real label" title="tooltip"></button>`
                // -- an image with a legitimate, correct alt AND an
                // unrelated title tooltip, a common real-world pattern --
                // silently used the tooltip text instead of the real label.
                const ariaName = getAriaNameInfo(node, _ctx, opts);
                if (ariaName && ariaName.present && ariaName.value) {
                    parts.push(ariaName.value);
                    if (flags.indexOf('descendant-name-used:image-aria') === -1) flags.push('descendant-name-used:image-aria');
                    return;
                }

                // input[type=image] (unlike img/area) is a genuinely
                // labelable form control -- a native <label> association
                // still outranks its alt attribute per accname's
                // element-specific name mapping, so it's checked here,
                // ahead of alt/title, same relative order getAccessibleNameInfo
                // itself uses for every other labelable control.
                if (lower(node.tagName) === 'input') {
                    try {
                        if (node.labels && node.labels.length) {
                            for (const labelEl of Array.from(node.labels)) {
                                const labelInfo = getLabelSubtreeNameInfo(labelEl, node, _ctx, opts);
                                if (labelInfo.present && labelInfo.value) {
                                    parts.push(labelInfo.value);
                                    if (flags.indexOf('descendant-name-used:image-label') === -1) flags.push('descendant-name-used:image-label');
                                    return;
                                }
                            }
                        }
                    } catch {
                    }
                }

                // alt (even an explicit alt="", a deliberate "decorative,
                // contributes nothing" marker) always outranks title.
                // getTextAlternativeInfo already encodes exactly that
                // precedence: `present` distinguishes a real (possibly
                // empty) alt attribute -- terminal, contributes its
                // (possibly empty) value and nothing else -- from one
                // that's structurally absent, where `value` already
                // carries getTextAlternativeInfo's own title fallback.
                const alt = getTextAlternativeInfo(node, _ctx, opts);
                if (alt && alt.value) {
                    const usedFlag = alt.present ? 'descendant-alt-used' : 'descendant-name-used:image-title-fallback';
                    parts.push(alt.value);
                    if (flags.indexOf(usedFlag) === -1) flags.push(usedFlag);
                }
                return; // image-like elements have no meaningful children to recurse into
            }

            const ownName = getAccessibleNameInfo(node, _ctx, opts);
            if (ownName && ownName.present && ownName.value) {
                parts.push(ownName.value);
                const tag = `descendant-name-used:${ownName.mechanism || 'unknown'}`;
                if (flags.indexOf(tag) === -1) flags.push(tag);
                return; // this descendant speaks for itself; don't also use its content
            }

            // A <slot>'s own childNodes are its FALLBACK content only —
            // rendered solely when nothing is assigned to it. When real
            // content IS distributed into it, that's what's actually
            // rendered/exposed to the accessibility tree, and it lives
            // elsewhere in the light DOM, not as this node's children.
            // Found via a real page (Shoelace's <sl-button>, whose shadow
            // root renders <a part="base"><slot name="prefix">...
            // <slot part="label">...<slot name="suffix">...</a> — walking
            // the slots' own (empty) childNodes found nothing, when the
            // button's real accessible name ("Follow") was a plain light-DOM
            // text node assigned to the unnamed middle slot).
            if (lower(node.tagName) === 'slot' && typeof node.assignedNodes === 'function') {
                let assigned = [];
                try {
                    assigned = node.assignedNodes({flatten: true}) || [];
                } catch {
                    assigned = [];
                }
                const kids = assigned.length ? assigned : (node.childNodes ? Array.from(node.childNodes) : []);
                for (const kid of kids) {
                    collect(kid, parts);
                    if (truncated) break;
                }
                return;
            }

            const kids = node.childNodes ? Array.from(node.childNodes) : [];
            for (const kid of kids) {
                collect(kid, parts);
                if (truncated) break;
            }
        }

        const parts = [];
        __nameComputationDepth += 1;
        try {
            const topKids = el.childNodes ? Array.from(el.childNodes) : [];
            for (const kid of topKids) {
                collect(kid, parts);
                if (truncated) break;
            }
        } finally {
            __nameComputationDepth -= 1;
        }

        const value = trim(parts.join(' ').replace(/\s+/g, ' '));
        return {
            present: !!value,
            value,
            mechanism: value ? 'content' : 'none',
            flags
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

    function getVisibilityHintsInfo(el, _ctx, opts) {
        // Deterministic, style-only visibility hints for triage.
        // Does NOT decide eligibility; checks decide outcomes.
        // Uses computedStyle() which is already scope-cached.

        if (!isElement(el)) return {hints: [], metrics: {}, flags: ['notElement']};

        // Cache per element per run
        try {
            if (__visibilityHintsCache && __visibilityHintsCache.has(el)) {
                __perfInc('visibilityHints.hit');
                const c = __visibilityHintsCache.get(el);
                if (c && typeof c === 'object') {
                    return {
                        hints: Array.isArray(c.hints) ? c.hints.slice(0) : [],
                        metrics: c.metrics && typeof c.metrics === 'object' ? {...c.metrics} : {},
                        flags: Array.isArray(c.flags) ? c.flags.slice(0) : []
                    };
                }
            }
        } catch {
            // ignore
        }

        __perfInc('visibilityHints.miss');

        const hints = [];
        const metrics = {};
        const flags = [];

        const cs = computedStyle(el) || {};

        // opacity:0
        try {
            const raw = cs.opacity != null ? String(cs.opacity).trim() : '';
            const op = raw ? Number.parseFloat(raw) : 1;
            if (Number.isFinite(op)) metrics.opacity = op;
            if (Number.isFinite(op) && op <= 0.0001) hints.push('opacityZero');
        } catch {
            flags.push('opacity-parse-failed');
        }

        // clip / clip-path
        try {
            const clip = cs.clip != null ? String(cs.clip).trim() : '';
            const clipPath = cs.clipPath != null ? String(cs.clipPath).trim() : '';

            const clipLow = clip.toLowerCase();
            const clipPathLow = clipPath.toLowerCase();

            if (clipLow && clipLow !== 'auto') {
                // Detect common visually-hidden: rect(0,0,0,0)
                const norm = clipLow.replace(/\s+/g, '');
                if (norm.indexOf('rect(') !== -1 && norm.indexOf('rect(0') !== -1) hints.push('clipped');
            }

            if (clipPathLow && clipPathLow !== 'none') {
                // Detect common visually-hidden: inset(50%) / inset(100%)
                if (clipPathLow.indexOf('inset(') !== -1 && (clipPathLow.indexOf('50%') !== -1 || clipPathLow.indexOf('100%') !== -1)) {
                    hints.push('clipped');
                }
            }

            if (clip) metrics.clip = clip;
            if (clipPath) metrics.clipPath = clipPath;
        } catch {
            flags.push('clip-parse-failed');
        }

        // zero-size + overflow hidden/clip
        try {
            const wv = cs.width != null ? String(cs.width).trim() : '';
            const hv = cs.height != null ? String(cs.height).trim() : '';
            const ov = cs.overflow != null ? String(cs.overflow).trim().toLowerCase() : '';

            metrics.width = wv || null;
            metrics.height = hv || null;
            metrics.overflow = ov || null;

            const isZeroW = wv === '0px' || wv === '0';
            const isZeroH = hv === '0px' || hv === '0';
            const hidesOverflow = ov === 'hidden' || ov === 'clip';
            if ((isZeroW || isZeroH) && hidesOverflow) hints.push('zeroSizeOverflowHidden');
        } catch {
            flags.push('size-parse-failed');
        }

        // offscreen heuristic (string-based; no geometry)
        try {
            const pos = cs.position != null ? String(cs.position).trim().toLowerCase() : '';
            const left = cs.left != null ? String(cs.left).trim().toLowerCase() : '';
            const top = cs.top != null ? String(cs.top).trim().toLowerCase() : '';
            const ti = cs.textIndent != null ? String(cs.textIndent).trim().toLowerCase() : '';

            metrics.position = pos || null;
            metrics.left = left || null;
            metrics.top = top || null;
            metrics.textIndent = ti || null;

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
                if ((l != null && l <= -5000) || (t != null && t <= -5000)) hints.push('offscreen');
            }
            if (ind != null && ind <= -5000) hints.push('offscreen');
        } catch {
            flags.push('offscreen-parse-failed');
        }

        // Dedupe hints, stable order
        const order = ['opacityZero', 'offscreen', 'clipped', 'zeroSizeOverflowHidden'];
        const seen = new Set();
        const stable = [];
        for (const k of order) {
            if (hints.indexOf(k) !== -1 && !seen.has(k)) {
                seen.add(k);
                stable.push(k);
            }
        }

        const out = {hints: stable, metrics, flags};

        try {
            if (__visibilityHintsCache) {
                __visibilityHintsCache.set(el, {
                    hints: stable.slice(0),
                    metrics: {...metrics},
                    flags: flags.slice(0)
                });
            }
        } catch {
            __perfInc('visibilityHints.nocache');
        }

        return out;
    }

    // Back-compat: keep existing helper but implement via new name helper.
    function hasAccessibleName(el) {
        const info = getAccessibleNameInfo(el);
        return !!(info && info.present && trim(info.value));
    }

    function createSelectorUniqIndex() {
        const idCount = new Map();
        const testIdCount = new Map(); // data-testid + data-test + data-cy + data-qa
        const nameCount = new Map();   // key: tag|name
        const ariaLabelCount = new Map(); // key: tag|aria-label
        const roleAriaLabelCount = new Map(); // key: role|aria-label

        const sel = '[id],[data-testid],[data-test],[data-cy],[data-qa],[name],[aria-label],[role]';
        let nodes;
        if (typeof queryAllSmart === 'function') {
            nodes = queryAllSmart(sel) || [];
        } else {
            // Defensive fallback (queryAllSmart is always defined in this
            // module, so this branch is not expected to run) -- loop every
            // resolved root rather than assuming a single scope element.
            nodes = [];
            const seen = new Set();
            for (const r of roots) {
                if (!r || !r.querySelectorAll) continue;
                for (const el of r.querySelectorAll(sel)) {
                    if (el && !seen.has(el)) { seen.add(el); nodes.push(el); }
                }
            }
            if (!nodes.length && !roots.length && document) {
                nodes = Array.from(document.querySelectorAll(sel));
            }
        }

        const inc = (map, key) => map.set(key, (map.get(key) || 0) + 1);

        for (const el of nodes) {
            if (!el || el.nodeType !== 1) continue;

            const tag = (el.tagName || '').toLowerCase();

            const elementId = el.getAttribute('id');
            if (elementId && elementId.trim()) inc(idCount, elementId.trim());

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

            const cssEscapeIdent = __cssEscapeIdent;

            const escapeAttrValue = __escapeAttrValue;

            const elementId = el.getAttribute && el.getAttribute('id');
            if (elementId && elementId.trim()) return '#' + cssEscapeIdent(elementId.trim());

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

        // Partitioned by __selectorOptsKey: the index's counts depend on
        // includeShadowDom/excludeSelectors (via queryAllSmart), so a scope
        // reused across runs with different options must not share indices.
        let perScope = null;
        try {
            perScope = __uniqIndexByScope.get(scopeObj);
            if (!(perScope instanceof Map)) {
                perScope = new Map();
                __uniqIndexByScope.set(scopeObj, perScope);
            }
        } catch {
            __perfInc('uniqIndex.nocache');
            return createSelectorUniqIndex();
        }

        const key = __getSelectorOptsKey();
        const cached = perScope.get(key);
        if (cached) {
            __perfInc('uniqIndex.hit');
            return cached;
        }

        __perfInc('uniqIndex.miss');
        const idx = createSelectorUniqIndex();
        try {
            perScope.set(key, idx);
        } catch { /* ignore */
        }
        __perfInc('uniqIndex.build');
        return idx;
    }

    function buildSelectorUncached(el) {
        const escapeAttrValue = __escapeAttrValue;
        try {
            if (!el || el.nodeType !== 1) return 'html';

            const cssEscape = __cssEscapeIdent;

            const idx = getUniqIndex();
            const tag = (el.tagName || '').toLowerCase();

            const uniqueIdSel = () => {
                const elementId = el.getAttribute('id');
                if (!elementId || !elementId.trim()) return null;
                const v = elementId.trim();
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

                // A same-tag sibling before this node (i > 1) already means
                // an unqualified tag selector would be ambiguous — no need
                // to also scan forward in that case. Only scan
                // nextElementSibling when this node is the first of its tag
                // among its siblings, to catch the case where the
                // disambiguating sibling comes after it instead.
                let hasSame = i > 1;
                if (!hasSame) {
                    sib = node.nextElementSibling;
                    while (sib) {
                        if ((sib.tagName || '').toLowerCase() === t) {
                            hasSame = true;
                            break;
                        }
                        sib = sib.nextElementSibling;
                    }
                }
                return hasSame ? t + ':nth-of-type(' + i + ')' : t;
            }

            let node = el;
            let safety = 0;

            // Only apply the "stop climbing once we reach a contextSelector-
            // matched root" shortcut when there's a single (or no) matched
            // root -- resolveContextRoots() falls back to `[documentElement]`
            // when no contextSelector is given, so this is the overwhelmingly
            // common case and behaves exactly as before.
            //
            // With MULTIPLE matched roots (multi-region contextSelector
            // scans), stopping there without recording anything about which
            // root produced an ambiguous, non-unique selector string for two
            // structurally-identical regions -- a real, confirmed bug (found
            // 2026-07-29 via the cross-engine comparisons project): two
            // wrapper <div>s, each containing two identical ".widget"
            // sections scanned via `contextSelector: '.widget'`, produced the
            // *same* selector string ("section:nth-of-type(1) > div > div >
            // button") for the equivalent button in each wrapper --
            // resolving to 2 elements instead of 1 when queried, and pointing
            // at the wrong one for at least one of the two occurrences. The
            // existing `el.matches(candidate)` safety check below couldn't
            // catch this: it only verifies THIS element matches the string,
            // never that the string is unique document-wide.
            //
            // Fix: when multiple roots are in play, don't stop early --
            // keep climbing (same as the always-correct no-contextSelector
            // path) until finding a genuinely unique anchor or reaching the
            // true document root, which is always singular. That restores
            // the invariant the final safety-check comment below relies on,
            // rather than needing a separate (more expensive) document-wide
            // uniqueness re-check.
            const stopAtMatchedRoot = roots.length <= 1;

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

                if (!node.parentElement || (stopAtMatchedRoot && roots.includes(node))) break;
                node = node.parentElement;
            }

            const candidate = parts.join(' > ') || (tag || 'html');

            // Verify the constructed selector string actually resolves to
            // `el` per the CSS engine's own semantics — a real safety net,
            // since some selector engines (observed in jsdom) disagree with
            // this function's own :nth-of-type sibling counting in edge
            // cases. `el.matches(candidate)` checks exactly that (does the
            // engine agree this element satisfies the string we built) at a
            // cost bounded by el's own ancestor-chain depth.
            //
            // This intentionally does NOT re-verify global uniqueness via a
            // whole-document query: every path segment above pins an exact
            // position relative to its own parent via `>` (child, not
            // descendant) combinators, so a correctly-matching chain can
            // only resolve to one element short of a malformed document
            // (e.g. two <html> roots) -- true as long as the walk above
            // never stops short of a genuinely unique anchor/root, which is
            // exactly what `stopAtMatchedRoot` now guarantees (see its own
            // comment above; a multi-root contextSelector scan stopping
            // early used to violate this invariant silently). Re-deriving
            // that guarantee via a
            // document-wide :nth-of-type scan was measured to cost O(total
            // same-tag siblings) per call — pathological on pages with many
            // flat, unidentified siblings (e.g. hundreds of unlabeled
            // <img>s), while contributing no realistic additional safety.
            try {
                if (el && typeof el.matches === 'function' && el.matches(candidate)) return candidate;
            } catch {
            }

            return buildSimpleSelector(el, tag || 'html');
        } catch {
            return 'html';
        }
    }

    function buildSelector(el) {
        const cache = __getSelectorCacheForOpts();
        try {
            if (cache && el && typeof el === 'object' && cache.has(el)) {
                __perfInc('selector.hit');
                return cache.get(el) || 'html';
            }
        } catch {
        }
        __perfInc('selector.miss');
        const sel = buildSelectorUncached(el);
        try {
            if (cache && el && typeof el === 'object') cache.set(el, sel);
        } catch {
        }
        return sel;
    }

    // Sibling-index path from documentElement's descendants down to `el`
    // ([] if `el` IS the documentElement); null if `el` is falsy or detached
    // in a way that makes indexing impossible. A more robust element-identity
    // mechanism than a CSS selector string alone (survives some DOM changes
    // a selector wouldn't -- e.g. an id/class rename), at the cost of not
    // being usable as a real CSS selector itself. Deliberately mirrors the
    // same algorithm used by this project's (external) cross-engine
    // result-matching tooling exactly, rather than requiring it --
    // this file must stay self-contained (embedded into the generated
    // runtime via .toString(), no module requires survive that), so a
    // correctness fix to the algorithm must be applied to both copies.
    function structuralPath(el) {
        if (!el || typeof el !== 'object') return null;
        const path = [];
        let node = el;
        try {
            while (node && node.parentElement) {
                const parent = node.parentElement;
                const idx = Array.prototype.indexOf.call(parent.children, node);
                if (idx < 0) return null;
                path.unshift(idx);
                node = parent;
            }
        } catch {
            return null;
        }
        return path;
    }

    // Occurrence-level structural path: prefers the actual element reference
    // (exact, no re-resolution risk) and only falls back to re-resolving via
    // the occurrence's own selector when no element reference was kept --
    // the same technique the cross-engine live-DOM adapters already use to
    // recover an element from a reported selector, with the same accepted
    // caveat (a non-unique selector could resolve to a different element
    // than originally intended -- already documented as "structural-path
    // collisions" for the cross-engine tooling).
    function buildStructuralPath(node, selector) {
        if (node && typeof node === 'object') {
            const p = structuralPath(node);
            if (p) return p;
        }
        if (selector && typeof selector === 'string' && document && typeof document.querySelector === 'function') {
            let el = null;
            try {
                el = document.querySelector(selector);
            } catch {
                el = null;
            }
            if (el) return structuralPath(el);
        }
        return null;
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

    function isPlaceholderCapable(el) {
        // Per HTML, `placeholder` is only a name/hint source for text-entry
        // input types and <textarea> — browsers/AT ignore it on other input
        // types (checkbox, radio, range, color, date, file, ...) and on
        // <select>, so it must not be treated as an accessible-name source
        // for those.
        try {
            if (!isElement(el)) return false;
            const tag = (el.tagName || '').toLowerCase();
            if (tag === 'textarea') return true;
            if (tag !== 'input') return false;
            const type = (el.getAttribute && (el.getAttribute('type') || 'text') || 'text').toLowerCase().trim();
            const t = type || 'text';
            return t === 'text' || t === 'search' || t === 'tel' || t === 'url' || t === 'email' || t === 'password' || t === 'number';
        } catch {
            return false;
        }
    }

    function getNonEmptyPlaceholder(el) {
        if (!getAttributeInfo) return null;
        if (!isPlaceholderCapable(el)) return null;
        try {
            const info = getAttributeInfo(el, 'placeholder');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch {
            return null;
        }
    }

    // A <label> contributes a name to its associated control either via its
    // own aria-label/aria-labelledby (checked first, same precedence any
    // element's accessible name gives ARIA over content — verified against
    // a real page: <label aria-label="Toggle Navigation"><svg
    // aria-hidden="true">...</svg></label> names its control "Toggle
    // Navigation" even though the label's only child content is aria-
    // hidden) or, failing that, its rendered content (getContentNameInfo,
    // which already excludes aria-hidden/display:none/inert descendants —
    // e.g. <label><input><span aria-hidden="true">Accept</span></label>
    // gives the control no name despite the DOM association existing).
    function labelContributesAccessibleName(lab) {
        try {
            const aria = getAriaNameInfo(lab, null, {});
            if (aria && aria.present && trim(aria.value)) return true;
        } catch {
        }
        try {
            const info = getContentNameInfo(lab, null, {});
            return !!(info && info.present && trim(info.value));
        } catch {
            return true; // conservative on error: don't newly fail
        }
    }

    function hasLabelAssociation(el) {
        // Deterministic, stable subset:
        // - <label for="id">
        // - wrapping <label> ... <input> ...
        // A structural association alone isn't enough — see
        // labelContributesAccessibleName above for what counts.
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
        let associatedLabels = [];

        // Prefer the native `.labels` API — resolves both wrapping <label>
        // and <label for="id"> association in one call, as real elements.
        try {
            if (el && 'labels' in el && el.labels && el.labels.length) {
                associatedLabels = Array.prototype.slice.call(el.labels);
            }
        } catch {
        }

        if (!associatedLabels.length) {
            // Fallback for environments without a working `.labels` API:
            // structural-only (pre-existing behavior, no content check —
            // __lookupLabelForId's cache doesn't retain an element ref).
            const id = trim(getAttr(el, 'id'));
            if (id) {
                const entry = __lookupLabelForId(id, '__default__');
                if (entry && entry.exists) out = true;
            }

            if (!out && el.closest) {
                try {
                    const wrap = el.closest('label');
                    if (wrap && isElement(wrap)) associatedLabels = [wrap];
                } catch {
                }
            }
        }

        if (!out && associatedLabels.length) {
            out = associatedLabels.some(labelContributesAccessibleName);
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

    // Resolves the final {outcome, severity, occurrences} for a rule that
    // collects two independent confidence tiers during one run — some
    // findings are confident enough for a hard `fail`, others only warrant
    // `cantTell` (e.g. "this needs human review"). The naive approach
    // (`if (failOccurrences.length) return fail(failOccurrences); else if
    // (cantTellOccurrences.length) return cantTell(cantTellOccurrences);`)
    // silently drops every cantTell-tier finding whenever at least one
    // fail-tier finding also exists on the same page — a real information
    // loss for a real scan, not just a test artifact: a page with one
    // confident violation and five "needs review" ones would report only
    // the one. Found via aria-prohibited-attr's roleless-naming widening
    // (2026-07-31), then confirmed as the same architectural gap in
    // aria-hidden-focus's runtime-redirect downgrade (same day) via an
    // explicit audit of every automatic rule for this exact two-bucket
    // shape.
    // The correct behavior when a fail-tier finding exists: the overall
    // outcome is still `fail` (a real, confident violation must still gate
    // CI), but BOTH buckets' occurrences are returned together, not just
    // the fail ones — each occurrence already carries its own
    // distinguishing `data.details.reasonCode`/summary/hint, so nothing
    // about which findings were confident vs. which need review is lost;
    // only the single aggregate outcome label stays singular, which was
    // already this engine's accepted one-outcome-per-rule-run schema
    // constraint (changing that is a separate, much larger, cross-cutting
    // decision spanning report.js/baseline.js/explain.js/WCAG rollups —
    // out of scope for this helper).
    function resolveTieredOutcome(failOccurrences, cantTellOccurrences, severity) {
        const fails = Array.isArray(failOccurrences) ? failOccurrences : [];
        const cantTells = Array.isArray(cantTellOccurrences) ? cantTellOccurrences : [];
        if (fails.length) {
            return { outcome: 'fail', severity, occurrences: fails.concat(cantTells) };
        }
        if (cantTells.length) {
            return { outcome: 'cantTell', severity, occurrences: cantTells };
        }
        return { outcome: 'pass', severity: 'minor', occurrences: [] };
    }

    let __contrastSharedCache = {};
    try {
        // In Node/JSDOM checks, the harness sets global.window/global.document.
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
        {window: realmWindow || window, document, root: roots, includeShadowDom, excludeSelectors},
        __contrastShared
    );

    // Expose shared cache to checks (deterministic, in-memory only)
    contrast.sharedCache = __contrastShared.__contrastSharedCache;

    const aria = createAriaHelpers(
        {window: realmWindow || window, document, root: roots},
        {trim}
    );

    // For rules whose check is inherently about the WHOLE page (does the
    // page have a title? a declared language? a way to skip repeated
    // blocks?) rather than about elements found within a scanned subtree --
    // these can't be answered correctly by scoping via queryAllSmart/ctx.root
    // the way per-element checks can, since a subtree that never had (and
    // was never meant to have) e.g. its own <title> shouldn't be faulted for
    // lacking one. `false` when `fragment:true` was explicitly set, or when
    // `contextSelector` scoped this run narrower than the whole document
    // (roots doesn't include document.documentElement); `true` in the
    // default/unscoped case, so this is a no-op for the overwhelming
    // majority of existing (whole-page) scans.
    function isWholeDocumentScope() {
        if (fragment) return false;
        return roots.includes(document.documentElement);
    }

    return {
        // Existing query/snippet utilities
        queryAll,
        queryAllDeep,
        queryAllSmart,
        getOuterHtmlSnippet,
        buildSimpleSelector,
        buildSelector,
        buildStructuralPath,

        // Existing (back-compat)
        hasAccessibleName,
        isExcluded,
        isAccTreeEligible,
        isDomVisibleEligible,
        isWholeDocumentScope,

        // Engine-internal: sets which rule's rule-scoped excludeSelectors
        // (engineOptions.rules[ruleId].excludeSelectors) are currently in
        // effect. Called by dom-runner.js before each rule invocation, not
        // intended for use by rule implementations.
        __setActiveRuleExcludeSelectors,

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

        // Landmark-role naming (aria-label -> aria-labelledby -> title; no content fallback --
        // see getLandmarkNameInfo's own header comment for why this replaced 7 duplicated copies)
        getLandmarkNameInfo,

        // "Does this element have a landmark-scoping ancestor" (role-aware
        // sectioning-content/<main> check backing <header>/<footer>/<aside>'s
        // conditional implicit roles) -- re-exported from aria helpers at
        // this top level, matching getLandmarkNameInfo just above, so the
        // manual landmark-check files that used to each carry their own
        // (buggy, tag-only) copy can call helpers.hasLandmarkScopingAncestor
        // directly. See aria.hasLandmarkScopingAncestor's own header comment
        // in src/core/aria-helpers.js for the full algorithm and rationale.
        hasLandmarkScopingAncestor: aria.hasLandmarkScopingAncestor,

        // Name / description
        getAccessibleNameInfo,
        getAccessibleDescriptionInfo,

        // Text alternatives
        getTextAlternativeInfo,

        // Recursive "name from content" (accname-aligned; see getContentNameInfo header comment)
        getContentNameInfo,

        // Role / focusability
        getRoleInfo,
        getFocusableInfo,
        getVisibilityHintsInfo,

        getAttributeInfo,

        getLabelMethod, getLabelStrength,

        // Flat-tree ancestor walk (assignedSlot-aware, then shadow host) —
        // see this function's own definition above for why assignedSlot
        // must win over parentNode.
        composedParent,

        // Perf counters (only populated when opts.perfStats === true)
        getPerfStats,
        resetPerfStats,

        reportOccurrence,
        resolveTieredOutcome,

        contrast,
        aria
    };
}

module.exports = {
    normalizeSelectorList,
    resolveContextRoots,
    createDomHelpers
};
