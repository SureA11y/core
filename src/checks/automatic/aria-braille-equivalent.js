/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-braille-equivalent
 * @atomic true
 * @summary aria-braillelabel/aria-brailleroledescription must not be the only naming mechanism
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Elements with a non-empty `aria-braillelabel` and/or non-empty
 *   `aria-brailleroledescription` attribute.
 * @expectation
 *   Per the ARIA specification, `aria-braillelabel` is a Braille-specific
 *   SUPPLEMENT to (not a replacement for) the element's regular
 *   accessible name, and `aria-brailleroledescription` is a supplement
 *   to `aria-roledescription`. An element must therefore also have:
 *     - a non-empty accessible name from a non-braille mechanism, if it
 *       declares `aria-braillelabel`;
 *     - a non-empty `aria-roledescription`, if it declares
 *       `aria-brailleroledescription`.
 *   Using either braille-specific attribute as the ONLY naming mechanism
 *   leaves non-braille assistive technology (most screen readers, voice
 *   control, etc.) with no accessible name/role description at all.
 *   Reported at CANTTELL rather than FAIL: aria-brailleroledescription
 *   without aria-roledescription reaches no user at all, and a missing
 *   accessible name is the naming rules' decision for the roles that require
 *   one. The braille attribute being unpaired is worth surfacing, but it is
 *   not itself a criterion failing.
 * @reports
 *   - `attr`: the braille attribute that has no equivalent:
 *     `aria-braillelabel` or `aria-brailleroledescription`.
 *   - `requires`: what the element also needs: "an accessible name" for
 *     `aria-braillelabel`, `aria-roledescription` for
 *     `aria-brailleroledescription`.
 * @reason-codes
 *   - `BRAILLE_ATTR_WITHOUT_EQUIVALENT` (cantTell): an element with
 *     aria-braillelabel but no other accessible name, or with
 *     aria-brailleroledescription but no aria-roledescription, so the braille
 *     text supplements nothing.
 *     It leans pass for aria-brailleroledescription, which browsers do not
 *     expose without aria-roledescription, and fail for aria-braillelabel on
 *     a role that requires a name.
 *     Basis: WAI-ARIA 1.3 aria-braillelabel; WAI-ARIA 1.3
 *     aria-brailleroledescription; WCAG 4.1.2 (not settled).
 * @implementation-notes
 * - `aria-braillelabel`/`aria-brailleroledescription` do not participate
 *   in the standard accessible-name computation, so
 *   `helpers.getAccessibleNameInfo` already reflects only the "regular"
 *   (non-braille) name, no special-casing needed there.
 */

const id = 'aria-braille-equivalent';

