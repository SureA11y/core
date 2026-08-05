'use strict';

/**
 * @check aria-prohibited-attr
 * @atomic true
 * @summary Certain ARIA naming attributes are explicitly prohibited on specific roles
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to (a) elements whose explicit, valid role is one of the ARIA
 *   1.2 roles with a documented "Prohibited ARIA States and Properties"
 *   list for naming attributes (pure text-semantics / non-naming
 *   structural roles: caption, code, deletion, emphasis, generic,
 *   insertion, mark, none, paragraph, presentation, strong, subscript,
 *   suggestion, superscript, time), and (b) elements with no role at all —
 *   a curated set of native HTML tags verified to carry no implicit role
 *   (see ROLELESS_NATIVE_TAGS below), or any autonomous custom element (a
 *   hyphenated, author-defined tag per the Custom Elements spec; see
 *   isRolelessCustomElementTag below) — in both cases, only elements that
 *   also carry aria-label or aria-labelledby.
 * @expectation
 *   Prohibited attributes must not be present on (a); for (b), the naming
 *   attribute is at best unreliable (nothing accessible-name-aware to hang
 *   it off) and at worst silently ignored by assistive technology — see the
 *   roleless-branch implementation note below for the confidence split
 *   this produces.
 * @implementation-notes
 * - Deliberately scoped to the single, well-established prohibition class
 *   (naming attributes on pure text-semantics roles) rather than an
 *   exhaustive per-role prohibited-attribute table; see
 *   src/core/aria-helpers.js file header for this engine's confidence-
 *   scoping rationale. The 14-role list is verified directly against a
 *   widely-used reference engine's own role data table and the W3C
 *   WAI-ARIA 1.2 spec's §5.2.8.6 "Roles which cannot be named"; only
 *   roles/attrs with high confidence from the spec text are included,
 *   since a wrong entry here causes a false-positive fail.
 * - The pre-existing presentation-role-conflict rule already treats
 *   aria-label/aria-labelledby as conflicting on presentation/none, but at
 *   manual/cantTell confidence across a broad attribute list; this rule's
 *   narrower, unambiguous naming-prohibition case fires as a hard,
 *   WCAG-normative fail instead, matching this engine's "one rule = one
 *   normative decision" pattern.
 * - Investigated, but deliberately did NOT add, `definition`/`term`
 *   despite both appearing on MDN's aria-label reference page's "not
 *   supported" list: that MDN list is wrong for these two — the reference
 *   engine's own role data explicitly declares `nameFrom: ['author']`
 *   (`definition`) / `nameFrom: ['author', 'contents']` (`term`), and the
 *   W3C spec's own §5.2.8.4 "Roles Supporting Name From Author" index
 *   lists both by name. A confirmed MDN documentation bug, not a gap here.
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 * - Second, independent branch: naming attributes on ROLELESS elements (no
 *   explicit role="", no implicit/native role either) — e.g. icon-only
 *   `<span aria-label="...">` tiles with no other accessible-name source.
 *   ROLELESS_NATIVE_TAGS below is a curated, deliberately conservative
 *   list of native tags confirmed to carry no implicit role (common
 *   text-level tags like `<p>`/`<strong>`/`<em>`/`<code>`/`<mark>`/`<time>`
 *   resolve to role `null`, same as a bare `<div>`/`<span>`);
 *   `<section>`/`<form>`/`<a>` are excluded even though they can also
 *   resolve to no role, because their native role is conditional
 *   (name-dependent/href-dependent) and already has dedicated handling in
 *   `getElementRoleKey`'s `section`/`section[named]`/`header`/
 *   `header[toplevel]` branches that this rule doesn't duplicate.
 *   Two confidence tiers instead of a flat fail: if the element's subtree
 *   already produces a non-empty accessible name from its content (via
 *   `helpers.getContentNameInfo`, same as
 *   link-name-present/button-name-present), the naming attribute might
 *   just be a redundant/intentional override — reported as `cantTell`, not
 *   a hard fail. Only a roleless element with no other accessible-name
 *   source at all is a confident, deterministic `fail`. The
 *   widget-ancestor exemption (skip when the closest real ancestor role is
 *   a "widget"-type role) avoids over-flagging roleless helper spans/divs
 *   used as internal decoration inside a custom composite widget.
 * - The Tier-2 "already has a role, not this branch's concern" guard
 *   validates the explicit role via `isValidConcreteRole` before treating
 *   it as real (matching `getNearestAncestorRole`'s own pattern): an
 *   unrecognized role token (e.g. `role="totally-bogus"`) is ignored by
 *   the accessibility tree, not honored, so the element is still
 *   effectively roleless and must still be checked by this branch.
 */

const id = 'aria-prohibited-attr';

