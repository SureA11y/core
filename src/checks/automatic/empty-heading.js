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
 *   A native <hx> marked role="none" or "presentation" is still a heading
 *   when it can take focus or carries a global ARIA attribute, as
 *   WAI-ARIA's presentational roles conflict resolution has browsers
 *   ignore that role then.
 *   A custom element whose ElementInternals give it the heading role
 *   (this.attachInternals().role), with no role attribute naming another,
 *   counts as a native element with that role does.
 * @expectation
 *   The heading has a non-empty accessible name: aria-label,
 *   aria-labelledby, visible text content not hidden from assistive
 *   technology, or (as a last resort) a title attribute. An empty
 *   heading is announced as "heading, level N" with nothing else, which
 *   is confusing when navigating by heading.
 *   Reported at FAIL although no WCAG criterion is claimed: an empty
 *   heading is itself the barrier, as the ACT rule ffd0e9 and the engines
 *   implementing it treat it. A heading whose name may come from content
 *   no script can read (a closed shadow root, content nested too deep, a
 *   custom element naming itself through ElementInternals) is asked about
 *   instead, as the *-name-present rules do.
 * @implementation-notes
 * - Not WCAG-normative: W3C publishes ACT ffd0e9 mapped to no Success
 *   Criterion, and implementations naming 1.3.1 are scored as reporting the
 *   wrong criterion. Deterministic all the same, so `type: 'automatic'`;
 *   see docs/RULE_TAXONOMY.md 1.1 on when a best-practice rule fails.
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
 *   heading" fail.
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
  tags: ['best-practice', 'headings', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
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

  function isHeading(el) {
    const tag = dom.tagName(el) ? dom.tagName(el).toLowerCase() : '';
    const isNativeHeadingTag = /^h[1-6]$/.test(tag);

    const explicit = getExplicitRoleToken(el);
    if (!explicit) return isNativeHeadingTag;
    if (explicit === 'heading') return true;
    if ((explicit === 'none' || explicit === 'presentation') && isNativeHeadingTag) {
      // Kept as a heading when focusable or carrying a global ARIA
      // attribute (presentational roles conflict resolution).
      return helpers.isPresentationalRoleIgnored(el);
    }
    return false;
  }

  function getAccessibleNameText(el) {
    closedContent = false;
    tooDeep = false;
    const al = normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-label'));
    if (al) return al;
    const alb = normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-labelledby'));
    if (alb) {
      const parts = [];
      for (const refId of alb.split(/\s+/).filter(Boolean)) {
        try {
          const ref = helpers.getElementByIdInTree(el, refId);
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
        const flags = info && Array.isArray(info.flags) ? info.flags : [];
        closedContent = flags.includes('closedContent');
        tooDeep = flags.includes('depth-limit');
        if (info && info.present && info.value) return info.value;
      } catch {}
    }
    return normalizeWs(dom.get(el, 'getAttribute') && dom.getAttribute(el, 'title'));
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('h1, h2, h3, h4, h5, h6, [role]', { internalsRoles: true })
    : helpers.queryAll('h1, h2, h3, h4, h5, h6, [role]');

  const occurrences = [];
  // A heading whose name may sit in content no script can read (a closed
  // shadow root, content nested too deep, ElementInternals): asked about,
  // not failed.
  const questions = [];
  let closedContent = false;
  let tooDeep = false;
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

    const internalsName =
      typeof helpers.getInternalsNameInfo === 'function'
        ? helpers.getInternalsNameInfo(el, ctx)
        : null;
    if (internalsName && internalsName.status === 'named') continue;
    if (internalsName && internalsName.status === 'unknown') {
      questions.push(helpers.reportOccurrence(el, helpers.internalsQuestion(el, 'name')));
      continue;
    }
    if (tooDeep) {
      questions.push(
        helpers.reportOccurrence(el, {
          summary:
            "This heading's content is nested too deeply to work out a name from, so whether it has one could not be told.",
          hint: "Check its name in the browser's accessibility tree; browsers stop reading content that deep too, so give the heading an aria-label or visible text near its top.",
          i18n: {
            summaryKey: 'emptyHeading_summary_cantTell_contentTooDeep',
            hintKey: 'emptyHeading_hint_cantTell_contentTooDeep'
          },
          uncertainty: {
            code: 'not-computable',
            needed: "The heading's name, from content nested too deep to read."
          },
          data: { details: { reasonCode: 'name_contentTooDeep' } }
        })
      );
      continue;
    }
    if (closedContent) {
      questions.push(
        helpers.reportOccurrence(el, {
          summary:
            'This heading may take its name from a component whose content no script can read (a closed shadow root), so whether it has one could not be told.',
          hint: "Check its name in the browser's accessibility tree or with a screen reader; if it has none, give it text or an aria-label.",
          i18n: {
            summaryKey: 'emptyHeading_summary_cantTell_closedContent',
            hintKey: 'emptyHeading_hint_cantTell_closedContent'
          },
          uncertainty: {
            code: 'not-computable',
            needed: 'Whether the component inside gives the heading a name.'
          },
          data: { details: { reasonCode: 'name_closedContent' } }
        })
      );
      continue;
    }

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
        hint: "Give the heading text, or name it with aria-label or aria-labelledby; remove it if it isn't needed.",
        i18n: {
          summaryKey: 'emptyHeading_summary_fail',
          hintKey: 'emptyHeading_hint_fail',
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
  // Tiered only when there is a question, so a plain failure reads as before.
  if (questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(occurrences, questions, rule.defaultSeverity || 'minor')
    };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
