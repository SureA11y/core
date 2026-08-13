/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Shared WAI-ARIA 1.2 role/attribute reference data + validation helpers,
 * exposed to rules via ctx.helpers.aria.
 *
 * SCOPE AND CONFIDENCE NOTES (read before extending)
 * ----------------------------------------------------
 * This data was hand-authored from the WAI-ARIA 1.2 specification and the
 * ARIA in HTML specification, not generated from an official machine-
 * readable feed. To protect FAIL integrity (automatic `fail` must only be
 * emitted for deterministic, high-confidence violations), this module is
 * DELIBERATELY CONSERVATIVE in two specific places:
 *
 * 1) REQUIRED_PROPS_BY_ROLE only lists a required state/property when the
 *    spec is unambiguous and context-independent. Several roles have
 *    required properties that are context-dependent (e.g. option's
 *    aria-selected default varies by selection-follows-focus context) or
 *    where sources disagree — those are intentionally left out of
 *    "required" (they remain valid/supported, just not enforced as
 *    required) rather than risk flagging compliant markup.
 * 2) ALLOWED_ROLES_BY_ELEMENT (ARIA-in-HTML permitted-roles table) covers
 *    the most common/impactful HTML elements first, not the full HTML
 *    element inventory. Elements not present in this table are treated as
 *    "no constraint asserted" (aria-allowed-role stays silent) rather than
 *    guessed at.
 *
 * Both scope-limitations are intentional per this engine's "coverage-
 * driven growth, not vibes" principle (see surea11y-engine.design.md).
 * Expanding either table is safe to do incrementally; narrowing them
 * (turning a supported-but-not-required property into "required", or
 * adding an element to ALLOWED_ROLES_BY_ELEMENT) should be cross-checked
 * against the normative WAI-ARIA / ARIA-in-HTML specs first, since a wrong
 * "required" or "not allowed" entry directly causes false-positive fails.
 */