const meta = {
  title: 'aria-braillelabel/aria-brailleroledescription must have a non-braille equivalent',
  description:
    'Checks that elements using aria-braillelabel also have a regular accessible name, and elements using aria-brailleroledescription also have aria-roledescription.',
  i18n: {
    titleKey: 'ariaBrailleEquivalent_title',
    descriptionKey: 'ariaBrailleEquivalent_description'
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
  coverage: { facetsBySc: { '4.1.2': ['aria-braille-equivalent'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  function getConservativeSubtreeText(container) {
    // "Name from content", recurses into descendants and uses each one's
    // own accessible name (img alt, aria-label/aria-labelledby, title) when
    // it has one, not just literal text nodes. See getContentNameInfo's
    // header comment in src/core/dom-helpers.js for the full rationale
    // (this replaced a text-node-only TreeWalker that missed the common
    // "<a><img alt='...'></a>" logo-link / "<button><img alt='...'></button>"
    // icon-button pattern).
    if (helpers.getContentNameInfo) {
      const info = helpers.getContentNameInfo(container, ctx);
      return info && info.present ? info.value : '';
    }
    const t = container && dom.textContent(container) ? String(dom.textContent(container)) : '';
    return t.replace(/\s+/g, ' ').trim();
  }

  // Roles WAI-ARIA 1.2 marks "Name required" (DPUB and graphics roles
  // left out).
  const NAME_REQUIRED_ROLES = new Set([
    'alertdialog',
    'application',
    'button',
    'checkbox',
    'columnheader',
    'combobox',
    'dialog',
    'grid',
    'heading',
    'img',
    'link',
    'listbox',
    'marquee',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'meter',
    'option',
    'progressbar',
    'radio',
    'radiogroup',
    'region',
    'rowheader',
    'searchbox',
    'slider',
    'spinbutton',
    'switch',
    'table',
    'tabpanel',
    'textbox',
    'tooltip',
    'tree',
    'treegrid',
    'treeitem'
  ]);

  function roleOf(el) {
    try {
      const info = helpers.getRoleInfo(el, ctx);
      return trim(info && info.role).toLowerCase();
    } catch {
      return '';
    }
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[aria-braillelabel], [aria-brailleroledescription]')
    : helpers.queryAll('[aria-braillelabel], [aria-brailleroledescription]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const brailleLabel = trim(dom.getAttribute(el, 'aria-braillelabel'));
    const brailleRoleDesc = trim(dom.getAttribute(el, 'aria-brailleroledescription'));
    if (!brailleLabel && !brailleRoleDesc) continue;

    applicableCount += 1;

    const missing = [];

    if (brailleLabel) {
      const nameInfo = helpers.getAccessibleNameInfo
        ? helpers.getAccessibleNameInfo(el, ctx)
        : null;
      const programmaticName = trim(
        nameInfo && typeof nameInfo.value === 'string' ? nameInfo.value : ''
      );
      const name = programmaticName || getConservativeSubtreeText(el);
      const role = roleOf(el);
      if (!name)
        missing.push({
          // A role that needs a name is left with none for speech users.
          lean: NAME_REQUIRED_ROLES.has(role)
            ? {
                toward: 'fail',
                why: 'The element’s role needs a name, and it has none besides its braille label, so speech users get no name.',
                signals: [
                  { signal: 'role-requires-name', value: true },
                  { signal: 'role', value: role },
                  { signal: 'accessible-name-empty', value: true }
                ],
                caution:
                  'The naming rule for this role reports the missing name too; it is one problem, not two.',
                i18n: {
                  whyKey: 'ariaBrailleEquivalent_lean_why_label',
                  cautionKey: 'ariaBrailleEquivalent_lean_caution_label'
                }
              }
            : null,
          attr: 'aria-braillelabel',
          requires: 'an accessible name',
          messageKey: 'label',
          summary:
            'This element has aria-braillelabel but no accessible name, its non-braille equivalent.',
          hint: 'aria-braillelabel is a Braille-specific supplement, not a replacement, so also give the element an accessible name (for example visible text, aria-label or aria-labelledby).'
        });
    }

    if (brailleRoleDesc) {
      const roleDesc = trim(dom.getAttribute(el, 'aria-roledescription'));
      if (!roleDesc)
        missing.push({
          // Browsers expose aria-brailleroledescription only with an
          // aria-roledescription, so the element keeps its usual role and
          // no user loses anything they had.
          lean: {
            toward: 'pass',
            why: 'Without aria-roledescription, browsers do not expose the braille role description, so the element keeps its usual role and nothing is lost.',
            signals: [{ signal: 'missing-attr', value: 'aria-roledescription' }],
            caution: 'The braille role description the author wrote reaches no one.',
            i18n: {
              whyKey: 'ariaBrailleEquivalent_lean_why_roleDescription',
              cautionKey: 'ariaBrailleEquivalent_lean_caution_roleDescription'
            }
          },
          attr: 'aria-brailleroledescription',
          requires: 'aria-roledescription',
          messageKey: 'roleDescription',
          summary:
            'This element has aria-brailleroledescription but not aria-roledescription, its non-braille equivalent.',
          hint: 'aria-brailleroledescription is a Braille-specific supplement, not a replacement, so also provide aria-roledescription.'
        });
    }

    if (!missing.length) continue;

    const tag = (dom.tagName(el) || '').toLowerCase();

    for (const m of missing) {
      occurrences.push(
        helpers.reportOccurrence(el, {
          // One message per missing equivalent rather than a shared template:
          // `requires` is English prose for the label case, and interpolating
          // it put English into every translated sentence.
          summary: m.summary,
          hint: m.hint,
          i18n: {
            summaryKey: `ariaBrailleEquivalent_summary_fail_${m.messageKey}`,
            hintKey: `ariaBrailleEquivalent_hint_fail_${m.messageKey}`,
            params: { element: tag, attr: m.attr }
          },
          uncertainty: {
            code: 'spec-only',
            needed:
              'Whether any user reaches this attribute, given no braille equivalent is exposed.',
            evidence: { element: tag, attribute: m.attr, requires: m.requires }
          },
          ...(m.lean ? { lean: m.lean } : {}),
          data: {
            details: {
              reasonCode: 'BRAILLE_ATTR_WITHOUT_EQUIVALENT',
              attr: m.attr,
              requires: m.requires
            }
          }
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    [],
    occurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
