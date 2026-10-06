/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check empty-heading
 * @atomic true
 * @summary Heading elements must not be empty
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to elements with a heading role: native <h1>-<h6>, or any
 *   element whose role attribute resolves to heading (the first token
 *   naming a known role, matched case-insensitively, so role="foo heading"
 *   counts). A native heading keeps its role when no token is a known
 *   role, and loses it to any other resolved role.
 * @expectation
 *   The heading has a non-empty accessible name: aria-label,
 *   aria-labelledby, visible text content not hidden from assistive
 *   technology, or (as a last resort) a title attribute. An empty
 *   heading is announced as "heading, level N" with nothing else, which
 *   is confusing when navigating by heading.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - This is also the reconciliation point for the ACT-rules
 *   "heading-name-present" requirement: already covered by this
 *   pre-existing rule under a different name, not a separate gap.
 *   `title` is accepted as a naming
 *   fallback, and hidden/aria-hidden/display:none headings are excluded
 *   (gated on `isAccTreeEligible`), so an empty heading no AT user could
 *   ever reach is not flagged.
 * - Descendant name resolution uses the shared, accname-aligned
 *   `helpers.getContentNameInfo` (see dom-helpers.js), the same "name
 *   from content" implementation the 19 `-name-present` rules already
 *   use, rather than a narrower hand-rolled walker, so an `<img alt="...">`
 *   descendant's alt text (e.g. a
 *   `<h1><a><div><img alt="..."></div></a></h1>` logo header) is correctly
 *   picked up as the heading's name instead of producing a false "empty
 *   heading" cantTell.
 */

const id = 'empty-heading';

const meta = {
  title: 'Headings must not be empty',
  description:
    'Checks that heading elements (<h1>-<h6> or role="heading") have a non-empty accessible name.',
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
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // The role attribute is a fallback list: the first token naming a real
  // role wins, case-insensitively, and none means no explicit role at all
  // (the element keeps its native heading role, if any).
  function getExplicitRoleToken(el) {
    return helpers.aria.getExplicitRole(el);
  }

  // Same Global States and Properties set used elsewhere in this engine
  // (aria-required-parent.js, aria-prohibited-children.js) for the same
  // presentational-roles-conflict-resolution concept: a native h1-h6
  // marked role="none"/"presentation" still reverts to its native heading
  // role when it carries a global ARIA attribute (even one with an empty
  // value, like aria-label="" -- the attribute's presence is what
  // triggers conflict resolution, not its value).
  const GLOBAL_ARIA_ATTRS = [
    'aria-atomic',
    'aria-braillelabel',
    'aria-brailleroledescription',
    'aria-busy',
    'aria-controls',
    'aria-current',
    'aria-describedby',
    'aria-description',
    'aria-details',
    'aria-disabled',
    'aria-dropeffect',
    'aria-errormessage',
    'aria-flowto',
    'aria-grabbed',
    'aria-haspopup',
    'aria-hidden',
    'aria-invalid',
    'aria-keyshortcuts',
    'aria-label',
    'aria-labelledby',
    'aria-live',
    'aria-owns',
    'aria-relevant',
    'aria-roledescription'
  ];

  function hasGlobalAriaAttr(el) {
    for (const attr of GLOBAL_ARIA_ATTRS) {
      if (dom.get(el, 'getAttribute') && dom.getAttribute(el, attr) != null) return true;
    }
    return false;
  }

  function isHeading(el) {
    const tag = dom.tagName(el) ? dom.tagName(el).toLowerCase() : '';
    const isNativeHeadingTag = /^h[1-6]$/.test(tag);

    const explicit = getExplicitRoleToken(el);
    if (!explicit) return isNativeHeadingTag;
    if (explicit === 'heading') return true;
    if ((explicit === 'none' || explicit === 'presentation') && isNativeHeadingTag) {
      return hasGlobalAriaAttr(el);
    }
    return false;
  }

  function getAccessibleNameText(el) {
    const al = normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-label'));
    if (al) return al;
    const alb = normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-labelledby'));
    if (alb) {
      const parts = [];
      for (const refId of alb.split(/\s+/).filter(Boolean)) {
        try {
          const ref = dom.getElementById(document, refId);
          if (ref) {
            const t = normalizeWs(dom.textContent(ref));
            if (t) parts.push(t);
          }
        } catch {}
      }
      const joined = normalizeWs(parts.join(' '));
      if (joined) return joined;
    }
    // Shared, accname-aligned "name from content" implementation (see
    // dom-helpers.js's getContentNameInfo header comment). Resolves an
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
    return normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'title'));
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('h1, h2, h3, h4, h5, h6, [role]')
    : helpers.queryAll('h1, h2, h3, h4, h5, h6, [role]');

  const occurrences = [];
  let applicableCount = 0;
  const seen = new Set();

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

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

    const eligInfo = helpers.getEligibilityInfo
      ? (() => {
          try {
            return helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;

    occurrences.push(
      helpers.reportOccurrence(el, {
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
      })
    );
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
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
