/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check frame-title-not-empty
 * @atomic true
 * @summary A frame's title attribute must not be empty
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to every <iframe> and <frame> in the scan scope that has a
 *   title attribute and is not hidden from assistive technologies by
 *   aria-hidden="true", on itself or on an ancestor (RGAA glossary "Titre
 *   de cadre", note 2). Frames hidden by the default hidden-content policy
 *   are not checked. A frame with no title attribute is left to
 *   frame-title-attribute-present (2.1.1). A page with no applicable frame
 *   is notApplicable.
 * @expectation
 *   The title is not empty and not only whitespace. RGAA 2.2.1 asks whether
 *   the content of the title attribute is relevant, and an empty one says
 *   nothing about the frame. That is all this rule decides: whether a
 *   non-empty title is relevant is for a person.
 * @implementation-notes
 * - iframe-name-present (WCAG 4.1.2) passes a frame with title="" and an
 *   aria-label, since the frame still has a name. RGAA 2.2.1 judges the
 *   title attribute alone, so this rule reports it.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'frame-title-not-empty';

const meta = {
  title: 'Frame titles are not empty',
  description:
    'Checks that the title attribute of every <iframe> and <frame> that has one is not empty.',
  i18n: {
    titleKey: 'frameTitleNotEmpty_title',
    descriptionKey: 'frameTitleNotEmpty_description'
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
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe[title], frame[title]')
    : helpers.queryAll('iframe[title], frame[title]');

  // aria-hidden="true" on the frame or on an ancestor, across shadow roots.
  function isAriaHidden(el) {
    for (let n = el; n; n = helpers.composedParent ? helpers.composedParent(n) : n.parentNode) {
      if (!n.getAttribute) continue;
      const v = n.getAttribute('aria-hidden');
      if (v != null && String(v).trim().toLowerCase() === 'true') return true;
    }
    return false;
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.tagName) continue;
    if (isAriaHidden(el)) continue;
    applicableCount += 1;
    if (/[^ \t\n\f\r]/.test(String(el.getAttribute('title') || ''))) continue;

    const element = String(el.tagName).toLowerCase();
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This <${element}> has an empty title attribute.`,
        hint: 'Write in the title what the frame contains, for example the name of the map or video it shows.',
        i18n: {
          summaryKey: 'frameTitleNotEmpty_summary_fail',
          hintKey: 'frameTitleNotEmpty_hint_fail',
          params: { element }
        },
        data: {
          details: { reasonCode: 'emptyTitle', element },
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
