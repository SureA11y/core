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
 * - SUPPORTED_ATTRS_BY_ROLE holds unambiguous, well-established ARIA facts:
 *   subclass relationships like `searchbox`==`textbox`; same-family widget
 *   properties like `columnheader`/`rowheader` sort/col-row-index/span
 *   matching `gridcell`/`row`; spec-defining properties like `dialog`/
 *   `alertdialog` `aria-modal`. `aria-expanded` entries are checked against
 *   `aria-query` (which tracks the published WAI-ARIA 1.2 Recommendation,
 *   with superclass inheritance resolved, e.g. `aria-activedescendant` via
 *   the abstract `composite` role) rather than imported wholesale, since
 *   much of the wider ARIA-1.1 `aria-expanded` allowance list is legacy/
 *   AT-compat carryover, not current-spec fact.
 *   `meter`'s valuenow/valuemax/valuemin/valuetext is also separately
 *   *required* (see `aria-required-attr`), but the two tables aren't
 *   unioned automatically, so it's listed in both places.
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 */

const id = 'aria-allowed-attr';

const meta = {
  title: 'aria-* attributes must be permitted for the element’s role',
  description:
    'Checks that every recognized aria-* attribute present on an element with an explicit role is either globally supported or supported by that role.',
  i18n: {
    titleKey: 'ariaAllowedAttr_title',
    descriptionKey: 'ariaAllowedAttr_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-allowed-for-role'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

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

  // Per-role supported (non-global) states/properties. Deliberately
  // conservative — see src/core/aria-helpers.js file header for the same
  // confidence-scoping rationale; only well-established, unambiguous
  // role/attribute pairings from the WAI-ARIA role definitions are listed.
  const SUPPORTED_ATTRS_BY_ROLE = {
    alertdialog: ['aria-modal'],
    checkbox: ['aria-checked', 'aria-readonly', 'aria-required', 'aria-expanded'],
    columnheader: [
      'aria-sort',
      'aria-colindex',
      'aria-colspan',
      'aria-readonly',
      'aria-required',
      'aria-rowindex',
      'aria-rowspan',
      'aria-selected',
      'aria-expanded'
    ],
    combobox: [
      'aria-expanded',
      'aria-autocomplete',
      'aria-readonly',
      'aria-required',
      'aria-activedescendant'
    ],
    dialog: ['aria-modal'],
    grid: [
      'aria-multiselectable',
      'aria-readonly',
      'aria-colcount',
      'aria-rowcount',
      'aria-activedescendant'
    ],
    gridcell: [
      'aria-selected',
      'aria-readonly',
      'aria-required',
      'aria-colindex',
      'aria-colspan',
      'aria-rowindex',
      'aria-rowspan',
      'aria-expanded'
    ],
    heading: ['aria-level'],
    listbox: [
      'aria-multiselectable',
      'aria-readonly',
      'aria-required',
      'aria-orientation',
      'aria-expanded',
      'aria-activedescendant'
    ],
    listitem: ['aria-level', 'aria-posinset', 'aria-setsize'],
    menu: ['aria-activedescendant', 'aria-orientation'],
    menubar: ['aria-activedescendant', 'aria-orientation'],
    menuitemcheckbox: [
      'aria-checked',
      'aria-expanded',
      'aria-readonly',
      'aria-required',
      'aria-posinset',
      'aria-setsize'
    ],
    menuitemradio: [
      'aria-checked',
      'aria-expanded',
      'aria-readonly',
      'aria-required',
      'aria-posinset',
      'aria-setsize'
    ],
    meter: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext'],
    option: ['aria-selected', 'aria-checked', 'aria-posinset', 'aria-setsize'],
    progressbar: ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext'],
    radio: ['aria-checked', 'aria-posinset', 'aria-setsize'],
    radiogroup: ['aria-readonly', 'aria-required', 'aria-orientation', 'aria-activedescendant'],
    row: [
      'aria-selected',
      'aria-level',
      'aria-posinset',
      'aria-setsize',
      'aria-colindex',
      'aria-rowindex',
      'aria-expanded',
      'aria-activedescendant'
    ],
    rowheader: [
      'aria-sort',
      'aria-colindex',
      'aria-colspan',
      'aria-readonly',
      'aria-required',
      'aria-rowindex',
      'aria-rowspan',
      'aria-selected',
      'aria-expanded'
    ],
    scrollbar: [
      'aria-valuenow',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuetext',
      'aria-orientation',
      'aria-controls'
    ],
    searchbox: [
      'aria-activedescendant',
      'aria-autocomplete',
      'aria-multiline',
      'aria-placeholder',
      'aria-readonly',
      'aria-required'
    ],
    separator: [
      'aria-valuenow',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuetext',
      'aria-orientation'
    ],
    slider: [
      'aria-valuenow',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuetext',
      'aria-orientation',
      'aria-readonly'
    ],
    spinbutton: [
      'aria-valuenow',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuetext',
      'aria-readonly',
      'aria-required',
      'aria-activedescendant'
    ],
    switch: ['aria-checked', 'aria-expanded', 'aria-readonly', 'aria-required'],
    tab: ['aria-selected', 'aria-expanded', 'aria-posinset', 'aria-setsize'],
    table: ['aria-colcount', 'aria-rowcount'],
    tablist: ['aria-multiselectable', 'aria-orientation', 'aria-level', 'aria-activedescendant'],
    textbox: [
      'aria-activedescendant',
      'aria-autocomplete',
      'aria-multiline',
      'aria-placeholder',
      'aria-readonly',
      'aria-required'
    ],
    toolbar: ['aria-activedescendant', 'aria-orientation'],
    tree: ['aria-multiselectable', 'aria-required', 'aria-orientation', 'aria-activedescendant'],
    treegrid: [
      'aria-multiselectable',
      'aria-readonly',
      'aria-required',
      'aria-orientation',
      'aria-colcount',
      'aria-rowcount',
      'aria-activedescendant'
    ],
    treeitem: [
      'aria-checked',
      'aria-selected',
      'aria-expanded',
      'aria-level',
      'aria-posinset',
      'aria-setsize'
    ]
  };

  const globalSet = new Set(GLOBAL_ATTRS);
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

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
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

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
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
