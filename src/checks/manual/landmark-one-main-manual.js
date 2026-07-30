'use strict';

/**
 * @check landmark-one-main
 * @atomic true
 * @summary The page should have a main landmark
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Always applicable to any HTML document with a <body> element —
 *   "does the page have a main landmark" is a whole-page concern,
 *   matching bypass-blocks-present's pattern of evaluating the
 *   document directly.
 * @expectation
 *   At least one main landmark (role="main" or <main>), exposed to
 *   assistive technology, exists on the page — a page with none gives
 *   AT users no landmark to jump straight to for the primary content.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Presence-only, matching a widely-used reference engine's real
 *   `landmark-one-main` scope exactly (confirmed 2026-07-22 by reading that
 *   engine's source directly: its `page-has-main` check is a plain
 *   descendant-exists test, `has-descendant-evaluate` — it does NOT flag
 *   more than one). This rule previously ALSO flagged "more than one main,"
 *   which was both a real scope mismatch against that reference engine (it
 *   ships that as a fully separate rule, `landmark-no-duplicate-main` /
 *   `page-no-duplicate-main`, already correctly implemented here as
 *   `landmark-no-duplicate-main`) and missing that sibling rule's
 *   accessibility-tree visibility filter, so it double-flagged cases the
 *   sibling rule already handles correctly — found via a real page
 *   (2026-07-22, live-DOM corpus): Resy's and DuckDuckGo's homepages each
 *   genuinely have two visible `<main>` elements, which that reference
 *   engine's `landmark-one-main` doesn't flag at all (out of its scope) but
 *   this rule wrongly did, disagreeing with it for a
 *   reason that wasn't a real coverage gap on either side — just a
 *   redundant, incorrectly-scoped extra branch here.
 * - Filters candidates through `isAccTreeEligible` (hidden/aria-hidden/
 *   display:none/inert elements don't count as "a main landmark exists"),
 *   matching `landmark-no-duplicate-main`'s own precedent and
 *   that reference engine's own accessibility-tree-scoped matching.
 */

const id = 'landmark-one-main';

const meta = {
  title: 'Page should have a main landmark',
  description: 'Checks that the page has at least one main landmark (role="main" or <main>).',
  i18n: {
    titleKey: 'landmarkOneMain_title',
    descriptionKey: 'landmarkOneMain_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'landmarks', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const body = document && document.body ? document.body : null;
  if (!body) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  function getExplicitRoleToken(el) {
    const raw = (el.getAttribute && el.getAttribute('role') || '').trim();
    if (!raw) return '';
    return raw.split(/\s+/)[0].toLowerCase();
  }

  function isMainLandmark(el) {
    if (!el || !el.getAttribute) return false;
    const explicit = getExplicitRoleToken(el);
    if (explicit) return explicit === 'main';
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    return tag === 'main';
  }

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  function isExposedToAt(el) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  // queryAllSmart (shadow-DOM-aware) instead of plain document.querySelectorAll -- see
  // landmark-unique-manual.js's header comment for the real page (Airtable, 2026-07-23)
  // that surfaced this gap: a third-party shadow-DOM-hosted widget's own landmark is
  // invisible to a light-DOM-only query.
  let nodes = [];
  try {
    nodes = helpers && typeof helpers.queryAllSmart === 'function'
      ? helpers.queryAllSmart('main, [role]')
      : document.querySelectorAll('main, [role]');
  } catch {
    nodes = [];
  }

  let hasMain = false;
  const seen = new Set();
  for (const el of nodes) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!isMainLandmark(el)) continue;
    if (!isExposedToAt(el)) continue;
    hasMain = true;
    break;
  }

  if (hasMain) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const stableSelector = helpers.buildSelector ? helpers.buildSelector(body) : 'body';
  const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(body) : (body.outerHTML || '').slice(0, 200);

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences: [{
      selector: stableSelector,
      html,
      summary: 'This page has no main landmark.',
      hint: 'Add a main landmark (<main> or role="main") around the page\'s primary content.',
      i18n: {
        summaryKey: 'landmarkOneMain_summary_cantTell_missing',
        hintKey: 'landmarkOneMain_hint_cantTell_missing',
        params: {}
      },
      data: {
        details: { reasonCode: 'LANDMARK_MAIN_MISSING' }
      }
    }]
  };
}

module.exports = { id, meta, runInPage, applicability };
