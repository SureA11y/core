'use strict';

/**
 * @check listitem-parent-valid
 * @atomic true
 * @summary <li> elements must be contained by a list container
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <li> elements that have a parent element.
 * @expectation
 *   The parent is <ul>/<ol> with no role override, or an element with an
 *   explicit role of "list", "presentation", or "none". An <li> used
 *   outside a real list container (e.g. as a generic flex/grid item under
 *   a <div>) is not exposed as a list item to assistive technologies.
 * @implementation-notes
 * - Distinct, atomic decision from list-children-valid (the
 *   inverse relationship: does a given list container have valid
 *   children).
 * - Role check is scoped to the parent's first explicit role token only
 *   (matching this engine's existing role-reading convention elsewhere,
 *   e.g. aria-helpers.js getExplicitRole).
 * - An explicit role on the parent WINS over its tag name, in either
 *   direction: a <ul role="menu"> no longer exposes role "list" (its own
 *   native role is fully replaced by the explicit one — the same "any
 *   explicit role overrides the element's native role" ARIA principle
 *   applied elsewhere in this engine), so an <li> inside it is invalid
 *   despite the <ul> tag — found on a real site, Nike's desktop nav
 *   dropdown (`<ul class="desktop-category" role="menu"><li>...`).
 *   Conversely role="presentation"/"none" on the parent is still a valid
 *   (list-semantics-suppressing) parent, matching a widely-used reference
 *   engine's own `listitem` check (`['presentation', 'none', 'list'].includes(parentRole)`,
 *   confirmed by reading its source directly).
 */

const id = 'listitem-parent-valid';

const meta = {
  title: 'List items must be inside a list container',
  description:
    'Checks that <li> elements are contained by <ul>, <ol>, or an element with role="list".',
  i18n: {
    titleKey: 'listitemParentValid_title',
    descriptionKey: 'listitemParentValid_description'
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
  coverage: { facetsBySc: { '1.3.1': ['listitem-parent-valid'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('li') : helpers.queryAll('li');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el) continue;
    const parent = el.parentElement;
    if (!parent) continue;

    applicableCount += 1;

    const parentTag = parent.tagName ? parent.tagName.toLowerCase() : '';

    const roleAttr = parent.getAttribute ? String(parent.getAttribute('role') || '').trim() : '';
    const explicitRole = roleAttr ? (roleAttr.split(/\s+/)[0] || '').toLowerCase() : '';

    let valid;
    if (explicitRole) {
      // An explicit role always wins over the tag's native role, in either
      // direction — see the header comment's Nike example.
      valid = explicitRole === 'list' || explicitRole === 'presentation' || explicitRole === 'none';
    } else {
      valid = parentTag === 'ul' || parentTag === 'ol';
    }

    if (valid) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This list item is not contained by a list container.',
      hint: 'Place this <li> inside a <ul>/<ol>, or give its parent role="list".',
      i18n: {
        summaryKey: 'listitemParentValid_summary_fail',
        hintKey: 'listitemParentValid_hint_fail',
        params: { parentElement: parentTag }
      },
      data: {
        details: { reasonCode: 'LISTITEM_INVALID_PARENT', parentElement: parentTag }
      }
    });
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
