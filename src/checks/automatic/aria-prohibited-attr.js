'use strict';

/**
 * @check aria-prohibited-attr
 * @atomic true
 * @summary Certain ARIA naming attributes are explicitly prohibited on specific roles
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to (a) elements whose explicit, valid role is one of the small
 *   set of WAI-ARIA 1.2 roles with a documented "Prohibited ARIA States and
 *   Properties" list (pure text-semantics / non-naming structural roles:
 *   caption, code, deletion, emphasis, generic, insertion, mark, none,
 *   paragraph, presentation, strong, subscript, suggestion, superscript,
 *   time), and (b) a small, curated set of native HTML tags verified to
 *   carry no explicit or implicit ARIA role at all (see ROLELESS_NATIVE_TAGS
 *   below) — in both cases, only elements that also carry aria-label or
 *   aria-labelledby.
 * @expectation
 *   Prohibited attributes must not be present on (a); for (b), the naming
 *   attribute is at best unreliable (nothing accessible-name-aware to hang
 *   it off) and at worst silently ignored by assistive technology — see the
 *   roleless-branch implementation note below for the confidence split
 *   this produces.
 * @implementation-notes
 * - Deliberately scoped to the single, well-established prohibition class
 *   (naming attributes on pure text-semantics roles) rather than
 *   attempting an exhaustive per-role prohibited-attribute table; see
 *   src/core/aria-helpers.js file header for this engine's confidence-
 *   scoping rationale.
 * - Role list widened 2026-07-19 (Tier 4) from 10 to 13 roles, adding
 *   `mark`, `suggestion`, and `time` — the other ARIA 1.2 "HTML-alignment"
 *   text-level roles that share the same documented prohibition as the
 *   original 10. Still deliberately not claiming full parity with a widely-used
 *   reference engine:
 *   only roles/attrs this engine has high confidence in from the spec
 *   text are included, per the file's own "wrong entries cause false-
 *   positive fails" caution.
 * - Widened again 2026-07-21 to add `presentation`/`none`, verified
 *   directly against a widely-used reference engine's own role data table
 *   (both have `prohibitedAttrs: ['aria-label', 'aria-labelledby']`), and
 *   corroborated by the W3C
 *   WAI-ARIA 1.2 spec's own §5.2.8.6 "Roles which cannot be named"
 *   listing `presentation` explicitly (`none` is `presentation`'s
 *   documented 1.2-introduced alias, identical semantics). The
 *   pre-existing `presentation-role-conflict` rule already treats
 *   aria-label/aria-labelledby as conflicting on these two roles, but at
 *   `manual`/cantTell confidence across a ~24-attribute general list —
 *   this addition lets the specific, unambiguous naming-prohibition case
 *   also fire as a hard, WCAG-normative `fail` via this rule, matching
 *   this engine's "one rule = one normative decision" pattern rather than
 *   only ever surfacing it as advisory.
 * - Investigated, but deliberately did NOT add, `definition`/`term`
 *   despite both appearing on MDN's aria-label reference page's
 *   "not supported" list: that MDN list is demonstrably wrong for these
 *   two — a widely-used reference engine's own role data explicitly declares
 *   `nameFrom: ['author']` (`definition`) / `nameFrom: ['author',
 *   'contents']` (`term`), and the W3C spec's own §5.2.8.4 "Roles
 *   Supporting Name From Author" index lists both by name; MDN's
 *   `definition_role` page even demonstrates `aria-labelledby` usage on
 *   it directly. A real, confirmed documentation bug on MDN's side, not
 *   a gap here.
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 * - Widened 2026-07-31 to add a second, independent branch covering
 *   naming attributes on ROLELESS elements (no explicit role="", no
 *   implicit/native role either) — found on the emoji-mart demo page
 *   (missive.github.io/emoji-mart): hundreds of
 *   `<span aria-label="party_parrot" class="emoji-mart-emoji...">` tiles,
 *   plain roleless spans with no other accessible-name source, which this
 *   rule previously ignored entirely, since its own Tier-1 branch only ever
 *   looked at the EXPLICIT role="" attribute, never at "no role at all."
 *   Empirically determined (not guessed) which native tags genuinely carry
 *   no role at all, by resolving each candidate tag's role against a live
 *   Chromium page — several surprises: common text-level tags like `<p>`,
 *   `<strong>`, `<em>`, `<code>`, `<mark>`, `<time>` have no implicit role
 *   at all (their prohibited-attrs entries only ever matter for an
 *   EXPLICIT `role="paragraph"`/`role="strong"`/etc. restatement, a rare
 *   case — the native tag itself resolves to role `null`, same as a bare
 *   `<div>`/`<span>`, and falls into this same roleless branch). See
 *   ROLELESS_NATIVE_TAGS below for the resulting curated list —
 *   deliberately conservative: `<section>`/`<form>`/`<a>` are excluded
 *   even though they can also resolve to no role, because their native
 *   role is conditional (name-dependent/href-dependent) and already has
 *   dedicated, more nuanced handling elsewhere in this engine
 *   (`getElementRoleKey`'s `section`/`section[named]`/`header`/
 *   `header[toplevel]` branches) that this rule doesn't attempt to
 *   duplicate.
 *   Two confidence tiers instead of a flat fail: if the element's subtree
 *   ALREADY produces a non-empty accessible name from its content
 *   (computed the same way link-name-present/button-name-present do, via
 *   `helpers.getContentNameInfo`), the naming attribute might just be a
 *   redundant/intentional override — reported as `cantTell`, not a hard
 *   fail. Only a roleless element with NO other accessible-name source at
 *   all (the emoji-mart case: an icon-only span, background-image styled,
 *   no text anywhere in its subtree) is a confident, deterministic `fail`
 *   — nothing else could ever expose this element's name, and no role
 *   exists to make it a Name/Role/Value candidate in the first place.
 *   The widget-ancestor exemption (skip when the closest real ancestor role
 *   is a "widget"-type role) avoids over-flagging roleless helper
 *   spans/divs used as internal decoration inside a custom composite
 *   widget.
 * - Fixed 2026-07-31 (same day as introduced): the Tier-2 "already has a
 *   role, not this branch's concern" guard checked only whether `role=""`
 *   was present (`getExplicitRole`), not whether the value was a real,
 *   recognized ARIA role. An invalid/typo'd role token (e.g.
 *   `role="totally-bogus"`) therefore silently suppressed detection of an
 *   otherwise-flaggable roleless naming attribute — identical markup with
 *   the bogus role attribute removed entirely correctly failed, but with
 *   it present the element was skipped as if it had a real role. Per spec
 *   (and per this same file's own `getNearestAncestorRole` helper a few
 *   lines below, which already gets this right), an unrecognized role
 *   token is ignored by the accessibility tree, not honored — the element
 *   is still effectively roleless. Now validates via the existing
 *   `isValidConcreteRole` before treating an explicit role as real,
 *   matching `getNearestAncestorRole`'s own pattern.
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
  const { document, helpers, rule } = ctx;

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

  const namingSelector = '[aria-label],[aria-labelledby]';
  const namingNodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(namingSelector)
    : helpers.queryAll(namingSelector);

  for (const el of namingNodes) {
    if (!el || !el.getAttribute) continue;

    const tag = String(el.tagName || '').toLowerCase();
    if (!ROLELESS_NATIVE_TAGS.has(tag)) continue;
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
