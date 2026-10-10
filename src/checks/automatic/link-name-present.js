/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-name-present
 * @atomic true
 * @summary Links must have an accessible name
 * @standard WCAG 2.2
 * @sc 2.4.4, 4.1.2
 * @applicability
 *   Applies to <a href>, <area href> and elements whose role attribute
 *   resolves to link (its first token naming a known role, matched in any
 *   case) that are included in the accessibility tree. An <a> without an href is not a link
 *   and is not matched. An <a href>/<area href> whose explicit role is a
 *   known role other than link, a DPUB role inheriting from link, none or
 *   presentation is not a link and is not matched (ACT c487ae, Inapplicable
 *   Example 1).
 * @expectation
 *   The element has a non-empty accessible name. A programmatic name is
 *   taken first (aria-labelledby, aria-label, an associated <label>, title),
 *   and failing that the element falls back to its own subtree text,
 *   counting each descendant's own name (an <img alt>, aria-label or title),
 *   the shape behind the common <a><img alt="..."></a> logo link. The
 *   content fallback is suppressed when an explicit, known role that is not
 *   name-from-content is present (the first known token of the role
 *   fallback list); a role attribute with no known token falls back to the
 *   implicit role.
 * @reports
 *   - `refs.accessibleName`: what the programmatic name lookup found:
 *     `present`, `value`, `mechanism` (the attribute or element the name
 *     would come from, `none` when there is none) and `flags` (notes on
 *     why a source gave no name). `null` when no lookup was made.
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
  tags: ['wcag2a', 'wcag244', 'wcag412', 'navigation', 'atomic', 'automatic', 'links', 'name'],
  wcagSc: ['2.4.4', '4.1.2'],
  // 2.4.4 as well as 4.1.2, as ACT rule c487ae maps it: a link with no name
  // has no purpose to determine, in context or otherwise.
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.4',
      title: 'Link Purpose (In Context)',
      conformanceLevel: 'A'
    },
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
  coverage: { facetsBySc: { '2.4.4': ['link-name-present'], '4.1.2': ['link-name-present'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const occurrences = [];
  // A link whose name may sit in a component no script can read (a closed
  // shadow root): asked about, not failed, since the browser names it from
  // what is inside.
  const questions = [];
  let closedContent;
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
      closedContent = !!(info && Array.isArray(info.flags) && info.flags.includes('closedContent'));
      return info && info.present ? info.value : '';
    }
    const t = container && dom.textContent(container) ? String(dom.textContent(container)) : '';
    return t.replace(/\s+/g, ' ').trim();
  }

  // The resolved explicit role: the first token of the role fallback list
  // naming a known role, lower-cased, or '' when none does.
  function explicitRole(el) {
    try {
      return helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  // link and the DPUB roles that inherit from it (ACT c487ae applies to an
  // "inheriting semantic link").
  const LINK_ROLES = new Set([
    'link',
    'doc-backlink',
    'doc-biblioref',
    'doc-glossref',
    'doc-noteref'
  ]);

  // `[role~="link" i]` also matches role="button link" (a button), so a
  // role-only candidate is kept only when its resolved role is link.
  // An <a href>/<area href> whose explicit role is some other known role is
  // not a link either: <a href role="button"> is ACT c487ae's own
  // inapplicable example, and <a href role="listitem"> is the same case.
  // role="none"/"presentation" stays a candidate, since a focusable element
  // keeps its link role under the conflict resolution handled below.
  const selector = 'a[href], area[href], [role~="link" i]';
  const nodes = (
    helpers.queryAllSmart ? helpers.queryAllSmart(selector) : helpers.queryAll(selector)
  ).filter((el) => {
    const tag = String(dom.localName(el) || '').toLowerCase();
    const role = explicitRole(el);
    if ((tag === 'a' || tag === 'area') && dom.hasAttribute(el, 'href')) {
      return role === '' || role === 'none' || role === 'presentation' || LINK_ROLES.has(role);
    }
    return role === 'link';
  });

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

    let roleNorm = explicitRole(el);
    // WAI-ARIA's presentational-roles conflict resolution: a focusable
    // element keeps its implicit role whatever role="none"/"presentation"
    // says, so <a href="/" role="none">Home</a> is a link named "Home".
    if (roleNorm === 'none' || roleNorm === 'presentation') {
      try {
        const fi = helpers.getFocusableInfo ? helpers.getFocusableInfo(el, ctx) : null;
        if (fi && fi.focusable) roleNorm = '';
      } catch {
        // Not known to be focusable: the explicit role stands.
      }
    }
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

    closedContent = false;
    const contentName =
      programmaticName.trim().length === 0 && isContentNameCandidate
        ? getConservativeSubtreeText(el)
        : '';

    const finalName = (programmaticName.trim().length ? programmaticName : contentName).trim();

    if (finalName.length === 0) {
      if (closedContent) {
        const tagName = (dom.tagName(el) || '').toLowerCase();
        questions.push(
          helpers.reportOccurrence(el, {
            summary:
              'This link may take its name from a component whose content no script can read (a closed shadow root), so whether it has one could not be told.',
            hint: "Check its name in the browser's accessibility tree or with a screen reader; if it has none, give it an aria-label or visible text.",
            i18n: {
              summaryKey: 'linkNamePresent_summary_cantTell_closedContent',
              hintKey: 'linkNamePresent_hint_cantTell_closedContent',
              params: { element: tagName }
            },
            uncertainty: {
              code: 'not-computable',
              needed: 'Whether the component inside gives the link a name.'
            },
            data: { details: { reasonCode: 'name_closedContent' } }
          })
        );
        continue;
      }
      // Only compute the richer eligibility-info payload (used solely for
      // the occurrence's visibilityFilter) once we know an occurrence is
      // actually being built, rather than for every applicable element.
      const eligInfo = helpers.getEligibilityInfo
        ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
        : null;

      const tag = (dom.tagName(el) || '').toLowerCase();

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
  // Tiered only when there is a question, so a plain failure reads as before.
  if (questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(occurrences, questions, rule.defaultSeverity || 'minor')
    };
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
