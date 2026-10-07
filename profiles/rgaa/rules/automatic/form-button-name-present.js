/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check form-button-name-present
 * @atomic true
 * @summary Each button in a form has a label
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to the buttons of RGAA's glossary entry "Bouton (formulaire)"
 *   (<button>, <input> of type submit, reset, button or image, and
 *   role="button") that sit inside a form: a <form> element or an element
 *   with role="form" (glossary "Formulaire"). RGAA 11.9.1 step 1 covers
 *   « les boutons présents au sein d'un formulaire », so a button outside
 *   any form is out of scope. A button hidden from assistive technologies,
 *   or whose explicit role is another one (role="tab", role="none"), is out
 *   of scope too. A page with no such button is notApplicable.
 * @expectation
 *   The button has a label: an aria-labelledby passage, an aria-label, the
 *   alt of an image button, the value of an <input> button, the content of
 *   a <button> or role="button" element (an image's alt, an <svg>'s
 *   <title> and the like count), or a title. A button with none of them
 *   has no label to be relevant, and fails 11.9.1 step 2. A submit or
 *   reset <input> with no value shows the browser's own label ("Submit",
 *   "Reset") and passes; whether the label is relevant is left to a
 *   person, as the rest of 11.9.1 is.
 * @implementation-notes
 * - Asks (cantTell) about a button outside the form element that joins a
 *   form through its form attribute: it submits the form, but is not
 *   « au sein » of it.
 * - Asks (cantTell) about an <input type="image"> with no alt,
 *   aria-label, aria-labelledby or title: the browser names it with a
 *   generic "Submit", which is not one of the label sources the glossary
 *   lists. The missing alt itself fails 1.1.3 through input-image-alt-present.
 * - Opt-in (tag `rgaa`): WCAG 4.1.2 requires a name on every button, which
 *   button-name-present checks; this rule reports only the buttons 11.9.1
 *   covers, so it runs only under the rgaa-4.1.2 profile, the `rgaa` tag or
 *   its own id.
 */

const id = 'form-button-name-present';

