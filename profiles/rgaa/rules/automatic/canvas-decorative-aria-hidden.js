/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check canvas-decorative-aria-hidden
 * @atomic true
 * @summary A decorative <canvas> must have aria-hidden="true" and no alternative
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <canvas> elements marked decorative: with aria-hidden="true"
 *   on the element, or with role="none"/"presentation". A <canvas> inside a
 *   <figure> that has a <figcaption> is left out: criterion 1.2 does not
 *   apply to an image with a caption (légende). Content hidden with CSS or
 *   the hidden attribute is left out too. A page with none is
 *   notApplicable.
 * @expectation
 *   RGAA 1.2.5: a decorative <canvas> has aria-hidden="true", no
 *   aria-labelledby, aria-label or title, no text alternative on its
 *   children, and no text between <canvas> and </canvas>.
 *   Fails:
 *   - aria-hidden="true" with any of those alternatives. If the canvas is
 *     decorative, it breaks 1.2.5; if it carries information, hiding it
 *     breaks 1.1.8. Either way the page fails;
 *   - role="none"/"presentation" without aria-hidden="true", and no
 *     fallback content. The role shows the author meant the image as
 *     decorative, and RGAA asks for aria-hidden="true" there; if it carries
 *     information after all, it has no alternative and fails 1.1.8.
 *   Asks (cantTell): role="none"/"presentation" without aria-hidden="true"
 *   but with fallback content. If the canvas carries information, that
 *   content is its alternative and 1.1.8 passes; if it is decorative, it
 *   breaks 1.2.5.
 * @implementation-notes
 * - The role is read from the first token of the role attribute.
 * - Opt-in (tag `rgaa`): WCAG accepts role="presentation" alone on a
 *   decorative canvas, so the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'canvas-decorative-aria-hidden';

const meta = {
  title: 'Decorative <canvas> images have aria-hidden="true" and no alternative',
  description:
    'Checks that a <canvas> marked decorative has aria-hidden="true", no aria-labelledby, aria-label or title, and no alternative content inside it.',
  i18n: {
    titleKey: 'canvasDecorativeAriaHidden_title',
    descriptionKey: 'canvasDecorativeAriaHidden_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'canvas', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
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

  function hasCaption(el) {
    const figure = el.closest ? el.closest('figure') : null;
    if (!figure) return false;
    return Array.from(figure.querySelectorAll(':scope > *')).some((c) => tagOf(c) === 'figcaption');
  }

  // The alternatives 1.2.5 forbids, on the canvas and its children.
  function alternativesOf(el) {
    const found = [];
    for (const name of ['aria-labelledby', 'aria-label', 'title']) {
      if (trim(attr(el, name))) found.push(name);
    }
    const children = Array.from(el.querySelectorAll('*'));
    const childAlt = children.some((c) =>
      ['alt', 'aria-label', 'aria-labelledby', 'title'].some((n) => trim(attr(c, n)))
    );
    if (childAlt) found.push('childAlternative');
    if (trim(el.textContent)) found.push('fallbackContent');
    return found;
  }

  // Attribute names as written; content inside the canvas as <canvas>…</canvas>.
  function display(found) {
    const out = found.filter((f) => f !== 'childAlternative' && f !== 'fallbackContent');
    if (found.length > out.length) out.push('<canvas>…</canvas>');
    return out.join(', ');
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('canvas')
    : helpers.queryAll('canvas');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const ariaHidden = trim(attr(el, 'aria-hidden')).toLowerCase() === 'true';
    const role = trim(attr(el, 'role')).toLowerCase().split(' ')[0];
    const presentational = role === 'none' || role === 'presentation';
    if (!ariaHidden && !presentational) continue;
    if (hasCaption(el)) continue;
    applicableCount += 1;

    const found = alternativesOf(el);
    const alternatives = display(found);

    if (ariaHidden) {
      if (!found.length) continue;
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This <canvas> is hidden with aria-hidden="true" but carries an alternative: ${alternatives}.`,
          hint: 'If the image is decorative, remove the alternative. If it carries information, remove aria-hidden and give it role="img" and an aria-label or aria-labelledby.',
          i18n: {
            summaryKey: 'canvasDecorativeAriaHidden_summary_fail_hidden',
            hintKey: 'canvasDecorativeAriaHidden_hint_fail_hidden',
            params: { alternatives }
          },
          data: {
            details: { reasonCode: 'hiddenCanvasHasAlternative', alternatives: found },
            visibilityFilter: VF
          }
        })
      );
      continue;
    }

    if (found.includes('fallbackContent') || found.includes('childAlternative')) {
      cantTells.push(
        helpers.reportOccurrence(el, {
          summary: `This <canvas role="${role}"> has no aria-hidden="true" and has content between <canvas> and </canvas>.`,
          hint: 'If the image carries information, remove the role and keep the content as its alternative. If it is decorative, add aria-hidden="true" and remove the content.',
          i18n: {
            summaryKey: 'canvasDecorativeAriaHidden_summary_cantTell_content',
            hintKey: 'canvasDecorativeAriaHidden_hint_cantTell_content',
            params: { role }
          },
          data: {
            details: { reasonCode: 'presentationWithContent', role, alternatives: found },
            visibilityFilter: VF
          }
        })
      );
      continue;
    }

    fails.push(
      helpers.reportOccurrence(el, {
        summary: `This <canvas role="${role}"> is marked decorative but has no aria-hidden="true".`,
        hint: 'Add aria-hidden="true" to a decorative canvas, and give it no aria-label, aria-labelledby or title.',
        i18n: {
          summaryKey: 'canvasDecorativeAriaHidden_summary_fail_role',
          hintKey: 'canvasDecorativeAriaHidden_hint_fail_role',
          params: { role }
        },
        data: {
          details: { reasonCode: 'presentationWithoutAriaHidden', role, alternatives: found },
          visibilityFilter: VF
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const tiered = helpers.resolveTieredOutcome(fails, cantTells, rule.defaultSeverity || 'minor');
  return { ruleId: rule.ruleId, ...tiered };
}

module.exports = { id, meta, runInPage };
