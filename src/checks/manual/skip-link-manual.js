'use strict';

/**
 * @check skip-link
 * @atomic true
 * @summary A "skip" link must resolve to a real, usable target
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to <a href="#fragment"> elements whose accessible name
 *   matches a common "skip to ..." / "jump to ..." authoring convention
 *   (case-insensitive "skip" or "jump to" in the name) — the recognizable
 *   pattern for a skip-navigation link, not every same-page anchor link
 *   on the page. "jump to" added 2026-07-23 after a real page (Wish.com)
 *   surfaced a skip link reading "Jump to section" with a genuinely
 *   missing target — invisible to the original "skip"-only pattern,
 *   while a widely-used reference engine's own (purely positional, not text-based) matching
 *   caught it. Text-pattern matching itself stays deliberate (see
 *   implementation-notes) — this only widens the known-convention list.
 * @expectation
 *   The link's fragment resolves to a real element in the document
 *   (via a matching id, or a legacy <a name="...">), and that target is
 *   currently usable (not hidden from the accessibility tree; and, when
 *   browser geometry is available, not zero-area/no-rects). A skip link
 *   whose target is missing or effectively unusable does not provide a
 *   reliable bypass destination.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Keyed on the "skip" text-pattern convention rather than positional
 *   heuristics (first link in tab order, etc.), matching the same
 *   deliberate-leniency reasoning documented in
 *   bypass-blocks-present's implementation notes.
 */

const id = 'skip-link';

const meta = {
  title: 'Skip link must have a resolvable, usable target',
  description: 'Checks that a "skip to ..." link\'s href fragment resolves to a real, currently usable element in the document.',
  i18n: {
    titleKey: 'skipLink_title',
    descriptionKey: 'skipLink_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'keyboard', 'navigation', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function getAccessibleNameText(el) {
    const al = normalizeWs(el.getAttribute && el.getAttribute('aria-label'));
    if (al) return al;
    const alb = normalizeWs(el.getAttribute && el.getAttribute('aria-labelledby'));
    if (alb) {
      const parts = [];
      for (const refId of alb.split(/\s+/).filter(Boolean)) {
        try {
          const ref = document.getElementById(refId);
          if (ref) {
            const t = normalizeWs(ref.textContent);
            if (t) parts.push(t);
          }
        } catch {}
      }
      const joined = normalizeWs(parts.join(' '));
      if (joined) return joined;
    }
    return normalizeWs(el.textContent);
  }

  function hasReliableGeometrySupport() {
    const probe = document.documentElement || document.body || null;
    if (!probe || !probe.getClientRects || !probe.getBoundingClientRect) return false;
    try {
      const rects = probe.getClientRects();
      const rectCount = rects ? rects.length : 0;
      const r = probe.getBoundingClientRect();
      const w = r && Number.isFinite(r.width) ? r.width : 0;
      const h = r && Number.isFinite(r.height) ? r.height : 0;
      return rectCount > 0 && (w > 0 || h > 0);
    } catch {
      return false;
    }
  }

  function toEligibility(info) {
    return {
      eligible: !!(info && info.eligible),
      reasons: info && Array.isArray(info.reasons) ? info.reasons.slice(0) : []
    };
  }

  const geometrySupported = hasReliableGeometrySupport();

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('a[href]') : helpers.queryAll('a[href]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const href = String(el.getAttribute('href') || '').trim();
    if (href.length < 2 || href.charAt(0) !== '#') continue;

    const name = getAccessibleNameText(el);
    if (!/skip/i.test(name) && !/jump\s*to/i.test(name)) continue;

    applicableCount += 1;

    let fragment = href.slice(1);
    try {
      fragment = decodeURIComponent(fragment);
    } catch {}
    fragment = fragment.trim();

    let target = null;
    if (fragment) {
      try {
        target = document.getElementById(fragment);
      } catch {
        target = null;
      }
      if (!target) {
        try {
          target = document.querySelector('a[name="' + fragment.replace(/"/g, '\\"') + '"]');
        } catch {
          target = null;
        }
      }
    }

    if (target) {
      const accEligibility = toEligibility(
        helpers.getEligibilityInfo
          ? helpers.getEligibilityInfo(target, ctx, { targetSet: 'acc' })
          : (helpers.isAccTreeEligible ? helpers.isAccTreeEligible(target, ctx) : { eligible: true, reasons: [] })
      );

      let geometryEligibility = null;
      let geometryReasonCode = null;
      if (geometrySupported && helpers.isDomVisibleEligible) {
        geometryEligibility = toEligibility(
          helpers.isDomVisibleEligible(target, ctx, { visibilityMode: 'styleAndGeometry', ignoreOpacity: true })
        );
        if (!geometryEligibility.eligible && geometryEligibility.reasons.includes('noClientRects')) {
          geometryReasonCode = 'NO_CLIENT_RECTS';
        } else if (!geometryEligibility.eligible && geometryEligibility.reasons.includes('zeroArea')) {
          geometryReasonCode = 'ZERO_AREA_TARGET';
        }
      }

      const unusableByAcc = !accEligibility.eligible;
      const unusableByGeometry = !!geometryReasonCode;
      if (!unusableByAcc && !unusableByGeometry) continue;

      const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This skip link points to a target that exists but is not currently usable.',
        hint: 'Point this skip link to a target that is exposed and usable as a navigation destination.',
        i18n: {
          summaryKey: 'skipLink_summary_unusableTarget_cantTell',
          hintKey: 'skipLink_hint_unusableTarget_cantTell',
          params: { href }
        },
        data: {
          details: {
            reasonCode: 'SKIP_LINK_TARGET_UNUSABLE',
            href,
            unusableReasonCode: unusableByAcc ? 'ACC_TREE_INELIGIBLE' : geometryReasonCode,
            targetSelector: helpers.buildSelector ? helpers.buildSelector(target) : null,
            geometryCheckEnabled: geometrySupported
          },
          visibilityFilter: {
            targetSet: 'acc',
            accEligible: accEligibility.eligible,
            reasons: accEligibility.reasons
          },
          targetGeometry: geometryEligibility
            ? { eligible: geometryEligibility.eligible, reasons: geometryEligibility.reasons }
            : { eligible: null, reasons: [] }
        }
      });
      continue;
    }

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This skip link\'s target does not exist.',
      hint: 'Point the skip link\'s href at an id that exists in the document, or add the missing target element.',
      i18n: {
        summaryKey: 'skipLink_summary_cantTell',
        hintKey: 'skipLink_hint_cantTell',
        params: { href }
      },
      data: {
        details: { reasonCode: 'SKIP_LINK_TARGET_MISSING', href }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
