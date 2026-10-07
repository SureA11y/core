/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check frame-title-attribute-present
 * @atomic true
 * @summary Each frame must have a title attribute
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every <iframe> and <frame> in the scan scope that is not
 *   hidden from assistive technologies by aria-hidden="true", on itself or
 *   on an ancestor. The RGAA glossary "Titre de cadre", note 2, makes
 *   criteria 2.1 and 2.2 not applicable to such a frame. A frame removed
 *   from the tab order (tabindex="-1") is still in scope. Frames hidden by
 *   the default hidden-content policy (display:none, hidden) are not
 *   checked. A page with no applicable frame is notApplicable.
 * @expectation
 *   The frame has a title attribute (RGAA 2.1.1: « Chaque cadre (balise
 *   <iframe> ou <frame>) a-t-il un attribut title ? »). An accessible name
 *   from aria-label or aria-labelledby does not replace it. An empty title
 *   is present, so it passes here; it cannot be relevant, which is what
 *   frame-title-not-empty reports under 2.2.1.
 * @implementation-notes
 * - WCAG 4.1.2 accepts any accessible name, so iframe-name-present passes
 *   a frame named by aria-label and skips frames with tabindex="-1".
 *   RGAA 2.1.1 asks for the title attribute on every frame, so this rule
 *   reports 2.1.1 in its place.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'frame-title-attribute-present';

const meta = {
  title: 'Frames have a title attribute',
  description:
    'Checks that every <iframe> and <frame> has a title attribute, unless it is hidden with aria-hidden="true".',
  i18n: {
    titleKey: 'frameTitleAttributePresent_title',
    descriptionKey: 'frameTitleAttributePresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'iframe', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe, frame')
    : helpers.queryAll('iframe, frame');

  // aria-hidden="true" on the frame or on an ancestor, across shadow roots.
  function isAriaHidden(el) {
    for (
      let n = el;
      n;
      n = helpers.composedParent ? helpers.composedParent(n) : dom.parentNode(n)
    ) {
      if (!dom.get(n, 'getAttribute')) continue;
      const v = dom.getAttribute(n, 'aria-hidden');
      if (v != null && String(v).trim().toLowerCase() === 'true') return true;
    }
    return false;
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.tagName(el)) continue;
    if (isAriaHidden(el)) continue;
    applicableCount += 1;
    if (dom.hasAttribute(el, 'title')) continue;

    const element = String(dom.tagName(el)).toLowerCase();
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This <${element}> has no title attribute.`,
        hint: 'Add a title attribute that says what the frame contains. aria-label does not replace it.',
        i18n: {
          summaryKey: 'frameTitleAttributePresent_summary_fail',
          hintKey: 'frameTitleAttributePresent_hint_fail',
          params: { element }
        },
        data: {
          details: { reasonCode: 'missingTitle', element },
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
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
