/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-valid-attr
 * @atomic true
 * @summary Every aria-* attribute present must be a real, defined ARIA attribute
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to any element in the composed DOM that carries at least one
 *   attribute whose name starts with "aria-".
 * @expectation
 *   Each aria-* attribute name is a real attribute defined by the WAI-ARIA
 *   specification (catches typos / made-up attribute names, which are
 *   silently ignored by assistive technology and therefore a real,
 *   deterministic defect).
 *   Reported at CANTTELL rather than FAIL: an aria-* attribute the spec
 *   does not define is inert, so nothing about the element's exposed name,
 *   role or value changes because it is there. Where the author meant a real
 *   attribute and the element ends up without a name, that absence is the
 *   naming rules' decision, not this one's. ACT 5f99a7 maps 1.3.1/4.1.2 as
 *   secondary requirements, "less strict" than the rule itself.
 * @reports
 *   - `attr`: the aria-* attribute name that WAI-ARIA does not define.
 * @reason-codes
 *   - `ARIA_ATTR_INVALID` (cantTell): an aria-* attribute name that WAI-ARIA
 *     does not define, such as a typo, which assistive technology ignores.
 *     It leans fail when it misspells aria-label or aria-labelledby on an
 *     element whose role needs a name and that has none; pass when the
 *     correctly spelled attribute is there too, or when the name is near no
 *     ARIA attribute (a data hook such as aria-qa).
 *     Basis: WAI-ARIA 1.2 states and properties; ACT 5f99a7; WCAG 4.1.2 (not
 *     settled).
 * @implementation-notes
 * - Distinct from aria-valid-attr-value (which validates the VALUE
 *   of a recognized attribute), this rule only validates the attribute
 *   NAME.
 * - Not rule-gated on isAccTreeEligible: this remains a static-markup
 *   property, while engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 */

const id = 'aria-valid-attr';

