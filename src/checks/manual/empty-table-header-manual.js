'use strict';

/**
 * @check empty-table-header
 * @atomic true
 * @summary Table header cells must not be empty
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to <th> elements that don't carry a conflicting explicit role,
 *   plus any element (native <th> or not) with role="columnheader" or
 *   role="rowheader" — matches a widely-used reference engine's own
 *   `empty-table-header` selector exactly (`th:not([role]), [role="columnheader"], [role="rowheader"]`,
 *   verified directly against its rule descriptor): a <th> that explicitly
 *   restates role="columnheader"/"rowheader" is still covered via the second
 *   clause, but a <th role="presentation"> (no longer meaningfully a header)
 *   is correctly excluded, and an ARIA-role-only header (e.g. a <div
 *   role="columnheader"> in a role="grid"/role="table" widget) is caught too
 *   — found missing entirely via the cross-engine diff tool 2026-07-23.
 * @expectation
 *   The header cell has visible text content. A <th> named only via
 *   aria-label/aria-labelledby (no visible text) is ALSO flagged, not
 *   treated as equivalent — real screen-reader/browser testing (found via
 *   a live-DOM cross-engine run 2026-07-21, verified against
 *   https://butterpep.com/table-header-naming.html and
 *   https://html5accessibility.com/stuff/2024/05/22/not-so-short-note-on-aria-label-usage-big-table-edition/)
 *   confirms aria-label support on <th> is genuinely inconsistent in
 *   practice: NVDA+Firefox and iOS VoiceOver+Safari ignore it entirely
 *   (only visible text is announced), JAWS+Chrome/IE11 also only announce
 *   visible text in the header cell itself. Visible text is the one
 *   mechanism confirmed to work across every tested combination. A widely-used
 *   reference engine's own equivalent check (`has-visible-text` only, no aria-label/
 *   aria-labelledby alternative — confirmed directly against its rule
 *   descriptor) reaches the same conclusion.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Two distinct reasonCodes: TABLE_HEADER_EMPTY (no accessible name at
 *   all) vs. TABLE_HEADER_NAME_NOT_VISIBLE_TEXT (has aria-label/
 *   aria-labelledby but no visible text) — the latter gets a different
 *   summary/hint explaining the AT-support gap, since the header isn't
 *   literally nameless, just unreliably named in practice.
 */

const id = 'empty-table-header';

const meta = {
  title: 'Table header cells must not be empty',
  description:
    'Checks that table header cells (<th>, or any element with role="columnheader"/"rowheader") have visible text content — a header named only via aria-label/aria-labelledby is also flagged, since real screen-reader/browser support for that is inconsistent.',
  i18n: {
    titleKey: 'emptyTableHeader_title',
    descriptionKey: 'emptyTableHeader_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'tables', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getVisibleText(el) {
    return normalizeWs(el.textContent);
  }

  function getAriaOnlyName(el) {
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
    return '';
  }

  // Matches a widely-used reference engine's own empty-table-header selector exactly: a <th> with
  // no conflicting explicit role, plus any element carrying an explicit
  // columnheader/rowheader role (native or not).
  const selector = 'th:not([role]), [role="columnheader"], [role="rowheader"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el) continue;
    applicableCount += 1;

    if (getVisibleText(el)) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    const ariaName = getAriaOnlyName(el);
    if (ariaName) {
      occurrences.push({
        selector: stableSelector,
        html,
        summary:
          'This table header cell has no visible text — its only accessible name comes from aria-label/aria-labelledby, which real screen-reader/browser combinations (e.g. NVDA+Firefox, iOS VoiceOver+Safari) are known to ignore on <th> elements.',
        hint: 'Add visible text content to this header cell (in addition to, or instead of, aria-label/aria-labelledby) — visible text is the only naming mechanism confirmed to work across tested screen readers.',
        i18n: {
          summaryKey: 'emptyTableHeader_summary_cantTell_ariaOnly',
          hintKey: 'emptyTableHeader_hint_cantTell_ariaOnly',
          params: {}
        },
        data: {
          details: { reasonCode: 'TABLE_HEADER_NAME_NOT_VISIBLE_TEXT', ariaName }
        }
      });
      continue;
    }

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This table header cell has no accessible name.',
      hint: 'Add text content (or aria-label/aria-labelledby) to this header cell, or remove it if it is not needed.',
      i18n: {
        summaryKey: 'emptyTableHeader_summary_cantTell',
        hintKey: 'emptyTableHeader_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'TABLE_HEADER_EMPTY' }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
