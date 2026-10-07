/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-attribute-conformance
 * @atomic true
 * @summary aria-* attributes must be valid for the W3C validator
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every element in the scan scope that has an aria-*
 *   attribute, or a role whose required state or property the validator
 *   checks, hidden content included: RGAA 8.2.1 judges the generated
 *   source code (« le code source généré de la page »), and the W3C
 *   validator named by its methodology checks hidden markup as well. A
 *   page with neither is notApplicable.
 * @expectation
 *   Each aria-* attribute passes the W3C validator (Nu HTML Checker), which
 *   RGAA 8.2.1 step 1 names: attributes and their values respect the
 *   writing rules (« Les balises, attributs et valeurs d'attributs
 *   respectent les règles d'écriture »). The rule fails where the validator
 *   reports an error:
 *   - `unknownAttribute`: an aria-* name the validator does not know
 *     (aria-labeledby, aria-foo);
 *   - `invalidValue`: a value that does not fit the attribute: an empty or
 *     misspelt token (aria-expanded="", aria-hidden="TRUE"), an integer out
 *     of range (aria-level="0", aria-setsize="-2"), an empty ID reference,
 *     or an aria-activedescendant that points to no element;
 *   - `attributeNotAllowed`: an attribute the element's role does not
 *     support: aria-pressed on a link, aria-sort on a <td>, aria-expanded
 *     on the <summary> of a <details>, any aria-* on <input type="hidden">;
 *   - `namingProhibited`: aria-label, aria-labelledby or aria-braillelabel
 *     on an element whose role cannot be named (a <div>, <span>, <p>,
 *     <strong>, <code> or <caption> with no role, even inside a button);
 *   - `nativeCheckedConflict`: aria-checked on <input type="checkbox"> or
 *     <input type="radio">, whatever its value;
 *   - `nativeAttributeConflict`: an ARIA state that contradicts a native
 *     attribute (aria-disabled other than "true" with disabled, likewise
 *     aria-required with required, aria-readonly with readonly, aria-hidden
 *     with hidden), aria-placeholder with placeholder, aria-hidden on
 *     <html>, aria-hidden="true" on <body>;
 *   - `missingRequired`: a role without the state or property the validator
 *     requires for it, even where WAI-ARIA gives a default value:
 *     role="heading" without aria-level, role="combobox" without
 *     aria-expanded, role="checkbox", "radio", "switch", "menuitemcheckbox"
 *     or "menuitemradio" without aria-checked, role="slider", "scrollbar"
 *     or "meter" without aria-valuenow.
 * @implementation-notes
 * - Expected outcomes follow the W3C validator version 26.9.27. The value
 *   types, the attributes each role supports and the attributes each
 *   element allows were read from that version's reports; re-check them
 *   when the reference version changes.
 * - Values are compared as written, with no trimming and case-sensitive
 *   tokens, as the validator does.
 * - What the validator accepts passes here, even where a WCAG rule
 *   reports it: <h2 aria-expanded="true">, an aria-describedby or
 *   aria-labelledby that points to no element (only aria-activedescendant
 *   must resolve), <input type="checkbox" role="switch"> without
 *   aria-checked (the native checked state stands in for it).
 * - Where the element has an explicit role, the role decides which
 *   attributes are allowed, but only on elements that accept any role
 *   (div, span, p and the like) and on SVG elements. On other elements
 *   with a role, and on elements the table does not list (<img> without
 *   alt, obsolete elements), only names and values are checked. Custom
 *   elements and <embed> are skipped, as the validator checks no aria-*
 *   attribute on them, and so are MathML elements. An <li>, <td>, <th>,
 *   <tr> or <summary> is judged in the
 *   contexts where its native role is fixed, as in aria-role-conformance.
 * - The warnings the validator gives (an attribute that repeats a native
 *   one, deprecated attributes, aria-activedescendant outside the owned
 *   elements) are not failures.
 * - The WCAG rules aria-valid-attr, aria-valid-attr-value,
 *   aria-allowed-attr, aria-prohibited-attr, aria-required-attr and
 *   aria-checked-state-mismatch keep their own verdicts.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'aria-attribute-conformance';

const meta = {
  title: 'aria-* attributes are valid for the W3C validator',
  description:
    'Checks, hidden content included, that every aria-* attribute is one the W3C validator knows, has a valid value, is allowed on its element and role, and does not contradict a native attribute, and that roles carry the attributes the validator requires.',
  i18n: {
    titleKey: 'ariaAttributeConformance_title',
    descriptionKey: 'ariaAttributeConformance_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'aria', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const HTML_NS = 'http://www.w3.org/1999/xhtml';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const words = (s) => (s ? s.split(' ') : []);

  // Value type of every aria-* attribute the W3C validator 26.9.27 knows.
  const TYPES = {
    'aria-activedescendant': 'idrefExisting',
    'aria-atomic': 'boolean',
    'aria-autocomplete': 'inline list both none',
    'aria-braillelabel': 'string',
    'aria-brailleroledescription': 'string',
    'aria-busy': 'boolean',
    'aria-checked': 'true false mixed undefined',
    'aria-colcount': 'count',
    'aria-colindex': 'positive',
    'aria-colspan': 'positive',
    'aria-controls': 'idrefs',
    'aria-current': 'page step location date time true false',
    'aria-describedby': 'idrefs',
    'aria-description': 'string',
    'aria-details': 'idref',
    'aria-disabled': 'boolean',
    'aria-dropeffect': 'any',
    'aria-errormessage': 'idref',
    'aria-expanded': 'true false undefined',
    'aria-flowto': 'idrefs',
    'aria-grabbed': 'any',
    'aria-haspopup': 'true false menu listbox tree grid dialog',
    'aria-hidden': 'boolean',
    'aria-invalid': 'grammar spelling true false',
    'aria-keyshortcuts': 'string',
    'aria-label': 'string',
    'aria-labelledby': 'idrefs',
    'aria-level': 'positive',
    'aria-live': 'off polite assertive',
    'aria-modal': 'boolean',
    'aria-multiline': 'boolean',
    'aria-multiselectable': 'boolean',
    'aria-orientation': 'horizontal vertical undefined',
    'aria-owns': 'idrefs',
    'aria-placeholder': 'string',
    'aria-posinset': 'positive',
    'aria-pressed': 'true false mixed undefined',
    'aria-readonly': 'boolean',
    'aria-relevant': 'relevant',
    'aria-required': 'boolean',
    'aria-roledescription': 'string',
    'aria-rowcount': 'count',
    'aria-rowindex': 'positive',
    'aria-rowspan': 'positive',
    'aria-selected': 'true false undefined',
    'aria-setsize': 'count',
    'aria-sort': 'ascending descending none other',
    'aria-valuemax': 'number',
    'aria-valuemin': 'number',
    'aria-valuenow': 'number',
    'aria-valuetext': 'string'
  };

  // Attributes the validator accepts on any element, before role checks.
  const GLOBAL = new Set(
    words(
      'aria-atomic aria-brailleroledescription aria-busy aria-controls aria-current ' +
        'aria-describedby aria-description aria-details aria-disabled aria-dropeffect ' +
        'aria-errormessage aria-flowto aria-grabbed aria-haspopup aria-hidden aria-invalid ' +
        'aria-keyshortcuts aria-live aria-owns aria-relevant aria-roledescription'
    )
  );
  const NAMING = new Set(['aria-label', 'aria-labelledby', 'aria-braillelabel']);
  // Roles whose elements cannot be named.
  const UNNAMED_ROLES = new Set(
    words(
      'caption code deletion emphasis generic insertion paragraph presentation strong ' +
        'subscript superscript'
    )
  );

  // Role tokens the validator accepts (as in aria-role-conformance).
  const ROLES = new Set(
    words(
      'alert alertdialog application article banner blockquote button caption cell checkbox ' +
        'code columnheader combobox complementary contentinfo definition deletion dialog ' +
        'directory document emphasis feed figure form graphics-document graphics-object ' +
        'graphics-symbol grid gridcell group heading image img insertion link list listbox ' +
        'listitem log main marquee math menu menubar menuitem menuitemcheckbox menuitemradio ' +
        'meter navigation none note option paragraph presentation progressbar radio radiogroup ' +
        'region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton ' +
        'status strong subscript superscript switch tab table tablist tabpanel term textbox ' +
        'time timer toolbar tooltip tree treegrid treeitem doc-abstract doc-acknowledgments ' +
        'doc-afterword doc-appendix doc-backlink doc-biblioentry doc-bibliography doc-biblioref ' +
        'doc-chapter doc-colophon doc-conclusion doc-cover doc-credit doc-credits doc-dedication ' +
        'doc-endnote doc-endnotes doc-epigraph doc-epilogue doc-errata doc-example doc-footnote ' +
        'doc-foreword doc-glossary doc-glossref doc-index doc-introduction doc-noteref doc-notice ' +
        'doc-pagebreak doc-pagelist doc-part doc-preface doc-prologue doc-pullquote doc-qna ' +
        'doc-subtitle doc-tip doc-toc'
    )
  );

  // Non-global attributes each role supports, besides the naming ones
  // (without the aria- prefix). A role not listed supports none.
  const E = 'expanded';
  const ROLE_ATTRS = {
    alert: E,
    alertdialog: 'expanded modal',
    application: 'activedescendant expanded',
    article: 'expanded posinset setsize',
    banner: E,
    button: 'expanded pressed',
    cell: 'colindex colspan rowindex rowspan',
    checkbox: 'checked expanded readonly required',
    columnheader: 'colindex colspan expanded readonly required rowindex rowspan selected sort',
    combobox: 'activedescendant autocomplete expanded orientation readonly required',
    complementary: E,
    contentinfo: E,
    definition: E,
    dialog: 'expanded modal',
    document: E,
    feed: E,
    figure: E,
    form: E,
    grid: 'activedescendant colcount expanded level multiselectable readonly rowcount',
    gridcell: 'colindex colspan expanded level readonly required rowindex rowspan selected',
    group: 'activedescendant expanded',
    heading: 'expanded level',
    image: E,
    img: E,
    link: E,
    list: E,
    listbox: 'activedescendant multiselectable orientation readonly required',
    listitem: 'expanded level posinset setsize',
    log: E,
    main: E,
    marquee: E,
    math: E,
    menu: 'activedescendant expanded orientation',
    menubar: 'activedescendant expanded orientation',
    menuitem: 'expanded posinset setsize',
    menuitemcheckbox: 'checked expanded posinset setsize',
    menuitemradio: 'checked expanded posinset selected setsize',
    meter: 'valuemax valuemin valuenow valuetext',
    navigation: E,
    note: E,
    option: 'checked posinset selected setsize',
    progressbar: 'valuemax valuemin valuenow valuetext',
    radio: 'checked posinset selected setsize',
    radiogroup: 'activedescendant expanded orientation readonly required',
    region: E,
    row: 'activedescendant colindex expanded level posinset rowindex selected setsize',
    rowgroup: 'activedescendant expanded',
    rowheader: 'colindex colspan expanded readonly required rowindex rowspan selected sort',
    scrollbar: 'orientation valuemax valuemin valuenow valuetext',
    search: 'expanded orientation',
    searchbox: 'activedescendant autocomplete multiline placeholder readonly required',
    separator: 'expanded orientation valuemax valuemin valuenow valuetext',
    slider: 'orientation readonly valuemax valuemin valuenow valuetext',
    spinbutton: 'activedescendant readonly required valuemax valuemin valuenow valuetext',
    status: E,
    switch: 'checked expanded readonly required',
    tab: 'expanded posinset selected setsize',
    table: 'colcount rowcount',
    tablist: 'activedescendant expanded level multiselectable orientation',
    tabpanel: E,
    term: E,
    textbox: 'activedescendant autocomplete multiline placeholder readonly required',
    timer: E,
    toolbar: 'activedescendant expanded orientation',
    tooltip: E,
    tree: 'activedescendant expanded multiselectable orientation required',
    treegrid:
      'activedescendant colcount expanded level multiselectable orientation readonly required rowcount',
    treeitem: 'checked expanded level posinset selected setsize'
  };

  // HTML elements that accept any role: there the role alone decides which
  // attributes are allowed. <a> is left out: on a link, the validator does not
  // apply a presentation or paragraph role's naming ban.
  const ANY_ROLE = new Set(
    words(
      'abbr address b bdi bdo blockquote body canvas cite code data del dfn div em figure i ' +
        'ins kbd label mark output p pre q rt ruby s samp small span strong sub sup table ' +
        'tbody tfoot thead time u var'
    )
  );

  // Non-global attributes allowed on an element with no role. `n` means
  // the naming attributes are allowed too; `only` lists the only global
  // attributes allowed (br, wbr, <input type="hidden">, a <summary>).
  const TEXTLIKE = 'n activedescendant autocomplete multiline placeholder readonly required';
  const NATIVE = {
    generic: '',
    landmark: 'n expanded',
    'a[href]': 'n expanded',
    'area[href]': 'n expanded',
    area: 'expanded',
    button: 'n expanded pressed',
    dialog: 'n expanded modal',
    group: 'n activedescendant expanded',
    heading: 'n expanded level',
    hr: 'n orientation valuemax valuemin valuenow valuetext',
    'li(list)': 'n expanded level posinset setsize',
    'li(menu)': 'n',
    meter: 'n valuemax valuemin',
    named: 'n',
    option: 'n checked posinset selected setsize',
    progress: 'n valuemin valuenow valuetext',
    select:
      'n activedescendant autocomplete expanded multiselectable placeholder readonly required',
    summary: 'n',
    table: 'n colcount rowcount',
    td: 'n colindex colspan expanded level readonly required rowindex rowspan selected',
    th: 'n colindex colspan expanded readonly required rowindex rowspan selected sort',
    tr: 'n activedescendant colindex expanded level posinset rowindex selected setsize',
    textarea: TEXTLIKE,
    'input:text': TEXTLIKE,
    'input:password': 'n placeholder required',
    'input:number': 'n placeholder required valuemax valuemin valuenow valuetext',
    'input:range': 'n orientation valuemax valuemin valuenow valuetext',
    'input:checkbox': 'n expanded readonly required',
    'input:radio': 'n posinset required selected setsize',
    'input:button': 'n expanded pressed',
    'input:date': 'n required valuemax valuemin',
    'input:file': 'n required',
    'input:color': 'n',
    empty: ''
  };
  const NATIVE_ONLY_GLOBALS = {
    empty: ['aria-hidden'],
    'input:hidden': [],
    summary: words(
      'aria-atomic aria-brailleroledescription aria-busy aria-controls aria-current ' +
        'aria-describedby aria-details aria-disabled aria-errormessage aria-flowto ' +
        'aria-haspopup aria-hidden aria-invalid aria-keyshortcuts aria-live aria-owns ' +
        'aria-relevant aria-roledescription'
    )
  };
  const TAG_KEY = {
    abbr: 'generic',
    b: 'generic',
    bdi: 'generic',
    bdo: 'generic',
    caption: 'generic',
    cite: 'generic',
    code: 'generic',
    data: 'generic',
    del: 'generic',
    div: 'generic',
    em: 'generic',
    figcaption: 'generic',
    i: 'generic',
    ins: 'generic',
    kbd: 'generic',
    legend: 'generic',
    mark: 'generic',
    p: 'generic',
    pre: 'generic',
    q: 'generic',
    rt: 'generic',
    s: 'generic',
    samp: 'generic',
    small: 'generic',
    span: 'generic',
    strong: 'generic',
    sub: 'generic',
    sup: 'generic',
    time: 'generic',
    u: 'generic',
    var: 'generic',
    article: 'landmark',
    aside: 'landmark',
    dd: 'landmark',
    dt: 'landmark',
    figure: 'landmark',
    footer: 'landmark',
    form: 'landmark',
    header: 'landmark',
    main: 'landmark',
    menu: 'landmark',
    nav: 'landmark',
    ol: 'landmark',
    output: 'landmark',
    search: 'landmark',
    section: 'landmark',
    ul: 'landmark',
    button: 'button',
    dialog: 'dialog',
    details: 'group',
    fieldset: 'group',
    optgroup: 'group',
    tbody: 'group',
    thead: 'group',
    tfoot: 'group',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
    hr: 'hr',
    meter: 'meter',
    progress: 'progress',
    select: 'select',
    table: 'table',
    textarea: 'textarea',
    address: 'named',
    audio: 'named',
    video: 'named',
    blockquote: 'named',
    canvas: 'named',
    datalist: 'named',
    dfn: 'named',
    dl: 'named',
    hgroup: 'named',
    iframe: 'named',
    label: 'named',
    object: 'named',
    picture: 'named',
    ruby: 'named',
    br: 'empty',
    wbr: 'empty'
  };
  const INPUT_KEY = {
    '': 'input:text',
    text: 'input:text',
    search: 'input:text',
    email: 'input:text',
    tel: 'input:text',
    url: 'input:text',
    password: 'input:password',
    number: 'input:number',
    range: 'input:range',
    checkbox: 'input:checkbox',
    radio: 'input:radio',
    button: 'input:button',
    submit: 'input:button',
    reset: 'input:button',
    image: 'input:button',
    date: 'input:date',
    file: 'input:file',
    color: 'input:color',
    hidden: 'input:hidden'
  };

  // Required states and properties the validator checks per role.
  const REQUIRED = {
    checkbox: 'aria-checked',
    combobox: 'aria-expanded',
    heading: 'aria-level',
    menuitemcheckbox: 'aria-checked',
    menuitemradio: 'aria-checked',
    meter: 'aria-valuenow',
    radio: 'aria-checked',
    scrollbar: 'aria-valuenow',
    slider: 'aria-valuenow',
    switch: 'aria-checked'
  };

  // Native attributes an ARIA state may repeat but not contradict.
  const NATIVE_PAIRS = [
    {
      aria: 'aria-disabled',
      native: 'disabled',
      tags: 'button fieldset input optgroup option select textarea'
    },
    { aria: 'aria-required', native: 'required', tags: 'input select textarea' },
    { aria: 'aria-readonly', native: 'readonly', tags: 'input textarea' },
    { aria: 'aria-hidden', native: 'hidden', tags: '*' }
  ];

  // Keyed by message id; the reason code is the part before any suffix.
  const MESSAGES = {
    unknownAttribute: {
      summary: '{{attr}} on this <{{element}}> is not an ARIA attribute the W3C validator knows.',
      hint: 'Correct the attribute name (for example aria-labelledby, not aria-labeledby) or remove it.'
    },
    invalidValue: {
      summary: '{{attr}}="{{value}}" on this <{{element}}> is not a valid value.',
      hint: 'Use a value the attribute allows, written exactly (lowercase tokens, no surrounding spaces). An ID reference must not be empty, and aria-activedescendant must point to an existing element.'
    },
    attributeNotAllowed: {
      summary: '{{attr}} is not allowed on this <{{element}}>.',
      hint: 'Remove the attribute, or use an element or a role that supports it.'
    },
    attributeNotAllowedRole: {
      summary: '{{attr}} is not allowed on this <{{element}}> with role="{{role}}".',
      hint: 'Remove the attribute, or use a role that supports it.'
    },
    namingProhibited: {
      summary: '{{attr}} is not allowed on this <{{element}}>, which cannot be named.',
      hint: 'Remove the attribute or move the name to an element that can be named. Inside a button or link, the text content already gives the name.'
    },
    namingProhibitedRole: {
      summary:
        '{{attr}} is not allowed on this <{{element}}> with role="{{role}}", a role that cannot be named.',
      hint: 'Remove the attribute, or move the name to an element that can be named.'
    },
    nativeCheckedConflict: {
      summary: 'aria-checked is not allowed on <input type="{{type}}">.',
      hint: 'Remove aria-checked: the checked state of the input is exposed natively.'
    },
    nativeAttributeConflict: {
      summary: '{{attr}}="{{value}}" on this <{{element}}> contradicts its {{native}} attribute.',
      hint: 'Remove the ARIA attribute: the native attribute already gives the state.'
    },
    nativeAttributeConflictPlaceholder: {
      summary:
        'aria-placeholder is not allowed on this <{{element}}>, which has a placeholder attribute.',
      hint: 'Remove aria-placeholder and keep the placeholder attribute.'
    },
    nativeAttributeConflictHtml: {
      summary: 'aria-hidden is not allowed on the <html> element.',
      hint: 'Remove aria-hidden from <html>.'
    },
    nativeAttributeConflictBody: {
      summary: 'aria-hidden="true" is not allowed on the <body> element.',
      hint: 'Remove aria-hidden from <body>: it would hide the whole page from assistive technologies.'
    },
    missingRequired: {
      summary:
        'This <{{element}}> has role="{{role}}" but no {{attr}} attribute, which the role requires.',
      hint: 'Add the attribute with the current value, or use a native element that has this role.'
    }
  };

  function localName(el) {
    return String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  }

  function attr(el, name) {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  }

  function parentEl(el) {
    const p = dom.parentNode(el);
    return p && dom.nodeType(p) === 1 ? p : null;
  }

  function firstRole(el) {
    const value = attr(el, 'role');
    if (value == null) return '';
    for (const t of String(value).split(/[\t\n\f\r ]+/)) if (ROLES.has(t)) return t;
    return '';
  }

  function idExists(el, idValue) {
    let root;
    try {
      root = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : dom.ownerDocument(el);
    } catch {
      root = dom.ownerDocument(el);
    }
    try {
      if (root && typeof dom.get(root, 'getElementById') === 'function')
        return !!dom.getElementById(root, idValue);
      const doc = dom.ownerDocument(el);
      return !!(doc && dom.getElementById(doc, idValue));
    } catch {
      return true;
    }
  }

  const POSITIVE = /^[0-9]+$/;
  const FLOAT = /^(-?[0-9]+(\.[0-9]+)?|-?\.[0-9]+)([eE][+-]?[0-9]+)?$/;
  const WS = /[\t\n\f\r ]/;

  function valueIsValid(el, name, value) {
    const type = TYPES[name];
    switch (type) {
      case 'any':
      case 'string':
        return true;
      case 'boolean':
        return value === 'true' || value === 'false';
      case 'positive':
        return POSITIVE.test(value) && /[1-9]/.test(value);
      case 'count':
        return value === '-1' || POSITIVE.test(value);
      case 'number':
        return FLOAT.test(value);
      case 'idref':
        return value !== '' && !WS.test(value);
      case 'idrefExisting':
        return value !== '' && !WS.test(value) && idExists(el, value);
      case 'idrefs':
        return /[^\t\n\f\r ]/.test(value);
      case 'relevant': {
        const toks = value.split(/[\t\n\f\r ]+/).filter((t) => t !== '');
        if (toks.length === 1 && toks[0] === 'all') return true;
        if (!toks.length) return false;
        const seen = new Set();
        for (const t of toks) {
          if (t !== 'additions' && t !== 'removals' && t !== 'text') return false;
          if (seen.has(t)) return false;
          seen.add(t);
        }
        return true;
      }
      default:
        return words(type).indexOf(value) !== -1;
    }
  }

  function nearestTable(el) {
    for (let n = parentEl(el); n; n = parentEl(n)) {
      if (localName(n) === 'table' && (dom.namespaceURI(n) || HTML_NS) === HTML_NS) return n;
    }
    return null;
  }

  function inNativeTable(el) {
    const table = nearestTable(el);
    return !!table && !dom.hasAttribute(table, 'role');
  }

  function isFirstSummaryOfDetails(el) {
    const p = parentEl(el);
    if (!p || localName(p) !== 'details') return false;
    for (const c of dom.querySelectorAll(p, ':scope > *')) {
      if (localName(c) === 'summary') return c === el;
    }
    return false;
  }

  function hasSelectAncestor(el) {
    for (let n = parentEl(el); n; n = parentEl(n)) {
      if (localName(n) === 'select') return true;
    }
    return false;
  }

  // The key of NATIVE for an element with no role, or '' when not judged.
  function nativeKey(el, name) {
    if (name === 'a') return dom.hasAttribute(el, 'href') ? 'a[href]' : 'generic';
    if (name === 'area') return dom.hasAttribute(el, 'href') ? 'area[href]' : 'area';
    if (name === 'img') {
      const alt = attr(el, 'alt');
      return alt == null ? '' : 'landmark';
    }
    if (name === 'input') {
      const type = String(attr(el, 'type') || '').toLowerCase();
      return Object.prototype.hasOwnProperty.call(INPUT_KEY, type) ? INPUT_KEY[type] : '';
    }
    if (name === 'li') {
      const p = parentEl(el);
      if (!p || dom.hasAttribute(p, 'role')) return '';
      const pn = localName(p);
      if (pn === 'ul' || pn === 'ol') return 'li(list)';
      if (pn === 'menu') return 'li(menu)';
      return '';
    }
    if (name === 'td' || name === 'th' || name === 'tr') return inNativeTable(el) ? name : '';
    if (name === 'summary') return isFirstSummaryOfDetails(el) ? 'summary' : '';
    if (name === 'option') return hasSelectAncestor(el) ? 'option' : '';
    return Object.prototype.hasOwnProperty.call(TAG_KEY, name) ? TAG_KEY[name] : '';
  }

  // { allowed: Set, naming: boolean, onlyGlobals: Set|null, role } or null.
  function allowance(el, ns, name, role) {
    if (role) {
      if (role === 'directory') return null;
      if (!(ns === SVG_NS || (ns === HTML_NS && ANY_ROLE.has(name)))) return null;
      const extra = words(ROLE_ATTRS[role] || '').map((a) => 'aria-' + a);
      return { allowed: new Set(extra), naming: !UNNAMED_ROLES.has(role), onlyGlobals: null, role };
    }
    // A role attribute with no recognised token: the validator then checks
    // the attributes against neither a role nor the element.
    if (dom.hasAttribute(el, 'role')) return null;
    let key = '';
    if (ns === SVG_NS) key = name === 'svg' ? 'named' : '';
    else if (ns === HTML_NS) key = nativeKey(el, name);
    if (!key) return null;
    const spec = Object.prototype.hasOwnProperty.call(NATIVE, key) ? NATIVE[key] : '';
    const list = words(spec);
    const naming = list.indexOf('n') !== -1;
    const allowed = new Set(list.filter((a) => a !== 'n').map((a) => 'aria-' + a));
    const onlyGlobals = Object.prototype.hasOwnProperty.call(NATIVE_ONLY_GLOBALS, key)
      ? new Set(NATIVE_ONLY_GLOBALS[key])
      : null;
    return { allowed, naming, onlyGlobals, role: '' };
  }

  const query = (sel) =>
    helpers.queryAllSource ? helpers.queryAllSource(sel) : helpers.queryAll(sel);
  const nodes = query('*');

  const failOccurrences = [];
  let applicableCount = 0;

  function report(el, reasonCode, params, messageId) {
    const key = messageId || reasonCode;
    const msg = MESSAGES[key];
    let summary = msg.summary;
    for (const k of Object.keys(params)) summary = summary.split(`{{${k}}}`).join(params[k]);
    failOccurrences.push(
      helpers.reportOccurrence(el, {
        summary,
        hint: msg.hint,
        i18n: {
          summaryKey: `ariaAttributeConformance_summary_fail_${key}`,
          hintKey: `ariaAttributeConformance_hint_fail_${key}`,
          params
        },
        data: {
          details: { reasonCode, ...params },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  for (const el of nodes) {
    if (!el || dom.nodeType(el) !== 1 || !dom.attributes(el)) continue;
    const ns = dom.namespaceURI(el) || HTML_NS;
    const name = localName(el);
    if (ns !== HTML_NS && ns !== SVG_NS) continue;
    // Custom elements, and <embed>, which takes any attribute: the validator
    // checks no aria-* attribute on them.
    if (ns === HTML_NS && (name.indexOf('-') !== -1 || name === 'embed')) continue;

    const ariaNames = [];
    for (let i = 0; i < dom.attributes(el).length; i++) {
      const n = String(dom.attributes(el)[i].name || '').toLowerCase();
      if (n.slice(0, 5) === 'aria-') ariaNames.push(n);
    }
    const role = firstRole(el);
    const required = ns === HTML_NS && Object.prototype.hasOwnProperty.call(REQUIRED, role);
    if (!ariaNames.length && !required) continue;
    applicableCount += 1;

    const element = name;
    const type = name === 'input' ? String(attr(el, 'type') || '').toLowerCase() : '';
    const allow = allowance(el, ns, name, role);

    for (const a of ariaNames) {
      const value = String(attr(el, a) == null ? '' : attr(el, a));
      if (!Object.prototype.hasOwnProperty.call(TYPES, a)) {
        report(el, 'unknownAttribute', { element, attr: a });
        continue;
      }
      if (!valueIsValid(el, a, value)) {
        report(el, 'invalidValue', { element, attr: a, value });
        continue;
      }
      if (
        ns === HTML_NS &&
        name === 'input' &&
        a === 'aria-checked' &&
        (type === 'checkbox' || type === 'radio')
      ) {
        report(el, 'nativeCheckedConflict', { element, attr: a, type });
        continue;
      }
      if (allow) {
        let ok;
        if (NAMING.has(a)) ok = allow.naming;
        else if (allow.onlyGlobals) ok = allow.onlyGlobals.has(a) || allow.allowed.has(a);
        else ok = GLOBAL.has(a) || allow.allowed.has(a);
        if (!ok) {
          const reason = NAMING.has(a) ? 'namingProhibited' : 'attributeNotAllowed';
          const params = allow.role ? { element, attr: a, role: allow.role } : { element, attr: a };
          report(el, reason, params, allow.role ? reason + 'Role' : reason);
          continue;
        }
      }
      if (ns !== HTML_NS) continue;
      const R = 'nativeAttributeConflict';
      if (a === 'aria-hidden' && name === 'html') {
        report(el, R, { element, attr: a, value }, R + 'Html');
      } else if (a === 'aria-hidden' && name === 'body' && value === 'true') {
        report(el, R, { element, attr: a, value }, R + 'Body');
      } else if (
        a === 'aria-placeholder' &&
        (name === 'input' || name === 'textarea') &&
        dom.hasAttribute(el, 'placeholder')
      ) {
        report(el, R, { element, attr: a, value }, R + 'Placeholder');
      } else {
        for (const pair of NATIVE_PAIRS) {
          if (a !== pair.aria || value === 'true') continue;
          if (pair.tags !== '*' && words(pair.tags).indexOf(name) === -1) continue;
          if (!dom.hasAttribute(el, pair.native)) continue;
          report(el, R, { element, attr: a, value, native: pair.native });
        }
      }
    }

    if (required) {
      const need = REQUIRED[role];
      if (dom.hasAttribute(el, need)) continue;
      // The native checked state stands in for aria-checked, and an input
      // with a list attribute is a combobox natively.
      if (name === 'input' && need === 'aria-checked' && (type === 'checkbox' || type === 'radio'))
        continue;
      if (name === 'input' && role === 'combobox' && dom.hasAttribute(el, 'list')) continue;
      report(el, 'missingRequired', { element, role, attr: need });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (failOccurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences: failOccurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
