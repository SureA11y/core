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
 * @implementation-notes
 * - `aria-braillelabel`/`aria-brailleroledescription` do not participate
 *   in the standard accessible-name computation, so
 *   `helpers.getAccessibleNameInfo` already reflects only the "regular"
 *   (non-braille) name — no special-casing needed there.
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
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['aria-braille-equivalent'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  function getConservativeSubtreeText(container) {
    // "Name from content" — recurses into descendants and uses each one's
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
    const t = container && container.textContent ? String(container.textContent) : '';
    return t.replace(/\s+/g, ' ').trim();
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[aria-braillelabel], [aria-brailleroledescription]')
    : helpers.queryAll('[aria-braillelabel], [aria-brailleroledescription]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const brailleLabel = trim(el.getAttribute('aria-braillelabel'));
    const brailleRoleDesc = trim(el.getAttribute('aria-brailleroledescription'));
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
      if (!name) missing.push({ attr: 'aria-braillelabel', requires: 'an accessible name' });
    }

    if (brailleRoleDesc) {
      const roleDesc = trim(el.getAttribute('aria-roledescription'));
      if (!roleDesc)
        missing.push({ attr: 'aria-brailleroledescription', requires: 'aria-roledescription' });
    }

    if (!missing.length) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';
    const tag = (el.tagName || '').toLowerCase();

    for (const m of missing) {
      occurrences.push({
        selector: stableSelector,
        html,
        summary: `This element has ${m.attr} but no ${m.requires}, its non-braille equivalent.`,
        hint: `${m.attr} is a Braille-specific supplement, not a replacement — also provide ${m.requires}.`,
        i18n: {
          summaryKey: 'ariaBrailleEquivalent_summary_fail',
          hintKey: 'ariaBrailleEquivalent_hint_fail',
          params: { element: tag, attr: m.attr, requires: m.requires }
        },
        data: {
          details: {
            reasonCode: 'BRAILLE_ATTR_WITHOUT_EQUIVALENT',
            attr: m.attr,
            requires: m.requires
          }
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
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
