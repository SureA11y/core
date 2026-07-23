'use strict';

/**
 * @check a11ycore-aria-allowed-attr
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
 *   against the reference engine 4.12.1's own per-role `allowedAttrs` table AND
 *   verified each addition is an unambiguous, well-established ARIA fact
 *   rather than a blind import — the reference engine's own table has ~68 roles, far more
 *   than were reconciled here; this pass deliberately took only the
 *   additions with clear, specific supported attributes (not just the
 *   near-universal, thin `aria-expanded` the reference engine allows on most roles), and
 *   left the rest for a dedicated future full-reconciliation pass rather
 *   than rushing all 68 through at lower confidence:
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
 * - Not gated on isAccTreeEligible: this is a static markup property.
 */

const id = 'a11ycore-aria-allowed-attr';

const meta = {
  title: 'aria-* attributes must be permitted for the element’s role',
  description: 'Checks that every recognized aria-* attribute present on an element with an explicit role is either globally supported or supported by that role.',
  i18n: {
    titleKey: 'a11ycore_ariaAllowedAttr_title',
    descriptionKey: 'a11ycore_ariaAllowedAttr_description'
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
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

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
    checkbox: ['aria-checked', 'aria-readonly', 'aria-required'],
    columnheader: ['aria-sort', 'aria-colindex', 'aria-colspan', 'aria-readonly', 'aria-required', 'aria-rowindex', 'aria-rowspan', 'aria-selected'],
    combobox: ['aria-expanded', 'aria-autocomplete', 'aria-readonly', 'aria-required'],
    dialog: ['aria-modal'],
    grid: ['aria-multiselectable', 'aria-readonly', 'aria-colcount', 'aria-rowcount'],
    gridcell: ['aria-selected', 'aria-readonly', 'aria-required', 'aria-colindex', 'aria-colspan', 'aria-rowindex', 'aria-rowspan'],
    heading: ['aria-level'],
    listbox: ['aria-multiselectable', 'aria-readonly', 'aria-required', 'aria-orientation'],
    listitem: ['aria-level', 'aria-posinset', 'aria-setsize'],
    menu: ['aria-activedescendant', 'aria-orientation'],
    menubar: ['aria-activedescendant', 'aria-orientation'],
    menuitemcheckbox: ['aria-checked'],
    menuitemradio: ['aria-checked'],
    meter: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext'],
    option: ['aria-selected', 'aria-checked', 'aria-posinset', 'aria-setsize'],
    progressbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext'],
    radio: ['aria-checked'],
    radiogroup: ['aria-readonly', 'aria-required', 'aria-orientation'],
    row: ['aria-selected', 'aria-level', 'aria-posinset', 'aria-setsize', 'aria-colindex', 'aria-rowindex'],
    rowheader: ['aria-sort', 'aria-colindex', 'aria-colspan', 'aria-readonly', 'aria-required', 'aria-rowindex', 'aria-rowspan', 'aria-selected'],
    scrollbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-orientation', 'aria-controls'],
    searchbox: ['aria-activedescendant', 'aria-autocomplete', 'aria-multiline', 'aria-placeholder', 'aria-readonly', 'aria-required'],
    separator: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-orientation'],
    slider: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-orientation', 'aria-readonly'],
    spinbutton: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-readonly', 'aria-required'],
    switch: ['aria-checked'],
    tab: ['aria-selected'],
    table: ['aria-colcount', 'aria-rowcount'],
    tablist: ['aria-multiselectable', 'aria-orientation'],
    textbox: ['aria-activedescendant', 'aria-autocomplete', 'aria-multiline', 'aria-placeholder', 'aria-readonly', 'aria-required'],
    toolbar: ['aria-activedescendant', 'aria-orientation'],
    tree: ['aria-multiselectable', 'aria-readonly', 'aria-required', 'aria-orientation'],
    treegrid: ['aria-multiselectable', 'aria-readonly', 'aria-required', 'aria-orientation', 'aria-colcount', 'aria-rowcount'],
    treeitem: ['aria-checked', 'aria-selected', 'aria-expanded', 'aria-level', 'aria-posinset', 'aria-setsize']
  };

  const globalSet = new Set(GLOBAL_ATTRS);
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[role]', safeRoot) : helpers.queryAll('[role]', safeRoot);

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
      if (!ariaHelpers.isValidAriaAttrName(name)) continue; // a11ycore-aria-valid-attr's concern

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
          summaryKey: 'a11ycore_ariaAllowedAttr_summary_fail',
          hintKey: 'a11ycore_ariaAllowedAttr_hint_fail',
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
