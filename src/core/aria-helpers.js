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
  // title), for the small set of role-permission decisions that are
  // themselves conditioned on "does this element currently have a name"
  // (e.g. <section>'s permitted-roles set — see ALLOWED_ROLES_BY_ELEMENT
  // below). Mirrors dom-helpers.js's getLandmarkNameInfo precedence
  // (aria-label -> aria-labelledby -> title), the single shared
  // implementation the 7 manual landmark-check files now delegate to
  // after their own former "not title" copies were found to miss real
  // title-named landmarks (see getLandmarkNameInfo's own header comment —
  // confirmed against a widely-used reference engine and a real page,
  // DuckDuckGo's <nav title="navigation">). This function used to match
  // that same stale, pre-fix precedent (aria-label/aria-labelledby only)
  // and was never updated alongside it: a <section title="...">, named
  // only via title, was resolved to the plain 'section' role key instead
  // of 'section[named]' — whose own ALLOWED_ROLES_BY_ELEMENT entry omits
  // 'region' specifically because a title-named <section> is excluded
  // from it — so aria-allowed-role wrongly failed an explicit
  // role="region" restatement on it, even though this same codebase's own
  // landmark rules already correctly treat that section as a named,
  // "region"-eligible landmark.
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
  // ROLE-AWARE, not tag-only: an ancestor's bare TAG only counts when it
  // has NO role attribute at all; once ANY role attribute is present,
  // only that attribute's own (first-token) value decides membership —
  // matching a widely-used reference engine's real
  // getSectioningContentSelector/getSectioningContentPlusMainSelector,
  // verified 2026-07-30 by reading that engine's source directly:
  // `${tag}:not([role])` for the tag-based branch, OR'd with a wholly
  // separate ` [role=article], [role=complementary], [role=navigation],
  // [role=region]` branch (plus `, main:not([role]), [role=main]` for
  // the plus-main variant) — never a tag-AND-role intersection.
  //
  // This replaced a tag-name-only ancestor walk (used only for <header>,
  // and separately re-duplicated with the same tag-only bug across 6
  // manual landmark-check files — see each file's own delegation to
  // helpers.hasLandmarkScopingAncestor now) that missed a real page:
  // handsontable.com's docs-assistant side panel is an
  // <aside role="dialog"> containing its own <header>. role="dialog" is
  // not one of the four scoping roles, so per spec the nested <header>
  // DOES keep its implicit "banner" role (confirmed against that
  // reference engine's real output via a minimal repro) — but the old
  // tag-only check unconditionally suppressed it purely because the
  // ancestor TAG was <aside>, regardless of its role override. A real
  // false negative in landmark-no-duplicate-banner/landmark-unique,
  // found via the cross-engine comparisons project 2026-07-30.
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

  // -------------------------------------------------------------------
  // B) Valid, concrete (non-abstract) roles that authors must never
  //    explicitly declare — either because WAI-ARIA has deprecated them
  //    (a direct replacement exists) or because they are reserved for
  //    user-agent-internal use only (not a spec deprecation, but the
  //    same "valid token, prohibited for authors" shape). Flagged by
  //    aria-deprecated-role, not aria-roles-valid (which only checks
  //    existence/abstractness) — see DEPRECATED_ROLE_GUIDANCE below for
  //    per-role, reason-accurate messaging.
  // -------------------------------------------------------------------
  const DEPRECATED_ROLES = new Set([
    'directory', // superseded by role="list"
    // WAI-ARIA 1.2: "intended for use as the implicit role of generic
    // elements in host languages for use by user agents only; not for
    // use by developers." MDN, verbatim: "It should not be used by web
    // authors." Verified 2026-07-20 against both sources — this is not
    // a guess.
    'generic'
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
  // C) Complete set of concrete (non-abstract) WAI-ARIA 1.2 role tokens.
  // -------------------------------------------------------------------
  const CONCRETE_ROLES = new Set([
    // Live region / window roles
    'alert',
    'alertdialog',
    'dialog',
    'log',
    'marquee',
    'status',
    'timer',
    // Landmark roles
    'banner',
    'complementary',
    'contentinfo',
    'form',
    'main',
    'navigation',
    'region',
    'search',
    // Widget roles (leaf)
    'button',
    'checkbox',
    'gridcell',
    'link',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'progressbar',
    'radio',
    'scrollbar',
    'searchbox',
    'separator',
    'slider',
    'spinbutton',
    'switch',
    'tab',
    'tabpanel',
    'textbox',
    'treeitem',
    'tooltip',
    // Composite widget roles
    'combobox',
    'grid',
    'listbox',
    'menu',
    'menubar',
    'radiogroup',
    'tablist',
    'tree',
    'treegrid',
    // Document structure roles
    'application',
    'article',
    'blockquote',
    'caption',
    'cell',
    'code',
    'columnheader',
    'comment',
    'definition',
    'deletion',
    'directory',
    'document',
    'emphasis',
    'feed',
    'figure',
    'generic',
    'group',
    'heading',
    'img',
    'insertion',
    'list',
    'listitem',
    'mark',
    'math',
    'meter',
    'none',
    'note',
    'paragraph',
    'presentation',
    'row',
    'rowgroup',
    'rowheader',
    'strong',
    'subscript',
    'suggestion',
    'superscript',
    'table',
    'term',
    'text',
    'time',
    'toolbar'
  ]);

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
    // Verified 2026-07-21 against a widely-used reference engine's own
    // requiredAttrs table AND cross-checked for the context-dependence
    // this table's own policy cares about: unlike progressbar
    // (deliberately excluded here and by that engine — an indeterminate
    // progressbar legitimately omits aria-valuenow) or separator
    // (required only when focusable/acting as a widget, not for the
    // common plain-divider usage — a genuine conditional case,
    // deliberately NOT added here for that reason), meter has no
    // "indeterminate" concept and no focusable/non-
    // focusable split: it always represents a concrete measurement, so
    // aria-valuenow is unconditionally required. Also investigated
    // combobox's aria-controls (in that engine's table too) and deliberately
    // did NOT add it — confirmed via MDN's own combobox role page that
    // it's only required once the popup is actually displayed
    // (aria-expanded="true"), a real context-dependent case this
    // table's own stated policy excludes.
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
    // Verified against a widely-used reference engine's own allowedRoles table for the
    // 'href' variant of 'a' (2026-07-20 — found via a real page: Blick
    // Art Materials' homepage carousel uses <a href="..." role="group">
    // for its slides, which is not a permitted override; a plain
    // <a href> is NOT unconstrained the way a hrefless <a> is — that was
    // the actual bug, this key had been set to null/"any role" by
    // mistake). Restating the native 'link' role is still always
    // permitted via the native-role fallback below regardless of this
    // list.
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
    // Verified against a widely-used reference engine's own allowedRoles table for
    // 'article' (2026-07-21 — found via a real page: Udacity's
    // homepage carousel, a Swiper.js slider whose 15 slides are each
    // <article role="group">, not a permitted override). Restating
    // the native 'article' role remains permitted via the native-role
    // fallback below regardless of this list.
    article: ['feed', 'presentation', 'none', 'document', 'application', 'main', 'region'],
    // Verified against a widely-used reference engine's own allowedRoles table for the
    // 'href' variant of 'area' (2026-07-20, found while re-checking the
    // sibling <a href> bug above): that engine sets this to `false`, i.e. NO
    // override role is permitted at all on an <area href> — only its
    // native 'link' role, via the native-role fallback below. An empty
    // array (not null) is the correct encoding, same convention already
    // used for 'label[associated]' below.
    'area[href]': [],
    // Verified against a widely-used reference engine and the W3C ARIA-in-HTML spec
    // (2026-07-20): <area> without href permits only these two roles
    // ('generic' is also technically allowed but SHOULD NOT be used per
    // spec, and that engine itself excludes it from its allowed-roles list, so
    // it's left out here too rather than asserted as permitted).
    area: ['button', 'link'],
    // Verified against a widely-used reference engine's own element-spec table for 'html'
    // (2026-07-21, found via a real page: news24.com's South Africa
    // homepage uses <html role="document">): that engine sets this to
    // `allowedRoles: false` — no explicit role is ever permitted on
    // <html>, and there's no native role to restate either (no entry in
    // NATIVE_ROLE_BY_ELEMENT_KEY below), so an empty array is correct
    // here, not "unconstrained" (no prior entry meant this element was
    // silently unchecked).
    html: [],
    // Verified against a widely-used reference engine's own element-spec table for 'picture'
    // (2026-07-23, found via a real page: TradingView's homepage,
    // <picture role="presentation"> used twice for hero illustrations):
    // that engine sets this to `allowedRoles: false` -- no override role is ever
    // permitted on <picture> (it has no implicit ARIA role either, so
    // there's no native-role-restatement exception -- an empty array is
    // correct, same convention as 'html'/'area[href]' above).
    picture: [],
    button: [
      'checkbox',
      'combobox',
      'link',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'option',
      'radio',
      'switch',
      'tab'
    ],
    h1: ['tab', 'presentation', 'none'],
    h2: ['tab', 'presentation', 'none'],
    h3: ['tab', 'presentation', 'none'],
    h4: ['tab', 'presentation', 'none'],
    h5: ['tab', 'presentation', 'none'],
    h6: ['tab', 'presentation', 'none'],
    hr: ['none', 'presentation'],
    // Verified against a widely-used reference engine and the W3C ARIA-in-HTML spec
    // (2026-07-20 — found via a real page: Stack Overflow's search
    // filter panel uses <form role="region">, which surea11y was
    // silently not checking at all — no entry meant "unconstrained").
    // 'complementary' is <aside>'s own native role — allowed via the
    // native-role fallback below even though it's not in this list
    // (spec: "also allowed, but NOT RECOMMENDED", same shape as <nav>).
    aside: ['feed', 'none', 'note', 'presentation', 'region', 'search'],
    form: ['form', 'search', 'none', 'presentation'],
    // Verified against a widely-used reference engine's own allowedRoles table for
    // 'header' (2026-07-20): the old code had no entry at all for
    // <header>, meaning "no role constraint" — silently not checking it.
    // Found via a real site: Vimeo's global nav uses
    // <header role="navigation">, invalid regardless of nesting since
    // "navigation" isn't in that engine's allowed array either way. The array
    // itself is identical for both keys — what differs by nesting is
    // only the native-role match (see 'header[toplevel]' below and
    // getElementRoleKey's header branch): a top-level <header
    // role="banner"> restates its own implicit "banner" role (a no-op,
    // always permitted) even though 'banner' isn't in this array —
    // found via a real site, Navy Federal's top-level <header
    // role="banner">, which was a false-positive fail before this split
    // existed (same shape as <section>'s named/unnamed split).
    'header[toplevel]': ['group', 'none', 'presentation', 'doc-footnote'],
    header: ['group', 'none', 'presentation', 'doc-footnote'],
    // Verified against a widely-used reference engine and the W3C ARIA-in-HTML spec
    // (2026-07-20): a <label> associated with a labelable control
    // permits no explicit role at all (see getElementRoleKey's
    // label[associated] split above).
    'label[associated]': [],
    // Verified against a widely-used reference engine and the W3C ARIA-in-HTML spec
    // (2026-07-20): permitted roles depend on whether the img has a
    // non-empty alt (see getElementRoleKey's img[alt]/img split above).
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
    // Verified against a widely-used reference engine's own allowedRoles table for
    // 'nav' (2026-07-20, found via a real site — Vimeo's global nav
    // uses <nav role="menu">/<nav aria-label="Menu" role="menu"> for
    // its dropdown panels): the old entry only had presentation/none.
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
    // Verified against a widely-used reference engine (2026-07-20): every other role
    // tried (presentation/none/img/document/group/figure/region/banner/
    // button/link/main/article/tab/list/table) is disallowed on <video>.
    video: ['application'],
    // Verified against a widely-used reference engine (2026-07-20): same probe as
    // <video>, but img/document are also permitted (an <object> can
    // stand in for an image or a full document, unlike <video>).
    object: ['application', 'img', 'document'],
    // Verified against a widely-used reference engine and the W3C ARIA-in-HTML spec
    // (2026-07-20 — see getElementRoleKey's section[named]/section
    // split above): 'region' is only permitted when the section has an
    // accessible name (it's <section>'s own conditional native role in
    // that case); every other role here is permitted regardless of
    // naming.
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
    // role="button" is only permitted when paired with aria-pressed
    // (verified against a widely-used reference engine and the W3C ARIA-in-HTML spec,
    // 2026-07-20 — see getElementRoleKey's checkbox[aria-pressed] split
    // above).
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
    // is permitted per ARIA-in-HTML, but restating the native listbox
    // role itself is always allowed via isRoleAllowedOnElement's
    // native-role fallback, same as every other element in this table.
    'select[multiple]': [],
    // Verified against a widely-used reference engine and the W3C ARIA-in-HTML spec
    // (2026-07-20 — found via a real page: Wikipedia's sidebar uses
    // <table role="navigation">, which surea11y was incorrectly
    // failing): <table> permits any role. <td>/<th>/<tr> are spec'd as
    // context-dependent (restricted only when the ancestor <table> is
    // itself exposed with role=table/grid/treegrid) — a widely-used reference engine's own
    // table doesn't implement that conditional either (always
    // unconstrained for these three), so this follows the same
    // deliberate simplification rather than guessing at ancestor-role
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
    // content/<main> has no implicit role to restate (matches that engine's
    // own implicit-role function returning null in that case).
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
        // An explicitly-empty value is treated as valid (added
        // 2026-08-03), not "expected-single-idref" — matches every
        // idref/idref-list ARIA attribute in a widely-used reference
        // engine's own standards table, which universally sets
        // `allowEmpty: true` for this value type (verified: every
        // aria-activedescendant/aria-controls/aria-describedby/
        // aria-details/aria-errormessage/aria-flowto/aria-labelledby/
        // aria-owns entry has it, with zero exceptions found across the
        // whole file). An empty idref value is a common, deliberate
        // pattern in templated markup (e.g. React conditionally
        // rendering `aria-describedby={hasError ? errorId : ''}`) —
        // treating it as an error was a false positive. Confirmed live:
        // chase.com's login form ships `aria-describedby=""` on its
        // username/password inputs unconditionally.
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
        // partially-dangling list (some ids exist, some don't) is
        // left unflagged. Verified 2026-07-21 directly against
        // a widely-used reference engine's own validateAttrValue (its
        // 'idrefs' case): that engine's real check is
        // `idrefs(vNode, attr).some(node => !!node)` — i.e. it
        // itself only treats an idref-list as invalid when EVERY
        // token fails to resolve, identical to this behavior. Not a
        // conservative guess; confirmed to match the reference
        // implementation exactly, not just "left as-is."
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
      // <area> without href has its own permitted-roles entry (verified
      // against ARIA-in-HTML — see ALLOWED_ROLES_BY_ELEMENT above);
      // hrefless <a> is left unconstrained pending the same
      // verification (WHATWG/HTML-AAM sources disagree on how
      // restrictive it is, so it's not asserted here).
      return tag === 'area' ? 'area' : '';
    }

    if (tag === 'section') {
      // <section>'s own implicit role is conditional: "region" when it
      // has an accessible name, "generic" when it doesn't (W3C
      // ARIA-in-HTML). role="region" restated is only a no-op
      // restatement of the native role — and therefore permitted —
      // when a name is actually present; on an unnamed <section> it's
      // a real violation (verified 2026-07-20 against a widely-used
      // reference engine's roleIsAllowed, which checks
      // explicit-role-equals-implicit-role before its allowedRoles
      // array — <section>'s array itself doesn't include 'region' at
      // all — and directly via that engine's own runtime). Found via a real page: ESPN's unnamed
      // <section role="region" id="global-scoreboard">.
      return hasAccessibleNameHint(el) ? 'section[named]' : 'section';
    }

    if (tag === 'header') {
      // <header>'s own implicit role is conditional: "banner" when
      // top-level (not nested inside sectioning content/<main>),
      // generic/null when nested — see hasLandmarkScopingAncestor
      // above (includeMain: true, matching <header>'s real exclusion
      // list, which does include <main>).
      // role="banner" restated is only a no-op restatement of the
      // native role (and therefore permitted) at the top level; a
      // widely-used reference engine's own allowedRoles array for
      // <header> doesn't include 'banner'
      // at all (reached only via the native-role-match branch), same
      // shape as <section>'s 'region'.
      return hasLandmarkScopingAncestor(el, { includeMain: true }) ? 'header' : 'header[toplevel]';
    }

    if (tag === 'label') {
      // A <label> permits no explicit role at all when associated with
      // a labelable form control (via `for` or wrapping); otherwise
      // any role is permitted (verified against the W3C ARIA-in-HTML
      // spec and a widely-used reference engine's own table, 2026-07-20 — found via a real
      // page: basecamp.com's nav toggle uses
      // <label for="..." role="button">, which that reference engine correctly flags).
      // Uses the native `.control` API (resolves both `for` and
      // wrapping association) instead of reimplementing that lookup.
      let associated = false;
      try {
        associated = !!el.control;
      } catch {}
      return associated ? 'label[associated]' : '';
    }

    if (tag === 'img') {
      // Permitted roles depend on whether the img has a non-empty alt
      // (verified against ARIA-in-HTML — see ALLOWED_ROLES_BY_ELEMENT
      // above): with alt text it may take a small set of widget roles;
      // without it, only presentation/none (plus its own native img
      // role, always allowed via the native-role fallback below).
      const alt = getAttr(el, 'alt');
      return alt != null && trim(alt) !== '' ? 'img[alt]' : 'img';
    }

    if (tag === 'input') {
      const type = lower(getAttr(el, 'type') || 'text');
      if (type === 'checkbox') {
        // role="button" is only permitted on a checkbox when paired
        // with aria-pressed (verified 2026-07-20 against a widely-used
        // reference engine and the W3C ARIA-in-HTML spec — found via a real
        // page: Wikipedia's dropdown toggles use
        // <input type="checkbox" role="button" aria-haspopup="true">
        // with no aria-pressed, which is not a permitted
        // combination — this is a real markup issue on their side,
        // not a genuine engine disagreement).
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
  // non-standard "columngroup") is ignored by real browsers/AT (they fall
  // back to the implicit role, same as any other unrecognized enumerated
  // attribute value) — a widely-used reference engine's own explicit-role
  // resolution validates the same way. Without this, a bogus role token
  // wrongly "blocks" the ancestor/descendant containment-role search
  // instead of being transparent to it. Found on tabulator.info's
  // column-grouping example: role="columnheader" cells sit inside a
  // role="columngroup" wrapper div (not a real ARIA role) that itself
  // sits inside the actual role="row" ancestor — the reference engine
  // correctly skips the fake role and finds "row"; this helper previously
  // stopped at "columngroup" and reported a false required-context
  // failure.
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