const meta = {
  title: 'Buttons in a form have a label',
  description:
    'Checks that each button inside a form (a <form> or role="form") has a label that RGAA 11.9.1 can judge.',
  i18n: {
    titleKey: 'formButtonNamePresent_title',
    descriptionKey: 'formButtonNamePresent_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'forms', 'buttons', 'name', 'atomic', 'automatic'],
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

  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tagOf(el) {
    return String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  }

  function inAccTree(el) {
    const r = helpers.isIncludedInAccessibilityTree
      ? helpers.isIncludedInAccessibilityTree(el, ctx)
      : helpers.isAccTreeEligible
        ? helpers.isAccTreeEligible(el, ctx)
        : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
  }

  function parentOf(node) {
    if (helpers.composedParent) return helpers.composedParent(node);
    return dom.parentNode(node) && dom.host(dom.parentNode(node))
      ? dom.host(dom.parentNode(node))
      : dom.parentNode(node);
  }

  // The nearest <form> or role="form" ancestor, across shadow roots.
  function formAncestor(el) {
    for (let p = parentOf(el); p && dom.nodeType(p) === 1; p = parentOf(p)) {
      if (tagOf(p) === 'form') return p;
      const role = norm(dom.getAttribute(p, 'role')).toLowerCase().split(' ')[0];
      if (role === 'form') return p;
    }
    return null;
  }

  // A form the button joins through its form attribute.
  function formByAttribute(el) {
    const formId = dom.getAttribute(el, 'form');
    if (!formId) return null;
    const root = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
    const target =
      root && dom.get(root, 'getElementById') ? dom.getElementById(root, formId) : null;
    return target && tagOf(target) === 'form' ? target : null;
  }

  function inputType(el) {
    return norm(dom.getAttribute(el, 'type')).toLowerCase();
  }

  function isButton(el) {
    const tag = tagOf(el);
    const role = norm(dom.getAttribute(el, 'role')).toLowerCase().split(' ')[0];
    if (role === 'button') return true;
    if (role) return false;
    if (tag === 'button') return true;
    if (tag === 'input') return ['submit', 'reset', 'button', 'image'].includes(inputType(el));
    return false;
  }

  // The button's label, from the sources the glossary lists, or '' when it
  // has none. `defaulted` is set when only the browser supplies one.
  function labelOf(el) {
    const tag = tagOf(el);
    const info = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    const programmatic = norm(info && info.present ? info.value : '');
    if (programmatic) return { label: programmatic, source: info.mechanism || 'programmatic' };

    if (tag === 'input') {
      const type = inputType(el);
      if (type === 'image') {
        const alt = norm(dom.getAttribute(el, 'alt'));
        if (alt) return { label: alt, source: 'alt' };
        return { label: '', source: '', defaulted: true };
      }
      const value = norm(dom.getAttribute(el, 'value'));
      if (value) return { label: value, source: 'value' };
      if (type === 'submit') return { label: 'Submit', source: 'default' };
      if (type === 'reset') return { label: 'Reset', source: 'default' };
      return { label: '', source: '' };
    }

    if (helpers.getContentNameInfo) {
      const content = helpers.getContentNameInfo(el, ctx);
      const text = norm(content && content.present ? content.value : '');
      if (text) return { label: text, source: 'content' };
    } else if (norm(dom.textContent(el))) {
      return { label: norm(dom.textContent(el)), source: 'content' };
    }
    return { label: '', source: '' };
  }

  const MESSAGES = {
    nameMissing: {
      outcome: 'fail',
      summary: 'This button in a form has no label.',
      hint: 'Give the button visible text that describes its action, or an aria-label, aria-labelledby or title; for an image button, an alt.'
    },
    imageButtonNoAlt: {
      outcome: 'cantTell',
      summary:
        'This image button in a form has no alt, aria-label, aria-labelledby or title; the browser names it with a generic "Submit".',
      hint: 'Give the image button an alt that describes its action, then check that the label is relevant.',
      needed: "Whether the browser's generic name describes what the image button does."
    },
    formAttributeOnly: {
      outcome: 'cantTell',
      summary:
        'This button has no label and sits outside the form it submits, which it joins through its form attribute.',
      hint: 'Check whether the audit counts this button as part of the form. In any case, give it a label that describes its action.',
      needed:
        'Whether a button joined to a form by its form attribute counts as a button of that form.'
    }
  };

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  const SELECTOR =
    'button, input[type="submit" i], input[type="reset" i], input[type="button" i], input[type="image" i], [role~="button"]';
  let nodes;
  try {
    nodes = helpers.queryAllSmart ? helpers.queryAllSmart(SELECTOR) : helpers.queryAll(SELECTOR);
  } catch {
    const plain =
      'button, input[type="submit"], input[type="reset"], input[type="button"], input[type="image"], [role~="button"]';
    nodes = helpers.queryAllSmart ? helpers.queryAllSmart(plain) : helpers.queryAll(plain);
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!isButton(el)) continue;
    const inside = formAncestor(el);
    const joined = inside ? null : formByAttribute(el);
    if (!inside && !joined) continue;
    if (!inAccTree(el)) continue;
    applicableCount += 1;

    const { label, defaulted } = labelOf(el);
    if (label) continue;

    const reasonCode = !inside
      ? 'formAttributeOnly'
      : defaulted
        ? 'imageButtonNoAlt'
        : 'nameMissing';
    const msg = MESSAGES[reasonCode];
    const occurrence = helpers.reportOccurrence(el, {
      summary: msg.summary,
      hint: msg.hint,
      i18n: {
        summaryKey: `formButtonNamePresent_summary_${msg.outcome}_${reasonCode}`,
        hintKey: `formButtonNamePresent_hint_${msg.outcome}_${reasonCode}`,
        params: {}
      },
      ...(msg.outcome === 'cantTell'
        ? {
            uncertainty: {
              code: 'judgement-required',
              needed: msg.needed,
              evidence: { element: tagOf(el) }
            }
          }
        : {}),
      data: {
        details: { reasonCode, element: tagOf(el) },
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
