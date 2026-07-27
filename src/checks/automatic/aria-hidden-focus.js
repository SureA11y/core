'use strict';

/**
 * @check aria-hidden-focus
 * @atomic true
 * @summary aria-hidden elements must not be focusable or contain focusable elements
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements that have aria-hidden="true".
 * @expectation
 *   No element with aria-hidden="true" may itself be focusable, and no focusable element
 *   may exist within an aria-hidden="true" subtree.
 *
 * Notes on parity with a widely-used reference engine's aria-hidden-focus check:
 * - Focusability is computed via ctx.helpers.getFocusableInfo (native + tabindex + contenteditable).
 * - Elements that are not rendered (e.g., display:none, visibility:hidden, [hidden]) are excluded.
 * - Elements hidden via CSS in ways that still allow keyboard focus (e.g., opacity:0, off-screen, clip)
 *   remain in-scope and will be flagged when focusable.
 */

const id = 'aria-hidden-focus';

const meta = {
  title: 'ARIA hidden elements must not be focusable',
  description:
    'Checks that aria-hidden="true" elements are not focusable and do not contain focusable descendants.',
  i18n: {
    titleKey: 'ariaHidden_focus_title',
    descriptionKey: 'ariaHidden_focus_description'
  },
  helpUrl: null,
  // NOTE: taxonomy contract requires exactly one content category tag.
  // This rule is about ARIA subtree exposure / structural AT tree consistency.
  tags: ['wcag2a', 'wcag2aa', 'wcag412', 'structure', 'aria', 'focus', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '2.4.7', title: 'Focus Visible', conformanceLevel: 'AA' },
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '4.1.2': ['aria-hidden-focusable']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;

  const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  // Used only to exclude non-rendered elements; we explicitly DO NOT exclude opacity:0.
  const isDomVisibleEligible = helpers && typeof helpers.isDomVisibleEligible === 'function' ? helpers.isDomVisibleEligible : null;

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  // Prefer helper occurrence wrapper so the engine can attach selector/snippet later.
  const reportOccurrence = helpers && typeof helpers.reportOccurrence === 'function'
    ? helpers.reportOccurrence
    : null;

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

  // Flat-tree ancestor walk (assignedSlot wins over parentNode, then shadow
  // host) — shared with every other rule via ctx.helpers.composedParent
  // (src/core/dom-helpers.js), not reimplemented here, so a fix to the one
  // canonical definition can't drift out of sync with this rule's copy.
  const composedParent = helpers && typeof helpers.composedParent === 'function'
    ? helpers.composedParent
    : function (n) { return n && n.parentElement ? n.parentElement : null; };

  function closestAriaHiddenTrue(node) {
    let cur = node;
    let guard = 0;
    while (cur && guard++ < 200) {
      try {
        if (cur.getAttribute) {
          const v = cur.getAttribute('aria-hidden');
          if (v != null && lower(v) === 'true') return cur;
        }
      } catch {
        // ignore
      }
      cur = composedParent(cur);
    }
    return null;
  }

  // Lightweight "invisible but still focusable" hints.
  // Only computed for a capped set of offenders per aria-hidden root.
  function getVisibilityHints(el) {
    const out = [];
    if (!el) return out;

    let cs = null;
    try {
      const w = (document && document.defaultView) ? document.defaultView : (typeof window !== 'undefined' ? window : null);
      cs = w && w.getComputedStyle ? w.getComputedStyle(el) : null;
    } catch {
      cs = null;
    }

    // opacity:0 (still focusable)
    try {
      const rawOp = cs && cs.opacity != null ? String(cs.opacity).trim() : '';
      const op = rawOp ? Number.parseFloat(rawOp) : 1;
      if (Number.isFinite(op) && op <= 0.0001) out.push('opacityZero');
    } catch {
      // ignore
    }

    // clip / clip-path (still focusable)
    try {
      const clip = cs && cs.clip != null ? String(cs.clip).trim() : '';
      const clipPath = cs && cs.clipPath != null ? String(cs.clipPath).trim() : '';
      const clipLow = (clip || '').toLowerCase();
      const clipPathLow = (clipPath || '').toLowerCase();

      // Common visually-hidden patterns
      if (clipLow && clipLow !== 'auto') {
        // Examples: rect(0px, 0px, 0px, 0px) / rect(0,0,0,0)
        if (clipLow.indexOf('rect(') !== -1 && clipLow.replace(/\s+/g, '').indexOf('rect(0') !== -1) out.push('clipped');
      }
      if (clipPathLow && clipPathLow !== 'none') {
        // Examples: inset(100%) / inset(50%)
        if (clipPathLow.indexOf('inset(') !== -1 && (clipPathLow.indexOf('100%') !== -1 || clipPathLow.indexOf('50%') !== -1)) {
          out.push('clipped');
        }
      }
    } catch {
      // ignore
    }

    // zero-size + overflow hidden/clip (still focusable)
    try {
      const wv = cs && cs.width != null ? String(cs.width).trim() : '';
      const hv = cs && cs.height != null ? String(cs.height).trim() : '';
      const ov = cs && cs.overflow != null ? String(cs.overflow).trim().toLowerCase() : '';
      const isZeroW = wv === '0px' || wv === '0';
      const isZeroH = hv === '0px' || hv === '0';
      const hidesOverflow = ov === 'hidden' || ov === 'clip';
      if ((isZeroW || isZeroH) && hidesOverflow) out.push('zeroSizeOverflowHidden');
    } catch {
      // ignore
    }

    // Off-screen heuristic (still focusable)
    // Deterministic string parsing; does not require layout geometry.
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
      // Common text-indent technique
      if (ind != null && ind <= -5000) out.push('offscreen');
    } catch {
      // ignore
    }

    // Dedup while preserving stable order
    const seen = new Set();
    const uniq = [];
    for (const k of out) {
      const kk = String(k);
      if (!seen.has(kk)) { seen.add(kk); uniq.push(kk); }
    }
    return uniq;
  }

  // DOM-visibility gate to avoid false positives:
  // Exclude structural/CSS hidden cases that prevent focus (display:none, visibility:hidden, hidden attr, etc.).
  // IMPORTANT: Do NOT exclude opacity-based invisibility; opacity:0 remains in-scope.
  function isActuallyFocusable(el) {
    if (!el || !el.getAttribute) return false;

    // Hard blockers that should always win (even if fallback logic would say "focusable")
    if (hasInertAncestor(el)) return false;
    if (isDisabledFormControl(el)) return false;

    // An explicit negative tabindex removes the element from the keyboard
    // tab sequence entirely, regardless of tag — the standard, WAI-
    // recommended technique for safely hiding focusable content behind
    // aria-hidden (verified against a widely-used reference engine's own aria-hidden-focus check,
    // which requires tabbability — not raw focusability — via its
    // `focusable-not-tabbable` sub-check; confirmed via a real page:
    // Wikipedia's sticky header uses <button tabindex="-1">/<a tabindex="-1">
    // inside aria-hidden divs, a correct pattern this rule was previously
    // flagging as a false positive). Such an element is still
    // programmatically focusable (script could call .focus()), but that's
    // not what "no focusable content behind aria-hidden" cares about.
    const explicitTabindex = trim(el.getAttribute('tabindex'));
    if (explicitTabindex !== '' && !Number.isNaN(Number(explicitTabindex)) && Number(explicitTabindex) < 0) {
      return false;
    }

    // 1) "DOM focusability" check (ignore aria-hidden)
    // Prefer helper for broad coverage, but do not let aria-hidden flip focusable->false.
    let helperInfo = null;
    if (getFocusableInfo) {
      try { helperInfo = getFocusableInfo(el, ctx); } catch { helperInfo = null; }
    }

    // Local fallback that does NOT care about aria-hidden
    const tag = lower(el.tagName || '');
    let fallbackFocusable = false;

    if (tag === 'a' || tag === 'area') {
      const href = trim(el.getAttribute('href'));
      fallbackFocusable = !!href;
    } else if (tag === 'button' || tag === 'select' || tag === 'textarea' || tag === 'summary') {
      fallbackFocusable = true;
    } else if (tag === 'input') {
      const type = lower(el.getAttribute('type') || '');
      fallbackFocusable = type !== 'hidden';
    } else if (tag === 'iframe') {
      fallbackFocusable = true;
    } else if ((tag === 'audio' || tag === 'video') && el.hasAttribute && el.hasAttribute('controls')) {
      fallbackFocusable = true;
    } else if (el.hasAttribute && el.hasAttribute('contenteditable')) {
      // contenteditable="false" explicitly disables the editing host and
      // does not by itself add the element to the tab order; only treat
      // presence/""/"true"/"plaintext-only" as focus-enabling.
      const ceVal = lower(trim(el.getAttribute('contenteditable')));
      fallbackFocusable = ceVal !== 'false';
    } else {
      const ti = el.getAttribute('tabindex');
      const s = trim(ti);
      if (ti != null && s !== '' && !Number.isNaN(Number(s))) {
        fallbackFocusable = true; // tabindex makes it programmatically focusable
      }
    }

    // Use helper focusable if it says true; otherwise use fallback focusable.
    // This specifically prevents aria-hidden from suppressing "self focusable".
    const focusable = (helperInfo && helperInfo.focusable === true) || fallbackFocusable;
    if (!focusable) return false;

    // 2) exclude non-rendered / non-visible-by-style blockers
    // IMPORTANT: Do NOT exclude opacity-based invisibility; opacity:0 remains in-scope.
    if (isDomVisibleEligible) {
      try {
        const vis = isDomVisibleEligible(el, ctx, { visibilityMode: 'styleOnly', disableGeometry: true });
        if (vis && vis.eligible === false) {
          const rs = Array.isArray(vis.reasons) ? vis.reasons : [];
          const nonOpacity = rs.filter((r) => String(r) !== 'opacityZero');
          if (nonOpacity.length) return false;
        }
      } catch {
        // ignore
      }
    }

    return true;
  }

  function hasInertAncestor(el) {
    let cur = el;
    let guard = 0;
    while (cur && guard++ < 200) {
      try {
        if (cur.nodeType === 1 && cur.hasAttribute && cur.hasAttribute('inert')) return true;
      } catch {
        // ignore
      }
      cur = composedParent(cur);
    }
    return false;
  }

  function isDisabledFormControl(el) {
    try {
      // Covers button/input/select/textarea/option/optgroup/fieldset etc.
      if (typeof el.disabled === 'boolean' && el.disabled) return true;
    } catch {
      // ignore
    }
    try {
      const tag = lower(el.tagName || '');
      if ((tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea' || tag === 'option' || tag === 'optgroup') &&
          el.hasAttribute && el.hasAttribute('disabled')) {
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  // 1) Find aria-hidden="true" roots.
  const ariaHiddenRoots = qAll('[aria-hidden="true"]');
  if (!ariaHiddenRoots.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // 2) Find focusable candidates once (performance) and bucket those inside aria-hidden.
  // Keep selector fairly small to avoid huge candidate sets while still covering the reference-engine cases.
  const focusableCandidates = qAll(
    'a[href],area[href],button,input,select,textarea,summary,iframe,audio[controls],video[controls],[tabindex],[contenteditable]'
  );

  const bucket = new Map(); // ariaHiddenRoot -> { rootEl, count, offenders: [], hints:Set, rootIsFocusable }
  const maxOffendersPerRoot = 5;

  for (let i = 0; i < focusableCandidates.length; i++) {
    const el = focusableCandidates[i];
    if (!el || !el.getAttribute) continue;

    // Cheap check first: a plain ancestor-attribute walk with no CSS
    // computation, vs. isActuallyFocusable's getComputedStyle-per-ancestor
    // cost. Both conditions are required (AND), so checking whichever is
    // cheaper first cannot change which elements end up in the bucket —
    // it only skips the expensive check for the (typically vast) majority
    // of focusable candidates that were never inside an aria-hidden root
    // in the first place. On a real page with a large focusable-candidate
    // count and a complex stylesheet (Daily Mail: ~1400 links, ~3600 CSS
    // rules), this cut this check's runtime from ~30s to well under 1s —
    // a pure ordering change, not a behavior change.
    const rootEl = closestAriaHiddenTrue(el);
    if (!rootEl) continue;

    if (!isActuallyFocusable(el)) continue;

    let entry = bucket.get(rootEl);
    if (!entry) {
      entry = { rootEl, count: 0, offenders: [], hints: new Set(), rootIsFocusable: false };
      bucket.set(rootEl, entry);
    }
    entry.count += 1;

    // Capture a small, deterministic offender summary + visibility hints.
    if (entry.offenders.length < maxOffendersPerRoot) {
      let tag = '';
      let ti = null;
      let href = null;
      let type = null;

      try { tag = lower(el.tagName || ''); } catch { tag = ''; }
      try { ti = el.getAttribute('tabindex'); } catch { ti = null; }
      try { href = (tag === 'a' || tag === 'area') ? trim(el.getAttribute('href')) : null; } catch { href = null; }
      try { type = tag === 'input' ? lower(el.getAttribute('type') || '') : null; } catch { type = null; }

      const hints = getVisibilityHints(el);
      for (const h of hints) entry.hints.add(h);

      entry.offenders.push({
        tag: tag || null,
        tabindex: ti == null ? null : String(ti),
        href: href || null,
        type: type || null,
        visibilityHints: hints
      });
    }
  }

  if (!bucket.size) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  // Ensure deterministic root focusability computation (done once per failing root).
  for (const [, entry] of bucket) {
    const el = entry.rootEl;
    entry.rootIsFocusable = isActuallyFocusable(el);
  }

  // 3) Report one occurrence per aria-hidden root that contains focusable content.
  const occurrences = [];
  for (const [, entry] of bucket) {
    const el = entry.rootEl;

    const eligInfo = getEligibilityInfo
      ? (() => { try { return getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { return null; } })()
      : null;

    // stable visibility hint ordering
    const hintOrder = ['opacityZero', 'offscreen', 'clipped', 'zeroSizeOverflowHidden'];
    const hintsArr = [];
    for (const k of hintOrder) if (entry.hints.has(k)) hintsArr.push(k);

    const tagName = (() => { try { return lower(el.tagName || ''); } catch { return ''; } })();

    // Split counts deterministically
    const selfFocusable = !!entry.rootIsFocusable;
    const totalFocusable = entry.count;
    const descendantFocusable = selfFocusable ? Math.max(0, totalFocusable - 1) : totalFocusable;

    const summaryKey = selfFocusable
      ? (descendantFocusable > 0
          ? 'ariaHidden_focus_summary_fail_self_and_desc'
          : 'ariaHidden_focus_summary_fail_self')
      : 'ariaHidden_focus_summary_fail_desc';

    const reasonCode = selfFocusable
      ? (descendantFocusable > 0 ? 'ariaHiddenSelfAndDescendantsFocusable' : 'ariaHiddenSelfFocusable')
      : 'ariaHiddenContainsFocusable';

    const summaryText = selfFocusable
      ? (descendantFocusable > 0
          ? `aria-hidden ${tagName} is focusable and contains ${descendantFocusable} focusable descendant(s) (${totalFocusable} focusable element(s) total).`
          : `aria-hidden ${tagName} is focusable (${totalFocusable} focusable element(s)).`)
      : `aria-hidden ${tagName} contains ${totalFocusable} focusable element(s).`;

    const baseOccurrence = {
      summary: summaryText,
      hint: 'Remove focusability from descendants or remove aria-hidden; ensure focus and accessibility trees stay aligned.',
      i18n: {
        summaryKey,
        hintKey: 'ariaHidden_focus_hint_fail',
        params: {
          element: tagName,
          focusableCount: String(totalFocusable),
          descendantFocusableCount: String(descendantFocusable)
        }
      },
      data: {
        details: {
          reasonCode,
          metrics: {
            focusableTotal: totalFocusable,
            focusableDescendants: descendantFocusable,
            rootIsFocusable: selfFocusable,
            offendersCaptured: entry.offenders.length,
            visibilityHints: hintsArr.slice(0)
          },
          offenders: entry.offenders.slice(0)
        },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    };

    if (reportOccurrence) occurrences.push(reportOccurrence(el, baseOccurrence));
    else occurrences.push({ __node: el, selector: '', html: '', ...baseOccurrence });
  }

  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
