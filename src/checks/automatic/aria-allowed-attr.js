/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-allowed-attr
 * @atomic true
 * @summary aria-* attributes present must be permitted for the element's role
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements carrying at least one recognized, non-global
 *   aria-* attribute, judged against the role they actually have: an
 *   explicit valid role, else the implicit role of their tag, else, for
 *   the elements HTML-AAM maps to no role at all, nothing.
 *   A custom element with no role attribute naming a role is judged against
 *   the role its ElementInternals give it (this.attachInternals().role), its
 *   default role, as a native element is judged against its tag's.
 * @expectation
 *   Every recognized aria-* attribute present is either: (a) globally
 *   supported on any element (the "global" ARIA states/properties, e.g.
 *   aria-label/aria-hidden/aria-describedby), or (b) explicitly listed as
 *   a required or supported state/property for the element's role.
 *   An attribute ARIA deprecated (rather than prohibited) on the role is
 *   still allowed: it is reported as CANTTELL, so the author decides, not
 *   as a not-allowed FAIL.
 * @reports
 *   - `attr`: the aria-* attribute that is not allowed, or deprecated, on
 *     the element.
 *   - `role` (an element with a role): the role it was judged against,
 *     explicit or implicit. Absent when the element has no role at all.
 * @implementation-notes
 * - Three tiers of role resolution, in order: an explicit `role`; the
 *   implicit role of the tag (IMPLICIT_ROLE_BY_ELEMENT, generated only for
 *   elements whose role is the same in every context, see
 *   `scripts/generate-aria-tables.js` for what is excluded and why); and
 *   ROLELESS_ELEMENTS, the tags HTML-AAM gives no role at all. A
 *   role-specific attribute on one of those is supported by nothing, which
 *   is exactly ACT 5c01ea's `<audio controls aria-orientation="horizontal">`.
 *   Elements whose role depends on their attributes are judged as ARIA in
 *   HTML allows: `<a>`/`<area>` with `href` as `link`; `<img>` with
 *   `alt=""` and no other name as an element with no role (only global
 *   attributes), any other `<img>` as `img`; `<select>` as `listbox` with
 *   `multiple` or `size` above 1, else as `combobox` with `menu`'s
 *   attributes too; date and time inputs with `textbox`'s attributes;
 *   `<input type="color">` with `aria-disabled` only and
 *   `<input type="file">` with `aria-disabled`, `aria-invalid` and
 *   `aria-required`; a text, search, telephone, URL or email input whose
 *   `list` names a `<datalist>` as `combobox`. A `<td>` is judged by its
 *   table, as HTML-AAM maps it: `cell` in a table, `gridcell` in a grid or
 *   treegrid, and no role (only global attributes) in a presentational
 *   table. Any other element whose role depends on where it is
 *   (`<section>`, `<th>`, `<li>`, ...), or `<a>` without `href`, is still
 *   skipped rather than guessed at.
 * - `<div>`/`<span>` resolve to `generic`, whose supported set is empty, so
 *   `<div aria-expanded="true">` is reported: the attribute announces
 *   nothing on an element with no widget semantics, which is a real defect
 *   and not a spec technicality.
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
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // Global ARIA states/properties supported on (almost) any element,
  // regardless of role, per the WAI-ARIA "Global States and Properties" list.
  // Declared inside runInPage (rather than at module scope) because the
  // build inlines only this function's own source text, see
  // scripts/build-core.js header ("runInPage MUST be self-contained").
  // <generated:aria-global-attrs>
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
    'aria-dropeffect',
    'aria-flowto',
    'aria-grabbed',
    'aria-hidden',
    'aria-keyshortcuts',
    'aria-label',
    'aria-labelledby',
    'aria-live',
    'aria-owns',
    'aria-relevant',
    'aria-roledescription'
  ];
  // </generated:aria-global-attrs>

  // Per-role supported (non-global) states/properties.
  // conservative, see src/core/aria-helpers.js file header for the same
  // confidence-scoping rationale; only well-established, unambiguous
  // role/attribute pairings from the WAI-ARIA role definitions are listed.
  // <generated:aria-implicit-roles>
  const IMPLICIT_ROLE_BY_ELEMENT = {
    article: 'article',
    blockquote: 'blockquote',
    button: 'button',
    caption: 'caption',
    code: 'code',
    dd: 'definition',
    del: 'deletion',
    details: 'group',
    dfn: 'term',
    dialog: 'dialog',
    div: 'generic',
    dt: 'term',
    em: 'emphasis',
    fieldset: 'group',
    figure: 'figure',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
    hr: 'separator',
    ins: 'insertion',
    main: 'main',
    mark: 'mark',
    menu: 'list',
    meter: 'meter',
    nav: 'navigation',
    ol: 'list',
    optgroup: 'group',
    option: 'option',
    output: 'status',
    p: 'paragraph',
    progress: 'progressbar',
    strong: 'strong',
    span: 'generic',
    sub: 'subscript',
    sup: 'superscript',
    textarea: 'textbox',
    time: 'time',
    ul: 'list',
    'input[type=text]': 'textbox',
    'input[type=tel]': 'textbox',
    'input[type=url]': 'textbox',
    'input[type=email]': 'textbox',
    'input[type=password]': 'textbox',
    'input[type=search]': 'searchbox',
    'input[type=number]': 'spinbutton',
    'input[type=range]': 'slider',
    'input[type=checkbox]': 'checkbox',
    'input[type=radio]': 'radio',
    'input[type=button]': 'button',
    'input[type=submit]': 'button',
    'input[type=reset]': 'button',
    'input[type=image]': 'button'
  };
  const NON_GLOBAL_ARIA_ATTR_SELECTOR =
    '[aria-activedescendant], [aria-autocomplete], [aria-checked], [aria-colcount], [aria-colindex], [aria-colspan], [aria-disabled], [aria-errormessage], [aria-expanded], [aria-haspopup], [aria-invalid], [aria-level], [aria-modal], [aria-multiline], [aria-multiselectable], [aria-orientation], [aria-placeholder], [aria-posinset], [aria-pressed], [aria-readonly], [aria-required], [aria-rowcount], [aria-rowindex], [aria-rowspan], [aria-selected], [aria-setsize], [aria-sort], [aria-valuemax], [aria-valuemin], [aria-valuenow], [aria-valuetext]';
  // </generated:aria-implicit-roles>

  // <generated:aria-roleless-elements>
  const ROLELESS_ELEMENTS = new Set(['audio', 'video']);
  // </generated:aria-roleless-elements>

  // <generated:aria-role-attrs>
  const SUPPORTED_ATTRS_BY_ROLE = {
    alert: [],
    alertdialog: ['aria-modal'],
    application: [
      'aria-activedescendant',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    article: ['aria-posinset', 'aria-setsize'],
    banner: [],
    blockquote: [],
    button: ['aria-disabled', 'aria-expanded', 'aria-haspopup', 'aria-pressed'],
    caption: [],
    cell: ['aria-colindex', 'aria-colspan', 'aria-rowindex', 'aria-rowspan'],
    checkbox: [
      'aria-checked',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-invalid',
      'aria-readonly',
      'aria-required'
    ],
    code: [],
    columnheader: [
      'aria-colindex',
      'aria-colspan',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid',
      'aria-readonly',
      'aria-required',
      'aria-rowindex',
      'aria-rowspan',
      'aria-selected',
      'aria-sort'
    ],
    combobox: [
      'aria-activedescendant',
      'aria-autocomplete',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid',
      'aria-readonly',
      'aria-required'
    ],
    complementary: [],
    contentinfo: [],
    definition: [],
    deletion: [],
    dialog: ['aria-modal'],
    directory: [],
    'doc-abstract': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-acknowledgments': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-afterword': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-appendix': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-backlink': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-biblioentry': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid',
      'aria-level',
      'aria-posinset',
      'aria-setsize'
    ],
    'doc-bibliography': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-biblioref': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-chapter': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-colophon': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-conclusion': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-cover': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-credit': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-credits': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-dedication': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-endnote': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid',
      'aria-level',
      'aria-posinset',
      'aria-setsize'
    ],
    'doc-endnotes': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-epigraph': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-epilogue': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-errata': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-example': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-footnote': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-foreword': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-glossary': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-glossref': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-index': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-introduction': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-noteref': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-notice': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-pagebreak': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid',
      'aria-orientation',
      'aria-valuemax',
      'aria-valuemin',
      'aria-valuenow',
      'aria-valuetext'
    ],
    'doc-pagefooter': ['aria-disabled', 'aria-errormessage', 'aria-haspopup', 'aria-invalid'],
    'doc-pageheader': ['aria-disabled', 'aria-errormessage', 'aria-haspopup', 'aria-invalid'],
    'doc-pagelist': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-part': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-preface': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-prologue': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-pullquote': [],
    'doc-qna': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-subtitle': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-tip': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'doc-toc': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    document: [],
    emphasis: [],
    feed: [],
    figure: [],
    form: [],
    generic: [],
    'graphics-document': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'graphics-object': [
      'aria-activedescendant',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    'graphics-symbol': [
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid'
    ],
    grid: [
      'aria-activedescendant',
      'aria-colcount',
      'aria-disabled',
      'aria-multiselectable',
      'aria-readonly',
      'aria-rowcount'
    ],
    gridcell: [
      'aria-colindex',
      'aria-colspan',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid',
      'aria-readonly',
      'aria-required',
      'aria-rowindex',
      'aria-rowspan',
      'aria-selected'
    ],
    group: ['aria-activedescendant', 'aria-disabled'],
    heading: ['aria-level'],
    img: [],
    insertion: [],
    link: ['aria-disabled', 'aria-expanded', 'aria-haspopup'],
    list: [],
    listbox: [
      'aria-activedescendant',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-invalid',
      'aria-multiselectable',
      'aria-orientation',
      'aria-readonly',
      'aria-required'
    ],
    listitem: ['aria-level', 'aria-posinset', 'aria-setsize'],
    log: [],
    main: [],
    mark: [],
    marquee: [],
    math: [],
    menu: ['aria-activedescendant', 'aria-disabled', 'aria-orientation'],
    menubar: ['aria-activedescendant', 'aria-disabled', 'aria-orientation'],
    menuitem: ['aria-disabled', 'aria-expanded', 'aria-haspopup', 'aria-posinset', 'aria-setsize'],
    menuitemcheckbox: [
      'aria-checked',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid',
      'aria-posinset',
      'aria-readonly',
      'aria-required',
      'aria-setsize'
    ],
    menuitemradio: [
      'aria-checked',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid',
      'aria-posinset',
      'aria-readonly',
      'aria-required',
      'aria-setsize'
    ],
    meter: ['aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext'],
    navigation: [],
    none: [],
    note: [],
    option: ['aria-checked', 'aria-disabled', 'aria-posinset', 'aria-selected', 'aria-setsize'],
    paragraph: [],
    presentation: [],
    progressbar: ['aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext'],
    radio: ['aria-checked', 'aria-disabled', 'aria-posinset', 'aria-setsize'],
    radiogroup: [
      'aria-activedescendant',
      'aria-disabled',
      'aria-errormessage',
      'aria-invalid',
      'aria-orientation',
      'aria-readonly',
      'aria-required'
    ],
    region: [],
    row: [
      'aria-activedescendant',
      'aria-colindex',
      'aria-disabled',
      'aria-expanded',
      'aria-level',
      'aria-posinset',
      'aria-rowindex',
      'aria-selected',
      'aria-setsize'
    ],
    rowgroup: [],
    rowheader: [
      'aria-colindex',
      'aria-colspan',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-haspopup',
      'aria-invalid',
      'aria-readonly',
      'aria-required',
      'aria-rowindex',
      'aria-rowspan',
      'aria-selected',
      'aria-sort'
    ],
    scrollbar: [
      'aria-disabled',
      'aria-orientation',
      'aria-valuemax',
      'aria-valuemin',
      'aria-valuenow',
      'aria-valuetext'
    ],
    search: [],
    searchbox: [
      'aria-activedescendant',
      'aria-autocomplete',
      'aria-disabled',
      'aria-errormessage',
      'aria-haspopup',
      'aria-invalid',
      'aria-multiline',
      'aria-placeholder',
      'aria-readonly',
      'aria-required'
    ],
    separator: [
      'aria-disabled',
      'aria-orientation',
      'aria-valuemax',
      'aria-valuemin',
      'aria-valuenow',
      'aria-valuetext'
    ],
    slider: [
      'aria-disabled',
      'aria-errormessage',
      'aria-haspopup',
      'aria-invalid',
      'aria-orientation',
      'aria-readonly',
      'aria-valuemax',
      'aria-valuemin',
      'aria-valuenow',
      'aria-valuetext'
    ],
    spinbutton: [
      'aria-activedescendant',
      'aria-disabled',
      'aria-errormessage',
      'aria-invalid',
      'aria-readonly',
      'aria-required',
      'aria-valuemax',
      'aria-valuemin',
      'aria-valuenow',
      'aria-valuetext'
    ],
    status: [],
    strong: [],
    subscript: [],
    superscript: [],
    switch: [
      'aria-checked',
      'aria-disabled',
      'aria-errormessage',
      'aria-expanded',
      'aria-invalid',
      'aria-readonly',
      'aria-required'
    ],
    tab: [
      'aria-disabled',
      'aria-expanded',
      'aria-haspopup',
      'aria-posinset',
      'aria-selected',
      'aria-setsize'
    ],
    table: ['aria-colcount', 'aria-rowcount'],
    tablist: [
      'aria-activedescendant',
      'aria-disabled',
      'aria-level',
      'aria-multiselectable',
      'aria-orientation'
    ],
    tabpanel: [],
    term: [],
    textbox: [
      'aria-activedescendant',
      'aria-autocomplete',
      'aria-disabled',
      'aria-errormessage',
      'aria-haspopup',
      'aria-invalid',
      'aria-multiline',
      'aria-placeholder',
      'aria-readonly',
      'aria-required'
    ],
    time: [],
    timer: [],
    toolbar: ['aria-activedescendant', 'aria-disabled', 'aria-orientation'],
    tooltip: [],
    tree: [
      'aria-activedescendant',
      'aria-disabled',
      'aria-errormessage',
      'aria-invalid',
      'aria-multiselectable',
      'aria-orientation',
      'aria-required'
    ],
    treegrid: [
      'aria-activedescendant',
      'aria-colcount',
      'aria-disabled',
      'aria-errormessage',
      'aria-invalid',
      'aria-multiselectable',
      'aria-orientation',
      'aria-readonly',
      'aria-required',
      'aria-rowcount'
    ],
    treeitem: [
      'aria-checked',
      'aria-disabled',
      'aria-expanded',
      'aria-haspopup',
      'aria-level',
      'aria-posinset',
      'aria-selected',
      'aria-setsize'
    ]
  };
  // </generated:aria-role-attrs>

  const globalSet = new Set(GLOBAL_ATTRS);
  // [role] keeps the explicit-role path; the attribute selector brings in
  // elements judged by their implicit role. Only non-global attributes can be
  // disallowed, so nothing else needs visiting.
  const selector = '[role], ' + NON_GLOBAL_ARIA_ATTR_SELECTOR;
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  // An element HTML-AAM maps to no role has nothing to support a
  // role-specific attribute, so every non-global one present is reported.
  // Returns how many recognized aria-* attributes it carried, for the
  // applicable count.
  function rolelessOccurrences(el, tag, allowed) {
    let seen = 0;
    const attrs = dom.attributes(el);
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (name.slice(0, 5) !== 'aria-') continue;
      if (!ariaHelpers.isValidAriaAttrName(name)) continue; // aria-valid-attr's concern

      seen += 1;
      if (globalSet.has(name) || (allowed && allowed.has(name))) continue;

      failOccurrences.push(
        helpers.reportOccurrence(el, {
          summary: `<${tag}> has no ARIA role, so nothing supports the ${name} attribute on it.`,
          hint: `Remove ${name}, or move it to an element whose role supports it. A role-specific ARIA attribute on an element with no role is ignored by assistive technology.`,
          i18n: {
            summaryKey: 'ariaAllowedAttr_summary_fail_roleless',
            hintKey: 'ariaAllowedAttr_hint_fail_roleless',
            params: { attr: name, element: tag }
          },
          data: {
            details: { reasonCode: 'ARIA_ATTR_NOT_ALLOWED_ROLELESS', attr: name, element: tag }
          }
        })
      );
    }
    return seen;
  }

  // The attributes each role supports, as a set built once per role (and
  // per extra role, for a select) rather than once per element.
  const supportedSets = new Map();
  function supportedSetFor(role, alsoRole) {
    const key = alsoRole ? `${role}|${alsoRole}` : role;
    let set = supportedSets.get(key);
    if (!set) {
      set = new Set(SUPPORTED_ATTRS_BY_ROLE[role]);
      if (alsoRole && SUPPORTED_ATTRS_BY_ROLE[alsoRole]) {
        for (const a of SUPPORTED_ATTRS_BY_ROLE[alsoRole]) set.add(a);
      }
      supportedSets.set(key, set);
    }
    return set;
  }

  // Elements whose role depends on their attributes, which the generated
  // table leaves out, keyed here the way ARIA in HTML allows attributes on
  // them: `a`/`area` with href are links; an img with alt="" and nothing
  // else naming it has no role, any other img is an img; a select is a
  // listbox with multiple or size > 1, else a combobox, which may also
  // carry menu's attributes. The date and time inputs take textbox's
  // attributes; color and file inputs have no role and take only the
  // listed ones. Each was checked against Chromium's tree. A <td>'s role
  // comes from its table (aria.getTableCellRole); Chromium exposes the
  // cells of a table it judges to be for layout as LayoutTableCell, where
  // HTML-AAM keeps them cells.
  const TEXTBOX_INPUT_TYPES = new Set(['date', 'datetime-local', 'month', 'time', 'week']);
  const INPUT_ALLOWED = {
    color: new Set(['aria-disabled']),
    file: new Set(['aria-disabled', 'aria-invalid', 'aria-required'])
  };
  function attributeKeyedRole(el, tag) {
    // A <td> takes its role from its table: cell, gridcell in a grid or
    // treegrid, none when the table is presentational.
    if (tag === 'td') {
      const cellRole = ariaHelpers.getTableCellRole(el);
      return cellRole ? { role: cellRole } : { roleless: true };
    }
    if (tag === 'a' || tag === 'area')
      return dom.hasAttribute(el, 'href') ? { role: 'link' } : null;
    if (tag === 'img') {
      const alt = dom.getAttribute(el, 'alt');
      const named = ['aria-label', 'aria-labelledby', 'title'].some(
        (a) => String(dom.getAttribute(el, a) || '').trim() !== ''
      );
      return alt === '' && !named ? { roleless: true } : { role: 'img' };
    }
    if (tag === 'select') {
      const size = parseInt(String(dom.getAttribute(el, 'size') || ''), 10);
      if (dom.hasAttribute(el, 'multiple') || size > 1) return { role: 'listbox' };
      return { role: 'combobox', also: 'menu' };
    }
    if (tag === 'input') {
      const type = String(dom.getAttribute(el, 'type') || '')
        .trim()
        .toLowerCase();
      if (TEXTBOX_INPUT_TYPES.has(type)) return { role: 'textbox' };
      if (INPUT_ALLOWED[type]) return { roleless: true, allowed: INPUT_ALLOWED[type] };
    }
    return null;
  }

  for (const el of nodes) {
    if (!el || !dom.attributes(el)) continue;

    // ACT 5c01ea scopes the rule to any element carrying an ARIA attribute, so
    // an element with no role attribute is judged against its implicit role.
    // Only elements whose implicit role is context-free are covered; the
    // generator lists what is excluded and why. A custom element's internals
    // give it its default role, as a tag does.
    const explicitRole = ariaHelpers.getAuthorRole(el);
    let role = explicitRole;
    let alsoRole = null;
    if (!role) {
      const tag = String(dom.tagName(el) || '').toLowerCase();
      const key =
        tag === 'input'
          ? 'input[type=' + String(dom.getAttribute(el, 'type') || 'text').toLowerCase() + ']'
          : tag;
      role = Object.prototype.hasOwnProperty.call(IMPLICIT_ROLE_BY_ELEMENT, key)
        ? IMPLICIT_ROLE_BY_ELEMENT[key]
        : '';
      // A text, search, telephone, URL or email input with a datalist is a
      // combobox (HTML-AAM), which the per-type table can't tell.
      if ((role === 'textbox' || role === 'searchbox') && tag === 'input') {
        if (ariaHelpers.getInputRole(el) === 'combobox') role = 'combobox';
      }
      // No role from either source: for a tag HTML-AAM maps to no role at
      // all, that IS the answer. Nothing supports a role-specific
      // attribute here. Any other tag has a role this table does not model
      // (context-dependent ones), so it stays out of scope.
      if (!role && ROLELESS_ELEMENTS.has(tag)) {
        applicableCount += rolelessOccurrences(el, tag);
        continue;
      }
      if (!role) {
        const keyed = attributeKeyedRole(el, tag);
        if (keyed && keyed.roleless) {
          applicableCount += rolelessOccurrences(el, tag, keyed.allowed);
          continue;
        }
        if (keyed) {
          role = keyed.role;
          alsoRole = keyed.also || null;
        }
      }
    }
    if (!role || !ariaHelpers.isValidConcreteRole(role)) continue; // aria-roles-valid's concern

    // Presentational role conflict resolution drops role="none"/"presentation"
    // when the element is focusable or carries global ARIA, so the implicit
    // role decides which attributes are supported. Judging against the
    // presentational role would flag valid markup such as
    // <button role="none" aria-pressed="false">; presentation-role-conflict
    // owns this case.
    if (role === 'none' || role === 'presentation') continue;

    // Roles absent from the generated table are unknown to ARIA, so there is
    // nothing to judge them against.
    const roleSupported = SUPPORTED_ATTRS_BY_ROLE[role];
    if (!roleSupported) continue;
    const roleSupportedSet = supportedSetFor(role, alsoRole);

    let disallowed = null;
    const attrs = dom.attributes(el);
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

    for (const name of disallowed) {
      // A property ARIA deprecated (rather than prohibited) on this role is
      // still allowed, surfaced as cantTell for the author to decide, not a
      // not-allowed fail.
      const deprecated =
        typeof ariaHelpers.isDeprecatedAttr === 'function' &&
        ariaHelpers.isDeprecatedAttr(name, role);
      if (deprecated) {
        cantTellOccurrences.push(
          helpers.reportOccurrence(el, {
            summary: 'This ARIA attribute is deprecated for this element’s role.',
            hint: 'It is still allowed but discouraged; remove it or use a role that supports it, as a future ARIA version may disallow it.',
            occurrenceOutcome: 'cantTell',
            i18n: {
              summaryKey: 'ariaAllowedAttr_summary_cantTell',
              hintKey: 'ariaAllowedAttr_hint_cantTell',
              params: { attr: name, role }
            },
            uncertainty: {
              code: 'spec-only',
              needed:
                'Whether the deprecated attribute is still honoured by the assistive technology in use.',
              evidence: { attribute: name, role, status: 'deprecated-for-role' }
            },
            data: {
              details: { reasonCode: 'ARIA_ATTR_DEPRECATED', attr: name, role }
            }
          })
        );
        continue;
      }
      failOccurrences.push(
        helpers.reportOccurrence(el, {
          summary: 'This ARIA attribute is not permitted for this element’s role.',
          hint: 'Remove this attribute, or use a role that supports it.',
          occurrenceOutcome: 'fail',
          i18n: {
            summaryKey: 'ariaAllowedAttr_summary_fail',
            hintKey: 'ariaAllowedAttr_hint_fail',
            params: { attr: name, role }
          },
          data: {
            details: { reasonCode: 'ARIA_ATTR_NOT_ALLOWED', attr: name, role }
          }
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