const meta = {
  title: 'aria-* attributes must be real, defined ARIA attributes',
  description:
    'Checks that every aria-* attribute name present in the DOM is a real attribute defined by the WAI-ARIA specification.',
  i18n: {
    titleKey: 'ariaValidAttr_title',
    descriptionKey: 'ariaValidAttr_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
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
  coverage: { facetsBySc: { '4.1.2': ['aria-attr-name-valid'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('*') : helpers.queryAll('*');

  const occurrences = [];
  let applicableCount = 0;

  // The WAI-ARIA 1.2 attributes, and the braille ones from 1.3, without
  // their aria- prefix.
  const ARIA_ATTRS = [
    'activedescendant',
    'atomic',
    'autocomplete',
    'braillelabel',
    'brailleroledescription',
    'busy',
    'checked',
    'colcount',
    'colindex',
    'colindextext',
    'colspan',
    'controls',
    'current',
    'describedby',
    'description',
    'details',
    'disabled',
    'dropeffect',
    'errormessage',
    'expanded',
    'flowto',
    'grabbed',
    'haspopup',
    'hidden',
    'invalid',
    'keyshortcuts',
    'label',
    'labelledby',
    'level',
    'live',
    'modal',
    'multiline',
    'multiselectable',
    'orientation',
    'owns',
    'placeholder',
    'posinset',
    'pressed',
    'readonly',
    'relevant',
    'required',
    'roledescription',
    'rowcount',
    'rowindex',
    'rowindextext',
    'rowspan',
    'selected',
    'setsize',
    'sort',
    'valuemax',
    'valuemin',
    'valuenow',
    'valuetext'
  ];
  // Roles WAI-ARIA 1.2 marks "Name required" (DPUB and graphics roles
  // left out).
  const NAME_REQUIRED_ROLES = new Set([
    'alertdialog',
    'application',
    'button',
    'checkbox',
    'columnheader',
    'combobox',
    'dialog',
    'grid',
    'heading',
    'img',
    'link',
    'listbox',
    'marquee',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'meter',
    'option',
    'progressbar',
    'radio',
    'radiogroup',
    'region',
    'rowheader',
    'searchbox',
    'slider',
    'spinbutton',
    'switch',
    'table',
    'tabpanel',
    'textbox',
    'tooltip',
    'tree',
    'treegrid',
    'treeitem'
  ]);

  // Edits (insert, delete, replace, or swap two neighbours) from a to b.
  function editDistance(a, b) {
    const d = [];
    for (let i = 0; i <= a.length; i++) {
      d.push([i]);
      for (let j = 1; j <= b.length; j++) {
        if (i === 0) {
          d[0].push(j);
          continue;
        }
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
          v = Math.min(v, d[i - 2][j - 2] + 1);
        d[i].push(v);
      }
    }
    return d[a.length][b.length];
  }

  // Which way an unknown aria-* name points. A misspelling of a real
  // attribute (one edit away for a name of up to five letters after aria-,
  // two for a longer one) shows intent: it costs nothing when the element
  // also has the real attribute, and costs a name when it misspells a naming
  // attribute on an element whose role needs a name and has none. A name
  // near no attribute, and neither containing one nor contained in one,
  // reads as a data hook.
  function leanFor(el, name) {
    const suffix = name.slice(5);
    let nearest = '';
    let nearestDistance = Infinity;
    let related = false;
    for (const a of ARIA_ATTRS) {
      const d = editDistance(suffix, a);
      if (d < nearestDistance) {
        nearest = a;
        nearestDistance = d;
      }
      if (suffix && (a.includes(suffix) || suffix.includes(a))) related = true;
    }
    const limit = suffix.length <= 5 ? 1 : 2;
    if (nearestDistance <= limit) {
      const real = 'aria-' + nearest;
      const signals = [{ signal: 'nearest-valid-attr', value: real }];
      if (dom.hasAttribute(el, real)) {
        signals.push({ signal: 'valid-attr-present', value: true });
        return {
          toward: 'pass',
          why: 'The element also has the correctly spelled attribute, so the misspelled one costs nothing.',
          signals,
          i18n: { whyKey: 'ariaValidAttr_lean_why_realPresent' }
        };
      }
      if (nearest !== 'label' && nearest !== 'labelledby') return null;
      let role;
      let hasName;
      try {
        role = String((helpers.getRoleInfo(el, ctx) || {}).role || '').toLowerCase();
        const info = helpers.getAccessibleNameInfo(el, ctx);
        hasName = !!(info && String(info.value || '').trim());
      } catch {
        return null;
      }
      if (!NAME_REQUIRED_ROLES.has(role) || hasName) return null;
      signals.push(
        { signal: 'role', value: role },
        { signal: 'accessible-name-empty', value: true }
      );
      return {
        toward: 'fail',
        why: 'The attribute misspells a naming attribute, and the element, whose role needs a name, has none.',
        signals,
        i18n: { whyKey: 'ariaValidAttr_lean_why_lostName' }
      };
    }
    if (nearestDistance < 4 || related) return null;
    return {
      toward: 'pass',
      why: 'The name is close to no ARIA attribute, so it reads as a hook for scripts or tests, not a misspelling.',
      signals: [
        { signal: 'nearest-valid-attr', value: 'aria-' + nearest },
        { signal: 'edit-distance', value: nearestDistance }
      ],
      caution: 'The author may still have meant it for assistive technology.',
      i18n: {
        whyKey: 'ariaValidAttr_lean_why_dataHook',
        cautionKey: 'ariaValidAttr_lean_caution_dataHook'
      }
    };
  }

  for (const el of nodes) {
    if (!el || !dom.attributes(el)) continue;

    let invalidNames = null;
    const attrs = dom.attributes(el);
    for (let i = 0; i < attrs.length; i++) {
      const name = String(attrs[i].name || '').toLowerCase();
      if (name.slice(0, 5) !== 'aria-') continue;

      applicableCount += 1;

      if (!ariaHelpers.isValidAriaAttrName(name)) {
        if (!invalidNames) invalidNames = [];
        invalidNames.push(name);
      }
    }

    if (!invalidNames || !invalidNames.length) continue;

    for (const name of invalidNames) {
      const lean = leanFor(el, name);
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: 'This element has an attribute that is not a recognized ARIA attribute.',
          hint: 'Fix the attribute name if it is a typo, or remove it.',
          i18n: {
            summaryKey: 'ariaValidAttr_summary_fail',
            hintKey: 'ariaValidAttr_hint_fail',
            params: { attr: name }
          },
          uncertainty: {
            code: 'spec-only',
            needed:
              'Whether the misspelling cost the element a name or state it has no other source for.',
            evidence: { attribute: name, definedInAria: false, exposedEffect: 'none' }
          },
          ...(lean ? { lean } : {}),
          data: {
            details: { reasonCode: 'ARIA_ATTR_INVALID', attr: name }
          }
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome([], occurrences, rule.defaultSeverity || 'serious');
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
