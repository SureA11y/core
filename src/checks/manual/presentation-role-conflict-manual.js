/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check presentation-role-conflict
 * @atomic true
 * @summary role="presentation"/"none" must not be combined with a global ARIA naming attribute or focusability
 * @standard Best Practices (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Applies to elements with an explicit role="presentation" or
 *   role="none", OR an <img alt=""> (empty alt gives an <img> an implicit
 *   presentation role per HTML-AAM, even with no explicit role attribute
 *   at all — `img[alt=''], [role="none"], [role="presentation"]`).
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
 * - `aria-hidden="true"` (the exact valid truthy value) on the
 *   presentational element itself is deliberately EXCLUDED as a trigger,
 *   even though it's a global ARIA attribute: it removes the element from
 *   the accessibility tree unconditionally, so the "role restoration"
 *   this rule warns about never actually reaches assistive tech, making a
 *   flag misleading. Any OTHER conflicting attribute present alongside
 *   `aria-hidden="true"` is equally inert for the same reason and is not
 *   flagged either. An `aria-hidden=""` (empty/invalid value, does NOT
 *   hide) still triggers normally. Focusability is unaffected by this
 *   exemption (see the code comment at the check site).
 * - The conflicting-attribute set is the full list of ARIA attributes
 *   marked `global: true`, not a narrower naming-only list.
 * - Deliberately NOT applying an implicit-role applicability gate that
 *   would make the check inapplicable to role="presentation" on elements
 *   with no native implicit role to suppress (e.g. `<div
 *   role="presentation" aria-hidden="true">` — a <div> has no native role,
 *   so there's nothing for the presentational role to "conflict" with).
 *   surea11y stays broader/more cautious here rather than narrower, which
 *   is the safer direction to diverge in. The native-implicit-role table
 *   needed to add that gate, if this scope decision is ever revisited, is
 *   in ROADMAP.md §7 item 9.
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
  const { helpers, rule } = ctx;

  // The full set of ARIA attributes marked `global: true` per the WAI-ARIA
  // spec — any of these present on a presentational element restores its
  // implicit role, not just the naming ones.
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
    // with an empty value — e.g. <img alt="" aria-hidden="">, where
    // aria-hidden="" (empty string) is still a specified attribute. A
    // truthy-value check would miss this.
    let present = CONFLICTING_ATTRS.filter((attr) =>
      el.hasAttribute ? el.hasAttribute(attr) : el.getAttribute(attr) != null
    );

    // aria-hidden="true" (the exact, valid truthy value — not the
    // empty-string case above, which never actually hides anything) is a
    // special case: it removes the element and its subtree from the
    // accessibility tree unconditionally, independent of role. That makes
    // the "role restoration" this rule warns about ("...which restores its
    // implicit role and cancels the presentational intent") factually
    // inert — no AT will ever expose the restored role OR any of the other
    // conflicting attributes (aria-label, aria-describedby, ...) present
    // alongside it, since the whole element stays out of the tree
    // regardless. This pattern is extremely common (e.g. <svg
    // role="presentation" aria-hidden="true"> decorative icons — a
    // defensive belt-and-suspenders double-hide, not an authoring mistake).
    // Focusability is NOT covered by this exemption — a keyboard user can
    // still tab onto an aria-hidden="true" focusable element (the
    // aria-hidden-focus anti-pattern), a real, independent hazard
    // aria-hidden does nothing to prevent.
    if (el.getAttribute('aria-hidden') === 'true') {
      present = [];
    }

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

    occurrences.push(
      helpers.reportOccurrence(el, {
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
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
