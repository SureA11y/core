/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check svg-hidden-no-alternative
 * @atomic true
 * @summary An SVG hidden as decorative must carry no text alternative
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <svg> elements with aria-hidden="true", outer ones only. A
 *   page with none is notApplicable.
 * @expectation
 *   Neither the <svg> nor anything in it has an aria-label, aria-labelledby
 *   or title attribute with text, and any <title> or <desc> in it is empty
 *   (RGAA 1.2.4). An SVG that breaks this fails either way: if it is
 *   decorative it breaks 1.2.4, and if it carries information, hiding it
 *   breaks 1.1.5.
 *   Content drawn through <use href="#id"> (or xlink:href) counts as the
 *   SVG's own: the note of RGAA criterion 1.2 says 1.2.4 also applies to the
 *   <svg> or <symbol> a <use> element points to. Only same-document
 *   references are followed, recursively; an external file is not fetched.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG does not forbid a text alternative inside
 *   hidden content, so the rule runs only under the rgaa-4.1.2 profile, the
 *   `rgaa` tag or its own id.
 */

const id = 'svg-hidden-no-alternative';

const meta = {
  title: 'Hidden decorative SVGs carry no text alternative',
  description:
    'Checks that an <svg> with aria-hidden="true" has no aria-label, aria-labelledby, title attribute, or non-empty <title> or <desc>.',
  i18n: {
    titleKey: 'svgHiddenNoAlternative_title',
    descriptionKey: 'svgHiddenNoAlternative_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'images', 'svg', 'atomic', 'automatic'],
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

  const hasText = (s) => !!String(s || '').trim();

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('svg[aria-hidden]')
    : helpers.queryAll('svg[aria-hidden]');

  const occurrences = [];
  let applicableCount = 0;

  for (const svg of nodes) {
    if (!svg || !dom.get(svg, 'getAttribute')) continue;
    if (String(dom.getAttribute(svg, 'aria-hidden')).trim().toLowerCase() !== 'true') continue;
    const outer = dom.parentElement(svg) ? dom.closest(dom.parentElement(svg), 'svg') : null;
    if (outer) continue;
    applicableCount += 1;

    const all = [svg].concat(Array.from(dom.querySelectorAll(svg, '*')));
    const referenced = [];
    // Follow same-document <use> references (see @expectation above).
    const visited = new Set(all);
    for (let i = 0; i < all.length; i += 1) {
      const el = all[i];
      if (String(dom.localName(el) || dom.tagName(el)).toLowerCase() !== 'use') continue;
      const ref = String(
        dom.getAttribute(el, 'href') || dom.getAttribute(el, 'xlink:href') || ''
      ).trim();
      if (ref.length < 2 || ref[0] !== '#') continue;
      let target;
      try {
        const rootNode = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
        const scope =
          rootNode && dom.get(rootNode, 'getElementById') ? rootNode : dom.ownerDocument(svg);
        target = scope ? dom.getElementById(scope, decodeURIComponent(ref.slice(1))) : null;
      } catch {
        target = null;
      }
      if (!target || visited.has(target)) continue;
      referenced.push(ref);
      for (const node of [target].concat(Array.from(dom.querySelectorAll(target, '*')))) {
        if (visited.has(node)) continue;
        visited.add(node);
        all.push(node);
      }
    }
    const found = [];
    for (const attr of ['aria-label', 'aria-labelledby', 'title']) {
      if (all.some((el) => hasText(dom.getAttribute(el, attr)))) found.push(attr);
    }
    for (const tag of ['title', 'desc']) {
      const withText = all.some(
        (el) =>
          String(dom.localName(el) || dom.tagName(el)).toLowerCase() === tag &&
          hasText(dom.textContent(el))
      );
      if (withText) found.push(`<${tag}>`);
    }
    if (!found.length) continue;

    const alternatives = found.join(', ');
    occurrences.push(
      helpers.reportOccurrence(svg, {
        summary: `This SVG is hidden with aria-hidden="true" but carries a text alternative: ${alternatives}.`,
        hint: 'If the image is decorative, remove the text alternative. If it carries information, remove aria-hidden and give it role="img" and a text alternative.',
        i18n: {
          summaryKey: 'svgHiddenNoAlternative_summary_fail',
          hintKey: 'svgHiddenNoAlternative_hint_fail',
          params: { alternatives }
        },
        data: {
          details: {
            reasonCode: 'hiddenSvgHasAlternative',
            alternatives: found,
            ...(referenced.length ? { usesReferenced: referenced } : {})
          },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