const meta = {
  title: 'ARIA naming attributes must not be used on roles that prohibit them',
  description:
    'Checks that aria-label/aria-labelledby are not present on WAI-ARIA roles whose specification explicitly prohibits ARIA naming (e.g. generic, emphasis, strong, paragraph).',
  i18n: {
    titleKey: 'ariaProhibitedAttr_title',
    descriptionKey: 'ariaProhibitedAttr_description'
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
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-not-prohibited'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // Roles whose WAI-ARIA 1.2 definition lists a "Prohibited ARIA States and
  // Properties" entry for naming attributes (these roles must never carry an
  // accessible name). Declared inside runInPage (rather than at module
  // scope) because the build inlines only this function's own source text
  // — see scripts/build-core.js header ("runInPage MUST be self-contained").
  const ROLES_PROHIBITING_NAME = new Set([
    'caption',
    'code',
    'deletion',
    'emphasis',
    'generic',
    'insertion',
    'mark',
    'none',
    'paragraph',
    'presentation',
    'strong',
    'subscript',
    'suggestion',
    'superscript',
    'time'
  ]);

  const PROHIBITED_NAMING_ATTRS = ['aria-label', 'aria-labelledby'];

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  // --- Tier 1: explicit, valid role from the naming-prohibited set ---

  const roleNodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  for (const el of roleNodes) {
    if (!el || !el.getAttribute) continue;

    const role = ariaHelpers.getExplicitRole(el);
    if (!role || !ROLES_PROHIBITING_NAME.has(role)) continue;

    applicableCount += 1;

    const present = [];
    for (const attr of PROHIBITED_NAMING_ATTRS) {
      const v = el.getAttribute(attr);
      if (v != null && String(v).trim() !== '') present.push(attr);
    }

    if (!present.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    for (const attr of present) {
      failOccurrences.push({
        selector: stableSelector,
        html,
        occurrenceOutcome: 'fail',
        summary: 'This attribute is prohibited on this element’s role.',
        hint: 'Remove this attribute; this role must not carry an accessible name.',
        i18n: {
          summaryKey: 'ariaProhibitedAttr_summary_fail',
          hintKey: 'ariaProhibitedAttr_hint_fail',
          params: { attr, role }
        },
        data: {
          details: { reasonCode: 'ARIA_ATTR_PROHIBITED', attr, role }
        }
      });
    }
  }

  // --- Tier 2: no role at all (see header comment for the full rationale
  // and how ROLELESS_NATIVE_TAGS/WIDGET_TYPE_ROLES were derived) ---

  // Small, curated set of native tags empirically verified (against a
  // widely-used reference engine's own getRole() at runtime, not guessed)
  // to carry no explicit or implicit ARIA role. Deliberately excludes
  // <section>/<form>/<a> — all conditionally roleless too, but already
  // handled with more nuance elsewhere in this engine (see header comment).
  const ROLELESS_NATIVE_TAGS = new Set([
    'p',
    'b',
    'i',
    'em',
    'strong',
    'span',
    'div',
    'code',
    'mark',
    'time',
    'ins',
    'del',
    'small',
    'sub',
    'sup',
    'abbr',
    'cite',
    'q',
    'kbd',
    'samp',
    'var',
    'address',
    'blockquote',
    'pre',
    'figcaption',
    'picture',
    'template',
    'hgroup',
    'wbr',
    'br',
    'legend'
  ]);

  // WAI-ARIA roles a widely-used reference engine's own role table types as
  // "widget" (verified directly against its source, not the six-category
  // WAI-ARIA taxonomy — this engine's algorithm branches on its own `type`
  // field, so parity means matching that field exactly).
  const WIDGET_TYPE_ROLES = new Set([
    'alert',
    'alertdialog',
    'button',
    'checkbox',
    'combobox',
    'dialog',
    'gridcell',
    'link',
    'listbox',
    'log',
    'marquee',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'progressbar',
    'radio',
    'scrollbar',
    'searchbox',
    'slider',
    'spinbutton',
    'status',
    'switch',
    'tab',
    'tabpanel',
    'textbox',
    'timer',
    'treeitem'
  ]);

  const getComposedParent =
    helpers && typeof helpers.composedParent === 'function'
      ? helpers.composedParent
      : function (n) {
          return n && n.parentElement ? n.parentElement : null;
        };

  // Nearest ancestor's real role (explicit-if-valid, else native/implicit),
  // skipping roleless/presentation/none ancestors — used only to check
  // whether that role is a "widget"-type one (the roleless-branch
  // exemption). Not the same helper as aria-required-parent's containment
  // walk: this one also accepts non-required-context roles.
  function getNearestAncestorRole(el) {
    let cur = getComposedParent(el);
    let guard = 0;
    while (cur && guard++ < 200) {
      if (cur.nodeType !== 1) {
        cur = getComposedParent(cur);
        continue;
      }
      const explicit = ariaHelpers.getExplicitRole(cur);
      const role =
        explicit && ariaHelpers.isValidConcreteRole(explicit)
          ? explicit
          : ariaHelpers.getNativeRoleForElement(cur);
      if (!role || role === 'presentation' || role === 'none') {
        cur = getComposedParent(cur);
        continue;
      }
      return role;
    }
    return '';
  }

  // A small, spec-reserved set of hyphenated tag names that are NOT
  // autonomous custom elements despite containing a hyphen (legacy SVG/
  // MathML tags predating the Custom Elements spec) — see
  // https://html.spec.whatwg.org/#valid-custom-element-name's own
  // exclusion list. Excluded so this doesn't misclassify them as
  // always-roleless the same way a real custom element is.
  const RESERVED_HYPHENATED_TAGS = new Set([
    'annotation-xml',
    'color-profile',
    'font-face',
    'font-face-src',
    'font-face-uri',
    'font-face-format',
    'font-face-name',
    'missing-glyph'
  ]);

  // An autonomous custom element (author-defined tag, always containing a
  // hyphen per the Custom Elements spec's naming grammar) has no implicit
  // ARIA role at all -- unlike native tags, there is no conditional-role
  // nuance to worry about here (a native <a>/<section>/<form> can gain an
  // implicit role depending on other attributes, which is exactly why
  // ROLELESS_NATIVE_TAGS is a hand-verified allowlist rather than a
  // blanket rule; a custom element has no such spec-defined conditional
  // role logic whatsoever). Added 2026-08-03 after finding real custom
  // elements carrying aria-label with no other name source were silently
  // skipped by this branch entirely, since it only ever checked the fixed
  // native-tag allowlist below -- e.g. rottentomatoes.com's
  // `<play-button aria-label="Play ...">` (106 occurrences on one page)
  // and Angular Material's `<app-carousel aria-label="...">`.
  function isRolelessCustomElementTag(tag) {
    return tag.includes('-') && !RESERVED_HYPHENATED_TAGS.has(tag);
  }

  const namingSelector = '[aria-label],[aria-labelledby]';
  const namingNodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(namingSelector)
    : helpers.queryAll(namingSelector);

  for (const el of namingNodes) {
    if (!el || !el.getAttribute) continue;

    const tag = String(el.tagName || '').toLowerCase();
    if (!ROLELESS_NATIVE_TAGS.has(tag) && !isRolelessCustomElementTag(tag)) continue;
    const explicitRole = ariaHelpers.getExplicitRole(el);
    if (explicitRole && ariaHelpers.isValidConcreteRole(explicitRole)) continue; // has a real, recognized role — Tier 1's concern (if in ROLES_PROHIBITING_NAME) or a role this rule has no opinion on. An INVALID role token (e.g. a typo) is ignored per spec, same as no role attribute at all, and must still fall through to this branch.
    if (ariaHelpers.getNativeRoleForElement(el)) continue; // has a real implicit role after all — not this branch's concern

    const present = [];
    for (const attr of PROHIBITED_NAMING_ATTRS) {
      const v = el.getAttribute(attr);
      if (v != null && String(v).trim() !== '') present.push(attr);
    }
    if (!present.length) continue;

    applicableCount += 1;

    const ancestorRole = getNearestAncestorRole(el);
    if (ancestorRole && WIDGET_TYPE_ROLES.has(ancestorRole)) continue; // roleless helper node inside a real widget — not flagged

    const nameInfo = helpers.getContentNameInfo ? helpers.getContentNameInfo(el, ctx) : null;
    const hasContentFallback = !!(
      nameInfo &&
      nameInfo.present &&
      String(nameInfo.value || '').trim() !== ''
    );

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    for (const attr of present) {
      if (hasContentFallback) {
        cantTellOccurrences.push({
          selector: stableSelector,
          html,
          occurrenceOutcome: 'cantTell',
          summary: `This ${tag} has no role, so ${attr} may not be exposed as its accessible name by assistive technology — but the element's own content already provides one.`,
          hint: 'Verify whether the existing text content already serves as this element’s label; if so the naming attribute is redundant, otherwise give the element a role that supports naming (e.g. role="img").',
          i18n: {
            summaryKey: 'ariaProhibitedAttr_summary_cantTell_roleless',
            hintKey: 'ariaProhibitedAttr_hint_cantTell_roleless',
            params: { attr, element: tag }
          },
          data: {
            details: {
              reasonCode: 'ARIA_ATTR_PROHIBITED_ROLELESS_NEEDS_REVIEW',
              attr,
              role: null,
              element: tag
            }
          }
        });
      } else {
        failOccurrences.push({
          selector: stableSelector,
          html,
          occurrenceOutcome: 'fail',
          summary: `This ${tag} has no role and no other accessible-name source, so ${attr} is not reliably exposed to assistive technology.`,
          hint: 'Give this element a role that supports an accessible name (e.g. role="img"/"button"), or remove this attribute if it serves no purpose without one.',
          i18n: {
            summaryKey: 'ariaProhibitedAttr_summary_fail_roleless',
            hintKey: 'ariaProhibitedAttr_hint_fail_roleless',
            params: { attr, element: tag }
          },
          data: {
            details: { reasonCode: 'ARIA_ATTR_PROHIBITED_ROLELESS', attr, role: null, element: tag }
          }
        });
      }
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // See helpers.resolveTieredOutcome's own header comment (src/core/dom-helpers.js):
  // a fail-tier finding never silently discards cantTell-tier findings from
  // the same run — both are returned together when the outcome is 'fail'.
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
