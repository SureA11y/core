/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check label-for-target-valid
 * @atomic true
 * @summary A <label for> must point to a form field with that id
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <label> elements carrying a for attribute. A page with none
 *   is notApplicable.
 * @expectation
 *   The first element in the label's own tree whose id equals the for value
 *   exists and is labelable: <button>, <input> other than type="hidden",
 *   <meter>, <output>, <progress>, <select>, <textarea>, or a form-associated
 *   custom element (RGAA 11.1.2). A for attribute that matches nothing means
 *   the label labels nothing, not even a field nested inside it, since the
 *   HTML association falls back to the label's content only when for is
 *   absent. A target that is not labelable but has a form-field ARIA role
 *   (textbox, combobox, listbox, searchbox, spinbutton, slider, progressbar,
 *   checkbox, radio, switch, option: the roles the RGAA glossary "Champ de
 *   saisie de formulaire" counts as fields) passes: 11.1.2 asks only that
 *   the field has an id equal to the for value. HTML does not let such a
 *   label name the field, and that missing name belongs to 11.1.1, not
 *   here.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): a label pointing nowhere is not in itself a WCAG
 *   failure (the field may be named another way, which
 *   form-control-programmatic-label-present checks), so the rule runs only
 *   under the rgaa-4.1.2 profile, the `rgaa` tag or its own id.
 * - Ids resolve in the label's own tree, so a label inside a shadow root
 *   looks for its field in that shadow root.
 */

const id = 'label-for-target-valid';

const meta = {
  title: 'Labels point to a form field',
  description:
    'Checks that the for attribute of each <label> matches the id of a form field it can label.',
  i18n: {
    titleKey: 'labelForTargetValid_title',
    descriptionKey: 'labelForTargetValid_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'labels', 'atomic', 'automatic'],
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
  const { document, window, helpers, rule } = ctx;

  const LABELABLE = ['button', 'meter', 'output', 'progress', 'select', 'textarea'];
  // Roles the RGAA glossary "Champ de saisie de formulaire" counts as fields.
  const FIELD_ROLES = [
    'progressbar',
    'slider',
    'spinbutton',
    'textbox',
    'listbox',
    'searchbox',
    'combobox',
    'option',
    'checkbox',
    'radio',
    'switch'
  ];

  function hasFieldRole(el) {
    return FIELD_ROLES.includes(helpers.aria.getExplicitRole(el));
  }

  function isLabelable(el) {
    const tag = String(dom.tagName(el) || '').toLowerCase();
    if (LABELABLE.includes(tag)) return true;
    if (tag === 'input')
      return String(dom.getAttribute(el, 'type') || '').toLowerCase() !== 'hidden';
    if (tag.includes('-')) {
      try {
        const definition = window && window.customElements && window.customElements.get(tag);
        return !!(definition && definition.formAssociated === true);
      } catch {
        return false;
      }
    }
    return false;
  }

  function targetOf(label, value) {
    let root = document;
    try {
      const r = dom.getRootNode(label);
      if (r && typeof dom.get(r, 'getElementById') === 'function') root = r;
    } catch {
      // keep the document
    }
    return dom.getElementById(root, value);
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('label[for]')
    : helpers.queryAll('label[for]');

  const occurrences = [];
  let applicableCount = 0;

  for (const label of nodes) {
    if (!label || !dom.get(label, 'getAttribute')) continue;
    applicableCount += 1;

    const value = String(dom.getAttribute(label, 'for'));
    let reasonCode = null;
    let target = null;
    if (!value) {
      reasonCode = 'emptyFor';
    } else {
      target = targetOf(label, value);
      if (!target) reasonCode = 'missingTarget';
      else if (!isLabelable(target) && !hasFieldRole(target)) reasonCode = 'notLabelable';
    }
    if (!reasonCode) continue;

    const element = target ? String(dom.tagName(target)).toLowerCase() : '';
    const summaries = {
      emptyFor: {
        text: 'This label has an empty for attribute, so it labels no field.',
        key: 'labelForTargetValid_summary_fail_empty'
      },
      missingTarget: {
        text: `This label points to id "${value}", which no element in its tree has.`,
        key: 'labelForTargetValid_summary_fail_missing'
      },
      notLabelable: {
        text: `This label points to id "${value}", which belongs to a <${element}>, not a form field.`,
        key: 'labelForTargetValid_summary_fail_notLabelable'
      }
    };

    occurrences.push(
      helpers.reportOccurrence(label, {
        summary: summaries[reasonCode].text,
        hint: 'Set the for attribute to the id of the field this label names, or remove it and put the field inside the label.',
        i18n: {
          summaryKey: summaries[reasonCode].key,
          hintKey: 'labelForTargetValid_hint_fail',
          params: { value, element }
        },
        data: {
          details: { reasonCode, value, target: element || null },
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