function createAriaHelpers(opts, shared) {
  const trim = (shared && shared.trim) || ((v) => (v == null ? '' : String(v)).trim());
  const lower = (v) => trim(v).toLowerCase();
  const ariaDocument = opts && opts.document;
  // Same normalization as createDomHelpers's `roots` (src/core/dom-helpers.js)
  // -- opts.root accepts a single element or an array (multi-region
  // contextSelector support). Used to bound hasLandmarkScopingAncestor's
  // ancestor walk to the scanned scope; see that function below.
  const ariaRoots = (() => {
    const r = opts && opts.root;
    if (Array.isArray(r)) return r.filter((x) => x && typeof x === 'object');
    if (r && typeof r === 'object') return [r];
    return [];
  })();

  // Existence check for a single ID token — never throws, returns false
  // (not "unknown") when the document isn't available so callers degrade
  // to their pre-existing format-only behavior rather than guessing.
  function idExists(id) {
    if (!ariaDocument || typeof ariaDocument.getElementById !== 'function') return true;
    try {
      return !!ariaDocument.getElementById(id);
    } catch {
      return true;
    }
  }

  // Presence-only accessible-name check (aria-label / aria-labelledby /
  // title), for the few role-permission decisions conditioned on whether
  // an element currently has a name (e.g. <section>'s permitted-roles set
  // — see ALLOWED_ROLES_BY_ELEMENT below). Uses the same precedence as
  // dom-helpers.js's getLandmarkNameInfo (aria-label -> aria-labelledby ->
  // title). title counts, so a <section title="..."> resolves to the
  // 'section[named]' role key rather than plain 'section'.
  function hasAccessibleNameHint(el) {
    const al = trim(getAttr(el, 'aria-label'));
    if (al) return true;
    const alb = trim(getAttr(el, 'aria-labelledby'));
    if (alb && ariaDocument && typeof ariaDocument.getElementById === 'function') {
      for (const refId of alb.split(/\s+/).filter(Boolean)) {
        try {
          const ref = ariaDocument.getElementById(refId);
          if (ref && trim(ref.textContent)) return true;
        } catch {}
      }
    }
    const title = trim(getAttr(el, 'title'));
    if (title) return true;
    return false;
  }

  // Shared "does this element have a landmark-scoping ancestor" primitive
  // — <header>'s "banner", <footer>'s "contentinfo", and <aside>'s
  // "complementary" implicit roles are all conditioned on the same W3C
  // ARIA-in-HTML exclusion: suppressed when nested inside sectioning
  // content (article/aside/nav/section), and for header/footer only,
  // also suppressed when nested inside <main> (pass includeMain: true).
  // <aside> itself omits <main> from its own exclusion list — see the
  // `aside` case in getElementRoleKey below — so callers must pass the
  // right includeMain for the role they're computing.
  //
  // Role-aware, not tag-only: an ancestor's bare tag only counts when it
  // has no role attribute; once any role attribute is present, only that
  // attribute's first-token value decides membership. So an
  // <aside role="dialog"> does not scope a nested <header> (dialog isn't a
  // scoping role) even though a plain <aside> would.
  const LANDMARK_SCOPING_TAGS = new Set(['article', 'aside', 'nav', 'section']);
  const LANDMARK_SCOPING_ROLE_TOKENS = new Set([
    'article',
    'complementary',
    'navigation',
    'region'
  ]);

  function isLandmarkScopingAncestorElement(el, includeMain) {
    const tag = lower(el.tagName || '');
    const roleAttr = getAttr(el, 'role');
    if (roleAttr == null) {
      // No role attribute at all: falls back to the plain HTML tag.
      if (LANDMARK_SCOPING_TAGS.has(tag)) return true;
      return includeMain && tag === 'main';
    }
    // A role attribute is present (even empty/invalid) — the element's
    // bare TAG no longer counts; only an explicit, scoping-relevant
    // role value does.
    const token = trim(roleAttr).split(/\s+/)[0].toLowerCase();
    if (LANDMARK_SCOPING_ROLE_TOKENS.has(token)) return true;
    return includeMain && token === 'main';
  }

  function hasLandmarkScopingAncestor(el, opts) {
    if (!isElement(el)) return false;
    const includeMain = !!(opts && opts.includeMain);
    let cur = el.parentElement;
    let guard = 0;
    while (cur && guard++ < 200) {
      if (isLandmarkScopingAncestorElement(cur, includeMain)) return true;
      // Don't climb past the scanned scope -- a contextSelector-scoped
      // (or fragment) scan should never let ancestry OUTSIDE the
      // analyzed subtree affect a role computed WITHIN it.
      if (ariaRoots.includes(cur)) break;
      cur = cur.parentElement;
    }
    return false;
  }

  // -------------------------------------------------------------------
  // A) Abstract roles — MUST NOT be used directly in a role="" attribute.
  // -------------------------------------------------------------------
  // <generated:aria-abstract-roles>
  const ABSTRACT_ROLES = new Set([
    'command',
    'composite',
    'input',
    'landmark',
    'range',
    'roletype',
    'section',
    'sectionhead',
    'select',
    'structure',
    'widget',
    'window'
  ]);
  // </generated:aria-abstract-roles>

  // -------------------------------------------------------------------
  // B) Valid, concrete (non-abstract) roles authors should not explicitly
  //    declare — either because WAI-ARIA has deprecated them (a direct
  //    replacement exists) or because they are reserved for
  //    user-agent-internal use. Flagged by aria-deprecated-role, not
  //    aria-roles-valid (which only checks existence/abstractness) — see
  //    DEPRECATED_ROLE_GUIDANCE below for per-role, reason-accurate
  //    messaging.
  // -------------------------------------------------------------------
  // Deprecated but still VALID roles (SHOULD NOT, still conforming). Reported
  // as cantTell so the author decides whether it matters to them.
  const DEPRECATED_ROLES = new Set([
    'directory' // superseded by role="list"
  ]);

  // Valid roles reserved for user-agent-internal use, which ARIA states at
  // SHOULD NOT strength — conforming, so reported as cantTell.
  const AUTHOR_DISCOURAGED_ROLES = new Set([
    'generic' // "primarily for implementors of user agents"
  ]);

  // Roles carrying an author MUST NOT, reported as fail. Empty under ARIA 1.2
  // and 1.3, whose only author MUST NOT covers abstract roles — the concern of
  // aria-roles-valid.
  const AUTHOR_PROHIBITED_ROLES = new Set([]);

  // Deprecated but still ALLOWED states/properties (SHOULD NOT, still
  // conforming): the four ARIA 1.2 keeps in the global set as deprecated and
  // marks "deprecated on this role" wherever a role does not support them.
  // Reported as cantTell, not a not-allowed fail. Flat rather than per-role
  // because the deprecation is uniform and no role prohibits any of the four.
  const DEPRECATED_ATTRS = new Set([
    'aria-disabled',
    'aria-errormessage',
    'aria-haspopup',
    'aria-invalid'
  ]);

  const DEPRECATED_ROLE_GUIDANCE = {
    directory: 'Replace it with role="list" (its recommended replacement).',
    generic:
      'Remove it — this role is reserved for user-agent-internal use, not authors. Use role="presentation"/"none" to strip semantics, a semantic role like "group" to convey grouping, or simply a plain element (which already carries the implicit generic role) instead.'
  };

  function getDeprecatedRoleGuidance(role) {
    const key = lower(role);
    return Object.prototype.hasOwnProperty.call(DEPRECATED_ROLE_GUIDANCE, key)
      ? DEPRECATED_ROLE_GUIDANCE[key]
      : 'Replace the deprecated role with its recommended replacement.';
  }

  // -------------------------------------------------------------------
  // C) Complete set of concrete (non-abstract) WAI-ARIA 1.2 role tokens,
  //    plus the WAI-ARIA Graphics Module 1.0 roles (graphics-document/
  //    graphics-object/graphics-symbol) — a separate W3C Recommendation
  //    that extends core ARIA, with a companion Graphics Accessibility API
  //    Mappings REC defining AT support. Without these, aria-roles-valid
  //    would wrongly report an AT-recognized role as unrecognized.
  //    Digital Publishing WAI-ARIA (doc-abstract etc.) is a separate
  //    module, deliberately left out of scope for now.
  // -------------------------------------------------------------------
  // <generated:aria-concrete-roles>
  const CONCRETE_ROLES = new Set([
    'alert',
    'alertdialog',
    'application',
    'article',
    'banner',
    'blockquote',
    'button',
    'caption',
    'cell',
    'checkbox',
    'code',
    'columnheader',
    'combobox',
    'comment',
    'complementary',
    'contentinfo',
    'definition',
    'deletion',
    'dialog',
    'directory',
    'doc-abstract',
    'doc-acknowledgments',
    'doc-afterword',
    'doc-appendix',
    'doc-backlink',
    'doc-biblioentry',
    'doc-bibliography',
    'doc-biblioref',
    'doc-chapter',
    'doc-colophon',
    'doc-conclusion',
    'doc-cover',
    'doc-credit',
    'doc-credits',
    'doc-dedication',
    'doc-endnote',
    'doc-endnotes',
    'doc-epigraph',
    'doc-epilogue',
    'doc-errata',
    'doc-example',
    'doc-footnote',
    'doc-foreword',
    'doc-glossary',
    'doc-glossref',
    'doc-index',
    'doc-introduction',
    'doc-noteref',
    'doc-notice',
    'doc-pagebreak',
    'doc-pagefooter',
    'doc-pageheader',
    'doc-pagelist',
    'doc-part',
    'doc-preface',
    'doc-prologue',
    'doc-pullquote',
    'doc-qna',
    'doc-subtitle',
    'doc-tip',
    'doc-toc',
    'document',
    'emphasis',
    'feed',
    'figure',
    'form',
    'generic',
    'graphics-document',
    'graphics-object',
    'graphics-symbol',
    'grid',
    'gridcell',
    'group',
    'heading',
    'img',
    'insertion',
    'link',
    'list',
    'listbox',
    'listitem',
    'log',
    'main',
    'mark',
    'marquee',
    'math',
    'menu',
    'menubar',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'meter',
    'navigation',
    'none',
    'note',
    'option',
    'paragraph',
    'presentation',
    'progressbar',
    'radio',
    'radiogroup',
    'region',
    'row',
    'rowgroup',
    'rowheader',
    'scrollbar',
    'search',
    'searchbox',
    'separator',
    'slider',
    'spinbutton',
    'status',
    'strong',
    'subscript',
    'suggestion',
    'superscript',
    'switch',
    'tab',
    'table',
    'tablist',
    'tabpanel',
    'term',
    'text',
    'textbox',
    'time',
    'timer',
    'toolbar',
    'tooltip',
    'tree',
    'treegrid',
    'treeitem'
  ]);
  // </generated:aria-concrete-roles>

  // -------------------------------------------------------------------
  // D) ARIA attribute value types.
  //    'token'        — one value from a fixed enumerated set
  //    'token-list'   — space-separated values from a fixed enumerated set
  //    'boolean'      — "true" | "false"
  //    'tristate'     — "true" | "false" | "mixed"
  //    'boolean-undefined' — "true" | "false" | "undefined"
  //    'idref'        — a single ID token (existence not verified here)
  //    'idref-list'   — space-separated ID tokens
  //    'integer'      — a base-10 integer (may be negative where noted)
  //    'number'       — a real number
  //    'string'       — free-form text (only non-emptiness may be checked)
  // -------------------------------------------------------------------
  const ATTR_VALUE_TYPES = {
    'aria-activedescendant': 'idref',
    'aria-atomic': 'boolean',
    'aria-autocomplete': 'token',
    'aria-braillelabel': 'string',
    'aria-brailleroledescription': 'string',
    'aria-busy': 'boolean',
    'aria-checked': 'tristate',
    'aria-colcount': 'integer',
    'aria-colindex': 'integer',
    'aria-colindextext': 'string',
    'aria-colspan': 'integer',
    'aria-controls': 'idref-list',
    'aria-current': 'token', // also allows 'true'/'false', handled in token set
    'aria-describedby': 'idref-list',
    'aria-description': 'string',
    'aria-details': 'idref-list',
    'aria-disabled': 'boolean',
    'aria-dropeffect': 'token-list', // deprecated but still validated if present
    'aria-errormessage': 'idref',
    'aria-expanded': 'boolean-undefined',
    'aria-flowto': 'idref-list',
    'aria-grabbed': 'boolean-undefined', // deprecated but still validated if present
    'aria-haspopup': 'token', // also allows 'true'/'false'
    'aria-hidden': 'boolean-undefined',
    'aria-invalid': 'token', // also allows 'true'/'false'
    'aria-keyshortcuts': 'string',
    'aria-label': 'string',
    'aria-labelledby': 'idref-list',
    'aria-level': 'integer',
    'aria-live': 'token',
    'aria-modal': 'boolean',
    'aria-multiline': 'boolean',
    'aria-multiselectable': 'boolean',
    'aria-orientation': 'token',
    'aria-owns': 'idref-list',
    'aria-placeholder': 'string',
    'aria-posinset': 'integer',
    'aria-pressed': 'tristate',
    'aria-readonly': 'boolean',
    'aria-relevant': 'token-list',
    'aria-required': 'boolean',
    'aria-roledescription': 'string',
    'aria-rowcount': 'integer',
    'aria-rowindex': 'integer',
    'aria-rowindextext': 'string',
    'aria-rowspan': 'integer',
    'aria-selected': 'boolean-undefined',
    'aria-setsize': 'integer',
    'aria-sort': 'token',
    'aria-valuemax': 'number',
    'aria-valuemin': 'number',
    'aria-valuenow': 'number',
    'aria-valuetext': 'string'
  };

  // Enumerated token sets for 'token'/'token-list' attributes.
  const ATTR_TOKEN_SETS = {
    'aria-autocomplete': new Set(['inline', 'list', 'both', 'none']),
    'aria-current': new Set(['page', 'step', 'location', 'date', 'time', 'true', 'false']),
    'aria-dropeffect': new Set(['copy', 'execute', 'link', 'move', 'none', 'popup']),
    'aria-haspopup': new Set(['false', 'true', 'menu', 'listbox', 'tree', 'grid', 'dialog']),
    'aria-invalid': new Set(['grammar', 'false', 'spelling', 'true']),
    'aria-live': new Set(['off', 'polite', 'assertive']),
    'aria-orientation': new Set(['horizontal', 'vertical', 'undefined']),
    'aria-relevant': new Set(['additions', 'removals', 'text', 'all']),
    'aria-sort': new Set(['ascending', 'descending', 'none', 'other'])
  };

  // -------------------------------------------------------------------
  // E) Required states/properties per role (see file header — deliberately
  //    conservative; only unambiguous, context-independent cases).
  // -------------------------------------------------------------------
  const REQUIRED_PROPS_BY_ROLE = {
    checkbox: ['aria-checked'],
    combobox: ['aria-expanded'],
    heading: ['aria-level'],
    menuitemcheckbox: ['aria-checked'],
    menuitemradio: ['aria-checked'],
    // meter always represents a concrete measurement (no "indeterminate"
    // state, no focusable/non-focusable split), so aria-valuenow is
    // unconditionally required. progressbar and separator are excluded on
    // purpose: an indeterminate progressbar may omit aria-valuenow, and
    // separator only requires it when focusable. combobox's aria-controls
    // is likewise conditional (required only once the popup is displayed),
    // so it's left out too.
    meter: ['aria-valuenow'],
    radio: ['aria-checked'],
    scrollbar: ['aria-valuenow'],
    slider: ['aria-valuenow'],
    switch: ['aria-checked']
  };

  // -------------------------------------------------------------------
  // F) Required owned (child) roles for composite/container roles.
  //    Value is an array of alternative acceptable child roles (any one
  //    satisfies the requirement). aria-owns references also count as
  //    "owning" — checked by the rule, not this table.
  // -------------------------------------------------------------------
  const REQUIRED_OWNED_ROLES = {
    list: ['listitem'],
    listbox: ['option', 'group'],
    menu: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'group'],
    menubar: ['menuitem', 'menuitemcheckbox', 'menuitemradio', 'group'],
    radiogroup: ['radio'],
    rowgroup: ['row'],
    table: ['row', 'rowgroup'],
    grid: ['row', 'rowgroup'],
    treegrid: ['row', 'rowgroup'],
    tablist: ['tab'],
    tree: ['treeitem', 'group'],
    row: ['cell', 'gridcell', 'columnheader', 'rowheader']
  };

  // -------------------------------------------------------------------
  // G) Required context (parent) role for roles that must be owned by a
  //    specific ancestor role. Value is an array of acceptable ancestor
  //    roles (any one satisfies the requirement); ownership may be via
  //    DOM containment OR aria-owns (checked by the rule).
  // -------------------------------------------------------------------
  const REQUIRED_CONTEXT_ROLE = {
    listitem: ['list'],
    option: ['listbox', 'group'],
    menuitem: ['menu', 'menubar', 'group'],
    menuitemcheckbox: ['menu', 'menubar', 'group'],
    menuitemradio: ['menu', 'menubar', 'group'],
    tab: ['tablist'],
    tabpanel: [], // no single required container in ARIA 1.2; left unconstrained
    treeitem: ['tree', 'group'],
    row: ['rowgroup', 'grid', 'table', 'treegrid'],
    cell: ['row'],
    gridcell: ['row'],
    columnheader: ['row'],
    rowheader: ['row'],
    rowgroup: ['grid', 'table', 'treegrid']
  };

  // -------------------------------------------------------------------
  // H) ARIA-in-HTML permitted roles per element (deliberately scoped to
  //    the most common elements first — see file header). `null` values
  //    are used for elements that permit "any role" in typical states.
  //    Element keys may include a simple attribute condition using the
  //    form 'tag[attr]' or 'tag[attr=value]' for the small number of
  //    elements whose permitted roles depend on an attribute.
  // -------------------------------------------------------------------
  const ALLOWED_ROLES_BY_ELEMENT = {
    // A plain <a href> is constrained to these override roles — unlike a
    // hrefless <a>, which is unconstrained. Restating the native 'link'
    // role is always permitted via the native-role fallback below.
    'a[href]': [
      'button',
      'checkbox',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'option',
      'radio',
      'switch',
      'tab',
      'treeitem',
      'doc-backlink',
      'doc-biblioref',
      'doc-glossref',
      'doc-noteref'
    ],
    // Restating the native 'article' role remains permitted via the
    // native-role fallback below regardless of this list.
    article: ['feed', 'presentation', 'none', 'document', 'application', 'main', 'region'],
    // <area href> permits no override role at all — only its native 'link'
    // role, via the native-role fallback below. Empty array (not null)
    // encodes "constrained to nothing", same convention as
    // 'label[associated]' below.
    'area[href]': [],
    // <area> without href permits only these two roles. ('generic' is
    // technically allowed but SHOULD NOT be used, so it's left out.)
    area: ['button', 'link'],
    // No explicit role is permitted on <html>, and it has no native role
    // to restate, so an empty array is correct (not "unconstrained").
    html: [],
    // No override role is permitted on <picture>, and it has no implicit
    // ARIA role to restate — empty array, same convention as 'html' /
    // 'area[href]' above.
    picture: [],
    // Includes 'gridcell', 'separator', 'slider', 'treeitem': composite-grid
    // widgets commonly build interactive cells on <button> (e.g. a date
    // picker whose day cells are role="gridcell").
    button: [
      'checkbox',
      'combobox',
      'gridcell',
      'link',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'option',
      'radio',
      'separator',
      'slider',
      'switch',
      'tab',
      'treeitem'
    ],
    h1: ['tab', 'presentation', 'none'],
    h2: ['tab', 'presentation', 'none'],
    h3: ['tab', 'presentation', 'none'],
    h4: ['tab', 'presentation', 'none'],
    h5: ['tab', 'presentation', 'none'],
    h6: ['tab', 'presentation', 'none'],
    hr: ['none', 'presentation'],
    // 'complementary' is <aside>'s own native role — allowed via the
    // native-role fallback below even though it's not in this list
    // (spec: "also allowed, but NOT RECOMMENDED", same shape as <nav>).
    aside: ['feed', 'none', 'note', 'presentation', 'region', 'search'],
    form: ['form', 'search', 'none', 'presentation'],
    // The array is identical for both keys; what differs by nesting is only
    // the native-role match (see 'header[toplevel]' below and
    // getElementRoleKey's header branch). A top-level <header role="banner">
    // restates its own implicit "banner" role — a no-op, always permitted —
    // even though 'banner' isn't in this array (same shape as <section>'s
    // named/unnamed split).
    'header[toplevel]': ['group', 'none', 'presentation', 'doc-footnote'],
    header: ['group', 'none', 'presentation', 'doc-footnote'],
    // A <label> associated with a labelable control permits no explicit
    // role (see getElementRoleKey's label[associated] split above).
    'label[associated]': [],
    // Permitted roles depend on whether the img has a non-empty alt (see
    // getElementRoleKey's img[alt]/img split above).
    'img[alt]': [
      'button',
      'checkbox',
      'link',
      'math',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'meter',
      'option',
      'progressbar',
      'radio',
      'scrollbar',
      'separator',
      'slider',
      'switch',
      'tab',
      'treeitem'
    ],
    img: ['presentation', 'none'],
    li: [
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'option',
      'radio',
      'separator',
      'tab',
      'treeitem',
      'listitem',
      'presentation',
      'none'
    ],
    nav: [
      'doc-index',
      'doc-pagelist',
      'doc-toc',
      'menu',
      'menubar',
      'none',
      'presentation',
      'tablist'
    ],
    // Only 'application' is permitted on <video>.
    video: ['application'],
    // Same as <video>, plus 'img'/'document' — an <object> can stand in
    // for an image or a full document.
    object: ['application', 'img', 'document'],
    // 'region' is only permitted when the section has an accessible name
    // (its conditional native role in that case — see getElementRoleKey's
    // section[named]/section split above); every other role here is
    // permitted regardless of naming.
    'section[named]': [
      'alert',
      'alertdialog',
      'application',
      'banner',
      'complementary',
      'contentinfo',
      'dialog',
      'document',
      'feed',
      'group',
      'log',
      'main',
      'marquee',
      'navigation',
      'none',
      'note',
      'presentation',
      'region',
      'search',
      'status',
      'tabpanel'
    ],
    section: [
      'alert',
      'alertdialog',
      'application',
      'banner',
      'complementary',
      'contentinfo',
      'dialog',
      'document',
      'feed',
      'group',
      'log',
      'main',
      'marquee',
      'navigation',
      'none',
      'note',
      'presentation',
      'search',
      'status',
      'tabpanel'
    ],
    ol: [
      'group',
      'listbox',
      'menu',
      'menubar',
      'radiogroup',
      'tablist',
      'toolbar',
      'tree',
      'presentation',
      'none'
    ],
    ul: [
      'group',
      'listbox',
      'menu',
      'menubar',
      'radiogroup',
      'tablist',
      'toolbar',
      'tree',
      'presentation',
      'none'
    ],
    // role="button" is only permitted when paired with aria-pressed (see
    // getElementRoleKey's checkbox[aria-pressed] split above).
    'input[type=checkbox][aria-pressed]': ['button', 'menuitemcheckbox', 'option', 'switch'],
    'input[type=checkbox]': ['menuitemcheckbox', 'option', 'switch'],
    'input[type=radio]': ['menuitemradio'],
    'input[type=image]': [
      'button',
      'link',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'radio',
      'switch'
    ],
    'input[type=text]': ['combobox', 'searchbox', 'spinbutton'],
    'input[type=search]': ['combobox', 'spinbutton'],
    'input[type=tel]': ['combobox', 'spinbutton'],
    'input[type=url]': ['combobox', 'spinbutton'],
    'input[type=email]': ['combobox', 'spinbutton'],
    select: ['menu'],
    // <select multiple> or <select size> 1>: native role is listbox, not
    // combobox (see NATIVE_ROLE_BY_ELEMENT_KEY below) — no override role
    // is permitted, but restating the native listbox role is always
    // allowed via the native-role fallback.
    'select[multiple]': [],
    // <table> permits any role. <td>/<th>/<tr> are spec'd as context-
    // dependent (restricted only when the ancestor <table> is exposed as
    // role=table/grid/treegrid); that conditional isn't implemented here,
    // so they're left unconstrained rather than guessing at ancestor-role
    // resolution.
    table: null,
    td: null,
    th: null,
    tr: null
  };

  // -------------------------------------------------------------------
  // H2) Native/implicit role per ALLOWED_ROLES_BY_ELEMENT key. Keeping an
  //     element's own native role (e.g. role="list" on <ul>, role="table"
  //     on <table>) is never a spec violation — the ARIA-in-HTML "allowed
  //     roles" tables enumerate roles you may override *to*, not the
  //     native default, which remains implicitly valid whether or not it
  //     is redundantly re-declared. isRoleAllowedOnElement always accepts
  //     this role in addition to whatever ALLOWED_ROLES_BY_ELEMENT lists.
  // -------------------------------------------------------------------
  const NATIVE_ROLE_BY_ELEMENT_KEY = {
    'a[href]': 'link',
    'area[href]': 'link',
    article: 'article',
    aside: 'complementary',
    button: 'button',
    form: 'form',
    // No entry for plain 'header' — a header nested in sectioning
    // content/<main> has no implicit role to restate.
    'header[toplevel]': 'banner',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
    hr: 'separator',
    'img[alt]': 'img',
    img: 'img',
    li: 'listitem',
    nav: 'navigation',
    ol: 'list',
    ul: 'list',
    'input[type=checkbox][aria-pressed]': 'checkbox',
    'input[type=checkbox]': 'checkbox',
    'input[type=radio]': 'radio',
    'input[type=image]': 'button',
    'input[type=text]': 'textbox',
    'input[type=search]': 'searchbox',
    'input[type=tel]': 'textbox',
    'input[type=url]': 'textbox',
    'input[type=email]': 'textbox',
    select: 'combobox',
    'select[multiple]': 'listbox',
    table: 'table',
    td: 'cell',
    th: 'columnheader',
    tr: 'row'
  };

  // -------------------------------------------------------------------
  // I) Native HTML tag -> implicit "containment role" mapping, used only
  //    for aria-required-children / aria-required-parent ownership
  //    matching (getContainmentRole). Deliberately small and scoped to
  //    exactly the roles referenced by REQUIRED_OWNED_ROLES /
  //    REQUIRED_CONTEXT_ROLE above, so that adding an explicit container
  //    role (e.g. role="list" on a <ul>, a common CSS-reset workaround)
  //    does not produce a false positive against plain native children
  //    (e.g. <li> with no role attribute) — same scope-limiting rationale
  //    as ALLOWED_ROLES_BY_ELEMENT (see file header).
  // -------------------------------------------------------------------
  const NATIVE_CONTAINMENT_ROLE_BY_ELEMENT = {
    li: 'listitem',
    option: 'option',
    tr: 'row',
    td: 'cell',
    th: 'columnheader',
    thead: 'rowgroup',
    tbody: 'rowgroup',
    tfoot: 'rowgroup',
    ul: 'list',
    ol: 'list',
    table: 'table',
    select: 'listbox',
    'input[type=radio]': 'radio'
  };

  function isElement(el) {
    return !!(el && el.nodeType === 1);
  }

  function getAttr(el, name) {
    try {
      return el && el.getAttribute ? el.getAttribute(name) : null;
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------

  function getExplicitRole(el) {
    if (!isElement(el)) return '';
    const raw = trim(getAttr(el, 'role'));
    if (!raw) return '';
    // role attribute may be a space-separated fallback list; the first
    // token is the "primary" role used by the accessibility tree.
    const tokens = raw.split(/\s+/).filter(Boolean);
    return tokens.length ? lower(tokens[0]) : '';
  }

  function getAllRoleTokens(el) {
    if (!isElement(el)) return [];
    const raw = trim(getAttr(el, 'role'));
    if (!raw) return [];
    return raw.split(/\s+/).filter(Boolean).map(lower);
  }

  function isAbstractRole(role) {
    return ABSTRACT_ROLES.has(lower(role));
  }

  function isDeprecatedRole(role) {
    return DEPRECATED_ROLES.has(lower(role));
  }

  function isAuthorDiscouragedRole(role) {
    return AUTHOR_DISCOURAGED_ROLES.has(lower(role));
  }

  function isAuthorProhibitedRole(role) {
    return AUTHOR_PROHIBITED_ROLES.has(lower(role));
  }

  function isDeprecatedAttr(attr /* , role */) {
    return DEPRECATED_ATTRS.has(lower(attr));
  }

  function isKnownRole(role) {
    const r = lower(role);
    return ABSTRACT_ROLES.has(r) || CONCRETE_ROLES.has(r);
  }

  function isValidConcreteRole(role) {
    return CONCRETE_ROLES.has(lower(role));
  }

  function isValidAriaAttrName(name) {
    const n = lower(name);
    if (!n || n.slice(0, 5) !== 'aria-') return false;
    return Object.prototype.hasOwnProperty.call(ATTR_VALUE_TYPES, n);
  }

  function getAttrValueType(name) {
    return ATTR_VALUE_TYPES[lower(name)] || null;
  }

  // Validates a single attribute's raw string value against its declared
  // value type. Returns { valid, reason } — reason is a short machine
  // code, not a user-facing string (rules localize their own messages).
  function validateAttrValue(name, rawValue) {
    const type = getAttrValueType(name);
    if (!type) return { valid: true, reason: 'unknown-attr-skip' };

    const v = trim(rawValue);

    switch (type) {
      case 'boolean': {
        const ok = v === 'true' || v === 'false';
        return { valid: ok, reason: ok ? '' : 'expected-true-false' };
      }
      case 'boolean-undefined': {
        const ok = v === 'true' || v === 'false' || v === 'undefined' || v === '';
        return { valid: ok, reason: ok ? '' : 'expected-true-false-undefined' };
      }
      case 'tristate': {
        const ok = v === 'true' || v === 'false' || v === 'mixed';
        return { valid: ok, reason: ok ? '' : 'expected-true-false-mixed' };
      }
      case 'integer': {
        const ok = /^-?\d+$/.test(v);
        return { valid: ok, reason: ok ? '' : 'expected-integer' };
      }
      case 'number': {
        const ok = v !== '' && Number.isFinite(Number(v));
        return { valid: ok, reason: ok ? '' : 'expected-number' };
      }
      case 'token': {
        const set = ATTR_TOKEN_SETS[lower(name)];
        if (!set) return { valid: true, reason: 'no-token-set-defined' };
        const ok = set.has(lower(v));
        return { valid: ok, reason: ok ? '' : 'invalid-token' };
      }
      case 'token-list': {
        const set = ATTR_TOKEN_SETS[lower(name)];
        if (!set) return { valid: true, reason: 'no-token-set-defined' };
        const parts = v.split(/\s+/).filter(Boolean).map(lower);
        if (!parts.length) return { valid: false, reason: 'empty-token-list' };
        const ok = parts.every((p) => set.has(p));
        return { valid: ok, reason: ok ? '' : 'invalid-token' };
      }
      case 'idref': {
        // An explicitly-empty value is valid, not "expected-single-idref".
        // Empty idrefs are a common, deliberate pattern in templated
        // markup (e.g. `aria-describedby={hasError ? errorId : ''}`), so
        // flagging them would be a false positive.
        if (v.length === 0) return { valid: true, reason: '' };
        const formatOk = !/\s/.test(v);
        if (!formatOk) return { valid: false, reason: 'expected-single-idref' };
        if (!idExists(v)) return { valid: false, reason: 'idref-not-found' };
        return { valid: true, reason: '' };
      }
      case 'idref-list': {
        const parts = v.split(/\s+/).filter(Boolean);
        // Same allowEmpty rationale as the 'idref' case above — an
        // empty idref-list value is valid, not "empty-idref-list".
        if (!parts.length) return { valid: true, reason: '' };
        // Only flag when NONE of the referenced ids resolve — a
        // partially-dangling list (some ids exist, some don't) is left
        // unflagged.
        if (!parts.some((p) => idExists(p)))
          return { valid: false, reason: 'idref-list-none-found' };
        return { valid: true, reason: '' };
      }
      case 'string':
      default:
        return { valid: true, reason: '' };
    }
  }

  function getRequiredAttrsForRole(role) {
    return REQUIRED_PROPS_BY_ROLE[lower(role)] ? REQUIRED_PROPS_BY_ROLE[lower(role)].slice(0) : [];
  }

  function getRequiredOwnedRoles(role) {
    return REQUIRED_OWNED_ROLES[lower(role)] ? REQUIRED_OWNED_ROLES[lower(role)].slice(0) : null;
  }

  function getRequiredContextRoles(role) {
    return Object.prototype.hasOwnProperty.call(REQUIRED_CONTEXT_ROLE, lower(role))
      ? REQUIRED_CONTEXT_ROLE[lower(role)].slice(0)
      : null;
  }

  // Resolves the ALLOWED_ROLES_BY_ELEMENT / NATIVE_ROLE_BY_ELEMENT_KEY
  // lookup key for an element, accounting for the small set of
  // attribute-conditioned entries. Returns '' when no key applies.
  function getElementRoleKey(el) {
    if (!isElement(el)) return '';
    const tag = lower(el.tagName || '');

    if (tag === 'a' || tag === 'area') {
      const href = getAttr(el, 'href');
      if (href != null && trim(href) !== '') return tag + '[href]';
      // <area> without href has its own permitted-roles entry (see
      // ALLOWED_ROLES_BY_ELEMENT above); hrefless <a> is left
      // unconstrained, since WHATWG/HTML-AAM sources disagree on how
      // restrictive it is.
      return tag === 'area' ? 'area' : '';
    }

    if (tag === 'section') {
      // <section>'s own implicit role is conditional: "region" when it
      // has an accessible name, "generic" when it doesn't (W3C
      // ARIA-in-HTML). So role="region" is a permitted no-op restatement
      // only when a name is present; on an unnamed <section> it's a real
      // violation ('region' isn't in <section>'s allowedRoles array).
      return hasAccessibleNameHint(el) ? 'section[named]' : 'section';
    }

    if (tag === 'header') {
      // <header>'s own implicit role is conditional: "banner" when
      // top-level (not nested inside sectioning content/<main>),
      // generic/null when nested — see hasLandmarkScopingAncestor above
      // (includeMain: true, since <header>'s exclusion list includes
      // <main>). So role="banner" is a permitted no-op restatement only at
      // the top level; 'banner' isn't in <header>'s allowedRoles array and
      // is reached only via the native-role match, same shape as
      // <section>'s 'region'.
      return hasLandmarkScopingAncestor(el, { includeMain: true }) ? 'header' : 'header[toplevel]';
    }

    if (tag === 'label') {
      // A <label> permits no explicit role at all when associated with
      // a labelable form control (via `for` or wrapping); otherwise any
      // role is permitted. Uses the native `.control` API (resolves both
      // `for` and wrapping association) instead of reimplementing that
      // lookup.
      let associated = false;
      try {
        associated = !!el.control;
      } catch {}
      return associated ? 'label[associated]' : '';
    }

    if (tag === 'img') {
      // Permitted roles depend on whether the img has a non-empty alt
      // (see ALLOWED_ROLES_BY_ELEMENT above): with alt text it may take a
      // small set of widget roles; without it, only presentation/none
      // (plus its own native img role, always allowed via the native-role
      // fallback below).
      const alt = getAttr(el, 'alt');
      return alt != null && trim(alt) !== '' ? 'img[alt]' : 'img';
    }

    if (tag === 'input') {
      const type = lower(getAttr(el, 'type') || 'text');
      if (type === 'checkbox') {
        // role="button" is only permitted on a checkbox when paired
        // with aria-pressed (W3C ARIA-in-HTML).
        let hasAriaPressed = false;
        try {
          hasAriaPressed = !!(el.hasAttribute && el.hasAttribute('aria-pressed'));
        } catch {}
        return hasAriaPressed ? 'input[type=checkbox][aria-pressed]' : 'input[type=checkbox]';
      }
      return 'input[type=' + type + ']';
    }

    if (tag === 'select') {
      // <select multiple> or <select size> 1>: native role becomes
      // listbox instead of combobox (WHATWG HTML-AAM), a distinct
      // permitted-roles entry — see ALLOWED_ROLES_BY_ELEMENT/
      // NATIVE_ROLE_BY_ELEMENT_KEY above.
      let isMultiSelect;
      try {
        isMultiSelect = !!(el.hasAttribute && el.hasAttribute('multiple'));
        if (!isMultiSelect) {
          const sizeAttr = getAttr(el, 'size');
          const size = sizeAttr != null ? parseInt(sizeAttr, 10) : NaN;
          isMultiSelect = Number.isFinite(size) && size > 1;
        }
      } catch {
        isMultiSelect = false;
      }
      return isMultiSelect ? 'select[multiple]' : 'select';
    }

    return tag;
  }

  function getAllowedRolesForElement(el) {
    const key = getElementRoleKey(el);
    if (!key) return undefined;
    return Object.prototype.hasOwnProperty.call(ALLOWED_ROLES_BY_ELEMENT, key)
      ? ALLOWED_ROLES_BY_ELEMENT[key]
      : undefined;
  }

  function getNativeRoleForElement(el) {
    const key = getElementRoleKey(el);
    if (!key) return '';
    return Object.prototype.hasOwnProperty.call(NATIVE_ROLE_BY_ELEMENT_KEY, key)
      ? NATIVE_ROLE_BY_ELEMENT_KEY[key]
      : '';
  }

  // Returns { constrained, allowed } — constrained=false means this
  // element/role combination has no asserted constraint (rule should
  // not flag it), matching the deliberately-scoped table above. An
  // element's own native/implicit role (see NATIVE_ROLE_BY_ELEMENT_KEY)
  // is always allowed, even when not separately listed.
  function isRoleAllowedOnElement(el, role) {
    const allowed = getAllowedRolesForElement(el);
    if (allowed === undefined) return { constrained: false, allowed: true };
    if (allowed === null) return { constrained: true, allowed: true };
    const r = lower(role);
    if (r && r === getNativeRoleForElement(el)) return { constrained: true, allowed: true };
    return { constrained: true, allowed: allowed.indexOf(r) !== -1 };
  }

  // Effective role for ownership/context matching only (aria-required-
  // children / aria-required-parent): explicit role wins when present;
  // otherwise falls back to the small NATIVE_CONTAINMENT_ROLE_BY_ELEMENT
  // map above. Not a general-purpose implicit-role resolver — scoped
  // deliberately narrow, see the table's header comment.
  //
  // The explicit role must be a real, valid concrete ARIA role to count:
  // an invalid/unrecognized role="" token (e.g. a library's own
  // non-standard "columngroup") is ignored by browsers/AT, which fall back
  // to the implicit role. Without this, a bogus role token wrongly
  // "blocks" the ancestor/descendant containment-role search instead of
  // being transparent to it — e.g. role="columnheader" cells inside a
  // role="columngroup" wrapper (not a real ARIA role) that itself sits
  // inside the real role="row" ancestor should still resolve to "row".
  function getContainmentRole(el) {
    const explicit = getExplicitRole(el);
    if (explicit && isValidConcreteRole(explicit)) return explicit;

    if (!isElement(el)) return '';
    const tag = lower(el.tagName || '');

    if (tag === 'input') {
      const type = lower(getAttr(el, 'type') || 'text');
      const key = 'input[type=' + type + ']';
      return Object.prototype.hasOwnProperty.call(NATIVE_CONTAINMENT_ROLE_BY_ELEMENT, key)
        ? NATIVE_CONTAINMENT_ROLE_BY_ELEMENT[key]
        : '';
    }

    return Object.prototype.hasOwnProperty.call(NATIVE_CONTAINMENT_ROLE_BY_ELEMENT, tag)
      ? NATIVE_CONTAINMENT_ROLE_BY_ELEMENT[tag]
      : '';
  }

  return {
    isValidAriaAttrName,
    getAttrValueType,
    validateAttrValue,
    getExplicitRole,
    getAllRoleTokens,
    isAbstractRole,
    isDeprecatedRole,
    isAuthorDiscouragedRole,
    isAuthorProhibitedRole,
    isDeprecatedAttr,
    getDeprecatedRoleGuidance,
    isKnownRole,
    isValidConcreteRole,
    getRequiredAttrsForRole,
    getRequiredOwnedRoles,
    getRequiredContextRoles,
    isRoleAllowedOnElement,
    getContainmentRole,

    // An element's own native/implicit ARIA-in-HTML role (see
    // NATIVE_ROLE_BY_ELEMENT_KEY above) — previously internal-only
    // (used by isRoleAllowedOnElement), now also re-exported for
    // aria-prohibited-attr's roleless-element branch, which needs to
    // tell "no role at all" (e.g. a bare <span>/<div>) apart from "has
    // a real implicit role" (e.g. <button>, <a href>) without
    // over-flagging the latter.
    getNativeRoleForElement,

    // Shared "does this element have a landmark-scoping ancestor"
    // primitive — see its own header comment above. Re-exported at
    // helpers' top level too (src/core/dom-helpers.js), matching
    // getLandmarkNameInfo's precedent, for the manual landmark-check
    // files that used to each carry their own (buggy, tag-only) copy.
    hasLandmarkScopingAncestor
  };
}

module.exports = { createAriaHelpers };
