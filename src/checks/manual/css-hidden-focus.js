'use strict';

/**
 * @check a11ycore-css-hidden-focus
 * @atomic true
 * @summary focusable elements must be visible to sighted keyboard users
 * @standard WCAG 2.2
 * @sc 2.4.7
 * @applicability
 *   Applies to elements that are tabbable (keyboard-focusable) but are visually hidden
 *   via CSS techniques that can leave them in the tab order.
 * @expectation
 *   No element should be tabbable while visually hidden (e.g., opacity:0, clipped, off-screen).
 *
 * Notes:
 * - This rule intentionally targets CSS techniques that *can* keep an element focusable.
 * - Elements removed from rendering (display:none, visibility:hidden, [hidden]) are excluded.
 * - The rule uses deterministic heuristics (computed style parsing) and does not rely on layout geometry.
 */

const id = 'a11ycore-css-hidden-focus';

const meta = {
    title: 'Focusable elements must not be visually hidden',
    description:
        'Checks that keyboard-focusable elements are not visually hidden by CSS techniques that can leave them in the tab order.',
    i18n: {
        titleKey: 'a11ycore_cssHidden_focus_title',
        descriptionKey: 'a11ycore_cssHidden_focus_description'
    },
    helpUrl: null,
    tags: ['wcag2aa', 'wcag247', 'navigation', 'focus', 'css', 'atomic', 'manual'],
    wcagSc: ['2.4.7'],
    normativeMappings: [
        {standard: 'WCAG', version: '2.2', requirement: '2.4.7', title: 'Focus Visible', conformanceLevel: 'AA'}
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
    const {document, root, helpers, rule} = ctx;
    const safeRoot = root || document;

    const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
    const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
    const isDomVisibleEligible = helpers && typeof helpers.isDomVisibleEligible === 'function' ? helpers.isDomVisibleEligible : null;
    const reportOccurrence = helpers && typeof helpers.reportOccurrence === 'function' ? helpers.reportOccurrence : null;

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
            if (safeRoot && typeof safeRoot.querySelectorAll === 'function') return Array.from(safeRoot.querySelectorAll(sel));
        } catch {
            // fall through
        }
        return [];
    }

    function getComputedStyleSafe(el) {
        try {
            const w = (document && document.defaultView) ? document.defaultView : (typeof window !== 'undefined' ? window : null);
            return w && w.getComputedStyle ? w.getComputedStyle(el) : null;
        } catch {
            return null;
        }
    }

    // Returns deterministic "visually hidden but can remain focusable" hints.
    function getVisibilityHints(el) {
        const out = [];
        if (!el) return out;
        const cs = getComputedStyleSafe(el);

        // opacity:0
        try {
            const rawOp = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
            const op = rawOp ? Number.parseFloat(rawOp) : 1;
            if (Number.isFinite(op) && op <= 0.0001) out.push('opacityZero');
        } catch {
        }

        // clip / clip-path
        try {
            const clip = cs && cs.clip != null ? String(cs.clip).trim() : '';
            const clipPath = cs && cs.clipPath != null ? String(cs.clipPath).trim() : '';
            const clipLow = (clip || '').toLowerCase();
            const clipPathLow = (clipPath || '').toLowerCase();

            if (clipLow && clipLow !== 'auto') {
                if (clipLow.indexOf('rect(') !== -1 && clipLow.replace(/\s+/g, '').indexOf('rect(0') !== -1) out.push('clipped');
            }
            if (clipPathLow && clipPathLow !== 'none') {
                if (clipPathLow.indexOf('inset(') !== -1 && (clipPathLow.indexOf('100%') !== -1 || clipPathLow.indexOf('50%') !== -1)) {
                    out.push('clipped');
                }
            }
        } catch {
        }

        // zero-size + overflow hidden/clip
        try {
            const wv = cs && cs.width != null ? String(cs.width).trim() : '';
            const hv = cs && cs.height != null ? String(cs.height).trim() : '';
            const ov = cs && cs.overflow != null ? String(cs.overflow).trim().toLowerCase() : '';
            const isZeroW = wv === '0px' || wv === '0';
            const isZeroH = hv === '0px' || hv === '0';
            const hidesOverflow = ov === 'hidden' || ov === 'clip';
            if ((isZeroW || isZeroH) && hidesOverflow) out.push('zeroSizeOverflowHidden');
        } catch {
        }

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
        } catch {
        }

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

    function getFocusableInfoSafe(el) {
        if (!getFocusableInfo) return null;
        try {
            return getFocusableInfo(el, ctx);
        } catch {
            return null;
        }
    }

    function isTabbable(el, info) {
        const f = info || getFocusableInfoSafe(el);
        return !!(f && f.focusable && f.tabbable);
    }

    // Exclude elements that are not rendered / not in the visual rendering tree.
    function isRendered(el) {
        if (!isDomVisibleEligible) return true;
        try {
            const vis = isDomVisibleEligible(el, ctx, {visibilityMode: 'styleOnly', disableGeometry: true});
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
  const candidates = qAll('a[href],area[href],button,input,select,textarea,summary,[tabindex],[contenteditable]');
  if (!candidates.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];

  for (const el of candidates) {
    if (!el || !el.getAttribute) continue;

    const finfo = getFocusableInfoSafe(el);
    if (!isTabbable(el, finfo)) continue;

    // Skip elements not rendered (display:none, visibility:hidden, [hidden], etc.)
    if (!isRendered(el)) continue;

    const hints = getVisibilityHints(el);
    if (!hints.length) continue; // <-- applicability gate

    const tagName = (() => { try { return lower(el.tagName || ''); } catch { return ''; } })();

    const hintOrder = ['opacityZero', 'offscreen', 'clipped', 'zeroSizeOverflowHidden'];
    const hintsArr = [];
    for (const k of hintOrder) if (hints.includes(k)) hintsArr.push(k);

    const baseOccurrence = {
      summary: `Focusable ${tagName} appears visually hidden (${hintsArr.join(',')}). Verify it becomes visible on keyboard focus.`,
      hint: 'Manually tab to the element and confirm a visible focus indicator and that the element is visible when focused. If it remains hidden while focused, fix CSS/JS so it becomes visible or is removed from the tab order until visible.',
      i18n: {
        summaryKey: 'a11ycore_cssHidden_focus_summary_cantTell',
        hintKey: 'a11ycore_cssHidden_focus_hint_cantTell',
        params: { element: tagName, visibilityHints: hintsArr.join(',') }
      },
      data: {
        details: {
          reasonCode: 'cssHiddenTabbable_needsFocusStateVerification',
          metrics: { visibilityHints: hintsArr.slice(0) }
        }
      }
    };

    occurrences.push(
        reportOccurrence ? reportOccurrence(el, baseOccurrence) : { __node: el, selector: '', html: '', ...baseOccurrence }
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

module.exports = {id, meta, runInPage};
