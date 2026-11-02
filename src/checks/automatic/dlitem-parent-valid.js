/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check dlitem-parent-valid
 * @atomic true
 * @summary <dt>/<dd> elements must be contained by a <dl> (directly or via one wrapping <div>)
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <dt>/<dd> elements that have a parent element in the flat
 *   tree, as the page renders it: a <dt>/<dd> slotted into a shadow
 *   <dl><slot></slot></dl> is in that list, and a <slot> in between is seen
 *   through. A <dt>/<dd> a shadow host doesn't slot is not rendered and is
 *   left out.
 * @expectation
 *   The parent is <dl>, or the parent is a <div> whose own parent is <dl>
 *   (a single level of wrapping div is allowed, matching how authors
 *   commonly group dt/dd pairs). A <dt>/<dd> used outside a real
 *   description-list container keeps its term or definition role, but no
 *   list pairs it with the definition or term that goes with it.
 *   Every finding is reported at CANTTELL, not FAIL. HTML-AAM gives <dt> and
 *   <dd> their term and definition roles wherever they sit, so what a broken
 *   content model loses is the pairing of terms with definitions, which only
 *   the <dl>'s structure and order state. That is a WCAG failure (SC 1.3.1)
 *   only where the page shows the pairing, and H40 is only a sufficient
 *   technique: a person settles it.
 * @reports
 *   - `parentElement`: the tag name of the element's parent, the container
 *     it is in instead of a `<dl>`.
 * @reason-codes
 *   - `DLITEM_INVALID_PARENT` (cantTell): a dt or dd is not inside a dl, either
 *     directly or through one wrapping div.
 *     Basis: H40; HTML dt and dd elements contexts (MUST); WCAG 1.3.1 (not
 *     settled).
 * @implementation-notes
 * - Distinct, atomic decision from definition-list-children-valid
 *   (the inverse relationship: does a given <dl> have valid children).
 */

const id = 'dlitem-parent-valid';

const meta = {
  title: 'Description-list items must be inside a description list',
  description:
    'Checks that <dt>/<dd> elements are contained by a <dl>, directly or via one wrapping <div>.',
  i18n: {
    titleKey: 'dlitemParentValid_title',
    descriptionKey: 'dlitemParentValid_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'structure', 'atomic', 'automatic', 'list'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.3.1': ['dlitem-parent-valid'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('dt, dd')
    : helpers.queryAll('dt, dd');

  const occurrences = [];
  let applicableCount = 0;

  // The element a <dt>/<dd> renders in: its parent in the flat tree,
  // through an assigned slot and past any <slot> or shadow root on the way
  // (helpers.flatParentElement). undefined for a child of a shadow host that
  // no slot takes: it isn't rendered, so it is left out.
  for (const el of nodes) {
    if (!el) continue;
    const parent = helpers.flatParentElement(el);
    if (!parent) continue;

    applicableCount += 1;

    const parentTag = dom.tagName(parent) ? dom.tagName(parent).toLowerCase() : '';
    let valid = parentTag === 'dl';

    if (!valid && parentTag === 'div') {
      const grandparent = helpers.flatParentElement(parent);
      const grandparentTag =
        grandparent && dom.tagName(grandparent) ? dom.tagName(grandparent).toLowerCase() : '';
      valid = grandparentTag === 'dl';
    }

    if (valid) continue;

    const tag = dom.tagName(el).toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This description-list item is not contained by a <dl>.',
        hint: 'Place this <dt>/<dd> inside a <dl>, directly or wrapped in a single <div>.',
        uncertainty: {
          code: 'spec-only',
          needed:
            'Whether the page shows this term or definition paired with another, a pairing no <dl> states.',
          evidence: { element: tag, parentElement: parentTag }
        },
        i18n: {
          summaryKey: 'dlitemParentValid_summary_fail',
          hintKey: 'dlitemParentValid_hint_fail',
          params: { element: tag, parentElement: parentTag }
        },
        data: {
          details: { reasonCode: 'DLITEM_INVALID_PARENT', element: tag, parentElement: parentTag }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  // Every finding is a question: the term and definition roles survive,
  // and whether the pairing the markup breaks is one the page shows is for
  // a person to say (see @expectation).
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome([], occurrences, rule.defaultSeverity || 'serious')
  };
}

module.exports = { id, meta, runInPage };
