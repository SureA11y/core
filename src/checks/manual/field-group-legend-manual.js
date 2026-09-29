/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check field-group-legend
 * @atomic true
 * @summary A group of form fields should have a legend
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <fieldset> elements and elements with role="group" that
 *   contain at least one form field (input other than hidden, select,
 *   textarea, or an element with a form field role). A page with none is
 *   notApplicable.
 * @expectation
 *   A <fieldset> has a <legend> child with text, or an aria-label or
 *   aria-labelledby giving it a name; a role="group" element has an
 *   aria-label, aria-labelledby or title. One without is flagged for a
 *   person to decide whether it groups fields of the same kind, which is
 *   when RGAA 11.6.1 requires a legend.
 * @implementation-notes
 * - Manual (cantTell): a fieldset can group unrelated fields for layout,
 *   and a toolbar can use role="group". Only a person can tell.
 * - role="radiogroup" without a name is left to aria-role-name-present.
 * - Opt-in (tag `rgaa`): WCAG does not require a legend on every group.
 */

const id = 'field-group-legend';

const meta = {
  title: 'Groups of form fields have a legend',
  description:
    'Flags a <fieldset> or role="group" holding form fields that has no legend or name, for a person to decide whether it groups fields of the same kind.',
  i18n: {
    titleKey: 'fieldGroupLegend_title',
    descriptionKey: 'fieldGroupLegend_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const FIELDS =
    'input:not([type="hidden" i]), select, textarea, [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"], [role="listbox"], [role="spinbutton"], [role="slider"], [role="switch"], [role="searchbox"]';

  function hasText(v) {
    return v != null && String(v).trim() !== '';
  }

  function firstRole(el) {
    return String(el.getAttribute('role') || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)[0];
  }

  function labelledbyText(el) {
    const ids = String(el.getAttribute('aria-labelledby') || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const root = el.getRootNode ? el.getRootNode() : el.ownerDocument;
    return ids
      .map((i) => {
        const target = root && root.getElementById ? root.getElementById(i) : null;
        return target ? target.textContent : '';
      })
      .join(' ');
  }

  function hasAriaName(el) {
    return hasText(el.getAttribute('aria-label')) || hasText(labelledbyText(el));
  }

  const groups = helpers.queryAllSmart
    ? helpers.queryAllSmart('fieldset, [role="group"]')
    : helpers.queryAll('fieldset, [role="group"]');

  const occurrences = [];
  let applicableCount = 0;

  for (const group of groups) {
    if (!group || !group.getAttribute) continue;
    const isFieldset = String(group.tagName).toLowerCase() === 'fieldset';
    const role = firstRole(group);
    // A fieldset given another role (say role="presentation") is not a group.
    if (isFieldset && role && role !== 'group') continue;
    if (!group.querySelector(FIELDS)) continue;
    applicableCount += 1;

    if (hasAriaName(group)) continue;
    if (isFieldset) {
      const legend = Array.from(group.children).find(
        (c) => String(c.tagName).toLowerCase() === 'legend'
      );
      if (legend && hasText(legend.textContent)) continue;
    } else if (hasText(group.getAttribute('title'))) {
      continue;
    }

    const element = isFieldset ? 'fieldset' : 'role="group"';
    occurrences.push(
      helpers.reportOccurrence(group, {
        summary: isFieldset
          ? 'This fieldset groups form fields but has no legend.'
          : 'This role="group" element groups form fields but has no name.',
        hint: 'If the fields are of the same kind (an address, a date, a set of choices), give the group a legend: a <legend> for a fieldset, aria-label or aria-labelledby for role="group".',
        i18n: {
          summaryKey: isFieldset
            ? 'fieldGroupLegend_summary_cantTell_fieldset'
            : 'fieldGroupLegend_summary_cantTell_group',
          hintKey: 'fieldGroupLegend_hint_cantTell',
          params: {}
        },
        data: {
          details: { reasonCode: 'groupWithoutLegend', element },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0 || !occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
