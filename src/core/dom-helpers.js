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
    const root = opts && opts.root ? opts.root : null;
    const includeShadowDom = !!(opts && opts.includeShadowDom);
    const excludeSelectors = Array.isArray(opts && opts.excludeSelectors) ? opts.excludeSelectors : [];

    // --- eligibility utilities ---
    const isElement = (n) => !!n && n.nodeType === 1;
    const computedStyle = (el) => {
        try { return window && window.getComputedStyle ? window.getComputedStyle(el) : (el && el.style) || {}; }
        catch { return {}; }
    };
    const getRootNodeSafe = (n) => {
        try { return n && n.getRootNode ? n.getRootNode({ composed: true }) : (document || null); }
        catch { return document || null; }
    };
    const composedParent = (n) => {
        if (!n) return null;
        const p = n.parentNode || (n.assignedSlot ? n.assignedSlot : null);
        if (p) return p;
        const rn = getRootNodeSafe(n);
        return rn && rn.host ? rn.host : null;
    };
    const ancestorsIncludingSelf = (n) => {
        const out = [];
        let cur = n, guard = 0;
        while (cur && guard++ < 200) { out.push(cur); cur = composedParent(cur); }
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
        try { return el && el.getAttribute ? el.getAttribute(name) : null; }
        catch { return null; }
    };

    function parseTabIndex(el) {
        const raw = getAttr(el, 'tabindex');
        const t = trim(raw);
        if (raw == null || t === '') return { has: false, value: null, valid: false };
        const n = Number(t);
        if (Number.isNaN(n)) return { has: true, value: null, valid: false };
        return { has: true, value: n, valid: true };
    }

    function getPlatformFocusability(el) {
        if (!isElement(el)) {
            return { focusable:false, tabbable:false, mechanism:'none', flags:['notElement'] };
        }
        if (hasBlockingInert(el)) {
            return { focusable:false, tabbable:false, mechanism:'none', flags:['inert'] };
        }

        const flags = [];
        const disabled = !!(el.matches && el.matches(':disabled'));
        if (disabled) return { focusable: false, tabbable: false, mechanism: 'disabled', flags: ['disabled'] };

        const ti = parseTabIndex(el);
        if (ti.has) {
            if (!ti.valid) return { focusable: false, tabbable: false, mechanism: 'tabindex', flags: ['tabindex-invalid'] };
            if (ti.value < 0) return { focusable: true, tabbable: false, mechanism: 'tabindex', flags: ['tabindex-negative'] };
            return { focusable: true, tabbable: true, mechanism: 'tabindex', flags: ['tabindex-nonnegative'] };
        }

        // native focusability
        // (keep your existing logic here; when it returns true, consider it tabbable)
        const native = isPlatformFocusable(el); // uses your existing boolean logic
        if (native) return { focusable: true, tabbable: true, mechanism: 'native', flags };

        return { focusable: false, tabbable: false, mechanism: 'none', flags };
    }

    // --- attribute ---
    function getAttributeInfo(el, attr) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const attrValue = trim(getAttr(el, attr));
        if (!attrValue) return { present: false, value: '', mechanism: attr, flags: ['empty'] };

        return { present: true, value: attrValue, mechanism: attr, flags };
    }

    // --- ARIA name primitives (reusable across rules) ---
    function getAriaLabelInfo(el) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const ariaLabel = trim(getAttr(el, 'aria-label'));
        if (!ariaLabel) return { present: false, value: '', mechanism: 'aria-label', flags: ['empty'] };

        return { present: true, value: ariaLabel, mechanism: 'aria-label', flags };
    }

    function getAriaLabelledByInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const ariaLabelledBy = trim(getAttr(el, 'aria-labelledby'));
        if (!ariaLabelledBy) return { present: false, value: '', mechanism: 'aria-labelledby', flags: ['missing'] };

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
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const lb = getAriaLabelledByInfo(el, _ctx, opts);
        if (lb.present && lb.value) return { present: true, value: lb.value, mechanism: 'aria-labelledby', flags: flags.concat(lb.flags || []) };

        const al = getAriaLabelInfo(el);
        if (al.present && al.value) return { present: true, value: al.value, mechanism: 'aria-label', flags: flags.concat(al.flags || []) };

        // If aria-labelledby existed but was empty/unresolvable, preserve that info in flags.
        if (trim(getAttr(el, 'aria-labelledby'))) flags.push('aria-labelledby-empty-or-unresolvable');
        if (getAttr(el, 'aria-label') != null && !trim(getAttr(el, 'aria-label'))) flags.push('aria-label-empty');

        return { present: false, value: '', mechanism: 'none', flags };
    }

    const lower = (v) => trim(v).toLowerCase();

    const safeDocGetById = (id) => {
        try {
            if (document && document.getElementById) return document.getElementById(id);
        } catch {}
        return null;
    };

    const safeRootQueryById = (id) => {
        // Best-effort for cases where root is not the document (e.g. shadow root-like, fragment roots).
        // Note: IDs are document-global in HTML, but test harnesses may use scoped roots.
        if (!root || !root.querySelector) return null;
        try { return root.querySelector('#' + id); } catch { return null; }
    };

    function inClosedDetailsContent(node) {
        try {
            if (!isElement(node)) return false;
            const summary = node.closest && node.closest('summary');
            if (summary && summary.contains(node)) return false;
            const details = node.closest && node.closest('details');
            if (details && !details.hasAttribute('open')) return true;
        } catch {}
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
                    const esc = (s) => {
                        try { return window && window.CSS && typeof window.CSS.escape === 'function' ? window.CSS.escape(s) : s; }
                        catch { return s; }
                    };
                    const n = esc(rawName);

                    // Be practical: accept both "#name" and "name", and ignore case.
                    const sels = [
                        `img[usemap="#${n}" i]`,
                        `img[usemap="${n}" i]`
                    ];

                    for (const sel of sels) {
                        try {
                            if (document.querySelector(sel)) return true;
                        } catch {}
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

    function isReferencedByVisibleIdRef(node) {
        if (!document || !isElement(node)) return false;
        const id = node.getAttribute && node.getAttribute('id');
        if (!id || !id.trim()) return false;
        const esc = (s) => {
            try { return window && window.CSS && typeof window.CSS.escape === 'function' ? window.CSS.escape(s) : s; }
            catch { return s; }
        };
        const idSel = esc(id.trim());
        const refs = [
            ...Array.from(document.querySelectorAll('[aria-labelledby~="' + idSel + '"]')),
            ...Array.from(document.querySelectorAll('[aria-describedby~="' + idSel + '"]')),
        ];
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
        const results = [];
        const seen = new Set();

        function pushAll(node) {
            if (!node || !node.querySelectorAll) return;
            let els = [];
            try {
                els = Array.from(node.querySelectorAll(sel));
            } catch {
                els = [];
            }
            for (const el of els) {
                if (el && !seen.has(el) && !isExcluded(el)) {
                    seen.add(el);
                    results.push(el);
                }
            }
        }

        function walk(node) {
            if (!node) return;
            if (node.nodeType === 1 && isExcluded(node)) return;

            pushAll(node);

            let all = [];
            try {
                all = node.querySelectorAll ? Array.from(node.querySelectorAll('*')) : [];
            } catch {
                all = [];
            }

            for (const el of all) {
                if (el && el.shadowRoot) walk(el.shadowRoot);
            }
        }

        walk(root);
        return results;
    }

    function queryAllSmart(sel) {
        const list = includeShadowDom ? queryAllDeep(sel) : queryAll(sel);
        return excludeSelectors.length ? list.filter((el) => !isExcluded(el)) : list;
    }

    function getOuterHtmlSnippet(el) {
        if (!el || typeof el !== 'object') return '';
        try {
            const html = el.outerHTML || '';
            if (html.length > 2000) return html.slice(0, 2000) + '…';
            return html;
        } catch {
            return '';
        }
    }

    // --- Accessibility-tree eligibility (ordered checks) ---
    function isAccTreeEligible(node) {
        const reasons = [];
        if (!isElement(node)) return { eligible: false, reasons: ['notElement'] };

        // If shadow traversal is disabled and node is outside root, treat as non-composed
        if (root && !includeShadowDom) {
            try { if (!root.contains(node)) return { eligible: false, reasons: ['nonComposed'] }; } catch {}
        }

        const chain = ancestorsIncludingSelf(node);

        // 1) HTML/DOM hiding
        for (const a of chain) {
            if (!isElement(a)) continue;
            if (a.hasAttribute && a.hasAttribute('hidden')) return { eligible: false, reasons: ['hiddenAttr'] };
            const tn = (a.tagName || '').toLowerCase();
            if (tn === 'template') return { eligible: false, reasons: ['templateContent'] };
            if (tn === 'script' || tn === 'style' || tn === 'meta' || tn === 'link' || tn === 'noscript') {
                return { eligible: false, reasons: ['nonRenderedElement'] };
            }
            if (tn === 'input') {
                const t = (a.getAttribute && (a.getAttribute('type') || '').toLowerCase()) || '';
                if (t === 'hidden') return { eligible: false, reasons: ['inputHidden'] };
            }
        }
        if (inClosedDetailsContent(node)) return { eligible: false, reasons: ['detailsClosed'] };

        // 2) Inertness / modality
        if (hasBlockingInert(node)) {
            return { eligible: false, reasons: ['inert'] };
        }
        // Modal dialog (best effort)
        try {
            const openModals = document ? Array.from(document.querySelectorAll('dialog[open][aria-modal="true"]')) : [];
            if (openModals.length) {
                let inside = false;
                for (const d of openModals) { if (d.contains(node)) { inside = true; break; } }
                if (!inside) return { eligible: false, reasons: ['modalInert'] };
            }
        } catch {}

        // 3) CSS rendering suppression
        for (const a of chain) {
            if (!isElement(a)) continue;

            // <area> is a non-rendered element; some DOMs report display:none for it.
            // Don’t treat the *area itself* as ineligible based on computed style.
            if (a === node) {
                const tn = (a.tagName || '').toLowerCase();
                if (tn === 'area') continue;
            }

            const cs = computedStyle(a);
            if (cs && cs.display === 'none') return { eligible: false, reasons: ['displayNone'] };
            if (cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse')) {
                return { eligible: false, reasons: ['visibilityHidden'] };
            }
        }

        // 4) ARIA subtree hiding with exceptions
        let ariaHidden = false;
        for (const a of chain) {
            if (!isElement(a)) continue;
            const v = a.getAttribute && a.getAttribute('aria-hidden');
            if (v != null && String(v).trim().toLowerCase() === 'true') { ariaHidden = true; break; }
        }
        if (ariaHidden) {
            const f = getPlatformFocusability(node);
            const idref = isReferencedByVisibleIdRef(node);

            // IDREF exception stays
            if (idref) return { eligible: true, reasons: ['ariaHiddenOverriddenIdref'] };

            // Only tabbable focus overrides aria-hidden
            if (f && f.tabbable) return { eligible: true, reasons: ['ariaHiddenOverriddenTabbable'] };

            // Programmatic focus (tabindex < 0) does NOT override eligibility
            if (f && f.focusable && !f.tabbable) {
                return { eligible: false, reasons: ['ariaHiddenProgrammaticFocusExcluded'] };
            }

            return { eligible: false, reasons: ['ariaHidden'] };
        }

        // 5/6 handled implicitly; 7 already covered
        return { eligible: true, reasons };
    }

    // A) wrapper: standardized eligibility info for logging
    function getEligibilityInfo(node, _ctx, opts) {
        const targetSet = opts && (opts.targetSet === 'acc' || opts.targetSet === 'dom') ? opts.targetSet : 'dom';
        const r = isAccTreeEligible(node); // signature-safe
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
        if (!raw) return { refs: [], missing: [], flags: ['empty'] };

        const parts = raw.split(/\s+/).filter(Boolean);
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
        if (opts && opts.maxRefs && refs.length > opts.maxRefs) {
            // deterministic truncation if requested
            refs.length = Math.max(0, Number(opts.maxRefs) | 0);
            flags.push('truncated');
        }

        return { refs, missing, flags };
    }

    function getTextFromIdRefs(idrefString, _ctx, opts) {
        const r = resolveIdRefs(idrefString, _ctx, opts);
        const texts = [];
        for (const el of r.refs) {
            try {
                const t = trim(el.textContent);
                if (t) texts.push(t);
            } catch {}
        }
        const text = trim(texts.join(' '));
        const flags = r.flags.slice(0);
        if (!text && r.refs.length) flags.push('resolved-empty-text');
        return { text, refsCount: r.refs.length, missing: r.missing.slice(0), flags };
    }

    // B) Accessible name / description helpers (mechanism-first, but scoped & deterministic)
    function getAccessibleNameInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const aria = getAriaNameInfo(el, _ctx, opts);
        if (aria && aria.present && aria.value) {
            return { present: true, value: aria.value, mechanism: aria.mechanism, flags: flags.concat(aria.flags || []) };
        }
        if (aria && aria.flags && aria.flags.length) {
            for (const f of aria.flags) flags.push(f);
        }

        // Explicit <label for="..."> or wrapping <label> (common and deterministic for form controls)
        // Note: This is not a full Accessible Name Computation; it is a pragmatic, stable subset.
        const id = trim(getAttr(el, 'id'));
        if (id && document && document.querySelector) {
            try {
                // Avoid CSS.escape reliance for determinism/availability; do best effort.
                const sel = 'label[for="' + id.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]';
                const label = document.querySelector(sel);
                const lt = label ? trim(label.textContent) : '';
                if (lt) return { present: true, value: lt, mechanism: 'label', flags };
            } catch {}
        }
        if (el.closest) {
            try {
                const wrap = el.closest('label');
                const wt = wrap ? trim(wrap.textContent) : '';
                if (wt) return { present: true, value: wt, mechanism: 'label', flags };
            } catch {}
        }

        // Optionally allow contents-based names for obvious elements.
        // Default: allow for <button>, <a>, <summary> (very common, deterministic).
        const allowContents = !(opts && opts.disallowContents === true);
        if (allowContents) {
            const tag = lower(el.tagName);
            const isContentsNamed =
                tag === 'button' ||
                tag === 'a' ||
                tag === 'summary';
            if (isContentsNamed) {
                const ct = trim(el.textContent);
                if (ct) return { present: true, value: ct, mechanism: 'contents', flags };
            }
        }

        const title = trim(getAttr(el, 'title'));
        if (title) {
            flags.push('title-used');
            return { present: true, value: title, mechanism: 'title', flags };
        }

        return { present: false, value: '', mechanism: 'none', flags };
    }

    function getAccessibleDescriptionInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { present: false, value: '', mechanism: 'unsupported', flags: ['notElement'] };

        const describedBy = trim(getAttr(el, 'aria-describedby'));
        if (describedBy) {
            const t = getTextFromIdRefs(describedBy, _ctx, opts);
            for (const f of t.flags) flags.push(f);
            if (t.text) return { present: true, value: t.text, mechanism: 'aria-describedby', flags };
            flags.push('empty');
            // fall through
        }

        const allowTitle = !!(opts && opts.allowTitle === true);
        if (allowTitle) {
            const title = trim(getAttr(el, 'title'));
            if (title) {
                flags.push('title-used');
                return { present: true, value: title, mechanism: 'title', flags };
            }
        }

        return { present: false, value: '', mechanism: 'none', flags };
    }

    // C) Text alternative helper (mechanism-aware by element/type)
    function getTextAlternativeInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) {
            return { present: false, value: '', mechanism: 'unsupported', requiredMechanism: 'unknown', flags: ['notElement'] };
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

        return { present: false, value: '', mechanism: 'unsupported', requiredMechanism: 'unknown', flags: ['unsupported-element'] };
    }

    // D) Role + focusability helpers
    function getRoleInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { role: '', source: 'none', flags: ['notElement'] };

        const explicit = trim(getAttr(el, 'role'));
        if (explicit) {
            const v = explicit;
            const low = v.toLowerCase();
            if (low === 'presentation' || low === 'none') flags.push('presentation');
            // Minimal sanity: role token should not contain spaces beyond role list; keep deterministic
            if (/\s/.test(v)) flags.push('multiple-roles');
            return { role: v, source: 'explicit', flags };
        }

        const allowImplicit = !(opts && opts.disallowImplicit === true);
        if (!allowImplicit) return { role: '', source: 'none', flags };

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

        if (role) return { role, source: 'implicit', flags };
        return { role: '', source: 'none', flags };
    }

    function getFocusableInfo(el, _ctx, opts) {
        const flags = [];
        if (!isElement(el)) return { focusable: false, tabbable: false, mechanism: 'none', flags: ['notElement'] };

        const pf = getPlatformFocusability(el); // returns focusable + tabbable + mechanism + flags
        // Merge flags deterministically
        const outFlags = []
            .concat(Array.isArray(flags) ? flags : [])
            .concat(Array.isArray(pf.flags) ? pf.flags : []);

        return {
            focusable: !!pf.focusable,
            tabbable: !!pf.tabbable,
            mechanism: pf.mechanism || 'none',
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

        return { idCount, testIdCount, nameCount, ariaLabelCount, roleAriaLabelCount };
    }

    function buildSimpleSelector(el, fallbackTag) {
        try {
            if (!el || el.nodeType !== 1) return fallbackTag || 'html';

            const tag = (el.tagName || fallbackTag || 'html').toLowerCase();

            const cssEscapeIdent = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {}
                return String(s).replace(/[^a-zA-Z0-9\\-_]/g, '\\$&');
            };

            const escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

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

    let __uniqIndex = null;
    function getUniqIndex() {
        if (__uniqIndex) return __uniqIndex;
        __uniqIndex = createSelectorUniqIndex();
        return __uniqIndex;
    }

    function buildSelector(el) {
        const escapeAttrValue = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        try {
            if (!el || el.nodeType !== 1) return 'html';

            const cssEscape = (s) => {
                try {
                    if (window && window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(s));
                } catch {}
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
                sib = node.previousElementSibling;
                while (sib) {
                    if ((sib.tagName || '').toLowerCase() === t) { hasSame = true; break; }
                    sib = sib.previousElementSibling;
                }
                if (!hasSame) {
                    sib = node.nextElementSibling;
                    while (sib) {
                        if ((sib.tagName || '').toLowerCase() === t) { hasSame = true; break; }
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
            } catch {}

            return buildSimpleSelector(el, tag || 'html');
        } catch {
            return 'html';
        }
    }

    function getNonEmptyTitle(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'title');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch { return null; }
    }

    function getNonEmptyPlaceholder(el) {
        if (!getAttributeInfo) return null;
        try {
            const info = getAttributeInfo(el, 'placeholder');
            const v = info && info.present ? trim(info.value) : '';
            return v ? v : null;
        } catch { return null; }
    }

    function getLabelMethod(el) {
        // returns { method, value } where value is best-effort text, deterministically trimmed
        if (hasLabelAssociation(el)) return { method: 'label', value: null };

        if (getAriaLabelledByInfo) {
            try {
                const info = getAriaLabelledByInfo(el, ctx, { maxRefs: 8 });
                const v = info && info.present ? trim(info.value) : '';
                if (v) return { method: 'aria-labelledby', value: v };
            } catch {}
        }

        if (getAriaLabelInfo) {
            try {
                const info = getAriaLabelInfo(el, ctx);
                const v = info && info.present ? trim(info.value) : '';
                if (v) return { method: 'aria-label', value: v };
            } catch {}
        }

        const titleV = getNonEmptyTitle(el);
        if (titleV) return { method: 'title', value: titleV };

        const phV = getNonEmptyPlaceholder(el);
        if (phV) return { method: 'placeholder', value: phV };

        return { method: 'none', value: null };
    }

    function getLabelStrength(method) {
        // policy choice; this is deterministic and tweakable
        if (method === 'label' || method === 'aria-labelledby') return 'strong';
        if (method === 'aria-label') return 'medium';
        if (method === 'title' || method === 'placeholder') return 'weak';
        return 'none';
    }

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

        // Eligibility info wrapper
        getEligibilityInfo,

        // IDREF primitives
        resolveIdRefs,
        getTextFromIdRefs,

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

        getLabelMethod
    };
}

module.exports = {
    normalizeSelectorList,
    createDomHelpers
};
