/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check field-group-legend
 * @atomic true
 * @summary A group of form fields should have a legend
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <fieldset> elements and elements with role="group" or
 *   role="radiogroup" that contain at least one form field (input other
 *   than hidden, select, textarea, or an element with a form field role).
 *   A page with none is notApplicable. When every group has a legend (or,
 *   for an ARIA group, an aria-label or aria-labelledby), the rule passes:
 *   11.6.1 asks that one exists, and whether it is relevant is 11.7's
 *   question.
 * @expectation
 *   RGAA 11.6.1 step 2: a <fieldset> has a <legend> child with text; an
 *   element with role="group" or role="radiogroup" has an aria-label or an
 *   aria-labelledby that resolves to text. A fieldset that itself carries
 *   role="group" or role="radiogroup" may use either. aria-label on a plain
 *   fieldset, and title on a group, do not count: step 2 names only those
 *   mechanisms. A group without one is flagged for a person to decide
 *   whether it groups fields of the same kind, which is when RGAA 11.6.1
 *   requires a legend, and, if so, whether every field instead carries a
 *   title, aria-label, aria-labelledby or aria-describedby that names the
 *   group (step 3).
 * @implementation-notes
 * - Manual (cantTell): a fieldset can group unrelated fields for layout,
 *   and a toolbar can use role="group". Only a person can tell.
 * - Step 3 is not decided here: whether a field's title or aria-label
 *   "permet de déterminer l'appartenance du champ au groupement" is a
 *   judgment, and most fields carry an aria-label or title for their own
 *   name. So a group whose fields all carry one of those attributes is
 *   still asked about.
 * - Opt-in (tag `rgaa`): WCAG does not require a legend on every group.
 */

const id = 'field-group-legend';

const meta = {
  title: 'Groups of form fields have a legend',
  description:
    'Flags a <fieldset> without a legend, or a role="group" or role="radiogroup" without aria-label or aria-labelledby, holding form fields, for a person to decide whether it groups fields of the same kind.',
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

  // Filtered below by the first role token.
  const groups = helpers.queryAllSmart
    ? helpers.queryAllSmart('fieldset, [role]')
    : helpers.queryAll('fieldset, [role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const group of groups) {
    if (!group || !group.getAttribute) continue;
    const isFieldset = String(group.tagName).toLowerCase() === 'fieldset';
    const role = firstRole(group);
    const isAriaGroup = role === 'group' || role === 'radiogroup';
    // A fieldset given another role (say role="presentation") is not a group.
    if (isFieldset ? role && !isAriaGroup : !isAriaGroup) continue;
    if (!group.querySelector(FIELDS)) continue;
    applicableCount += 1;

    // RGAA 11.6.1 step 2: a legend for a fieldset, aria-label or
    // aria-labelledby for role="group"/"radiogroup".
    if (isAriaGroup && hasAriaName(group)) continue;
    if (isFieldset) {
      const legend = Array.from(group.children).find(
        (c) => String(c.tagName).toLowerCase() === 'legend'
      );
      if (legend && hasText(legend.textContent)) continue;
    }

    const element = isFieldset ? 'fieldset' : `role="${role}"`;
    occurrences.push(
      helpers.reportOccurrence(group, {
        summary: isFieldset
          ? 'This fieldset groups form fields but has no legend.'
          : `This role="${role}" element groups form fields but has no aria-label or aria-labelledby.`,
        hint: 'If the fields are of the same kind (an address, a date, a set of choices), give the group a legend: a <legend> for a fieldset, aria-label or aria-labelledby for role="group" or role="radiogroup". Otherwise check that each field has a title, aria-label, aria-labelledby or aria-describedby that names the group.',
        i18n: {
          summaryKey: isFieldset
            ? 'fieldGroupLegend_summary_cantTell_fieldset'
            : 'fieldGroupLegend_summary_cantTell_group',
          hintKey: 'fieldGroupLegend_hint_cantTell',
          params: { role }
        },
        data: {
          details: { reasonCode: 'groupWithoutLegend', element },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
