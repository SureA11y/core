'use strict';

/**
 * @check presentation-role-conflict
 * @atomic true
 * @summary role="presentation"/"none" must not be combined with a global ARIA naming attribute or focusability
 * @standard Best Practices (a widely-used reference engine's classification; no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to elements with an explicit role="presentation" or
 *   role="none", OR an <img alt=""> (empty alt gives an <img> an implicit
 *   presentation role per HTML-AAM, even with no explicit role attribute
 *   at all — verified against a widely-used reference engine's own selector
 *   for this exact check, `img[alt=''], [role="none"], [role="presentation"]`).
 * @expectation
 *   The element does not also carry a WAI-ARIA *global* state/property
 *   (aria-label, aria-hidden, aria-describedby, aria-live, aria-current,
 *   ... — the full global-attribute set, not just the naming ones), AND
 *   is not focusable. Per the WAI-ARIA spec's Presentational Roles
 *   Conflict Resolution section, a presentational role is "restored" to
 *   the element's implicit semantic role when either condition holds —
 *   the presentation/none role silently stops working, contradicting the
 *   author's evident intent to hide the element from the accessibility
 *   tree.
 * @implementation-notes
 * - Not WCAG-normative — authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule; see landmark-banner-is-top-level's
 *   header comment for the shared rationale/precedent.
 * - The conflicting-attribute set matches a widely-used reference engine's
 *   own `none: ['is-element-focusable', 'has-global-aria-attribute']` condition
 *   exactly — `has-global-aria-attribute` checks against the full list of
 *   ARIA attributes marked `global: true` in that engine's own standards data
 *   (confirmed by reading `standards.ariaAttrs` directly at runtime, not
 *   guessed), which is much broader than the 3-attribute naming-only list
 *   this rule originally checked (added 2026-07-20, then widened
 *   2026-07-20 after a real page — Slack's homepage has
 *   `<img alt="" aria-hidden="">`, both gaps at once: the img[alt=''] case
 *   wasn't in the applicability selector at all, and aria-hidden wasn't in
 *   the conflicting-attribute set even if it had been).
 * - Deliberately NOT replicating that reference engine's
 *   `hasImplicitChromiumRoleMatches` applicability gate, which (per direct
 *   probing of the reference engine's runtime) makes its own check
 *   inapplicable to role="presentation" on elements with no
 *   native implicit role to suppress in the first place (e.g.
 *   `<div role="presentation" aria-hidden="true">` — a <div> has no native
 *   role, so there's nothing for the presentational role to "conflict"
 *   with per that engine's own scope decision). surea11y stays
 *   broader/more cautious here rather than narrower, which is the safer
 *   direction to diverge in, and no real false positive from staying
 *   broad has surfaced in any corpus round to date.
 * - The native-implicit-role table needed to replicate that gate (if this
 *   scope decision is ever revisited) has since been produced — see
 *   ROADMAP.md §7 item 9 (2026-07-31) for the full table and the open
 *   maintainer decision; not implemented here pending that call.
 * - Focusability is computed via helpers.getFocusableInfo (native +
 *   tabindex), same helper aria-hidden-focus already relies on — a
 *   `:disabled` or otherwise non-focusable element is not flagged.
 */

const id = 'presentation-role-conflict';

const meta = {
  title: 'Presentational role must not conflict with a global ARIA attribute or focusability',
  description:
    'Checks that role="presentation"/"none" (including an <img alt=""> implicit presentation role) is not combined with a global ARIA attribute (aria-label, aria-hidden, aria-describedby, ...) or focusability (tabindex/native).',
  i18n: {
    titleKey: 'presentationRoleConflict_title',
    descriptionKey: 'presentationRoleConflict_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'aria', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  // The full set of ARIA attributes marked `global: true` per the WAI-ARIA
  // spec (confirmed against a widely-used reference engine's own
  // `standards.ariaAttrs` data at runtime, 2026-07-20) — any of these present on a presentational
  // element restores its implicit role, not just the naming ones.
  const CONFLICTING_ATTRS = [
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

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role="presentation"], [role="none"], img[alt=""]')
    : helpers.queryAll('[role="presentation"], [role="none"], img[alt=""]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    applicableCount += 1;

    // Presence, not value truthiness: the WAI-ARIA role-conflict-resolution
    // rule triggers on a global ARIA attribute being SPECIFIED at all, even
    // with an empty value — found on a real site, Slack's homepage has
    // <img alt="" aria-hidden="">, where aria-hidden="" (empty string) is
    // still a specified attribute. A truthy-value check would have missed
    // this even after aria-hidden was added to CONFLICTING_ATTRS above.
    const present = CONFLICTING_ATTRS.filter((attr) =>
      el.hasAttribute ? el.hasAttribute(attr) : el.getAttribute(attr) != null
    );

    let isFocusable = false;
    if (getFocusableInfo) {
      try {
        const fi = getFocusableInfo(el, ctx);
        isFocusable = !!(fi && fi.focusable);
      } catch {
        isFocusable = false;
      }
    }

    if (!present.length && !isFocusable) continue;

    const parts = present.slice();
    if (isFocusable) parts.push('focusable');

    // No explicit role attribute means this matched via the img[alt=""]
    // implicit-presentation case.
    const role =
      String(el.getAttribute('role') || '')
        .trim()
        .toLowerCase() || 'presentation';
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary: `This role="${role}" element also has a conflicting condition (${parts.join(', ')}), which restores its implicit role and cancels the presentational intent.`,
      hint: 'Remove the conflicting naming attribute(s) and/or focusability (tabindex/native) if the element should stay presentational, or remove role="presentation"/"none" if it should be exposed to assistive technology.',
      i18n: {
        summaryKey: 'presentationRoleConflict_summary_cantTell',
        hintKey: 'presentationRoleConflict_hint_cantTell',
        params: { role, attrs: parts.join(', ') }
      },
      data: {
        details: {
          reasonCode: 'PRESENTATION_ROLE_CONFLICT',
          role,
          conflictingAttrs: present,
          focusable: isFocusable
        }
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
