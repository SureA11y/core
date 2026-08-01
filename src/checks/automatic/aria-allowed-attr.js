'use strict';

/**
 * @check aria-allowed-attr
 * @atomic true
 * @summary aria-* attributes present must be permitted for the element's role
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements with an explicit, valid, non-abstract role that
 *   also carry at least one recognized aria-* attribute.
 * @expectation
 *   Every recognized aria-* attribute present is either: (a) globally
 *   supported on any element (the "global" ARIA states/properties, e.g.
 *   aria-label/aria-hidden/aria-describedby), or (b) explicitly listed as
 *   a required or supported state/property for the element's role.
 * @implementation-notes
 * - Only evaluated for elements with an explicit role, since the global
 *   set already covers implicit-role elements without asserting anything
 *   role-specific; scope kept deliberately narrow to avoid false positives
 *   on implicit-role ARIA-in-HTML edge cases not modeled here.
 * - SUPPORTED_ATTRS_BY_ROLE widened 2026-07-21 (7 new roles), cross-checked
 *   against a widely-used reference engine's own per-role `allowedAttrs`
 *   table AND verified each addition is an unambiguous, well-established ARIA
 *   fact rather than a blind import:
 *   - `searchbox`: identical to the already-covered `textbox` (ARIA
 *     explicitly defines searchbox as textbox's subclass, same supported
 *     set).
 *   - `meter`: valuenow/valuemax/valuemin/valuetext, matching the
 *     already-covered slider/progressbar/scrollbar/spinbutton pattern
 *     (valuenow is also separately *required* on meter — see
 *     `aria-required-attr`'s own 2026-07-21 widening — but the two tables
 *     aren't unioned automatically, so it needs listing in both places).
 *   - `columnheader`/`rowheader`: same table-role family already covered
 *     by `gridcell`/`row` — sort/col-row-index/span are standard WAI-ARIA
 *     grid-model properties.
 *   - `dialog`/`alertdialog`: `aria-modal` — the spec-defining property
 *     that distinguishes a modal from a non-modal dialog; unambiguous.
 *   - `listitem`: level/posinset/setsize — standard flat-representation-
 *     of-hierarchy properties, same family as the already-covered
 *     `treeitem`.
 *   - `menu`/`menubar`/`toolbar`: activedescendant/orientation — standard
 *     composite-widget properties, same family as the already-covered
 *     `tablist`.
 * - SUPPORTED_ATTRS_BY_ROLE full-reconciliation pass 2026-07-28: the
 *   2026-07-21 pass deliberately deferred ~61 roles where a widely-used
 *   reference engine allows `aria-expanded`, treating it as too thin/
 *   near-universal to import blindly. Checked against `aria-query`
 *   (tracks the published WAI-ARIA 1.2 Recommendation, 6 June 2023 — the
 *   latest actually-published version, as opposed to the in-progress 1.3
 *   Editor's Draft) instead of that reference engine directly, because its own
 *   source comments (`// Spec difference: Aria-expanded removed in 1.2`)
 *   show that most of its `aria-expanded` allowances are deliberate
 *   ARIA-1.1 legacy/AT-compat carryovers it keeps on purpose, not
 *   current-spec facts — importing them wholesale would have re-added
 *   exactly the kind of unverified allowance the 07-21 pass was avoiding.
 *   `aria-query`'s per-role tables (with superclass inheritance resolved,
 *   e.g. `aria-activedescendant` via the abstract `composite` role) gave a
 *   spec-grounded diff instead. Net changes from that diff:
 *   - `aria-expanded` added to: checkbox, columnheader, gridcell, listbox,
 *     menuitemcheckbox, menuitemradio, row, rowheader, switch, tab —
 *     confirmed present in current spec for these roles specifically
 *     (unlike e.g. `listitem`, `dialog`, `alertdialog`, `heading`, which
 *     the spec does NOT list it for — those stay excluded).
 *   - `aria-activedescendant` added to: combobox, grid, listbox,
 *     radiogroup, row, spinbutton, tablist, treegrid (inherited from the
 *     abstract `composite` role for any composite/managed-focus widget).
 *   - `aria-readonly`/`aria-required` added to: switch, menuitemcheckbox,
 *     menuitemradio. `aria-posinset`/`aria-setsize` added to: tab, radio,
 *     menuitemcheckbox, menuitemradio. `aria-level` added to: tablist.
 *   - `tree`'s `aria-readonly` removed: not in aria-query's resolved
 *     props for `tree` (was an unverified carryover, not spec-backed).
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 */

const id = 'aria-allowed-attr';

