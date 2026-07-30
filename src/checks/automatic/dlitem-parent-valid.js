'use strict';

/**
 * @check dlitem-parent-valid
 * @atomic true
 * @summary <dt>/<dd> elements must be contained by a <dl> (directly or via one wrapping <div>)
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <dt>/<dd> elements that have a parent element.
 * @expectation
 *   The parent is <dl>, or the parent is a <div> whose own parent is <dl>
 *   (a single level of wrapping div is allowed, matching how authors
 *   commonly group dt/dd pairs). A <dt>/<dd> used outside a real
 *   description-list container is not exposed as a term/definition to
 *   assistive technologies.
 * @implementation-notes
 * - Distinct, atomic decision from definition-list-children-valid
 *   (the inverse relationship: does a given <dl> have valid children).
 */

const id = 'dlitem-parent-valid';

const meta = {
  title: 'Description-list items must be inside a description list',
  description: 'Checks that <dt>/<dd> elements are contained by a <dl>, directly or via one wrapping <div>.',
  i18n: {
    titleKey: 'dlitemParentValid_title',
    descriptionKey: 'dlitemParentValid_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'structure', 'atomic', 'automatic', 'list'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.3.1', title: 'Info and Relationships', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.3.1': ['dlitem-parent-valid'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('dt, dd') : helpers.queryAll('dt, dd');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el) continue;
    const parent = el.parentElement;
    if (!parent) continue;

    applicableCount += 1;

    const parentTag = parent.tagName ? parent.tagName.toLowerCase() : '';
    let valid = parentTag === 'dl';

    if (!valid && parentTag === 'div') {
      const grandparent = parent.parentElement;
      const grandparentTag = grandparent && grandparent.tagName ? grandparent.tagName.toLowerCase() : '';
      valid = grandparentTag === 'dl';
    }

    if (valid) continue;

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This description-list item is not contained by a <dl>.',
      hint: 'Place this <dt>/<dd> inside a <dl>, directly or wrapped in a single <div>.',
      i18n: {
        summaryKey: 'dlitemParentValid_summary_fail',
        hintKey: 'dlitemParentValid_hint_fail',
        params: { element: tag, parentElement: parentTag }
      },
      data: {
        details: { reasonCode: 'DLITEM_INVALID_PARENT', element: tag, parentElement: parentTag }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'serious', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };