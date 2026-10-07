/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check field-label-listed-source
 * @atomic true
 * @summary Each form field has a label from a source RGAA 11.1.1 lists
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to the form fields of RGAA's glossary entry "Champ de saisie de
 *   formulaire": <input> of any type except submit, reset, button, image and
 *   hidden; <select>; <textarea>; <output>; <progress>; <meter>; and
 *   elements with role progressbar, meter, slider, spinbutton, textbox,
 *   listbox, searchbox, combobox, checkbox, radio or switch. option,
 *   optgroup and datalist are left out: a literal reading would ask for a
 *   label on every option. An element with role="button", and a field
 *   hidden from assistive technologies (aria-hidden, hidden content) are
 *   out of scope. A page with no such field is notApplicable.
 * @expectation
 *   The field meets one of the conditions of RGAA 11.1.1: an aria-labelledby
 *   that points to a passage of text, an aria-label, a <label for> pointing
 *   at it, or a title. The fifth condition (an adjacent button) also needs
 *   one of these as the field's name. A field with none of them fails:
 *   a placeholder, the field's own content (a role="checkbox" named by its
 *   text) and an <output>'s value do not count.
 * @implementation-notes
 * - Asks (cantTell) instead of failing when:
 *   - the only label is a <label> wrapping the field, without for: 11.1.1
 *     names "une balise <label> ayant un attribut for", but the glossary
 *     entry "Étiquette de champ de formulaire" accepts any <label>;
 *   - a <label for> points at a field that cannot be labelled (a
 *     role="textbox" <div>): the condition is met to the letter, but the
 *     label gives the field no accessible name;
 *   - the only source present is empty: an empty aria-label or title, a
 *     <label for> with no text, or an aria-labelledby whose passage has no
 *     text. The attribute is there, as 11.1.1 asks; whether it labels the
 *     field is 11.2.
 * - An aria-labelledby that points to no element in the page counts as
 *   absent.
 * - Opt-in (tag `rgaa`): WCAG accepts a wrapping label, a placeholder and a
 *   name from content, so the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'field-label-listed-source';

