/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

const { createSafeDom } = require('./safe-dom');

/**
 * Shared WAI-ARIA 1.2 role/attribute reference data + validation helpers,
 * exposed to rules via ctx.helpers.aria.
 *
 * SCOPE AND CONFIDENCE NOTES (read before extending)
 * ----------------------------------------------------
 * This data was hand-authored from the WAI-ARIA 1.2 specification and the
 * ARIA in HTML specification, not generated from an official machine-
 * readable feed. To protect FAIL integrity (automatic `fail` must only be
 * emitted for deterministic, high-confidence violations), this module stays
 * CONSERVATIVE BY DESIGN in two specific places:
 *
 * 1) REQUIRED_PROPS_BY_ROLE only lists a required state/property when the
 *    spec is unambiguous and context-independent. Several roles have
 *    required properties that are context-dependent (e.g. option's
 *    aria-selected default varies by selection-follows-focus context) or
 *    where sources disagree; those are intentionally left out of
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
  const dom = createSafeDom();
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

  // Existence check for a single ID token. Never throws, returns false
  // (not "unknown") when the document isn't available so callers degrade
  // to their pre-existing format-only behavior rather than guessing.
  // An ID reference resolves in the referring element's own tree: its shadow
  // root, or the document. One that points across a shadow boundary
  // resolves to nothing, as Chromium resolves it, and one inside a shadow
  // root finds its target there, which document.getElementById can't see.
  function idExists(id, el) {
    let scope = ariaDocument;
    try {
      const root =
        el && typeof dom.get(el, 'getRootNode') === 'function' ? dom.getRootNode(el) : null;
      if (root && typeof dom.get(root, 'getElementById') === 'function') scope = root;
    } catch {}
    if (!scope || typeof dom.get(scope, 'getElementById') !== 'function') return true;
    try {
      return !!dom.getElementById(scope, id);
    } catch {
      return true;
    }
  }

  // Presence-only accessible-name check (aria-label / aria-labelledby /
  // title), for the few role-permission decisions conditioned on whether
  // an element currently has a name (e.g. <section>'s permitted-roles set,
  // see ALLOWED_ROLES_BY_ELEMENT below). Uses the same precedence as
  // dom-helpers.js's getLandmarkNameInfo (aria-label -> aria-labelledby ->
  // title). title counts, so a <section title="..."> resolves to the
  // 'section[named]' role key rather than plain 'section'.
  function hasAccessibleNameHint(el) {
    const al = trim(getAttr(el, 'aria-label'));
    if (al) return true;
    const alb = trim(getAttr(el, 'aria-labelledby'));
    // The references resolve in the element's own tree, as in idExists.
    let scope = ariaDocument;
    try {
      const root = typeof dom.get(el, 'getRootNode') === 'function' ? dom.getRootNode(el) : null;
      if (root && typeof dom.get(root, 'getElementById') === 'function') scope = root;
    } catch {}
    if (alb && scope && typeof dom.get(scope, 'getElementById') === 'function') {
      for (const refId of alb.split(/\s+/).filter(Boolean)) {
        try {
          const ref = dom.getElementById(scope, refId);
          if (ref && trim(dom.textContent(ref))) return true;
        } catch {}
      }
    }
    const title = trim(getAttr(el, 'title'));
    if (title) return true;
    return false;
  }

  // Shared "does this element have a landmark-scoping ancestor" primitive.
  // <header>'s "banner", <footer>'s "contentinfo", and <aside>'s
  // "complementary" implicit roles are all conditioned on the same W3C
  // ARIA-in-HTML exclusion: suppressed when nested inside sectioning
  // content (article/aside/nav/section), and for header/footer only,
  // also suppressed when nested inside <main> (pass includeMain: true).
  // <aside> itself omits <main> from its own exclusion list (see the
  // `aside` case in getElementRoleKey below), so callers must pass the
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
    const tag = lower(dom.tagName(el) || '');
    // The resolved role (#91). A role attribute naming no known role is as if
    // there were none, so the plain HTML tag decides.
    const token = getExplicitRole(el);
    if (!token) {
      if (LANDMARK_SCOPING_TAGS.has(tag)) return true;
      return includeMain && tag === 'main';
    }
    if (LANDMARK_SCOPING_ROLE_TOKENS.has(token)) return true;
    return includeMain && token === 'main';
  }

  function hasLandmarkScopingAncestor(el, opts) {
    if (!isElement(el)) return false;
    const includeMain = !!(opts && opts.includeMain);
    let cur = dom.parentElement(el);
    let guard = 0;
    while (cur && guard++ < 200) {
      if (isLandmarkScopingAncestorElement(cur, includeMain)) return true;
      // Don't climb past the scanned scope -- a contextSelector-scoped
      // (or fragment) scan should never let ancestry OUTSIDE the
      // analyzed subtree affect a role computed WITHIN it.
      if (ariaRoots.includes(cur)) break;
      cur = dom.parentElement(cur);
    }
    return false;
  }

  // -------------------------------------------------------------------
  // A) Abstract roles: MUST NOT be used directly in a role="" attribute.
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
  //    declare, either because WAI-ARIA has deprecated them (a direct
  //    replacement exists) or because they are reserved for
  //    user-agent-internal use. Flagged by aria-deprecated-role, not
  //    aria-roles-valid (which only checks existence/abstractness); see
  //    DEPRECATED_ROLE_GUIDANCE below for per-role, reason-accurate
  //    messaging.
  // -------------------------------------------------------------------
  // Deprecated but still VALID roles (SHOULD NOT, still conforming). Reported
  // as cantTell so the author decides whether it matters to them.
  const DEPRECATED_ROLES = new Set([
    'directory' // superseded by role="list"
  ]);

  // Valid roles reserved for user-agent-internal use, which ARIA states at
  // SHOULD NOT strength: conforming, so reported as cantTell.
  const AUTHOR_DISCOURAGED_ROLES = new Set([
    'generic' // "primarily for implementors of user agents"
  ]);

  // Roles carrying an author MUST NOT, reported as fail. Empty under ARIA 1.2
  // and 1.3, whose only author MUST NOT covers abstract roles; that's the
  // concern of aria-roles-valid.
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

  // Each entry carries the i18n key the occurrence hint resolves through and
  // the English text behind it, which is the literal fallback.
  const DEPRECATED_ROLE_GUIDANCE = {
    directory: {
      key: 'ariaDeprecatedRole_guidance_directory',
      text: 'Replace it with role="list" (its recommended replacement).'
    },
    generic: {
      key: 'ariaDeprecatedRole_guidance_generic',
      text: 'Remove it: this role is reserved for user-agent-internal use, not authors. Use role="presentation"/"none" to strip semantics, a semantic role like "group" to convey grouping, or a plain element (which already carries the implicit generic role) instead.'
    }
  };

  const DEFAULT_DEPRECATED_ROLE_GUIDANCE = {
    key: 'ariaDeprecatedRole_guidance_default',
    text: 'Replace the deprecated role with its recommended replacement.'
  };

  function getDeprecatedRoleGuidance(role) {
    const key = lower(role);
    return Object.prototype.hasOwnProperty.call(DEPRECATED_ROLE_GUIDANCE, key)
      ? DEPRECATED_ROLE_GUIDANCE[key]
      : DEFAULT_DEPRECATED_ROLE_GUIDANCE;
  }

  // -------------------------------------------------------------------
  // C) Complete set of concrete (non-abstract) WAI-ARIA 1.2 role tokens,
  //    plus the WAI-ARIA Graphics Module 1.0 roles (graphics-document/
  //    graphics-object/graphics-symbol), a separate W3C Recommendation
  //    that extends core ARIA, with a companion Graphics Accessibility API
  //    Mappings REC defining AT support. Without these, aria-roles-valid
  //    would wrongly report an AT-recognized role as unrecognized.
  //    Digital Publishing WAI-ARIA (doc-abstract etc.) is a separate
  //    module, left out of scope for now.
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
  //    'token'        : one value from a fixed enumerated set
  //    'token-list'   : space-separated values from a fixed enumerated set
  //    'boolean'      : "true" | "false"
  //    'tristate'     : "true" | "false" | "mixed"
  //    'boolean-undefined' : "true" | "false" | "undefined"
  //    'idref'        : a single ID token (existence not verified here)
  //    'idref-list'   : space-separated ID tokens
  //    'integer'      : a base-10 integer (may be negative where noted)
  //    'number'       : a real number
  //    'string'       : free-form text (only non-emptiness may be checked)
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
  // E) Required states/properties per role (see file header: conservative
  //    on purpose, only unambiguous, context-independent cases).
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

  // Generated from aria-query's requiredProps: the required states/properties
  // ARIA gives an implicit value, so omitting the attribute still leaves the
  // role exposing something. Only these can be reported below fail strength;
  // every other required attribute has no spec-supplied stand-in.
  // <generated:aria-required-prop-implicit-values>
  const REQUIRED_PROP_IMPLICIT_VALUES = {
    combobox: { 'aria-expanded': 'false' },
    heading: { 'aria-level': '2' },
    option: { 'aria-selected': 'false' }
  };
  // </generated:aria-required-prop-implicit-values>

  // -------------------------------------------------------------------
  // F) Required owned (child) roles for composite/container roles.
  //    Value is an array of alternative acceptable child roles (any one
  //    satisfies the requirement). aria-owns references also count as
  //    "owning"; that's checked by the rule, not this table.
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
  // H) ARIA-in-HTML permitted roles per element (scoped on purpose to
  //    the most common elements first, see file header). `null` values
  //    are used for elements that permit "any role" in typical states.
  //    Element keys may include a simple attribute condition using the
  //    form 'tag[attr]' or 'tag[attr=value]' for the small number of
  //    elements whose permitted roles depend on an attribute.
  // -------------------------------------------------------------------
  const ALLOWED_ROLES_BY_ELEMENT = {
    // A plain <a href> is constrained to these override roles, unlike a
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
    // <area href> permits no override role at all, only its native 'link'
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
    // ARIA role to restate. Empty array, same convention as 'html' /
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
    // 'complementary' is <aside>'s own native role, allowed via the
    // native-role fallback below even though it's not in this list
    // (spec: "also allowed, but NOT RECOMMENDED", same shape as <nav>).
    aside: ['feed', 'none', 'note', 'presentation', 'region', 'search'],
    form: ['form', 'search', 'none', 'presentation'],
    // The array is identical for both keys; what differs by nesting is only
    // the native-role match (see 'header[toplevel]' below and
    // getElementRoleKey's header branch). A top-level <header role="banner">
    // restates its own implicit "banner" role, a no-op that's always
    // permitted even though 'banner' isn't in this array (same shape as <section>'s
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
    // Same as <video>, plus 'img'/'document': an <object> can stand in
    // for an image or a full document.
    object: ['application', 'img', 'document'],
    // 'region' is only permitted when the section has an accessible name
    // (its conditional native role in that case, see getElementRoleKey's
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
    // combobox (see NATIVE_ROLE_BY_ELEMENT_KEY below); no override role
    // is permitted, but restating the native listbox role is always
    // allowed via the native-role fallback.
    'select[multiple]': [],
    // No role other than its own 'main' is permitted on <main> (ARIA in
    // HTML), and that one via the native-role fallback below.
    main: [],
    // <table> permits any role. <td>/<th>/<tr> are context-dependent: when
    // the ancestor <table> is exposed as role=table, grid or treegrid (no
    // explicit role, or one of those three) they permit no role other than
    // their own, which is cell or gridcell for <td>, columnheader, rowheader,
    // cell or gridcell for <th>, and row for <tr> (see getElementRoleKey's
    // td[table]/th[table]/tr[table] split). Outside such a table they
    // permit any role.
    table: null,
    'td[table]': ['cell', 'gridcell'],
    'th[table]': ['columnheader', 'rowheader', 'cell', 'gridcell'],
    'tr[table]': [],
    td: null,
    th: null,
    tr: null
  };

  // -------------------------------------------------------------------
  // H2) Native/implicit role per ALLOWED_ROLES_BY_ELEMENT key. Keeping an
  //     element's own native role (e.g. role="list" on <ul>, role="table"
  //     on <table>) is never a spec violation. The ARIA-in-HTML "allowed
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
    // No entry for plain 'header': a header nested in sectioning
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
    main: 'main',
    table: 'table',
    'td[table]': 'cell',
    'th[table]': 'columnheader',
    'tr[table]': 'row',
    td: 'cell',
    th: 'columnheader',
    tr: 'row'
  };

  // -------------------------------------------------------------------
  // I) Native HTML tag -> implicit "containment role" mapping, used only
  //    for aria-required-children / aria-required-parent ownership
  //    matching (getContainmentRole). Kept small on purpose and scoped to
  //    exactly the roles referenced by REQUIRED_OWNED_ROLES /
  //    REQUIRED_CONTEXT_ROLE above, so that adding an explicit container
  //    role (e.g. role="list" on a <ul>, a common CSS-reset workaround)
  //    does not produce a false positive against plain native children
  //    (e.g. <li> with no role attribute), same scope-limiting rationale
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

  // Several of the roles above are conditional in HTML-AAM: the element only
  // carries them inside the native structure they belong to. An <li> loose in
  // a <div> is not a listitem, and ACT bc4a75 turns on exactly that:
  // `<div role="list"><li>Item</li><span role="link">x</span></div>` fails,
  // because the list owns no valid child at all once the <li> stops counting.
  // `directParent` distinguishes HTML-AAM's "child of" conditions (li, option,
  // the row groups) from its "descendant of a table" ones (tr, td, th), which
  // sit inside a rowgroup in most real tables.
  const NATIVE_CONTAINMENT_CONTEXT = {
    li: { tags: ['ul', 'ol', 'menu'], directParent: true },
    option: { tags: ['select', 'datalist', 'optgroup'], directParent: true },
    thead: { tags: ['table'], directParent: true },
    tbody: { tags: ['table'], directParent: true },
    tfoot: { tags: ['table'], directParent: true },
    tr: { tags: ['table'], directParent: false },
    td: { tags: ['table'], directParent: false },
    th: { tags: ['table'], directParent: false }
  };

  // Walks light-DOM parents only. A slotted element whose native container
  // lives in a shadow tree therefore reads as out of context; the containment
  // rules already treat shadow boundaries as their own scope, and no ACT
  // example covers the crossing.
  function hasNativeContext(el, context) {
    const tags = context.tags;
    let cur = el && dom.parentElement(el) ? dom.parentElement(el) : null;
    let guard = 0;
    while (cur && guard++ < 200) {
      const tag = lower(dom.tagName(cur) || '');
      if (tags.indexOf(tag) !== -1) return true;
      if (context.directParent) return false;
      cur = dom.parentElement(cur);
    }
    return false;
  }

  function isElement(el) {
    return !!(el && dom.nodeType(el) === 1);
  }

  function getAttr(el, name) {
    try {
      return el && dom.get(el, 'getAttribute') ? dom.getAttribute(el, name) : null;
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------

  // The role an element's role attribute gives it, lower-cased, or '' when it
  // gives none. The attribute is a fallback list: WAI-ARIA has user agents
  // use "the first token in the sequence of tokens in the role attribute
  // value that matches the name of any non-abstract WAI-ARIA role", and treat
  // the element "as if no role had been provided" when none does. Browsers
  // match tokens in any case, so role="foo BUTTON" is a button (#91).
  function getExplicitRole(el) {
    if (!isElement(el)) return '';
    const raw = trim(getAttr(el, 'role'));
    if (!raw) return '';
    for (const token of raw.split(/\s+/)) {
      const t = lower(token);
      if (t && CONCRETE_ROLES.has(t)) return t;
    }
    return '';
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

  // Is this element in a state where the thing it controls legitimately
  // isn't in the DOM yet? A collapsed disclosure/combobox/tab renders its
  // popup on expand, so `aria-controls` pointing at an id that doesn't
  // exist *while collapsed* is the documented authoring pattern, not a
  // defect. aria-expanded="false" / aria-selected="false" are the two
  // states that say so.
  function controlsTargetMayBeUnrendered(el) {
    return (
      lower(getAttr(el, 'aria-expanded')) === 'false' ||
      lower(getAttr(el, 'aria-selected')) === 'false'
    );
  }

  // Validates a single attribute's raw string value against its declared
  // value type. Returns { valid, reason, review? }; reason is a short
  // machine code, not a user-facing string (rules localize their own
  // messages). `review: true` marks the one case that is neither valid nor
  // a confident violation: the value is well-formed but the engine cannot
  // decide, statically, whether it is wrong (see aria-controls below).
  // `el` is optional; without it the few element-state-dependent branches
  // fall back to their element-agnostic answer.
  // Lower bounds WAI-ARIA 1.2 sets on integer values ("an integer greater
  // than or equal to ..."). aria-setsize also accepts -1; aria-colcount and
  // aria-rowcount (-1 or at least the number of columns/rows in the DOM)
  // are left to the plain integer check.
  const INTEGER_ATTR_MIN = {
    'aria-level': 1,
    'aria-posinset': 1,
    'aria-setsize': 1,
    'aria-colindex': 1,
    'aria-rowindex': 1,
    'aria-colspan': 1,
    'aria-rowspan': 0
  };

  function validateAttrValue(name, rawValue, el) {
    const type = getAttrValueType(name);
    if (!type) return { valid: true, reason: 'unknown-attr-skip' };

    const v = trim(rawValue);

    // ACT 6a7281's own applicability: "any WAI-ARIA state or property that
    // is not empty". An explicitly empty value, including a bare boolean-
    // style attribute with no "=value" at all (e.g. `aria-checked` alone),
    // is out of this rule's scope entirely for every value type, not a
    // violation. Empty idrefs/idref-lists are additionally a common,
    // deliberate pattern in templated markup (e.g.
    // `aria-describedby={hasError ? errorId : ''}`).
    if (v.length === 0) return { valid: true, reason: '' };

    // true, false, undefined and mixed are read in any case, like the token
    // values below: Chromium exposes aria-checked="TRUE" as checked and
    // hides an aria-hidden="True" subtree, and the engine's own readers of
    // these states lowercase them too.
    const lv = lower(v);
    switch (type) {
      case 'boolean': {
        const ok = lv === 'true' || lv === 'false';
        return { valid: ok, reason: ok ? '' : 'expected-true-false' };
      }
      case 'boolean-undefined': {
        const ok = lv === 'true' || lv === 'false' || lv === 'undefined';
        return { valid: ok, reason: ok ? '' : 'expected-true-false-undefined' };
      }
      case 'tristate': {
        const ok = lv === 'true' || lv === 'false' || lv === 'mixed';
        return { valid: ok, reason: ok ? '' : 'expected-true-false-mixed' };
      }
      case 'integer': {
        const ok = /^-?\d+$/.test(v);
        if (!ok) return { valid: false, reason: 'expected-integer' };
        // WAI-ARIA 1.2 bounds some integers: a level, position, index or
        // column span starts at 1, a row span at 0, and a set size is at
        // least 1 or -1 (unknown). A value outside the range exposes no
        // meaningful level or position.
        const n = Number(v);
        const min = INTEGER_ATTR_MIN[lower(name)];
        if (min === undefined) return { valid: true, reason: '' };
        if (n >= min) return { valid: true, reason: '' };
        if (lower(name) === 'aria-setsize' && n === -1) return { valid: true, reason: '' };
        return { valid: false, reason: 'integer-out-of-range' };
      }
      case 'number': {
        const ok = Number.isFinite(Number(v));
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
        const ok = parts.every((p) => set.has(p));
        return { valid: ok, reason: ok ? '' : 'invalid-token' };
      }
      case 'idref': {
        const formatOk = !/\s/.test(v);
        if (!formatOk) return { valid: false, reason: 'expected-single-idref' };
        // ACT 6a7281's own Background: aria-errormessage is a non-required
        // property whose target commonly doesn't exist yet. An HTML
        // element with that id "may be created in response to an event
        // that may or may not happen", so existence is not
        // checked for this one attribute, format only. aria-activedescendant
        // has no such carve-out in ACT's own text and keeps the existence
        // check.
        if (lower(name) === 'aria-errormessage') return { valid: true, reason: '' };
        if (!idExists(v, el)) return { valid: false, reason: 'idref-not-found' };
        return { valid: true, reason: '' };
      }
      case 'idref-list': {
        const parts = v.split(/\s+/).filter(Boolean);
        // Only flag when NONE of the referenced ids resolve. A
        // partially-dangling list (some ids exist, some don't) is left
        // unflagged.
        if (parts.some((p) => idExists(p, el))) return { valid: true, reason: '' };

        // aria-controls is the one idref-list attribute whose target is
        // routinely absent by design: the menu, listbox or panel it names
        // is created when the widget opens. A collapsed widget therefore
        // passes outright, and every other unresolved aria-controls is
        // handed to a human rather than failed, since a static scan cannot
        // see markup that only exists after an interaction. Same reasoning
        // as aria-errormessage's carve-out above, one state further along.
        if (lower(name) === 'aria-controls') {
          if (controlsTargetMayBeUnrendered(el))
            return { valid: true, reason: 'idref-controls-unrendered' };
          return { valid: false, review: true, reason: 'idref-controls-not-found' };
        }

        // Any other list (aria-labelledby, aria-describedby, aria-owns,
        // aria-flowto, aria-details) that resolves to nothing is asked
        // about rather than failed: the element falls back to its other
        // name or description sources, and whether anything was lost
        // depends on what the reference was meant to add.
        return { valid: false, review: true, reason: 'idref-list-none-found' };
      }
      case 'string':
      default:
        return { valid: true, reason: '' };
    }
  }

  function getRequiredAttrsForRole(role) {
    return REQUIRED_PROPS_BY_ROLE[lower(role)] ? REQUIRED_PROPS_BY_ROLE[lower(role)].slice(0) : [];
  }

  function getRequiredAttrImplicitValue(role, attr) {
    const forRole = REQUIRED_PROP_IMPLICIT_VALUES[lower(role)];
    if (!forRole) return null;
    const v = forRole[lower(attr)];
    return typeof v === 'string' ? v : null;
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
    const tag = lower(dom.tagName(el) || '');

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
      // generic/null when nested. See hasLandmarkScopingAncestor above
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
      // role is permitted. The shared getLabelControl resolves both `for`
      // and wrapping association as the native `.control` does, without
      // its whole-document walk in jsdom.
      let associated = false;
      try {
        associated =
          shared && typeof shared.getLabelControl === 'function'
            ? !!shared.getLabelControl(el)
            : !!el.control;
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
          hasAriaPressed = !!(dom.get(el, 'hasAttribute') && dom.hasAttribute(el, 'aria-pressed'));
        } catch {}
        return hasAriaPressed ? 'input[type=checkbox][aria-pressed]' : 'input[type=checkbox]';
      }
      return 'input[type=' + type + ']';
    }

    if (tag === 'td' || tag === 'th' || tag === 'tr') {
      // Constrained only inside a <table> exposed as a table, grid or
      // treegrid: one with no explicit role, or with one of those three.
      // A layout table (role=none/presentation) or any other role leaves
      // its cells and rows free (ARIA in HTML).
      let table;
      try {
        table = dom.get(el, 'closest') ? dom.closest(el, 'table') : null;
      } catch {
        table = null;
      }
      if (!table) return tag;
      const tableRole = getExplicitRole(table);
      const exposedAsTable =
        !tableRole ||
        !isValidConcreteRole(tableRole) ||
        tableRole === 'table' ||
        tableRole === 'grid' ||
        tableRole === 'treegrid';
      return exposedAsTable ? tag + '[table]' : tag;
    }

    if (tag === 'select') {
      // <select multiple> or <select size> 1>: native role becomes
      // listbox instead of combobox (WHATWG HTML-AAM), a distinct
      // permitted-roles entry. See ALLOWED_ROLES_BY_ELEMENT/
      // NATIVE_ROLE_BY_ELEMENT_KEY above.
      let isMultiSelect;
      try {
        isMultiSelect = !!(dom.get(el, 'hasAttribute') && dom.hasAttribute(el, 'multiple'));
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

  // Returns { constrained, allowed }; constrained=false means this
  // element/role combination has no asserted constraint (rule should
  // not flag it), matching the intentionally scoped table above. An
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
  // map above. Not a general-purpose implicit-role resolver; kept
  // narrow on purpose, see the table's header comment.
  //
  // The explicit role must be a real, valid concrete ARIA role to count:
  // an invalid/unrecognized role="" token (e.g. a library's own
  // non-standard "columngroup") is ignored by browsers/AT, which fall back
  // to the implicit role. Without this, a bogus role token wrongly
  // "blocks" the ancestor/descendant containment-role search instead of
  // being transparent to it, e.g. role="columnheader" cells inside a
  // role="columngroup" wrapper (not a real ARIA role) that itself sits
  // inside the real role="row" ancestor should still resolve to "row".
  function getContainmentRole(el) {
    const explicit = getExplicitRole(el);
    if (explicit && isValidConcreteRole(explicit)) return explicit;

    if (!isElement(el)) return '';
    const tag = lower(dom.tagName(el) || '');

    if (tag === 'input') {
      const type = lower(getAttr(el, 'type') || 'text');
      const key = 'input[type=' + type + ']';
      return Object.prototype.hasOwnProperty.call(NATIVE_CONTAINMENT_ROLE_BY_ELEMENT, key)
        ? NATIVE_CONTAINMENT_ROLE_BY_ELEMENT[key]
        : '';
    }

    if (!Object.prototype.hasOwnProperty.call(NATIVE_CONTAINMENT_ROLE_BY_ELEMENT, tag)) return '';

    // A conditional role only holds inside the structure HTML-AAM names.
    const context = NATIVE_CONTAINMENT_CONTEXT[tag];
    if (context && !hasNativeContext(el, context)) return '';

    return NATIVE_CONTAINMENT_ROLE_BY_ELEMENT[tag];
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
    getRequiredAttrImplicitValue,
    getRequiredOwnedRoles,
    getRequiredContextRoles,
    isRoleAllowedOnElement,
    getContainmentRole,

    // An element's own native/implicit ARIA-in-HTML role (see
    // NATIVE_ROLE_BY_ELEMENT_KEY above), used internally by
    // isRoleAllowedOnElement and also exported for
    // aria-prohibited-attr's roleless-element branch, which needs to
    // tell "no role at all" (e.g. a bare <span>/<div>) apart from "has
    // a real implicit role" (e.g. <button>, <a href>) without
    // over-flagging the latter.
    getNativeRoleForElement,

    // Shared "does this element have a landmark-scoping ancestor"
    // primitive, see its own header comment above. Re-exported at
    // helpers' top level too (src/core/dom-helpers.js), matching
    // getLandmarkNameInfo's precedent, so the manual landmark-check
    // files can share one implementation instead of each carrying its
    // own copy.
    hasLandmarkScopingAncestor
  };
}

module.exports = { createAriaHelpers };
