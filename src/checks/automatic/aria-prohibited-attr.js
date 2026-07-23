'use strict';

/**
 * @check a11ycore-aria-prohibited-attr
 * @atomic true
 * @summary Certain ARIA naming attributes are explicitly prohibited on specific roles
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements whose explicit, valid role is one of the small set
 *   of WAI-ARIA 1.2 roles with a documented "Prohibited ARIA States and
 *   Properties" list (pure text-semantics / non-naming structural roles:
 *   caption, code, deletion, emphasis, generic, insertion, mark, none,
 *   paragraph, presentation, strong, subscript, suggestion, superscript,
 *   time), and that also carry aria-label or aria-labelledby.
 * @expectation
 *   Prohibited attributes must not be present, since these roles are
 *   defined to never carry an accessible name — a naming attribute on them
 *   is a real, deterministic spec violation, not a style preference.
 * @implementation-notes
 * - Deliberately scoped to the single, well-established prohibition class
 *   (naming attributes on pure text-semantics roles) rather than
 *   attempting an exhaustive per-role prohibited-attribute table; see
 *   src/core/aria-helpers.js file header for this engine's confidence-
 *   scoping rationale.
 * - Role list widened 2026-07-19 (Tier 4) from 10 to 13 roles, adding
 *   `mark`, `suggestion`, and `time` — the other ARIA 1.2 "HTML-alignment"
 *   text-level roles that share the same documented prohibition as the
 *   original 10. Still deliberately not claiming full the reference engine parity:
 *   only roles/attrs this engine has high confidence in from the spec
 *   text are included, per the file's own "wrong entries cause false-
 *   positive fails" caution.
 * - Widened again 2026-07-21 to add `presentation`/`none`, verified
 *   directly against the reference engine 4.12.1's own role data table
 *   (`node_modules/the reference engine/its source` — both have `prohibitedAttrs:
 *   ['aria-label', 'aria-labelledby']`), and corroborated by the W3C
 *   WAI-ARIA 1.2 spec's own §5.2.8.6 "Roles which cannot be named"
 *   listing `presentation` explicitly (`none` is `presentation`'s
 *   documented 1.2-introduced alias, identical semantics). The
 *   pre-existing `presentation-role-conflict` rule already treats
 *   aria-label/aria-labelledby as conflicting on these two roles, but at
 *   `manual`/cantTell confidence across a ~24-attribute general list —
 *   this addition lets the specific, unambiguous naming-prohibition case
 *   also fire as a hard, WCAG-normative `fail` via this rule, matching
 *   this engine's "one rule = one normative decision" pattern rather than
 *   only ever surfacing it as advisory.
 * - Investigated, but deliberately did NOT add, `definition`/`term`
 *   despite both appearing on MDN's aria-label reference page's
 *   "not supported" list: that MDN list is demonstrably wrong for these
 *   two — the reference engine's own role data explicitly declares
 *   `nameFrom: ['author']` (`definition`) / `nameFrom: ['author',
 *   'contents']` (`term`), and the W3C spec's own §5.2.8.4 "Roles
 *   Supporting Name From Author" index lists both by name; MDN's
 *   `definition_role` page even demonstrates `aria-labelledby` usage on
 *   it directly. A real, confirmed documentation bug on MDN's side, not
 *   a gap here.
 * - Not gated on isAccTreeEligible: this is a static markup property.
 */

const id = 'a11ycore-aria-prohibited-attr';

const meta = {
  title: 'ARIA naming attributes must not be used on roles that prohibit them',
  description: 'Checks that aria-label/aria-labelledby are not present on WAI-ARIA roles whose specification explicitly prohibits ARIA naming (e.g. generic, emphasis, strong, paragraph).',
  i18n: {
    titleKey: 'a11ycore_ariaProhibitedAttr_title',
    descriptionKey: 'a11ycore_ariaProhibitedAttr_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-not-prohibited'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // Roles whose WAI-ARIA 1.2 definition lists a "Prohibited ARIA States and
  // Properties" entry for naming attributes (these roles must never carry an
  // accessible name). Declared inside runInPage (rather than at module
  // scope) because the build inlines only this function's own source text
  // — see scripts/build-core.js header ("runInPage MUST be self-contained").
  const ROLES_PROHIBITING_NAME = new Set([
    'caption', 'code', 'deletion', 'emphasis', 'generic', 'insertion',
    'mark', 'none', 'paragraph', 'presentation', 'strong', 'subscript',
    'suggestion', 'superscript', 'time'
  ]);

  const PROHIBITED_NAMING_ATTRS = ['aria-label', 'aria-labelledby'];

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[role]', safeRoot) : helpers.queryAll('[role]', safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ROLES_PROHIBITING_NAME.has(role)) continue;

    applicableCount += 1;

    const present = [];
    for (const attr of PROHIBITED_NAMING_ATTRS) {
      const v = el.getAttribute(attr);
      if (v != null && String(v).trim() !== '') present.push(attr);
    }

    if (!present.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    for (const attr of present) {
      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This attribute is prohibited on this element’s role.',
        hint: 'Remove this attribute; this role must not carry an accessible name.',
        i18n: {
          summaryKey: 'a11ycore_ariaProhibitedAttr_summary_fail',
          hintKey: 'a11ycore_ariaProhibitedAttr_hint_fail',
          params: { attr, role }
        },
        data: {
          details: { reasonCode: 'ARIA_ATTR_PROHIBITED', attr, role }
        }
      });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'moderate', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