const meta = {
  title: 'Form fields have a label from a source RGAA lists',
  description:
    'Checks that each form field has an aria-labelledby, an aria-label, a <label for> or a title, the label sources RGAA 11.1.1 lists.',
  i18n: {
    titleKey: 'fieldLabelListedSource_title',
    descriptionKey: 'fieldLabelListedSource_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'labels', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'understandable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const FIELD_ROLES = [
    'progressbar',
    'meter',
    'slider',
    'spinbutton',
    'textbox',
    'listbox',
    'searchbox',
    'combobox',
    'checkbox',
    'radio',
    'switch'
  ];
  const NOT_FIELD_INPUT_TYPES = ['submit', 'reset', 'button', 'image', 'hidden'];
  const NATIVE_FIELDS = ['select', 'textarea', 'output', 'progress', 'meter'];
  const LABELABLE = ['input', 'select', 'textarea', 'button', 'meter', 'output', 'progress'];

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tagOf(el) {
    return String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  }

  function firstRoleToken(el) {
    return norm(dom.getAttribute(el, 'role')).toLowerCase().split(' ')[0] || '';
  }

  // The field kind, or '' when the element is not an RGAA form field.
  function fieldKind(el) {
    const tag = tagOf(el);
    const role = firstRoleToken(el);
    if (role === 'button') return '';
    if (tag === 'input') {
      const type = norm(dom.getAttribute(el, 'type')).toLowerCase();
      if (NOT_FIELD_INPUT_TYPES.includes(type)) return '';
      return 'input';
    }
    if (NATIVE_FIELDS.includes(tag)) return tag;
    if (FIELD_ROLES.includes(role)) return role;
    return '';
  }

  function isLabelable(el) {
    const tag = tagOf(el);
    if (!LABELABLE.includes(tag)) return false;
    if (tag === 'input') {
      return norm(dom.getAttribute(el, 'type')).toLowerCase() !== 'hidden';
    }
    return true;
  }

  function inAccTree(el) {
    const r = helpers.isIncludedInAccessibilityTree
      ? helpers.isIncludedInAccessibilityTree(el, ctx)
      : helpers.isAccTreeEligible
        ? helpers.isAccTreeEligible(el, ctx)
        : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
  }

  // The field's <label> elements, as core's rules find them
  // (helpers.getAssociatedLabelElements: a for that names it, or a wrapping
  // label it is the first labelable element of), for a field a label can
  // name.
  function associatedLabels(el) {
    if (!isLabelable(el) || typeof helpers.getAssociatedLabelElements !== 'function') return null;
    try {
      return Array.from(helpers.getAssociatedLabelElements(el) || []);
    } catch {
      return null;
    }
  }

  // <label> elements in the field's own tree whose for equals its id. A
  // field a label cannot name is still looked up, so that case is reported
  // apart.
  function labelsFor(el) {
    const shared = associatedLabels(el);
    if (shared) return shared.filter((label) => dom.hasAttribute(label, 'for'));
    const idValue = dom.getAttribute(el, 'id');
    if (!idValue) return [];
    const root = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
    if (!root || !dom.get(root, 'querySelectorAll')) return [];
    const target = dom.get(root, 'getElementById')
      ? dom.getElementById(root, idValue)
      : dom.querySelector(root, '[id="' + idValue.replace(/["\\]/g, '\\$&') + '"]');
    if (target !== el) return [];
    const out = [];
    for (const label of dom.querySelectorAll(root, 'label[for]')) {
      if (dom.getAttribute(label, 'for') === idValue) out.push(label);
    }
    return out;
  }

  // A <label> ancestor without for that labels this field (the first
  // labelable element inside it).
  function wrappingLabel(el) {
    if (!isLabelable(el)) return null;
    const shared = associatedLabels(el);
    if (shared) return shared.find((label) => !dom.hasAttribute(label, 'for')) || null;
    const wrap = dom.get(el, 'closest') ? dom.closest(el, 'label') : null;
    if (!wrap || dom.hasAttribute(wrap, 'for')) return null;
    for (const candidate of dom.querySelectorAll(wrap, LABELABLE.join(', '))) {
      if (isLabelable(candidate)) return candidate === el ? wrap : null;
    }
    return null;
  }

  function labelHasText(label) {
    if (helpers.labelContributesAccessibleName) {
      return !!helpers.labelContributesAccessibleName(label);
    }
    return !!norm(dom.textContent(label));
  }

  // Which 11.1.1 sources the field has: 'met', 'empty' (present, no text)
  // or absent, per source.
  function sources(el) {
    const found = { met: [], empty: [] };

    const labelledby = norm(dom.getAttribute(el, 'aria-labelledby'));
    if (labelledby) {
      const info = helpers.getAriaLabelledByInfo
        ? helpers.getAriaLabelledByInfo(el, ctx)
        : { present: false, value: '', refsCount: 0 };
      if (info && info.present && norm(info.value)) found.met.push('aria-labelledby');
      else if (info && info.refsCount > 0) found.empty.push('aria-labelledby');
    }

    if (dom.hasAttribute(el, 'aria-label')) {
      if (norm(dom.getAttribute(el, 'aria-label'))) found.met.push('aria-label');
      else found.empty.push('aria-label');
    }

    // A <label for> on an element a label cannot name is reported apart.
    const forLabels = labelsFor(el);
    if (forLabels.length && isLabelable(el)) {
      if (forLabels.some(labelHasText)) found.met.push('label-for');
      else found.empty.push('label-for');
    }

    if (dom.hasAttribute(el, 'title')) {
      if (norm(dom.getAttribute(el, 'title'))) found.met.push('title');
      else found.empty.push('title');
    }

    return { found, forLabels };
  }

  // Only checkbox, radio and switch take a name from their content; the
  // text of a textbox or an <output> is its value.
  function hasOwnContent(el, kind) {
    if (kind !== 'checkbox' && kind !== 'radio' && kind !== 'switch') return false;
    if (helpers.getContentNameInfo) {
      const info = helpers.getContentNameInfo(el, ctx);
      return !!(info && info.present && norm(info.value));
    }
    return !!norm(dom.textContent(el));
  }

  const MESSAGES = {
    noLabel: {
      outcome: 'fail',
      summary: 'This form field has no aria-labelledby, aria-label, <label for> or title.',
      hint: 'Give the field a <label for> that matches its id, or an aria-labelledby, aria-label or title attribute.'
    },
    placeholderOnly: {
      outcome: 'fail',
      summary:
        'This form field is labelled only by its placeholder, which RGAA does not accept as a label.',
      hint: 'Give the field a <label for> that matches its id, or an aria-labelledby, aria-label or title attribute. A placeholder disappears as soon as the user types.'
    },
    contentOnly: {
      outcome: 'fail',
      summary:
        'This form field is named only by its own content, which RGAA does not accept as a label.',
      hint: 'Give the field an aria-labelledby that points to the visible text, or an aria-label or title attribute.'
    },
    wrappingLabel: {
      outcome: 'cantTell',
      summary:
        'This form field is labelled only by a <label> that wraps it, without a for attribute.',
      hint: 'RGAA 11.1.1 names a <label> with a for attribute; check whether the audit accepts the wrapping label, or add for and a matching id.',
      needed:
        'Whether the audit accepts a <label> without for, which the RGAA glossary allows and 11.1.1 does not name.'
    },
    labelForNotLabelable: {
      outcome: 'cantTell',
      summary:
        'A <label for> points at this field, but this element cannot be labelled by a <label>.',
      hint: 'The label gives the field no accessible name. Use aria-labelledby pointing to the label text, or a native form field.',
      needed:
        'Whether a <label for> that gives the field no accessible name meets 11.1.1, whose condition it meets to the letter.'
    },
    emptySource: {
      outcome: 'cantTell',
      summary: 'This form field has a {{source}} label source, but it is empty.',
      hint: 'Check whether the field has a label; if not, put the label text in that source.',
      needed:
        'Whether the field has a label elsewhere that 11.1.1 accepts, such as an adjacent button.'
    }
  };

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  const SELECTOR =
    'input, select, textarea, output, progress, meter, ' +
    FIELD_ROLES.map((r) => `[role~="${r}"]`).join(', ');
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(SELECTOR)
    : helpers.queryAll(SELECTOR);

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const kind = fieldKind(el);
    if (!kind) continue;
    if (!inAccTree(el)) continue;
    applicableCount += 1;

    const { found, forLabels } = sources(el);
    if (found.met.length) continue;

    let reasonCode;
    let source = '';
    if (forLabels.length && !isLabelable(el)) {
      reasonCode = 'labelForNotLabelable';
    } else if (found.empty.length) {
      reasonCode = 'emptySource';
      source = found.empty[0];
    } else if (wrappingLabel(el)) {
      reasonCode = 'wrappingLabel';
    } else if (norm(dom.getAttribute(el, 'placeholder'))) {
      reasonCode = 'placeholderOnly';
    } else if (hasOwnContent(el, kind)) {
      reasonCode = 'contentOnly';
    } else {
      reasonCode = 'noLabel';
    }

    const msg = MESSAGES[reasonCode];
    const summary = msg.summary.replace('{{source}}', source);
    const occurrence = helpers.reportOccurrence(el, {
      summary,
      hint: msg.hint,
      i18n: {
        summaryKey: `fieldLabelListedSource_summary_${msg.outcome}_${reasonCode}`,
        hintKey: `fieldLabelListedSource_hint_${msg.outcome}_${reasonCode}`,
        params: source ? { source } : {}
      },
      ...(msg.outcome === 'cantTell'
        ? {
            uncertainty: {
              code: 'judgement-required',
              needed: msg.needed,
              evidence: { field: kind, ...(source ? { source } : {}) }
            }
          }
        : {}),
      data: {
        details: { reasonCode, field: kind, ...(source ? { source } : {}) },
        visibilityFilter: { targetSet: 'acc', accEligible: true, reasons: [] }
      }
    });
    if (msg.outcome === 'fail') failOccurrences.push(occurrence);
    else cantTellOccurrences.push(occurrence);
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
