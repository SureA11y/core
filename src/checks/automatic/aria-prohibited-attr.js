/* SPDX-License-Identifier: MPL-2.0 */

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
 *   suggestion, superscript, time), plus a native <caption> with no valid
 *   explicit role, whose implicit role is caption, and (b) elements with no
 *   role at all:
 *   native HTML tags verified to carry no implicit role (such as <div>,
 *   <span>, <p>, <strong>, <em>, <code> and <time>), or any autonomous
 *   custom element (a hyphenated, author-defined tag per the Custom
 *   Elements spec). In both cases, only elements that
 *   also carry aria-label or aria-labelledby.
 *   A custom element whose ElementInternals give it a role
 *   (this.attachInternals().role) is judged by that role, its default role:
 *   one of the roles above puts it in (a), any other keeps it out of (b).
 * @expectation
 *   Prohibited attributes must not be present on (a); for (b), the naming
 *   attribute is at best unreliable (nothing accessible-name-aware to hang
 *   it off) and at worst silently ignored by assistive technology. A
 *   roleless element whose own content already gives it a name is
 *   reported as CANTTELL, since the attribute may be a deliberate override;
 *   one with no other source for a name FAILs.
 * @reports
 *   - `attr`: the naming attribute found, `aria-label` or
 *     `aria-labelledby`.
 *   - `role`: the role that prohibits it; `null` on an element with no role.
 * @reason-codes
 *   - `ARIA_ATTR_PROHIBITED` (fail): aria-label or aria-labelledby on an
 *     element whose role cannot be named, such as paragraph, generic or
 *     presentation.
 *     Basis: WCAG 4.1.2; ACT kb1m8s; WAI-ARIA 1.2 prohibited states and
 *     properties (MUST).
 *   - `ARIA_ATTR_PROHIBITED_ROLELESS` (fail): a naming attribute on an element
 *     with no role and no other source for a name, or a role description on an
 *     element with no role.
 *     Basis: WCAG 4.1.2; ACT kb1m8s; WAI-ARIA 1.2 generic (MUST); HTML-AAM.
 *   - `ARIA_ATTR_PROHIBITED_ROLELESS_NEEDS_REVIEW` (cantTell): a naming
 *     attribute on an element with no role whose own text gives it a name, so
 *     the attribute may be a deliberate override.
 *     It leans pass when the label's words already appear, in order, in the
 *     element's text, and fail when the label has words the text lacks.
 *     Basis: WCAG 4.1.2 (not settled); ACT kb1m8s; WAI-ARIA 1.2 generic.
 * @implementation-notes
 * - Scoped to the single, well-established prohibition class
 *   (naming attributes on pure text-semantics roles) rather than an
 *   exhaustive per-role prohibited-attribute table; see
 *   src/core/aria-helpers.js file header for this engine's confidence-
 *   scoping rationale. The 14-role list comes from the W3C WAI-ARIA 1.2
 *   spec's §5.2.8.6 "Roles which cannot be named"; only roles/attrs with
 *   high confidence from the spec text are included, since a wrong entry
 *   here causes a false-positive fail.
 * - The pre-existing presentation-role-conflict rule already treats
 *   aria-label/aria-labelledby as conflicting on presentation/none, but at
 *   manual/cantTell confidence across a broad attribute list; this rule's
 *   narrower, unambiguous naming-prohibition case fires as a hard,
 *   WCAG-normative fail instead, matching this engine's "one rule = one
 *   normative decision" pattern.
 * - Excludes `definition`/`term` on purpose, despite both appearing on
 *   MDN's aria-label "not supported" list: both support name from author
 *   (`nameFrom: ['author']` for definition, `['author', 'contents']` for
 *   term), and the W3C spec's §5.2.8.4 "Roles Supporting Name From Author"
 *   index lists both by name.
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 * - Second, independent branch: naming attributes on ROLELESS elements (no
 *   explicit role="", no implicit/native role either), e.g. icon-only
 *   `<span aria-label="...">` tiles with no other accessible-name source.
 *   ROLELESS_NATIVE_TAGS below is a curated, intentionally conservative
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
 *   just be a redundant/intentional override, so it's reported as `cantTell`, not
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
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-not-prohibited'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    ARIA_ATTR_PROHIBITED_ROLELESS_NEEDS_REVIEW: {
      steps: [
        'Inspect the element the report names and note its aria-label or aria-labelledby text and its visible text.',
        'Compare the two: check whether the label says anything the visible text does not.',
        'With a screen reader, read the element in browse mode and note whether the label is announced or ignored.'
      ],
      passWhen:
        'The visible text already says everything the label says, so nothing is lost if the label is ignored.',
      failWhen:
        'The label carries information missing from the text (such as "Price in euros" on "12"), which is lost because naming is not supported on an element with no role (WCAG 4.1.2, ACT kb1m8s).'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // Roles whose WAI-ARIA 1.2 definition lists a "Prohibited ARIA States and
  // Properties" entry for naming attributes (these roles must never carry an
  // accessible name). Declared inside runInPage (rather than at module
  // scope) because the build inlines only this function's own source text.
  // See scripts/build-core.js header ("runInPage MUST be self-contained").
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

  // WAI-ARIA 1.3 prohibits aria-braillelabel wherever it prohibits a name,
  // since a braille label only stands in for one, and on generic also
  // prohibits a role description, braille or not: there is no role for it to
  // describe. ACT kb1m8s tests all five.
  const PROHIBITED_NAMING_ATTRS = ['aria-label', 'aria-labelledby', 'aria-braillelabel'];
  const PROHIBITED_ROLE_DESCRIPTION_ATTRS = ['aria-roledescription', 'aria-brailleroledescription'];
  function prohibitedAttrsFor(role) {
    return role === 'generic' || role === null
      ? PROHIBITED_NAMING_ATTRS.concat(PROHIBITED_ROLE_DESCRIPTION_ATTRS)
      : PROHIBITED_NAMING_ATTRS;
  }

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  // --- Tier 1: explicit, valid role from the naming-prohibited set ---

  // A native <caption> has the caption role without saying so, and is judged
  // the same way as role="caption"; only one that carries a naming attribute
  // needs visiting.
  const tier1Selector =
    '[role], caption[aria-label], caption[aria-labelledby], caption[aria-braillelabel]';
  // A custom element's internals may give it one of these roles too.
  const roleNodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(tier1Selector, { internalsRoles: true })
    : helpers.queryAll(tier1Selector);

  for (const el of roleNodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const explicitRole = ariaHelpers.getAuthorRole(el);
    let role = explicitRole;
    if (
      (!explicitRole || !ariaHelpers.isValidConcreteRole(explicitRole)) &&
      String(dom.localName(el) || '').toLowerCase() === 'caption'
    ) {
      role = 'caption';
    }
    if (!role || !ROLES_PROHIBITING_NAME.has(role)) continue;

    applicableCount += 1;

    const present = [];
    for (const attr of prohibitedAttrsFor(role)) {
      const v = dom.getAttribute(el, attr);
      if (v != null && String(v).trim() !== '') present.push(attr);
    }

    if (!present.length) continue;

    for (const attr of present) {
      failOccurrences.push(
        helpers.reportOccurrence(el, {
          occurrenceOutcome: 'fail',
          summary: 'This attribute is prohibited on this element’s role.',
          hint: "Remove this attribute. Elements with this role can't be named, so assistive technology may ignore it.",
          i18n: {
            summaryKey: 'ariaProhibitedAttr_summary_fail',
            hintKey: 'ariaProhibitedAttr_hint_fail',
            params: { attr, role }
          },
          data: {
            details: { reasonCode: 'ARIA_ATTR_PROHIBITED', attr, role }
          }
        })
      );
    }
  }

  // --- Tier 2: no role at all (see header comment for the full rationale
  // and how ROLELESS_NATIVE_TAGS/WIDGET_TYPE_ROLES were derived) ---

  // Small, curated set of native tags verified to carry no explicit or
  // implicit ARIA role. Excludes <section>/<form>/<a>, which are
  // conditionally roleless too, but already handled with more nuance
  // elsewhere in this engine (see header comment).
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

  // WAI-ARIA roles typed as "widget" (the role set the roleless-branch
  // exemption below branches on, not the six-category WAI-ARIA taxonomy).
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
          return n && dom.parentElement(n) ? dom.parentElement(n) : null;
        };

  // Nearest ancestor's real role (explicit-if-valid, else native/implicit),
  // skipping roleless/presentation/none ancestors. Used only to check
  // whether that role is a "widget"-type one (the roleless-branch
  // exemption). Not the same helper as aria-required-parent's containment
  // walk: this one also accepts non-required-context roles.
  function getNearestAncestorRole(el) {
    let cur = getComposedParent(el);
    let guard = 0;
    while (cur && guard++ < 200) {
      if (dom.nodeType(cur) !== 1) {
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
  // MathML tags predating the Custom Elements spec). See
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
  // ARIA role of its tag -- only the one its ElementInternals may give it,
  // which getNativeRoleForElement reads -- unlike native tags, there is no conditional-role
  // nuance to worry about here (a native <a>/<section>/<form> can gain an
  // implicit role depending on other attributes, which is exactly why
  // ROLELESS_NATIVE_TAGS is a hand-verified allowlist rather than a
  // blanket rule; a custom element has no such spec-defined conditional
  // role logic whatsoever). Covers e.g. a `<play-button aria-label="...">`
  // or `<app-carousel aria-label="...">` with no other name source, which
  // the fixed native-tag allowlist below would otherwise skip.
  function isRolelessCustomElementTag(tag) {
    return tag.includes('-') && !RESERVED_HYPHENATED_TAGS.has(tag);
  }

  const namingSelector =
    '[aria-label],[aria-labelledby],[aria-braillelabel],[aria-roledescription],[aria-brailleroledescription]';
  const namingNodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(namingSelector)
    : helpers.queryAll(namingSelector);

  for (const el of namingNodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const tag = String(dom.tagName(el) || '').toLowerCase();
    if (!ROLELESS_NATIVE_TAGS.has(tag) && !isRolelessCustomElementTag(tag)) continue;
    const explicitRole = ariaHelpers.getExplicitRole(el);
    if (explicitRole && ariaHelpers.isValidConcreteRole(explicitRole)) continue; // has a real, recognized role: Tier 1's concern (if in ROLES_PROHIBITING_NAME) or a role this rule has no opinion on. An INVALID role token (e.g. a typo) is ignored per spec, same as no role attribute at all, and must still fall through to this branch.
    if (ariaHelpers.getNativeRoleForElement(el)) continue; // has a real implicit role after all, not this branch's concern

    const present = [];
    for (const attr of prohibitedAttrsFor(null)) {
      const v = dom.getAttribute(el, attr);
      if (v != null && String(v).trim() !== '') present.push(attr);
    }
    if (!present.length) continue;

    applicableCount += 1;

    const ancestorRole = getNearestAncestorRole(el);
    if (ancestorRole && WIDGET_TYPE_ROLES.has(ancestorRole)) continue; // roleless helper node inside a real widget, not flagged

    // A hidden="until-found" panel's content is not rendered until it is
    // found, but it is the panel's own text, shown as soon as the page
    // search or a fragment reaches it: it still gives the panel a name.
    const untilFound =
      String(dom.getAttribute(el, 'hidden') || '')
        .trim()
        .toLowerCase() === 'until-found';
    const nameInfo = helpers.getContentNameInfo
      ? helpers.getContentNameInfo(el, ctx, untilFound ? { includeHidden: true } : undefined)
      : null;
    const hasContentFallback = !!(
      nameInfo &&
      nameInfo.present &&
      String(nameInfo.value || '').trim() !== ''
    );

    // Which way a naming attribute's finding points: a label the element's
    // own text already says loses nothing if it is ignored; one with words
    // the text lacks loses them.
    const words = (v) =>
      String(v || '')
        .toLowerCase()
        .match(/[\p{L}\p{N}]+/gu) || [];
    const contentWords = hasContentFallback ? words(nameInfo.value) : [];
    function leanFor(attr) {
      let label = '';
      try {
        if (attr === 'aria-label') label = dom.getAttribute(el, 'aria-label');
        else if (attr === 'aria-labelledby')
          label = helpers.getTextFromIdRefs(dom.getAttribute(el, attr), ctx, {}, el).text;
      } catch {
        label = '';
      }
      const labelWords = words(label);
      if (!labelWords.length || !contentWords.length) return null;
      const inContent = (' ' + contentWords.join(' ') + ' ').includes(
        ' ' + labelWords.join(' ') + ' '
      );
      if (inContent) {
        return {
          toward: 'pass',
          why: 'The element’s own text already says what its label says, so nothing is lost if the label is ignored.',
          signals: [{ signal: 'label-in-content', value: true }],
          caution:
            'ACT kb1m8s fails a naming attribute on an element with no role, whatever its text.',
          i18n: {
            whyKey: 'ariaProhibitedAttr_lean_why_inContent',
            cautionKey: 'ariaProhibitedAttr_lean_caution_inContent'
          }
        };
      }
      const missingWords = labelWords.filter((w) => !contentWords.includes(w)).length;
      if (!missingWords) return null;
      return {
        toward: 'fail',
        why: 'The label says something the element’s text does not, which is lost where a label on an element with no role is ignored.',
        signals: [
          { signal: 'label-in-content', value: false },
          { signal: 'label-words-missing-from-content', value: missingWords }
        ],
        caution:
          'Some browser and screen reader pairs still announce a label on an element with no role.',
        i18n: {
          whyKey: 'ariaProhibitedAttr_lean_why_extraWords',
          cautionKey: 'ariaProhibitedAttr_lean_caution_extraWords'
        }
      };
    }

    for (const attr of present) {
      // A role description has nothing to describe without a role, whatever
      // the element's content: content can stand in for a name, not a role.
      if (PROHIBITED_ROLE_DESCRIPTION_ATTRS.includes(attr)) {
        failOccurrences.push(
          helpers.reportOccurrence(el, {
            occurrenceOutcome: 'fail',
            summary: `This <${tag}> has no role, so its ${attr} describes nothing and assistive technology ignores it.`,
            hint: 'Give the element the role the description refines, or remove the attribute.',
            i18n: {
              summaryKey: 'ariaProhibitedAttr_summary_fail_roleDescription',
              hintKey: 'ariaProhibitedAttr_hint_fail_roleDescription',
              params: { attr, element: tag }
            },
            data: {
              details: {
                reasonCode: 'ARIA_ATTR_PROHIBITED_ROLELESS',
                attr,
                role: null,
                element: tag
              }
            }
          })
        );
      } else if (hasContentFallback) {
        const lean = leanFor(attr);
        cantTellOccurrences.push(
          helpers.reportOccurrence(el, {
            occurrenceOutcome: 'cantTell',
            summary: `This <${tag}> has no role, so assistive technology may not announce its ${attr}; its own text gives it a name anyway.`,
            hint: 'Verify whether the existing text content already serves as this element’s label; if so the naming attribute is redundant, otherwise give the element a role that supports naming (e.g. role="img").',
            i18n: {
              summaryKey: 'ariaProhibitedAttr_summary_cantTell_roleless',
              hintKey: 'ariaProhibitedAttr_hint_cantTell_roleless',
              params: { attr, element: tag }
            },
            uncertainty: {
              code: 'judgement-required',
              needed: 'Whether the element’s own content already serves as its label.',
              evidence: { attribute: attr, element: tag, role: null, hasOwnContent: true }
            },
            ...(lean ? { lean } : {}),
            data: {
              details: {
                reasonCode: 'ARIA_ATTR_PROHIBITED_ROLELESS_NEEDS_REVIEW',
                attr,
                role: null,
                element: tag
              }
            }
          })
        );
      } else {
        failOccurrences.push(
          helpers.reportOccurrence(el, {
            occurrenceOutcome: 'fail',
            summary: `This <${tag}> has no role and no other source of a name, so assistive technology may not announce its ${attr}.`,
            hint: 'Give it a role that can be named, such as role="img" or role="button", or remove the attribute if it does nothing without one.',
            i18n: {
              summaryKey: 'ariaProhibitedAttr_summary_fail_roleless',
              hintKey: 'ariaProhibitedAttr_hint_fail_roleless',
              params: { attr, element: tag }
            },
            data: {
              details: {
                reasonCode: 'ARIA_ATTR_PROHIBITED_ROLELESS',
                attr,
                role: null,
                element: tag
              }
            }
          })
        );
      }
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // See helpers.resolveTieredOutcome's own header comment (src/core/dom-helpers.js):
  // a fail-tier finding never silently discards cantTell-tier findings from
  // the same run. Both are returned together when the outcome is 'fail'.
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