const meta = {
  title: 'aria-* attributes must be permitted for the element’s role',
  description: 'Checks that every recognized aria-* attribute present on an element with an explicit role is either globally supported or supported by that role.',
  i18n: {
    titleKey: 'ariaAllowedAttr_title',
    descriptionKey: 'ariaAllowedAttr_description'
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
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-allowed-for-role'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // Global ARIA states/properties supported on (almost) any element,
  // regardless of role, per the WAI-ARIA "Global States and Properties" list.
  // Declared inside runInPage (rather than at module scope) because the
  // build inlines only this function's own source text — see
  // scripts/build-core.js header ("runInPage MUST be self-contained").
  const GLOBAL_ATTRS = [
    'aria-atomic', 'aria-braillelabel', 'aria-brailleroledescription', 'aria-busy',
    'aria-controls', 'aria-current', 'aria-describedby', 'aria-description',
    'aria-details', 'aria-disabled', 'aria-dropeffect', 'aria-errormessage',
    'aria-flowto', 'aria-grabbed', 'aria-haspopup', 'aria-hidden', 'aria-invalid',
    'aria-keyshortcuts', 'aria-label', 'aria-labelledby', 'aria-live', 'aria-owns',
    'aria-relevant', 'aria-roledescription'
  ];

  // Per-role supported (non-global) states/properties. Deliberately
  // conservative — see src/core/aria-helpers.js file header for the same
  // confidence-scoping rationale; only well-established, unambiguous
  // role/attribute pairings from the WAI-ARIA role definitions are listed.
  const SUPPORTED_ATTRS_BY_ROLE = {
    alertdialog: ['aria-modal'],
    checkbox: ['aria-checked', 'aria-readonly', 'aria-required', 'aria-expanded'],
    columnheader: ['aria-sort', 'aria-colindex', 'aria-colspan', 'aria-readonly', 'aria-required', 'aria-rowindex', 'aria-rowspan', 'aria-selected', 'aria-expanded'],
    combobox: ['aria-expanded', 'aria-autocomplete', 'aria-readonly', 'aria-required', 'aria-activedescendant'],
    dialog: ['aria-modal'],
    grid: ['aria-multiselectable', 'aria-readonly', 'aria-colcount', 'aria-rowcount', 'aria-activedescendant'],
    gridcell: ['aria-selected', 'aria-readonly', 'aria-required', 'aria-colindex', 'aria-colspan', 'aria-rowindex', 'aria-rowspan', 'aria-expanded'],
    heading: ['aria-level'],
    listbox: ['aria-multiselectable', 'aria-readonly', 'aria-required', 'aria-orientation', 'aria-expanded', 'aria-activedescendant'],
    listitem: ['aria-level', 'aria-posinset', 'aria-setsize'],
    menu: ['aria-activedescendant', 'aria-orientation'],
    menubar: ['aria-activedescendant', 'aria-orientation'],
    menuitemcheckbox: ['aria-checked', 'aria-expanded', 'aria-readonly', 'aria-required', 'aria-posinset', 'aria-setsize'],
    menuitemradio: ['aria-checked', 'aria-expanded', 'aria-readonly', 'aria-required', 'aria-posinset', 'aria-setsize'],
    meter: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext'],
    option: ['aria-selected', 'aria-checked', 'aria-posinset', 'aria-setsize'],
    progressbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext'],
    radio: ['aria-checked', 'aria-posinset', 'aria-setsize'],
    radiogroup: ['aria-readonly', 'aria-required', 'aria-orientation', 'aria-activedescendant'],
    row: ['aria-selected', 'aria-level', 'aria-posinset', 'aria-setsize', 'aria-colindex', 'aria-rowindex', 'aria-expanded', 'aria-activedescendant'],
    rowheader: ['aria-sort', 'aria-colindex', 'aria-colspan', 'aria-readonly', 'aria-required', 'aria-rowindex', 'aria-rowspan', 'aria-selected', 'aria-expanded'],
    scrollbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-orientation', 'aria-controls'],
    searchbox: ['aria-activedescendant', 'aria-autocomplete', 'aria-multiline', 'aria-placeholder', 'aria-readonly', 'aria-required'],
    separator: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-orientation'],
    slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-orientation', 'aria-readonly'],
    spinbutton: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-readonly', 'aria-required', 'aria-activedescendant'],
    switch: ['aria-checked', 'aria-expanded', 'aria-readonly', 'aria-required'],
    tab: ['aria-selected', 'aria-expanded', 'aria-posinset', 'aria-setsize'],
    table: ['aria-colcount', 'aria-rowcount'],
    tablist: ['aria-multiselectable', 'aria-orientation', 'aria-level', 'aria-activedescendant'],
    textbox: ['aria-activedescendant', 'aria-autocomplete', 'aria-multiline', 'aria-placeholder', 'aria-readonly', 'aria-required'],
    toolbar: ['aria-activedescendant', 'aria-orientation'],
    tree: ['aria-multiselectable', 'aria-required', 'aria-orientation', 'aria-activedescendant'],
    treegrid: ['aria-multiselectable', 'aria-readonly', 'aria-required', 'aria-orientation', 'aria-colcount', 'aria-rowcount', 'aria-activedescendant'],
    treeitem: ['aria-checked', 'aria-selected', 'aria-expanded', 'aria-level', 'aria-posinset', 'aria-setsize']
  };

  const globalSet = new Set(GLOBAL_ATTRS);
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[role]') : helpers.queryAll('[role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.attributes) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ariaHelpers.isValidConcreteRole(role)) continue; // aria-roles-valid's concern

    // Deliberately scoped: only roles with an explicit supported-attrs
    // entry are evaluated (see file header — kept narrow to avoid
    // over-claiming constraints for roles not yet modeled here).
    const roleSupported = SUPPORTED_ATTRS_BY_ROLE[role];
    if (!roleSupported) continue;
    const roleSupportedSet = new Set(roleSupported);

    let disallowed = null;
    const attrs = el.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (name.slice(0, 5) !== 'aria-') continue;
      if (!ariaHelpers.isValidAriaAttrName(name)) continue; // aria-valid-attr's concern

      applicableCount += 1;

      if (globalSet.has(name) || roleSupportedSet.has(name)) continue;

      if (!disallowed) disallowed = [];
      disallowed.push(name);
    }

    if (!disallowed || !disallowed.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    for (const name of disallowed) {
      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This ARIA attribute is not permitted for this element’s role.',
        hint: 'Remove this attribute, or use a role that supports it.',
        i18n: {
          summaryKey: 'ariaAllowedAttr_summary_fail',
          hintKey: 'ariaAllowedAttr_hint_fail',
          params: { attr: name, role }
        },
        data: {
          details: { reasonCode: 'ARIA_ATTR_NOT_ALLOWED', attr: name, role }
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
