/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-name-present
 * @atomic true
 * @summary Links must have an accessible name
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to <a href>, <area href> and elements with role="link" that are
 *   included in the accessibility tree. An <a> without an href is not a link
 *   and is not matched.
 * @expectation
 *   The element has a non-empty accessible name. A programmatic name is
 *   taken first (aria-labelledby, aria-label, an associated <label>, title),
 *   and failing that the element falls back to its own subtree text,
 *   counting each descendant's own name (an <img alt>, aria-label or title),
 *   the shape behind the common <a><img alt="..."></a> logo link. The
 *   content fallback is suppressed when an explicit, known role that is not
 *   name-from-content is present; an unrecognized role token falls back to
 *   the implicit role.
 */

const id = 'link-name-present';

const meta = {
  title: 'Links have an accessible name',
  description: 'Checks that links expose a non-empty accessible name.',
  i18n: {
    titleKey: 'linkNamePresent_title',
    descriptionKey: 'linkNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'navigation', 'atomic', 'automatic', 'links', 'name'],
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
  // IMPORTANT: update your facets registry to include "link-name-present" under 4.1.2
  coverage: { facetsBySc: { '4.1.2': ['link-name-present'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const occurrences = [];
  let applicableCount = 0;

  function getConservativeSubtreeText(container) {
    // "Name from content", recurses into descendants and uses each one's
    // own accessible name (img alt, aria-label/aria-labelledby, title) when
    // it has one, not just literal text nodes. See getContentNameInfo's
    // header comment in src/core/dom-helpers.js for the full rationale
    // (this replaced a text-node-only TreeWalker that missed the common
    // "<a><img alt='...'></a>" logo-link pattern).
    if (helpers.getContentNameInfo) {
      const info = helpers.getContentNameInfo(container, ctx);
      return info && info.present ? info.value : '';
    }
    const t = container && container.textContent ? String(container.textContent) : '';
    return t.replace(/\s+/g, ' ').trim();
  }

  const selector = 'a[href], area[href], [role="link"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  for (const el of nodes) {
    // isAccTreeEligible returns { eligible, reasons }, not a boolean.
    // Naming rules apply only to elements included in the accessibility tree
    // (ACT c487ae), which excludes focusable aria-hidden content;
    // aria-hidden-focus (ACT 6cfa84) covers that markup instead.
    const eligResult = helpers.isIncludedInAccessibilityTree
      ? helpers.isIncludedInAccessibilityTree(el, ctx)
      : helpers.isAccTreeEligible
        ? helpers.isAccTreeEligible(el, ctx)
        : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    applicableCount += 1;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    const programmaticName = nameInfo && typeof nameInfo.value === 'string' ? nameInfo.value : '';

    const role = el.getAttribute ? el.getAttribute('role') : null;
    const roleNorm = String(role || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    // ARIA 1.2 "Name From: author, contents". Every other known role is
    // name-from-author-only. An unknown role falls back to the implicit role.
    // <generated:aria-name-from-content>
    const NAME_FROM_CONTENT_ROLES = [
      'button',
      'cell',
      'checkbox',
      'columnheader',
      'doc-backlink',
      'doc-biblioref',
      'doc-glossref',
      'doc-noteref',
      'graphics-object',
      'gridcell',
      'heading',
      'link',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'option',
      'radio',
      'row',
      'rowgroup',
      'rowheader',
      'switch',
      'tab',
      'tooltip',
      'treeitem'
    ];
    // </generated:aria-name-from-content>
    const isKnownRoleToken =
      helpers && helpers.aria && typeof helpers.aria.isKnownRole === 'function'
        ? (() => {
            try {
              return !!helpers.aria.isKnownRole(roleNorm);
            } catch {
              return false;
            }
          })()
        : false;
    const isContentNameCandidate =
      !roleNorm || !isKnownRoleToken || NAME_FROM_CONTENT_ROLES.includes(roleNorm);

    const contentName =
      programmaticName.trim().length === 0 && isContentNameCandidate
        ? getConservativeSubtreeText(el)
        : '';

    const finalName = (programmaticName.trim().length ? programmaticName : contentName).trim();

    if (finalName.length === 0) {
      // Only compute the richer eligibility-info payload (used solely for
      // the occurrence's visibilityFilter) once we know an occurrence is
      // actually being built, rather than for every applicable element.
      const eligInfo = helpers.getEligibilityInfo
        ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
        : null;

      const tag = (el.tagName || '').toLowerCase();

      occurrences.push(
        helpers.reportOccurrence(el, {
          // Human fallbacks (allowed)
          summary: 'This link has no accessible name.',
          hint: 'Provide link text or an accessible-name mechanism (for example aria-label) so assistive technologies can identify the link.',

          // Validator requires these keys to exist in the English dictionary
          i18n: {
            summaryKey: 'linkNamePresent_summary_fail',
            hintKey: 'linkNamePresent_hint_fail',
            params: { element: tag }
          },

          data: {
            visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
            details: {
              reasonCode: 'name_missing',
              metrics: {
                programmaticNameLength: programmaticName.trim().length,
                contentNameLength: contentName.trim().length
              },
              refs: { accessibleName: nameInfo || null }
            }
          }
        })
      );
    }
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
