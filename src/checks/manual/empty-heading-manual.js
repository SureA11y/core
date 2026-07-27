'use strict';

/**
 * @check empty-heading
 * @atomic true
 * @summary Heading elements must not be empty
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to elements with a heading role: native <h1>-<h6>, or any
 *   element with explicit role="heading" (unless overridden by another
 *   explicit role).
 * @expectation
 *   The heading has a non-empty accessible name: aria-label,
 *   aria-labelledby, visible text content not hidden from assistive
 *   technology, or (as a last resort) a title attribute. An empty
 *   heading is announced as "heading, level N" with nothing else, which
 *   is confusing when navigating by heading.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - This is also the reconciliation point for the "heading-name-present"
 *   gap surfaced by the 2026-07-19 ACT-rules research pass (see
 *   ROADMAP.md "Tier 5 candidates"): that gap was already closed by this
 *   pre-existing rule under a different name, not a real gap. Fixed two
 *   real false-positive bugs found while confirming that (2026-07-19):
 *   `title` wasn't accepted as a naming fallback, and hidden/aria-hidden/
 *   display:none headings weren't excluded (not gated on
 *   `isAccTreeEligible`), so an empty heading no AT user could ever
 *   reach was still flagged.
 * - 2026-07-21: the subtree-text walker's own hand-rolled descendant
 *   handling (aria-label/aria-labelledby only) never checked an `<img>`
 *   descendant's `alt` text — found via Party City's
 *   `<h1><a><div><img alt="..."></div></a></h1>` logo header, a false
 *   "empty heading" cantTell. Replaced with the shared, accname-aligned
 *   `helpers.getContentNameInfo` (see dom-helpers.js) — the same "name
 *   from content" implementation the 19 `-name-present` rules already use
 *   — instead of maintaining a third, narrower copy of this logic here.
 */

const id = 'empty-heading';

const meta = {
  title: 'Headings must not be empty',
  description: 'Checks that heading elements (<h1>-<h6> or role="heading") have a non-empty accessible name.',
  i18n: {
    titleKey: 'emptyHeading_title',
    descriptionKey: 'emptyHeading_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'headings', 'structure', 'atomic', 'manual'],
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

  function getExplicitRoleToken(el) {
    const raw = normalizeWs(el.getAttribute && el.getAttribute('role'));
    if (!raw) return '';
    return raw.split(/\s+/)[0].toLowerCase();
  }

  function isHeading(el) {
    const explicit = getExplicitRoleToken(el);
    if (explicit) return explicit === 'heading';
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    return /^h[1-6]$/.test(tag);
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
    // Shared, accname-aligned "name from content" implementation (see
    // dom-helpers.js's getContentNameInfo header comment) — resolves an
    // <img> descendant's own alt text, an aria-label/aria-labelledby'd
    // descendant's own name, etc., and already gates every descendant on
    // full accessibility-tree eligibility (aria-hidden, display:none,
    // visibility:hidden, [hidden], inert, ...) the same way this rule
    // needs. Used instead of a fourth hand-rolled subtree walker here.
    if (helpers && typeof helpers.getContentNameInfo === 'function') {
      try {
        const info = helpers.getContentNameInfo(el, ctx);
        if (info && info.present && info.value) return info.value;
      } catch {}
    }
    return normalizeWs(el.getAttribute && el.getAttribute('title'));
  }

  let nodes = [];
  try {
    nodes = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role]');
  } catch {
    nodes = [];
  }

  const occurrences = [];
  let applicableCount = 0;
  const seen = new Set();

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  function isEligible(el) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isHeading(el)) continue;
    if (!isEligible(el)) continue;

    applicableCount += 1;

    const name = getAccessibleNameText(el);
    if (name) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');
    const eligInfo = helpers.getEligibilityInfo
      ? (() => { try { return helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { return null; } })()
      : null;

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This heading has no accessible name.',
      hint: 'Add text content (or aria-label/aria-labelledby) to this heading, or remove it if it is not needed.',
      i18n: {
        summaryKey: 'emptyHeading_summary_cantTell',
        hintKey: 'emptyHeading_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'HEADING_EMPTY' },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
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
