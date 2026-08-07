'use strict';

/**
 * @check heading-order
 * @atomic true
 * @summary Heading levels must not skip a level going deeper
 * @standard Best Practices (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies whenever the page contains two or more heading elements
 *   (native <h1>-<h6>, or explicit role="heading" with aria-level —
 *   default level 2 per the ARIA spec when aria-level is absent/invalid).
 * @expectation
 *   In document order, each heading's level is no more than one greater
 *   than the highest heading level seen so far. Jumping deeper by more
 *   than one level (e.g. an <h1> followed directly by an <h3>, skipping
 *   <h2>) breaks the document outline assistive technology users rely on
 *   when navigating by heading. Going back to a shallower level at any
 *   point is always fine.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Tracks the highest level reached so far (not just the immediately
 *   previous heading's level), so a sequence like h1, h2, h3, h2, h4 is
 *   correctly treated as valid (the h4 follows an h3 having already been
 *   reached, even though the immediately preceding heading was h2).
 */

const id = 'heading-order';

const meta = {
  title: 'Heading levels must not skip a level',
  description: 'Checks that heading levels increase by at most one at a time in document order.',
  i18n: {
    titleKey: 'headingOrder_title',
    descriptionKey: 'headingOrder_description'
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
  const { helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getExplicitRoleToken(el) {
    const raw = normalizeWs(el.getAttribute && el.getAttribute('role'));
    if (!raw) return '';
    return raw.split(/\s+/)[0].toLowerCase();
  }

  function getHeadingLevel(el) {
    const explicit = getExplicitRoleToken(el);
    if (explicit) {
      if (explicit !== 'heading') return 0;
      const raw = normalizeWs(el.getAttribute && el.getAttribute('aria-level'));
      const n = parseInt(raw, 10);
      return Number.isFinite(n) && n >= 1 ? n : 2;
    }
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    const m = /^h([1-6])$/.exec(tag);
    return m ? parseInt(m[1], 10) : 0;
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('h1, h2, h3, h4, h5, h6, [role]')
    : helpers.queryAll('h1, h2, h3, h4, h5, h6, [role]');

  const headings = [];
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);

    // queryAllSmart's default hidden-content policy only excludes "hard"
    // CSS-based hiding (display:none, visibility:hidden, etc.) -- it does
    // NOT exclude aria-hidden, a softer/semantic removal from the
    // accessibility tree that still leaves an element visually rendered.
    // A heading order rule whose whole premise is "the document outline
    // assistive technology users rely on" (see this rule's own header
    // comment) must not let an aria-hidden heading participate in that
    // outline at all: it's invisible to exactly the users this rule
    // exists to protect. Without this check an aria-hidden heading is both
    // flagged itself (though it isn't part of the AT-perceived outline)
    // and can mask a real skip immediately after it, by advancing the
    // "highest level reached so far" tracker on a level no AT user
    // actually encountered.
    if (helpers.isAccTreeEligible) {
      const elig = (() => {
        try {
          return helpers.isAccTreeEligible(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig && elig.eligible === false) continue;
    }

    const level = getHeadingLevel(el);
    if (level > 0) headings.push({ el, level });
  }

  if (headings.length < 2) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let highestSoFar = headings[0].level;

  for (let i = 1; i < headings.length; i += 1) {
    const { el, level } = headings[i];

    if (level > highestSoFar + 1) {
      const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet
        ? helpers.getOuterHtmlSnippet(el)
        : el.outerHTML || '';

      occurrences.push({
        selector: stableSelector,
        html,
        summary: `This heading jumps from level ${highestSoFar} to level ${level}, skipping a level.`,
        hint: 'Use consecutive heading levels (do not skip a level when going deeper) so the document outline stays predictable.',
        i18n: {
          summaryKey: 'headingOrder_summary_cantTell',
          hintKey: 'headingOrder_hint_cantTell',
          params: { fromLevel: String(highestSoFar), toLevel: String(level) }
        },
        data: {
          details: {
            reasonCode: 'HEADING_ORDER_SKIPPED_LEVEL',
            fromLevel: highestSoFar,
            toLevel: level
          }
        }
      });
    }

    if (level > highestSoFar) highestSoFar = level;
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
