/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check page-has-heading-one
 * @atomic true
 * @summary The page should have at least one level-one heading
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applicable to any HTML document with a <body> element that is a page
 *   of its own (a document shown in a frame is not):
 *   "does the page have an h1" is a whole-page concern, matching
 *   bypass-blocks-present's pattern of evaluating the document
 *   directly.
 *   Not while a modal dialog is open: the rest of the page is inert then,
 *   so the scan sees the dialog, not the page.
 *   A custom element whose ElementInternals give it the heading role
 *   (this.attachInternals().role) and level 1 (its aria-level attribute or
 *   its internals' ariaLevel) counts as an <h1>.
 *   A native <hx> marked role="none" or "presentation" is still a heading
 *   when it can take focus or carries a global ARIA attribute, as
 *   WAI-ARIA's presentational roles conflict resolution has browsers
 *   ignore that role then.
 *   A native <hx> with a valid aria-level (a positive integer) has that
 *   level, as browsers expose it: <h2 aria-level="1"> is a level-one
 *   heading and <h1 aria-level="2"> is not, as heading-order reads them.
 * @expectation
 *   At least one heading with level 1 exists (native <h1>, or
 *   role="heading" with aria-level="1"). A page with no top-level
 *   heading has no clear entry point for assistive technology users
 *   navigating by heading.
 * @reason-codes
 *   - `HEADING_ONE_MISSING` (cantTell): the page exposes no level-one
 *     heading to assistive technology.
 *     It leans fail: the page states it.
 *     Basis: G141 (best practice); WAI-ARIA 1.2 heading role.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Filters candidates through `isAccTreeEligible` (hidden/aria-hidden/
 *   display:none/inert elements don't count as "the page has a heading
 *   one"), matching `landmark-one-main`'s own precedent. A raw
 *   `document.querySelectorAll` would wrongly credit an `<h1>` that sits
 *   inside a `display:none` ancestor, unreachable by sighted and
 *   screen reader users alike, as satisfying this check. This does NOT
 *   regress purely-visually-clipped-but-AT-exposed headings (e.g. an `<h1>`
 *   hidden via clip-path/off-screen positioning, `visibility:visible`, no
 *   `aria-hidden`): `isAccTreeEligible` only excludes elements actually
 *   removed from the accessibility tree, not ones merely clipped from the
 *   visual viewport.
 */

const id = 'page-has-heading-one';

const meta = {
  title: 'Page should have a level-one heading',
  description:
    'Checks that the page has at least one level-one heading (<h1> or role="heading" with aria-level="1").',
  i18n: {
    titleKey: 'pageHasHeadingOne_title',
    descriptionKey: 'pageHasHeadingOne_description'
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

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
//
// Also notApplicable while a modal dialog is open: the rest of the page is
// inert then, so the scan saw the dialog, not the page's structure.
// A document shown in a frame is no page of its own: the page's level-one heading is the top document's.
function applicability(ctx) {
  const { helpers } = ctx;
  if (helpers.isTopLevelDocument && !helpers.isTopLevelDocument()) return false;
  if (helpers.isWholeDocumentScope && !helpers.isWholeDocumentScope()) return false;
  return !(helpers.isModalDialogOpen && helpers.isModalDialogOpen());
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const body = document && dom.body(document) ? dom.body(document) : null;
  if (!body) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // The role attribute is a fallback list: the first token naming a real
  // role wins, case-insensitively, and none means no explicit role at all
  // (the element keeps its native heading role, if any). A custom element's
  // internals may give it the heading role instead.
  function getExplicitRoleToken(el) {
    return helpers.aria.getAuthorRole(el);
  }

  // A heading's aria-level: the attribute, else the level a custom element's
  // internals set (ariaLevel), or '' for neither.
  function ariaLevelOf(el) {
    const attr = dom.get(el, 'getAttribute') ? dom.getAttribute(el, 'aria-level') : null;
    if (attr != null) return normalizeWs(attr);
    const info =
      typeof helpers.getInternalsStateInfo === 'function'
        ? helpers.getInternalsStateInfo(el, 'aria-level')
        : null;
    return info && info.status === 'set' ? normalizeWs(info.value) : '';
  }

  function isLevelOneHeading(el) {
    let explicit = getExplicitRoleToken(el);
    // A focusable <h1>, or one with a global ARIA attribute, stays a heading
    // whatever role="none"/"presentation" says (conflict resolution).
    if (
      (explicit === 'none' || explicit === 'presentation') &&
      helpers.isPresentationalRoleIgnored(el)
    )
      explicit = '';
    if (explicit) {
      if (explicit !== 'heading') return false;
      return ariaLevelOf(el) === '1';
    }
    const tag = dom.tagName(el) ? dom.tagName(el).toLowerCase() : '';
    const m = /^h([1-6])$/.exec(tag);
    if (!m) return false;
    // Browsers expose a valid aria-level on <hx> in place of the tag level,
    // as heading-order reads it.
    const ariaLevel = normalizeWs(
      dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-level')
    );
    if (/^[0-9]+$/.test(ariaLevel) && parseInt(ariaLevel, 10) >= 1) {
      return parseInt(ariaLevel, 10) === 1;
    }
    return m[1] === '1';
  }

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

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
  // landmark-one-main-manual.js's identical precedent.
  let nodes;
  try {
    nodes =
      helpers && typeof helpers.queryAllSmart === 'function'
        ? helpers.queryAllSmart('h1, h2, h3, h4, h5, h6, [role]', { internalsRoles: true })
        : dom.querySelectorAll(document, 'h1, h2, h3, h4, h5, h6, [role]');
  } catch {
    nodes = [];
  }

  const hasH1 = [...nodes].some((el) => el && isLevelOneHeading(el) && isExposedToAt(el));

  if (hasH1) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  // An <h1> that is in the markup but does not count, and why: a reader who
  // finds it in the source otherwise takes the finding for a mistake.
  // Hidden content included: the hidden <h1> is the one to name.
  function skippedH1() {
    let h1s;
    try {
      h1s =
        typeof helpers.queryAllDeep === 'function'
          ? helpers.queryAllDeep('h1')
          : dom.querySelectorAll(document, 'h1');
    } catch {
      h1s = [];
    }
    for (const el of h1s) {
      if (!el || !dom.tagName(el)) continue;
      const all = normalizeWs(dom.textContent(el));
      const text = all.length > 60 ? `${all.slice(0, 59)}…` : all;
      if (isLevelOneHeading(el)) {
        const cause = typeof helpers.hiddenCause === 'function' ? helpers.hiddenCause(el) : null;
        if (!cause) {
          return {
            summary: `This page has no level-one heading that screen readers can reach. Its <h1> "${text}" is hidden from screen readers.`,
            summaryKey: 'pageHasHeadingOne_summary_h1Hidden',
            hintKey: 'pageHasHeadingOne_hint_h1Hidden',
            params: { text },
            detail: { cause: 'hidden', text }
          };
        }
        if (cause.element === el) {
          return {
            summary: `This page has no level-one heading that screen readers can reach. Its <h1> "${text}" is hidden by ${cause.hiddenBy}.`,
            summaryKey: 'pageHasHeadingOne_summary_h1HiddenOwn',
            hintKey: 'pageHasHeadingOne_hint_h1Hidden',
            params: { text, hiddenBy: cause.hiddenBy },
            detail: { cause: 'hidden', text, hiddenBy: cause.hiddenBy }
          };
        }
        const ancestor = helpers.describeElement(cause.element);
        return {
          summary: `This page has no level-one heading that screen readers can reach. Its <h1> "${text}" is hidden: an ancestor ${ancestor} has ${cause.hiddenBy}.`,
          summaryKey: 'pageHasHeadingOne_summary_h1HiddenAncestor',
          hintKey: 'pageHasHeadingOne_hint_h1Hidden',
          params: { text, hiddenBy: cause.hiddenBy, ancestor },
          detail: { cause: 'hidden', text, hiddenBy: cause.hiddenBy, hiddenByElement: ancestor }
        };
      }
      let role = getExplicitRoleToken(el);
      if ((role === 'none' || role === 'presentation') && helpers.isPresentationalRoleIgnored(el)) {
        role = '';
      }
      if (role && role !== 'heading') {
        return {
          summary: `This page has no level-one heading. Its <h1> "${text}" has role="${role}", so it is not exposed as a heading.`,
          summaryKey: 'pageHasHeadingOne_summary_h1Role',
          hintKey: 'pageHasHeadingOne_hint_h1Role',
          params: { text, role },
          detail: { cause: 'role', text, role }
        };
      }
      const level = ariaLevelOf(el);
      if (/^[0-9]+$/.test(level) && parseInt(level, 10) > 1) {
        return {
          summary: `This page has no level-one heading. Its <h1> "${text}" is exposed as level ${level} by aria-level="${level}".`,
          summaryKey: 'pageHasHeadingOne_summary_h1Relevelled',
          hintKey: 'pageHasHeadingOne_hint_h1Relevelled',
          params: { text, level },
          detail: { cause: 'aria-level', text, level: parseInt(level, 10) }
        };
      }
    }
    return null;
  }
  const skipped = skippedH1();

  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences: [
      helpers.reportOccurrence(body, {
        summary: skipped ? skipped.summary : 'This page has no level-one heading.',
        hint: skipped
          ? {
              pageHasHeadingOne_hint_h1Hidden:
                "If this <h1> names the page's main content, let screen readers reach it; otherwise add a level-one heading that does.",
              pageHasHeadingOne_hint_h1Role:
                "If this <h1> names the page's main content, remove its role; otherwise add a level-one heading that does.",
              pageHasHeadingOne_hint_h1Relevelled:
                "If this <h1> names the page's main content, remove its aria-level; otherwise add a level-one heading that does."
            }[skipped.hintKey]
          : 'Add a level-one heading (<h1> or role="heading" aria-level="1") that identifies the page\'s main content.',
        i18n: {
          summaryKey: skipped ? skipped.summaryKey : 'pageHasHeadingOne_summary_cantTell',
          hintKey: skipped ? skipped.hintKey : 'pageHasHeadingOne_hint_cantTell',
          params: skipped ? skipped.params : {}
        },
        lean: {
          toward: 'fail',
          why: 'The page has no level-one heading.',
          signals: [{ signal: 'heading-one-absent', value: true }],
          i18n: { whyKey: 'pageHasHeadingOne_lean_why' }
        },
        data: {
          details: {
            reasonCode: 'HEADING_ONE_MISSING',
            ...(skipped ? { skippedH1: skipped.detail } : {})
          }
        }
      })
    ]
  };
}

module.exports = { id, meta, runInPage, applicability };
