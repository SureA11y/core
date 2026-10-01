/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check svg-role-img
 * @atomic true
 * @summary An SVG with a text alternative must have role="img"
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to outer <svg> elements that carry a text alternative: text
 *   referenced by aria-labelledby, a non-empty aria-label, or a non-empty
 *   <title> child. An <svg> with aria-hidden="true", on itself or an
 *   ancestor, is left out (svg-hidden-no-alternative checks it), and so is
 *   content hidden with CSS or the hidden attribute. An <svg role="img">
 *   with no alternative at all is left to svg-text-alternative-present. A
 *   page with none is notApplicable.
 * @expectation
 *   The <svg> has role="img" (RGAA 1.1.5 step 3; step 4: "Si ce n'est pas
 *   le cas, le test est invalidé"), and its alternative comes from
 *   aria-labelledby or aria-label (step 5).
 *   An alternative without role="img" fails: the author has shown that the
 *   image carries information, and without the role it is not exposed as
 *   an image. If the image were in fact decorative, it would fail 1.2.4
 *   instead, which requires aria-hidden="true" and no alternative.
 *   An <svg role="img"> named only by its <title> is asked about
 *   (cantTell): RGAA contradicts itself there. 1.1.5 step 5 lists only
 *   aria-labelledby and aria-label, but 1.3.6 checks "le contenu de
 *   l'élément <title>" as the alternative of an SVG.
 * @implementation-notes
 * - The role is read from the first token of the role attribute.
 * - aria-labelledby counts when it resolves to text.
 * - Opt-in (tag `rgaa`): WCAG does not require role="img" on a named SVG,
 *   so the rule runs only under the rgaa-4.1.2 profile, the `rgaa` tag or
 *   its own id.
 */

const id = 'svg-role-img';

const meta = {
  title: 'SVGs with a text alternative have role="img"',
  description:
    'Checks that an <svg> named by aria-labelledby, aria-label or <title> has role="img", and that its name comes from aria-labelledby or aria-label.',
  i18n: {
    titleKey: 'svgRoleImg_title',
    descriptionKey: 'svgRoleImg_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'svg', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const trim = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const attr = (el, name) => {
    try {
      return el.getAttribute(name);
    } catch {
      return null;
    }
  };
  const tagOf = (el) => String(el.localName || el.tagName || '').toLowerCase();
  const parentOf = (el) =>
    helpers.composedParent ? helpers.composedParent(el) : el.parentElement || null;

  function insideAriaHidden(el) {
    for (let n = el; n && n.nodeType === 1; n = parentOf(n)) {
      if (trim(attr(n, 'aria-hidden')).toLowerCase() === 'true') return true;
    }
    return false;
  }

  function ariaName(el) {
    if (helpers.getAriaNameInfo) {
      try {
        const info = helpers.getAriaNameInfo(el, ctx);
        return info && info.present && trim(info.value) ? info.mechanism : '';
      } catch {}
    }
    return trim(attr(el, 'aria-label')) ? 'aria-label' : '';
  }

  function titleChildText(el) {
    for (const child of Array.from(el.children || [])) {
      if (tagOf(child) === 'title') return trim(child.textContent);
    }
    return '';
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('svg') : helpers.queryAll('svg');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;

  for (const svg of nodes) {
    if (!svg || !svg.getAttribute) continue;
    const p = svg.parentElement;
    if (p && p.closest && p.closest('svg')) continue;
    if (insideAriaHidden(svg)) continue;

    const mechanism = ariaName(svg);
    const title = titleChildText(svg);
    if (!mechanism && !title) continue;
    applicableCount += 1;

    const isRoleImg = trim(attr(svg, 'role')).toLowerCase().split(' ')[0] === 'img';
    if (isRoleImg && mechanism) continue;

    if (isRoleImg) {
      cantTells.push(
        helpers.reportOccurrence(svg, {
          summary: 'This <svg role="img"> is named only by its <title> element.',
          hint: 'RGAA 1.1.5 lists aria-labelledby and aria-label as the sources for an <svg>. Check that assistive technologies render the <title>, or point aria-labelledby at it.',
          i18n: {
            summaryKey: 'svgRoleImg_summary_cantTell_titleOnly',
            hintKey: 'svgRoleImg_hint_cantTell_titleOnly'
          },
          data: {
            details: { reasonCode: 'titleOnly', title },
            visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
          }
        })
      );
      continue;
    }

    const found = [];
    if (mechanism) found.push(mechanism);
    if (title) found.push('<title>');
    const alternatives = found.join(', ');
    fails.push(
      helpers.reportOccurrence(svg, {
        summary: `This <svg> has a text alternative (${alternatives}) but no role="img".`,
        hint: 'Add role="img" to the <svg>, and name it with aria-label or aria-labelledby. If the image is decorative, remove the alternative and add aria-hidden="true".',
        i18n: {
          summaryKey: 'svgRoleImg_summary_fail_missingRole',
          hintKey: 'svgRoleImg_hint_fail_missingRole',
          params: { alternatives }
        },
        data: {
          details: { reasonCode: 'missingRoleImg', alternatives: found },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
