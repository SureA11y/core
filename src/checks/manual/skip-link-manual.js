'use strict';

/**
 * @check skip-link
 * @atomic true
 * @summary A "skip" link must resolve to a real, focusable target
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
 *   (via a matching id, or a legacy <a name="...">). A skip link whose
 *   target does not exist silently does nothing when activated.
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
  title: 'Skip link must have a resolvable target',
  description: 'Checks that a "skip to ..." link\'s href fragment resolves to a real element in the document.',
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
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

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

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('a[href]', safeRoot) : helpers.queryAll('a[href]', safeRoot);

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

    if (target) continue;

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
