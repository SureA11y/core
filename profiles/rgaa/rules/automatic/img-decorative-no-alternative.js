/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check img-decorative-no-alternative
 * @atomic true
 * @summary A decorative <img> must have no aria-labelledby, aria-label or title
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <img> elements marked decorative: alt="", aria-hidden="true"
 *   on the element, or role="presentation"/"none". An <img> inside a
 *   <figure> that has a <figcaption> is left out: criterion 1.2 does not
 *   apply to an image with a caption (légende). Content hidden with CSS or
 *   the hidden attribute is left out too. A page with none is
 *   notApplicable.
 * @expectation
 *   RGAA 1.2.1 step 2: "vérifier que l'image ne possède pas d'attributs
 *   aria-labelledby, aria-label ou title". An image marked decorative that
 *   has none of them, with a non-empty value, passes.
 *   Fails: aria-hidden="true" together with one of them. The image is
 *   hidden from assistive technologies, so it is decorative for them; if it
 *   carries information after all, hiding it fails 1.1.1 instead. Either
 *   way the page fails.
 *   Asks (cantTell): alt="" or role="presentation"/"none", without
 *   aria-hidden="true", together with one of them. The image may be
 *   informative, and then 1.2.1 does not apply and 1.1.1 accepts
 *   aria-label, aria-labelledby or title as its alternative. A person
 *   decides which.
 * @implementation-notes
 * - An empty attribute (aria-label="") is not counted: it provides no
 *   alternative.
 * - The role is read from the first token of the role attribute.
 * - Opt-in (tag `rgaa`): WCAG does not forbid these attributes on an image
 *   hidden from assistive technologies, so the rule runs only under the
 *   rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 */

const id = 'img-decorative-no-alternative';

const meta = {
  title: 'Decorative images have no aria-labelledby, aria-label or title',
  description:
    'Checks that an <img> marked decorative (alt="", aria-hidden="true" or role="presentation") has no aria-labelledby, aria-label or title attribute.',
  i18n: {
    titleKey: 'imgDecorativeNoAlternative_title',
    descriptionKey: 'imgDecorativeNoAlternative_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const trim = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const attr = (el, name) => {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  };
  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();

  function hasCaption(el) {
    const figure = dom.get(el, 'closest') ? dom.closest(el, 'figure') : null;
    if (!figure) return false;
    return Array.from(dom.querySelectorAll(figure, ':scope > *')).some(
      (c) => tagOf(c) === 'figcaption'
    );
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('img') : helpers.queryAll('img');

  const fails = [];
  const cantTells = [];
  let applicableCount = 0;
  const VF = { targetSet: 'dom', accEligible: null, reasons: [] };

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const ariaHidden = trim(attr(el, 'aria-hidden')).toLowerCase() === 'true';
    const role = trim(attr(el, 'role')).toLowerCase().split(' ')[0];
    const presentational = role === 'none' || role === 'presentation';
    const emptyAlt = attr(el, 'alt') === '';
    if (!ariaHidden && !presentational && !emptyAlt) continue;
    if (hasCaption(el)) continue;
    applicableCount += 1;

    const found = ['aria-labelledby', 'aria-label', 'title'].filter((n) => trim(attr(el, n)));
    if (!found.length) continue;
    const attributes = found.join(', ');

    if (ariaHidden) {
      fails.push(
        helpers.reportOccurrence(el, {
          summary: `This image is hidden with aria-hidden="true" but has ${attributes}.`,
          hint: 'If the image is decorative, remove these attributes. If it carries information, remove aria-hidden and give it an alt text.',
          i18n: {
            summaryKey: 'imgDecorativeNoAlternative_summary_fail',
            hintKey: 'imgDecorativeNoAlternative_hint_fail',
            params: { attributes }
          },
          data: {
            details: { reasonCode: 'hiddenImgHasAlternative', attributes: found },
            visibilityFilter: VF
          }
        })
      );
      continue;
    }

    const marker = emptyAlt ? 'alt=""' : `role="${role}"`;
    cantTells.push(
      helpers.reportOccurrence(el, {
        summary: `This image is marked decorative with ${marker} but has ${attributes}.`,
        hint: 'If the image is decorative, remove these attributes. If it carries information, give it an alt text that describes it.',
        i18n: {
          summaryKey: 'imgDecorativeNoAlternative_summary_cantTell',
          hintKey: 'imgDecorativeNoAlternative_hint_cantTell',
          params: { marker, attributes }
        },
        data: {
          details: { reasonCode: 'decorativeImgHasAlternative', marker, attributes: found },
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
