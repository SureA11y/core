/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check heading-order
 * @atomic true
 * @summary Heading levels must not skip a level going deeper
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies whenever the page contains two or more heading elements
 *   (native <h1>-<h6>, or explicit role="heading" with aria-level;
 *   default level 2 per the ARIA spec when aria-level is absent/invalid).
 *   A native <hx> with a valid aria-level (a positive integer) takes that
 *   level, as browsers expose it; otherwise it takes its tag level.
 *   A native <hx> marked role="none" or "presentation" is still a heading
 *   when it can take focus or carries a global ARIA attribute, as
 *   WAI-ARIA's presentational roles conflict resolution has browsers
 *   ignore that role then.
 *   A custom element whose ElementInternals give it the heading role
 *   (this.attachInternals().role) counts as role="heading" does, at the level
 *   its aria-level attribute or its internals' ariaLevel give.
 * @expectation
 *   In the order assistive technology reads the page, each heading's
 *   level is no more than one greater than the level of the previous
 *   heading exposed to assistive technology. Jumping deeper by more than
 *   one level (e.g. an <h1> followed directly by an <h3>, skipping <h2>)
 *   breaks the document outline assistive technology users rely on when
 *   navigating by heading.
 *   Going back to a shallower level at any point is always fine.
 * @reports
 *   - `fromLevel`: the level of the previous exposed heading (3 for an
 *     <h3>).
 *   - `toLevel`: this heading's level, more than one deeper than
 *     `fromLevel`.
 * @reason-codes
 *   - `HEADING_ORDER_SKIPPED_LEVEL` (cantTell): a heading is more than one
 *     level deeper than the previous heading exposed to assistive
 *     technology, skipping a level.
 *     It leans fail: the page states it.
 *     Basis: G141 (best practice); WAI-ARIA 1.2 heading role.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - Compares each heading with the previous exposed heading, not with
 *   the deepest level reached so far. In h1, h2, h3, h2, h4 the h4 skips
 *   a level within the second h2 section: a screen reader user moving
 *   from that h2 meets an h4 with no h3 in between. A deeper heading
 *   earlier on the page (a cookie banner's h4, say) does not excuse a
 *   later skip.
 * - Headings are taken in flat-tree order: a shadow root's headings sit at
 *   their host, and slotted headings at their slot. A host's child that no
 *   slot takes is not rendered and does not count.
 * - Only headings exposed to assistive technology count: a heading hidden
 *   by CSS, aria-hidden or inert neither is flagged nor hides a skip
 *   after it.
 * - No WCAG criterion or ACT rule covers heading order; it stays an
 *   advisory question, never a failure.
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
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

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

  function getHeadingLevel(el) {
    let explicit = getExplicitRoleToken(el);
    // A focusable <hx>, or one with a global ARIA attribute, stays a heading
    // whatever role="none"/"presentation" says (conflict resolution).
    if (
      (explicit === 'none' || explicit === 'presentation') &&
      helpers.isPresentationalRoleIgnored(el)
    )
      explicit = '';
    if (explicit) {
      if (explicit !== 'heading') return 0;
      const raw = ariaLevelOf(el);
      const n = parseInt(raw, 10);
      return Number.isFinite(n) && n >= 1 ? n : 2;
    }
    const tag = dom.tagName(el) ? dom.tagName(el).toLowerCase() : '';
    const m = /^h([1-6])$/.exec(tag);
    if (!m) return 0;
    // Browsers expose a valid aria-level on <hx> in place of the tag level.
    const ariaLevel = normalizeWs(
      dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-level')
    );
    if (/^[0-9]+$/.test(ariaLevel) && parseInt(ariaLevel, 10) >= 1) {
      return parseInt(ariaLevel, 10);
    }
    return parseInt(m[1], 10);
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('h1, h2, h3, h4, h5, h6, [role]', { internalsRoles: true })
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
    // previous-heading level on a level no AT user actually encountered.
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

  // Flat-tree order, as assistive technology reads the page: shadow content
  // at its host, slotted content at its slot. A child no slot takes is not
  // rendered and drops out.
  const flatPath = (el) => {
    const path = [el];
    for (let p = helpers.flatParentElement(el), guard = 0; guard < 500; guard++) {
      if (p === undefined) return null;
      if (!p) return path.reverse();
      path.push(p);
      p = helpers.flatParentElement(p);
    }
    return null;
  };
  const childIndex = new Map();
  const positionIn = (parent, child) => {
    let order = childIndex.get(parent);
    if (!order) {
      order = new Map(helpers.flatChildElements(parent).map((c, i) => [c, i]));
      childIndex.set(parent, order);
    }
    return order.has(child) ? order.get(child) : -1;
  };
  const compareFlat = (a, b) => {
    const n = Math.min(a.path.length, b.path.length);
    let i = 0;
    while (i < n && a.path[i] === b.path[i]) i++;
    if (i === n || i === 0) return a.path.length - b.path.length || a.index - b.index;
    const diff = positionIn(a.path[i - 1], a.path[i]) - positionIn(b.path[i - 1], b.path[i]);
    return diff || a.index - b.index;
  };
  if (typeof helpers.flatParentElement === 'function') {
    const placed = [];
    headings.forEach((h, index) => {
      const path = flatPath(h.el);
      if (path) placed.push({ h, path, index });
    });
    headings.length = 0;
    for (const p of placed.sort(compareFlat)) headings.push(p.h);
  }

  if (headings.length < 2) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let previousLevel = headings[0].level;

  for (let i = 1; i < headings.length; i += 1) {
    const { el, level } = headings[i];

    if (level > previousLevel + 1) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: `This heading jumps from level ${previousLevel} to level ${level}, skipping a level.`,
          hint: 'Go down one level at a time, so an <h2> is followed by an <h3> rather than an <h4>, and the outline of the page stays easy to follow.',
          i18n: {
            summaryKey: 'headingOrder_summary_cantTell',
            hintKey: 'headingOrder_hint_cantTell',
            params: { fromLevel: String(previousLevel), toLevel: String(level) }
          },
          lean: {
            toward: 'fail',
            why: 'The heading skips a level after the one before it.',
            signals: [{ signal: 'heading-level-skipped', value: true }],
            i18n: { whyKey: 'headingOrder_lean_why' }
          },
          data: {
            details: {
              reasonCode: 'HEADING_ORDER_SKIPPED_LEVEL',
              fromLevel: previousLevel,
              toLevel: level
            }
          }
        })
      );
    }

    previousLevel = level;
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  // A pass is a claim about the whole page, and a scoped scan saw only part
  // of it (RULE_AUTHORING.md §11.2); what it found inside the scope stands.
  return {
    ruleId: rule.ruleId,
    outcome: helpers.isWholeDocumentScope() ? 'pass' : 'notApplicable',
    severity: 'minor',
    occurrences: []
  };
}

module.exports = { id, meta, runInPage };
